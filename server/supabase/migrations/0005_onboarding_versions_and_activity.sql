-- Supabase SQL Editor에서 전체 실행. 기존 온보딩과 제출은 삭제하지 않는다.
begin;

create table if not exists public.company_onboarding_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_title text not null,
  schedules jsonb not null default '{}'::jsonb,
  missions jsonb not null default '[]'::jsonb,
  target_date date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists idx_onboarding_versions_company on public.company_onboarding_versions(company_id, created_at desc);
alter table public.company_onboarding_versions enable row level security;
-- 버전은 서버에서만 읽고 쓴다. 서비스 역할 키는 브라우저에 노출하지 않는다.
alter table public.company_onboarding add column if not exists version_id uuid references public.company_onboarding_versions(id);
alter table public.student_enrollment add column if not exists onboarding_snapshot jsonb;
alter table public.users add column if not exists last_seen_at timestamptz;

-- 기존 계획을 배포 버전으로 보존한다. 재실행해도 중복 생성하지 않는다.
insert into public.company_onboarding_versions
  (id, company_id, job_title, schedules, missions, target_date, status, created_at, updated_at, published_at)
select id, company_id, job_title, schedules, missions, target_date, 'published', created_at, updated_at, updated_at
from public.company_onboarding
on conflict (id) do nothing;
update public.company_onboarding set version_id = id where version_id is null;
update public.student_enrollment e set onboarding_snapshot = to_jsonb(o)
from public.company_onboarding o where e.company_id = o.company_id and e.onboarding_snapshot is null;

-- 학생에게는 등록 시 배정한 계획을 고정한다. 이후 새 버전을 배포해도 바뀌지 않는다.
create or replace function public.assign_onboarding_snapshot() returns trigger
language plpgsql set search_path = public as $$
begin
  select to_jsonb(o) into new.onboarding_snapshot
  from public.company_onboarding o where o.company_id = new.company_id for share;
  if new.onboarding_snapshot is null then
    raise exception 'PUBLISHED_ONBOARDING_REQUIRED';
  end if;
  return new;
end;
$$;
drop trigger if exists assign_onboarding_snapshot_on_insert on public.student_enrollment;
create trigger assign_onboarding_snapshot_on_insert before insert on public.student_enrollment
for each row execute function public.assign_onboarding_snapshot();

-- 배포와 현재 계획 갱신을 한 트랜잭션으로 처리한다. 배포 버전은 수정 불가.
create or replace function public.publish_onboarding_version(p_company_id uuid, p_version_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v public.company_onboarding_versions;
begin
  perform 1 from public.companies where id = p_company_id for update;
  select * into v from public.company_onboarding_versions
    where id = p_version_id and company_id = p_company_id for update;
  if not found then raise exception 'VERSION_NOT_FOUND'; end if;
  if v.status = 'published' then return to_jsonb(v); end if;
  if jsonb_array_length(v.missions) = 0 then raise exception 'MISSIONS_REQUIRED'; end if;
  insert into public.company_onboarding(company_id, job_title, schedules, missions, target_date, version_id)
  values(v.company_id, v.job_title, v.schedules, v.missions, v.target_date, v.id)
  on conflict(company_id) do update set job_title=excluded.job_title, schedules=excluded.schedules,
    missions=excluded.missions, target_date=excluded.target_date, version_id=excluded.version_id, updated_at=now();
  update public.student_enrollment e set onboarding_snapshot=to_jsonb(o)
    from public.company_onboarding o
    where e.company_id=p_company_id and o.company_id=p_company_id and e.onboarding_snapshot is null;
  update public.company_onboarding_versions set status='published', published_at=now(), updated_at=now()
    where id=v.id returning * into v;
  return to_jsonb(v);
end;
$$;
revoke all on function public.publish_onboarding_version(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_onboarding_version(uuid, uuid) to service_role;

-- 배포와 편집의 동시 실행에서도 배포된 버전이 변경되지 않게 한다.
create or replace function public.protect_published_onboarding() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.status = 'published' then raise exception 'PUBLISHED_VERSION_READ_ONLY'; end if;
  return new;
end;
$$;
drop trigger if exists protect_published_onboarding_on_update on public.company_onboarding_versions;
create trigger protect_published_onboarding_on_update before update on public.company_onboarding_versions
for each row execute function public.protect_published_onboarding();

notify pgrst, 'reload schema';
commit;
