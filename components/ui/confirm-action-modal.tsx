'use client'

import { ReactNode } from 'react'

type Tone = 'danger' | 'warning' | 'teal'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  cancelLabel?: string
  confirmDisabled?: boolean
  closeDisabled?: boolean
  loading?: boolean
  loadingLabel?: string
  maxWidth?: string
  tone?: Tone
  icon?: string
  noteTitle?: string
  noteDescription?: ReactNode
  children?: ReactNode
}

const toneStyles: Record<
  Tone,
  {
    iconBg: string
    iconColor: string
    noteBg: string
    noteBorder: string
    noteTitleColor: string
    confirmBg: string
    confirmColor: string
  }
> = {
  danger: {
    iconBg: '#FFF3F0',
    iconColor: 'var(--coral)',
    noteBg: '#FFF7E8',
    noteBorder: '#F6D699',
    noteTitleColor: 'var(--amber-800)',
    confirmBg: '#D85A30',
    confirmColor: '#fff',
  },
  warning: {
    iconBg: 'var(--amber-50)',
    iconColor: 'var(--amber-800)',
    noteBg: '#FFF7E8',
    noteBorder: '#F6D699',
    noteTitleColor: 'var(--amber-800)',
    confirmBg: 'var(--amber)',
    confirmColor: '#412402',
  },
  teal: {
    iconBg: 'var(--teal-50)',
    iconColor: 'var(--teal-800)',
    noteBg: 'var(--teal-50)',
    noteBorder: '#9FE1CB',
    noteTitleColor: 'var(--teal-800)',
    confirmBg: 'var(--teal)',
    confirmColor: '#fff',
  },
}

export function ConfirmActionModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = 'Cancelar',
  confirmDisabled = false,
  closeDisabled = false,
  loading = false,
  loadingLabel = 'Confirmando...',
  maxWidth = '520px',
  tone = 'danger',
  icon = '!',
  noteTitle,
  noteDescription,
  children,
}: Props) {
  if (!open) return null

  const styles = toneStyles[tone]
  const disabled = loading || confirmDisabled

  return (
    <div
      onClick={closeDisabled ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(24,24,27,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          background: 'var(--card)',
          borderRadius: '18px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0,0,0,.22)',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: styles.iconBg,
            color: styles.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            marginBottom: '14px',
          }}
        >
          {icon}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: '8px',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ink3)', lineHeight: 1.7, marginBottom: '18px' }}>
          {description}
        </div>

        {noteTitle && noteDescription && (
          <div
            style={{
              background: styles.noteBg,
              border: `1px solid ${styles.noteBorder}`,
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: styles.noteTitleColor,
                marginBottom: '4px',
              }}
            >
              {noteTitle}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>{noteDescription}</div>
          </div>
        )}

        {children}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled || loading}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border2)',
              background: 'transparent',
              color: 'var(--ink3)',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: closeDisabled || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              background: styles.confirmBg,
              color: styles.confirmColor,
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.7 : 1,
            }}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
