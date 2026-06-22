interface TaskTemplateBase {
  id: string
  title: string
  estimatedMinutes: number
  memo: string
  relatedThemeId: string
}

export interface ReusableTemplate extends TaskTemplateBase {
  templateType: 'reusable'
}

export interface TodoTemplate extends TaskTemplateBase {
  templateType: 'todo'
  dueDate?: string
}

export type TaskTemplate = ReusableTemplate | TodoTemplate

export interface Task {
  id: string
  date: string
  startTime: string
  title: string
  estimatedMinutes: number
  memo: string
  relatedThemeId: string
  isDone: boolean
  templateId?: string
}

export interface LongTermGoal {
  id: string
  title: string
  color: string
}

export interface MidTermTheme {
  id: string
  title: string
  relatedGoalId: string
}

export interface TemplateEntry {
  taskId: string
  startTime: string
}

export interface Template {
  id: string
  name: string
  isDefault?: boolean
  entries: TemplateEntry[]
}
