export const CORSI = [
  { value: '1', label: '1ro' },
  { value: '2', label: '2do' },
  { value: '3', label: '3ro' },
  { value: '4', label: '4to' },
  { value: '5', label: '5to' },
  { value: '7', label: '7mo' }
] as const

export const CORSI_VALIDI = CORSI.map((c) => c.value)

export type Corso = (typeof CORSI_VALIDI)[number]

export function corsoLabel(corso: string | null): string {
  return CORSI.find((c) => c.value === corso)?.label ?? '—'
}
