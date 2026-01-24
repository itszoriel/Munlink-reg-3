import React, { useEffect, useRef, useState } from 'react'
import { useAdminStore } from '../lib/store'
import { userApi } from '../lib/api'

interface WatermarkedImageViewerProps {
  userId: number
  docType: 'id_front' | 'id_back' | 'selfie'
  reason: string
  municipalityName: string
  residentId: number
  onLoad?: () => void
  onError?: (error: string) => void
}

export function WatermarkedImageViewer({
  userId,
  docType,
  reason,
  municipalityName,
  residentId,
  onLoad,
  onError
}: WatermarkedImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAdminStore((s) => s.user)

  useEffect(() => {
    if (!canvasRef.current || !user) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let blobUrl: string | null = null
    let mounted = true

    // Fetch image with audit logging
    const fetchAndWatermark = async () => {
      try {
        setLoading(true)
        setError(null)

        // Call secure endpoint
        const response = await userApi.getResidentDocument(userId, docType, reason)

        if (!mounted) return

        // Create image element
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          if (!mounted) {
            // Clean up if component unmounted
            if (blobUrl) URL.revokeObjectURL(blobUrl)
            return
          }

          // Set canvas size to match image
          canvas.width = img.width
          canvas.height = img.height

          // Draw original image
          ctx.drawImage(img, 0, 0)

          // Configure watermark
          const fontSize = Math.max(16, img.width / 40)
          ctx.font = `bold ${fontSize}px Arial`
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
          ctx.lineWidth = 3

          // Watermark text
          const timestamp = new Date().toLocaleString()
          const staffName = user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email
          const topText = `VIEWED BY: ${staffName} | ${municipalityName}`
          const bottomText = `${timestamp} | Resident ID: ${residentId}`

          // Draw top watermark
          const topY = fontSize + 10
          ctx.strokeText(topText, 10, topY)
          ctx.fillText(topText, 10, topY)

          // Draw bottom watermark
          const bottomY = img.height - 10
          ctx.strokeText(bottomText, 10, bottomY)
          ctx.fillText(bottomText, 10, bottomY)

          // Draw diagonal watermark (center)
          ctx.save()
          ctx.translate(img.width / 2, img.height / 2)
          ctx.rotate(-Math.PI / 6)
          ctx.font = `bold ${fontSize * 1.5}px Arial`
          ctx.globalAlpha = 0.15
          const centerText = `CONFIDENTIAL - ${municipalityName.toUpperCase()}`
          const textWidth = ctx.measureText(centerText).width
          ctx.strokeText(centerText, -textWidth / 2, 0)
          ctx.fillText(centerText, -textWidth / 2, 0)
          ctx.restore()

          // Revoke blob URL after rendering
          if (blobUrl) URL.revokeObjectURL(blobUrl)

          setLoading(false)
          onLoad?.()
        }

        img.onerror = () => {
          // Revoke blob URL on error
          if (blobUrl) URL.revokeObjectURL(blobUrl)

          const errMsg = 'Failed to load image'
          setError(errMsg)
          setLoading(false)
          onError?.(errMsg)
        }

        // Convert blob to data URL
        const blob = await response
        blobUrl = URL.createObjectURL(blob)
        img.src = blobUrl

      } catch (err: any) {
        const errMsg = err.response?.data?.error || err.message || 'Failed to fetch document'
        setError(errMsg)
        setLoading(false)
        onError?.(errMsg)
      }
    }

    fetchAndWatermark()

    // Cleanup on unmount
    return () => {
      mounted = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [userId, docType, reason, municipalityName, residentId, user, onLoad, onError])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
        <div className="text-gray-500">Loading image...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded border border-red-200">
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto border rounded shadow-sm"
      style={{ maxHeight: '500px', objectFit: 'contain' }}
    />
  )
}
