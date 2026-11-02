# 샘플위키 설정 가이드

마크다운으로 글을 쓰는 간단한 위키입니다. 빌드 없이 HTML/CSS/JS로 동작합니다.

- 글 저장: **Firebase Firestore**
- 로그인: **Firebase Authentication** (이메일/비밀번호)
- 이미지: **Supabase Storage**

```
index.html
css/style.css
js/app.js        화면 (문서 보기 / 편집 / 로그인)
js/markdown.js   마크다운 → HTML, 제목 번호와 목차 생성
js/db.js         Firestore 읽기/저장
js/firebase.js   Firebase 초기화
js/supabase.js   Supabase 초기화 + 이미지 업로드   ← URL / anon key 입력
firestore.rules  Firestore 보안 규칙
supabase/setup.sql  Supabase 버킷 + 업로드 정책
```

## 사용법

- 오른쪽 위 **사람 아이콘** → **로그인** → 이메일/비밀번호로 로그인 (계정은 관리자가 Firebase 콘솔에서 직접 추가). 로그아웃도 같은 메뉴에 있습니다.
- 문서에서 **편집** → 마크다운으로 작성 → **저장**
- 위쪽 입력창에 제목을 넣으면 그 문서로 이동합니다. 없는 문서면 새로 만들 수 있습니다.
- **목차**: `#`, `##`, `###` 제목을 쓰면 번호(1. / 1.1.)가 붙고 첫 제목 앞에 목차가 자동으로 생깁니다.
  원하는 위치에 `[목차]` 또는 `[TOC]` 를 한 줄로 쓰면 그 자리에 들어갑니다.
- **이미지**: 편집 화면의 🖼 버튼, 붙여넣기(Ctrl+V), 끌어다 놓기로 올리면 `![이름](URL)` 이 자동으로 들어갑니다.

## 인물 정보 틀

편집 화면의 🪪(틀 넣기) 버튼을 누르면 목차 옆에 뜨는 인물 정보 표(HTML)가 들어갑니다. 첫 `#` 제목보다 **위에** 두면 목차 오른쪽에 나란히 표시됩니다.

- **내용 수정**: `<th>항목</th><td>내용</td>` 한 줄이 표의 한 줄입니다. 줄을 복사·삭제해서 항목을 늘리고 줄이세요.
- **이미지**: 🖼 버튼으로 이미지를 올리면 `![이름](URL)` 이 들어갑니다. 그 URL만 복사해서 `<img src="">` 의 따옴표 안에 넣으세요. 비어 있으면 회색 칸으로 보입니다.
- **아이콘**: 속성 같은 작은 그림은 `<img class="ib-icon" src="URL">양자` 처럼 씁니다.
- **색 바꾸기**: 맨 위 `style="--ib-main:#1a1d23; --ib-accent:#b19872;"` 에서 `--ib-main` 은 어두운 배경색, `--ib-accent` 는 금색 글자와 제목 아래 띠 색입니다.
- **펼치기**: `<details><summary> 스포일러 ▼</summary><div>숨길 내용</div></details>` (원본처럼 0.1초 동안 높이가 늘어나며 열리고 줄어들며 닫힙니다)
- **링크**: 틀 안은 HTML이라 마크다운 링크가 안 됩니다. `<a href="#/w/문서 제목">표시할 글</a>` 로 쓰세요.
- ⚠️ 틀 안에는 **빈 줄을 넣지 마세요.** 빈 줄이 있으면 거기서 HTML이 끝난 것으로 처리되어 표가 깨집니다.

## 1. 실행

```bash
npm start            # http://localhost:5500
```

VS Code Live Server로 열어도 됩니다. `file://` 로 직접 열면 동작하지 않습니다.
Firebase 로그인은 기본적으로 `localhost` 에서만 허용되므로 `127.0.0.1` 대신 `localhost` 로 여세요.

## 2. Firebase

