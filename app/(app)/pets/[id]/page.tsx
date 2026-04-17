import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import PetProfileClient from '@/components/pets/PetProfileClient'

export default async function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    include: { membro: true },
  })
  if (!usuario?.membro) redirect('/onboarding')

  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      remedios: {
        where: { ativo: true },
        orderBy: { criadoEm: 'asc' },
        include: {
          administracoes: {
            orderBy: { administradoEm: 'desc' },
            include: {
              membro: { include: { usuario: { select: { nome: true } } } },
            },
          },
        },
      },
      cuidados: {
        where: { ativo: true },
        orderBy: { criadoEm: 'asc' },
        include: {
          execucoes: {
            orderBy: { executadoEm: 'desc' },
            include: {
              membro: { include: { usuario: { select: { nome: true } } } },
            },
          },
        },
      },
      passeios: {
        orderBy: { criadoEm: 'desc' },
        include: {
          membro: { include: { usuario: { select: { nome: true } } } },
        },
      },
    },
  })

  if (!pet || pet.familiaId !== usuario.membro.familiaId) redirect('/dashboard')

  // Serialize dates to strings for client component
  const petData = {
    id: pet.id,
    nome: pet.nome,
    emoji: pet.emoji,
    especie: pet.especie,
    raca: pet.raca,
    sexo: pet.sexo,
    dataNascimento: pet.dataNascimento?.toISOString() ?? null,
    peso: pet.peso ? Number(pet.peso) : null,
  }

  const remediosData = pet.remedios.map(r => ({
    id: r.id,
    nome: r.nome,
    dose: r.dose,
    frequencia: r.frequencia,
    dataInicio: r.dataInicio.toISOString(),
    dataFim: r.dataFim?.toISOString() ?? null,
    ativo: r.ativo,
    administracoes: r.administracoes.map(a => ({
      id: a.id,
      administradoEm: a.administradoEm.toISOString(),
      statusDose: a.statusDose ?? null,
      membro: { usuario: { nome: a.membro.usuario.nome } },
    })),
  }))

  const cuidadosData = pet.cuidados.map(c => ({
    id: c.id,
    tipo: c.tipo,
    frequenciaDias: c.frequenciaDias,
    configuracao: c.configuracao ?? null,
    ultimaExecucao: c.ultimaExecucao?.toISOString() ?? null,
    proximaExecucao: c.proximaExecucao?.toISOString() ?? null,
    ativo: c.ativo,
    execucoes: c.execucoes.map(e => ({
      id: e.id,
      executadoEm: e.executadoEm.toISOString(),
      membro: { usuario: { nome: e.membro.usuario.nome } },
    })),
  }))

  const passeiosData = pet.passeios.map(p => ({
    id: p.id,
    tipo: p.tipo as 'REALIZADO' | 'AGENDADO',
    duracaoMin: p.duracaoMin,
    local: p.local,
    observacoes: p.observacoes,
    realizadoEm: p.realizadoEm?.toISOString() ?? null,
    agendadoEm: p.agendadoEm?.toISOString() ?? null,
    membro: { usuario: { nome: p.membro.usuario.nome } },
  }))

  return (
    <PetProfileClient
      pet={petData}
      remedios={remediosData}
      cuidados={cuidadosData}
      passeios={passeiosData}
      membroId={usuario.membro.id}
    />
  )
}
