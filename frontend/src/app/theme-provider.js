"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({
  darkMode: true,
  toggleTheme: () => {},
  mounted: false,
})

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Membaca preferensi tema dari localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      const isDark = savedTheme === 'dark'
      setDarkMode(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      // Default: dark mode untuk kenyamanan visual
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setDarkMode(true)
    }
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
