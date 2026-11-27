/**
 * Plain-language request statuses for residents, in English and Filipino.
 *
 * The API uses many internal status values (barangay_processing, ready_for_pickup...).
 * Residents only need four stages, the same ones they know from the hall:
 * received, being processed, ready, released.
 */
export type StageKey = 'received' | 'processing' | 'ready' | 'released'

export const STAGES: { key: StageKey; en: string; fil: string }[] = [
  { key: 'received', en: 'Received', fil: 'Natanggap' },
  { key: 'processing', en: 'Being processed', fil: 'Pinoproseso' },
  { key: 'ready', en: 'Ready', fil: 'Handa na' },
  { key: 'released', en: 'Released', fil: 'Naibigay na' },
]

type StatusInfo = {
  stage: StageKey | 'stopped'
  en: string
  fil: string
  tone: 'neutral' | 'info' | 'success' | 'danger'
}

const STATUS: Record<string, StatusInfo> = {
  pending: { stage: 'received', en: 'Received, waiting for review', fil: 'Natanggap, naghihintay ng pagsusuri', tone: 'neutral' },
  barangay_processing: { stage: 'processing', en: 'Being processed at the barangay hall', fil: 'Pinoproseso sa barangay hall', tone: 'info' },
  barangay_approved: { stage: 'processing', en: 'Approved by the barangay, sent to the municipal hall', fil: 'Aprubado ng barangay, ipinasa sa munisipyo', tone: 'info' },
  approved: { stage: 'processing', en: 'Approved, being prepared', fil: 'Aprubado, inihahanda na', tone: 'info' },
  processing: { stage: 'processing', en: 'Being processed', fil: 'Pinoproseso', tone: 'info' },
  in_progress: { stage: 'processing', en: 'Being processed', fil: 'Pinoproseso', tone: 'info' },
  ready: { stage: 'ready', en: 'Ready', fil: 'Handa na', tone: 'success' },
  ready_for_pickup: { stage: 'ready', en: 'Ready for pickup', fil: 'Handa nang kunin', tone: 'success' },
  completed: { stage: 'released', en: 'Released', fil: 'Naibigay na', tone: 'success' },
  picked_up: { stage: 'released', en: 'Picked up', fil: 'Nakuha na', tone: 'success' },
  closed: { stage: 'released', en: 'Closed', fil: 'Sarado na', tone: 'neutral' },
  rejected: { stage: 'stopped', en: 'Not approved', fil: 'Hindi naaprubahan', tone: 'danger' },
  barangay_rejected: { stage: 'stopped', en: 'Not approved by the barangay', fil: 'Hindi naaprubahan ng barangay', tone: 'danger' },
  cancelled: { stage: 'stopped', en: 'Cancelled', fil: 'Kinansela', tone: 'neutral' },
}

export function statusInfo(status?: string): StatusInfo {
  const key = String(status || 'pending').toLowerCase()
  return STATUS[key] || {
    stage: 'received',
    en: key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    fil: key.replace(/_/g, ' '),
    tone: 'neutral',
  }
}

export function statusLabel(status: string | undefined, lang: 'en' | 'fil') {
  const info = statusInfo(status)
  return lang === 'fil' ? info.fil : info.en
}

/** Index of the stage reached (0-3), or -1 when the request was stopped. */
export function stageIndex(status?: string) {
  const info = statusInfo(status)
  if (info.stage === 'stopped') return -1
  return STAGES.findIndex((s) => s.key === info.stage)
}

export const TONE_PILL: Record<StatusInfo['tone'], string> = {
  neutral: 'border-slate-300 bg-slate-100 text-slate-800',
  info: 'border-navy-200 bg-navy-50 text-navy-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
}
