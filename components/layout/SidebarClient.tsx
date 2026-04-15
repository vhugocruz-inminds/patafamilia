'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PapelMembro } from '@prisma/client'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Props {
  usuario: { id: string; nome: string; papel: PapelMembro | null }
  familia: { nome: string }
  pets: { id: string; nome: string; emoji: string; alertas: number }[]
  naoLidas: number
  children: React.ReactNode
}

const AVATAR_COLORS: [string, string][] = [
  ['#3C3489', '#CECBF6'],
  ['#085041', '#9FE1CB'],
  ['#4A1B0C', '#F0A58B'],
  ['#26215C', '#C5C2F5'],
  ['#4B1528', '#EDA8C0'],
]

function getAvatarColor(nome: string): [string, string] {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function SidebarClient({ usuario, familia, pets, naoLidas, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [badgeNaoLidas, setBadgeNaoLidas] = useState(naoLidas)
  const [avatarBg, avatarColor] = getAvatarColor(usuario.nome)

  useEffect(() => {
    const channel = supabase
      .channel('notificacoes-sidebar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => {
          setBadgeNaoLidas((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => {
          setBadgeNaoLidas((prev) => Math.max(0, prev - 1))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, usuario.id])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarStyle: React.CSSProperties = {
    width: '232px',
    background: '#18181B',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={sidebarStyle}>
        <div
          style={{
            padding: '22px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: '#EF9F27',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            🐾
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '17px', fontWeight: 800, color: '#fff' }}>PataFamilia</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.35)', fontWeight: 500 }}>{familia.nome}</div>
          </div>
        </div>

        <div style={{ padding: '20px 12px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.28)', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' }}>GERAL</div>
          <SbItem href="/dashboard" icon="⌂" label="Inicio" active={isActive('/dashboard')} />
          <SbItem href="/notificacoes" icon="!" label="Notificacoes" active={isActive('/notificacoes')} badge={badgeNaoLidas} />
        </div>

        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.28)', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' }}>NOSSOS PETS</div>
          {pets.map((pet, i) => {
            const dotColors = ['#EF9F27', '#1D9E75', '#7F77DD', '#D4537E', '#D85A30']
            return (
              <Link
                key={pet.id}
                href={`/pets/${pet.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  background: isActive(`/pets/${pet.id}`) ? 'rgba(239,159,39,.14)' : 'transparent',
                  color: isActive(`/pets/${pet.id}`) ? '#EF9F27' : 'rgba(255,255,255,.5)',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '2px',
                  transition: 'all .15s',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColors[i % dotColors.length], flexShrink: 0 }} />
                <span style={{ fontSize: '14px' }}>{pet.emoji}</span>
                <span style={{ flex: 1 }}>{pet.nome}</span>
                {pet.alertas > 0 && (
                  <span style={{ background: '#D85A30', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '2px 7px' }}>
                    {pet.alertas}
                  </span>
                )}
              </Link>
            )
          })}
          <Link
            href="/pets/novo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'rgba(255,255,255,.25)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>+</span>
            Adicionar pet
          </Link>
        </div>

        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.28)', letterSpacing: '1.2px', padding: '0 8px', marginBottom: '6px' }}>FAMILIA</div>
          <SbItem href="/familia" icon="=" label="Membros" active={isActive('/familia')} />
        </div>

        <div style={{ marginTop: 'auto', padding: '14px 12px' }}>
          <Link
            href="/perfil"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '12px',
              textDecoration: 'none',
              background: isActive('/perfil') ? 'rgba(239,159,39,.14)' : 'rgba(255,255,255,.05)',
              border: isActive('/perfil') ? '1px solid rgba(239,159,39,.28)' : '1px solid rgba(255,255,255,.08)',
              cursor: 'pointer',
              boxShadow: isActive('/perfil') ? '0 0 0 1px rgba(239,159,39,.08) inset' : 'none',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: avatarBg,
                color: avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '11px',
                flexShrink: 0,
              }}
            >
              {getInitials(usuario.nome)}
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{usuario.nome}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>
                {usuario.papel === 'ADMIN' ? 'Admin' : usuario.papel === 'MEMBRO' ? 'Membro' : 'Sem familia'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: isActive('/perfil') ? '#EF9F27' : 'rgba(255,255,255,.32)', letterSpacing: '.3px' }}>
                PERFIL
              </span>
              <span style={{ fontSize: '14px', color: isActive('/perfil') ? '#EF9F27' : 'rgba(255,255,255,.45)' }}>
                ›
              </span>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              marginTop: '8px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.08)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,.5)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,.15)'
              e.currentTarget.style.color = '#f87171'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,.06)'
              e.currentTarget.style.color = 'rgba(255,255,255,.5)'
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>{children}</main>
    </div>
  )
}

function SbItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: string
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '8px',
        color: active ? '#EF9F27' : 'rgba(255,255,255,.5)',
        textDecoration: 'none',
        background: active ? 'rgba(239,159,39,.14)' : 'transparent',
        borderLeft: `2px solid ${active ? '#EF9F27' : 'transparent'}`,
        fontSize: '13px',
        fontWeight: 500,
        marginBottom: '2px',
        transition: 'all .15s',
      }}
    >
      <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{ background: '#D85A30', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '2px 7px' }}>
          {badge}
        </span>
      )}
    </Link>
  )
}
