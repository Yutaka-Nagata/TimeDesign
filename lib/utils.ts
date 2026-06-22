import { LongTermGoal, MidTermTheme } from '@/types'

export function sortThemesByGoal(themes: MidTermTheme[], goals: LongTermGoal[]): MidTermTheme[] {
  return [...themes].sort((a, b) => {
    const ai = goals.findIndex(g => g.id === a.relatedGoalId)
    const bi = goals.findIndex(g => g.id === b.relatedGoalId)
    return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi)
  })
}

export function getThemeColor(
  themeId: string | undefined,
  themes: MidTermTheme[],
  goals: LongTermGoal[]
): string | undefined {
  if (!themeId) return undefined
  const theme = themes.find(t => t.id === themeId)
  if (!theme) return undefined
  return goals.find(g => g.id === theme.relatedGoalId)?.color
}

export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}:00`
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return mins
}

export function todayStr(): string {
  return new Date().toLocaleDateString('sv')
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
