export default function RootLoading() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-10 h-10 border-3 border-deep-ink/20 border-t-deep-ink rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate animate-pulse">Loading Noa...</p>
    </div>
  )
}
