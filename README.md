# 인력 관리 (입퇴사) 도구

Next.js 15 + Supabase 기반의 팀 공용 입퇴사 관리 웹앱입니다.

## 기능

- 직원 CRUD (등록 / 목록 / 검색 / 수정 / 삭제)
- 입사 체크리스트 (기본 항목 자동 추가 + 자유 편집)
- 퇴사 체크리스트 (퇴사 시작 버튼으로 시작)
- 항목별 완료 처리 (완료자 / 완료 시각 기록)
- 상태 필터 (재직 / 휴직 / 퇴직)
- CSV 내보내기 (Excel 한글 깨짐 방지 BOM 포함)
- Supabase Auth 이메일/비밀번호 로그인 (RLS로 인증된 사용자만 접근)

## 빠른 시작

### 1. Supabase 프로젝트 만들기

1. https://supabase.com 에서 새 프로젝트 생성
2. Project Settings → API 에서 `Project URL` 과 `anon public` 키 복사
3. SQL Editor 에서 `supabase/schema.sql` 내용을 그대로 실행
4. Authentication → Providers → Email 활성화 (필요 시 "Confirm email" 해제하면 가입 직후 바로 로그인 가능)

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 에 1단계에서 복사한 값을 채워 넣습니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 3. 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속 → 회원가입 → 로그인.

### 4. Vercel 배포

1. 이 저장소를 GitHub에 푸시 (이미 되어 있음)
2. https://vercel.com/new 에서 저장소 import
3. Environment Variables 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
4. Deploy

배포 URL 을 팀원에게 공유 → 각자 회원가입 → 같은 데이터를 공유합니다.

## 팀원 추가

- 팀원이 직접 `/login` 에서 가입하면 됩니다.
- 가입을 제한하려면 Supabase Dashboard → Authentication → Providers → Email →
  "Allow new users to sign up" 을 끄고, Users 탭에서 수동 초대.

## 보안 메모

- 모든 테이블에 RLS 활성화 — 로그인하지 않으면 데이터 접근 불가.
- 현재 정책은 "로그인한 모든 사용자가 모든 데이터 읽기/쓰기 가능".
  부서·역할별 접근 제한이 필요하면 `supabase/schema.sql` 의 policy 를 수정하세요.

## 디렉토리

```
src/
├── app/
│   ├── api/employees/export/  CSV 내보내기
│   ├── auth/signout/          로그아웃
│   ├── employees/             직원 목록/등록/상세(체크리스트)
│   ├── login/                 로그인 페이지
│   ├── layout.tsx
│   └── page.tsx               대시보드
├── components/Nav.tsx
├── lib/
│   ├── supabase/              client / server / middleware 헬퍼
│   └── types.ts               타입 + 기본 체크리스트
└── middleware.ts              미인증 시 /login 으로 리다이렉트
supabase/schema.sql            DB 스키마 + RLS
```
