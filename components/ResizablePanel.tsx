'use client'
import { useState, useEffect, ReactNode } from 'react'

interface Props {
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  className?: string
  children: ReactNode
}

export default function ResizablePanel({
  defaultWidth = 260,
  defaultHeight = 200,
  minWidth = 140,
  maxWidth = 600,
  minHeight = 80,
  maxHeight = 600,
  className = '',
  children,
}: Props) {
  const [width, setWidth] = useState(defaultWidth)
  const [height, setHeight] = useState(defaultHeight)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  function startWidthResize(e: React.PointerEvent) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startWidth = width
    const onMove = (ev: PointerEvent) => {
      setWidth(Math.round(Math.min(maxWidth, Math.max(minWidth, startWidth + ev.clientX - startX))))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function startHeightResize(e: React.PointerEvent) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const startY = e.clientY
    const startHeight = height
    const onMove = (ev: PointerEvent) => {
      // handle is at top; dragging up = taller
      setHeight(Math.round(Math.min(maxHeight, Math.max(minHeight, startHeight + startY - ev.clientY))))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const colHandle = (
    <div
      className="shrink-0 cursor-col-resize flex items-center justify-center"
      style={{ width: 9, background: 'var(--border)' }}
      onPointerDown={startWidthResize}
    >
      <div style={{ width: 2, height: 32, borderRadius: 9999, background: 'var(--text-muted)', opacity: 0.35 }} />
    </div>
  )

  const rowHandle = (
    <div
      className="shrink-0 cursor-row-resize flex items-center justify-center"
      style={{ height: 9, background: 'var(--border)' }}
      onPointerDown={startHeightResize}
    >
      <div style={{ height: 2, width: 32, borderRadius: 9999, background: 'var(--text-muted)', opacity: 0.35 }} />
    </div>
  )

  if (isMobile) {
    return (
      <div className={className} style={{ width: '100%', height, display: 'flex', flexDirection: 'column' }}>
        {rowHandle}
        <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      </div>
    )
  }

  return (
    <div className={className} style={{ width, height: '100%', display: 'flex', flexDirection: 'row' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      {colHandle}
    </div>
  )
}
