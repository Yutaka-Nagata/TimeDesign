import { supabase } from './supabase'
import { LongTermGoal, MidTermTheme, Task, TaskTemplate, Template } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────

async function uid(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

// ── Row → TS mappers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function toGoal(r: Row): LongTermGoal {
  return { id: r.id, title: r.title, color: r.color }
}

function toTheme(r: Row): MidTermTheme {
  return { id: r.id, title: r.title, relatedGoalId: r.related_goal_id ?? '' }
}

function toTask(r: Row): Task {
  return {
    id: r.id,
    date: r.date,
    startTime: r.start_time,
    title: r.title,
    estimatedMinutes: r.estimated_minutes,
    memo: r.memo ?? '',
    relatedThemeId: r.related_theme_id ?? '',
    isDone: r.is_done,
    templateId: r.template_id ?? undefined,
  }
}

function toTaskTemplate(r: Row): TaskTemplate {
  const base = {
    id: r.id,
    title: r.title,
    estimatedMinutes: r.estimated_minutes,
    memo: r.memo ?? '',
    relatedThemeId: r.related_theme_id ?? '',
  }
  if (r.template_type === 'todo') {
    return { ...base, templateType: 'todo', dueDate: r.due_date ?? undefined }
  }
  return { ...base, templateType: 'reusable' }
}

function toTemplate(r: Row): Template {
  return {
    id: r.id,
    name: r.name,
    isDefault: r.is_default,
    entries: r.entries,
  }
}

// ── Long Term Goals ───────────────────────────────────────────────────────

export async function getLongTermGoals(): Promise<LongTermGoal[]> {
  const { data, error } = await supabase
    .from('long_term_goals')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(toGoal)
}

export async function upsertLongTermGoal(goal: LongTermGoal): Promise<void> {
  const userId = await uid()
  const { error } = await supabase.from('long_term_goals').upsert({
    id: goal.id, user_id: userId, title: goal.title, color: goal.color,
  })
  if (error) throw error
}

export async function deleteLongTermGoal(id: string): Promise<void> {
  const { error } = await supabase.from('long_term_goals').delete().eq('id', id)
  if (error) throw error
}

// ── Mid Term Themes ───────────────────────────────────────────────────────

export async function getMidTermThemes(): Promise<MidTermTheme[]> {
  const { data, error } = await supabase
    .from('mid_term_themes')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(toTheme)
}

export async function upsertMidTermTheme(theme: MidTermTheme): Promise<void> {
  const userId = await uid()
  const { error } = await supabase.from('mid_term_themes').upsert({
    id: theme.id, user_id: userId, title: theme.title,
    related_goal_id: theme.relatedGoalId || null,
  })
  if (error) throw error
}

export async function deleteMidTermTheme(id: string): Promise<void> {
  const { error } = await supabase.from('mid_term_themes').delete().eq('id', id)
  if (error) throw error
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('date')
    .order('start_time')
  if (error) throw error
  return (data ?? []).map(toTask)
}

export async function upsertTask(task: Task): Promise<void> {
  const userId = await uid()
  const { error } = await supabase.from('tasks').upsert({
    id: task.id,
    user_id: userId,
    date: task.date,
    start_time: task.startTime,
    title: task.title,
    estimated_minutes: task.estimatedMinutes,
    memo: task.memo ?? '',
    related_theme_id: task.relatedThemeId || null,
    is_done: task.isDone,
    template_id: task.templateId ?? null,
  })
  if (error) throw error
}

export async function upsertTasks(tasks: Task[]): Promise<void> {
  if (!tasks.length) return
  const userId = await uid()
  const { error } = await supabase.from('tasks').upsert(
    tasks.map(task => ({
      id: task.id,
      user_id: userId,
      date: task.date,
      start_time: task.startTime,
      title: task.title,
      estimated_minutes: task.estimatedMinutes,
      memo: task.memo ?? '',
      related_theme_id: task.relatedThemeId || null,
      is_done: task.isDone,
      template_id: task.templateId ?? null,
    }))
  )
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function deleteTasksByDates(userId: string, dates: string[]): Promise<void> {
  if (!dates.length) return
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .in('date', dates)
  if (error) throw error
}

// ── Task Templates ────────────────────────────────────────────────────────

export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(toTaskTemplate)
}

