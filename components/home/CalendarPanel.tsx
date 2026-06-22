'use client'
import { useRef, useEffect, useState } from 'react'
import { useDroppable, useDndMonitor } from '@dnd-kit/core'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventContentArg } from '@fullcalendar/core'
import { Task, TaskTemplate, MidTermTheme, LongTermGoal, Template } from '@/types'
import { getThemeColor, addMinutes, addDays, minutesBetween } from '@/lib/utils'
import { CheckIcon, StarIcon, ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon } from '@/components/Icons'

interface Props {
  tasks: Task[]
  taskTemplates: TaskTemplate[]
  themes: MidTermTheme[]
  goals: LongTermGoal[]
  templates: Template[]
  selectedDate: string
  onDateChange: (date: string) => void
  onTaskClick: (task: Task) => void
  onSlotClick: (date: string, time: string) => void
  onTaskUpdate: (id: string, startTime: string, estimatedMinutes: number) => void
  onApplyTemplate: (entries: Template['entries']) => void
  onClearDay: (date: string) => void
}

function EventContent({ info, themes, goals, isWeek }: { info: EventContentArg; themes: MidTermTheme[]; goals: LongTermGoal[]; isWeek: boolean }) {
  const task = info.event.extendedProps.task as Task
  const isGhost = !!info.event.extendedProps.isGhost
  const startStr = info.event.startStr?.slice(11, 16) ?? ''
  const endStr = info.event.endStr?.slice(11, 16) ?? ''
  const durationMinutes = info.event.start && info.event.end
    ? (info.event.end.getTime() - info.event.start.getTime()) / 60000
    : task.estimatedMinutes
  const themeName = !isWeek && !isGhost && task.relatedThemeId
    ? themes.find(t => t.id === task.relatedThemeId)?.title ?? ''
    : ''

  return (
    <div className="flex flex-col overflow-hidden h-full px-0.5"
      style={{ opacity: isGhost ? 1 : (task.isDone ? 0.6 : 1) }}>
      <div className="flex items-baseline gap-1 leading-tight overflow-hidden">
        <span className="font-medium truncate shrink" style={{ fontSize: '0.72rem' }}>
          {!isGhost && task.isDone && <CheckIcon size={7} className="mr-0.5" />}{task.title}
        </span>
        {!isWeek && startStr && endStr && (
          <span className="shrink-0 opacity-70" style={{ fontSize: '0.58rem' }}>{startStr}–{endStr}</span>
        )}
        {themeName && (
          <span className="shrink-0 ml-auto opacity-80 truncate" style={{ fontSize: '0.58rem', maxWidth: '45%' }}>{themeName}</span>
        )}
      </div>
      {task.memo && (isWeek || durationMinutes > 45) && (
        <span className="leading-tight truncate mt-0.5" style={{ fontSize: '0.62rem', opacity: 0.75 }}>
          {task.memo}
        </span>
      )}
    </div>
  )
}

