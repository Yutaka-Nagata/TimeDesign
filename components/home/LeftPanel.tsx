'use client'
import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { TaskTemplate, Template, MidTermTheme, LongTermGoal } from '@/types'
import { getThemeColor } from '@/lib/utils'
import { v4 as uuid } from 'uuid'
import TaskTemplateModal from '@/components/TaskTemplateModal'
import { PenIcon, StarIcon } from '@/components/Icons'

interface Props {
  taskTemplates: TaskTemplate[]
  templates: Template[]
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  onSaveTaskTemplate: (t: TaskTemplate) => void
  onDeleteTaskTemplate: (id: string) => void
  onApplyTemplate: (entries: Template['entries']) => void
}

function DraggableCard({ template, color, onEdit }: { template: TaskTemplate; color?: string; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: template.id,
    data: { type: 'taskTemplate', id: template.id },
  })
  return (
    <div className="group relative">
      <div ref={setNodeRef} {...listeners} {...attributes}
        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-xs transition-opacity select-none"
        style={{
          background: 'var(--surface2)',
          border: `1px solid ${color ?? 'var(--border)'}`,
          opacity: isDragging ? 0.4 : 1,
        }}>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="truncate font-medium">{template.title}</span>
          {template.memo && <span className="truncate opacity-60">{template.memo}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {template.templateType === 'todo' && template.dueDate && (
            <span className="opacity-60">{template.dueDate.slice(5)}</span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>{template.estimatedMinutes}m</span>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 hover:opacity-100 text-xs px-1.5 py-0.5 rounded transition-opacity"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
        <PenIcon size={8} />
      </button>
    </div>
  )
}

export default function LeftPanel({ taskTemplates, templates, themes, goals, onSaveTaskTemplate, onDeleteTaskTemplate, onApplyTemplate }: Props) {
  const [tab, setTab] = useState<'library' | 'template'>('library')
  const [editTarget, setEditTarget] = useState<TaskTemplate | null>(null)
  const [newType, setNewType] = useState<'todo' | 'reusable'>('todo')
  const [openNew, setOpenNew] = useState(false)

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
          <>
            {/* Todo エリア */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Todo</p>
                <button
                  onClick={() => { setNewType('todo'); setEditTarget(null); setOpenNew(true) }}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}>＋</button>
              </div>
              {taskTemplates.filter(t => t.templateType === 'todo').map(t => (
                <DraggableCard key={t.id} template={t} color={getThemeColor(t.relatedThemeId, themes, goals)} onEdit={() => setEditTarget(t)} />
              ))}
            </div>

            <div className="h-px my-1" style={{ background: 'var(--border)' }} />

            {/* Reuse エリア — 長期目標でグループ化 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Reuse</p>
                <button
                  onClick={() => { setNewType('reusable'); setEditTarget(null); setOpenNew(true) }}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent)' }}>＋</button>
              </div>
              {(() => {
                const reusable = taskTemplates.filter(t => t.templateType === 'reusable')
                // テーマ経由で長期目標を解決
                const grouped: { goalId: string | null; label: string; color?: string; items: typeof reusable }[] = []
                const seen = new Set<string | null>()
                for (const t of reusable) {
                  const theme = themes.find(th => th.id === t.relatedThemeId)
                  const goal = theme ? goals.find(g => g.id === theme.relatedGoalId) : undefined
                  const key = goal?.id ?? null
                  if (!seen.has(key)) {
                    seen.add(key)
                    grouped.push({ goalId: key, label: goal?.title ?? '未分類', color: goal?.color, items: [] })
                  }
                  grouped.find(g => g.goalId === key)!.items.push(t)
                }
                return grouped.map(group => (
                  <div key={group.goalId ?? '__none__'} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 px-0.5">
                      {group.color && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: group.color }} />}
                      <span className="text-xs font-medium" style={{ color: group.color ?? 'var(--text-muted)', opacity: group.color ? 1 : 0.6 }}>
                        {group.label}
                      </span>
                    </div>
                    {group.items.map(t => (
                      <DraggableCard key={t.id} template={t} color={getThemeColor(t.relatedThemeId, themes, goals)} onEdit={() => setEditTarget(t)} />
                    ))}
                  </div>
                ))
              })()}
            </div>
          </>
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

      {openNew && (
        <TaskTemplateModal
          defaultType={newType}
          themes={themes}
          goals={goals}
          onSave={t => onSaveTaskTemplate({ ...t, id: uuid() })}
          onDelete={onDeleteTaskTemplate}
          onClose={() => setOpenNew(false)}
        />
      )}
      {editTarget !== null && (
        <TaskTemplateModal
          taskTemplate={editTarget}
          themes={themes}
          goals={goals}
          onSave={t => onSaveTaskTemplate(t)}
          onDelete={onDeleteTaskTemplate}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
