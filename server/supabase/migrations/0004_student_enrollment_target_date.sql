-- 실습 시작일을 회사 전체가 아니라 학생(등록 건)마다 다르게 설정할 수 있도록
-- student_enrollment에 target_date를 추가한다.
alter table public.student_enrollment
  add column if not exists target_date date;
