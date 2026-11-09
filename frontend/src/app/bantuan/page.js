"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  HelpCircle, ArrowLeft, BookOpen, ShieldCheck, 
  Clock, XCircle, MessageSquare, Phone, Info,
  Search, ShieldAlert, Sparkles, Sun, Moon
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function BantuanPage() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()
  
  // Link WhatsApp Otomatis
  const waNumber = "6285609726211" 
  const message = "Halo Admin MTs Miftahul Huda, saya mengalami kendala pada sistem pengaduan siswa dan butuh bantuan."
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white font-sans selection:bg-emerald-500 selection:text-black pb-20 overflow-hidden transition-colors duration-200">
      
      {/* Background Ambience (Glow Effect) */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto p-6 relative z-10 animate-fade-in">
        
        {/* HEADER: KONSISTEN DENGAN HALAMAN LAIN */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 mt-12 gap-6">
            <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <img 
                      src="/logo-mts.png" 
                      alt="Logo MTs Miftahul Huda" 
                      className="w-12 h-12 object-contain drop-shadow-md" 
                    />
                    <h1 className="text-3xl font-black tracking-tight uppercase text-slate-900 dark:text-white">Pusat Bantuan</h1>
                </div>
                <p className="text-slate-500 dark:text-gray-500 text-[11px] font-bold uppercase tracking-[0.2em]">Temukan solusi atau hubungi tim teknis kami.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                  onClick={toggleTheme} 
                  aria-label="Toggle Mode Gelap/Terang"
                  className="p-2.5 text-amber-500 hover:bg-amber-500/10 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#191c24] transition-colors shadow-sm"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <Link href="/">
                    <button className="text-[10px] font-black bg-white dark:bg-[#191c24] hover:bg-slate-100 dark:hover:bg-white dark:hover:text-black border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white px-6 py-3 rounded-2xl transition-all flex items-center gap-3 uppercase tracking-widest shadow-sm">
                        <ArrowLeft size={16} /> Kembali ke Beranda
                    </button>
                </Link>
            </div>
        </div>

        {/* FAQ SECTION: KARTU PROFESIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            
            {/* Kartu 1 - Cara Melapor */}
            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-500 group shadow-sm">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-black transition-all text-blue-600 dark:text-blue-400">
                    <BookOpen size={24} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3 uppercase tracking-tight">Cara Melapor?</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                    Masuk ke menu <span className="text-slate-900 dark:text-white font-bold">Pengaduan</span>, klik tombol "Tulis Pengaduan Baru". Isi judul, pilih kategori yang sesuai, tanggal kejadian, dan jabarkan pengaduan Anda secara mendalam.
                </p>
            </div>

            {/* Kartu 2 - Privasi */}
            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-500 group shadow-sm">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-black transition-all text-purple-600 dark:text-purple-400">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3 uppercase tracking-tight">Keamanan Data</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                    Sangat aman. Gunakan fitur <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Anonim</span> saat melapor jika Anda tidak ingin identitas Anda diketahui oleh publik.
                </p>
            </div>

            {/* Kartu 3 - Respon */}
            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-500 group shadow-sm">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black transition-all text-amber-600 dark:text-amber-500">
                    <Clock size={24} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3 uppercase tracking-tight">Waktu Respon</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                    Tim admin kami meninjau setiap laporan secara harian. Rata-rata respon diberikan dalam waktu <span className="text-slate-900 dark:text-white font-bold">1x24 jam</span> pada hari kerja efektif.
                </p>
            </div>

            {/* Kartu 4 - Kebijakan */}
            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-rose-500/30 transition-all duration-500 group shadow-sm">
                <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-black transition-all text-rose-600 dark:text-rose-500">
                    <XCircle size={24} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3 uppercase tracking-tight">Laporan Ditolak?</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">
                    Laporan yang mengandung unsur SARA, fitnah, atau bahasa yang tidak sopan akan <span className="text-rose-600 dark:text-rose-500 font-bold">otomatis ditolak</span> dan dihapus oleh sistem moderator.
                </p>
            </div>
        </div>

        {/* CONTACT SUPPORT SECTION */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#191c24] dark:to-[#0f1115] border border-slate-200 dark:border-white/5 rounded-[40px] p-10 text-center relative overflow-hidden shadow-sm">
            {/* Decorative Icon Background */}
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none text-slate-900 dark:text-white">
                <MessageSquare size={180} />
            </div>
            
            <div className="bg-emerald-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                <Phone size={28} className="text-emerald-600 dark:text-emerald-500" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Masih Butuh Bantuan?</h2>
            <p className="text-slate-600 dark:text-gray-400 text-sm mb-10 max-w-lg mx-auto leading-relaxed font-medium">
                Jangan ragu untuk menghubungi tim teknis kami secara langsung. Kami siap membantu menyelesaikan kendala teknis atau akun Anda secepat mungkin.
            </p>
            
            <a href={waLink} target="_blank" rel="noopener noreferrer">
                <button className="bg-[#25D366] hover:bg-[#1da851] text-white px-12 py-4 rounded-[20px] font-black text-xs transition-all transform hover:scale-105 shadow-xl shadow-green-900/10 flex items-center gap-3 mx-auto uppercase tracking-widest cursor-pointer">
                    <MessageSquare size={18} /> Chat Admin WhatsApp
                </button>
            </a>
            
            <div className="mt-8 flex items-center justify-center gap-4 text-slate-400 dark:text-gray-600">
                <div className="h-px w-8 bg-slate-200 dark:bg-white/5"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Respon: 08:00 - 16:00 WIB</p>
                <div className="h-px w-8 bg-slate-200 dark:bg-white/5"></div>
            </div>
        </div>

      </div>
    </div>
  )
}
