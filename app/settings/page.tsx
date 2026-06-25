'use client'
import { useState, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import TemplateEditorModal from '@/components/TemplateEditorModal'
import Statistics from '@/components/Statistics'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import { Task, TaskTemplate, Template, MidTermTheme, LongTermGoal } from '@/types'
import { getThemeColor } from '@/lib/utils'
import { v4 as uuid } from 'uuid'
import { PenIcon, TrashIcon, StarIcon, StarOutlineIcon, DownloadIcon, UploadIcon, CheckIcon, XmarkIcon } from '@/components/Icons'

export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'schedule' | 'stats' | 'data'>('stats')
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [themes, setThemes] = useState<MidTermTheme[]>([])
  const [goals, setGoals] = useState<LongTermGoal[]>([])
  const [editor, setEditor] = useState<Template | true | null>(null)
  const [allTasks, setAllTasks] = useState<Task[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      Promise.all([
        db.getTaskTemplates().then(setTaskTemplates),
        db.getTemplates().then(setTemplates),
        db.getMidTermThemes().then(setThemes),
        db.getLongTermGoals().then(setGoals),
        db.getTasks().then(setAllTasks),
      ]).catch(console.error)
    })
  }, [router])

  // Template CRUD
  function handleSaveTemplate(t: Template) {
    const toSave = { ...t, id: t.id || uuid() }
    setTemplates(prev => {
      const exists = prev.find(x => x.id === toSave.id)
      return exists ? prev.map(x => x.id === toSave.id ? toSave : x) : [...prev, toSave]
    })
    db.upsertTemplate(toSave).catch(console.error)
  }
  function handleDeleteTemplate(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id))
    db.deleteTemplate(id).catch(console.error)
  }
  function handleSetDefault(id: string) {
    setTemplates(prev => {
      const next = prev.map(t => ({ ...t, isDefault: t.id === id ? !t.isDefault : false }))
      next.forEach(t => db.upsertTemplate(t).catch(console.error))
      return next
    })
  }
  function handleAddTaskTemplate(t: TaskTemplate) {
    setTaskTemplates(prev => [...prev, t])
    db.upsertTaskTemplate(t).catch(console.error)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Nav />

      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {([['stats', '統計'], ['schedule', 'テンプレート'], ['data', 'データ管理']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {tab === 'schedule' && (
          <>
            <div className="flex justify-end mb-5">
              <button onClick={() => setEditor(true)}
                className="px-3 py-1.5 rounded text-xs shrink-0" style={{ background: 'var(--accent)', color: '#fff' }}>
                ＋ 新規テンプレート
              </button>
            </div>

            {templates.length === 0 && (
              <p className="text-sm text-center py-16" style={{ color: 'var(--text-muted)' }}>
                テンプレートがありません
              </p>
            )}

            <div className="flex flex-col gap-4">
              {templates.map(tpl => (
                <div key={tpl.id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{tpl.name}</h3>
                      {tpl.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--accent)', color: '#fff' }}>
                          デフォルト
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tpl.entries.length}タスク</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button onClick={() => handleSetDefault(tpl.id)}
                        className="transition-opacity hover:opacity-100"
                        style={{ color: tpl.isDefault ? 'var(--accent)' : 'var(--text-muted)', opacity: tpl.isDefault ? 1 : 0.5 }}>
                        {tpl.isDefault ? <StarIcon size={15} /> : <StarOutlineIcon size={15} />}
                      </button>
                      <button onClick={() => setEditor(tpl)}
                        className="transition-opacity hover:opacity-100"
                        style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                        <PenIcon size={14} />
                      </button>
                      <button onClick={() => { if (window.confirm(`「${tpl.name}」を削除しますか？`)) handleDeleteTemplate(tpl.id) }}
                        className="transition-opacity hover:opacity-100"
                        style={{ color: '#ef4444', opacity: 0.6 }}>
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {tpl.entries.map((entry, i) => {
                      const tTask = taskTemplates.find(t => t.id === entry.taskId)
                      const color = tTask ? getThemeColor(tTask.relatedThemeId, themes, goals) : undefined
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded text-xs"
                          style={{ background: 'var(--surface2)', borderLeft: color ? `3px solid ${color}` : undefined }}>
                          <span className="font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>{entry.startTime}</span>
                          <span className="font-medium">{tTask?.title ?? '(削除済み)'}</span>
                          {tTask && <span style={{ color: 'var(--text-muted)' }}>{tTask.estimatedMinutes}分</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'stats' && (
          <Statistics tasks={allTasks} themes={themes} goals={goals} />
        )}

        {tab === 'data' && (
          <DataManagement />
        )}
      </div>

      {editor && (
        <TemplateEditorModal
          template={editor === true ? undefined : editor}
          taskTemplates={taskTemplates}
          themes={themes}
          goals={goals}
          onSave={handleSaveTemplate}
          onAddTaskTemplate={handleAddTaskTemplate}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

// ── データ管理コンポーネント ──────────────────────────────────────────

type ExportData = {
  version: 2
  exportedAt: string
  goals: LongTermGoal[]
  themes: MidTermTheme[]
  taskTemplates: TaskTemplate[]
  templates: Template[]
  tasks: Task[]
}

function DataManagement() {
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    try {
      const { goals, themes, taskTemplates, templates, tasks } = await db.exportAll()
      const data: ExportData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        goals, themes, taskTemplates, templates, tasks,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timedesign-backup-${new Date().toLocaleDateString('sv')}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    setImportSuccess(false)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      setImporting(true)
      try {
        const data = JSON.parse(ev.target?.result as string) as Partial<ExportData>
        if (data.version !== 2) throw new Error('バージョンが対応していません')
        await db.importAll({
          goals: data.goals ?? [],
          themes: data.themes ?? [],
          taskTemplates: data.taskTemplates ?? [],
          templates: data.templates ?? [],
          tasks: data.tasks ?? [],
        })
        setImportSuccess(true)
        if (fileRef.current) fileRef.current.value = ''
      } catch (err) {
        const msg = err instanceof Error
          ? err.message
          : (err != null && typeof err === 'object' && 'message' in err)
            ? String((err as { message: unknown }).message)
            : '読み込みに失敗しました'
        setImportError(msg)
      } finally {
        setImporting(false)
      }
    }
    reader.readAsText(file)
  }

  const sectionStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px 24px',
  }

  return (
    <div className="flex flex-col gap-6">
      <div style={sectionStyle}>
        <h3 className="font-semibold text-sm mb-1">エクスポート</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          全データ（目標・テーマ・タスクライブラリ・テンプレート・スケジュール）を JSON ファイルに書き出します。
        </p>
        <button onClick={handleExport} disabled={exporting}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
          style={{ background: 'var(--accent)', color: '#fff', opacity: exporting ? 0.6 : 1 }}>
          <DownloadIcon size={9} className="mr-1.5" /> {exporting ? '処理中...' : 'エクスポート'}
        </button>
      </div>

      <div style={sectionStyle}>
        <h3 className="font-semibold text-sm mb-1">インポート</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          エクスポートした JSON ファイルを読み込みます。既存のデータは上書きされます。
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-opacity"
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', opacity: importing ? 0.6 : 1 }}>
          <UploadIcon size={9} className="mr-1.5" /> {importing ? '処理中...' : 'ファイルを選択'}
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
        {importSuccess && (
          <p className="mt-3 text-xs" style={{ color: '#10b981' }}>
            <CheckIcon size={8} className="mr-1" /> インポートしました。他のページに移動すると反映されます。
          </p>
        )}
        {importError && (
          <p className="mt-3 text-xs flex items-center gap-1" style={{ color: '#ef4444' }}><XmarkIcon size={8} /> {importError}</p>
        )}
      </div>
    </div>
  )
}
