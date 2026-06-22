'use client'
import { ReactNode } from 'react'
import { XmarkIcon } from '@/components/Icons'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rounded-xl w-full max-w-md mx-4 shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm">{title}</h2>
          <button onClick={onClose} className="opacity-50 hover:opacity-100"><XmarkIcon size={11} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