export async function upsertTaskTemplate(t: TaskTemplate): Promise<void> {
  const userId = await uid()
  const { error } = await supabase.from('task_templates').upsert({
    id: t.id,
    user_id: userId,
    title: t.title,
    estimated_minutes: t.estimatedMinutes,
    memo: t.memo ?? '',
    related_theme_id: t.relatedThemeId || null,
    template_type: t.templateType,
    due_date: t.templateType === 'todo' ? (t.dueDate ?? null) : null,
  })
  if (error) throw error
}

export async function deleteTaskTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('task_templates').delete().eq('id', id)
  if (error) throw error
}

// ── Schedule Templates ────────────────────────────────────────────────────

export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(toTemplate)
}

export async function upsertTemplate(t: Template): Promise<void> {
  const userId = await uid()
  const { error } = await supabase.from('templates').upsert({
    id: t.id, user_id: userId, name: t.name,
    is_default: t.isDefault ?? false, entries: t.entries,
  })
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw error
}

// ── Bulk import / export ──────────────────────────────────────────────────

type BulkData = {
  goals: LongTermGoal[]
  themes: MidTermTheme[]
  taskTemplates: TaskTemplate[]
  templates: Template[]
  tasks: Task[]
}

export async function importAll(data: BulkData): Promise<void> {
  const userId = await uid()

  // Delete existing data (order matters: tasks before templates/themes/goals)
  await supabase.from('tasks').delete().eq('user_id', userId)
  await supabase.from('task_templates').delete().eq('user_id', userId)
  await supabase.from('templates').delete().eq('user_id', userId)
  await supabase.from('mid_term_themes').delete().eq('user_id', userId)
  await supabase.from('long_term_goals').delete().eq('user_id', userId)

  if (data.goals.length) {
    const { error } = await supabase.from('long_term_goals').insert(
      data.goals.map(g => ({ id: g.id, user_id: userId, title: g.title, color: g.color }))
    )
    if (error) throw error
  }
  if (data.themes.length) {
    const { error } = await supabase.from('mid_term_themes').insert(
      data.themes.map(t => ({
        id: t.id, user_id: userId, title: t.title, related_goal_id: t.relatedGoalId || null,
      }))
    )
    if (error) throw error
  }
  if (data.taskTemplates.length) {
    const { error } = await supabase.from('task_templates').insert(
      data.taskTemplates.map(t => ({
        id: t.id, user_id: userId, title: t.title, estimated_minutes: t.estimatedMinutes,
        memo: t.memo ?? '', related_theme_id: t.relatedThemeId || null,
        template_type: t.templateType,
        due_date: t.templateType === 'todo' ? (t.dueDate ?? null) : null,
      }))
    )
    if (error) throw error
  }
  if (data.templates.length) {
    const { error } = await supabase.from('templates').insert(
      data.templates.map(t => ({
        id: t.id, user_id: userId, name: t.name,
        is_default: t.isDefault ?? false, entries: t.entries,
      }))
    )
    if (error) throw error
  }
  if (data.tasks.length) {
    const { error } = await supabase.from('tasks').insert(
      data.tasks.map(task => ({
        id: task.id, user_id: userId, date: task.date, start_time: task.startTime,
        title: task.title, estimated_minutes: task.estimatedMinutes, memo: task.memo ?? '',
        related_theme_id: task.relatedThemeId || null, is_done: task.isDone,
        template_id: task.templateId ?? null,
      }))
    )
    if (error) throw error
  }
}

export async function exportAll(): Promise<BulkData> {
  const [goals, themes, taskTemplates, templates, tasks] = await Promise.all([
    getLongTermGoals(),
    getMidTermThemes(),
    getTaskTemplates(),
    getTemplates(),
    getTasks(),
  ])
  return { goals, themes, taskTemplates, templates, tasks }
}
