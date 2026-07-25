-- ============================================================
-- Miriboarding: 온보딩 기능 스키마
-- company_onboarding / student_enrollment / student_progress /
-- mission_submission / jobs_library / job_schedules_template
--
-- 사용법: Supabase 대시보드 > SQL Editor에 전체를 붙여넣고 실행한다.
-- students / companies 테이블(및 그 id가 auth.users.id와 동일하다는 전제)은
-- feature/api-auth에서 이미 생성되어 있다고 가정한다.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. jobs_library: 직무 라이브러리 (기준 데이터, 5개 직무 시드)
-- ------------------------------------------------------------
create table if not exists public.jobs_library (
  id uuid primary key default gen_random_uuid(),
  job_title text not null unique,
  description text,
  created_at timestamptz not null default now()
);

insert into public.jobs_library (job_title, description) values
  ('백엔드개발', '서버, API, 데이터베이스 설계 및 구현을 담당하는 직무'),
  ('프론트엔드개발', '웹/앱 사용자 화면(UI)을 개발하는 직무'),
  ('물류관리', '입출고, 재고, 배송 등 물류 프로세스를 관리하는 직무'),
  ('데이터분석', '데이터 수집·분석을 통해 비즈니스 인사이트를 도출하는 직무'),
  ('금융시스템', '금융 서비스의 시스템 개발 및 운영을 담당하는 직무')
on conflict (job_title) do nothing;

-- ------------------------------------------------------------
-- 2. job_schedules_template: 직무별 기본 온보딩 일정 템플릿
--    company_onboarding.schedules와 동일하게 { day, week, month } 형태의
--    단일 jsonb 컬럼으로 통일했다(두 테이블 간 파싱 로직을 공유하기 위함).
-- ------------------------------------------------------------
create table if not exists public.job_schedules_template (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs_library(id) on delete cascade,
  schedules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_id)
);

-- ------------------------------------------------------------
-- 3. company_onboarding: 회사별 온보딩 계획 (Gemini 생성 결과 저장)
--    missions 컬럼은 요청 스펙 테이블 목록에는 없었지만, generate/조회/수정
--    API가 미션 목록을 항상 함께 다루므로 schedules와 같은 방식(jsonb 배열)
--    으로 추가했다. 각 미션 객체는 { id, title, description, order } 형태.
-- ------------------------------------------------------------
create table if not exists public.company_onboarding (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_title text not null,
  schedules jsonb not null default '{}'::jsonb,
  missions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

-- ------------------------------------------------------------
-- 4. student_enrollment: 학생-회사 등록(매칭) 관계
-- ------------------------------------------------------------
create table if not exists public.student_enrollment (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, company_id)
);

-- ------------------------------------------------------------
-- 5. student_progress: 학생별 온보딩 진행률 (enrollment 1건당 1행)
-- ------------------------------------------------------------
create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.student_enrollment(id) on delete cascade,
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (enrollment_id)
);

-- ------------------------------------------------------------
-- 6. mission_submission: 미션 제출 내역
--    mission_id는 company_onboarding.missions(jsonb 배열) 안의 개별 미션
--    id를 가리킨다. jsonb 내부 값이라 FK 제약은 걸 수 없어 애플리케이션
--    레이어(onboarding.service.js)에서 존재 여부를 검증한다.
-- ------------------------------------------------------------
create table if not exists public.mission_submission (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.student_enrollment(id) on delete cascade,
  mission_id uuid not null,
  content text,
  submitted_at timestamptz not null default now(),
  feedback text
);

create index if not exists idx_student_enrollment_student on public.student_enrollment(student_id);
create index if not exists idx_student_enrollment_company on public.student_enrollment(company_id);
create index if not exists idx_student_progress_enrollment on public.student_progress(enrollment_id);
create index if not exists idx_mission_submission_enrollment on public.mission_submission(enrollment_id);
create index if not exists idx_job_schedules_template_job on public.job_schedules_template(job_id);

-- ============================================================
-- RLS 정책
--
-- 아래 정책은 모두 SELECT(조회) 전용이다. 서버(server/)는 지금까지와 동일하게
-- service role 키(supabaseAdmin, RLS 우회)로만 이 테이블들에 쓰기 때문에,
-- INSERT/UPDATE/DELETE 정책은 별도로 두지 않았다. 프론트엔드에서 anon 키로
-- 직접 이 테이블에 쓰기를 시도하면 RLS에 막혀 실패하는 것이 의도된 동작이다.
-- ============================================================

-- jobs_library / job_schedules_template: 공개 기준 데이터, 로그인 사용자는 조회만 가능
alter table public.jobs_library enable row level security;
create policy "jobs_library_select_authenticated"
  on public.jobs_library for select
  to authenticated
  using (true);

alter table public.job_schedules_template enable row level security;
create policy "job_schedules_template_select_authenticated"
  on public.job_schedules_template for select
  to authenticated
  using (true);

-- company_onboarding: 회사는 자기 데이터만 조회 가능.
-- 요청 스펙에는 없었지만, 등록된 학생이 자신의 온보딩 계획을 볼 수 있어야
-- 실제로 쓸모가 있으므로 student_enrollment 기준 조회 정책도 함께 추가했다.
-- 필요 없다면 두 번째 정책(company_onboarding_select_enrolled_student)만
-- 제거하면 된다.
alter table public.company_onboarding enable row level security;

create policy "company_onboarding_select_own_company"
  on public.company_onboarding for select
  to authenticated
  using (company_id = auth.uid());

create policy "company_onboarding_select_enrolled_student"
  on public.company_onboarding for select
  to authenticated
  using (
    exists (
      select 1 from public.student_enrollment se
      where se.company_id = company_onboarding.company_id
        and se.student_id = auth.uid()
    )
  );

-- student_enrollment: 학생/회사 모두 자신과 관련된 등록 정보만 조회 가능
alter table public.student_enrollment enable row level security;

create policy "student_enrollment_select_own_student"
  on public.student_enrollment for select
  to authenticated
  using (student_id = auth.uid());

create policy "student_enrollment_select_own_company"
  on public.student_enrollment for select
  to authenticated
  using (company_id = auth.uid());

-- student_progress: 학생은 자기 진행률만, 회사는 자기 회사에 등록된 학생
-- 진행률만 조회 가능
alter table public.student_progress enable row level security;

create policy "student_progress_select_own_student"
  on public.student_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.student_enrollment se
      where se.id = student_progress.enrollment_id
        and se.student_id = auth.uid()
    )
  );

create policy "student_progress_select_own_company"
  on public.student_progress for select
  to authenticated
  using (
    exists (
      select 1 from public.student_enrollment se
      where se.id = student_progress.enrollment_id
        and se.company_id = auth.uid()
    )
  );

-- mission_submission: 학생은 자기 제출만, 회사는 자기 회사에 등록된 학생의
-- 제출만 조회 가능
alter table public.mission_submission enable row level security;

create policy "mission_submission_select_own_student"
  on public.mission_submission for select
  to authenticated
  using (
    exists (
      select 1 from public.student_enrollment se
      where se.id = mission_submission.enrollment_id
        and se.student_id = auth.uid()
    )
  );

create policy "mission_submission_select_own_company"
  on public.mission_submission for select
  to authenticated
  using (
    exists (
      select 1 from public.student_enrollment se
      where se.id = mission_submission.enrollment_id
        and se.company_id = auth.uid()
    )
  );
