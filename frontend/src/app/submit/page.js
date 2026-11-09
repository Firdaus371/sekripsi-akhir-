"use client"
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'
import { 
  Megaphone, X, Send, ShieldCheck, 
  ArrowLeft, ImagePlus, Layout, Calendar, Sun, Moon 
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function SubmitAspiration() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()

  // --- STATE FORM (Sesuai Wireframe Gambar 3.17) ---
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Akademik')
  const [tanggalKejadian, setTanggalKejadian] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  // --- STATE MEDIA ---
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])

  // --- STATE UI ---
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error("Harap login terlebih dahulu")
      router.push('/login')
    }
  }, [router])

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setImages(prev => [...prev, ...selectedFiles])
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previews[index])
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      return toast.error("Judul dan isi pengaduan wajib diisi")
    }

    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      let uploadedUrls = []

      // 1. Upload Bukti Foto jika ada
      if (images.length > 0) {
        const formData = new FormData()
        images.forEach((img) => formData.append('images', img))

        const uploadRes = await axios.post('http://localhost:8080/aspirations/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        })
        uploadedUrls = uploadRes.data.image_urls || []
      }

      // 2. Kirim Data Pengaduan Sesuai Skripsi
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category,
        tanggal_pengaduan: tanggalKejadian || new Date().toISOString().split('T')[0],
        tanggal_kejadian: tanggalKejadian || new Date().toISOString().split('T')[0],
        bukti_file: uploadedUrls.length > 0 ? uploadedUrls[0] : "",
        anonimitas: Boolean(isAnonymous),
        is_anonymous: Boolean(isAnonymous),
      }

      await axios.post('http://localhost:8080/aspirations', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      toast.success("Pengaduan berhasil dikirim! Menunggu tindak lanjut pihak sekolah.")
      setTimeout(() => {
        router.push('/aspirasi')
      }, 1000)

    } catch (error) {
      console.error(error)
      const errMsg = error.response?.data?.error || "Gagal mengirim laporan pengaduan"
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white p-6 md:p-12 font-sans selection:bg-emerald-500 selection:text-black transition-colors duration-200">
      <Toaster position="top-center" />
      
      <div className="max-w-3xl mx-auto">
        
        {/* Navigasi Kembali & Theme Toggle */}
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

        {/* Kotak Formulir Sesuai Wireframe Gambar 3.17 */}
        <div className="bg-white dark:bg-[#191c24] border border-slate-200 dark:border-white/5 rounded-[40px] p-8 md:p-12 shadow-sm relative overflow-hidden">
          
          <div className="text-center mb-10 pb-6 border-b border-slate-100 dark:border-white/5">
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <img 
                src="/logo-mts.png" 
                alt="Logo MTs Miftahul Huda" 
                className="w-full h-full object-contain drop-shadow-md" 
              />
            </div>
            <span className="text-[10px] font-black tracking-[0.25em] text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              Layanan Aspirasi Siswa
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-4">
              FORMULIR PENGADUAN SISWA
            </h1>
            <p className="text-slate-500 dark:text-gray-400 text-xs mt-2 font-medium">
              Sampaikan pengaduan secara transparan atau aktifkan mode anonim untuk perlindungan identitas Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. JUDUL PENGADUAN */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Judul Pengaduan <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Contoh: Lampu Kamar Mandi Lantai 2 Padam" 
                className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium placeholder-slate-400 dark:placeholder-gray-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 2. KATEGORI MASALAH & TANGGAL KEJADIAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-widest">
                    Kategori Masalah <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium cursor-pointer"
                  >
                      <option value="Akademik">Akademik (Kurikulum & Pembelajaran)</option>
                      <option value="Fasilitas Sekolah">Fasilitas Sekolah (Sarana & Prasarana)</option>
                      <option value="Kesiswaan/OSIS">Kesiswaan / OSIS / Ekskul</option>
                      <option value="Keamanan">Keamanan & Ketertiban</option>
                      <option value="Konseling">Konseling / Bimbingan Konseling (BK)</option>
                      <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-widest">
                    Tanggal Kejadian <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18} />
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-5 py-4 text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium cursor-pointer" 
                        value={tanggalKejadian} 
                        onChange={(e) => setTanggalKejadian(e.target.value)} 
                        required 
                      />
                  </div>
                </div>
            </div>

            {/* 3. DESKRIPSI LENGKAP */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Deskripsi Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows="5" 
                placeholder="Jelaskan detail kronologi masalah, lokasi, atau saran perbaikan yang Anda usulkan..." 
                className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-4 text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm resize-none font-medium leading-relaxed placeholder-slate-400 dark:placeholder-gray-600"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* 4. UNGGAH FOTO BUKTI (OPSIONAL) */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-gray-400 mb-2 uppercase tracking-widest">
                Unggah Foto Bukti <span className="text-slate-400 dark:text-gray-500 lowercase">(opsional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {previews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 group shadow-sm">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)} 
                      className="absolute top-2 right-2 bg-rose-500 p-1.5 rounded-full text-white shadow-xl opacity-90 hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                    >
                      <X size={12}/>
                    </button>
                  </div>
                ))}
                
                <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/50 transition-all text-slate-500 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 group">
                  <ImagePlus size={26} className="group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-[10px] font-black uppercase mt-2">Pilih File...</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange} 
                  />
                </label>
              </div>
            </div>

            {/* 5. KOTAK CENTANG ANONIMITAS (SANGAT JELAS SESUAI SKRIPSI) */}
            <label 
              className={`flex items-start gap-3.5 p-5 rounded-2xl border transition-all cursor-pointer ${
                isAnonymous 
                  ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                  : 'bg-slate-50 dark:bg-[#0f1115] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <input 
                type="checkbox" 
                checked={isAnonymous} 
                onChange={(e) => setIsAnonymous(e.target.checked)} 
                className="w-5 h-5 mt-0.5 accent-emerald-500 cursor-pointer rounded-lg border-slate-300 dark:border-white/10" 
              />
              <div className="select-none">
                  <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className={isAnonymous ? "text-emerald-500" : "text-slate-400 dark:text-gray-500"} />
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
                        Sembunyikan Nama Saya (Kirim sebagai Anonim)
                      </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 font-medium mt-0.5">
                    Nama dan identitas kelas Anda tidak akan ditampilkan ke publik.
                  </p>
              </div>
            </label>

            {/* 6. TOMBOL KIRIM LAPORAN */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 group tracking-widest text-xs uppercase cursor-pointer disabled:opacity-50 mt-4"
            >
              <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
              {loading ? "Mengirim Laporan..." : "KIRIM LAPORAN"}
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}
