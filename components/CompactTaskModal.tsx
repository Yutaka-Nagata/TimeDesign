'use client'
import { useState, useEffect, useRef } from 'react'
import { Task, MidTermTheme, LongTermGoal } from '@/types'
import { getThemeColor, addMinutes, formatDuration, sortThemesByGoal } from '@/lib/utils'
import { TrashIcon, CheckIcon, XmarkIcon } from '@/components/Icons'

interface Props {
  task?: Task
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  defaultDate: string
  defaultStart: string
  defaultEstimated?: number
  onSave: (task: Task) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export default function CompactTaskModal({
  task, themes, goals, defaultDate, defaultStart, defaultEstimated = 60,
  onSave, onDelete, onClose,
}: Props) {
  const [form, setForm] = useState<Task>(task ?? {
    id: '',
    date: defaultDate,
    startTime: defaultStart,
    title: '',
    estimatedMinutes: defaultEstimated,
    memo: '',
    relatedThemeId: '',
    isDone: false,
  })
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const color = getThemeColor(form.relatedThemeId, themes, goals)
  const endTime = addMinutes(form.startTime, form.estimatedMinutes)
  const duration = formatDuration(form.estimatedMinutes)

  function set<K extends keyof Task>(k: K, v: Task[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleSave() {
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="rounded-2xl shadow-2xl overflow-hidden w-full mx-4 sm:mx-0 sm:w-[480px]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* status + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => set('isDone', !form.isDone)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: form.isDone ? '#10b981' : 'var(--surface2)',
                border: '2px solid ' + (form.isDone ? '#10b981' : 'var(--border)'),
              }}>
              {form.isDone && <CheckIcon size={8} className="text-white" />}
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {form.isDone ? '完了' : '未完了'}
            </span>
          </div>
          <button onClick={onClose} className="opacity-40 hover:opacity-80 transition-opacity"><XmarkIcon size={11} /></button>
        </div>

        {/* title */}
        <div className="px-5 pb-3 pt-2">
          <input
            ref={titleRef}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            onKeyDown={handleKey}
            placeholder="タスク名を入力"
            className="w-full text-xl font-semibold bg-transparent outline-none placeholder:opacity-30"
            style={{ color: 'var(--text)' }}
          />
        </div>

        {/* theme select */}
        <div className="px-5 pb-4 flex items-center gap-2">
          {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />}
          <select
            value={form.relatedThemeId}
            onChange={e => set('relatedThemeId', e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: 'var(--surface2)',
              border: `1.5px solid ${color ?? 'var(--border)'}`,
              color: color ?? 'var(--text-muted)',
              outline: 'none',
            }}>
            <option value="">中期テーマを選択（任意）</option>
            {sortThemesByGoal(themes, goals).map(t => {
              const c = getThemeColor(t.id, themes, goals)
              return <option key={t.id} value={t.id} style={{ color: c }}>{t.title}</option>
            })}
          </select>
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* time row */}
        <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
          <input type="time" value={form.startTime}
            onChange={e => set('startTime', e.target.value)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{endTime}</span>
          <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{duration}</span>
          <div className="flex items-center gap-1 ml-auto">
            <input type="number" min={5} max={480} step={5}
              value={form.estimatedMinutes}
              onChange={e => set('estimatedMinutes', Math.max(5, Number(e.target.value)))}
              className="w-16 px-2 py-2 rounded-lg text-sm text-center"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>分</span>
          </div>
          <input type="date" value={form.date}
            onChange={e => set('date', e.target.value)}
            className="px-2 py-2 rounded-lg text-xs"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', outline: 'none' }} />
        </div>

        {/* memo */}
        <div className="px-5 pb-4">
          <input value={form.memo} onChange={e => set('memo', e.target.value)} onKeyDown={handleKey}
            placeholder="メモ（任意）"
            className="w-full text-sm bg-transparent outline-none placeholder:opacity-30"
            style={{ color: 'var(--text-muted)' }} />
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        {/* actions */}
        <div className="px-5 py-3 flex items-center gap-2">
          {task && onDelete && (
            <button type="button"
              onClick={() => {
                if (window.confirm(`「${task.title}」を削除しますか？`)) { onDelete(task.id); onClose() }
              }}
              className="px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: '#ef444422', color: '#ef4444' }}>
              <TrashIcon />
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: 'var(--text-muted)' }}>キャンセル</button>
          <button type="button" onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: color ?? 'var(--accent)', color: '#fff' }}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
