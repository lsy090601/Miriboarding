-- ============================================================
-- Miriboarding: 온보딩 실습 시작일(D-day 기준) 컬럼 추가
--
-- 사용법: Supabase 대시보드 > SQL Editor에 전체를 붙여넣고 실행한다.
-- 0001_onboarding_schema.sql이 먼저 적용되어 있어야 한다.
-- ============================================================

alter table public.company_onboarding
  add column if not exists target_date date;
