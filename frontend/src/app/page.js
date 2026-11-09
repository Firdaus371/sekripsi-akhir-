"use client"
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Megaphone, ShieldCheck, Zap, BarChart3, ArrowRight, 
  CheckCircle, Flame, Star, MessageSquare, Info, 
  Home, LogOut, User, Sun, Moon, LayoutDashboard, Clock 
} from 'lucide-react'
import { useTheme } from './theme-provider'

export default function LandingPage() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [user, setUser] = useState(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const profileRef = useRef(null)

  useEffect(() => {
    setIsMounted(true)
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:8080/aspirations/stats')
        setStats({
          total: res.data.data.total_aspirations,
          completed: res.data.data.total_completed,
          pending: res.data.data.total_pending,
        })
      } catch (err) {
        console.log("Statistik default digunakan")
      }
    }
    fetchStats()

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  const getAvatar = (userData) => {
    if (userData?.avatar_url && userData.avatar_url.trim() !== '') {
      return `http://localhost:8080${userData.avatar_url}`
    }
    const name = userData?.name || 'User'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white font-sans selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      
      {/* NAVBAR */}
      <nav className="bg-white/90 dark:bg-[#191c24]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/logo-mts.png" 
              alt="Logo MTs Miftahul Huda" 
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wide leading-none uppercase text-slate-900 dark:text-white">Student <span className="text-emerald-500">Voice</span></span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">MTs Miftahul Huda</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
             {user ? (
                <>
                    <button className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[11px] font-black bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl transition-all">
                        <Home size={14} /> BERANDA
                    </button>
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-1">
                        <Link href="/aspirasi" className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all">Pengaduan</Link>
                        <Link href="/statistik" className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all">Statistik</Link>
                        <Link href="/bantuan" className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all">Bantuan</Link>
                    </div>
                </>
             ) : (
                <div className="flex items-center gap-4">
                    <Link href="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-xl">
                      MASUK
                    </Link>
                </div>
             )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              aria-label="Toggle Mode Gelap/Terang"
              className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-full transition-all"
            >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user && (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 p-1 pr-3 rounded-full transition-all">
                  <img src={getAvatar(user)} className="w-8 h-8 rounded-full border border-slate-300 dark:border-white/10 object-cover"/>
                  <div className="text-left hidden sm:block">
                      <p className="text-[9px] text-slate-400 dark:text-gray-500 font-black uppercase leading-none mb-0.5">Halo,</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-none max-w-[120px] truncate">{user.name}</p>
                  </div>
                </button>

                {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 text-center bg-slate-50 dark:bg-white/[0.02]">
                            <img src={getAvatar(user)} className="w-16 h-16 rounded-full border border-slate-200 dark:border-white/10 mx-auto mb-3 object-cover shadow-lg" />
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{user.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-gray-500 truncate mb-3">{user.email}</p>
                            <span className="text-[9px] bg-emerald-500 text-black px-3 py-1 rounded-full uppercase font-black tracking-widest">{user.role}</span>
                        </div>
                        
                        <div className="p-3 space-y-1">
                            {user.role !== 'siswa' && (
                                <Link href="/admin">
                                    <button className="w-full text-left px-4 py-3 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl flex items-center gap-3 transition font-bold">
                                        <LayoutDashboard size={16} className="text-emerald-500" /> Dashboard Pengelola
                                    </button>
                                </Link>
                            )}
                            
                            <Link href="/profile">
                                <button className="w-full text-left px-4 py-3 text-xs text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl flex items-center gap-3 transition-all font-bold">
                                    <User size={16} className="text-emerald-500" /> Edit Profil
                                </button>
                            </Link>

                            <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-xs text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 rounded-2xl flex items-center gap-3 transition font-bold"><LogOut size={16} /> Keluar Aplikasi</button>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
            <div className="mb-6 flex justify-center">
              <img 
                src="/logo-mts.png" 
                alt="Logo Resmi MTs Miftahul Huda" 
                className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300" 
              />
            </div>

            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-8">
                <ShieldCheck size={12} /> Platform Resmi Pengaduan Siswa
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-slate-900 dark:text-white tracking-tight uppercase">
                Suara Siswa,<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-cyan-500">Perubahan Nyata.</span>
            </h1>
            
            <p className="text-slate-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-medium">
                Sampaikan kritik, saran, dan pengaduan layanan sekolah secara transparan. 
                Identitas aman, respon cepat, dan tindak lanjut yang jelas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link href={user ? "/aspirasi" : "/login"}>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-black text-xs shadow-xl transition-all hover:scale-105 flex items-center gap-3 uppercase tracking-widest cursor-pointer">
                        <Megaphone size={16} /> {user ? "Mulai Lapor Sekarang" : "Masuk Untuk Lapor"}
                    </button>
                </Link>
                <Link href="/bantuan">
                    <button className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white px-8 py-3.5 rounded-xl font-black text-xs transition-all flex items-center gap-3 uppercase tracking-widest cursor-pointer shadow-sm">
                        <Info size={16} /> Pusat Bantuan
                    </button>
                </Link>
            </div>

            {/* STATS WIDGET */}
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
                <div className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 p-6 rounded-[24px] transition-all hover:border-slate-300 dark:hover:border-white/10 shadow-sm">
                    <Star className="text-amber-500 mx-auto mb-3 opacity-60" size={20} />
                    <p className="text-3xl font-black text-slate-900 dark:text-white mb-0.5 tracking-tight">{stats.total}</p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-500 font-black uppercase tracking-widest">Pengaduan Masuk</p>
                </div>
                <div className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 p-6 rounded-[24px] transition-all hover:border-slate-300 dark:hover:border-white/10 shadow-sm">
                    <CheckCircle className="text-emerald-500 mx-auto mb-3 opacity-60" size={20} />
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mb-0.5 tracking-tight">{stats.completed}</p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-500 font-black uppercase tracking-widest">Tuntas Selesai</p>
                </div>
                <div className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 p-6 rounded-[24px] transition-all hover:border-slate-300 dark:hover:border-white/10 shadow-sm">
                    <Clock className="text-amber-500 mx-auto mb-3 opacity-60" size={20} />
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-500 mb-0.5 tracking-tight">{stats.pending}</p>
                    <p className="text-[9px] text-slate-500 dark:text-gray-500 font-black uppercase tracking-widest">Menunggu Tinjauan</p>
                </div>
            </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-emerald-500/20 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="font-black text-lg mb-2 text-slate-900 dark:text-white uppercase">Privasi Aman</h3>
                <p className="text-slate-600 dark:text-gray-500 text-xs leading-relaxed font-medium">
                    Fitur anonimitas tingkat lanjut melindungi identitas pengirim sepenuhnya dari publik.
                </p>
            </div>

            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <Zap size={24} />
                </div>
                <h3 className="font-black text-lg mb-2 text-slate-900 dark:text-white uppercase">Respon Cepat</h3>
                <p className="text-slate-600 dark:text-gray-500 text-xs leading-relaxed font-medium">
                    Sistem memastikan setiap pengaduan ditanggapi oleh pihak berwenang dengan sigap.
                </p>
            </div>

            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-amber-500/20 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 size={24} />
                </div>
                <h3 className="font-black text-lg mb-2 text-slate-900 dark:text-white uppercase">Data Terbuka</h3>
                <p className="text-slate-600 dark:text-gray-500 text-xs leading-relaxed font-medium">
                    Semua laporan dan perkembangan penyelesaian dapat dipantau secara transparan oleh seluruh warga sekolah.
                </p>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-12 text-center bg-slate-100 dark:bg-[#0a0c10] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-mts.png" alt="Logo MTs Miftahul Huda" className="w-10 h-10 object-contain opacity-85" />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-gray-600">
              &copy; 2026 MTs Miftahul Huda Rama Gunawan • Sistem Layanan Pengaduan Siswa
          </p>
        </div>
      </footer>
    </div>
  )
}
