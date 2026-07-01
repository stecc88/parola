'use client'

import { useState } from 'react'

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className ?? 'text-xs text-brand-400 underline hover:text-brand-500'}
    >
      {copied ? '✓ Copiato' : 'Copia'}
    </button>
  )
}
