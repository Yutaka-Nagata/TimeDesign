'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import Modal from '@/components/Modal'
import { InputField, SelectField, SubmitButton } from '@/components/FormField'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import { LongTermGoal, MidTermTheme } from '@/types'
import { THEME_COLORS } from '@/lib/colors'
import { v4 as uuid } from 'uuid'
import { PenIcon, TrashIcon } from '@/components/Icons'

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<LongTermGoal[]>([])
  const [themes, setThemes] = useState<MidTermTheme[]>([])
  const [goalModal, setGoalModal] = useState<LongTermGoal | true | null>(null)
  const [themeModal, setThemeModal] = useState<MidTermTheme | true | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      Promise.all([
        db.getLongTermGoals().then(setGoals),
        db.getMidTermThemes().then(setThemes),
      ]).catch(console.error)
    })
  }, [router])

  function handleSaveGoal(g: LongTermGoal) {
    const toSave = { ...g, id: g.id || uuid() }
    setGoals(prev => {
      const exists = prev.find(x => x.id === toSave.id)
      return exists ? prev.map(x => x.id === toSave.id ? toSave : x) : [...prev, toSave]
    })
    db.upsertLongTermGoal(toSave).catch(console.error)
  }
  function handleDeleteGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
    db.deleteLongTermGoal(id).catch(console.error)
  }

  function handleSaveTheme(t: MidTermTheme) {
    const toSave = { ...t, id: t.id || uuid() }
    setThemes(prev => {
      const exists = prev.find(x => x.id === toSave.id)
      return exists ? prev.map(x => x.id === toSave.id ? toSave : x) : [...prev, toSave]
    })
    db.upsertMidTermTheme(toSave).catch(console.error)
  }
  function handleDeleteTheme(id: string) {
    setThemes(prev => prev.filter(t => t.id !== id))
    db.deleteMidTermTheme(id).catch(console.error)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Nav />
      <div className="flex flex-col md:flex-row flex-1 overflow-auto md:overflow-hidden">
        {/* 長期目標 */}
        <div className="flex-1 flex flex-col overflow-hidden md:border-r border-b md:border-b-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: '#1a1a24' }}>
            <h2 className="font-semibold text-sm">長期目標</h2>
            <button onClick={() => setGoalModal(true)}
              className="px-3 py-1.5 rounded text-xs" style={{ background: 'var(--accent)', color: '#fff' }}>
              ＋ 追加
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {goals.length === 0 && <EmptyState text="長期目標を登録しましょう" />}
            {goals.map(g => (
              <div key={g.id} className="rounded-xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${g.color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{g.title}</p>
                  <button onClick={() => setGoalModal(g)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}><PenIcon /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中期テーマ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: '#1a1a24' }}>
            <h2 className="font-semibold text-sm">中期テーマ</h2>
            <button onClick={() => setThemeModal(true)}
              className="px-3 py-1.5 rounded text-xs" style={{ background: 'var(--accent)', color: '#fff' }}>
              ＋ 追加
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {themes.length === 0 && <EmptyState text="中期テーマを登録しましょう" />}
            {/* 長期目標でグループ化 */}
            {(() => {
              const groups: { goal: LongTermGoal | null; themes: MidTermTheme[] }[] = []
              // 長期目標ごとのグループ
              for (const goal of goals) {
                const grouped = themes.filter(t => t.relatedGoalId === goal.id)
                if (grouped.length > 0) groups.push({ goal, themes: grouped })
              }
              // 長期目標未設定のテーマ
              const ungrouped = themes.filter(t => !goals.find(g => g.id === t.relatedGoalId))
              if (ungrouped.length > 0) groups.push({ goal: null, themes: ungrouped })

              return groups.map(({ goal, themes: groupThemes }) => (
                <div key={goal?.id ?? '__none__'} className="flex flex-col gap-2">
                  {/* グループヘッダー */}
                  <div className="flex items-center gap-2 px-1">
                    {goal && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: goal.color }} />}
                    <span className="text-xs font-semibold" style={{ color: goal?.color ?? 'var(--text-muted)' }}>
                      {goal?.title ?? '未分類'}
                    </span>
                  </div>
                  {/* テーマカード */}
                  {groupThemes.map(t => (
                    <div key={t.id} className="rounded-xl p-4"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${goal?.color ?? 'var(--border)'}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{t.title}</p>
                        <button onClick={() => setThemeModal(t)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}><PenIcon /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      {goalModal && (
        <GoalModal
          goal={goalModal === true ? undefined : goalModal}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoal}
          onClose={() => setGoalModal(null)}
        />
      )}
      {themeModal && (
        <ThemeModal
          theme={themeModal === true ? undefined : themeModal}
          goals={goals}
          onSave={handleSaveTheme}
          onDelete={handleDeleteTheme}
          onClose={() => setThemeModal(null)}
        />
      )}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
      {children}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>{text}</p>
}

function GoalModal({ goal, onSave, onDelete, onClose }: {
  goal?: LongTermGoal; onSave: (g: LongTermGoal) => void; onDelete: (id: string) => void; onClose: () => void
}) {
  const [form, setForm] = useState<LongTermGoal>(goal ?? {
    id: '', title: '', color: THEME_COLORS[0],
  })
  const set = (k: keyof LongTermGoal, v: string) => setForm(p => ({ ...p, [k]: v }))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }
  return (
    <Modal title={goal ? '長期目標を編集' : '長期目標を追加'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <InputField label="タイトル *" value={form.title} onChange={e => set('title', e.target.value)} required />
        <div className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>カラー</span>
          <div className="flex gap-2 flex-wrap">
            {THEME_COLORS.map(c => (
              <button key={c} type="button" onClick={() => set('color', c)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{ background: c, transform: form.color === c ? 'scale(1.3)' : 'scale(1)', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <SubmitButton>{goal ? '更新' : '追加'}</SubmitButton>
          {goal && <button type="button"
            onClick={() => { if (window.confirm(`「${goal.title}」を削除しますか？`)) { onDelete(goal.id); onClose() } }}
            className="px-4 py-2 rounded-lg" style={{ background: '#ef444422', color: '#ef4444' }}><TrashIcon /></button>}
        </div>
      </form>
    </Modal>
  )
}

function ThemeModal({ theme, goals, onSave, onDelete, onClose }: {
  theme?: MidTermTheme; goals: LongTermGoal[]; onSave: (t: MidTermTheme) => void; onDelete: (id: string) => void; onClose: () => void
}) {
  const [form, setForm] = useState<MidTermTheme>(theme ?? {
    id: '', title: '', relatedGoalId: '',
  })
  const set = (k: keyof MidTermTheme, v: string) => setForm(p => ({ ...p, [k]: v }))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }
  return (
    <Modal title={theme ? '中期テーマを編集' : '中期テーマを追加'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <InputField label="タイトル *" value={form.title} onChange={e => set('title', e.target.value)} required />
        <SelectField label="関連する長期目標" value={form.relatedGoalId} onChange={e => set('relatedGoalId', e.target.value)}
          options={goals.map(g => ({ value: g.id, label: g.title }))} />
        <div className="flex gap-2 mt-1">
          <SubmitButton>{theme ? '更新' : '追加'}</SubmitButton>
          {theme && <button type="button"
            onClick={() => { if (window.confirm(`「${theme.title}」を削除しますか？`)) { onDelete(theme.id); onClose() } }}
            className="px-4 py-2 rounded-lg" style={{ background: '#ef444422', color: '#ef4444' }}><TrashIcon /></button>}
        </div>
      </form>
    </Modal>
  )
}
