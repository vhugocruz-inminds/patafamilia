-- Script SQL para criar todas as tabelas do PataFamília
-- Execute no Supabase SQL Editor ou via psql
-- Versão completa com todos os tipos ENUM e tabelas

-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Famílias
CREATE TABLE IF NOT EXISTS familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  codigo_convite VARCHAR(255) UNIQUE NOT NULL,
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tipos ENUM
CREATE TYPE IF NOT EXISTS "PapelMembro" AS ENUM ('ADMIN', 'MEMBRO');
CREATE TYPE IF NOT EXISTS "FrequenciaRemedio" AS ENUM ('DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'PERSONALIZADO');
CREATE TYPE IF NOT EXISTS "TipoPasseio" AS ENUM ('REALIZADO', 'AGENDADO');
CREATE TYPE IF NOT EXISTS "TipoNotificacao" AS ENUM ('NOVO_REGISTRO', 'NOVO_CUIDADO', 'LEMBRETE', 'ATRASADO', 'NOVO_MEMBRO');

-- Membros
CREATE TABLE IF NOT EXISTS membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  familia_id UUID NOT NULL,
  papel "PapelMembro" DEFAULT 'MEMBRO',
  entrada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE
);

-- Pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  especie VARCHAR(255) NOT NULL,
  raca VARCHAR(255),
  sexo VARCHAR(255),
  data_nascimento DATE,
  peso FLOAT,
  foto_url VARCHAR(255),
  emoji VARCHAR(10) DEFAULT '🐾',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE
);

-- Remédios (COMPLETO COM FREQUENCIA)
CREATE TABLE IF NOT EXISTS remedios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  dose VARCHAR(255) NOT NULL,
  frequencia "FrequenciaRemedio" NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Administrações
CREATE TABLE IF NOT EXISTS administracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remedio_id UUID NOT NULL,
  membro_id UUID NOT NULL,
  administrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT,
  FOREIGN KEY (remedio_id) REFERENCES remedios(id) ON DELETE CASCADE,
  FOREIGN KEY (membro_id) REFERENCES membros(id)
);

-- Passeios (COMPLETO)
CREATE TABLE IF NOT EXISTS passeios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL,
  membro_id UUID NOT NULL,
  duracao_min INT,
  local VARCHAR(255),
  observacoes TEXT,
  realizado_em TIMESTAMP,
  agendado_em TIMESTAMP,
  tipo "TipoPasseio" DEFAULT 'REALIZADO',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (membro_id) REFERENCES membros(id)
);

-- Cuidados (COMPLETO)
CREATE TABLE IF NOT EXISTS cuidados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  frequencia_dias INT NOT NULL,
  ultima_execucao TIMESTAMP,
  proxima_execucao TIMESTAMP,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Execuções (COMPLETO)
CREATE TABLE IF NOT EXISTS execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuidado_id UUID NOT NULL,
  membro_id UUID NOT NULL,
  executado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT,
  FOREIGN KEY (cuidado_id) REFERENCES cuidados(id) ON DELETE CASCADE,
  FOREIGN KEY (membro_id) REFERENCES membros(id)
);

-- Notificações (COMPLETO)
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  familia_id UUID NOT NULL,
  tipo "TipoNotificacao" NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  emoji VARCHAR(10),
  criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (familia_id) REFERENCES familias(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_membros_usuario ON membros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membros_familia ON membros(familia_id);
CREATE INDEX IF NOT EXISTS idx_pets_familia ON pets(familia_id);
CREATE INDEX IF NOT EXISTS idx_remedios_pet ON remedios(pet_id);
CREATE INDEX IF NOT EXISTS idx_passeios_pet ON passeios(pet_id);
CREATE INDEX IF NOT EXISTS idx_cuidados_pet ON cuidados(pet_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);

COMMIT;
