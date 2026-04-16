import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function calcularIdade(dataNascimento: Date): string {
  const hoje = new Date()
  const anos = hoje.getFullYear() - dataNascimento.getFullYear()
  const meses = hoje.getMonth() - dataNascimento.getMonth()
  if (anos === 0) return `${Math.max(0, meses)} meses`
  const anosAjustados = meses < 0 ? anos - 1 : anos
  return `${anosAjustados} ${anosAjustados === 1 ? 'ano' : 'anos'}`
}

const INTERVALOS_DIAS: Record<string, number> = {
  DIARIO: 1,
  SEMANAL: 7,
  QUINZENAL: 15,
  MENSAL: 30,
  PERSONALIZADO: 1,
}

export function calcularStatusRemedio(
  frequencia: string,
  ultimaAdministracao: Date | null,
  dataInicio: Date
): 'EM_DIA' | 'EM_BREVE' | 'ATRASADO' {
  const agora = new Date()
  const intervalo = INTERVALOS_DIAS[frequencia] ?? 1

  if (!ultimaAdministracao) {
    // Comparar só pelo dia (sem hora) para evitar ATRASADO no próprio dia de início
    const hojeInicio = new Date(agora)
    hojeInicio.setHours(0, 0, 0, 0)
    const dataInicioNorm = new Date(dataInicio)
    dataInicioNorm.setHours(0, 0, 0, 0)
    if (dataInicioNorm < hojeInicio) return 'ATRASADO'
    const diffDias = (dataInicioNorm.getTime() - hojeInicio.getTime()) / (1000 * 60 * 60 * 24)
    return diffDias <= 7 ? 'EM_BREVE' : 'EM_DIA'
  }

  const proxima = new Date(ultimaAdministracao.getTime() + intervalo * 24 * 60 * 60 * 1000)
  const diffDias = (proxima.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)

  if (diffDias < 0) return 'ATRASADO'
  if (diffDias <= 7) return 'EM_BREVE'
  return 'EM_DIA'
}

export function calcularStatusCuidado(
  proximaExecucao: Date | null
): 'EM_DIA' | 'EM_BREVE' | 'ATRASADO' {
  if (!proximaExecucao) return 'ATRASADO'
  const agora = new Date()
  // Comparar pelo dia normalizado: cuidado agendado para hoje não é ATRASADO
  const hojeInicio = new Date(agora)
  hojeInicio.setHours(0, 0, 0, 0)
  const proximaNorm = new Date(proximaExecucao)
  proximaNorm.setHours(0, 0, 0, 0)
  if (proximaNorm < hojeInicio) return 'ATRASADO'
  const diffDias = (proximaNorm.getTime() - hojeInicio.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDias <= 7) return 'EM_BREVE'
  return 'EM_DIA'
}

export function gerarCodigoConvite(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data)
}

export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data)
}

export function saudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function dataAtualPorExtenso(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export function isDuplicateAdministracao(
  frequencia: string,
  ultimaAdministracao: Date
): boolean {
  const intervalo = INTERVALOS_DIAS[frequencia] ?? 1
  const metadeIntervaloMs = (intervalo * 24 * 60 * 60 * 1000) / 2
  const agora = new Date()
  return agora.getTime() - ultimaAdministracao.getTime() < metadeIntervaloMs
}
