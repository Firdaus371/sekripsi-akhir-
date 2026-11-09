-- ========================================================
-- PERBAIKAN DATA PENGUJIAN 3 NOVEMBER 2026
-- Mengisi judul, isi/deskripsi, kategori, dan status 
-- untuk laporan pengujian tanggal 3 November yang sebelumnya kosong
-- ========================================================

UPDATE aspirations 
SET 
    title = 'Kipas Angin di Ruang Kelas 7 Rusak dan Berisik',
    content = 'Kipas angin di langit-langit kelas 7 menimbulkan suara bising dan putarannya lambat sehingga ruangan terasa panas saat kegiatan belajar mengajar siang hari.',
    category = 'Fasilitas Sekolah',
    status = 'Menunggu',
    anonimitas = FALSE
WHERE id = 4;

UPDATE aspirations 
SET 
    title = 'Jadwal Penggunaan Laboratorium Komputer Sering Bentrok',
    content = 'Mohon penataan ulang jadwal praktikum TIK di lab komputer agar tidak bertabrakan dengan kelas lain sehingga jam praktik siswa bisa optimal.',
    category = 'Akademik',
    status = 'Diproses',
    anonimitas = FALSE
WHERE id = 5;

UPDATE aspirations 
SET 
    title = 'Pintu Gerbang Belakang Madrasah Kerap Terbuka Tanpa Pengawasan',
    content = 'Pintu gerbang area belakang madrasah dekat lapangan sering tidak terkunci saat jam istirahat. Dikhawatirkan ada orang luar masuk tanpa izin.',
    category = 'Keamanan',
    status = 'Menunggu',
    anonimitas = TRUE
WHERE id = 6;

UPDATE aspirations 
SET 
    title = 'Kran Air Tempat Wudhu Musholla Mengalami Kebocoran',
    content = 'Terdapat dua kran wudhu di musholla siswa yang bocor terus-menerus sehingga air terbuang dan lantai menjadi licin menjelang sholat Dzuhur berjamaah.',
    category = 'Fasilitas Sekolah',
    status = 'Selesai',
    anonimitas = FALSE
WHERE id = 7;

UPDATE aspirations 
SET 
    title = 'Usulan Pengadaan Ekstrakurikuler Robotik dan Coding',
    content = 'Banyak siswa kelas 7 yang berminat mempelajari dasar-dasar pemrograman dan teknologi. Mohon pihak kesiswaan dan OSIS memfasilitasi pembentukan ekskul ini.',
    category = 'Kesiswaan/OSIS',
    status = 'Menunggu',
    anonimitas = FALSE
WHERE id = 8;

UPDATE aspirations 
SET 
    title = 'Permohonan Sosialisasi Pencegahan Bullying dan Perundungan',
    content = 'Memohon bimbingan konseling mengadakan sesi sosialisasi stop perundungan antar siswa di kelas agar lingkungan pertemanan madrasah semakin aman dan nyaman.',
    category = 'Konseling',
    status = 'Diproses',
    anonimitas = TRUE
WHERE id = 9;

UPDATE aspirations 
SET 
    title = 'Kekurangan Buku Modul Pembelajaran IPA Semester Ganjil',
    content = 'Sebagian siswa kelas 7 belum mendapatkan modul pegangan IPA cetak terbaru sehingga harus bergantian saat mengerjakan lembar kerja praktikum.',
    category = 'Akademik',
    status = 'Menunggu',
    anonimitas = FALSE
WHERE id = 10;
