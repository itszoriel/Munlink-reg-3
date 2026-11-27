import { useEffect, useState } from 'react'
import { authApi } from '@/lib/api'
import SafeImage from '@/components/SafeImage'

type Props = {
  docType: 'id_front' | 'id_back' | 'selfie'
  alt: string
  fallbackIcon?: 'document' | 'user'
  onReplace?: () => void
}

/**
 * Shows the signed-in resident's own verification image. The file is fetched
 * with the session token and rendered from a short-lived object URL, so it is
 * never reachable by a public link.
 */
export default function PrivateIdPreview({ docType, alt, fallbackIcon = 'document', onReplace }: Props) {
  const [src, setSrc] = useState<string | undefined>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl: string | undefined
    let cancelled = false
    setSrc(undefined)
    setFailed(false)
    authApi
      .getVerificationDocument(docType)
      .then((res) => {
        const blob = res?.data
        if (cancelled || !(blob instanceof Blob)) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [docType])

  if (!src && !failed) {
    return <div className="w-full h-48 rounded-lg border bg-gray-50 animate-pulse" aria-label={`Loading ${alt}`} />
  }

  return (
    <SafeImage
      src={src}
      alt={alt}
      className="w-full h-48 rounded-lg border"
      fallbackIcon={fallbackIcon}
      showReuploadButton={!!onReplace}
      onReupload={onReplace}
      reuploadLabel="Replace"
    />
  )
}
