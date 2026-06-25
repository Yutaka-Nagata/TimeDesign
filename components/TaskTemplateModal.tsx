'use client'
import { useState } from 'react'
import { TaskTemplate, MidTermTheme, LongTermGoal } from '@/types'
import { sortThemesByGoal } from '@/lib/utils'
import { TrashIcon, XmarkIcon, RecycleIcon, CheckboxIcon } from '@/components/Icons'

interface Props {
  taskTemplate?: TaskTemplate
  defaultType?: 'todo' | 'reusable'
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  onSave: (t: TaskTemplate) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function TaskTemplateModal({ taskTemplate, defaultType, themes, goals, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState({
    id: taskTemplate?.id ?? '',
    title: taskTemplate?.title ?? '',
    estimatedMinutes: taskTemplate?.estimatedMinutes ?? 30,
    memo: taskTemplate?.memo ?? '',
    relatedThemeId: taskTemplate?.relatedThemeId ?? '',
    templateType: (taskTemplate?.templateType ?? defaultType ?? 'reusable') as 'reusable' | 'todo',
    dueDate: taskTemplate?.templateType === 'todo' ? (taskTemplate.dueDate ?? '') : '',
  })
  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }))

  const minutesValid = form.estimatedMinutes >= 5

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !minutesValid) return
    const base = { id: form.id, title: form.title, estimatedMinutes: form.estimatedMinutes, memo: form.memo, relatedThemeId: form.relatedThemeId }
    const t: TaskTemplate = form.templateType === 'todo'
      ? { ...base, templateType: 'todo', dueDate: form.dueDate || undefined }
      : { ...base, templateType: 'reusable' }
    onSave(t)
    onClose()
  }

  const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', width: '100%', outline: 'none' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-xl shadow-2xl p-5 flex flex-col gap-3 w-full mx-4 sm:mx-0 sm:w-[400px]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{taskTemplate ? 'タスクを編集' : 'タスクを追加'}</h3>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><XmarkIcon size={11} /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>タイトル *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required style={inputStyle} placeholder="タスク名" />
          </div>

          <div className="flex gap-2">
            {(['reusable', 'todo'] as const).map(type => (
              <button key={type} type="button" onClick={() => set('templateType', type)}
                className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{ background: form.templateType === type ? 'var(--accent)' : 'var(--surface2)', color: form.templateType === type ? '#fff' : 'var(--text-muted)' }}>
                {type === 'reusable' ? <><RecycleIcon size={8} className="mr-1" /> Reuse</> : <><CheckboxIcon size={8} className="mr-1" /> Todo</>}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>見積もり時間（分）</label>
            <input type="number" min={5} step={5} value={form.estimatedMinutes}
              onChange={e => set('estimatedMinutes', Number(e.target.value))}
              style={{ ...inputStyle, border: `1px solid ${!minutesValid ? '#ef4444' : 'var(--border)'}` }} />
            {!minutesValid && <span className="text-xs" style={{ color: '#ef4444' }}>5以上の値を入力してください</span>}
          </div>

          {form.templateType === 'todo' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>期日（任意）</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>中期テーマ</label>
            <select value={form.relatedThemeId} onChange={e => set('relatedThemeId', e.target.value)} style={inputStyle}>
              <option value="">なし</option>
              {sortThemesByGoal(themes, goals).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>メモ</label>
            <input value={form.memo} onChange={e => set('memo', e.target.value)} style={inputStyle} placeholder="メモ（任意）" />
          </div>

          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={!form.title.trim() || !minutesValid}
              className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {taskTemplate ? '更新' : '追加'}
            </button>
            {taskTemplate && (
              <button type="button"
                onClick={() => { if (window.confirm(`「${taskTemplate.title}」を削除しますか？`)) { onDelete(taskTemplate.id); onClose() } }}
                className="px-4 py-2 rounded-lg" style={{ background: '#ef444422', color: '#ef4444' }}>
                <TrashIcon />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
