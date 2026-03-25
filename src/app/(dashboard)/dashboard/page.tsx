export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Selamat datang di CatatUang - AI Financial Assistant
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder stats cards */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Saldo Total</h3>
          <p className="text-2xl font-bold">Rp 0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Pemasukan Bulan Ini</h3>
          <p className="text-2xl font-bold">Rp 0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Pengeluaran Bulan Ini</h3>
          <p className="text-2xl font-bold">Rp 0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Transaksi</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
}
