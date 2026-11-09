"use client"
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'
import { 
  User, Mail, Hash, LockKeyhole, Camera, Save, ArrowLeft, ShieldCheck, Phone, BookOpen, Users, Sun, Moon 
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function EditProfile() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  // State Form Utama
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nis, setNis] = useState('')
  const [phone, setPhone] = useState('')
  const [kelas, setKelas] = useState('')
  const [gender, setGender] = useState('')

  // State Password
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [avatarFile, setAvatarFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
        router.push('/login')
        return
    }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    
    // Isi form dengan data yang ada
    setName(parsedUser.name || '')
    setEmail(parsedUser.email || '')
    setNis(parsedUser.nis || '')
    setPhone(parsedUser.phone || '')
    setKelas(parsedUser.kelas || '')
    setGender(parsedUser.gender || '')
    
    if (parsedUser.avatar_url) {
        setPreview(`http://localhost:8080${parsedUser.avatar_url}`)
    }
  }, [router])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
        setAvatarFile(file)
        setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading("Menyimpan perubahan...")

    try {
        const token = localStorage.getItem('token')
        const formData = new FormData()
        
        formData.append('name', name)
        formData.append('email', email)
        formData.append('nis', nis)
        formData.append('phone', phone)
        formData.append('kelas', kelas)
        formData.append('gender', gender)
        
        if (oldPassword && newPassword) {
            formData.append('old_password', oldPassword)
            formData.append('new_password', newPassword)
        }

        if (avatarFile) {
            formData.append('avatar', avatarFile)
        }

        const res = await axios.put('http://localhost:8080/auth/profile', formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        })

        // Update data di local storage agar langsung berefek di seluruh web
        localStorage.setItem('user', JSON.stringify(res.data.user))
        setUser(res.data.user)
        
        toast.success("Profil berhasil diperbarui!", { id: toastId })
        setLoading(false)
        
        setOldPassword('')
        setNewPassword('')
        
    } catch (error) {
        console.error(error)
        const errMsg = error.response?.data?.error || "Gagal memperbarui profil"
        toast.error(errMsg, { id: toastId })
        setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      <Toaster position="top-center" />
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl w-full relative z-10 animate-fade-in">
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

        <div className="bg-white dark:bg-[#191c24] p-10 rounded-[40px] border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10 border-b border-slate-100 dark:border-white/5 pb-8">
                {/* UPLOAD FOTO DI KIRI */}
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-[#0f1115] ring-2 ring-slate-200 dark:ring-white/10 group-hover:ring-emerald-500 transition-all shadow-md">
                        <img 
                            src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=10b981&color=fff&bold=true`} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                        <Camera size={20} className="text-white" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                </div>
                
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Edit Profil</h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Perbarui identitas dan keamanan akun</p>
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest cursor-pointer hover:underline mt-2 md:mt-1" onClick={() => fileInputRef.current.click()}>
                        Ganti Foto Profil
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* GRID 1: DATA UTAMA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Nama Lengkap</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                            <input type="text" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-medium" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Nomor Induk Siswa (NIS)</label>
                        <div className="relative group">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                            <input type="text" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-medium" value={nis} onChange={(e) => setNis(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* GRID 2: KONTAK & AKADEMIK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Alamat Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                            <input type="email" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-medium" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Nomor WhatsApp</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                            <input type="text" className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-medium" placeholder="08..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Kelas</label>
                        <div className="relative group">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="Contoh: VII-A, VIII-B"
                                className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-medium" 
                                value={kelas} 
                                onChange={(e) => setKelas(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Jenis Kelamin</label>
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={16} />
                            <select className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-medium appearance-none cursor-pointer" value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="" disabled>Pilih Gender...</option>
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* KEAMANAN (PASSWORD) */}
                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className="text-amber-500"/>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Ganti Kata Sandi (Opsional)</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 dark:text-gray-600 uppercase tracking-widest">Password Lama (Wajib jika ganti)</label>
                            <div className="relative group">
                                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                                <input 
                                    type="password" 
                                    placeholder="********"
                                    className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all font-medium placeholder-slate-400 dark:placeholder-gray-700"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 dark:text-gray-600 uppercase tracking-widest">Password Baru</label>
                            <div className="relative group">
                                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                                <input 
                                    type="password" 
                                    placeholder="********"
                                    className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all font-medium placeholder-slate-400 dark:placeholder-gray-700"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TOMBOL SIMPAN */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase text-xs tracking-[0.2em] mt-6"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Save size={16} /> Simpan Perubahan
                        </>
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  )
}
