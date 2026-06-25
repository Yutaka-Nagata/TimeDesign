'use client'
import { useState, useRef, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, pointerWithin, useDndMonitor } from '@dnd-kit/core'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventContentArg } from '@fullcalendar/core'
import { Template, TemplateEntry, TaskTemplate, MidTermTheme, LongTermGoal } from '@/types'
import { TrashIcon, XmarkIcon } from '@/components/Icons'
import { getThemeColor, addMinutes, formatDuration, sortThemesByGoal } from '@/lib/utils'
import { v4 as uuid } from 'uuid'
import TaskArea from '@/components/TaskArea'

const DUMMY_DATE = '2000-01-01'

interface Props {
  template?: Template
  taskTemplates: TaskTemplate[]
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  onSave: (t: Template) => void
  onSaveTaskTemplate?: (t: TaskTemplate) => void
  onDeleteTaskTemplate?: (id: string) => void
  onClose: () => void
}

function resolveEntry(entry: TemplateEntry, taskTemplates: TaskTemplate[], themes: MidTermTheme[], goals: LongTermGoal[]) {
  const tpl = taskTemplates.find(t => t.id === entry.taskId)
  if (!tpl) return null
  const color = getThemeColor(tpl.relatedThemeId, themes, goals) ?? '#6366f1'
  return {
    id: entry.taskId + '_' + entry.startTime,
    title: tpl.title,
    start: `${DUMMY_DATE}T${entry.startTime}`,
    end: `${DUMMY_DATE}T${addMinutes(entry.startTime, tpl.estimatedMinutes)}`,
    backgroundColor: color,
    borderColor: color,
    extendedProps: { entry, tpl },
  }
}

function EventContent({ info }: { info: EventContentArg }) {
  const tpl = info.event.extendedProps.tpl as TaskTemplate
  const isGhost = !!info.event.extendedProps.isGhost
  const startStr = info.event.startStr?.slice(11, 16) ?? ''
  const endStr = info.event.endStr?.slice(11, 16) ?? ''
  return (
    <div className="flex flex-col overflow-hidden h-full px-0.5">
      <div className="flex items-baseline gap-1 leading-tight overflow-hidden">
        <span className="font-medium truncate shrink" style={{ fontSize: '0.72rem', opacity: isGhost ? 0.7 : 1 }}>
          {tpl?.title ?? ''}
        </span>
        {startStr && endStr && !isGhost && (
          <span className="shrink-0 opacity-70" style={{ fontSize: '0.58rem' }}>{startStr}–{endStr}</span>
        )}
      </div>
      {tpl?.memo && !isGhost && (
        <span className="leading-tight truncate mt-0.5 opacity-70" style={{ fontSize: '0.62rem' }}>{tpl.memo}</span>
      )}
    </div>
  )
}


function TemplateDragPreview({ taskTemplates }: { taskTemplates: TaskTemplate[] }) {
  const [active, setActive] = useState<TaskTemplate | null>(null)
  useDndMonitor({
    onDragStart(e) {
      const { type, id } = (e.active.data.current ?? {}) as { type?: string; id?: string }
      if (type === 'taskTemplate' && id) setActive(taskTemplates.find(t => t.id === id) ?? null)
    },
    onDragEnd() { setActive(null) },
    onDragCancel() { setActive(null) },
  })
  return (
    <DragOverlay dropAnimation={null}>
      {active && (
        <div className="px-2 py-1.5 rounded-lg text-xs select-none pointer-events-none"
          style={{ background: 'var(--surface2)', border: '1px solid var(--accent)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', opacity: 0.9, minWidth: 120 }}>
          <div className="font-medium truncate">{active.title}</div>
          <div className="opacity-50 mt-0.5">{active.estimatedMinutes}m</div>
        </div>
      )}
    </DragOverlay>
  )
}

