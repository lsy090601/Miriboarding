# miriboarding-api

Express + Supabase 기반 인증 API. 학생/기업 회원가입, 로그인, 사업자등록번호 검증을 처리한다.

## 설치 및 실행

```bash
cd server
npm install
cp .env.example .env   # SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY 채우기
npm run dev            # nodemon으로 실행 (http://localhost:4000)
```

`.env`는 Supabase 프로젝트의 Project Settings > API 페이지에서 값을 가져온다.

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: 일반 클라이언트용 키. 회원가입/로그인 시 Supabase Auth 호출에 사용.
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 관리자 키. RLS를 우회해 `users`/`students`/`companies` 테이블에 직접 쓰기 위해 사용. **절대 프론트엔드에 노출하지 않는다.**

## 동작 방식 요약

- 회원가입: `supabase.auth.signUp()`으로 `auth.users`에 계정을 만든다 (Supabase 프로젝트에서 "Confirm email"이 켜져 있으면 기본 확인 이메일이 자동 발송됨). 이후 service role 클라이언트로 `users` 테이블과 `students`/`companies` 테이블에 각각 insert한다. 테이블 저장이 실패하면 방금 만든 auth 계정을 롤백(삭제)한다.
- 로그인: `supabase.auth.signInWithPassword()`로 검증하고, 응답의 `session.access_token`(Supabase가 발급한 JWT)을 그대로 클라이언트에 돌려준다. 별도로 JWT를 직접 서명하지 않는다.
- 사업자등록번호 검증: 실제 국세청 API 연동 전이라 mock으로 처리한다. 숫자 10자리 형식이면 `valid: true` + 입력값 기반으로 만든 임의 회사정보를 반환한다.

## 에러 응답 형식

성공이 아닌 경우 공통적으로 아래 형식이며, `code`로 원인을 구분한다.

```json
{ "success": false, "code": "INVALID_EMAIL", "message": "이메일 형식이 올바르지 않습니다." }
```

| code | 상황 | HTTP status |
|---|---|---|
| `INVALID_EMAIL` | 이메일 형식 오류 | 400 |
| `INVALID_PASSWORD` | 비밀번호 8자 미만 | 400 |
| `INVALID_BUSINESS_NUMBER` | 사업자등록번호 형식 오류 | 400 |
| `INVALID_INPUT` | 필수 입력값 누락 | 400 |
| `EMAIL_TAKEN` | 이미 가입된 이메일 | 409 |
| `INVALID_CREDENTIALS` | 로그인 이메일/비밀번호 불일치 | 401 |
| `SUPABASE_ERROR` | Supabase 호출/쿼리 자체 오류 | 502 |
| `INTERNAL_ERROR` | 그 외 서버 오류 | 500 |

## API

### 1. 사업자등록번호 검증

```bash
curl -X POST http://localhost:4000/api/auth/validate-business \
  -H "Content-Type: application/json" \
  -d '{"businessNumber":"1234567890"}'
```

응답 (형식이 맞을 때):

```json
{ "valid": true, "company_name": "미리보딩(주) 123", "industry": "제조업", "founded_date": "2007-05-13" }
```

형식이 안 맞을 때: `{ "valid": false }`

### 2. 학생 회원가입

```bash
curl -X POST http://localhost:4000/api/auth/signup/student \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "홍길동",
    "school": "미리고등학교",
    "grade": "2학년"
  }'
```

응답: `{ "success": true, "user_id": "..." }`

### 3. 회사 회원가입

```bash
curl -X POST http://localhost:4000/api/auth/signup/company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "biz@example.com",
    "password": "password123",
    "businessNumber": "1234567890",
    "company_name": "미리보딩(주)",
    "industry": "IT/소프트웨어",
    "founded_date": "2021-03-15",
    "contact_name": "김담당",
    "contact_position": "과장",
    "contact_phone": "010-1234-5678"
  }'
```

응답: `{ "success": true, "company_id": "..." }`

### 4. 로그인

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'
```

응답: `{ "success": true, "user_type": "student", "user_id": "...", "access_token": "eyJ..." }`

### 이메일 중복 / 형식 오류 확인용 예시

```bash
# 이미 가입된 이메일로 재가입 시도 -> 409 EMAIL_TAKEN
curl -i -X POST http://localhost:4000/api/auth/signup/student \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123","name":"홍길동","school":"미리고등학교","grade":"2학년"}'

# 이메일 형식 오류 -> 400 INVALID_EMAIL
curl -i -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"password123"}'

# 사업자등록번호 형식 오류 -> 400 INVALID_BUSINESS_NUMBER
curl -i -X POST http://localhost:4000/api/auth/signup/company \
  -H "Content-Type: application/json" \
  -d '{"email":"biz2@example.com","password":"password123","businessNumber":"12345","company_name":"a","industry":"a","founded_date":"2020-01-01","contact_name":"a","contact_position":"a","contact_phone":"010-0000-0000"}'
```
