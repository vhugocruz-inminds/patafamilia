import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Carregar .env.local manualmente
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = envContent.split('\n').reduce((acc: Record<string, string>, line) => {
  const [key, ...value] = line.split('=')
  if (key && value) {
    acc[key.trim()] = value.join('=').trim()
  }
  return acc
}, {})

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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

async function createTestUser() {
  try {
    console.log('🔐 Testando conexão com Supabase...')
    
    const email = 'teste@petafamilia.app'
    const password = 'Teste123456'

    // Deletar se já existir
    try {
      await supabase.auth.admin.deleteUser(email)
      console.log(`✓ Usuário anterior removido`)
    } catch (e) {
      // Ignorar se não existir
    }

    // Criar novo
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      console.error('❌ Erro ao criar usuário teste:', error.message)
      return false
    }

    console.log(`✅ Usuário teste criado com sucesso!`)
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    return true
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
    return false
  }
}

async function createBulkUsers(count: number) {
  console.log(`\n🌱 Criando ${count} usuários no Supabase Auth...`)
  
  let created = 0
  let failed = 0

  for (let i = 0; i < count; i++) {
    const nome = nomes[i % nomes.length]
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]
    const email = `${nome.toLowerCase()}.${sobrenome.toLowerCase()}${i > nomes.length ? Math.floor(i / nomes.length) : ''}@petafamilia.app`
    const password = 'Teste123456'

    try {
      // Deletar se já existir
      try {
        await supabase.auth.admin.deleteUser(email)
      } catch (e) {
        // Ignorar
      }

      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) {
        failed++
        console.log(`✗ ${i + 1}/${count}: ${email} - ${error.message}`)
      } else {
        created++
        if (created % 5 === 0) {
          console.log(`✓ ${created}/${count} usuários criados...`)
        }
      }
    } catch (error) {
      failed++
      console.log(`✗ ${i + 1}/${count}: ${email} - Erro desconhecido`)
    }
  }

  console.log(`\n✅ Setup concluído!`)
  console.log(`   ✓ ${created} usuários criados`)
  console.log(`   ✗ ${failed} falharam`)
  console.log(`\n📝 Credenciais para teste:`)
  console.log(`   Email: qualquer um dos usuários criados (ex: ana.silva@petafamilia.app)`)
  console.log(`   Senha: Teste123456`)
}

async function main() {
  const isConnected = await createTestUser()
  
  if (!isConnected) {
    console.error('\n❌ Não foi possível conectar ao Supabase!')
    console.error('Verifique:')
    console.error('  1. Se a senha do banco está correta')
    console.error('  2. Se o Supabase está rodando')
    console.error('  3. Se as credenciais são válidas')
    process.exit(1)
  }

  await createBulkUsers(50)
}

main().catch(console.error)
