-- 학생 회원가입 폼에서 학년(grade) 대신 나이(age)를 입력받도록 변경.
-- grade는 기존 데이터 보존을 위해 컬럼은 남기되 NOT NULL 제약만 제거한다.
alter table public.students
  add column if not exists age integer;

alter table public.students
  alter column grade drop not null;
