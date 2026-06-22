import { LongTermGoal, MidTermTheme, Task, TaskTemplate, Template } from '@/types'

const KEYS = {
  longTermGoals: 'td_v2_long_term_goals',
  midTermThemes: 'td_v2_mid_term_themes',
  tasks: 'td_v2_tasks',
  taskTemplates: 'td_v2_task_templates',
  templates: 'td_v2_templates',
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const storage = {
  getLongTermGoals: () => load<LongTermGoal>(KEYS.longTermGoals),
  saveLongTermGoals: (data: LongTermGoal[]) => save(KEYS.longTermGoals, data),

  getMidTermThemes: () => load<MidTermTheme>(KEYS.midTermThemes),
  saveMidTermThemes: (data: MidTermTheme[]) => save(KEYS.midTermThemes, data),

  getTasks: () => load<Task>(KEYS.tasks),
  saveTasks: (data: Task[]) => save(KEYS.tasks, data),

  getTaskTemplates: () => load<TaskTemplate>(KEYS.taskTemplates),
  saveTaskTemplates: (data: TaskTemplate[]) => save(KEYS.taskTemplates, data),

  getTemplates: () => load<Template>(KEYS.templates),
  saveTemplates: (data: Template[]) => save(KEYS.templates, data),
}
