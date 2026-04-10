export type TaskCategory = '공부' | '작업' | '마감' | '3D' | '개발' | '기타';

export const CATEGORIES: TaskCategory[] = ['공부', '작업', '마감', '3D', '개발', '기타'];

export interface CategoryStyle {
  dot: string;      // 잔디 색상 (hex)
  bg: string;       // 배지 배경
  text: string;     // 배지 텍스트
  border: string;   // 배지 테두리
  darkBg: string;   // 다크모드 배지 배경
  darkText: string; // 다크모드 배지 텍스트
}

export const CATEGORY_STYLES: Record<TaskCategory, CategoryStyle> = {
  '공부': {
    dot:      '#6366F1',
    bg:       '#EEF2FF',
    text:     '#4338CA',
    border:   '#C7D2FE',
    darkBg:   '#1e1b4b',
    darkText: '#a5b4fc',
  },
  '작업': {
    dot:      '#F59E0B',
    bg:       '#FFFBEB',
    text:     '#92400E',
    border:   '#FDE68A',
    darkBg:   '#1c1307',
    darkText: '#fcd34d',
  },
  '마감': {
    dot:      '#F43F5E',
    bg:       '#FFF1F2',
    text:     '#9F1239',
    border:   '#FECDD3',
    darkBg:   '#1c0a0d',
    darkText: '#fda4af',
  },
  '3D': {
    dot:      '#8B5CF6',
    bg:       '#F5F3FF',
    text:     '#5B21B6',
    border:   '#DDD6FE',
    darkBg:   '#1e1233',
    darkText: '#c4b5fd',
  },
  '개발': {
    dot:      '#10B981',
    bg:       '#ECFDF5',
    text:     '#065F46',
    border:   '#A7F3D0',
    darkBg:   '#052e16',
    darkText: '#6ee7b7',
  },
  '기타': {
    dot:      '#64748B',
    bg:       '#F8FAFC',
    text:     '#475569',
    border:   '#CBD5E1',
    darkBg:   '#0f172a',
    darkText: '#94a3b8',
  },
};
