'use client'
import { LongTermGoal, MidTermTheme } from '@/types'
import { getThemeColor } from '@/lib/utils'
import { PinIcon, MountainIcon } from '@/components/Icons'

interface Props {
  goals: LongTermGoal[]
  themes: MidTermTheme[]
}

export default function RightPanel({ goals, themes }: Props) {
  const getColor = (themeId: string) => getThemeColor(themeId, themes, goals) ?? '#6366f1'

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto"
      style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>

      {/* 中期テーマ */}
      <section>
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <PinIcon size={8} /> 中期テーマ
        </h3>
        {themes.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>テーマを登録しましょう</p>
        ) : (
          <div className="flex flex-col gap-2">
            {themes.map(t => {
              const goal = goals.find(g => g.id === t.relatedGoalId)
              const color = getColor(t.id)
              return (
                <div key={t.id} className="rounded-lg p-3" style={{ background: 'var(--surface2)', borderLeft: `3px solid ${color}` }}>
                  <p className="text-xs font-medium">{t.title}</p>
                  {goal && <p className="text-xs mt-0.5" style={{ color }}>→ {goal.title}</p>}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 長期目標 */}
      <section>
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <MountainIcon size={8} /> 長期目標
        </h3>
        {goals.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>目標を登録しましょう</p>
        ) : (
          <div className="flex flex-col gap-2">
            {goals.map(g => (
              <div key={g.id} className="rounded-lg p-3 text-xs" style={{ background: 'var(--surface2)' }}>
                <p className="font-medium">{g.title}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
