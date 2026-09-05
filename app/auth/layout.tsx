export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-bold">Noa</h1>
            <p className="text-slate mt-2 text-sm">
              Clinical intelligence platform
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
