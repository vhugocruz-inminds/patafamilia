import { PrismaClient, PapelMembro, FrequenciaRemedio, TipoPasseio, TipoNotificacao } from '@prisma/client'

const prisma = new PrismaClient()

const nomes = [
  'Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
  'Igor', 'Juliana', 'Kevin', 'Laura', 'Marco', 'Natalia', 'Otavio', 'Patrícia',
  'Quentin', 'Rafaela', 'Samuel', 'Tania', 'Ulisses', 'Vanessa', 'Wagner', 'Ximena',
  'Yasmin', 'Zoe', 'Alice', 'Bernardo', 'Camila', 'Daniel', 'Elisa', 'Felipe',
  'Gabriela', 'Henrique', 'Ines', 'João', 'Karina', 'Leonardo', 'Mariana', 'Nicolas',
  'Olivia', 'Paulo', 'Quintino', 'Roberta', 'Sofia', 'Theodoro', 'Ursula', 'Vitor',
  'Wanda', 'Xavier', 'Yara', 'Zilda'
]

const sobrenomes = [
  'Silva', 'Santos', 'Costa', 'Oliveira', 'Ferreira', 'Gomes', 'Martins', 'Alves',
  'Pereira', 'Rocha', 'Sousa', 'Carvalho', 'Barbosa', 'Ribeiro', 'Monteiro', 'Castro'
]

const nomePets = [
  'Bolinha', 'Rex', 'Luna', 'Max', 'Bella', 'Charlie', 'Mimi', 'Whiskers',
  'Doge', 'Perla', 'Spike', 'Simba', 'Leo', 'Rocky', 'Shadow', 'Nala',
  'Buddy', 'Daisy', 'Gizmo', 'Socks'
]

const racasCao = ['Golden Retriever', 'Labrador', 'Poodle', 'Bulldog', 'Pastor Alemão', 'Husky', 'Dálmata']
const racasGato = ['Persa', 'Siamês', 'Maine Coon', 'Bengal', 'Ragdoll', 'Abissínio']

function gerarEmail(nome: string, sobrenome: string, indice?: number): string {
  const base = `${nome.toLowerCase()}.${sobrenome.toLowerCase()}`
  return indice ? `${base}${indice}@petafamilia.app` : `${base}@petafamilia.app`
}

async function main() {
  console.log('🌱 Iniciando seed com 50 usuários...')

  // Limpar dados existentes
  await prisma.notificacao.deleteMany()
  await prisma.execucao.deleteMany()
  await prisma.cuidado.deleteMany()
  await prisma.passeio.deleteMany()
  await prisma.administracao.deleteMany()
  await prisma.remedio.deleteMany()
  await prisma.pet.deleteMany()
  await prisma.membro.deleteMany()
  await prisma.familia.deleteMany()
  await prisma.usuario.deleteMany()

  const usuarios = []

  // Criar 50 usuários
  for (let i = 0; i < 50; i++) {
    const nome = nomes[i % nomes.length]
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
    const email = gerarEmail(nome, sobrenome, i > 0 ? Math.floor(i / nomes.length) + 1 : undefined)

    const usuario = await prisma.usuario.create({
      data: {
        email,
        nome: `${nome} ${sobrenome}`,
        avatarUrl: `https://i.pravatar.cc/100?img=${i}`,
      },
    })
    usuarios.push(usuario)
    console.log(`✓ Usuário ${i + 1}/50: ${usuario.nome}`)
  }

  // Criar 10 famílias com 5 membros cada
  for (let f = 0; f < 10; f++) {
    const codigoConvite = `FAM-${String(f + 1).padStart(2, '0')}-${Math.random().toString(36).substring(7).toUpperCase()}`
    
    const familia = await prisma.familia.create({
      data: {
        nome: `Família ${sobrenomes[f]}`,
        codigoConvite,
      },
    })

    // 5 membros por família
    const membrosIndices = Array.from({ length: 5 }, () => Math.floor(Math.random() * 50))
    
    for (let m = 0; m < 5; m++) {
      const usuarioIndex = (f * 5 + m) % 50
      const usuario = usuarios[usuarioIndex]

      await prisma.membro.create({
        data: {
          usuarioId: usuario.id,
          familiaId: familia.id,
          papel: m === 0 ? PapelMembro.ADMIN : PapelMembro.MEMBRO,
          entradaEm: new Date(2026, 0, f * 5 + m + 1),
        },
      })
    }

    // 2-3 pets por família
    const numPets = 2 + Math.floor(Math.random() * 2)
    for (let p = 0; p < numPets; p++) {
      const especie = Math.random() > 0.6 ? 'Gato' : 'Cachorro'
      const raca = especie === 'Cachorro' 
        ? racasCao[Math.floor(Math.random() * racasCao.length)]
        : racasGato[Math.floor(Math.random() * racasGato.length)]

      const pet = await prisma.pet.create({
        data: {
          nome: nomePets[Math.floor(Math.random() * nomePets.length)],
          especie,
          raca,
          sexo: Math.random() > 0.5 ? 'Macho' : 'Fêmea',
          peso: Math.round((Math.random() * 30 + 2) * 10) / 10,
          emoji: especie === 'Cachorro' ? '🐕' : '🐈',
          familiaId: familia.id,
        },
      })

      // 1-2 remédios por pet
      if (Math.random() > 0.5) {
        await prisma.remedio.create({
          data: {
            nome: 'Vermífugo',
            dose: '1 comprimido',
            frequencia: FrequenciaRemedio.MENSAL,
            dataInicio: new Date(2026, 0, 1),
            petId: pet.id,
          },
        })
      }
    }

    console.log(`✓ Família ${f + 1}/10: ${familia.nome} criada com 5 membros`)
  }

  console.log('✅ Seed concluído! 50 usuários criados em 10 famílias.')
  console.log(`   Total de usuários: 50`)
  console.log(`   Total de famílias: 10`)
  console.log(`   Membros por família: 5`)
  console.log(`   Pets criados: ~${10 * 2} a ${10 * 3}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
