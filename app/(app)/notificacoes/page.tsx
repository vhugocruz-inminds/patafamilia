'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarDataHora } from '@/lib/utils'

interface Notif {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  lida: boolean
  emoji: string | null
  criadaEm: string
}

export default function NotificacoesPage() {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'NOVO_REGISTRO' | 'LEMBRETE' | 'ATRASADO'>('todas')
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const carregarNotificacoes = useEffectEvent(async () => {
    const res = await fetch('/api/notificacoes')
    if (res.ok) { const data = await res.json(); setNotifs(data) }
    setLoading(false)
  })

  useEffect(() => {
    carregarNotificacoes()
    // Realtime
    const channel = supabase
      .channel('notificacoes-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes' }, () => carregarNotificacoes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function marcarComoLida(id: string) {
    await fetch(`/api/notificacoes/${id}`, { method: 'PATCH' })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  async function marcarTodasLidas() {
    await fetch('/api/notificacoes', { method: 'PATCH' })
    setNotifs(prev => prev.map(n => ({ ...n, lida: true })))
  }

  const filtradas = notifs.filter(n => {
    if (filtro === 'todas') return true
    if (filtro === 'nao_lidas') return !n.lida
    return n.tipo === filtro
  })
  const naoLidas = notifs.filter(n => !n.lida).length

  const EMOJI_BG: Record<string, string> = {
    NOVO_REGISTRO: 'var(--amber-50)', NOVO_CUIDADO: 'var(--teal-50)', LEMBRETE: 'var(--purple-50)',
    ATRASADO: 'var(--coral-50)', NOVO_MEMBRO: 'var(--teal-50)', PROMOVIDO: 'var(--amber-50)',
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>Notificações</div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '2px' }}>{naoLidas} não lidas</div>
        </div>
        {naoLidas > 0 && (
          <button onClick={marcarTodasLidas} style={{ padding: '6px 12px', border: '1px solid var(--border2)', borderRadius: '10px', background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: 'var(--ink2)' }}>
            Marcar tudo como lido
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {([
          { key: 'todas', label: 'Todas' },
          { key: 'nao_lidas', label: `Não lidas (${naoLidas})` },
          { key: 'NOVO_REGISTRO', label: 'Remédios' },
          { key: 'LEMBRETE', label: 'Lembretes' },
          { key: 'ATRASADO', label: 'Atrasados' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)} style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${filtro === key ? 'var(--amber)' : 'var(--border)'}`, background: filtro === key ? 'var(--amber)' : 'var(--card)', color: filtro === key ? '#412402' : 'var(--ink3)', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink4)' }}>Nenhuma notificação encontrada.</div>
      ) : (
        filtradas.map(n => (
          <div key={n.id} onClick={() => !n.lida && marcarComoLida(n.id)} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${n.lida ? 'var(--border)' : 'var(--border)'}`, borderLeft: n.lida ? '1px solid var(--border)' : '2px solid var(--amber)', background: n.lida ? 'var(--card)' : '#FFFDF9', marginBottom: '6px', cursor: n.lida ? 'default' : 'pointer', transition: 'all .15s' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: EMOJI_BG[n.tipo] || 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
              {n.emoji || '🔔'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.45 }} dangerouslySetInnerHTML={{ __html: n.mensagem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              <div style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '3px' }}>{formatarDataHora(new Date(n.criadaEm))}</div>
            </div>
            {!n.lida && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: '4px' }} />}
          </div>
        ))
      )}
    </div>
  )
}
