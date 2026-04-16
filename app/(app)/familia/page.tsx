import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import FamiliaClient from '@/components/familia/FamiliaClient'

export default async function FamiliaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: {
      membro: {
        include: {
          familia: {
            include: {
              membros: { include: { usuario: true }, orderBy: { entradaEm: 'asc' } },
            },
          },
        },
      },
    },
  })

  if (!usuario?.membro) redirect('/onboarding')

  const { familia, papel } = usuario.membro

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>{`Família ${familia.nome}`}</div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '2px' }}>Gerencie membros e convites</div>
        </div>
      </div>
      <FamiliaClient
        familia={{ id: familia.id, nome: familia.nome, codigoConvite: familia.codigoConvite }}
        membros={familia.membros.map(m => ({ id: m.id, usuarioId: m.usuarioId, nome: m.usuario.nome, email: m.usuario.email, papel: m.papel, entradaEm: m.entradaEm.toISOString() }))}
        usuarioAtualId={user.id}
        isAdmin={papel === 'ADMIN'}
      />
    </div>
  )
}
