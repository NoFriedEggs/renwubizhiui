
export enum QuadrantId {
  DoFirst = 'q1',   // Urgent & Important
  Schedule = 'q2',  // Not Urgent & Important
  Delegate = 'q3',  // Urgent & Not Important
  Delete = 'q4'     // Not Urgent & Not Important
}

export interface Task {
  id: string;
  content: string;
  quadrant: QuadrantId;
  createdAt: number;
  completed: boolean;
  subtasks?: SubTask[];
  isAiGenerated?: boolean;
}

export interface SubTask {
  id: string;
  content: string;
  completed: boolean;
}

export interface AIAnalysisResult {
  quadrant: QuadrantId;
  reasoning: string;
  subtasks: string[];
}

export interface WallpaperStyle {
  titleFontSize: number;  // px
  taskFontSize: number;   // px
  paddingPercent: number; // %
  lineGap: number;        // px
}

export interface AppSettings {
  apiKey: string;
  apiBaseUrl: string;
  wallpaperPath?: string;
  wallpaperResolution?: string; // e.g. '1920x1080', '2560x1440'
  wallpaperStyle?: WallpaperStyle;
}

export const QUADRANT_CONFIG = {
  [QuadrantId.DoFirst]: {
    title: '重要且紧急',
    subtitle: '立即去做 (Do First)',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    hover: 'hover:border-red-400 dark:hover:border-red-700',
    icon: '🔥'
  },
  [QuadrantId.Schedule]: {
    title: '重要不紧急',
    subtitle: '计划去做 (Schedule)',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900/50',
    hover: 'hover:border-blue-400 dark:hover:border-blue-700',
    icon: '📅'
  },
  [QuadrantId.Delegate]: {
    title: '紧急不重要',
    subtitle: '授权他人 (Delegate)',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-900/50',
    hover: 'hover:border-green-400 dark:hover:border-green-700',
    icon: '👥'
  },
  [QuadrantId.Delete]: {
    title: '不重要不紧急',
    subtitle: '尽量不做 (Eliminate)',
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-slate-900/50',
    border: 'border-gray-200 dark:border-slate-800',
    hover: 'hover:border-gray-400 dark:hover:border-slate-600',
    icon: '🗑️'
  }
};
