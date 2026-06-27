export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold font-serif">Noa</h1>
            <p className="text-slate text-sm mt-2">Clinical intelligence platform</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
