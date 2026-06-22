'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GearIcon } from '@/components/Icons'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/', label: 'スケジュール' },
  { href: '/goals', label: '目標管理' },
  { href: '/settings', label: '設定', icon: true },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <>
      {/* Desktop: browser-tab style */}
      <nav className="hidden sm:flex items-end shrink-0 px-3 gap-0.5"
        style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', height: 44 }}>

        {/* ロゴ */}
        <span className="font-bold text-sm mr-4 mb-2.5 shrink-0" style={{ color: 'var(--accent)' }}>
          ⏱ TimeDesign
        </span>

        {/* タブ */}
        {links.map(l => {
          const isActive = pathname === l.href
          return (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 px-4 text-xs whitespace-nowrap transition-colors relative"
              style={{
                height: 34,
                borderRadius: '8px 8px 0 0',
                border: '1px solid',
                borderColor: isActive ? 'var(--border)' : 'transparent',
                borderBottom: isActive ? '1px solid #1a1a24' : '1px solid transparent',
                background: isActive ? '#1a1a24' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: isActive ? 500 : 400,
                marginBottom: isActive ? -1 : 0,
                zIndex: isActive ? 1 : 0,
              }}>
              {l.icon && <GearIcon size={10} />}
              {l.label}
            </Link>
          )
        })}

        {/* ユーザー情報 + ログアウト */}
        {email && (
          <div className="ml-auto mb-2 flex items-center gap-2">
            <span className="text-xs truncate max-w-36" style={{ color: 'var(--text-muted)' }}>{email}</span>
            <button onClick={handleLogout}
              className="px-2.5 py-1 rounded text-xs transition-opacity hover:opacity-70"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              ログアウト
            </button>
          </div>
        )}
      </nav>

      {/* Mobile: logo + hamburger */}
      <nav className="sm:hidden flex items-center px-4 h-12 border-b shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <span className="font-bold text-sm mr-auto" style={{ color: 'var(--accent)' }}>
          ⏱ TimeDesign
        </span>
        <button
          className="flex flex-col gap-1 p-2 rounded transition-all hover:brightness-75"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setOpen(v => !v)}
          aria-label="メニュー">
          <span className="block w-5 h-0.5 rounded" style={{ background: 'currentColor', transition: 'transform 0.2s', transform: open ? 'translateY(6px) rotate(45deg)' : '' }} />
          <span className="block w-5 h-0.5 rounded" style={{ background: 'currentColor', opacity: open ? 0 : 1, transition: 'opacity 0.15s' }} />
          <span className="block w-5 h-0.5 rounded" style={{ background: 'currentColor', transition: 'transform 0.2s', transform: open ? 'translateY(-6px) rotate(-45deg)' : '' }} />
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setOpen(false)} />
          <div className="absolute top-12 right-0 left-0 z-40 sm:hidden border-b flex flex-col"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {links.map(l => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm transition-all hover:brightness-75"
                style={{
                  background: pathname === l.href ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: pathname === l.href ? 'var(--accent)' : 'var(--text)',
                  borderLeft: pathname === l.href ? '3px solid var(--accent)' : '3px solid transparent',
                }}>
                {l.icon && <GearIcon size={13} />}
                {l.label}
              </Link>
            ))}
            {email && (
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3.5 text-sm text-left transition-all hover:brightness-75"
                style={{ color: '#ef4444', borderLeft: '3px solid transparent' }}>
                ログアウト
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
