'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PapelMembro } from '@prisma/client'
import {
  BellIcon,
  ChevronRightIcon,
  HouseIcon,
  LogOutIcon,
  PawPrintIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import styles from './SidebarClient.module.css'

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

const PET_ACCENT_COLORS = ['#EF9F27', '#1D9E75', '#7F77DD', '#D4537E', '#D85A30']

function getAvatarColor(nome: string): [string, string] {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function getPapelLabel(papel: PapelMembro | null) {
  if (papel === 'ADMIN') return 'Admin da familia'
  if (papel === 'MEMBRO') return 'Membro da familia'
  return 'Sem familia'
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

  return (
    <div className={styles.layoutShell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.brandBlock}>
            <div className={styles.brandMark} aria-hidden="true">
              <PawPrintIcon size={17} strokeWidth={2.2} />
            </div>
            <div className={styles.brandCopy}>
              <div className={styles.brandTitle}>PataFamilia</div>
              <div className={styles.familyName} title={familia.nome}>
                {familia.nome}
              </div>
            </div>
          </div>

          <SidebarSection label="Navegacao">
            <SidebarItem
              href="/dashboard"
              icon={<HouseIcon size={16} strokeWidth={2.1} />}
              label="Inicio"
              active={isActive('/dashboard')}
            />
            <SidebarItem
              href="/notificacoes"
              icon={<BellIcon size={16} strokeWidth={2.1} />}
              label="Notificacoes"
              active={isActive('/notificacoes')}
              badge={badgeNaoLidas}
            />
            <SidebarItem
              href="/familia"
              icon={<UsersIcon size={16} strokeWidth={2.1} />}
              label="Familia"
              active={isActive('/familia')}
            />
          </SidebarSection>

          <SidebarSection
            label="Nossos pets"
            action={
              <Link href="/pets/novo" className={styles.inlineAction}>
                <PlusIcon size={13} strokeWidth={2.4} />
                <span>Novo</span>
              </Link>
            }
          >
            <div className={styles.petList}>
              {pets.length === 0 ? (
                <div className={styles.emptyPets}>
                  <div className={styles.emptyPetsIcon} aria-hidden="true">
                    <PawPrintIcon size={14} strokeWidth={2.1} />
                  </div>
                  <div className={styles.emptyPetsTitle}>Nenhum pet cadastrado</div>
                  <div className={styles.emptyPetsText}>Adicione o primeiro pet da familia para acompanhar cuidados.</div>
                </div>
              ) : (
                pets.map((pet, index) => {
                  const petHref = `/pets/${pet.id}`
                  const active = isActive(petHref)
                  const accent = PET_ACCENT_COLORS[index % PET_ACCENT_COLORS.length]
                  const statusLabel = pet.alertas > 0 ? `${pet.alertas} alerta${pet.alertas > 1 ? 's' : ''}` : 'Em dia'

                  return (
                    <Link
                      key={pet.id}
                      href={petHref}
                      className={cn(styles.petItem, active && styles.petItemActive)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span
                        className={styles.petAccent}
                        style={{ backgroundColor: accent }}
                        aria-hidden="true"
                      />
                      <span className={styles.petEmojiWrap} aria-hidden="true">
                        <span className={styles.petEmoji}>{pet.emoji}</span>
                      </span>
                      <span className={styles.petText}>
                        <span className={styles.petName} title={pet.nome}>
                          {pet.nome}
                        </span>
                        <span
                          className={cn(
                            styles.petMeta,
                            pet.alertas > 0 ? styles.petMetaAlert : styles.petMetaOk
                          )}
                        >
                          {statusLabel}
                        </span>
                      </span>
                    </Link>
                  )
                })
              )}
            </div>

            <Link href="/pets/novo" className={styles.addPetButton}>
              <span className={styles.addPetIcon} aria-hidden="true">
                <PlusIcon size={15} strokeWidth={2.4} />
              </span>
              <span>Adicionar pet</span>
            </Link>
          </SidebarSection>

          <div className={styles.footerBlock}>
            <Link
              href="/perfil"
              className={cn(styles.profileCard, isActive('/perfil') && styles.profileCardActive)}
              aria-current={isActive('/perfil') ? 'page' : undefined}
            >
              <span
                className={styles.profileAvatar}
                style={{ backgroundColor: avatarBg, color: avatarColor }}
              >
                {getInitials(usuario.nome)}
              </span>

              <span className={styles.profileText}>
                <span className={styles.profileName} title={usuario.nome}>
                  {usuario.nome}
                </span>
                <span className={styles.profileRole}>{getPapelLabel(usuario.papel)}</span>
              </span>

              <span className={styles.profileArrow} aria-hidden="true">
                <ChevronRightIcon size={15} strokeWidth={2.2} />
              </span>
            </Link>

            <button type="button" onClick={handleSignOut} className={styles.signOutButton}>
              <LogOutIcon size={15} strokeWidth={2.1} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>{children}</main>
    </div>
  )
}

function SidebarSection({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={styles.sectionBlock}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>{label}</span>
        {action}
      </div>
      {children}
    </section>
  )
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      className={cn(styles.navItem, active && styles.navItemActive)}
      aria-current={active ? 'page' : undefined}
    >
      <span className={styles.navIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.navLabel}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={styles.navBadge} aria-label={`${badge} notificacoes nao lidas`}>
          {badge}
        </span>
      )}
    </Link>
  )
}
