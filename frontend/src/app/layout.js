import "./globals.css";
import { ThemeProvider } from "./theme-provider";

export const metadata = {
  title: "Sistem Pengaduan Siswa - MTs Miftahul Huda Rama Gunawan",
  description: "Aplikasi Layanan Aspirasi dan Pengaduan Siswa Berbasis Web",
  icons: {
    icon: "/logo-mts.png",
    shortcut: "/logo-mts.png",
    apple: "/logo-mts.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className="antialiased font-sans transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