function CalendarArea({
  entries, taskTemplates, themes, goals,
  onSlotClick, onEventClick, onEventDrop, onDrop,
}: {
  entries: TemplateEntry[]
  taskTemplates: TaskTemplate[]
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  onSlotClick: (time: string) => void
  onEventClick: (entry: TemplateEntry, tpl: TaskTemplate, index: number) => void
  onEventDrop: (eventId: string, newStart: string) => void
  onDrop: (taskId: string, time: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'template-calendar' })
  const mousePos = useRef({ x: 0, y: 0 })
  const prevKey = useRef<string | null>(null)
  const [ghost, setGhost] = useState<{ taskId: string; time: string } | null>(null)

  useEffect(() => {
    const h = (e: PointerEvent) => { mousePos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('pointermove', h)
    return () => window.removeEventListener('pointermove', h)
  }, [])

  useDndMonitor({
    onDragMove(event) {
      const data = event.active.data.current as { type?: string; id?: string } | undefined
      if (data?.type !== 'taskTemplate') {
        if (prevKey.current !== null) { prevKey.current = null; setGhost(null) }
        return
      }
      const { x, y } = mousePos.current
      let time: string | null = null
      for (const el of document.elementsFromPoint(x, y)) {
        const slot = (el as HTMLElement).closest?.('[data-time]') as HTMLElement | null
        if (slot?.dataset.time) { time = slot.dataset.time.slice(0, 5); break }
      }
      const key = time ? `${data.id}:${time}` : null
      if (key !== prevKey.current) {
        prevKey.current = key
        setGhost(time && data.id ? { taskId: data.id, time } : null)
      }
    },
    onDragEnd(event) {
      prevKey.current = null
      setGhost(null)
      if (event.over?.id !== 'template-calendar') return
      const data = event.active.data.current as { type?: string; id?: string } | undefined
      if (data?.type !== 'taskTemplate' || !data.id) return
      const { x, y } = mousePos.current
      let time = '09:00'
      for (const el of document.elementsFromPoint(x, y)) {
        const slot = (el as HTMLElement).closest?.('[data-time]') as HTMLElement | null
        if (slot?.dataset.time) { time = slot.dataset.time.slice(0, 5); break }
      }
      onDrop(data.id, time)
    },
    onDragCancel() { prevKey.current = null; setGhost(null) },
  })

  const events = entries
    .map(e => resolveEntry(e, taskTemplates, themes, goals))
    .filter(Boolean) as NonNullable<ReturnType<typeof resolveEntry>>[]

  const ghostEvent = (() => {
    if (!ghost) return null
    const tpl = taskTemplates.find(t => t.id === ghost.taskId)
    if (!tpl) return null
    const color = getThemeColor(tpl.relatedThemeId, themes, goals) ?? '#6366f1'
    return {
      id: '__ghost__',
      title: tpl.title,
      start: `${DUMMY_DATE}T${ghost.time}`,
      end: `${DUMMY_DATE}T${addMinutes(ghost.time, tpl.estimatedMinutes)}`,
      backgroundColor: color + '55',
      borderColor: color + 'aa',
      editable: false,
      extendedProps: { isGhost: true, tpl },
    }
  })()

  const allEvents = ghostEvent ? [...events, ghostEvent] : events

  return (
    <div ref={setNodeRef} className="flex-1 overflow-hidden"
      style={{ background: isOver ? 'rgba(99,102,241,0.04)' : undefined, transition: 'background 0.15s' }}>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        initialDate={DUMMY_DATE}
        events={allEvents}
        headerToolbar={false}
        allDaySlot={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="06:00:00"
        height="100%"
        snapDuration="00:15:00"
        slotEventOverlap={false}
        nowIndicator={false}
        editable
        selectable
        dayHeaders={false}
        eventContent={info => <EventContent info={info} />}
        dateClick={info => onSlotClick(info.dateStr.slice(11, 16))}
        eventClick={info => {
          if (info.event.id === '__ghost__') return
          const { entry, tpl } = info.event.extendedProps as { entry: TemplateEntry; tpl: TaskTemplate }
          const index = entries.findIndex(e => e.taskId === entry.taskId && e.startTime === entry.startTime)
          onEventClick(entry, tpl, index)
        }}
        eventDrop={info => onEventDrop(info.event.id, info.event.startStr.slice(11, 16))}
      />
    </div>
  )
}

// Compact modal for slot click / event click — same UX as CompactTaskModal
function SlotModal({
  startTime: initialStart,
  existingTpl,
  themes, goals,
  onSave,
  onDelete,
  onClose,
}: {
  startTime: string
  existingTpl?: TaskTemplate
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  onSave: (data: { title: string; estimatedMinutes: number; memo: string; relatedThemeId: string }, startTime: string) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: existingTpl?.title ?? '',
    estimatedMinutes: existingTpl?.estimatedMinutes ?? 60,
    memo: existingTpl?.memo ?? '',
    relatedThemeId: existingTpl?.relatedThemeId ?? '',
    startTime: initialStart,
  })
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const color = getThemeColor(form.relatedThemeId, themes, goals)
  const endTime = addMinutes(form.startTime, form.estimatedMinutes)
  const duration = formatDuration(form.estimatedMinutes)

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleSave() {
    if (!form.title.trim()) return
    onSave({ title: form.title, estimatedMinutes: form.estimatedMinutes, memo: form.memo, relatedThemeId: form.relatedThemeId }, form.startTime)
    onClose()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  const minutesValid = form.estimatedMinutes >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-2xl shadow-2xl overflow-hidden w-full mx-4 sm:mx-0 sm:w-[480px]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {existingTpl ? 'エントリーを編集' : 'タスクを追加'}
          </span>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><XmarkIcon size={11} /></button>
        </div>

        <div className="px-5 pb-3 pt-2">
          <input ref={titleRef} value={form.title}
            onChange={e => set('title', e.target.value)}
            onKeyDown={handleKey}
            placeholder="タスク名を入力"
            className="w-full text-xl font-semibold bg-transparent outline-none placeholder:opacity-30"
            style={{ color: 'var(--text)' }} />
        </div>

        <div className="px-5 pb-4 flex items-center gap-2">
          {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />}
          <select value={form.relatedThemeId}
            onChange={e => set('relatedThemeId', e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--surface2)', border: `1.5px solid ${color ?? 'var(--border)'}`, color: color ?? 'var(--text-muted)', outline: 'none' }}>
            <option value="">中期テーマを選択（任意）</option>
            {sortThemesByGoal(themes, goals).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
          <input type="time" value={form.startTime}
            onChange={e => set('startTime', e.target.value)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }} />
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{endTime}</span>
          <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{duration}</span>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <input type="number" min={5} max={480} step={5}
                value={form.estimatedMinutes}
                onChange={e => set('estimatedMinutes', Number(e.target.value))}
                className="w-16 px-2 py-2 rounded-lg text-sm text-center"
                style={{ background: 'var(--surface2)', border: `1px solid ${!minutesValid ? '#ef4444' : 'var(--border)'}`, color: 'var(--text)', outline: 'none' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>分</span>
            </div>
            {!minutesValid && <span className="text-xs" style={{ color: '#ef4444' }}>5以上の値を入力</span>}
          </div>
        </div>

        <div className="px-5 pb-4">
          <input value={form.memo}
            onChange={e => set('memo', e.target.value)}
            onKeyDown={handleKey}
            placeholder="メモ（任意）"
            className="w-full text-sm bg-transparent outline-none placeholder:opacity-30"
            style={{ color: 'var(--text-muted)' }} />
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <div className="px-5 py-3 flex items-center gap-2">
          {onDelete && (
            <button onClick={() => { if (window.confirm('このエントリーを削除しますか？')) onDelete() }}
              className="px-3 py-2 rounded-lg"
              style={{ background: '#ef444422', color: '#ef4444' }}><TrashIcon /></button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>キャンセル</button>
          <button onClick={handleSave}
            disabled={!form.title.trim() || !minutesValid}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ background: color ?? 'var(--accent)', color: '#fff' }}>
            {existingTpl ? '更新' : '追加'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TemplateEditorModal({ template, taskTemplates: initialTemplates, themes, goals, onSave, onSaveTaskTemplate, onDeleteTaskTemplate, onClose }: Props) {
  const [name, setName] = useState(template?.name ?? '')
  const [entries, setEntries] = useState<TemplateEntry[]>(template?.entries ?? [])
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(initialTemplates)
  const [slotModal, setSlotModal] = useState<{
    startTime: string
    existingIndex?: number
    existingTpl?: TaskTemplate
  } | null>(null)

  useEffect(() => { setTaskTemplates(initialTemplates) }, [initialTemplates])

  function handleSlotClick(startTime: string) {
    setSlotModal({ startTime })
  }

  function handleEventClick(entry: TemplateEntry, tpl: TaskTemplate, index: number) {
    setSlotModal({ startTime: entry.startTime, existingIndex: index, existingTpl: tpl })
  }

  function handleSlotSave(
    data: { title: string; estimatedMinutes: number; memo: string; relatedThemeId: string },
    startTime: string
  ) {
    if (slotModal?.existingIndex !== undefined && slotModal.existingTpl) {
      // Update existing TaskTemplate in place
      const updatedTpl: TaskTemplate = {
        ...slotModal.existingTpl,
        title: data.title,
        estimatedMinutes: data.estimatedMinutes,
        memo: data.memo,
        relatedThemeId: data.relatedThemeId,
      }
      setTaskTemplates(prev => prev.map(t => t.id === updatedTpl.id ? updatedTpl : t))
      setEntries(prev => prev.map((e, i) => i === slotModal.existingIndex ? { taskId: updatedTpl.id, startTime } : e))
      onSaveTaskTemplate?.(updatedTpl)
    } else {
      // Create new TaskTemplate and entry
      const newTpl: TaskTemplate = {
        id: uuid(),
        title: data.title,
        estimatedMinutes: data.estimatedMinutes,
        memo: data.memo,
        relatedThemeId: data.relatedThemeId,
        templateType: 'reusable',
      }
      setTaskTemplates(prev => [...prev, newTpl])
      onSaveTaskTemplate?.(newTpl)
      setEntries(prev => [...prev, { taskId: newTpl.id, startTime }])
    }
  }

  function handleDeleteEntry(index: number) {
    setEntries(prev => prev.filter((_, i) => i !== index))
    setSlotModal(null)
  }

  function handleEventDrop(eventId: string, newStart: string) {
    const oldStart = eventId.split('_').slice(1).join('_')
    setEntries(prev => prev.map(e => e.startTime === oldStart ? { ...e, startTime: newStart } : e))
  }

  function handleDrop(taskId: string, time: string) {
    setEntries(prev => [...prev, { taskId, startTime: time }])
  }

  function handleSave() {
    if (!name.trim()) { alert('テンプレート名を入力してください'); return }
    onSave({ id: template?.id ?? uuid(), name, isDefault: template?.isDefault, entries })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={onClose} className="px-3 py-1.5 rounded text-xs"
          style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>← 戻る</button>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="テンプレート名を入力…"
          className="flex-1 text-lg font-semibold bg-transparent outline-none placeholder:opacity-30"
          style={{ color: 'var(--text)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{entries.length} タスク</span>
        <button onClick={handleSave} className="px-5 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff' }}>保存</button>
      </div>

      <DndContext collisionDetection={pointerWithin}>
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* calendar: top on mobile (order-1), right on desktop (order-2) */}
          <div className="order-1 md:order-2 flex-1 min-h-0 overflow-hidden flex flex-col">
            <CalendarArea
              entries={entries}
              taskTemplates={taskTemplates}
              themes={themes}
              goals={goals}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
              onDrop={handleDrop}
            />
          </div>

          {/* task library: bottom on mobile (order-2), left on desktop (order-1) */}
          <div className="order-2 md:order-1 h-44 md:h-auto md:w-52 shrink-0 flex flex-col overflow-hidden border-t md:border-t-0 md:border-r"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-3 py-2 text-xs border-b shrink-0" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              ドラッグ or カレンダーをクリックして追加
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <TaskArea
                taskTemplates={taskTemplates}
                themes={themes}
                goals={goals}
                show="reuse"
                onSaveTaskTemplate={t => {
                  setTaskTemplates(prev => {
                    const exists = prev.find(x => x.id === t.id)
                    return exists ? prev.map(x => x.id === t.id ? t : x) : [...prev, t]
                  })
                  onSaveTaskTemplate?.(t)
                }}
                onDeleteTaskTemplate={id => {
                  setTaskTemplates(prev => prev.filter(t => t.id !== id))
                  onDeleteTaskTemplate?.(id)
                }}
              />
            </div>
          </div>
        </div>
        <TemplateDragPreview taskTemplates={taskTemplates} />
      </DndContext>

      {slotModal && (
        <SlotModal
          startTime={slotModal.startTime}
          existingTpl={slotModal.existingTpl}
          themes={themes}
          goals={goals}
          onSave={handleSlotSave}
          onDelete={slotModal.existingIndex !== undefined ? () => handleDeleteEntry(slotModal.existingIndex!) : undefined}
          onClose={() => setSlotModal(null)}
        />
      )}
    </div>
  )
}
