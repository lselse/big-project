# 🚀 AI 리터러시 역량 테스트 플랫폼 (Frontend)

KT AIVLE School 9기 빅프로젝트 23조에서 개발한 **실시간 지능형 감시 시스템과 자동 채점 파이프라인을 탑재한 개발자 역량 평가 플랫폼**의 프론트엔드 리포지토리입니다.

---

## 🛠️ Tech Stack

* **Framework:** React (Vite)
* **Routing:** React Router v6 (`react-router-dom`)
* **Styling:** Custom CSS (`main.css`), Flexbox/Grid Layout
* **Icons:** Lucide React

---

## 📂 Project Architecture (폴더 구조)

프로젝트 유지보수성과 확장성을 위해 컴포넌트들을 역할별(관리자/응시자)로 모듈화하였습니다.

```text
src/
 ├── assets/                 # 이미지 및 정적 리소스
 ├── components/             # 공통 및 권한별 하위 컴포넌트
 │    ├── Header.jsx         # 상단 네비게이션 바 (권한별 동적 탭 렌더링)
 │    ├── admin/             # 관리자 전용 탭 컴포넌트
 │    │    ├── ExamCreateTab.jsx    # 1. 시험 생성 및 일정 관리
 │    │    ├── PolicyMgmtTab.jsx    # 2. 문제 및 정책 관리
 │    │    ├── UserMgmtTab.jsx      # 3. 응시자 명단 및 권한 관리
 │    │    ├── CheatMgmtTab.jsx     # 4. 부정행위 금지사항 정책 관리
 │    │    └── AiConfigTab.jsx      # 5. LLM 및 AI 분석 설정
 │    └── applicant/         # 응시자/게스트 전용 탭 컴포넌트
 │         ├── HomeTab.jsx          # 플랫폼 소개 및 메인 그래픽 허브
 │         ├── ExamTab.jsx          # 정규 평가 목록 및 입장
 │         ├── CheckTab.jsx         # 사전 장비 및 WebRTC 환경 점검
 │         ├── PracticeTab.jsx      # 모의 연습문제 세션
 │         ├── NoticeTab.jsx        # 공지사항
 │         └── FaqTab.jsx           # 자주 묻는 질문
 ├── pages/                  # 페이지 레벨 컴포넌트
 │    ├── HomePage.jsx       # 메인 라우팅 허브 (URL 쿼리 파라미터 기반 탭 제어)
 │    └── AuthPage.jsx       # 로그인 / 회원가입 페이지
 ├── styles/
 │    └── main.css           # 전역 스타일 및 초기화, 컴포넌트별 디자인
 ├── App.jsx                 # 라우터 설정 및 전체 레이아웃 래퍼
 └── main.jsx                # 애플리케이션 진입점