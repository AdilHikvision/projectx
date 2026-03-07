export function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-busy="true"
      aria-label="Загрузка"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="text-sm font-bold text-white/90 uppercase tracking-widest">Загрузка...</p>
      </div>
    </div>
  )
}
