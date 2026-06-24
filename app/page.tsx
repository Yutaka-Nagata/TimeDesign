'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { DndContext, DragEndEvent, DragOverlay, pointerWithin, useDndMonitor } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import LeftPanel from '@/components/home/LeftPanel'
import CalendarPanel from '@/components/home/CalendarPanel'
import CompactTaskModal from '@/components/CompactTaskModal'
import { supabase } from '@/lib/supabase'
import * as db from '@/lib/db'
import { Task, TaskTemplate, Template, LongTermGoal, MidTermTheme } from '@/types'
import { todayStr } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

// DragOverlay content — must live inside DndContext to use useDndMonitor
function DragPreview({ taskTemplates }: { taskTemplates: TaskTemplate[] }) {
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
        <div className="px-3 py-2 rounded-lg text-xs select-none pointer-events-none"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--accent)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            opacity: 0.85,
            minWidth: 140,
          }}>
          <div className="font-medium truncate">{active.title}</div>
          {active.memo && <div className="truncate mt-0.5 opacity-60" style={{ fontSize: '0.68rem' }}>{active.memo}</div>}
          <div className="mt-1 opacity-50">{active.estimatedMinutes}m</div>
        </div>
      )}
    </DragOverlay>
  )
}

export default function Home() {
  const router = useRouter()
  const [goals, setGoals] = useState<LongTermGoal[]>([])
  const [themes, setThemes] = useState<MidTermTheme[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [modal, setModal] = useState<{ task?: Task; defaultDate?: string; defaultStart: string; defaultEstimated?: number } | null>(null)
  const [sidebarPct, setSidebarPct] = useState(30)
  const [calendarPct, setCalendarPct] = useState(60)
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const resizing = useRef(false)
  const vertResizing = useRef(false)
  // Ref mirrors tasks so event handlers always see the current value without stale closures
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  const showError = useCallback((msg: string) => {
    setSaveError(msg)
    setTimeout(() => setSaveError(null), 4000)
  }, [])

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    const onMove = (ev: PointerEvent) => {
      if (!resizing.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = Math.min(60, Math.max(15, ((ev.clientX - rect.left) / rect.width) * 100))
      setSidebarPct(Math.round(pct))
    }
    const onUp = () => {
      resizing.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function startVertResize(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    vertResizing.current = true
    const onMove = (ev: PointerEvent) => {
      if (!vertResizing.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = Math.min(80, Math.max(20, ((ev.clientY - rect.top) / rect.height) * 100))
      setCalendarPct(Math.round(pct))
    }
    const onUp = () => {
      vertResizing.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handler = (e: PointerEvent) => { mousePos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('pointermove', handler)
    return () => window.removeEventListener('pointermove', handler)
  }, [])

  // Auth check + data load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      Promise.all([
        db.getLongTermGoals().then(setGoals),
        db.getMidTermThemes().then(setThemes),
        db.getTasks().then(setTasks),
        db.getTaskTemplates().then(setTaskTemplates),
        db.getTemplates().then(setTemplates),
      ])
        .catch(console.error)
        .finally(() => setLoading(false))
    })
  }, [router])

  function handleSaveTask(task: Task) {
    const toSave = { ...task, id: task.id || uuid() }
    setTasks(prev => {
      const exists = prev.find(t => t.id === toSave.id)
      return exists ? prev.map(t => t.id === toSave.id ? toSave : t) : [...prev, toSave]
    })
    db.upsertTask(toSave).catch(() => showError('タスクの保存に失敗しました'))
  }

  function handleDeleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    db.deleteTask(id).catch(() => showError('タスクの削除に失敗しました'))
  }

  function handleClearDay(dates: string[]) {
    setTasks(prev => prev.filter(t => !dates.includes(t.date)))
    db.deleteTasksByDates(dates).catch(() => showError('タスクの削除に失敗しました'))
  }

  function handleTaskUpdate(id: string, date: string, startTime: string, estimatedMinutes: number) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, date, startTime, estimatedMinutes } : t))
    // Use tasksRef to avoid stale closure when reading other task fields for the DB write
    const task = tasksRef.current.find(t => t.id === id)
    if (task) db.upsertTask({ ...task, date, startTime, estimatedMinutes }).catch(() => showError('タスクの更新に失敗しました'))
  }

  const handleSaveTaskTemplate = useCallback((t: TaskTemplate) => {
    setTaskTemplates(prev => {
      const exists = prev.find(x => x.id === t.id)
      return exists ? prev.map(x => x.id === t.id ? t : x) : [...prev, t]
    })
    db.upsertTaskTemplate(t).catch(() => showError('テンプレートの保存に失敗しました'))
  }, [showError])

  const handleDeleteTaskTemplate = useCallback((id: string) => {
    setTaskTemplates(prev => prev.filter(t => t.id !== id))
    db.deleteTaskTemplate(id).catch(() => showError('テンプレートの削除に失敗しました'))
  }, [showError])

  function handleApplyTemplate(entries: Template['entries']) {
    const newTasks: Task[] = entries.flatMap(entry => {
      const tpl = taskTemplates.find(t => t.id === entry.taskId)
      if (!tpl) return []
      return [{
        id: uuid(),
        date: selectedDate,
        startTime: entry.startTime,
        title: tpl.title,
        estimatedMinutes: tpl.estimatedMinutes,
        memo: tpl.memo,
        relatedThemeId: tpl.relatedThemeId,
        isDone: false,
        templateId: tpl.id,
      }]
    })
    setTasks(prev => [...prev, ...newTasks])
    db.upsertTasks(newTasks).catch(() => showError('テンプレートの適用に失敗しました'))
  }

  function getDropInfo(): { date: string; time: string } {
    const { x, y } = mousePos.current
    let date: string | null = null
    let time: string | null = null
    for (const el of document.elementsFromPoint(x, y)) {
      if (!time) {
        const slot = (el as HTMLElement).closest?.('[data-time]') as HTMLElement | null
        if (slot?.dataset.time) time = slot.dataset.time.slice(0, 5)
      }
      if (!date) {
        const col = (el as HTMLElement).closest?.('[data-date]') as HTMLElement | null
        if (col?.dataset.date) date = col.dataset.date
      }
      if (time && date) break
    }
    return { date: date ?? selectedDate, time: time ?? '09:00' }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.over?.id !== 'calendar') return
    const { type, id } = (event.active.data.current ?? {}) as { type?: string; id?: string }
    if (type !== 'taskTemplate' || !id) return
    const tpl = taskTemplates.find(t => t.id === id)
    if (!tpl) return
    const { date, time } = getDropInfo()
    const newTask: Task = {
      id: uuid(),
      date,
      startTime: time,
      title: tpl.title,
      estimatedMinutes: tpl.estimatedMinutes,
      memo: tpl.memo,
      relatedThemeId: tpl.relatedThemeId,
      isDone: false,
      templateId: tpl.id,
    }
    setTasks(prev => [...prev, newTask])
    db.upsertTask(newTask).catch(() => showError('タスクの作成に失敗しました'))
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>読み込み中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Nav />
      <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
        <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col md:flex-row">

          {/* CalendarPanel: order-1 on mobile (top), order-3 on desktop (fills rest) */}
          <div
            className="order-1 md:order-3 shrink-0 overflow-hidden flex flex-col"
            style={{
              flex: isMobile ? `0 0 ${calendarPct}%` : '1 1 0',
            }}>
            <CalendarPanel
              tasks={tasks}
              taskTemplates={taskTemplates}
              themes={themes}
              goals={goals}
              templates={templates}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onTaskClick={task => setModal({ task, defaultStart: task.startTime, defaultEstimated: task.estimatedMinutes })}
              onSlotClick={(date, time) => setModal({ defaultStart: time, defaultDate: date })}
              onTaskUpdate={handleTaskUpdate}
              onApplyTemplate={handleApplyTemplate}
              onClearDay={handleClearDay}
            />
          </div>

          {/* Horizontal resize handle: mobile only (order-2, between calendar and task panel) */}
          <div
            className="order-2 md:hidden shrink-0 cursor-row-resize flex items-center justify-center"
            style={{ height: isMobile ? 9 : 0, background: 'var(--border)', pointerEvents: isMobile ? 'auto' : 'none' }}
            onPointerDown={startVertResize}
          >
            <div style={{ height: 2, width: 32, borderRadius: 9999, background: 'var(--text-muted)', opacity: 0.35 }} />
          </div>

          {/* LeftPanel: order-3 on mobile (below handle), order-1 on desktop (left sidebar) */}
          <div
            className="order-3 md:order-1 overflow-hidden flex flex-col shrink-0 border-t md:border-t-0"
            style={{
              borderColor: 'var(--border)',
              width: isMobile ? '100%' : `${sidebarPct}%`,
              flex: isMobile ? '1 1 0' : 'none',
            }}>
            <LeftPanel
              taskTemplates={taskTemplates}
              templates={templates}
              themes={themes}
              goals={goals}
              onSaveTaskTemplate={handleSaveTaskTemplate}
              onDeleteTaskTemplate={handleDeleteTaskTemplate}
              onApplyTemplate={handleApplyTemplate}
            />
          </div>

          {/* Vertical resize handle: desktop only (order-2, between sidebar and calendar) */}
          <div
            className="hidden md:flex order-2 shrink-0 cursor-col-resize items-center justify-center"
            style={{ width: 9, background: 'var(--border)' }}
            onPointerDown={startResize}
          >
            <div style={{ width: 2, height: 32, borderRadius: 9999, background: 'var(--text-muted)', opacity: 0.35 }} />
          </div>
        </div>

        <DragPreview taskTemplates={taskTemplates} />
      </DndContext>

      {modal !== null && (
        <CompactTaskModal
          task={modal.task}
          themes={themes}
          goals={goals}
          defaultDate={modal.defaultDate ?? selectedDate}
          defaultStart={modal.defaultStart}
          defaultEstimated={modal.defaultEstimated}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => setModal(null)}
        />
      )}

      {saveError && (
        <div className="fixed bottom-4 right-4 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: '#ef4444', color: '#fff' }}>
          {saveError}
        </div>
      )}
    </div>
  )
}
