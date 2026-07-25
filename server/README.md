# miriboarding-api

Express + Supabase 기반 API. 학생/기업 회원가입·로그인·사업자등록번호 검증과, 기업의 신입사원 온보딩 계획(Gemini 생성) 관리를 처리한다.

## 설치 및 실행

```bash
cd server
npm install
cp .env.example .env   # SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY 채우기
npm run dev            # nodemon으로 실행 (http://localhost:4000)
```

`.env`는 Supabase 프로젝트의 Project Settings > API 페이지에서 값을 가져온다.

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: 일반 클라이언트용 키. 회원가입/로그인 시 Supabase Auth 호출에 사용.
- `SUPABASE_SERVICE_ROLE_KEY`: 서버 전용 관리자 키. RLS를 우회해 `users`/`students`/`companies`/온보딩 관련 테이블에 직접 쓰기 위해 사용. **절대 프론트엔드에 노출하지 않는다.**
- `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 키. 온보딩 계획 생성(`/api/onboarding/generate`)에 사용.
- `GEMINI_MODEL` (선택): Gemini 모델명. 기본값은 `gemini-flash-latest`. 키의 사용 가능 모델이 다르면 이 값을 바꿔서 지정한다.

## Supabase 스키마 적용

온보딩 기능 관련 테이블(6개)과 RLS 정책은 마이그레이션 파일로 관리한다. **자동 실행되지 않으므로** Supabase 대시보드 SQL Editor에 아래 파일 내용을 그대로 붙여넣어 직접 실행해야 한다.

```
server/supabase/migrations/0001_onboarding_schema.sql
```

`students`/`companies` 테이블(및 그 `id`가 `auth.users.id`와 동일하다는 전제)은 feature/api-auth에서 이미 만들어져 있어야 한다.

## 동작 방식 요약

- 회원가입: `supabase.auth.signUp()`으로 `auth.users`에 계정을 만든다 (Supabase 프로젝트에서 "Confirm email"이 켜져 있으면 기본 확인 이메일이 자동 발송됨). 이후 service role 클라이언트로 `users` 테이블과 `students`/`companies` 테이블에 각각 insert한다. 테이블 저장이 실패하면 방금 만든 auth 계정을 롤백(삭제)한다.
- 로그인: `supabase.auth.signInWithPassword()`로 검증하고, 응답의 `session.access_token`(Supabase가 발급한 JWT)을 그대로 클라이언트에 돌려준다. 별도로 JWT를 직접 서명하지 않는다.
- 사업자등록번호 검증: 실제 국세청 API 연동 전이라 mock으로 처리한다. 숫자 10자리 형식이면 `valid: true` + 입력값 기반으로 만든 임의 회사정보를 반환한다.
- 온보딩 생성: Gemini(`@google/generative-ai`, `responseMimeType: application/json` + `responseSchema`)를 호출해 직무별 하루/1주/1달 일정과 미션 3개를 JSON으로 받아 `company_onboarding`에 저장한다. `missions`는 스펙 테이블 목록에는 없었지만 API가 항상 미션을 함께 다뤄야 해서 `schedules`와 같은 방식(jsonb 배열, 각 항목은 `{ id, title, description, order }`)으로 추가했다.
- 미션 CRUD: 별도 미션 테이블 없이 `company_onboarding.missions`(jsonb 배열)를 직접 읽고 쓰는 방식으로 구현했다. `mission_submission.mission_id`는 이 배열 안의 `id`를 가리키며 jsonb 내부 값이라 FK 제약은 없다(서비스 코드에서 존재 여부만 검증).
- Rate limiting: 같은 `companyId`로 60초 이내에 다시 `/generate`를 호출하면 `429 RATE_LIMITED`를 반환한다(서버 프로세스 메모리 기준, 재시작하면 초기화됨).

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

온보딩 API는 아래 코드를 추가로 사용한다.

| code | 상황 | HTTP status |
|---|---|---|
| `GEMINI_ERROR` | Gemini API 호출 실패, 응답 파싱 실패, 응답 형식 오류 | 502 |
| `RATE_LIMITED` | 같은 companyId로 60초 이내 재생성 요청 | 429 |
| `NOT_FOUND` | 온보딩/미션 정보 없음 | 404 |

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

---

## 온보딩 API

베이스 경로: `/api/onboarding`. `companyId`는 회사 회원가입 시 발급된 `company_id`(= `auth.users.id`)를 사용한다.

### 1. 온보딩 타임라인 생성 (Gemini)

`POST /api/onboarding/generate`

요청 스펙에는 `jobTitle`/`companyName`만 있었지만, 어느 회사에 저장할지 알아야 하므로 `companyId`를 요청 바디에 추가했다(다른 API들이 전부 `:companyId`를 쓰는 것과 일관됨).

```bash
curl -X POST http://localhost:4000/api/onboarding/generate \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "11111111-1111-1111-1111-111111111111",
    "jobTitle": "물류관리사",
    "companyName": "OO물류"
  }'