설정값은 이미 `js/firebase.js` 에 들어 있습니다.

1. Firebase 콘솔 → **Authentication** → **Sign-in method** → **이메일/비밀번호** 사용 설정
2. Firebase 콘솔 → **Firestore Database** → **규칙** 탭에 [`firestore.rules`](firestore.rules) 내용을 붙여넣고 **게시**

### 계정 추가 (수동)
사이트에는 회원가입 기능이 없습니다. 편집할 사람의 계정을 직접 만드세요.

1. Firebase 콘솔 → **Authentication** → **Users** 탭 → **사용자 추가**
2. 이메일과 비밀번호(6자 이상) 입력 → **사용자 추가**
3. 그 이메일/비밀번호로 사이트에서 로그인

### 가입 막기 (권장)
회원가입 버튼이 없어도 Firebase API 키는 브라우저에 공개되어 있어서, 마음먹으면 API를 직접 호출해 계정을 만들 수 있습니다.
Firebase 콘솔 → **Authentication** → **설정(Settings)** → **사용자 작업(User actions)** 에서
**생성(가입) 사용 설정** 체크를 해제하면 콘솔에서 추가한 계정만 쓸 수 있게 됩니다.

## 3. Supabase (처음부터)

### 3-1. 프로젝트 만들기
1. https://supabase.com 에 가입하고 로그인
2. **New project** 클릭
3. 이름, 데이터베이스 비밀번호(아무거나, 따로 보관), 지역 **Northeast Asia (Seoul)** 선택 → **Create new project**
4. 1~2분 기다리면 프로젝트가 준비됩니다.

### 3-2. Firebase 로그인과 연결하기
이 위키는 로그인을 Firebase로만 합니다. Supabase가 "Firebase에 로그인한 사용자"를 믿고 업로드를 허락하도록 연결합니다.

1. 왼쪽 메뉴 **Authentication** → **Sign In / Providers**
2. 아래쪽 **Third-party Auth** 에서 **Add provider** → **Firebase**
3. **Firebase Project ID** 에 `wiki-c09b9` 입력 → 저장

### 3-3. 이미지 저장소(버킷) 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. [`supabase/setup.sql`](supabase/setup.sql) 내용을 전부 붙여넣고 **Run**

이렇게 설정됩니다.
- `wiki-images` 라는 공개 버킷 (PNG / JPG / GIF / WEBP, 5MB 이하)
- Firebase 프로젝트 `wiki-c09b9` 에 로그인한 사용자만 업로드 가능
- 수정·삭제는 아무도 할 수 없음

**Storage** 메뉴에 `wiki-images` 버킷이 보이면 성공입니다.

### 3-4. 키를 코드에 넣기
1. 왼쪽 아래 **Project Settings** → **API** (또는 **Data API / API Keys**)
2. **Project URL** 과 **anon public** 키를 복사
3. [`js/supabase.js`](js/supabase.js) 에 붙여넣기

```js
export const SUPABASE_URL = 'https://abcdefghijkl.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

> anon 키는 브라우저에 공개돼도 괜찮은 키입니다. 실제 권한은 3-3의 정책이 막아 줍니다.
> **service_role 키는 절대 넣지 마세요.** 모든 보안을 무시하는 관리자 키입니다.

### 3-5. 확인
1. 사이트에서 로그인 → 아무 문서 **편집**
2. 🖼 버튼으로 이미지를 올리면 본문에 `![이름](https://....supabase.co/storage/v1/object/public/wiki-images/...)` 이 들어갑니다.
3. **미리보기** 탭에서 이미지가 보이면 완료입니다.

업로드가 실패할 때:
- `new row violates row-level security policy` → 3-2(Firebase 연결) 또는 3-3(SQL)이 빠졌는지 확인
- `Bucket not found` → 3-3 SQL을 실행했는지 확인
- `Supabase 설정이 필요합니다` → 3-4에서 키를 넣었는지 확인
