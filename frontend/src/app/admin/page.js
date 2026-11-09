"use client"
import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import { 
  LayoutDashboard, Users, MessageSquare, ArrowLeft, 
  Trash2, Send, CheckCircle, Lock, Clock, AlertCircle, 
  Filter, ShieldCheck, Search, Image as ImageIcon, X,
  Printer, UserPlus, Mail, Phone, BookOpen, LockKeyhole,
  Check, KeyRound, RefreshCw, FileText, Sun, Moon
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function AdminDashboard() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()

  const [aspirations, setAspirations] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('aspirations') // 'aspirations' | 'users' | 'register'
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchUserQuery, setSearchUserQuery] = useState('')

  const [replyMsg, setReplyMsg] = useState({})
  const [replyImage, setReplyImage] = useState({})

  // Form registrasi 6 peran
  const [registerForm, setRegisterForm] = useState({
      name: '', email: '', password: '', role: 'siswa', nis: '', nip: '', phone: '', kelas: '', gender: 'Laki-laki'
  })
  const [isRegistering, setIsRegistering] = useState(false)

  // State Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null)
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const [currentUser, setCurrentUser] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const categories = ['Semua', 'Akademik', 'Fasilitas Sekolah', 'Kesiswaan/OSIS', 'Keamanan', 'Konseling', 'Lainnya']

  useEffect(() => {
    setIsMounted(true)
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userData || !token) {
      toast.error("Harap login terlebih dahulu")
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setCurrentUser(parsedUser)

    // Siswa dilarang masuk ke admin dashboard
    if (parsedUser.role === 'siswa') {
      toast.error("Akses ditolak: Area khusus pimpinan & pengelola sekolah")
      router.push('/')
      return
    }

    fetchData()
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }

    try {
      // 1. Ambil Aspirasi (Backend sudah memfilter berdasarkan 6 role)
      const resAsp = await axios.get('http://localhost:8080/aspirations', { headers })
      setAspirations(resAsp.data.data || [])

      // 2. Ambil Statistik
      const resStats = await axios.get('http://localhost:8080/aspirations/stats', { headers })
      setStats(resStats.data.data)

      // 3. Khusus Superadmin: Ambil data user
      const userData = JSON.parse(localStorage.getItem('user'))
      if (userData?.role === 'admin') {
        await fetchUsers()
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Sesi telah habis atau akses tidak diizinkan")
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Mandiri Pengambilan Data Pengguna untuk Superadmin
  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    try {
      let res
      try {
        res = await axios.get('http://localhost:8080/auth/users', { headers })
      } catch {
        res = await axios.get('http://localhost:8080/users', { headers })
      }
      if (res?.data?.data) {
        setUsers(res.data.data)
      }
    } catch (err) {
      console.error("Gagal mengambil data pengguna:", err)
    }
  }

  // Handle Ubah Status Pengaduan (Guru BK, Waka, Admin)
  const updateStatus = async (id, newStatus) => {
    const toastId = toast.loading(`Mengubah status ke ${newStatus}...`)
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `http://localhost:8080/aspirations/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Status berhasil diperbarui!", { id: toastId })
      fetchData()
    } catch (error) {
      const errMsg = error.response?.data?.error || "Gagal memperbarui status"
      toast.error(errMsg, { id: toastId })
    }
  }

  // Handle Upload Foto Balasan
  const handleReplyImageChange = (e, id) => {
    const file = e.target.files[0]
    if (file) {
      setReplyImage({ ...replyImage, [id]: file })
      toast.success("Foto tindak lanjut dipilih")
    }
  }

  // Handle Kirim Balasan / Tindak Lanjut
  const handleReply = async (id) => {
    const message = replyMsg[id]
    if (!message || message.trim() === '') {
      toast.error("Tulis balasan terlebih dahulu")
      return
    }

    const toastId = toast.loading("Mengirim tanggapan...")
    try {
      const token = localStorage.getItem('token')
      let resImageUrl = ''

      // Jika ada lampiran bukti perbaikan/tindak lanjut
      if (replyImage[id]) {
        const formData = new FormData()
        formData.append('images', replyImage[id])
        const uploadRes = await axios.post('http://localhost:8080/aspirations/upload', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        if (uploadRes.data.image_urls && uploadRes.data.image_urls.length > 0) {
          resImageUrl = uploadRes.data.image_urls[0]
        }
      }

      await axios.put(
        `http://localhost:8080/aspirations/${id}/reply`,
        { response: message, response_image_url: resImageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success("Tanggapan resmi berhasil dikirim!", { id: toastId })
      setReplyMsg({ ...replyMsg, [id]: '' })
      setReplyImage({ ...replyImage, [id]: null })
      fetchData()
    } catch (error) {
      const errMsg = error.response?.data?.error || "Gagal mengirim tanggapan"
      toast.error(errMsg, { id: toastId })
    }
  }

  // Handle Hapus Pengaduan Palsu/Spam (Khusus Superadmin)
  const deleteAspiration = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengaduan ini secara permanen?")) return
    const toastId = toast.loading("Menghapus pengaduan...")
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:8080/aspirations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Pengaduan berhasil dihapus", { id: toastId })
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus pengaduan", { id: toastId })
    }
  }

  // Handle Hapus Akun User (Khusus Superadmin)
  const deleteUser = async (id, name) => {
    if (!confirm(`Hapus akun ${name}? Tindakan ini tidak dapat dibatalkan.`)) return
    const toastId = toast.loading("Menghapus akun...")
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        await axios.delete(`http://localhost:8080/auth/users/${id}`, { headers })
      } catch {
        await axios.delete(`http://localhost:8080/users/${id}`, { headers })
      }
      toast.success(`Akun ${name} telah dihapus`, { id: toastId })
      fetchUsers()
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus akun pengguna", { id: toastId })
    }
  }

  const handleRegisterUser = async (e) => {
      e.preventDefault()
      setIsRegistering(true)
      const toastId = toast.loading("Membuat akun pengguna...")
      try {
          const token = localStorage.getItem('token')
          await axios.post('http://localhost:8080/auth/users', registerForm, {
              headers: { Authorization: `Bearer ${token}` }
          })
          toast.success(`Akun dengan peran ${registerForm.role} berhasil dibuat!`, { id: toastId })
          setRegisterForm({ 
            name: '', email: '', password: '', role: 'siswa', nis: '', nip: '', phone: '', kelas: '', gender: 'Laki-laki' 
          })
          fetchUsers()
          fetchData()
          setActiveTab('users')
      } catch (error) {
          const errMsg = error.response?.data?.error || "Gagal membuat akun pengguna"
          toast.error(errMsg, { id: toastId })
      } finally {
          setIsRegistering(false)
      }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetModalUser) return
    setIsResetting(true)
    const toastId = toast.loading("Mereset kata sandi...")
    try {
      const token = localStorage.getItem('token')
      await axios.put(`http://localhost:8080/auth/users/${resetModalUser.id}/reset-password`, {
        new_password: newPasswordInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success(`Kata sandi untuk ${resetModalUser.name} berhasil di-reset!`, { id: toastId })
      setResetModalUser(null)
      setNewPasswordInput('')
    } catch (error) {
      const errMsg = error.response?.data?.error || "Gagal mereset kata sandi"
      toast.error(errMsg, { id: toastId })
    } finally {
      setIsResetting(false)
    }
  }

  // Print PDF Resmi untuk Kepala Sekolah
  const handlePrintPDF = () => {
    window.print()
  }

  const role = currentUser?.role || ''
  const isSuperAdmin = role === 'admin'
  const isKepsek = role === 'kepala_sekolah'
  const isPejabat = role === 'guru_bk' || role === 'waka_kesiswaan' || role === 'waka_kurikulum' || role === 'kepala_sekolah'

  // Kategori wewenang resmi RBAC untuk masing-masing peran
  const getAllowedCategoriesForRole = (userRole) => {
    switch (userRole) {
      case 'guru_bk':
        return ['Semua', 'Konseling']
      case 'waka_kurikulum':
        return ['Semua', 'Akademik']
      case 'waka_kesiswaan':
        return ['Semua', 'Keamanan', 'Kesiswaan/OSIS', 'Fasilitas Sekolah']
      case 'admin':
      case 'kepala_sekolah':
      default:
        return ['Semua', 'Akademik', 'Fasilitas Sekolah', 'Kesiswaan/OSIS', 'Keamanan', 'Konseling', 'Lainnya']
    }
  }

  const isCategoryAllowedForRole = (userRole, cat) => {
    if (!userRole || userRole === 'admin' || userRole === 'kepala_sekolah') return true
    const allowed = getAllowedCategoriesForRole(userRole).filter(c => c !== 'Semua')
    return allowed.some(c => c.toLowerCase() === (cat || '').toLowerCase())
  }

  const visibleCategories = getAllowedCategoriesForRole(role)

  useEffect(() => {
    if (role) {
      const allowed = getAllowedCategoriesForRole(role)
      if (!allowed.includes(activeCategory)) {
        setActiveCategory('Semua')
      }
    }
  }, [role, activeCategory])

  // Label Header Panel
  const getPanelTitle = () => {
    switch (role) {
      case 'admin': return 'Super Admin Panel'
      case 'guru_bk': return 'Panel Guru BK (Bimbingan Konseling)'
      case 'waka_kesiswaan': return 'Panel Waka Bidang Kesiswaan'
      case 'waka_kurikulum': return 'Panel Waka Bidang Kurikulum'
      case 'kepala_sekolah': return 'Panel Kepala Madrasah'
      default: return 'Pengelola Laporan'
    }
  }

  // Filter laporan berdasarkan wewenang peran (sinkronisasi frontend dengan backend RBAC)
  const roleAspirations = aspirations.filter(asp => isCategoryAllowedForRole(role, asp.category))

  const filteredAspirations = roleAspirations.filter(asp => {
    const matchCategory = activeCategory === 'Semua' ? true : asp.category === activeCategory
    const matchSearch = asp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        asp.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const filteredUsers = users.filter(u => {
    return u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
           u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
           (u.role && u.role.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
           (u.nis && u.nis.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
           (u.nip && u.nip.toLowerCase().includes(searchUserQuery.toLowerCase()))
  })

  // Logika rendering identitas pelapor sesuai hak akses (Super Admin vs Pejabat/Guru/Kepsek)
  const renderPelapor = (asp) => {
    const isAnonymous = Boolean(asp.anonimitas || asp.is_anonymous)
    if (isAnonymous) {
      // HANYA Super Admin yang boleh melihat identitas asli
      if (currentUser?.role === 'admin') {
        const hasRealName = asp.user_name && asp.user_name !== 'Anonim'
        if (hasRealName) {
          const kelasSuffix = asp.user_kelas && asp.user_kelas !== '-' ? ` - ${asp.user_kelas}` : ''
          return `Anonim (Asli: ${asp.user_name}${kelasSuffix})`
        }
        return 'Anonim'
      }
      // Guru / Waka / Kepsek HANYA melihat "Anonim"
      return 'Anonim'
    }
    // Jika tidak anonim, tampilkan nama pelapor secara normal untuk semua role
    return `${asp.user_name} (${asp.user_kelas || 'Siswa'})`
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      <Toaster position="top-center" />
      
      {/* HEADER NAVIGASI */}
      <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 dark:border-white/5 gap-4 print:hidden">
        <div className="flex items-center gap-3">
           <img 
             src="/logo-mts.png" 
             alt="Logo MTs Miftahul Huda" 
             className="w-12 h-12 object-contain drop-shadow-md" 
           />
           <div>
             <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase leading-none block">
                 {getPanelTitle()}
             </span>
             <span className="text-xs text-slate-500 dark:text-gray-500 font-bold uppercase tracking-widest mt-1 block">
               MTs Miftahul Huda Rama Gunawan
             </span>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            aria-label="Toggle Mode Gelap/Terang"
            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isKepsek && (
            <button 
              onClick={handlePrintPDF} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <Printer size={15} /> Cetak Rekapitulasi (PDF)
            </button>
          )}

          <Link href="/">
            <button className="text-xs text-slate-600 dark:text-gray-400 font-black hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 bg-white dark:bg-white/5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 uppercase tracking-wider shadow-sm">
              <ArrowLeft size={14} /> Beranda
            </button>
          </Link>
        </div>
      </nav>

      {/* HEADER CETAK KHUSUS PRINT */}
      <div className="hidden print:flex items-center justify-center gap-6 mb-8 pb-4 border-b-2 border-black text-black">
        <img src="/logo-mts.png" alt="Logo MTs Miftahul Huda" className="w-16 h-16 object-contain" />
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase">REKAPITULASI LAPORAN PENGADUAN SISWA</h2>
          <p className="font-bold text-sm">MTs MIFTAHUL HUDA RAMA GUNAWAN</p>
          <p className="text-xs mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        </div>
      </div>

      {/* 3 KARTU RINGKASAN DI BAGIAN ATAS (SESUAI WIREFRAME GAMBAR 3.18) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white dark:bg-[#191c24] p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-black text-slate-500 dark:text-gray-500 tracking-[0.2em] uppercase block">TOTAL PENGADUAN</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 leading-none">
                {activeCategory === 'Semua' 
                  ? (stats?.total_aspirations ?? roleAspirations.length)
                  : filteredAspirations.length}
              </p>
          </div>

          <div className="bg-white dark:bg-[#191c24] p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-black text-amber-500 tracking-[0.2em] uppercase block">PERLU TINJAUAN</span>
              <p className="text-3xl font-black text-amber-500 mt-2 leading-none">
                {activeCategory === 'Semua' 
                  ? (stats?.total_pending ?? roleAspirations.filter(a => a.status === 'Menunggu' || a.status === 'Diproses').length)
                  : filteredAspirations.filter(a => a.status === 'Menunggu' || a.status === 'Diproses').length}
              </p>
          </div>

          <div className="bg-white dark:bg-[#191c24] p-6 rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
              <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase block">SELESAI</span>
              <p className="text-3xl font-black text-emerald-500 mt-2 leading-none">
                {activeCategory === 'Semua' 
                  ? (stats?.total_completed ?? roleAspirations.filter(a => a.status === 'Selesai').length)
                  : filteredAspirations.filter(a => a.status === 'Selesai').length}
              </p>
          </div>
      </div>

      {/* TAB NAVIGASI HANYA UNTUK SUPERADMIN */}
      {isSuperAdmin && (
        <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-[#191c24] p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 w-fit print:hidden shadow-sm">
            <button 
              onClick={() => setActiveTab('aspirations')} 
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'aspirations' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
                <MessageSquare size={15} /> Kelola Pengaduan
            </button>
            <button 
              onClick={() => { setActiveTab('users'); fetchUsers(); }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'users' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
                <Users size={15} /> Manajemen Pengguna (6 Peran)
            </button>
            <button 
              onClick={() => setActiveTab('register')} 
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'register' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-white hover:bg-emerald-500/10'
              }`}
            >
                <UserPlus size={15} /> Tambah Akun Baru
            </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN 1: TAB PENGADUAN (ADMIN, GURU BK, WAKA, KEPALA SEKOLAH) */}
      {/* ============================================================== */}
      {activeTab === 'aspirations' && (
        <div>
          {/* FILTER KATEGORI & CARI */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 print:hidden">
              <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 scrollbar-none">
                  {visibleCategories.map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)} 
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black transition-all border uppercase tracking-wider ${
                          activeCategory === cat 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                            : 'bg-white dark:bg-transparent border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>

              <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Cari judul atau isi laporan..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                  />
              </div>
          </div>

          {/* DAFTAR KARTU PENGADUAN */}
          {filteredAspirations.length === 0 ? (
            <div className="bg-white dark:bg-[#191c24] p-12 rounded-[32px] border border-slate-200 dark:border-white/5 text-center text-slate-500 dark:text-gray-500 text-sm shadow-sm">
                Belum ada pengaduan yang sesuai dengan kriteria / kategori wewenang Anda.
            </div>
          ) : (
            <div className="space-y-5">
              {filteredAspirations.map((asp) => (
                <div key={asp.id} className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 rounded-[28px] p-6 shadow-sm print:bg-white print:text-black print:border-black print:border print:mb-4">
                  
                  {/* Bagian Atas Kartu */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5 print:border-black">
                     <div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full print:border-black print:text-black">
                                {asp.category}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-gray-500 font-bold print:text-gray-700">
                                {asp.tanggal_pengaduan || 'Hari ini'}
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2 print:text-black">{asp.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 print:text-gray-600">
                          Pelapor: <strong className="text-slate-800 dark:text-white print:text-black">{renderPelapor(asp)}</strong>
                        </p>
                     </div>

                     {/* STATUS & AKSI */}
                     <div className="flex items-center gap-3">
                         <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                            asp.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                            asp.status === 'Diproses' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                         }`}>
                            {asp.status}
                         </span>

                         {/* Dropdown Update Status untuk Pejabat & Superadmin */}
                         {(isPejabat || isSuperAdmin) && (
                            <select 
                              value={asp.status} 
                              onChange={(e) => updateStatus(asp.id, e.target.value)}
                              className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer hover:border-slate-400 dark:hover:border-white/30 print:hidden"
                            >
                              <option value="Menunggu">Menunggu</option>
                              <option value="Diproses">Diproses</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                         )}

                         {/* Tombol Hapus khusus Superadmin */}
                         {isSuperAdmin && (
                            <button 
                              onClick={() => deleteAspiration(asp.id)} 
                              title="Hapus Laporan Palsu/Spam"
                              className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-2 rounded-xl transition border border-rose-500/20 print:hidden"
                            >
                                <Trash2 size={15} />
                            </button>
                         )}
                     </div>
                  </div>

                  {/* Isi Pengaduan */}
                  <p className="text-sm text-slate-700 dark:text-gray-300 mt-4 leading-relaxed font-medium print:text-black">
                    {asp.content}
                  </p>

                  {/* Bukti Foto Pengaduan Siswa jika ada */}
                  {asp.bukti_file && (
                    <div className="mt-4 print:hidden">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-500 block mb-2">Lampiran Bukti Pelapor:</span>
                      <a href={`http://localhost:8080${asp.bukti_file}`} target="_blank" rel="noreferrer">
                        <img 
                          src={`http://localhost:8080${asp.bukti_file}`} 
                          alt="Bukti Pengaduan" 
                          className="max-h-48 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500 transition shadow-sm" 
                        />
                      </a>
                    </div>
                  )}

                  {/* Riwayat Balasan / Tanggapan Pejabat */}
                  {asp.response && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 print:border-black print:bg-gray-100">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                        Tanggapan Petugas:
                      </span>
                      <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed font-medium print:text-black">
                        {asp.response}
                      </p>
                      {asp.response_image_url && (
                        <div className="mt-2">
                           <a href={`http://localhost:8080${asp.response_image_url}`} target="_blank" rel="noreferrer">
                             <img 
                               src={`http://localhost:8080${asp.response_image_url}`} 
                               alt="Bukti Tindak Lanjut" 
                               className="max-h-36 rounded-lg border border-slate-200 dark:border-white/10" 
                             />
                           </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Balas / Tindak Lanjut untuk Pejabat & Superadmin */}
                  {(isPejabat || isSuperAdmin) && (
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 print:hidden">
                       <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 block mb-2">
                         Tindak Lanjut & Berikan Balasan:
                       </span>
                       <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="text" 
                            placeholder="Tulis balasan atau tindak lanjut resmi..."
                            value={replyMsg[asp.id] || ''}
                            onChange={(e) => setReplyMsg({ ...replyMsg, [asp.id]: e.target.value })}
                            className="flex-1 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                          />

                          <label className="bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 rounded-xl px-3 py-2.5 text-xs text-slate-600 dark:text-gray-400 flex items-center gap-1.5 cursor-pointer">
                             <ImageIcon size={14} /> {replyImage[asp.id] ? "Foto Terpilih" : "Foto Bukti"}
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={(e) => handleReplyImageChange(e, asp.id)} 
                             />
                          </label>

                          <button 
                            onClick={() => handleReply(asp.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                          >
                             <Send size={13} /> Kirim
                          </button>
                       </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN 2: TAB MANAJEMEN PENGGUNA (KHUSUS SUPERADMIN)            */}
      {/* ============================================================== */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 rounded-[28px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/5 gap-4">
              <div>
                 <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">Daftar Akun Pengguna Terdaftar</h2>
                 <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Total {filteredUsers.length} pengguna terdaftar di sistem.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Cari nama, email, NIP, NIS..." 
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                    />
                </div>
                <button 
                  onClick={fetchUsers} 
                  title="Muat Ulang Data Pengguna"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-700 dark:text-white transition flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-xs">
                <thead>
                   <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Nama</th>
                      <th className="py-3 px-4">Peran (Role)</th>
                      <th className="py-3 px-4">NIS / NIP</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                   {filteredUsers.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-gray-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                               <Users size={32} className="opacity-40" />
                               <p className="font-bold text-sm">Tidak ada data pengguna yang ditemukan</p>
                               <button 
                                 onClick={fetchUsers}
                                 className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                               >
                                 <RefreshCw size={13} /> Segarkan Data Pengguna
                               </button>
                            </div>
                         </td>
                      </tr>
                   ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                           <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                           <td className="py-3.5 px-4">
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                                 {u.role}
                              </span>
                           </td>
                           <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300 font-mono">{u.nis || u.nip || '-'}</td>
                           <td className="py-3.5 px-4 text-slate-500 dark:text-gray-400">{u.email}</td>
                           <td className="py-3.5 px-4 text-slate-500 dark:text-gray-400">{u.kelas || '-'}</td>
                           <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-2">
                                 <button 
                                   onClick={() => { setResetModalUser(u); setNewPasswordInput(''); }}
                                   title="Reset Password Akun Ini"
                                   className="bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-amber-500/20 transition flex items-center gap-1 font-bold text-[10px]"
                                 >
                                    <KeyRound size={12} /> Reset PW
                                  </button>
                                 <button 
                                   onClick={() => deleteUser(u.id, u.name)}
                                   title="Hapus Akun Pengguna"
                                   className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-1.5 rounded-lg border border-rose-500/20 transition"
                                 >
                                    <Trash2 size={13} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* KONTEN 3: TAB FORM PEMBUATAN AKUN 6 PERAN (KHUSUS SUPERADMIN)   */}
      {/* ============================================================== */}
      {activeTab === 'register' && isSuperAdmin && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 rounded-[36px] p-8 md:p-10 shadow-sm">
           <div className="mb-8 pb-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-4">
              <img src="/logo-mts.png" alt="Logo MTs Miftahul Huda" className="w-12 h-12 object-contain drop-shadow-sm" />
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">Pendaftaran Akun Pengguna</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Superadmin dapat membuat akun untuk 6 jenis peran di sistem.</p>
              </div>
           </div>

           <form onSubmit={handleRegisterUser} className="space-y-5">
              {/* DROPDOWN 6 PERAN */}
              <div>
                 <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                   Pilih Peran Pengguna (Role) <span className="text-rose-500">*</span>
                 </label>
                 <select 
                   value={registerForm.role}
                   onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                   className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 cursor-pointer"
                 >
                    <option value="siswa">Siswa (Pelapor Pengaduan)</option>
                    <option value="guru_bk">Guru BK (Bimbingan Konseling)</option>
                    <option value="waka_kesiswaan">Waka Kesiswaan</option>
                    <option value="waka_kurikulum">Waka Kurikulum</option>
                    <option value="kepala_sekolah">Kepala Madrasah</option>
                    <option value="admin">Admin (Super Administrator)</option>
                 </select>
              </div>

              {/* NAMA & EMAIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Nama Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Ahmad Fauzan"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Alamat Email</label>
                    <input 
                      type="email" 
                      placeholder="nama@mtsmiftahulhuda.sch.id"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                    />
                 </div>
              </div>

              {/* KONDISIONAL BERDASARKAN ROLE */}
              {registerForm.role === 'siswa' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">NIS (Nomor Induk Siswa)</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: 2024001"
                        value={registerForm.nis}
                        onChange={(e) => setRegisterForm({ ...registerForm, nis: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Kelas</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: VII-A / IX-B"
                        value={registerForm.kelas}
                        onChange={(e) => setRegisterForm({ ...registerForm, kelas: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                      />
                   </div>
                </div>
              ) : (
                <div>
                   <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">NIP (Nomor Induk Pegawai - Opsional)</label>
                   <input 
                     type="text" 
                     placeholder="Contoh: 198501012010011001"
                     value={registerForm.nip}
                     onChange={(e) => setRegisterForm({ ...registerForm, nip: e.target.value })}
                     className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                   />
                </div>
              )}

              {/* TELEPON & GENDER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">No. WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="08123456789"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Jenis Kelamin</label>
                    <select 
                      value={registerForm.gender}
                      onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                       <option value="Laki-laki">Laki-laki</option>
                       <option value="Perempuan">Perempuan</option>
                    </select>
                 </div>
              </div>

              {/* KATA SANDI */}
              <div>
                 <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Kata Sandi Awal</label>
                 <input 
                   type="password" 
                   placeholder="Minimal 6 karakter..."
                   value={registerForm.password}
                   onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                   required
                   className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50"
                 />
              </div>

              <button 
                type="submit" 
                disabled={isRegistering}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-emerald-600/20 text-xs uppercase tracking-widest mt-6 cursor-pointer disabled:opacity-50"
              >
                 {isRegistering ? "Menyimpan Data..." : "Simpan & Buat Akun"}
              </button>
           </form>
        </div>
      )}

      {/* MODAL RESET PASSWORD (SUPERADMIN) */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/10 rounded-[32px] max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
                 <div className="flex items-center gap-2 text-amber-500">
                    <KeyRound size={20} />
                    <h3 className="font-black text-slate-900 dark:text-white text-base">Reset Kata Sandi Pengguna</h3>
                 </div>
                 <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white">
                    <X size={18} />
                 </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-gray-400 mb-4">
                Masukkan kata sandi baru untuk akun <strong className="text-slate-900 dark:text-white">{resetModalUser.name}</strong> ({resetModalUser.email}).
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-widest">Kata Sandi Baru</label>
                    <input 
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                 </div>

                 <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setResetModalUser(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isResetting}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50"
                    >
                      {isResetting ? "Memproses..." : "Simpan Sandi Baru"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  )
}
