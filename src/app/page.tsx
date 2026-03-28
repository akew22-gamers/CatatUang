import Link from 'next/link'
import { 
  Wallet, 
  MessageSquare, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Chat Natural',
      description: 'Catat transaksi dengan bahasa sehari-hari. Tidak perlu form yang ribet.',
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: TrendingUp,
      title: 'Analisis Cerdas',
      description: 'Lihat pola pengeluaran dan dapatkan insight untuk keuangan yang lebih baik.',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Wallet,
      title: 'Multi Wallet',
      description: 'Kelola banyak dompet sekaligus. Cash, bank, e-wallet dalam satu aplikasi.',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50',
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Asisten AI yang membantu mengkategorikan dan menganalisis transaksi otomatis.',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">CatatUang</span>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5">
                <Link href="/login">
                  Masuk
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 via-white to-purple-100/50" />
            <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
          </div>

          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8 animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">Powered by AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 animate-fade-in-up">
              Catat Keuangan dengan{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Assistant
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up">
              Tidak perlu form yang ribet. Cukup chat seperti biasa, AI akan otomatis 
              mencatat dan mengkategorikan transaksi kamu.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
              <Button 
                asChild 
                size="lg"
                className="w-full sm:w-auto h-14 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-300"
              >
                <Link href="/login">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Gratis Selamanya</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Tanpa Kartu Kredit</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Fitur Unggulan
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Semua yang kamu butuhkan untuk mengelola keuangan dalam satu aplikasi
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={feature.title}
                  className="group border-0 shadow-subtle hover:shadow-elevated bg-white rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-elevated bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl overflow-hidden">
              <CardContent className="p-8 sm:p-12 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Siap untuk mengelola keuangan dengan lebih baik?
                </h2>
                <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
                  Bergabung dengan ribuan pengguna yang sudah menggunakan CatatUang 
                  untuk mengatur keuangan mereka.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    asChild 
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 rounded-xl bg-white text-indigo-600 hover:bg-gray-100 font-semibold text-lg shadow-lg transition-all duration-300"
                  >
                    <Link href="/login">
                      Masuk Sekarang
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">CatatUang</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <p>© 2026 CatatUang. All rights reserved.</p>
              <span className="hidden sm:inline">•</span>
              <p>Developed by <span className="font-medium text-gray-700">EAS Creative Studio</span></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}