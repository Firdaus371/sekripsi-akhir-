"use client"
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'
import { 
  LockKeyhole, Mail, Lock, ArrowRight, 
  ShieldCheck, Loader2, ArrowLeft, Sun, Moon 
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function Login() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Mencegah Hydration Error
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading("Mengautentikasi...")

    try {
      const res = await axios.post('http://localhost:8080/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      const role = res.data.user?.role
      toast.success(`Akses diterima sebagai ${role}`, { id: toastId })

      // Redirect dinamis sesuai peran pengguna
      setTimeout(() => {
        if (role === 'siswa') {
          router.push('/')
        } else {
          router.push('/admin')
        }
      }, 800)
    } catch (error) {
      const errMsg = error.response?.data?.error || "Email atau kata sandi salah"
      toast.error(errMsg, { id: toastId })
      setLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1115] p-6 font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      <Toaster position="top-center" />
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 animate-fade-in">
        
        {/* Tombol Kembali & Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white transition-all text-xs font-black uppercase tracking-widest group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Beranda
            </button>
          </Link>

          <button 
            onClick={toggleTheme} 
            aria-label="Toggle Mode Gelap/Terang"
            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Kotak Login Sesuai Wireframe Skripsi */}
        <div className="bg-white dark:bg-[#191c24] p-8 md:p-10 rounded-[36px] border border-slate-200 dark:border-white/5 shadow-sm">
          
          <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <img 
                    src="/logo-mts.png" 
                    alt="Logo MTs Miftahul Huda" 
                    className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform" 
                  />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">LOGIN PENGGUNA</h2>
              <p className="text-slate-500 dark:text-gray-400 text-xs font-medium mt-1">Sistem Pengaduan MTs Miftahul Huda</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-[0.2em]">Email / Username / Identitas</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  placeholder="nama@mthuda.sch.id"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f1115] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none text-slate-900 dark:text-white text-sm font-medium transition-all placeholder-slate-400 dark:placeholder-gray-600"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-[0.2em]">Password</label>
              <div className="relative group">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f1115] focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none text-slate-900 dark:text-white text-sm font-medium transition-all placeholder-slate-400 dark:placeholder-gray-600"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 group tracking-widest text-xs uppercase cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Memverifikasi...
                </>
              ) : (
                <>
                  [ Masuk ] <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Petunjuk Login Sesuai Aturan Hak Akses */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-xs font-bold text-slate-500 dark:text-gray-400">
              Belum punya akun? <span className="text-emerald-600 dark:text-emerald-400 font-black">Hubungi Admin</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
