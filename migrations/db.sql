-- ========================================================
-- RESET DATABASE
-- ========================================================
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS aspiration_responses CASCADE;
DROP TABLE IF EXISTS aspirations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================================
-- 1. TABEL USERS (6 ROLES RBAC)
-- ========================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nis VARCHAR(20) UNIQUE,                          -- Khusus Siswa
    nip VARCHAR(30) UNIQUE,                          -- Khusus Staf/Pejabat/Guru
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (
        role IN ('siswa', 'admin', 'guru_bk', 'waka_kesiswaan', 'waka_kurikulum', 'kepala_sekolah')
    ),
    avatar_url TEXT DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    kelas VARCHAR(50) DEFAULT '',                    -- Opsional (hanya diisi untuk Siswa)
    gender VARCHAR(20) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 2. TABEL PENGADUAN / ASPIRATIONS
-- ========================================================
CREATE TABLE aspirations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    tanggal_pengaduan DATE DEFAULT CURRENT_DATE,      -- Sesuai Class Diagram
    bukti_file TEXT DEFAULT '',                       -- Path file bukti (Sesuai Class Diagram)
    anonimitas BOOLEAN DEFAULT FALSE,                 -- Mode anonim (Sesuai Class Diagram)
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu' CHECK (
        status IN ('Menunggu', 'Diproses', 'Selesai') -- 3 Status resmi skripsi
    ),
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 3. TABEL TANGGAPAN (ASPIRATION RESPONSES)
-- ========================================================
CREATE TABLE aspiration_responses (
    id SERIAL PRIMARY KEY,
    aspiration_id INT NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    admin_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- ID Penindaklanjut (Admin/Waka/BK)
    message TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 4. TABEL VOTES
-- ========================================================
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    aspiration_id INT NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, aspiration_id)
);

-- ========================================================
-- 5. TABEL COMMENTS
-- ========================================================
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    aspiration_id INT NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 6. DATA DUMMY 6 ROLE PENGGUNA (Password: password123)
-- ========================================================
INSERT INTO users (name, nis, nip, email, password, role, phone, kelas, gender) VALUES 
('Super Administrator', NULL, '198001012010011001', 'admin@mthuda.sch.id', '$2a$10$zJI0txxrME5iGyHJLuoTP.heIPbAtALg49pKzGvawTvWUS0BDcWGu', 'admin', '081234567801', '', 'Laki-laki'),
('Guru BK (Konseling)', NULL, '198205122012022002', 'bk@mthuda.sch.id', '$2a$10$zJI0txxrME5iGyHJLuoTP.heIPbAtALg49pKzGvawTvWUS0BDcWGu', 'guru_bk', '081234567802', '', 'Perempuan'),
('nurul halimah S.Pd.I.', NULL, '198403152014031003', 'kesiswaan@mthuda.sch.id', '$2a$10$zJI0txxrME5iGyHJLuoTP.heIPbAtALg49pKzGvawTvWUS0BDcWGu', 'waka_kesiswaan', '081234567803', '', 'Laki-laki'),
('sutarman,S.Pd.I.', NULL, '198607202015041004', 'kurikulum@mthuda.sch.id', '$2a$10$zJI0txxrME5iGyHJLuoTP.heIPbAtALg49pKzGvawTvWUS0BDcWGu', 'waka_kurikulum', '081234567804', '', 'Laki-laki'),
('sampiun,S.pd,I.', NULL, '197509102005011005', 'kepsek@mthuda.sch.id', '$2a$10$zJI0txxrME5iGyHJLuoTP.heIPbAtALg49pKzGvawTvWUS0BDcWGu', 'kepala_sekolah', '081234567805', '', 'Laki-laki'),
('Ahmad Siswa', '20260001', NULL, 'siswa@mthuda.sch.id', '$2a$10$zJI0txxrME5iGyHJLuoTP.heIPbAtALg49pKzGvawTvWUS0BDcWGu', 'siswa', '081234567806', 'IX-A', 'Laki-laki');

-- DUMMY CONTOH PENGADUAN AWAL
INSERT INTO aspirations (title, content, category, tanggal_pengaduan, bukti_file, anonimitas, status, user_id) VALUES
('Buku Paket Matematika Kurang di Kelas IX', 'Jumlah buku paket matematika semester ganjil tidak mencukupi untuk seluruh siswa di kelas IX-A.', 'Akademik', CURRENT_DATE, '', FALSE, 'Menunggu', 6),
('Lampu Kamar Mandi Siswa Mati', 'Lampu kamar mandi siswa lantai 2 sudah padam selama 3 hari dan belum diperbaiki.', 'Fasilitas Sekolah', CURRENT_DATE, '', FALSE, 'Menunggu', 6);
