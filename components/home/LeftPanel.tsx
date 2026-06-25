'use client'
import { useState } from 'react'
import { TaskTemplate, Template, MidTermTheme, LongTermGoal } from '@/types'
import { StarIcon } from '@/components/Icons'
import TaskArea from '@/components/TaskArea'

interface Props {
  taskTemplates: TaskTemplate[]
  templates: Template[]
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  onSaveTaskTemplate: (t: TaskTemplate) => void
  onDeleteTaskTemplate: (id: string) => void
  onApplyTemplate: (entries: Template['entries']) => void
}

export default function LeftPanel({ taskTemplates, templates, themes, goals, onSaveTaskTemplate, onDeleteTaskTemplate, onApplyTemplate }: Props) {
  const [tab, setTab] = useState<'library' | 'template'>('library')

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        {([['library', 'タスク'], ['template', 'テンプレ']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {tab === 'library' && (
          <TaskArea
            taskTemplates={taskTemplates}
            themes={themes}
            goals={goals}
            show="all"
            onSaveTaskTemplate={onSaveTaskTemplate}
            onDeleteTaskTemplate={onDeleteTaskTemplate}
          />
        )}

        {tab === 'template' && (
          <>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>テンプレートを一括挿入</p>
            {templates.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>設定画面で作成</p>
            )}
            {templates.map(tpl => (
              <div key={tpl.id} className="rounded-lg p-3 flex flex-col gap-1"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{tpl.name}</span>
                    {tpl.isDefault && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}><StarIcon size={7} /></span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tpl.entries.length}件</span>
                </div>
                <button onClick={() => onApplyTemplate(tpl.entries)}
                  className="mt-1 py-1 rounded text-xs" style={{ background: 'var(--accent)', color: '#fff' }}>
                  今日に挿入
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
