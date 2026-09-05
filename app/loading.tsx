export default function RootLoading() {
  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen flex-col items-center justify-center space-y-4 p-6">
      <div className="border-deep-ink/20 border-t-deep-ink h-10 w-10 animate-spin rounded-full border-3" />
      <p className="text-slate animate-pulse text-sm font-medium">
        Loading Noa...
      </p>
    </div>
  );
}
