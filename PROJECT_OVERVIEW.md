# Task Manager (할 일 관리 앱) 🚀

마감을 기반으로 작업의 우선순위를 직관적으로 파악하고 관리할 수 있도록 돕는 **오프라인 우선(Offline-first)** 개인 생산성 관리 애플리케이션입니다. Next.js와 Tailwind CSS로 구축되었으며, 다양한 뷰(View)와 다국어(한국어, 영어, 일본어) 및 PWA를 지원합니다.

## ✨ 주요 특징

1. **마감 기반 우선순위 정렬 (Urgency)**
   - 등록된 작업의 마감 기한과 남은 시간을 바탕으로 `긴급도 시각화(Urgency Weight)`를 수행하여 가장 시급한 일을 놓치지 않게 도와줍니다.

2. **풍부한 시각화 뷰 제공**
   - **타임라인 (Timeline):** 남은 시간에 따라 그룹화된 세로형 일정.
   - **캘린더 (Calendar):** 달력 형태로 월별 작업 현황과 요약 정보 제공.
   - **리포트 (Report) & 히트맵 (Heatmap):** 완료된 작업, 작업 소요 시간, 달성도 추적.

3. **시간 추적 & 포모도로 타이머**
   - **일반 타임 트래커:** 시작 단계부터 종료까지 특정 작업에 투자한 시간을 기록.
   - **포모도로 таймер (Pomodoro):** 작업 / 짧은 휴식 / 긴 휴식을 교차 수행하며 능률 향상 기록.

4. **강력한 데이터 관리 & PWA 지원**
   - **로컬 스토리지 (LocalStorage):** 완전한 오프라인 작동.
   - **서버 동기화 & JSON 백업:** 외부 서버(API) 동기화 및 파일 입/출력 지원.
   - **PWA (Progressive Web App):** 데스크톱/모바일 아이콘 설치 지원.

5. **글로벌 다국어 지원 (i18n)**
   - 한국어(ko), 영어(en), 일본어(ja) 동적 전환(Context 없는 단순 State 구조 설계).

## 🛠 아키텍처 및 폴더 구조

```text
src/
├── app/
│   ├── layout.tsx         # 전역 레이아웃 및 PWA/다크 모드 서비스워커 등록
│   ├── page.tsx           # 메인 대시보드 역할 (대부분의 View 컴포넌트 조합)
│   └── globals.css        # 스타일 설정 (Tailwind)
├── components/
│   ├── migration/         # 백업 및 동기화 컴포넌트 (SyncButton)
│   └── visual/            # 시각화 및 주요 UI 컴포넌트 
│       ├── TaskCard.tsx       # 태스크 카드, 일괄편집 및 세부 작업 트리
│       ├── CalendarView.tsx   # 캘린더 뷰
│       ├── HeatmapCalendar.tsx# 활동 잔디밭(히트맵)
│       ├── TimelineView.tsx   # 마감 순 데드라인 타임라인
│       ├── WeeklyReport.tsx   # 생산성 리포트 및 카테고리 통계
│       └── ...
├── core/
│   ├── ports/
│   │   └── taskRepository.ts  # Task Type Data 인터페이스 및 도메인 모델 정의
│   └── adapters/
│       └── localAdapter.ts    # LocalStorage를 활용한 Data Adapter
├── hooks/                   
│   ├── useTasks.ts        # 주된 Task 상태 관리 (커스텀 훅)
│   ├── usePomodoro.ts     # 포모도로 상태 로직
│   └── useLocale.ts       # i18n 상태 관리
└── utils/
    ├── categories.ts      # 카테고리별 다크 모드/라이트 모드 색상 팔레트
    ├── i18n.ts            # 언어 처리, 번역 데이터 보관 및 t() 함수 정의
    └── time.ts            # 남은 시간에 따른 텍스트 포맷 및 우선순위 알고리즘
public/
├── sw.js                  # PWA 서비스 워커
├── manifest.json          # PWA 메타데이터
└── icon-512.png           # 웹/모바일 앱 아이콘
```

## 📅 데이터 모델 개요 (`Task`)

- `id`: UUID 기반 고유 식별자.
- `title`, `notes`: 작업 명칭과 상세 메모.
- `deadline`: `ISO 8601` 형식 마감 시각.
- `category`: 작업 분류. (시스템에 의해 색상 바인딩됨)
- `priority`: 'high', 'normal', 'low'.
- `status`: 'todo', 'in-progress', 'done'.
- `subtasks`: 배열로 구성되는 하위 세부 작업들. (Title, done 필드 포함).
- `timeSessions`: 시작, 종료 시간이 포함된 소요 시간 측정 배열.
- `repeat`: 데일리, 위클리 등 반복 작업 지원 속성.
- `links`: 외부 URL 자산 및 파일명 참조 링크.

## 🚀 향후 발전 가능성 (To-do)
- **알림 (Notification API):** `deadline` 도달 전 푸시 알림 연동.
- **클라우드 연동 고도화:** `localStorage`를 넘어서 Firebase나 Supabase 등으로의 백엔드 Migration 연결 플러그인.
- **모바일 드래그 앤 드롭 최적화:** 터치 기반 센서 설정 고도화로 더 자연스러운 재정렬 지원.
