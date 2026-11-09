"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// Import Ikon Profesional
import { 
  BarChart2, PieChart, TrendingUp, CheckCircle, 
  Clock, Flame, ArrowLeft, Activity, Layers, 
  Calendar, Megaphone, Star, Sun, Moon 
} from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function StatistikPage() {
  const router = useRouter()
  const { darkMode, toggleTheme } = useTheme()
  const [stats, setStats] = useState(null)
  const [aspirations, setAspirations] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [maxMonthValue, setMaxMonthValue] = useState(10)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const fetchData = async () => {
        try {
            const [resStats, resAsp] = await Promise.all([
                axios.get('http://localhost:8080/aspirations/stats'),
                axios.get('http://localhost:8080/aspirations')
            ])
            
            const rawAspirations = resAsp.data.data || []
            setStats(resStats.data.data)
            setAspirations(rawAspirations)

            // Olah Data Kategori
            const catCounts = {}
            rawAspirations.forEach(a => {
                const cat = a.category || "Lainnya"
                catCounts[cat] = (catCounts[cat] || 0) + 1
            })
            const catArray = Object.keys(catCounts).map(key => ({
                name: key,
                count: catCounts[key]
            })).sort((a, b) => b.count - a.count)
            setCategoryData(catArray)

            // Olah Data Bulanan
            const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
            const monthCounts = new Array(12).fill(0)
            
            rawAspirations.forEach(a => {
                const date = new Date(a.created_at)
                const monthIdx = date.getMonth() 
                monthCounts[monthIdx]++
            })

            const calculatedMax = Math.max(...monthCounts)
            setMaxMonthValue(calculatedMax < 5 ? 5 : calculatedMax) 

            setMonthlyData(months.map((m, i) => ({ name: m, count: monthCounts[i] })))
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }
    fetchData()
  }, [])

  if (!isMounted) return null

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Menghitung Statistik...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-800 dark:text-white font-sans selection:bg-emerald-500 selection:text-black pb-20 transition-colors duration-200">
      
      {/* NAVBAR */}
      <nav className="bg-white/90 dark:bg-[#191c24]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <img 
              src="/logo-mts.png" 
              alt="Logo MTs Miftahul Huda" 
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-wide leading-none text-slate-900 dark:text-white">Student <span className="text-emerald-500">Voice</span></span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Statistik MTs Miftahul Huda</span>
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
            <Link href="/">
              <button className="flex items-center gap-2 text-xs font-black bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 transition-all uppercase tracking-wider shadow-sm">
                  <ArrowLeft size={14} /> Kembali
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-12 animate-fade-in">
        
        {/* RINGKASAN ATAS: KARTU PROFESIONAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white dark:bg-[#191c24] p-6 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-sm group hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 font-black uppercase tracking-widest">Total Pengaduan</p>
                    <Activity className="text-blue-500 opacity-60" size={18} />
                </div>
                <p className="text-4xl font-black text-slate-900 dark:text-white">{stats?.total_aspirations || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#191c24] p-6 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-sm group hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest">Selesai</p>
                    <CheckCircle className="text-emerald-500 opacity-60" size={18} />
                </div>
                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-500">{stats?.total_completed || 0}</p>
            </div>

            <div className="bg-white dark:bg-[#191c24] p-6 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-sm group hover:border-slate-300 dark:hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest">Menunggu Tinjauan</p>
                    <Clock className="text-amber-500 opacity-60" size={18} />
                </div>
                <p className="text-4xl font-black text-amber-600 dark:text-amber-500">{stats?.total_pending || 0}</p>
            </div>

            <div className="bg-white dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-[#191c24] p-6 rounded-[28px] border border-slate-200 dark:border-orange-500/20 shadow-sm relative overflow-hidden group">
                <Flame className="absolute top-0 right-0 p-4 opacity-10 text-orange-500 group-hover:scale-125 transition-transform" size={80}/>
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Topik Utama</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate uppercase tracking-tight leading-none">{stats?.top_category || "-"}</p>
            </div>
        </div>

        {/* LAYOUT UTAMA: KONTRASTING BLOCKS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLOM KIRI: KATEGORI PROGRESS BARS */}
            <div className="bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 h-fit shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Layers className="text-blue-500" size={20} />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Penyebaran Kategori</h3>
                </div>
                
                <div className="space-y-8">
                    {categoryData.length === 0 ? (
                        <p className="text-slate-400 dark:text-gray-600 text-[10px] font-bold text-center py-4 uppercase">Belum ada data masuk</p>
                    ) : categoryData.map((cat, idx) => (
                        <div key={idx} className="group">
                            <div className="flex justify-between text-[11px] mb-3 uppercase tracking-wider font-black">
                                <span className="text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cat.name}</span>
                                <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{cat.count}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#0f1115] h-2 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000 ease-in-out" 
                                    style={{ width: `${(cat.count / (stats?.total_aspirations || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 text-center">
                    <p className="text-[9px] text-slate-400 dark:text-gray-600 font-black uppercase tracking-[0.3em]">
                        Total {categoryData.length} Kategori Terdeteksi
                    </p>
                </div>
            </div>

            {/* KOLOM KANAN: GRAFIK BATANG MODERN */}
            <div className="lg:col-span-2 bg-white dark:bg-[#191c24] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 flex flex-col shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="text-emerald-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Analisis Bulanan</h3>
                            <p className="text-[10px] text-slate-400 dark:text-gray-600 font-bold uppercase tracking-wider mt-1">Data Pengaduan Tahun 2026</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <Activity size={12} className="text-emerald-600 dark:text-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest">Live Sync</span>
                    </div>
                </div>

                {/* GRAFIK AREA */}
                <div className="flex-1 min-h-[350px] flex flex-col justify-end">
                    <div className="relative h-72 border-b border-slate-200 dark:border-white/5 flex items-end gap-3 sm:gap-4 px-2 pb-px">
                        
                        {/* Garis Horizontal Halus */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.06] dark:opacity-[0.03] z-0">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="border-t border-slate-900 dark:border-white w-full h-full"></div>
                            ))}
                        </div>

                        {/* RENDER BATANG MODEREN */}
                        {monthlyData.map((data, idx) => {
                            const heightPercent = Math.round((data.count / maxMonthValue) * 100)
                            const isZero = data.count === 0

                            return (
                                <div key={idx} className="flex-1 h-full flex flex-col justify-end group relative z-10">
                                    
                                    {/* Tooltip Hover Premium */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl pointer-events-none whitespace-nowrap z-20 uppercase tracking-tighter">
                                        {data.count} Pengaduan
                                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white"></div>
                                    </div>

                                    {/* Bar Design */}
                                    <div 
                                        className={`w-full rounded-t-xl transition-all duration-700 ease-out relative group-hover:scale-x-110 ${isZero ? 'bg-slate-200 dark:bg-white/5' : 'bg-gradient-to-t from-emerald-600 to-emerald-400'}`}
                                        style={{ height: isZero ? '4px' : `${heightPercent}%` }}
                                    >
                                        {!isZero && (
                                            <div className="absolute top-0 w-full h-1.5 bg-white/30 rounded-t-xl"></div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* LABEL BULAN MONO */}
                    <div className="flex gap-3 sm:gap-4 px-2 mt-6">
                        {monthlyData.map((data, idx) => (
                            <div key={idx} className="flex-1 text-center">
                                <p className="text-[10px] text-slate-500 dark:text-gray-600 font-black uppercase tracking-tighter group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{data.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* LEGENDA BERSIH */}
                <div className="mt-10 flex items-center justify-center gap-8 border-t border-slate-100 dark:border-white/5 pt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">Frekuensi Suara</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-300 dark:bg-white/10 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest">Belum Ada Data</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}
