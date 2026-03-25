export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold">CatatUang</h1>
        </div>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  )
}
