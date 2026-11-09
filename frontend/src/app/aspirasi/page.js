"use client"

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
// Import Ikon
import { 
  Heart, MessageSquare, Flame, CheckCircle, Clock, 
  HelpCircle, Home, LogOut, User, BarChart2, 
  Search, ShieldAlert, Sparkles, XCircle, Lock,
  SquarePen, ChevronDown, Image as ImageIcon, X,
  Sun, Moon, LayoutDashboard, Star, Megaphone
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function AspirasiFeed() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()

  // --- STATE DATA ---
  const [aspirations, setAspirations] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // --- STATE UI & INTERAKSI ---
  const [expandedAspirationId, setExpandedAspirationId] = useState(null)
  const [commentsData, setCommentsData] = useState({})
  const [newComment, setNewComment] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedId, setHighlightedId] = useState(null)
  const [votedLocalIds, setVotedLocalIds] = useState(new Set()) 
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null) 
  
  // STATE BARU: Untuk Fitur Riwayat Laporan Saya
  const [showMyHistory, setShowMyHistory] = useState(false)

  const profileRef = useRef(null)
  const fileInputRef = useRef(null)

  // Kategori versi Sekolah MTs
  const categories = ['Semua', 'Akademik', 'Fasilitas Sekolah', 'Kesiswaan/OSIS', 'Keamanan', 'Lainnya']

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      const savedVotes = localStorage.getItem(`votes_${parsedUser.id}`)
      if (savedVotes) {
          try { setVotedLocalIds(new Set(JSON.parse(savedVotes))) } catch (e) { setVotedLocalIds(new Set()) }
      }
      fetchAspirations()
    } else { 
       setLoading(false) 
    }
    
    const interval = setInterval(() => { 
        if (userData) fetchAspirations(true) 
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
      if (expandedAspirationId !== null) {
        const isClickInsideComment = event.target.closest('.comment-area')
        const isClickOnButton = event.target.closest('.comment-trigger')
        if (!isClickInsideComment && !isClickOnButton) {
            setExpandedAspirationId(null)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [profileRef, expandedAspirationId]) 

  const handleLogout = () => {
    toast.success("Sampai jumpa!")
    localStorage.clear()
    setTimeout(() => { 
        setUser(null)
        router.push('/login') 
    }, 1000)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    const loadingToast = toast.loading('Mengunggah foto profil...')

    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('http://localhost:8080/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })

      const updatedUser = { ...user, avatar_url: res.data.avatar_url }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      toast.success('Foto profil berhasil diperbarui!', { id: loadingToast })
    } catch (err) {
      toast.error('Gagal mengunggah foto profil.', { id: loadingToast })
    }
  }

  const fetchAspirations = async (silent = false) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await axios.get('http://localhost:8080/aspirations', { headers })
      const rawData = res.data.data || []
      const cleanData = rawData.map(asp => ({
        ...asp,
        status: asp.status || 'Menunggu'
      }))
      setAspirations(prev => {
          if (JSON.stringify(prev) === JSON.stringify(cleanData)) return prev
          return cleanData
      })

      cleanData.forEach(async (asp) => {
          try {
              if (silent && commentsData[asp.id]) return;
              const resComments = await axios.get(`http://localhost:8080/aspirations/${asp.id}/comments`)
              setCommentsData(prev => ({ ...prev, [asp.id]: resComments.data.data || [] }))
          } catch (err) { }
      })
      if (!silent) setLoading(false)
    } catch (error) { if (!silent) setLoading(false) }
  }

  const handleVote = async (id, status) => {
    const token = localStorage.getItem('token')
    if (!token) return toast.error("Login dulu untuk vote!")
    
    if (status === 'Terkunci' || status === 'Ditolak') {
        return toast.error("Pengaduan ini sudah tuntas / selesai.", { icon: '🔒' })
    }

    const isAlreadyVoted = votedLocalIds.has(id) 
    
    if (isAlreadyVoted) {
        setVotedLocalIds(prev => {
            const next = new Set(prev); next.delete(id)
            localStorage.setItem(`votes_${user.id}`, JSON.stringify([...next]))
            return next
        })
        setAspirations(prev => prev.map(asp => asp.id === id ? { ...asp, vote_count: Math.max(0, asp.vote_count - 1) } : asp))
        try { await axios.delete(`http://localhost:8080/aspirations/${id}/vote`, { headers: { Authorization: `Bearer ${token}` } }); fetchAspirations(true) } catch (error) { fetchAspirations(true) }
        return
    }

    setVotedLocalIds(prev => {
        const next = new Set(prev); next.add(id)
        localStorage.setItem(`votes_${user.id}`, JSON.stringify([...next]))
        return next
    })
    setAspirations(prev => prev.map(asp => asp.id === id ? { ...asp, vote_count: asp.vote_count + 1 } : asp))
    try {
      await axios.post(`http://localhost:8080/aspirations/${id}/vote`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success("Dukungan tercatat!")
      fetchAspirations(true)
    } catch (error) {
      toast.error("Gagal memberikan vote.")
      fetchAspirations(true)
    }
  }

  const toggleComments = async (id) => {
    if (expandedAspirationId === id) { setExpandedAspirationId(null); return }
    setExpandedAspirationId(id)
    try {
      const res = await axios.get(`http://localhost:8080/aspirations/${id}/comments`)
      setCommentsData(prev => ({ ...prev, [id]: res.data.data || [] }))
    } catch (e) { toast.error("Gagal memuat tanggapan.") }
  }

  const submitComment = async (id) => {
    if (!newComment.trim()) return
    const token = localStorage.getItem('token')
    if (!token) return toast.error("Login untuk menanggapi!")
    try {
        await axios.post(`http://localhost:8080/aspirations/${id}/comments`, { content: newComment }, { headers: { Authorization: `Bearer ${token}` } })
        setNewComment('')
        const res = await axios.get(`http://localhost:8080/aspirations/${id}/comments`)
        setCommentsData(prev => ({ ...prev, [id]: res.data.data || [] }))
        toast.success("Komentar terkirim.")
    } catch (e) { toast.error("Gagal mengirim komentar.") }
  }

  const topTrending = aspirations.length > 0 ? aspirations.reduce((prev, current) => (prev.vote_count > current.vote_count) ? prev : current) : null;
  const totalSelesai = aspirations.filter(a => a.status === 'Selesai').length;
  const totalDiproses = aspirations.filter(a => a.status === 'Diproses' || a.status === 'Sedang Ditindaklanjuti').length;
  const totalMenunggu = aspirations.filter(a => a.status === 'Menunggu' || !a.status).length;
  const top3Aspirations = [...aspirations].sort((a, b) => b.vote_count - a.vote_count).slice(0, 3);
  const mostPopularWeek = top3Aspirations[0]; 

  const handleTrendingClick = (id) => {
    const targetId = id || topTrending?.id;
    if (!targetId) return
    setSearchQuery(''); setActiveCategory('Semua'); setShowMyHistory(false)
    setTimeout(() => {
        const element = document.getElementById(`asp-${targetId}`)
        if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); setHighlightedId(targetId); setTimeout(() => setHighlightedId(null), 2500) }
    }, 100)
  }

  // LOGIKA FILTER DENGAN FITUR "RIWAYAT SAYA"
  const filteredAspirations = aspirations
    .filter((asp) => {
        // Cek Riwayat
        const matchHistory = showMyHistory ? (user && asp.user_id === user.id) : true
        // Cek Kategori
        const matchCategory = activeCategory === 'Semua' ? true : asp.category === activeCategory
        // Cek Pencarian
        const matchSearch = asp.title.toLowerCase().includes(searchQuery.toLowerCase()) || asp.content.toLowerCase().includes(searchQuery.toLowerCase())
        
        return matchHistory && matchCategory && matchSearch
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const cleanDateString = dateString.replace('Z', '').replace('+00:00', '')
    return new Date(cleanDateString).toLocaleString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    })
  }

  const getAvatar = (userData) => {
    if (userData?.avatar_url && userData.avatar_url.trim() !== '') {
      return `http://localhost:8080${userData.avatar_url}`
    }
    const name = userData?.name || 'User'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`
  }

  const getStatusBadge = (status) => {
      if (status === 'Selesai') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
      if (status === 'Diproses' || status === 'Sedang Ditindaklanjuti') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'; // Menunggu
  }

  const getStatusLabel = (status) => {
      if (status === 'Selesai') return <span className="flex items-center gap-1"><CheckCircle size={12}/> Selesai</span>;
      if (status === 'Diproses' || status === 'Sedang Ditindaklanjuti') return <span className="flex items-center gap-1"><Clock size={12}/> Diproses</span>;
      return <span className="flex items-center gap-1"><Clock size={12}/> Menunggu</span>;
  }

  return (
    <div className="min-h-screen font-sans bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-gray-200 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <Toaster position="top-center" />
      
      {/* NAVBAR MODERN */}
      <nav className="bg-white/90 dark:bg-[#191c24]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <img 
              src="/logo-mts.png" 
              alt="Logo MTs Miftahul Huda" 
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-wide leading-none uppercase">MTs <span className="text-emerald-500">Voice</span></span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">MIFTAHUL HUDA</span>
            </div>
          </div>
          
          {user && (
            <div className="hidden md:flex items-center gap-1">
                <Link href="/"><button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-xs font-bold"><Home size={16} /> Beranda</button></Link>
                <div className="h-4 w-px bg-slate-200 dark:bg-gray-800 mx-2"></div>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 rounded-xl text-xs font-bold border border-emerald-500/20 transition-all tracking-wider uppercase">Pengaduan</button>
                <Link href="/statistik"><button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-xs font-bold"><BarChart2 size={16} /> Statistik</button></Link>
                <Link href="/bantuan"><button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all duration-200 text-xs font-bold"><HelpCircle size={16} /> Bantuan</button></Link>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              aria-label="Toggle Mode Gelap/Terang"
              className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 p-1 pr-3 rounded-full transition-all">
                    <img src={getAvatar(user)} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-300 dark:border-white/10 object-cover"/>
                    <div className="text-left hidden sm:block leading-none">
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold mb-0.5">Halo,</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-white uppercase">{user.name.split(' ')[0]}</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 dark:text-gray-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#191c24] rounded-[32px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-50 animate-fade-in">
                        <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-white/5 text-center gap-1">
                            <div className="relative group cursor-pointer mb-2" onClick={() => fileInputRef.current.click()}>
                                <img src={getAvatar(user)} className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 dark:border-[#191c24] ring-2 ring-emerald-500/50 group-hover:opacity-50 transition-all"/>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><SquarePen size={20} className="text-white"/></div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                            </div>
                            <p className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight leading-none">{user.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-gray-500 font-bold mb-4">{user.email}</p>
                            
                            <div className="w-full space-y-2 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5 mb-3">
                                {user.kelas && (
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 dark:text-gray-500 uppercase font-bold">Kelas</span>
                                        <span className="text-slate-900 dark:text-white font-black uppercase text-right">{user.kelas}</span>
                                    </div>
                                )}
                                {user.nis && (
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 dark:text-gray-500 uppercase font-bold">NIS</span>
                                        <span className="text-emerald-600 dark:text-emerald-500 font-mono font-black">{user.nis}</span>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 dark:text-gray-500 uppercase font-bold">WhatsApp</span>
                                        <span className="text-slate-800 dark:text-white font-medium">{user.phone}</span>
                                    </div>
                                )}
                                {user.gender && (
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 dark:text-gray-500 uppercase font-bold">Gender</span>
                                        <span className="text-slate-800 dark:text-white font-medium uppercase">{user.gender}</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] bg-emerald-500 text-black px-3 py-1 rounded-full uppercase font-black tracking-widest">{user.role}</span>
                        </div>
                        
                        <div className="p-3 space-y-1">
                           {(user.role === 'admin' || user.role === 'kepsek' || user.role === 'guru_bk' || user.role === 'waka_kesiswaan' || user.role === 'waka_kurikulum') && (
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
            ) : (<div className="flex gap-2"><Link href="/login"><button className="text-xs font-bold px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all uppercase tracking-widest">Masuk</button></Link></div>)}
          </div>
        </div>
      </nav>

      <div className="p-6 pt-12 max-w-7xl mx-auto">
            {/* HEADLINE HERO */}
            <div className="text-center mb-16 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 blur-[100px] -z-10"></div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Pengaduan Siswa</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm max-w-xl mx-auto mb-10 leading-relaxed font-medium uppercase tracking-wider">Suara Anda adalah kunci perubahan sekolah ke arah yang lebih baik.</p>
                
                <Link 
                     href="/submit" 
                     className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all transform hover:scale-105 mx-auto uppercase tracking-widest text-xs"
                >
                    <SquarePen size={20} /> Tulis Pengaduan Baru
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
                <div className="lg:col-span-3 space-y-8">
                    
                    {/* SEARCH */}
                    <div className="bg-white dark:bg-[#191c24] p-1.5 rounded-[24px] border border-slate-200 dark:border-white/5 flex items-center shadow-lg group focus-within:border-emerald-500/50 transition-all duration-300">
                          <div className="relative w-full">
                            <input type="text" placeholder="Cari pengaduan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-transparent text-slate-800 dark:text-gray-200 text-sm outline-none placeholder-slate-400 dark:placeholder-gray-600"/>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                          </div>
                          <div className="border-l border-slate-200 dark:border-white/5 px-6 py-2 text-[10px] text-slate-500 dark:text-gray-500 font-black uppercase tracking-widest hidden sm:block whitespace-nowrap">Urutkan: <span className="text-slate-900 dark:text-white">Terbaru</span></div>
                    </div>

                    {/* FILTER KATEGORI & RIWAYAT SAYA */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 items-center">
                        {user && (
                            <>
                                <button 
                                    onClick={() => setShowMyHistory(!showMyHistory)} 
                                    className={`whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black transition-all duration-200 uppercase tracking-wider ${showMyHistory ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-[#191c24] border border-emerald-500/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10'}`}
                                >
                                    <User size={14} /> {showMyHistory ? 'Tampilkan Semua Laporan' : 'Riwayat Saya'}
                                </button>
                                <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2 shrink-0"></div>
                            </>
                        )}
                        {categories.map((cat) => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[11px] font-black transition-all duration-200 uppercase tracking-wider ${activeCategory === cat ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-lg' : 'bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}>{cat}</button>
                        ))}
                    </div>

                    {/* LIST ASPIRASI */}
                    <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-24 flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><p className="text-slate-500 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">Sinkronisasi Data...</p></div>
                    ) : filteredAspirations.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-[#191c24]/50 rounded-[32px] border border-dashed border-slate-200 dark:border-white/10"><h3 className="font-bold text-slate-500 dark:text-gray-600 text-sm uppercase tracking-widest">Belum ada pengaduan ditemukan.</h3></div>
                    ) : (
                        filteredAspirations.map((asp) => (
                        <div key={asp.id} id={`asp-${asp.id}`} className={`bg-white dark:bg-[#191c24] p-8 rounded-[32px] border transition-all duration-500 shadow-sm ${highlightedId === asp.id ? 'border-amber-500/50 shadow-2xl shadow-amber-500/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xl'}`}>
                            
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug uppercase">{asp.title}</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black bg-slate-100 dark:bg-[#0f1115] text-emerald-600 dark:text-emerald-500 border border-slate-200 dark:border-white/5 uppercase tracking-wider leading-none`}>#{asp.category}</span>
                                        {(asp.tanggal_pengaduan || asp.tanggal_kejadian) && <span className="text-[10px] px-3 py-1 rounded-full font-black bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 uppercase tracking-wider leading-none">Pengaduan: {asp.tanggal_pengaduan || asp.tanggal_kejadian}</span>}
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border uppercase tracking-widest transition-colors ${getStatusBadge(asp.status)}`}>{getStatusLabel(asp.status)}</span>
                            </div>
                            <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed mb-6 font-medium">{asp.content}</p>
                            
                            {/* GALERI / FOTO BUKTI */}
                            {(asp.bukti_file || (asp.image_urls && asp.image_urls.length > 0)) && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-3"><ImageIcon size={12} /> Lampiran Bukti</div>
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {asp.bukti_file ? (
                                            <div className="shrink-0 group relative">
                                                <img 
                                                    src={`http://localhost:8080${asp.bukti_file}`} 
                                                    className="h-32 w-48 object-cover rounded-2xl border border-slate-200 dark:border-white/10 cursor-zoom-in hover:border-emerald-500/50 transition-all shadow-md"
                                                    onClick={() => setSelectedImage(`http://localhost:8080${asp.bukti_file}`)} 
                                                />
                                            </div>
                                        ) : (
                                            asp.image_urls.map((url, idx) => (
                                                <div key={idx} className="shrink-0 group relative">
                                                    <img 
                                                        src={`http://localhost:8080${url}`} 
                                                        className="h-32 w-48 object-cover rounded-2xl border border-slate-200 dark:border-white/10 cursor-zoom-in hover:border-emerald-500/50 transition-all shadow-md"
                                                        onClick={() => setSelectedImage(`http://localhost:8080${url}`)} 
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {asp.response && (
                                <div className="mb-6 bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/10 flex flex-col gap-3">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 text-black"><CheckCircle size={16} /></div>
                                        <div><p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1 leading-none">Respon Sekolah</p><p className="text-[13px] text-slate-700 dark:text-gray-300 font-medium leading-relaxed">{asp.response}</p></div>
                                    </div>
                                    
                                    {asp.response_image_url && (
                                        <div className="mt-2 pl-12">
                                            <img 
                                                src={`http://localhost:8080${asp.response_image_url}`} 
                                                className="h-32 w-48 object-cover rounded-xl border border-emerald-500/30 cursor-zoom-in hover:scale-105 transition-transform"
                                                onClick={() => setSelectedImage(`http://localhost:8080${asp.response_image_url}`)} 
                                            />
                                            <p className="text-[9px] text-emerald-600 font-bold mt-2 uppercase tracking-widest">Bukti Perbaikan / Tindak Lanjut</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* AREA DISKUSI */}
                            {expandedAspirationId === asp.id && (
                                <div className="mb-6 bg-slate-50 dark:bg-[#0f1115] p-6 rounded-[24px] border border-slate-200 dark:border-white/5 animate-fade-in comment-area">
                                    <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {commentsData[asp.id]?.length > 0 ? commentsData[asp.id].map((c) => (
                                            <div key={c.id} className="bg-white dark:bg-[#191c24] p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                                                <div className="flex justify-between items-center mb-1"><span className="font-bold text-slate-900 dark:text-white text-xs leading-none uppercase">{c.user_name}</span><span className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest">{c.created_at}</span></div>
                                                <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">{c.content}</p>
                                            </div>
                                        )) : (<p className="text-slate-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center py-4 italic">Belum ada diskusi.</p>)}
                                    </div>
                                    
                                    {(asp.status === 'Terkunci' || asp.status === 'Ditolak') ? (
                                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center"><p className="text-[11px] text-rose-500 font-bold flex items-center justify-center gap-2 tracking-wide uppercase leading-none"><Lock size={14} /> Diskusi Dinonaktifkan</p></div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Tulis tanggapan..." className="flex-1 bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-xs outline-none focus:border-emerald-500 text-slate-900 dark:text-white transition-all" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && submitComment(asp.id)}/>
                                            <button onClick={() => submitComment(asp.id)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black transition-all hover:bg-emerald-500 active:scale-95 uppercase tracking-widest">Kirim</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* FOOTER KARTU */}
                            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/5">
                                <div className="flex gap-6">
                                    <button onClick={(e) => { e.stopPropagation(); toggleComments(asp.id); }} className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors comment-trigger group leading-none"><MessageSquare size={16} className="group-hover:scale-110 transition-transform" /> <span>{commentsData[asp.id] ? commentsData[asp.id].length : (asp.comment_count || 0)}</span></button>
                                    
                                    {/* FIX NAMA & KELAS */}
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-gray-500 leading-none">
                                        <User size={16} /> 
                                        <span className="uppercase">
                                            {(asp.anonimitas || asp.is_anonymous) 
                                                ? "Anonim" 
                                                : (asp.user_kelas && asp.user_kelas !== '-' && asp.user_kelas.trim() !== '' 
                                                    ? `${asp.user_name} - ${asp.user_kelas}` 
                                                    : asp.user_name)}
                                        </span>
                                    </div>
                                    
                                    <div className="text-[10px] text-slate-400 dark:text-gray-600 font-bold hidden sm:block uppercase tracking-widest">  {formatDate(asp.created_at)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleVote(asp.id, asp.status); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black border transition-all duration-300 group leading-none ${(asp.status === 'Terkunci' || asp.status === 'Ditolak') ? 'bg-slate-200 dark:bg-gray-800 border-slate-300 dark:border-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed' : votedLocalIds.has(asp.id) ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-lg shadow-rose-500/10' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-500 hover:text-rose-500 hover:border-rose-500/30'}`}><Heart size={16} className={`${votedLocalIds.has(asp.id) ? 'fill-rose-500 scale-110' : 'group-hover:scale-110'} transition-all`} /><span>{asp.vote_count}</span></button>
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                    </div>
                </div>

                {/* SIDEBAR STATISTIK */}
                <div className="space-y-8 lg:sticky lg:top-24">
                    {topTrending ? (
                        <div onClick={() => handleTrendingClick(topTrending.id)} className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[32px] p-6 shadow-2xl shadow-orange-500/20 relative overflow-hidden cursor-pointer group transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 text-white"><Flame size={80} /></div>
                            <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 bg-white/20 w-fit px-3 py-1.5 rounded-full"><Flame size={12} /> Trending</div>
                            <h3 className="text-lg font-bold text-white leading-tight mb-4 line-clamp-2 uppercase tracking-tight leading-none">{topTrending.title}</h3>
                            <div className="text-white/90 text-[11px] font-bold uppercase tracking-widest">{topTrending.vote_count} Suara Dukungan</div>
                        </div>
                    ) : (<div className="bg-white dark:bg-[#191c24] rounded-[32px] p-8 text-center border border-slate-200 dark:border-white/5 border-dashed"><p className="text-slate-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">Belum Ada Trending</p></div>)}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#191c24] p-6 rounded-[28px] text-center border border-slate-200 dark:border-white/5 shadow-sm"><p className="text-3xl font-black text-slate-900 dark:text-white mb-1 leading-none">{aspirations.length}</p><p className="text-[9px] text-slate-500 dark:text-gray-500 uppercase font-black tracking-widest mt-2 leading-none">Pengaduan</p></div>
                        <div className="bg-white dark:bg-[#191c24] p-6 rounded-[28px] text-center border border-slate-200 dark:border-white/5 shadow-sm"><p className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mb-1 leading-none">{totalSelesai}</p><p className="text-[9px] text-slate-500 dark:text-gray-500 uppercase font-black tracking-widest mt-2 leading-none">Selesai</p></div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#191c24] rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"><div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500 group-hover:scale-110 transition-transform"><Star size={18} /></div><div className="flex-1"><p className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Total Pengaduan</p><p className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase">{aspirations.length} Laporan</p></div></div>
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"><div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 group-hover:scale-110 transition-transform"><Clock size={18} /></div><div className="flex-1"><p className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Menunggu Tinjauan</p><p className="text-sm font-black text-amber-600 dark:text-amber-500 leading-none uppercase">{totalMenunggu} Laporan</p></div></div>
                        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"><div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-500 group-hover:scale-110 transition-transform"><CheckCircle size={18} /></div><div className="flex-1"><p className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Selesai Ditangani</p><p className="text-sm font-black text-emerald-600 dark:text-emerald-500 leading-none uppercase">{totalSelesai} Berhasil</p></div></div>
                        {mostPopularWeek && (<div className="p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"><div className="bg-emerald-400/10 p-2.5 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform"><Sparkles size={18} /></div><div className="flex-1"><p className="text-[9px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-1 leading-none">Minggu Ini</p><p className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[150px] uppercase tracking-tight leading-none">{mostPopularWeek.title}</p></div></div>)}
                    </div>
                </div>
            </div>
      </div>

      {/* MODAL FOTO GLOBAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)} 
        >
          <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-all"><X size={40} /></button>
          
          <div className="relative max-w-5xl max-h-full flex flex-col items-center gap-4">
            <img 
              src={selectedImage} 
              className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()} 
            />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] whitespace-nowrap">Klik di luar gambar untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  )
}
