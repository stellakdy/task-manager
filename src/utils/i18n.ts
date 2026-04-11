export type Locale = 'ko' | 'en' | 'ja';

const translations = {
  // ── 공통 ──
  appTitle:         { ko: '할 일 관리',       en: 'Task Manager',      ja: 'タスク管理' },
  taskCount:        { ko: '할 일 {n}개',      en: '{n} tasks',         ja: 'タスク {n}件' },
  sortByUrgency:    { ko: '긴급도 순 정렬',   en: 'Sorted by urgency', ja: '緊急度順' },
  addTask:          { ko: '할 일 추가',       en: 'Add Task',          ja: 'タスク追加' },
  cancel:           { ko: '취소',             en: 'Cancel',            ja: 'キャンセル' },
  save:             { ko: '저장',             en: 'Save',              ja: '保存' },
  delete:           { ko: '삭제',             en: 'Delete',            ja: '削除' },
  edit:             { ko: '수정',             en: 'Edit',              ja: '編集' },
  duplicate:        { ko: '복제',             en: 'Duplicate',         ja: '複製' },
  adding:           { ko: '추가 중…',         en: 'Adding…',           ja: '追加中…' },
  add:              { ko: '추가하기',         en: 'Add',               ja: '追加' },
  confirm:          { ko: '확인',             en: 'OK',                ja: '確認' },

  // ── 새 할 일 폼 ──
  newTask:          { ko: '새 할 일',         en: 'New Task',          ja: '新規タスク' },
  titleLabel:       { ko: '제목',             en: 'Title',             ja: 'タイトル' },
  titlePlaceholder: { ko: '무엇을 해야 하나요?', en: 'What needs to be done?', ja: '何をしますか？' },
  deadlineLabel:    { ko: '마감 시간',        en: 'Deadline',          ja: '締切' },
  categoryLabel:    { ko: '카테고리',         en: 'Category',          ja: 'カテゴリ' },
  statusLabel:      { ko: '상태',             en: 'Status',            ja: 'ステータス' },
  priorityLabel:    { ko: '우선순위',         en: 'Priority',          ja: '優先度' },
  repeatLabel:      { ko: '반복',             en: 'Repeat',            ja: '繰返し' },
  tagsLabel:        { ko: '태그',             en: 'Tags',              ja: 'タグ' },
  notesLabel:       { ko: '메모',             en: 'Notes',             ja: 'メモ' },
  optional:         { ko: '선택사항',         en: 'optional',          ja: '任意' },
  notesPlaceholder: { ko: '참고 링크, 세부 내용, 주의사항 등', en: 'Links, details, notes...', ja: 'リンク、詳細など...' },
  linksLabel:       { ko: '파일/링크',        en: 'Files/Links',       ja: 'ファイル/リンク' },
  addLink:          { ko: '링크 추가',        en: 'Add Link',          ja: 'リンク追加' },
  linkName:         { ko: '이름',             en: 'Name',              ja: '名前' },
  linkUrl:          { ko: 'URL 또는 경로',    en: 'URL or path',       ja: 'URLまたはパス' },

  // ── 상태 ──
  todo:             { ko: '할 일',            en: 'To Do',             ja: '未着手' },
  inProgress:       { ko: '진행 중',          en: 'In Progress',       ja: '進行中' },
  done:             { ko: '완료',             en: 'Done',              ja: '完了' },
  all:              { ko: '전체',             en: 'All',               ja: 'すべて' },
  allCategory:      { ko: '전체 카테고리',    en: 'All Categories',    ja: '全カテゴリ' },

  // ── 우선순위 ──
  high:             { ko: '높음',             en: 'High',              ja: '高' },
  normal:           { ko: '보통',             en: 'Normal',            ja: '中' },
  low:              { ko: '낮음',             en: 'Low',               ja: '低' },

  // ── 반복 ──
  noRepeat:         { ko: '반복 없음',        en: 'No Repeat',         ja: '繰返しなし' },
  daily:            { ko: '매일',             en: 'Daily',             ja: '毎日' },
  weekly:           { ko: '매주',             en: 'Weekly',            ja: '毎週' },
  monthly:          { ko: '매월',             en: 'Monthly',           ja: '毎月' },
  repeatBadge:      { ko: '반복',             en: 'Repeat',            ja: '繰返し' },

  // ── 프리셋 ──
  in1Hour:          { ko: '1시간 후',         en: '1 hour',            ja: '1時間後' },
  in3Hours:         { ko: '3시간 후',         en: '3 hours',           ja: '3時間後' },
  todayMidnight:    { ko: '오늘 자정',        en: 'Tonight',           ja: '今日深夜' },
  tomorrowMidnight: { ko: '내일 자정',        en: 'Tomorrow',          ja: '明日深夜' },
  in3Days:          { ko: '3일 후',           en: '3 days',            ja: '3日後' },

  // ── 시간 표시 ──
  overdue:          { ko: '기한 초과',        en: 'Overdue',           ja: '期限超過' },
  daysHours:        { ko: '{d}일 {h}시간',    en: '{d}d {h}h',         ja: '{d}日{h}時間' },
  hoursMinutes:     { ko: '{h}시간 {m}분',    en: '{h}h {m}m',         ja: '{h}時間{m}分' },
  minutesOnly:      { ko: '{m}분',            en: '{m}m',              ja: '{m}分' },
  justNow:          { ko: '곧 마감',          en: 'Due soon',          ja: 'まもなく' },

  // ── 통계 ──
  statTotal:        { ko: '전체',             en: 'Total',             ja: '全体' },
  statDone:         { ko: '완료',             en: 'Done',              ja: '完了' },
  statCritical:     { ko: '3시간이내',        en: 'Within 3h',         ja: '3時間以内' },
  statOverdue:      { ko: '기한초과',         en: 'Overdue',           ja: '期限超過' },
  completionRate:   { ko: '완료율',           en: 'Completion',        ja: '完了率' },

  // ── 탭 ──
  tabList:          { ko: '목록',             en: 'List',              ja: 'リスト' },
  tabCalendar:      { ko: '캘린더',           en: 'Calendar',          ja: 'カレンダー' },
  tabTimeline:      { ko: '타임라인',         en: 'Timeline',          ja: 'タイムライン' },
  tabReport:        { ko: '리포트',           en: 'Report',            ja: 'レポート' },
  tabTrash:         { ko: '휴지통',           en: 'Trash',             ja: 'ゴミ箱' },

  // ── 검색 ──
  searchPlaceholder:{ ko: '제목, 메모 또는 태그로 검색…', en: 'Search by title, notes or tags…', ja: 'タイトル、メモ、タグで検索…' },

  // ── 정렬 ──
  sortLabel:        { ko: '정렬',             en: 'Sort',              ja: '並替' },
  sortUrgency:      { ko: '긴급도',           en: 'Urgency',           ja: '緊急度' },
  sortDeadline:     { ko: '마감일',           en: 'Deadline',          ja: '締切日' },
  sortPriority:     { ko: '우선순위',         en: 'Priority',          ja: '優先度' },
  sortCreated:      { ko: '생성일',           en: 'Created',           ja: '作成日' },
  sortName:         { ko: '이름',             en: 'Name',              ja: '名前' },

  // ── 일괄 편집 ──
  bulkEdit:         { ko: '일괄 편집',        en: 'Bulk Edit',         ja: '一括編集' },
  bulkSelected:     { ko: '{n}개 선택',       en: '{n} selected',      ja: '{n}件選択' },
  bulkDelete:       { ko: '선택 삭제',        en: 'Delete Selected',   ja: '選択削除' },
  selectAll:        { ko: '전체 선택',        en: 'Select All',        ja: '全選択' },
  deselectAll:      { ko: '선택 해제',        en: 'Deselect All',      ja: '選択解除' },

  // ── 삭제 확인 ──
  confirmDelete:    { ko: '이 할 일을 삭제하시겠습니까?', en: 'Delete this task?', ja: 'このタスクを削除しますか？' },
  confirmBulkDel:   { ko: '완료된 {n}개의 할 일을 모두 삭제하시겠습니까?', en: 'Delete all {n} completed tasks?', ja: '完了した{n}件を全て削除しますか？' },

  // ── 빈 상태 ──
  noResults:        { ko: '검색 결과가 없습니다.', en: 'No results found.', ja: '検索結果がありません。' },
  noResultsHint:    { ko: '에 해당하는 할 일이 없어요.', en: 'No tasks match this search.', ja: 'に該当するタスクがありません。' },
  noFilterResults:  { ko: '해당 필터에 맞는 할 일이 없습니다.', en: 'No tasks match this filter.', ja: 'フィルタに一致するタスクがありません。' },
  noFilterHint:     { ko: '다른 필터를 선택하거나 새 할 일을 추가하세요.', en: 'Try another filter or add a task.', ja: '別のフィルタを選択するか、タスクを追加してください。' },
  noTasks:          { ko: '등록된 할 일이 없습니다.', en: 'No tasks yet.', ja: 'タスクがありません。' },
  noTasksHint:      { ko: '"할 일 추가" 버튼을 눌러 시작하세요.', en: 'Click "Add Task" to get started.', ja: '「タスク追加」ボタンで始めましょう。' },

  // ── 포모도로 ──
  pomodoro:         { ko: '포모도로',         en: 'Pomodoro',          ja: 'ポモドーロ' },
  pomodoroStart:    { ko: '포모도로 시작',    en: 'Start Pomodoro',    ja: 'ポモドーロ開始' },
  work:             { ko: '집중',             en: 'Focus',             ja: '集中' },
  break_:           { ko: '휴식',             en: 'Break',             ja: '休憩' },
  longBreak:        { ko: '긴 휴식',          en: 'Long Break',        ja: '長休憩' },
  idle:             { ko: '대기',             en: 'Idle',              ja: '待機' },
  pomoPause:        { ko: '일시정지',         en: 'Pause',             ja: '一時停止' },
  pomoResume:       { ko: '재개',             en: 'Resume',            ja: '再開' },
  pomoSkip:         { ko: '건너뛰기',         en: 'Skip',              ja: 'スキップ' },
  pomoStop:         { ko: '중지',             en: 'Stop',              ja: '停止' },

  // ── 시간 추적 ──
  timeTrack:        { ko: '시간 기록',        en: 'Track Time',        ja: '時間記録' },
  tracking:         { ko: '기록 중',          en: 'Tracking',          ja: '記録中' },
  totalTime:        { ko: '총',               en: 'Total',             ja: '合計' },
  lessThan1Min:     { ko: '1분 미만',         en: '< 1 min',           ja: '1分未満' },
  timeStart:        { ko: '작업 시간 기록 시작', en: 'Start time tracking', ja: '作業時間記録開始' },
  timeStop:         { ko: '작업 시간 기록 정지', en: 'Stop time tracking',  ja: '作業時間記録停止' },
  timeDurH:         { ko: '{h}시간 {m}분',    en: '{h}h {m}m',         ja: '{h}時間{m}分' },
  timeDurM:         { ko: '{m}분',            en: '{m}m',              ja: '{m}分' },

  // ── 서브태스크 ──
  addSubtask:       { ko: '세부 항목 추가...', en: 'Add subtask...',    ja: 'サブタスク追加...' },
  detailsShow:      { ko: '상세 보기',        en: 'Show Details',      ja: '詳細表示' },
  detailsAdd:       { ko: '상세 추가',        en: 'Add Details',       ja: '詳細追加' },
  progressLabel:    { ko: '진행률',           en: 'Progress',          ja: '進捗' },
  clickToAddNotes:  { ko: '클릭하여 메모를 입력하세요…', en: 'Click to add notes…', ja: 'クリックしてメモを追加…' },

  // ── 핀 ──
  pinTask:          { ko: '상단 고정',        en: 'Pin to Top',        ja: '上部固定' },
  unpinTask:        { ko: '고정 해제',        en: 'Unpin',             ja: '固定解除' },

  // ── 데이터 ──
  dataSync:         { ko: '데이터 & 동기화',  en: 'Data & Sync',       ja: 'データ＆同期' },
  exportJSON:       { ko: 'JSON 내보내기',    en: 'Export JSON',       ja: 'JSONエクスポート' },
  importJSON:       { ko: 'JSON 불러오기',    en: 'Import JSON',       ja: 'JSONインポート' },
  exportDesc:       { ko: '전체 할 일을 백업 파일로 저장', en: 'Save all tasks as backup', ja: '全タスクをバックアップ' },
  importDesc:       { ko: '백업 파일에서 병합 복원', en: 'Restore from backup file', ja: 'バックアップから復元' },
  serverSync:       { ko: '서버 API 동기화',  en: 'Server API Sync',   ja: 'サーバーAPI同期' },
  serverPlaceholder:{ ko: 'https://your-api.com/tasks', en: 'https://your-api.com/tasks', ja: 'https://your-api.com/tasks' },
  unsynced:         { ko: '미동기화',         en: 'Unsynced',          ja: '未同期' },
  unsyncedN:        { ko: '미동기화 {n}개',   en: '{n} unsynced',      ja: '未同期 {n}件' },
  syncing:          { ko: '동기화 중…',       en: 'Syncing…',          ja: '同期中…' },
  syncCount:        { ko: '동기화 {n}개',     en: 'Sync {n}',          ja: '同期 {n}件' },
  syncSuccess:      { ko: '{n}개의 할 일을 성공적으로 동기화했습니다.', en: 'Successfully synced {n} tasks.', ja: '{n}件のタスクを正常に同期しました。' },
  syncFail:         { ko: '동기화 실패: {msg}', en: 'Sync failed: {msg}', ja: '同期失敗: {msg}' },

  // ── 히트맵 ──
  heatmapShow:      { ko: '▼ 활동 기록 보기', en: '▼ Show Activity',   ja: '▼ アクティビティ表示' },
  heatmapHide:      { ko: '▲ 활동 기록 접기', en: '▲ Hide Activity',   ja: '▲ アクティビティ非表示' },
  heatmapTitle:     { ko: '활동 기록',        en: 'Activity',          ja: 'アクティビティ' },
  heatmapWeeks:     { ko: '최근 {n}주 · 완료 {c}건', en: 'Last {n} weeks · {c} done', ja: '直近{n}週 · 完了{c}件' },
  heatmapNone:      { ko: '완료 없음',        en: 'No completions',    ja: '完了なし' },
  heatmapDone:      { ko: '총 {n}건 완료',    en: '{n} completed',     ja: '合計{n}件完了' },
  heatmapCat:       { ko: '{cat} {n}건',      en: '{cat} {n}',         ja: '{cat} {n}件' },

  // ── 캘린더 ──
  calToday:         { ko: '오늘',             en: 'Today',             ja: '今日' },
  calYear:          { ko: '{y}년 {m}월',      en: '{m}/{y}',           ja: '{y}年{m}月' },
  calMonths:        { ko: '1월,2월,3월,4월,5월,6월,7월,8월,9월,10월,11월,12월', en: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec', ja: '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月' },
  calDays:          { ko: '일,월,화,수,목,금,토', en: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat', ja: '日,月,火,水,木,金,土' },
  calMore:          { ko: '+{n}', en: '+{n}', ja: '+{n}' },

  // ── 타임라인 ──
  today:            { ko: '오늘',             en: 'Today',             ja: '今日' },
  tomorrow:         { ko: '내일',             en: 'Tomorrow',          ja: '明日' },
  noTimelineTasks:  { ko: '이번 주 내 마감 예정인 작업이 없습니다.', en: 'No tasks due this week.', ja: '今週の締切タスクはありません。' },

  // ── 리포트 ──
  thisWeek:         { ko: '이번 주',          en: 'This Week',         ja: '今週' },
  thisMonth:        { ko: '이번 달',          en: 'This Month',        ja: '今月' },
  completed:        { ko: '완료',             en: 'Completed',         ja: '完了' },
  created:          { ko: '생성',             en: 'Created',           ja: '作成' },
  byCategory:       { ko: '카테고리별 완료',  en: 'By Category',       ja: 'カテゴリ別完了' },
  totalWorkTime:    { ko: '총 작업 시간',     en: 'Total Work Time',   ja: '総作業時間' },
  rptInProgress:    { ko: '진행 중',          en: 'In Progress',       ja: '進行中' },
  rptOverdue:       { ko: '기한 초과',        en: 'Overdue',           ja: '期限超過' },
  rptRate:          { ko: '완료율',           en: 'Completion Rate',   ja: '完了率' },
  rptDurH:          { ko: '{h}시간 {m}분',    en: '{h}h {m}m',         ja: '{h}時間{m}分' },
  rptDurM:          { ko: '{m}분',            en: '{m}m',              ja: '{m}分' },
  rptNone:          { ko: '-',                en: '-',                 ja: '-' },

  // ── 휴지통 ──
  trashItems:       { ko: '{n}개 항목 · 7일 후 자동 삭제', en: '{n} items · auto-delete after 7 days', ja: '{n}件 · 7日後に自動削除' },
  emptyTrash:       { ko: '휴지통 비우기',    en: 'Empty Trash',       ja: 'ゴミ箱を空にする' },
  emptyTrashConfirm:{ ko: '휴지통을 비우시겠습니까? 복구할 수 없습니다.', en: 'Empty trash? This cannot be undone.', ja: 'ゴミ箱を空にしますか？元に戻せません。' },
  trashEmpty:       { ko: '휴지통이 비어있습니다.', en: 'Trash is empty.', ja: 'ゴミ箱は空です。' },
  daysUntilDelete:  { ko: '{n}일 후 영구 삭제', en: 'Deleted in {n} days', ja: '{n}日後に完全削除' },
  restore:          { ko: '복구',             en: 'Restore',           ja: '復元' },
  loading:          { ko: '로딩 중...',       en: 'Loading...',        ja: '読込中...' },

  // ── 오늘 위젯 ──
  todayWidget:      { ko: '오늘 마감',        en: 'Due Today',         ja: '今日締切' },
  todayOverdue:     { ko: '기한 초과',        en: 'Overdue',           ja: '期限超過' },
  noDueToday:       { ko: '오늘 마감인 작업이 없습니다', en: 'Nothing due today', ja: '今日の締切はありません' },
  todayItems:       { ko: '{n}개',            en: '{n}',               ja: '{n}件' },

  // ── 카테고리 ──
  cat_study:        { ko: '공부',             en: 'Study',             ja: '勉強' },
  cat_work:         { ko: '작업',             en: 'Work',              ja: '作業' },
  cat_deadline:     { ko: '마감',             en: 'Deadline',          ja: '締切' },
  cat_3d:           { ko: '3D',               en: '3D',                ja: '3D' },
  cat_dev:          { ko: '개발',             en: 'Dev',               ja: '開発' },
  cat_etc:          { ko: '기타',             en: 'Other',             ja: 'その他' },

  // ── 다크/라이트 ──
  darkMode:         { ko: '다크 모드로 전환',  en: 'Switch to Dark',    ja: 'ダークモードに切替' },
  lightMode:        { ko: '라이트 모드로 전환', en: 'Switch to Light',   ja: 'ライトモードに切替' },

  // ── 알림 ──
  notifOn:          { ko: '알림 켜기',        en: 'Enable Alerts',     ja: '通知オン' },
  notifOff:         { ko: '알림 끄기',        en: 'Disable Alerts',    ja: '通知オフ' },
  notifTitle:       { ko: '마감 1시간 전',    en: '1 hour before deadline', ja: '締切1時間前' },
  notifBody:        { ko: '"{t}" 마감이 1시간 이내로 다가왔습니다.', en: '"{t}" is due within 1 hour.', ja: '「{t}」の締切が1時間以内です。' },

  // ── 정렬 삭제 ──
  deleteDone:       { ko: '완료 {n}개 삭제',  en: 'Delete {n} done',   ja: '完了{n}件削除' },

  // ── 히트맵 요일 ──
  heatDays:         { ko: '월,,수,,금,,일',   en: 'Mon,,Wed,,Fri,,Sun', ja: '月,,水,,金,,日' },
} as const;

export type TransKey = keyof typeof translations;

export function t(key: TransKey, locale: Locale, vars?: Record<string, string | number>): string {
  let str: string = translations[key]?.[locale] ?? translations[key]?.['ko'] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};
