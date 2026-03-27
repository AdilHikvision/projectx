import { useEffect, useRef, useState } from 'react'
import { getApiBaseUrl } from '../lib/api'

/** Loads face photo with auth (blob URL). */
export function FaceThumbnail({
  faceId,
  token,
  className,
  alt = 'Face',
}: {
  faceId: string
  token: string | null
  className?: string
  alt?: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const urlRef = useRef<string | null>(null)
  useEffect(() => {
    if (!token) return
    setMissing(false)
    let cancelled = false
    fetch(`${getApiBaseUrl()}/api/faces/${faceId}/image`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404 && !cancelled) setMissing(true)
          return null
        }
        return r.blob()
      })
      .then((blob) => {
        if (!cancelled && blob) {
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          urlRef.current = URL.createObjectURL(blob)
          setSrc(urlRef.current)
        }
      })
    return () => {
      cancelled = true
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
      setSrc(null)
      setMissing(false)
    }
  }, [faceId, token])
  if (missing)
    return (
      <div className={`bg-background-light flex items-center justify-center text-text-light ${className ?? ''}`} title="No photo">
        <span className="material-symbols-outlined text-3xl">person</span>
      </div>
    )
  if (!src) return <div className={`bg-slate-100 animate-pulse ${className ?? ''}`} aria-hidden />
  return <img src={src} alt={alt} className={className} />
}
