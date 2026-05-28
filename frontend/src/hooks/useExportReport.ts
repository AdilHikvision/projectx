import { useState } from 'react'
import { getApiBaseUrl } from '../lib/api'

export function useExportReport(token: string | null) {
  const [exporting, setExporting] = useState<string | null>(null) // 'excel' | 'pdf' | null

  async function downloadReport(path: string, format: 'excel' | 'pdf') {
    if (!token) return
    setExporting(format)
    try {
      const res = await fetch(`${getApiBaseUrl()}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const disp = res.headers.get('Content-Disposition') ?? ''
      const match = /filename[^;=\n]*=["']?([^"';\n]+)/.exec(disp)
      a.href = url
      a.download = match?.[1] ?? (format === 'excel' ? 'report.xlsx' : 'report.pdf')
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  return { exporting, downloadReport }
}
