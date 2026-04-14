'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

const EMOJIS = ['🐕', '🐈', '🐇', '🐹', '🦜', '🐠', '🐢', '🦎', '🐓', '🐾']
const ESPECIES = ['Cachorro', 'Gato', 'Coelho', 'Hamster', 'Pássaro', 'Peixe', 'Réptil', 'Outro']

export default function NovoPetPage() {
  const [nome, setNome] = useState('')
  const [especie, setEspecie] = useState('')
  const [raca, setRaca] = useState('')
  const [sexo, setSexo] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [peso, setPeso] = useState('')
  const [emoji, setEmoji] = useState('🐕')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Não autenticado'); setLoading(false); return }

    const res = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome, especie, raca, sexo,
        dataNascimento: dataNascimento || null,
        peso: peso ? parseFloat(peso) : null,
        emoji,
        usuarioId: user.id,
      }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Erro ao cadastrar pet'); return }
    const pet = await res.json()
    toast.success(`${emoji} ${nome} cadastrado com sucesso!`)
    router.push(`/pets/${pet.id}`)
  }

  const inputStyle = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink4)', marginBottom: '5px', letterSpacing: '.3px' }

  return (
    <div style={{ padding: '24px', maxWidth: '560px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: 'var(--ink3)', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div>
          <div style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>Novo pet</div>
          <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>Cadastre um novo integrante da família</div>
        </div>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Emoji */}
          <div>
            <label style={labelStyle}>EMOJI DO PET</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)} style={{ width: '44px', height: '44px', borderRadius: '10px', border: `2px solid ${emoji === e ? 'var(--amber)' : 'var(--border)'}`, background: emoji === e ? 'var(--amber-50)' : 'var(--surface)', fontSize: '22px', cursor: 'pointer', transition: 'all .15s' }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={labelStyle}>NOME *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Bolinha" style={inputStyle} />
          </div>

          {/* Espécie + Raça */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>ESPÉCIE *</label>
              <select value={especie} onChange={e => setEspecie(e.target.value)} required style={{ ...inputStyle }}>
                <option value="">Selecione...</option>
                {ESPECIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>RAÇA</label>
              <input value={raca} onChange={e => setRaca(e.target.value)} placeholder="Ex: Golden Retriever" style={inputStyle} />
            </div>
          </div>

          {/* Sexo + Data nascimento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>SEXO</label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} style={{ ...inputStyle }}>
                <option value="">Selecione...</option>
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>DATA DE NASCIMENTO</label>
              <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Peso */}
          <div style={{ maxWidth: '200px' }}>
            <label style={labelStyle}>PESO (kg)</label>
            <input type="number" step="0.1" min="0" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 12.5" style={inputStyle} />
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Link href="/dashboard" style={{ padding: '8px 16px', border: '1px solid var(--border2)', borderRadius: '10px', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: 'var(--ink2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Cancelar</Link>
            <button type="submit" disabled={loading} style={{ background: 'var(--amber)', color: '#412402', border: 'none', borderRadius: '10px', padding: '8px 24px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando...' : 'Cadastrar pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
