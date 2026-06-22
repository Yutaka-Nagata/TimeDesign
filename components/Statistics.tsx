'use client'
import { useState, useMemo } from 'react'
import { Task, MidTermTheme, LongTermGoal } from '@/types'
import { addDays } from '@/lib/utils'

interface Props {
  tasks: Task[]
  themes: MidTermTheme[]
  goals: LongTermGoal[]
}

type Period = 'total' | 'year' | 'month' | 'week'

interface SliceData {
  color: string
  deg: number
  label: string
  minutes: number
  pct: number
}

// ── ユーティリティ ─────────────────────────────────────────

function fmt(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function mondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

function toIso(d: Date): string {
  return d.toLocaleDateString('sv')
}

// hex → rgba（テーマ別の明度バリエーション用）
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── 円グラフ SVG ──────────────────────────────────────────

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  if (end - start >= 359.99) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
  }
  const s = polarXY(cx, cy, r, start)
  const e = polarXY(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

function PieChart({
  slices, total, hovered, onHover,
}: {
  slices: SliceData[]
  total: number
  hovered: number | null
  onHover: (i: number | null) => void
}) {
  const cx = 150, cy = 150, r = 130, holeR = 78
  let cur = 0
  const active = hovered !== null ? slices[hovered] : null

  return (
    <div className="relative flex items-center justify-center w-full max-w-[300px]">
      <svg viewBox="0 0 300 300" className="w-full" style={{ overflow: 'visible' }}>
        {slices.map((s, i) => {
          const start = cur
          const end = cur + s.deg
          cur = end
          const isHov = hovered === i
          return (
            <path
              key={i}
              d={slicePath(cx, cy, isHov ? r + 10 : r, start, end)}
              fill={s.color}
              stroke="var(--background)"
              strokeWidth={2}
              style={{ cursor: 'pointer', transition: 'd 0.12s ease' }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={holeR} fill="var(--background)" style={{ pointerEvents: 'none' }} />
      </svg>

      {/* 中央オーバーレイ */}
      <div className="absolute pointer-events-none flex items-center justify-center">
        {active ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '8px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            textAlign: 'center',
            maxWidth: 140,
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2, wordBreak: 'keep-all', overflowWrap: 'break-word', lineHeight: 1.3 }}>
              {active.label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
              {fmt(active.minutes)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
              {active.pct}%
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>合計</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{fmt(total)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 帯グラフ（長期目標単位）───────────────────────────────

const ALPHA_STEPS = [1, 0.72, 0.52, 0.38, 0.28]

function GoalBar({
  goal, color, totalMin, grandTotal, themeItems,
}: {
  goal: LongTermGoal | null
  color: string
  totalMin: number
  grandTotal: number
  themeItems: { theme: MidTermTheme | null; minutes: number }[]
}) {
  const goalPct = Math.round((totalMin / grandTotal) * 100)

  return (
    <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-xs font-semibold" style={{ color }}>{goal?.title ?? '未分類'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{fmt(totalMin)}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>全体の{goalPct}%</span>
        </div>
      </div>

      {/* 積み上げ帯グラフ */}
      <div className="flex rounded-lg overflow-hidden" style={{ height: 52 }}>
        {themeItems.map((th, i) => {
          const pctOfGoal = (th.minutes / totalMin) * 100
          const alpha = ALPHA_STEPS[i] ?? 0.2
          const bg = color.startsWith('#') ? hexAlpha(color, alpha) : color
          const showLabel = pctOfGoal >= 12
          return (
            <div
              key={i}
              style={{
                width: `${pctOfGoal}%`,
                background: bg,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 4px',
                borderRight: i < themeItems.length - 1 ? '1px solid var(--background)' : undefined,
                overflow: 'hidden',
              }}
            >
              {showLabel && (
                <>
                  <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    {th.theme?.title ?? 'なし'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    {Math.round(pctOfGoal)}%
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 凡例（時間表示） */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
        {themeItems.map((th, i) => {
          const alpha = ALPHA_STEPS[i] ?? 0.2
          const dotColor = color.startsWith('#') ? hexAlpha(color, alpha) : color
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: dotColor }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {th.theme?.title ?? 'テーマなし'}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{fmt(th.minutes)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── メインコンポーネント ───────────────────────────────────

export default function Statistics({ tasks, themes, goals }: Props) {
  const today = new Date()
  const [period, setPeriod] = useState<Period>('month')
  const [refDate, setRefDate] = useState(() => toIso(today))
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)

  const periodLabel = useMemo(() => {
    if (period === 'total') return 'トータル'
    if (period === 'year') return refDate.slice(0, 4) + '年'
    if (period === 'month') return refDate.slice(0, 7).replace('-', '年') + '月'
    const mon = mondayOf(new Date(refDate + 'T00:00:00'))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return `${mon.getMonth() + 1}/${mon.getDate()} 〜 ${sun.getMonth() + 1}/${sun.getDate()}`
  }, [period, refDate])

  function shift(dir: 1 | -1) {
    if (period === 'year') {
      setRefDate(`${parseInt(refDate.slice(0, 4)) + dir}-01-01`)
    } else if (period === 'month') {
      const d = new Date(refDate + 'T00:00:00')
      d.setMonth(d.getMonth() + dir)
      setRefDate(toIso(d))
    } else if (period === 'week') {
      setRefDate(addDays(refDate, dir * 7))
    }
  }

  const filtered = useMemo(() => {
    if (period === 'total') return tasks
    if (period === 'year') return tasks.filter(t => t.date.startsWith(refDate.slice(0, 4)))
    if (period === 'month') return tasks.filter(t => t.date.startsWith(refDate.slice(0, 7)))
    const mon = toIso(mondayOf(new Date(refDate + 'T00:00:00')))
    const sun = addDays(mon, 6)
    return tasks.filter(t => t.date >= mon && t.date <= sun)
  }, [tasks, period, refDate])

  const byTheme = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of filtered) {
      const key = t.relatedThemeId || '__none__'
      map[key] = (map[key] || 0) + t.estimatedMinutes
    }
    return map
  }, [filtered])

  const total = Object.values(byTheme).reduce((s, v) => s + v, 0)

  const groups = useMemo(() => {
    const result: {
      goal: LongTermGoal | null
      color: string
      totalMin: number
      themes: { theme: MidTermTheme | null; minutes: number }[]
    }[] = []

    const seen = new Set<string | null>()
    for (const goal of [...goals, null] as (LongTermGoal | null)[]) {
      const gid = goal?.id ?? null
      const relThemes = goal
        ? themes.filter(th => th.relatedGoalId === goal.id)
        : themes.filter(th => !goals.find(g => g.id === th.relatedGoalId))

      const themeItems: { theme: MidTermTheme | null; minutes: number }[] = []
      let gTotal = 0

      for (const th of relThemes) {
        const min = byTheme[th.id] ?? 0
        if (min > 0) { themeItems.push({ theme: th, minutes: min }); gTotal += min }
      }

      if (!goal && (byTheme['__none__'] ?? 0) > 0) {
        themeItems.push({ theme: null, minutes: byTheme['__none__'] })
        gTotal += byTheme['__none__']
      }

      if (gTotal > 0 && !seen.has(gid)) {
        seen.add(gid)
        result.push({ goal, color: goal?.color ?? '#888', totalMin: gTotal, themes: themeItems })
      }
    }
    return result
  }, [byTheme, themes, goals])

  const slices = useMemo<SliceData[]>(() => {
    if (total === 0) return []
    return groups.flatMap(g =>
      g.themes.map(th => ({
        color: g.color,
        deg: (th.minutes / total) * 360,
        label: th.theme?.title ?? 'テーマなし',
        minutes: th.minutes,
        pct: Math.round((th.minutes / total) * 100),
      }))
    )
  }, [groups, total])

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'total', label: 'トータル' },
    { key: 'year', label: '年' },
    { key: 'month', label: '月' },
    { key: 'week', label: '週' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* 期間セレクター */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface2)' }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className="flex-1 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: period === p.key ? 'var(--accent)' : 'transparent',
                color: period === p.key ? '#fff' : 'var(--text-muted)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        {period !== 'total' && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => shift(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>‹</button>
            <span className="text-sm font-medium min-w-36 text-center">{periodLabel}</span>
            <button onClick={() => shift(1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>›</button>
          </div>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
          この期間にタスクがありません
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full">
          <PieChart slices={slices} total={total} hovered={hoveredSlice} onHover={setHoveredSlice} />

          <div className="w-full flex flex-col gap-3">
            {groups.map((g, i) => (
              <GoalBar
                key={i}
                goal={g.goal}
                color={g.color}
                totalMin={g.totalMin}
                grandTotal={total}
                themeItems={g.themes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
