# 미리보딩 (MiriBoarding)

> **"취업 후 공백기를, 불안이 아닌 준비의 시간으로."**

마이스터고등학교에서, 취업이 확정된 학생이 현장실습을 시작하기 전까지의 **3~4개월 준비 공백기**를 줄여 주는 AI 기반 프리보딩(Pre-boarding) 서비스입니다.

---

## 📖 프로젝트 소개

많은 학생이 채용공고만 보고 직무를 고르고, 실제 업무를 충분히 이해하지 못한 채 첫 출근을 맞이합니다. 취업이 확정된 뒤에도 현장실습이 시작되기 전까지는 기업과 직무를 미리 경험할 기회가 부족해서, 첫 출근에 대한 불안과 적응의 어려움을 겪습니다.

미리보딩은 학생과 기업을 하나의 플랫폼으로 연결해 이 문제를 해결합니다.

- **학생**은 관심 있는 직무를 미리 체험하고, 취업이 확정되면 기업이 준비한 맞춤형 온보딩 일정과 미션을 수행합니다.
- **기업**은 Gemini AI로 직무와 기업 특성에 맞는 온보딩을 자동 생성하고, 수정·관리하며 학생들의 진행 현황을 확인합니다.

이를 통해 학생에게는 **공백기를 준비의 시간으로**, 기업에게는 **효율적인 신입 온보딩 환경**을 제공합니다.

---

## 🎯 해결하려는 문제

- 채용공고만으로는 실제 직무를 이해하기 어렵다.
- 취업 확정 후 현장실습 전까지 준비할 수 있는 환경이 부족하다.
- 첫 출근 후 업무 적응에 실패해 조기 이탈할 가능성이 있다.
- 기업은 온보딩 콘텐츠를 만들고 관리하는 데 많은 시간과 비용이 든다.

---

## ✨ 주요 기능

### 학생

| 기능 | 설명 |
|---|---|
| 직무 체험 | 백엔드·프론트엔드·데이터 분석·물류관리·금융시스템 직무를 하루 / 1주 / 1달 일정으로 체험하고, 일정마다 중요도와 관련 용어를 확인합니다. |
| 온보딩 | 취업이 확정된 학생은 기업이 정한 실습 시작일(D-day), 기업 맞춤 일정, 전체 진도율을 확인합니다. |
| 미션 수행 | 텍스트 작성, 선택지 응답, 파일 제출로 미션을 수행하고 기업의 피드백을 받아봅니다. |

### 기업

| 기능 | 설명 |
|---|---|
| AI 온보딩 생성 | 직무와 기업 정보를 바탕으로 하루·1주·1달 일정과 미션을 Gemini가 자동 생성합니다. |
| 온보딩 관리 | 생성된 일정과 미션을 직접 수정하고 실습 시작일을 설정합니다. |
| 학생 관리 | 학생을 등록하고 진행 현황을 확인하며 미션 제출물에 피드백을 보냅니다. |
| 사업자등록번호 검증 | 현재는 형식(숫자 10자리)만 확인하고 샘플 기업 정보를 반환합니다. 국세청 API 연동은 예정입니다. |

### 오프라인 체험 부스

- NFC 리더(ACR122U)와 연동한 **키오스크 모드**를 지원합니다. NFC 카드를 태그하면 해당 직무 체험 화면으로 바로 이동합니다.
- 키오스크 모드는 주소 끝에 `?kiosk=1`을 붙이면 켜지고 `?kiosk=0`으로 끌 수 있습니다. 일반 사용자에게는 동작하지 않습니다.

---

## 🛠 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | React 18, React Router 6, Vite, CSS Modules |
| 백엔드 | Node.js, Express, Multer |
| 데이터베이스 / 인증 | Supabase (PostgreSQL, Auth) |
| AI | Google Gemini (`@google/generative-ai`) |
| 배포 | Vercel (프론트엔드), Render (API 서버) |

---

## 📁 폴더 구조

```
Miriboarding/
├── src/                      # 프론트엔드
│   ├── components/           # 공용 컴포넌트 (Nav, Badge, Tabs, ImageCard ...)
│   ├── pages/
│   │   ├── Login/ Signup/    # 로그인, 회원가입
│   │   ├── student/          # 학생 화면
│   │   └── company/          # 기업 화면
│   ├── lib/                  # API 호출, 인증, Supabase 클라이언트
│   ├── mock/                 # 서버 연결 실패 시 사용하는 mock 데이터
│   └── assets/               # 이미지, 폰트
├── server/                   # 백엔드 (Express)
│   ├── src/                  # routes / controllers / services
│   └── supabase/migrations/  # DB 스키마 SQL
├── tools/                    # 보조 도구
├── vercel.json               # Vercel 배포 설정
└── render.yaml               # Render 배포 설정
```

---

## 🚀 로컬 실행

### 1. 사전 준비

- Node.js 18 이상
- Supabase 프로젝트와 Gemini API 키 ([발급](https://aistudio.google.com/apikey))

### 2. 프론트엔드

```bash
cd Miriboarding
npm install
npm run dev
```

http://localhost:5173 에서 열립니다. 개발 서버에서는 로그인 없이 학생 화면(`/student/home`, `/student/explore` 등)을 바로 볼 수 있습니다. 배포 빌드에는 적용되지 않습니다.

프론트엔드 환경변수는 프로젝트 루트의 `.env`에 둡니다.

| 변수 | 설명 | 기본값 |
|---|---|---|
| `VITE_API_BASE_URL` | API 서버 주소 | `http://localhost:4000` |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon 키 | - |

### 3. 백엔드

```bash
cd server
npm install
cp .env.example .env    # 값을 채운 뒤 실행
npm run dev             # http://localhost:4000
```

| 변수 | 설명 |
|---|---|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase 클라이언트용 값 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 관리자 키. **프론트엔드에 노출하지 않습니다.** |
| `GEMINI_API_KEY` | 온보딩 생성용 Gemini 키 |
| `GEMINI_MODEL` | (선택) 사용할 모델명 |
| `NCS_SERVICE_KEY` / `NCS_API_BASE_URL` | NCS 직무 정보 조회용 키와 주소 |
| `PORT` | 서버 포트 (기본 4000) |

### 4. DB 스키마 적용

`server/supabase/migrations/`의 SQL 파일을 번호 순서대로 Supabase 대시보드의 **SQL Editor**에서 직접 실행합니다. 자동으로 실행되지 않습니다.

자세한 API 명세와 에러 코드는 [서버 안내](server/README.md)를 참고하세요.

---

## ☁️ 배포

| 대상 | 플랫폼 | 설정 |
|---|---|---|
| 프론트엔드 | Vercel | `vercel.json` (Vite 빌드, SPA 라우팅 rewrite) |
| API 서버 | Render | `render.yaml` (`server/` 기준, `/health` 헬스체크) |

Render에는 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`를 대시보드에서 직접 등록해야 합니다. Vercel에는 `VITE_`로 시작하는 환경변수를 등록하세요.

---

## ✅ 기대 효과

**학생**
- 직무 이해도 향상
- 현장실습 적응력 강화
- 첫 출근에 대한 불안 감소

**기업**
- 온보딩 제작 시간 단축
- 신입사원 교육 효율 향상
- 조기 이탈률 감소
