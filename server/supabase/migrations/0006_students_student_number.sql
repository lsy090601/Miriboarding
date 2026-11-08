-- 학생 회원가입 학교 정보 화면에서 학번(예: 2310)을 입력받는다.
-- 이 SQL을 Supabase SQL Editor에서 실행한 뒤 서버를 배포해야 학번이 저장된다.
-- (실행 전에 서버가 먼저 배포돼도 가입은 되지만 학번만 저장되지 않는다.)
alter table public.students
  add column if not exists student_number text;
