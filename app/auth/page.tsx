'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) { router.replace('/'); return }
      if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === 'true') {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'dev@example.com',
          password: 'dev123456',
        })
        if (!error) { router.replace('/'); return }
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setDone(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '10px 14px',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-bold text-2xl" style={{ color: 'var(--accent)' }}>⏱ TimeDesign</span>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>目標連動タスク管理</p>
        </div>

        {done ? (
          <div className="rounded-xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium mb-2">確認メールを送信しました</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {email} に届いたリンクをクリックしてアカウントを有効化してください。
            </p>
            <button onClick={() => { setMode('signin'); setDone(false) }}
              className="mt-4 text-xs underline" style={{ color: 'var(--accent)' }}>
              サインインへ戻る
            </button>
          </div>
        ) : (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {/* Mode toggle */}
            <div className="flex rounded-lg overflow-hidden mb-5" style={{ background: 'var(--surface2)' }}>
              {(['signin', 'signup'] as const).map((m, i) => (
                <button key={m} onClick={() => { setMode(m); setError(null) }}
                  className="flex-1 py-2 text-xs font-medium transition-colors"
                  style={{
                    background: mode === m ? 'var(--accent)' : 'transparent',
                    color: mode === m ? '#fff' : 'var(--text-muted)',
                    borderRight: i === 0 ? '1px solid var(--border)' : undefined,
                  }}>
                  {m === 'signin' ? 'サインイン' : '新規登録'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>メールアドレス</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="you@example.com" style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>パスワード</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••" style={inputStyle} />
              </div>
              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#ef444422', color: '#ef4444' }}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading}
                className="mt-1 py-2.5 rounded-lg text-sm font-medium transition-opacity"
                style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.6 : 1 }}>
                {loading ? '処理中...' : mode === 'signin' ? 'サインイン' : '登録'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
