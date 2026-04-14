import Link from 'next/link'

const FEATURES = [
  {
    icon: '💊',
    title: 'Medicamentos',
    desc: 'Controle horários, doses e histórico de remédios. Nunca mais esqueça uma dose.',
    color: 'var(--teal)',
    bg: 'var(--teal-50)',
  },
  {
    icon: '🚶',
    title: 'Passeios',
    desc: 'Registre passeios, acompanhe quem levou e mantenha a rotina em dia.',
    color: 'var(--coral)',
    bg: 'var(--coral-50)',
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: 'Família Conectada',
    desc: 'Convide membros da família para dividir responsabilidades e cuidados.',
    color: 'var(--purple)',
    bg: 'var(--purple-50)',
  },
  {
    icon: '🔔',
    title: 'Notificações',
    desc: 'Alertas inteligentes para medicamentos, cuidados pendentes e mais.',
    color: 'var(--pink)',
    bg: 'var(--pink-50)',
  },
]

const STEPS = [
  { num: '01', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito em segundos.' },
  { num: '02', title: 'Adicione seus pets', desc: 'Registre seus companheiros com foto e informações.' },
  { num: '03', title: 'Cuide em família', desc: 'Convide membros e dividam os cuidados juntos.' },
]

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--surface)',
        fontFamily: 'var(--font-jakarta, sans-serif)',
        overflow: 'hidden',
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(250,250,249,.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              background: 'var(--amber)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            🐾
          </div>
          <span
            style={{
              fontFamily: 'var(--font-syne, sans-serif)',
              fontWeight: 800,
              fontSize: '18px',
              color: 'var(--ink)',
            }}
          >
            PataFamília
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/login"
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink2)',
              textDecoration: 'none',
              borderRadius: '8px',
              transition: 'background .2s',
            }}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#412402',
              background: 'var(--amber)',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'transform .2s, box-shadow .2s',
              boxShadow: '0 1px 3px rgba(239,159,39,.3)',
            }}
          >
            Criar Conta
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '120px 24px 80px',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239,159,39,.12) 0%, transparent 70%)',
              top: '-10%',
              right: '-10%',
              animation: 'float 8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(29,158,117,.08) 0%, transparent 70%)',
              bottom: '5%',
              left: '-5%',
              animation: 'float 10s ease-in-out infinite reverse',
            }}
          />
          {/* Floating paws */}
          {[
            { top: '15%', left: '8%', size: '48px', delay: '0s', opacity: 0.07 },
            { top: '25%', right: '12%', size: '36px', delay: '1.5s', opacity: 0.06 },
            { bottom: '20%', left: '15%', size: '28px', delay: '3s', opacity: 0.05 },
            { bottom: '30%', right: '8%', size: '42px', delay: '0.8s', opacity: 0.08 },
            { top: '60%', left: '5%', size: '32px', delay: '2.2s', opacity: 0.05 },
          ].map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                fontSize: p.size,
                opacity: p.opacity,
                animation: `float ${6 + i}s ease-in-out ${p.delay} infinite`,
                ...p,
              }}
            >
              🐾
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '720px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'var(--amber-50)',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--amber-800)',
              marginBottom: '28px',
              animation: 'fadeUp .6s ease-out both',
            }}
          >
            <span style={{ fontSize: '14px' }}>🐾</span>
            Cuidados do seu pet, em família
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--font-syne, sans-serif)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.08,
              color: 'var(--ink)',
              margin: '0 0 20px',
              letterSpacing: '-1.5px',
              animation: 'fadeUp .6s ease-out .15s both',
            }}
          >
            Toda a família unida{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--amber) 0%, var(--coral) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              pelo seu pet
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: 'var(--ink3)',
              lineHeight: 1.6,
              maxWidth: '520px',
              margin: '0 auto 36px',
              animation: 'fadeUp .6s ease-out .3s both',
            }}
          >
            Organize medicamentos, passeios e cuidados do dia a dia.
            Divida responsabilidades com quem mais ama seus bichinhos.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'fadeUp .6s ease-out .45s both',
            }}
          >
            <Link
              href="/cadastro"
              style={{
                padding: '14px 32px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#412402',
                background: 'var(--amber)',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(239,159,39,.35), 0 1px 3px rgba(0,0,0,.06)',
                transition: 'transform .2s, box-shadow .2s',
              }}
            >
              Comece Agora — é grátis
            </Link>
            <a
              href="#como-funciona"
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--ink2)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'border-color .2s, box-shadow .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}
            >
              Como funciona
            </a>
          </div>

          {/* Social proof */}
          <div
            style={{
              marginTop: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              animation: 'fadeUp .6s ease-out .6s both',
            }}
          >
            <div style={{ display: 'flex' }}>
              {['#E8927C', '#7AC7B8', '#B39DDB', '#FFB74D'].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: '2px solid var(--surface)',
                    marginLeft: i > 0 ? '-8px' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  {['🐶', '🐱', '🐰', '🐦'][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--ink3)' }}>
              <strong style={{ color: 'var(--ink2)' }}>Famílias</strong> já cuidando juntas
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        style={{
          padding: '80px 24px 100px',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-syne, sans-serif)',
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 12px',
              letterSpacing: '-1px',
            }}
          >
            Tudo que seu pet precisa
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--ink3)', maxWidth: '440px', margin: '0 auto' }}>
            Ferramentas pensadas para simplificar o cuidado diário dos seus companheiros.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '28px 24px',
                transition: 'transform .25s, box-shadow .25s',
                cursor: 'default',
                animation: `fadeUp .5s ease-out ${0.1 * i}s both`,
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: f.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '18px',
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-syne, sans-serif)',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: '0 0 8px',
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink3)', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <section
        id="como-funciona"
        style={{
          padding: '80px 24px 100px',
          background: 'var(--ink)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,159,39,.08) 0%, transparent 70%)',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-syne, sans-serif)',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 12px',
                letterSpacing: '-1px',
              }}
            >
              Simples como deve ser
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', maxWidth: '400px', margin: '0 auto' }}>
              Três passos para começar a cuidar melhor do seu pet.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
            }}
          >
            {STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '32px 24px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.06)',
                  animation: `fadeUp .5s ease-out ${0.15 * i}s both`,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-syne, sans-serif)',
                    fontSize: '36px',
                    fontWeight: 800,
                    color: 'var(--amber)',
                    opacity: 0.3,
                    marginBottom: '16px',
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-syne, sans-serif)',
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#fff',
                    margin: '0 0 8px',
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', lineHeight: 1.6, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239,159,39,.1) 0%, transparent 70%)',
              bottom: '-20%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        <div style={{ position: 'relative', maxWidth: '560px', margin: '0 auto' }}>
          <div
            style={{
              fontSize: '56px',
              marginBottom: '20px',
              animation: 'float 4s ease-in-out infinite',
            }}
          >
            🐾
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-syne, sans-serif)',
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 14px',
              letterSpacing: '-1px',
            }}
          >
            Pronto para cuidar melhor?
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--ink3)',
              lineHeight: 1.6,
              margin: '0 0 32px',
            }}
          >
            Junte-se às famílias que já organizam a rotina dos seus pets de forma simples e colaborativa.
          </p>
          <Link
            href="/cadastro"
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#412402',
              background: 'var(--amber)',
              borderRadius: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(239,159,39,.35), 0 1px 4px rgba(0,0,0,.06)',
              transition: 'transform .2s, box-shadow .2s',
            }}
          >
            Criar Conta Grátis
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: '32px 24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>🐾</span>
          <span
            style={{
              fontFamily: 'var(--font-syne, sans-serif)',
              fontWeight: 800,
              fontSize: '14px',
              color: 'var(--ink)',
            }}
          >
            PataFamília
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink4)', margin: 0 }}>
          Feito com amor para quem ama seus pets.
        </p>
      </footer>

      {/* ── Animations ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(24px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50%      { transform: translateY(-12px); }
            }
            a[href="/cadastro"]:hover,
            a[href="/cadastro"]:focus-visible {
              transform: translateY(-2px);
              box-shadow: 0 6px 28px rgba(239,159,39,.4), 0 2px 6px rgba(0,0,0,.08) !important;
            }
            a[href="/login"]:hover {
              background: rgba(0,0,0,.04);
            }
            div[style*="gridTemplateColumns"] > div:hover {
              transform: translateY(-4px);
              box-shadow: 0 8px 32px rgba(0,0,0,.06);
            }
            @media (max-width: 640px) {
              nav { padding: 0 16px !important; }
            }
          `,
        }}
      />
    </div>
  )
}