function TemplateMenu({ templates, onApply }: { templates: Template[]; onApply: (entries: Template['entries']) => void }) {
  const [open, setOpen] = useState(false)

  if (templates.length === 1) {
    return (
      <button onClick={() => onApply(templates[0].entries)}
        className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
        style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
        テンプレを使用
      </button>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
        style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
        テンプレを使用 <ChevronDownIcon size={7} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 rounded-lg py-1 min-w-40 shadow-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {templates.map(tpl => (
              <button key={tpl.id}
                onClick={() => { onApply(tpl.entries); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:opacity-80"
                style={{ color: 'var(--text)' }}>
                {tpl.isDefault && <StarIcon size={7} style={{ color: 'var(--accent)' }} />}
                <span>{tpl.name}</span>
                <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>{tpl.entries.length}件</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

type CalView = 'timeGridDay' | 'timeGridWeek'

export default function CalendarPanel({
  tasks, taskTemplates, themes, goals, templates, selectedDate,
  onDateChange, onTaskClick, onSlotClick, onTaskUpdate, onApplyTemplate, onClearDay,
}: Props) {
  const calRef = useRef<InstanceType<typeof FullCalendar>>(null)
  const { setNodeRef, isOver } = useDroppable({ id: 'calendar' })
  const [showGoals, setShowGoals] = useState(false)
  const [calView, setCalView] = useState<CalView>('timeGridDay')

  // Ghost event tracking
  const mousePos = useRef({ x: 0, y: 0 })
  const prevGhostKey = useRef<string | null>(null)
  const [ghostState, setGhostState] = useState<{ taskId: string; time: string } | null>(null)

  useEffect(() => {
    const h = (e: PointerEvent) => { mousePos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('pointermove', h)
    return () => window.removeEventListener('pointermove', h)
  }, [])

  useDndMonitor({
    onDragMove(event) {
      const data = event.active.data.current as { type?: string; id?: string } | undefined
      if (data?.type !== 'taskTemplate') {
        if (prevGhostKey.current !== null) { prevGhostKey.current = null; setGhostState(null) }
        return
      }
      // elementsFromPoint pierces through the DragOverlay on top
      const { x, y } = mousePos.current
      let time: string | null = null
      for (const el of document.elementsFromPoint(x, y)) {
        const slot = (el as HTMLElement).closest?.('[data-time]') as HTMLElement | null
        if (slot?.dataset.time) { time = slot.dataset.time.slice(0, 5); break }
      }
      const key = time ? `${data.id}:${time}` : null
      if (key !== prevGhostKey.current) {
        prevGhostKey.current = key
        setGhostState(time && data.id ? { taskId: data.id, time } : null)
      }
    },
    onDragEnd() { prevGhostKey.current = null; setGhostState(null) },
    onDragCancel() { prevGhostKey.current = null; setGhostState(null) },
  })

  const defaultTemplate = templates.find(t => t.isDefault)
  const navStep = calView === 'timeGridWeek' ? 7 : 1

  const events = tasks
    .filter(t => calView === 'timeGridWeek' ? true : t.date === selectedDate)
    .map(t => {
      const color = getThemeColor(t.relatedThemeId, themes, goals) ?? (t.isDone ? '#4b5563' : '#6366f1')
      return {
        id: t.id,
        title: t.title,
        start: `${t.date}T${t.startTime}`,
        end: `${t.date}T${addMinutes(t.startTime, t.estimatedMinutes)}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { task: t },
      }
    })

  // Ghost event (semi-transparent preview while dragging)
  const ghostEvent = (() => {
    if (!ghostState) return null
    const tpl = taskTemplates.find(t => t.id === ghostState.taskId)
    if (!tpl) return null
    const color = getThemeColor(tpl.relatedThemeId, themes, goals) ?? '#6366f1'
    return {
      id: '__ghost__',
      title: tpl.title,
      start: `${selectedDate}T${ghostState.time}`,
      end: `${selectedDate}T${addMinutes(ghostState.time, tpl.estimatedMinutes)}`,
      backgroundColor: color + '55',
      borderColor: color + 'aa',
      editable: false,
      extendedProps: {
        isGhost: true,
        task: { title: tpl.title, memo: tpl.memo, isDone: false, relatedThemeId: tpl.relatedThemeId } as Task,
      },
    }
  })()

  const allEvents = ghostEvent ? [...events, ghostEvent] : events

  return (
    <div ref={setNodeRef} className="flex flex-col h-full"
      style={{ background: isOver ? 'rgba(99,102,241,0.05)' : 'var(--background)', transition: 'background 0.15s' }}>

      {/* 目標バー */}
      {(themes.length > 0 || goals.length > 0) && (
        <div className="shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            onClick={() => setShowGoals(v => !v)}
            className="w-full flex items-center gap-1 px-4 py-1 text-xs transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            {showGoals ? <ChevronDownIcon size={7} /> : <ChevronRightIcon size={7} />}
            <span>目標・テーマ</span>
          </button>
          {showGoals && <div className="flex items-center gap-3 px-4 pb-2 flex-wrap">
          {themes.map(t => {
            const color = getThemeColor(t.id, themes, goals) ?? '#6366f1'
            return (
              <div key={t.id} className="flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs font-medium">{t.title}</span>
              </div>
            )
          })}
          {themes.length > 0 && goals.length > 0 && (
            <div className="w-px h-4 shrink-0" style={{ background: 'var(--border)' }} />
          )}
          {goals.map(g => (
            <div key={g.id} className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.title}</span>
            </div>
          ))}
          </div>}
        </div>
      )}

      {/* 日付ナビ */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0 flex-wrap" style={{ borderColor: 'var(--border)' }}>
        {/* 日/週 トグル */}
        <div className="flex rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--surface2)' }}>
          {(['timeGridDay', 'timeGridWeek'] as const).map((v, i) => (
            <button key={v} onClick={() => setCalView(v)}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: calView === v ? 'var(--accent)' : 'transparent',
                color: calView === v ? '#fff' : 'var(--text-muted)',
                borderRight: i === 0 ? '1px solid var(--border)' : undefined,
              }}>
              {v === 'timeGridDay' ? '日' : '週'}
            </button>
          ))}
        </div>

        <button onClick={() => onDateChange(addDays(selectedDate, -navStep))}
          className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors hover:opacity-70"
          style={{ background: 'var(--surface2)', color: 'var(--text)' }}><ChevronLeftIcon size={12} /></button>

        {/* 日付表示（クリックでdate picker） */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer select-none transition-opacity hover:opacity-80"
          style={{ background: 'var(--surface2)', color: 'var(--text)' }}>
          <span className="text-sm font-medium">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { weekday: 'short' })}
          </span>
          <input type="date" value={selectedDate} onChange={e => onDateChange(e.target.value)}
            className="absolute opacity-0 w-0 h-0 pointer-events-none" tabIndex={-1} />
        </label>

        <button onClick={() => onDateChange(new Date().toLocaleDateString('sv'))}
          className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
          style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>Today</button>

        <button onClick={() => onDateChange(addDays(selectedDate, navStep))}
          className="w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors hover:opacity-70"
          style={{ background: 'var(--surface2)', color: 'var(--text)' }}><ChevronRightIcon size={12} /></button>

        <div className="flex-1" />

        {tasks.some(t => t.date === selectedDate) && (
          <button
            onClick={() => {
              if (window.confirm('この日のタスクをすべて削除しますか？')) onClearDay(selectedDate)
            }}
            className="px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
            style={{ background: 'var(--surface2)', color: '#ef4444' }}>
            クリア
          </button>
        )}

        {templates.length > 0 && (
          <TemplateMenu templates={templates} onApply={onApplyTemplate} />
        )}
      </div>

      {/* カレンダー */}
      <div className="flex-1 overflow-hidden px-3 sm:px-1 pb-3">
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView={calView}
          initialDate={selectedDate}
          key={selectedDate + calView}
          events={allEvents}
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="06:00:00"
          nowIndicator
          height="100%"
          snapDuration="00:15:00"
          slotEventOverlap={false}
          editable
          eventResizableFromStart
          selectable={false}
          eventContent={info => <EventContent info={info} themes={themes} goals={goals} isWeek={calView === 'timeGridWeek'} />}
          eventClick={info => {
            if (info.event.id === '__ghost__') return
            onTaskClick(info.event.extendedProps.task as Task)
          }}
          dateClick={info => {
            const date = info.dateStr.slice(0, 10)
            const time = info.dateStr.slice(11, 16)
            if (date !== selectedDate) onDateChange(date)
            onSlotClick(date, time)
          }}
          eventResize={info => {
            const s = info.event.startStr.slice(11, 16)
            const e = info.event.endStr.slice(11, 16)
            onTaskUpdate(info.event.id, s, minutesBetween(s, e))
          }}
          eventDrop={info => {
            const s = info.event.startStr.slice(11, 16)
            const e = info.event.endStr.slice(11, 16)
            onTaskUpdate(info.event.id, s, minutesBetween(s, e))
          }}
        />
      </div>
    </div>
  )
}