```

응답:

```json
{
  "schedules": {
    "day": [{ "time": "09:00", "activity": "...", "importance": "high" }],
    "week": [{ "time": "1일차", "activity": "...", "importance": "medium" }],
    "month": [{ "time": "1주차", "activity": "...", "importance": "low" }]
  },
  "missions": [
    { "id": "...", "title": "...", "description": "...", "order": 1, "submissionType": "text", "options": [] }
  ],
  "jobTitle": "물류관리사",
  "companyName": "OO물류",
  "targetDate": null
}
```

`targetDate`(실습 시작일, D-day 계산용)는 요청 바디에 함께 보내면 저장된다(선택값, 안 보내면 `null`).

같은 `companyId`로 60초 이내 재요청 시:

```bash
curl -i -X POST http://localhost:4000/api/onboarding/generate \
  -H "Content-Type: application/json" \
  -d '{"companyId":"11111111-1111-1111-1111-111111111111","jobTitle":"물류관리사","companyName":"OO물류"}'
# -> 429 RATE_LIMITED
```

### 2. 온보딩 조회

```bash
curl http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111
```

응답: `{ "schedules": {...}, "missions": [...], "jobTitle": "...", "companyName": "...", "targetDate": "2026-09-07", "createdAt": "..." }`

### 3. 온보딩 수정

```bash
curl -X PUT http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111 \
  -H "Content-Type: application/json" \
  -d '{
    "schedules": { "day": [], "week": [], "month": [] },
    "missions": [{ "title": "미션 제목", "description": "미션 설명" }]
  }'
```

응답: `{ "success": true, "updatedAt": "..." }`

`targetDate`도 바디에 포함해서 함께 수정할 수 있다(생략 가능).

### 4. 미션 CRUD

```bash
# 목록 조회
curl http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111/missions

# 생성
curl -X POST http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111/missions \
  -H "Content-Type: application/json" \
  -d '{"title":"재고 실사 리포트 작성","description":"..."}'

# 수정 (missionId는 위 응답의 mission.id)
curl -X PUT http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111/missions/<missionId> \
  -H "Content-Type: application/json" \
  -d '{"title":"수정된 제목"}'

# 삭제
curl -X DELETE http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111/missions/<missionId>
```

### 5. 학생 진도 업데이트

```bash
curl -X PUT http://localhost:4000/api/onboarding/<enrollmentId>/progress \
  -H "Content-Type: application/json" \
  -d '{"progressPercent": 45}'
```

응답: `{ "success": true, "progressPercent": 45, "updatedAt": "..." }`

### 6. 학생 등록(enrollment)

학생이 특정 회사의 온보딩에 처음 진입할 때 호출한다(이미 등록돼 있으면 기존 `enrollmentId`를 그대로 반환하는 upsert 방식). 미션 제출/진도 업데이트는 `studentId`가 아니라 이 `enrollmentId`를 기준으로 동작한다.

```bash
# 등록(upsert) - 이미 등록돼 있어도 에러 없이 같은 enrollmentId를 반환
curl -X POST http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId":"22222222-2222-2222-2222-222222222222"}'
```

응답: `{ "enrollmentId": "..." }`

```bash
# 조회
curl http://localhost:4000/api/onboarding/11111111-1111-1111-1111-111111111111/enrollment/22222222-2222-2222-2222-222222222222
```

응답: `{ "enrollmentId": "..." }` (없으면 `404 NOT_FOUND`)

### 7. 미션 제출

`missionId`는 `company_onboarding.missions` 배열 안의 `id`를 가리킨다(존재하지 않으면 `404 NOT_FOUND`).

```bash
# 제출
curl -X POST http://localhost:4000/api/onboarding/enrollments/<enrollmentId>/missions/<missionId>/submissions \
  -H "Content-Type: application/json" \
  -d '{"content":"제출 내용(텍스트/선택지 값/파일명 등)"}'
```

응답: `{ "success": true, "submission": { "id": "...", "enrollment_id": "...", "mission_id": "...", "content": "...", "submitted_at": "...", "feedback": null } }`

```bash
# 해당 enrollment의 제출 내역 전체 조회 (미션별 완료 여부는 이 목록에 mission_id가 있는지로 판단)
curl http://localhost:4000/api/onboarding/enrollments/<enrollmentId>/submissions
```

응답: `{ "submissions": [...] }`

### 에러 확인용 예시

```bash
# companyId 없음 -> 400 INVALID_INPUT
curl -i -X POST http://localhost:4000/api/onboarding/generate \
  -H "Content-Type: application/json" -d '{}'

# 존재하지 않는 companyId 조회 -> 404 NOT_FOUND (마이그레이션 적용 전이면 502 SUPABASE_ERROR)
curl -i http://localhost:4000/api/onboarding/00000000-0000-0000-0000-000000000000

# progressPercent 범위 오류 -> 400 INVALID_INPUT
curl -i -X PUT http://localhost:4000/api/onboarding/<enrollmentId>/progress \
  -H "Content-Type: application/json" -d '{"progressPercent": 150}'
```
