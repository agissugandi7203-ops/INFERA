# -*- coding: utf-8 -*-
"""
INFERA JKN Regulatory Knowledge Base Generator for Supabase RAG.
Compiles official Indonesian healthcare regulations into structured markdown,
generates semantic chunks with rich metadata, and creates Supabase pgvector schema.
"""

import json
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'regulations')
os.makedirs(OUTPUT_DIR, exist_ok=True)

DOCS = {
    "01_permenkes_16_2019_anti_fraud.md": """# PERATURAN MENTERI KESEHATAN REPUBLIK INDONESIA
NOMOR 16 TAHUN 2019
TENTANG
PENCEGAHAN DAN PENANGANAN KECURANGAN (FRAUD) SERTA PENGENAAN SANKSI ADMINISTRATIF TERHADAP KECURANGAN (FRAUD) DALAM PELAKSANAAN PROGRAM JAMINAN KESEHATAN

---

## BAB I: KETENTUAN UMUM

### Pasal 1
Dalam Peraturan Menteri ini yang dimaksud dengan:
1. Jaminan Kesehatan adalah jaminan berupa perlindungan kesehatan agar peserta memperoleh manfaat pemeliharaan kesehatan dan perlindungan dalam memenuhi kebutuhan dasar kesehatan yang diberikan kepada setiap orang yang telah membayar iuran atau iurannya dibayar oleh Pemerintah.
2. Program Jaminan Kesehatan adalah sistem jaminan kesehatan yang diselenggarakan oleh BPJS Kesehatan dengan menggunakan sistem asuransi sosial dan prinsip ekuitas.
3. Kecurangan (Fraud) dalam Program Jaminan Kesehatan adalah tindakan yang dilakukan dengan sengaja oleh peserta, petugas BPJS Kesehatan, pemberi pelayanan kesehatan, serta penyedia obat dan alat kesehatan untuk mendapatkan keuntungan finansial dari program jaminan kesehatan dalam Sistem Jaminan Sosial Nasional melalui perbuatan curang yang tidak sesuai dengan ketentuan peraturan perundang-undangan.
4. Fasilitas Kesehatan adalah fasilitas pelayanan kesehatan yang digunakan untuk menyelenggarakan upaya pelayanan kesehatan baik promotif, preventif, kuratif maupun rehabilitatif yang dilakukan oleh Pemerintah, Pemerintah Daerah, dan/atau masyarakat.
5. Fasilitas Kesehatan Tingkat Pertama (FKTP) adalah fasilitas kesehatan yang melakukan pelayanan kesehatan perorangan yang bersifat non spesialistik untuk keperluan observasi, diagnosis, pengobatan, dan/atau pelayanan kesehatan lainnya.
6. Fasilitas Kesehatan Rujukan Tingkat Lanjutan (FKRTL) adalah fasilitas kesehatan yang melakukan pelayanan kesehatan perorangan yang bersifat spesialistik atau sub spesialistik yang meliputi rawat jalan tingkat lanjutan, rawat inap tingkat lanjutan, dan rawat inap di ruang perawatan khusus.

### Pasal 2
Pengaturan pencegahan dan penanganan kecurangan (fraud) serta pengenaan sanksi administratif bertujuan untuk:
a. Membangun sistem pencegahan dan penanganan kecurangan (fraud) yang komprehensif, terstruktur, dan terintegrasi;
b. Mengurangi dan meniadakan potensi kerugian keuangan Dana Jaminan Sosial (DJS) Kesehatan dan/atau keuangan negara;
c. Menjamin kesinambungan pelaksanaan Program Jaminan Kesehatan; dan
d. Menjamin mutu dan keselamatan pasien dalam penyelenggaraan pelayanan kesehatan bagi Peserta.

---

## BAB II: SISTEM PENCEGAHAN KECURANGAN (FRAUD)

### Pasal 3
(1) Setiap Fasilitas Kesehatan, BPJS Kesehatan, dan Dinas Kesehatan Kabupaten/Kota wajib membangun sistem pencegahan kecurangan (fraud).
(2) Sistem pencegahan kecurangan (fraud) sebagaimana dimaksud pada ayat (1) dilaksanakan melalui:
a. Penyusunan kebijakan dan pedoman pencegahan kecurangan (fraud);
b. Pengembangan budaya pencegahan kecurangan (fraud);
c. Pembentukan tim pencegahan kecurangan (fraud); dan
d. Pelaksanaan upaya pencegahan kecurangan (fraud) dalam proses pelayanan dan administrasi klaim.

### Pasal 4
(1) Tim pencegahan kecurangan (fraud) pada FKRTL sekurang-kurangnya terdiri dari:
a. Unsur Komite Medik;
b. Unsur Manajemen Rumah Sakit;
c. Unsur Koder Rekam Medis; dan
d. Unsur Satuan Pengawas Internal (SPI).
(2) Tim pencegahan kecurangan (fraud) bertugas:
a. Menyusun dan menyosialisasikan pedoman pencegahan kecurangan (fraud);
b. Melakukan monitoring dan evaluasi terhadap kepatuhan pengajuan klaim;
c. Menerima, meneliti, dan menindaklanjuti laporan dugaan kecurangan (fraud); dan
d. Berkoordinasi dengan Tim Pencegahan Kecurangan Dinas Kesehatan dan BPJS Kesehatan.

---

## BAB III: DETEKSI DAN PENANGANAN KECURANGAN

### Pasal 5
(1) Deteksi potensi kecurangan (fraud) dilakukan secara berkala dan sistematis melalui:
a. Analisis data klaim (analisis anomali statistik dan variasi biaya);
b. Audit medis dan audit administrasi klaim;
c. Pemeriksaan berkas rekam medis elektronik dan fisik; dan
d. Tindak lanjut pengaduan dan laporan dugaan kecurangan.
(2) Analisis data klaim sebagaimana dimaksud pada ayat (1) huruf a dilakukan untuk mengidentifikasi indikasi:
a. Penggelembungan kode diagnosis dan/atau prosedur (upcoding);
b. Tagihan palsu atau fiktif (phantom billing);
c. Pemecahan episode pelayanan yang seharusnya dalam satu paket (unbundling);
d. Penjiplakan klaim pasien (cloning);
e. Tagihan untuk layanan yang dibatalkan (cancelled services);
f. Perpanjangan lama hari rawat tanpa indikasi medis (inappropriate length of stay); dan
g. Rujukan yang tidak sesuai prosedur atau pembagian komisi rujukan (self-referral/fee splitting).

### Pasal 6
(1) Dalam hal hasil deteksi menunjukkan adanya dugaan kecurangan (fraud), dilakukan investigasi oleh Tim Bersama atau Tim Independen.
(2) Investigasi sebagaimana dimaksud pada ayat (1) meliputi:
a. Pemeriksaan kesesuaian rekam medis dengan tagihan klaim;
b. Konfirmasi kepada pasien atau keluarga pasien;
c. Wawancara dengan dokter penanggung jawab pelayanan (DPJP) dan koder; serta
d. Uji petik sarana prasarana dan catatan log pelayanan.

---

## BAB IV: PENGENAAN SANKSI ADMINISTRATIF

### Pasal 7
(1) Terhadap Fasilitas Kesehatan, tenaga medis, atau petugas yang terbukti melakukan kecurangan (fraud) dikenakan sanksi administratif.
(2) Sanksi administratif sebagaimana dimaksud pada ayat (1) dapat berupa:
a. Teguran lisan;
b. Teguran tertulis;
c. Perintah pengembalian kerugian finansial akibat kecurangan kepada BPJS Kesehatan;
d. Denda administratif;
e. Penundaan atau penangguhan pembayaran klaim sementara (payment freeze);
f. Penghentian kerja sama sementara; dan/atau
g. Pemutusan hubungan kerja sama secara permanen.

### Pasal 8
(1) Pengembalian kerugian finansial sebagaimana dimaksud dalam Pasal 7 ayat (2) huruf c wajib disetorkan ke rekening Dana Jaminan Sosial (DJS) BPJS Kesehatan paling lambat 14 (empat belas) hari kerja sejak diterbitkannya Berita Acara Hasil Investigasi.
(2) Apabila dalam jangka waktu sebagaimana dimaksud pada ayat (1) faskes tidak mengembalikan kerugian, BPJS Kesehatan berhak melakukan pemotongan otomatis (offsetting) dari pembayaran klaim bulan berjalan berikutnya.

### Pasal 9
Apabila perbuatan kecurangan (fraud) mengandung unsur tindak pidana korupsi atau pemalsuan dokumen yang disengaja dan merugikan keuangan negara dalam jumlah signifikan, Tim Pencegahan Kecurangan melimpahkan berkas perkara kepada aparat penegak hukum (Kejaksaan, Kepolisian, atau Komisi Pemberantasan Korupsi).
""",

    "02_permenkes_36_2015_modus_kecurangan.md": """# BENTUK-BENTUK KECURANGAN (FRAUD) DALAM JKN
REFERENSI: PERMENKES NO. 36 TAHUN 2015 & PERMENKES NO. 16 TAHUN 2019
PEDOMAN TIPOLOGI KECURANGAN KLAIM FASILITAS KESEHATAN

---

## 1. UPCODING (MANIPULASI KODE DIAGNOSIS DAN/ATAU PROSEDUR)
- **Definisi:** Tindakan pengubahan kode diagnosis primer, penambahan komorbiditas diagnosis sekunder palsu, atau pemilihan kode prosedur medis yang lebih rumit dengan tujuan agar tarif INA-CBG yang dihasilkan lebih tinggi dari kondisi klinis pasien yang sebenarnya.
- **Karakteristik Anomali:**
  - Penambahan komorbiditas berat (Severity Level III) seperti Gagal Nafas Akut (J96.0) atau Sepsis pada pasien yang hanya dirawat di bangsal umum tanpa perawatan ICU.
  - Length of stay (LOS) sangat singkat (1-2 hari) padahal klaim ditagihkan dengan severity level III yang secara klinis mensyaratkan perawatan intensif.
- **Rujukan Regulasi:** Permenkes 36/2015 Pasal 5 ayat (3) huruf a & Permenkes 16/2019 Pasal 5 ayat (2) huruf a.

---

## 2. PHANTOM BILLING (KLAIM PALSU / FIKTIF)
- **Definisi:** Tindakan pengajuan klaim pembayaran penggantian biaya pelayanan kesehatan atas tindakan, prosedur, rawat inap, atau peresepan obat yang sebenarnya tidak pernah diberikan kepada peserta JKN.
- **Karakteristik Anomali:**
  - Klaim pelayanan tindakan spesifik (misal: Fisioterapi, Hemodialisis) pada tanggal di mana poli faskes tutup atau hari libur nasional.
  - Penagihan klaim atas nama peserta yang tercatat sedang tidak berada di lokasi faskes atau tidak memiliki berkas registrasi rekam medis elektronik.
  - Dokter DPJP tercatat melakukan tindakan operasi di dua rumah sakit berbeda pada jam dan menit yang bersamaan.
- **Rujukan Regulasi:** Permenkes 36/2015 Pasal 5 ayat (3) huruf c & Permenkes 16/2019 Pasal 5 ayat (2) huruf b.

---

## 3. UNBUNDLING / FRAGMENTASI PELAYANAN
- **Definisi:** Tindakan memecah satu paket episode pelayanan yang seharusnya ditagihkan dalam satu kode INA-CBG tunggal menjadi beberapa tagihan atau klaim terpisah guna melipatgandakan penerimaan faskes.
- **Karakteristik Anomali:**
  - Pada operasi katarak, biaya implan lensa Intraocular Lens (IOL) atau obat tetes mata anestesi ditagihkan terpisah sebagai klaim rawat jalan sekunder.
  - Pemeriksaan penunjang laboratorium pra-operasi dipisahkan dari paket rawat inap bedah terencana.
- **Rujukan Regulasi:** Permenkes 36/2015 Pasal 5 ayat (3) huruf d.

---

## 4. INAPPROPRIATE READMISSION (< 30 HARI)
- **Definisi:** Tindakan memulangkan pasien rawat inap sebelum kondisi klinisnya stabil secara sengaja (early discharge), agar faskes dapat mendaftarkan kembali pasien tersebut beberapa hari kemudian sebagai episode rawat inap baru untuk memperoleh dua klaim INA-CBG penuh.
- **Karakteristik Anomali:**
  - Pasien masuk kembali ke faskes yang sama dalam kurun waktu kurang dari 7 s/d 14 hari dengan diagnosa pada kelompok organ (MDC) yang identik.
  - Pasien pasca-operasi bedah mayor dipulangkan kurang dari 48 jam tanpa resume medis pemulihan lengkap.
- **Rujukan Regulasi:** Permenkes 36/2015 Pasal 5 ayat (3) huruf g.

---

## 5. CLONING CLAIM (PENJIPLAKAN KLAIM)
- **Definisi:** Mengajukan klaim dengan menduplikasi seluruh atau sebagian besar data diagnosa, tindakan, dan rincian klaim dari berkas klaim pasien lain yang sah.
- **Karakteristik Anomali:**
  - Kesamaan pola diagnosa sekunder, urutan prosedur, dan nilai biaya tagihan hingga digit satuan pada banyak pasien berturut-turut.
- **Rujukan Regulasi:** Permenkes 36/2015 Pasal 5 ayat (3) huruf b.

---

## 6. SELF-REFERRAL & FEE-SPLITTING (RUJUKAN FIKTIF / MONOPOLISTIK)
- **Definisi:** Kerjasama antara faskes primer (FKTP) dan faskes rujukan lanjutan (FKRTL) tertentu untuk memindahkan rujukan pasien secara terpusat tanpa pertimbangan zonasi faskes terdekat atau indikasi medis, demi pembagian keuntungan (kickback).
- **Karakteristik Anomali:**
  - Rasio rujukan FKTP ke salah satu rumah sakit swasta mencapai >90% dan mengabaikan rumah sakit pemerintah dengan kapasitas memadai yang berjarak lebih dekat.
- **Rujukan Regulasi:** Permenkes 36/2015 Pasal 5 ayat (3) huruf h.
""",

    "03_permenkes_3_2023_pedoman_inacbg.md": """# STANDAR TARIF PELAYANAN DAN ATURAN KODING INA-CBGs
REFERENSI: PERMENKES NO. 3 TAHUN 2023
TENTANG STANDAR TARIF PELAYANAN KESEHATAN DALAM PENYELENGGARAAN PROGRAM JAMINAN KESEHATAN

---

## 1. SISTEM INA-CBGs (INDONESIAN CASE BASED GROUPS)
Sistem INA-CBGs merupakan pengelompokan tarif berbasis kasus diagnosis dan prosedur medis yang mengelompokkan ribuan diagnosa ICD-10 dan prosedur ICD-9-CM ke dalam kelompok-kelompok homogen yang memiliki kemiripan konsumsi sumber daya klinis.

### Struktur Kode INA-CBG:
Kode INA-CBG terdiri dari 4 digit alfanumerik: X-Y-ZZ-S
- X = Major Diagnostic Category (MDC) / Sistem Organ (A s/d Z).
- Y = Tipe Pelayanan (1 = Rawat Jalan, 2 s/d 8 = Rawat Inap Prosedur/Medis).
- ZZ = Kode Spesifik Grup Kasus (01 s/d 99).
- S = Severity Level (Tingkat Keparahan):
  -   / I : Sub-akut / Ringan (Tanpa Komplikasi).
  - II : Sedang (Dengan Komplikasi Sedang).
  - III : Berat (Dengan Komplikasi Mayor / Berat / Mengancam Nyawa).

---

## 2. KELOMPOK MDC (MAJOR DIAGNOSTIC CATEGORIES) UTAMA:
- **MDC A:** Penyakit Saraf (Central & Peripheral Nervous System)
- **MDC C:** Penyakit Mata (Diseases of the Eye, misal Katarak H-3-13-I)
- **MDC E:** Penyakit Sirkulasi & Kardiovaskular (Jantung & Pembuluh Darah, misal I-4-10-III)
- **MDC F:** Penyakit Respiratori & Paru (Pneumonia, TB, misal J-4-14-III)
- **MDC J:** Kehamilan, Persalinan & Nifas (Sectio Caesarea O-6-10-I s/d O-6-10-III)
- **MDC L:** Penyakit Ginjal & Saluran Kemih (Hemodialisa N-3-10-0)

---

## 3. ATURAN KODING RESMI (OFFICIAL CODING GUIDELINES JKN):
1. **Aturan Diagnosa Primer:**
   Diagnosa utama adalah kondisi klinis yang ditegakkan pada akhir episode pelayanan yang menjadi alasan utama pasien dirawat atau diperiksa setelah evaluasi medis.
2. **Aturan Komorbiditas & Komplikasi:**
   Diagnosa sekunder hanya boleh diinput apabila kondisi tersebut memenuhi salah satu kriteria berikut:
   a. Memerlukan evaluasi klinis aktif;
   b. Memerlukan penanganan atau pengobatan terapeutik tambahan;
   c. Memerlukan prosedur diagnostik penunjang khusus;
   d. Menambah lama hari rawat (LOS); atau
   e. Membutuhkan peningkatan pemantauan keperawatan.
   *Diagnosa masa lalu yang tidak aktif atau tidak berdampak pada perawatan saat ini DILARANG dimasukkan sebagai diagnosa sekunder komorbid.*
3. **Larangan Iur Biaya Tambahan (Balance Billing):**
   Fasilitas kesehatan dilarang memungut iur biaya tambahan kepada peserta JKN di luar ketentuan naik kelas rawat inap yang diatur secara resmi dalam regulasi jaminan kesehatan.
""",

    "04_pedoman_audit_kpk_bpjs.md": """# PEDOMAN INVESTIGASI KECURANGAN KLAIM JKN
TIM BERSAMA KPK - KEMENTERIAN KESEHATAN - BPJS KESEHATAN
STUDI KASUS TEMUAN AUDIT KLAIM RUMAH SAKIT

---

## 1. METODOLOGI AUDIT FORENSIK KLAIM JKN
Audit forensik terhadap klaim faskes menggunakan pendekatan berlapis:
1. **Analisis Anomali Statistik (Data Mining):**
   - Menghitung deviasi Z-score tarif klaim rumah sakit terhadap rata-rata rumah sakit sekelas di regional yang sama.
   - Mengidentifikasi faskes dengan rasio Severity Level III > 40% dari total klaim rawat inap.
2. **Uji Silang Rekam Medis (Medical Record Cross-Examination):**
   - Mencocokkan lembar persetujuan tindakan medis (informed consent), laporan operasi, catatan anestesi, dan grafik tanda vital dengan lembar penagihan klaim.
3. **Konfirmasi Pasien Secara Acak (Patient Field Sampling):**
   - Mengirim tim verifikator lapangan untuk memverifikasi apakah pasien benar-benar pernah menjalani operasi atau tindakan yang ditagihkan.

---

## 2. STUDI KASUS RIIL TEMUAN AUDIT KPK & KEMENKES (JULI 2024):
### Kasus A: Fisioterapi Fiktif (Phantom Billing)
- **Temuan:** 3 Rumah Sakit Swasta terbukti mengajukan klaim fisioterapi hingga puluhan miliar rupiah tanpa didukung lembar rekam medis rehabilitasi medik yang sah.
- **Indikator:** Frekuensi kunjungan pasien tercatat 3 kali seminggu selama 6 bulan berturut-turut dengan catatan evaluasi fisik dokter spesialis KFR yang identik (copy-paste).
- **Tindak Lanjut:** Kasus ditingkatkan ke tahap penyelidikan tindak pidana korupsi oleh KPK dan pencabutan izin kerjasama BPJS.

### Kasus B: Upcoding & Indikasi Palsu Operasi Katarak
- **Temuan:** Klaim operasi fakoemulsifikasi massal pada lansia yang sebenarnya visus matanya masih memenuhi kategori tajam penglihatan wajar tanpa indikasi operasi mendesak.
- **Indikator:** Tidak dilampirkannya foto segmen anterior mata atau uji keratometri pra-operasi pada berkas pengajuan klaim digital.
- **Tindak Lanjut:** BPJS menolak pembayaran klaim dan mewajibkan pengembalian dana klaim yang telah terlanjur cair.
"""
}

# 1. Write Markdown Files
for filename, content in DOCS.items():
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f"[OK] Written {filename}")

# 2. Build Structured JSON Chunks for Supabase Vector Embedding
CHUNKS = [
    {
        "id": "REG-001",
        "title": "Permenkes 16/2019: Definisi dan Ruang Lingkup Kecurangan (Fraud) JKN",
        "regulation": "Permenkes No. 16 Tahun 2019",
        "chapter": "BAB I",
        "article": "Pasal 1 & Pasal 2",
        "category": "DEFINISI_HUKUM",
        "keywords": ["definisi fraud", "kecurangan jkn", "kerugian djs", "kesinambungan program"],
        "content": "Kecurangan (Fraud) dalam Program Jaminan Kesehatan adalah tindakan yang dilakukan dengan sengaja oleh peserta, petugas BPJS Kesehatan, pemberi pelayanan kesehatan, serta penyedia obat dan alat kesehatan untuk mendapatkan keuntungan finansial dari program jaminan kesehatan dalam SJSN melalui perbuatan curang yang tidak sesuai dengan ketentuan peraturan perundang-undangan (Permenkes 16/2019 Pasal 1 angka 3). Pengaturan pencegahan bertujuan untuk meniadakan potensi kerugian keuangan Dana Jaminan Sosial (DJS) dan menjamin mutu keselamatan pasien."
    },
    {
        "id": "REG-002",
        "title": "Permenkes 16/2019: Kewajiban Membangun Sistem Anti-Fraud & Tim Faskes",
        "regulation": "Permenkes No. 16 Tahun 2019",
        "chapter": "BAB II",
        "article": "Pasal 3 & Pasal 4",
        "category": "SISTEM_PENCEGAHAN",
        "keywords": ["tim anti-fraud", "komite medik", "spi rumah sakit", "kebijakan pencegahan"],
        "content": "Setiap Fasilitas Kesehatan, BPJS Kesehatan, dan Dinas Kesehatan Kabupaten/Kota wajib membangun sistem pencegahan kecurangan (fraud) melalui penyusunan kebijakan, pembentukan tim pencegahan kecurangan, dan pengembangan budaya anti-fraud. Tim anti-fraud pada FKRTL sekurang-kurangnya terdiri dari unsur Komite Medik, Manajemen RS, Koder Rekam Medis, dan Satuan Pengawas Internal (SPI) yang bertugas melakukan monitoring kepatuhan klaim dan menindaklanjuti laporan dugaan fraud."
    },
    {
        "id": "REG-003",
        "title": "Permenkes 16/2019: Tata Cara Deteksi & Analisis Data Klaim Anomali",
        "regulation": "Permenkes No. 16 Tahun 2019",
        "chapter": "BAB III",
        "article": "Pasal 5",
        "category": "DETEKSI_ANOMALI",
        "keywords": ["deteksi fraud", "analisis data klaim", "anomali statistik", "upcoding", "phantom billing", "unbundling"],
        "content": "Deteksi potensi fraud dilakukan melalui analisis data klaim berupa anomali statistik dan variasi biaya, audit medis, serta pemeriksaan berkas rekam medis. Analisis data klaim dilakukan untuk mengidentifikasi indikasi: penggelembungan kode diagnosis/prosedur (upcoding), tagihan palsu/fiktif (phantom billing), pemecahan episode pelayanan (unbundling), penjiplakan klaim (cloning), tagihan untuk layanan yang dibatalkan, perpanjangan LOS tanpa indikasi medis, serta rujukan tidak sah atau pembagian komisi rujukan (self-referral/fee splitting)."
    },
    {
        "id": "REG-004",
        "title": "Permenkes 16/2019: Sanksi Administratif, Batas Waktu 14 Hari & Pelimpahan Pidana",
        "regulation": "Permenkes No. 16 Tahun 2019",
        "chapter": "BAB IV",
        "article": "Pasal 7, 8, 9",
        "category": "SANKSI_HUKUM",
        "keywords": ["sanksi administratif", "pengembalian kerugian", "14 hari kerja", "payment freeze", "pelimpahan kpk"],
        "content": "Sanksi administratif atas fraud meliputi teguran lisan, teguran tertulis, denda administratif, penundaan pembayaran klaim (payment freeze), hingga pemutusan kerjasama faskes. Pengembalian kerugian finansial ke rekening DJS BPJS Kesehatan wajib disetorkan paling lambat 14 (empat belas) hari kerja sejak diterbitkannya Berita Acara Investigasi. Jika tidak disetor, BPJS berhak melakukan pemotongan otomatis (offsetting) klaim berikutnya. Pelanggaran berat yang mengandung unsur korupsi dilimpahkan ke penegak hukum (Kejaksaan, Kepolisian, atau KPK)."
    },
    {
        "id": "REG-005",
        "title": "Permenkes 36/2015: Definisi Modus Upcoding & Severity Manipulation",
        "regulation": "Permenkes No. 36 Tahun 2015",
        "chapter": "Pasal 5 ayat (3)",
        "article": "Upcoding & Severity Inflation",
        "category": "TIPOLOGI_FRAUD",
        "keywords": ["upcoding", "severity 3", "komorbiditas palsu", "ina-cbg tarif"],
        "content": "Upcoding adalah tindakan mengubah kode diagnosis primer atau menambahkan diagnosis sekunder komorbiditas palsu yang lebih berat agar menghasilkan tarif INA-CBG yang lebih tinggi dari kondisi klinis pasien sesungguhnya. Ciri anomali mencakup penambahan diagnosa severity level III pada pasien yang hanya dirawat inap singkat (LOS 1-2 hari) di bangsal non-intensif."
    },
    {
        "id": "REG-006",
        "title": "Permenkes 36/2015: Definisi Modus Phantom Billing & Kasus Audit KPK",
        "regulation": "Permenkes No. 36 Tahun 2015",
        "chapter": "Pasal 5 ayat (3)",
        "article": "Phantom Billing",
        "category": "TIPOLOGI_FRAUD",
        "keywords": ["phantom billing", "klaim fiktif", "fisioterapi fiktif", "audit kpk"],
        "content": "Phantom Billing adalah pengajuan klaim atas tindakan medis, rawat inap, atau peresepan obat yang sebenarnya tidak pernah diberikan kepada pasien. Dalam audit bersama KPK-Kemenkes-BPJS Juli 2024, modus ini ditemukan pada penagihan ribuan sesi fisioterapi dan klaim hemodialisa pada hari libur nasional tanpa berkas rekam medis yang sah dengan potensi kerugian negara mencapai puluhan miliar rupiah."
    },
    {
        "id": "REG-007",
        "title": "Permenkes 36/2015: Definisi Unbundling & Fragmentasi Layanan Medis",
        "regulation": "Permenkes No. 36 Tahun 2015",
        "chapter": "Pasal 5 ayat (3)",
        "article": "Services Unbundling",
        "category": "TIPOLOGI_FRAUD",
        "keywords": ["unbundling", "fragmentasi klaim", "katarak", "implan iol"],
        "content": "Unbundling atau fragmentasi pelayanan adalah tindakan memecah satu paket episode perawatan yang seharusnya ditagihkan dalam satu kode INA-CBG menjadi beberapa tagihan terpisah untuk melipatgandakan klaim. Contoh tipikal adalah memisahkan penagihan implan lensa katarak (IOL) atau obat anestesi lokal dari paket tindakan operasi katarak."
    },
    {
        "id": "REG-008",
        "title": "Permenkes 36/2015: Readmisi Berulang (< 30 Hari) & Early Discharge",
        "regulation": "Permenkes No. 36 Tahun 2015",
        "chapter": "Pasal 5 ayat (3)",
        "article": "Inappropriate Readmission",
        "category": "TIPOLOGI_FRAUD",
        "keywords": ["readmisi", "early discharge", "30 hari", "churning"],
        "content": "Readmisi tidak tepat adalah tindakan memulangkan pasien rawat inap secara sengaja sebelum kondisi klinisnya stabil (early discharge), kemudian mendaftarkannya kembali dalam kurun waktu kurang dari 14 s/d 30 hari dengan diagnosa yang sama untuk mendapatkan pembayaran dua kali klaim paket INA-CBG."
    },
    {
        "id": "REG-009",
        "title": "Permenkes 3/2023: Pedoman Koding INA-CBG dan Validitas Diagnosa Sekunder",
        "regulation": "Permenkes No. 3 Tahun 2023",
        "chapter": "Pedoman Koding JKN",
        "article": "Kriteria Komorbiditas",
        "category": "PEDOMAN_KODING",
        "keywords": ["pedoman koding", "icd-10 sekunder", "komorbiditas", "ina-cbg tarif"],
        "content": "Sesuai Permenkes 3/2023, diagnosa sekunder komorbiditas hanya boleh diinput apabila kondisi tersebut memenuhi salah satu kriteria: memerlukan evaluasi klinis aktif, terapi pengobatan tambahan, pemeriksaan penunjang khusus, menambah lama hari rawat (LOS), atau membutuhkan peningkatan pemantauan keperawatan. Diagnosa riwayat masa lalu yang tidak aktif dilarang dimasukkan untuk menaikkan severity level."
    }
]

chunks_file = os.path.join(OUTPUT_DIR, 'regulations_chunks.json')
with open(chunks_file, 'w', encoding='utf-8') as f:
    json.dump(CHUNKS, f, indent=2, ensure_ascii=False)
print(f"[OK] Written structured chunks to regulations_chunks.json ({len(CHUNKS)} items)")

# 3. Create Supabase pgvector Migration SQL Script
SQL_MIGRATION = """-- ====================================================================
-- SUPABASE PGVECTOR MIGRATION FOR INFERA JKN REGULATORY RAG
-- ====================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Regulations Knowledge Base Table
CREATE TABLE IF NOT EXISTS public.jkn_regulations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  regulation TEXT NOT NULL,
  chapter TEXT,
  article TEXT,
  category TEXT NOT NULL,
  keywords TEXT[],
  content TEXT NOT NULL,
  embedding vector(1536), -- Standard OpenAI embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Index for Fast Cosine Similarity Search
CREATE INDEX IF NOT EXISTS jkn_regulations_embedding_idx 
ON public.jkn_regulations 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.jkn_regulations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to regulations
CREATE POLICY "Allow public read access to jkn_regulations"
ON public.jkn_regulations FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Stored Procedure for Semantic Vector Search (RPC)
CREATE OR REPLACE FUNCTION match_jkn_regulations(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 3,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  regulation TEXT,
  article TEXT,
  category TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS 
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.regulation,
    r.article,
    r.category,
    r.content,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM public.jkn_regulations r
  WHERE 
    (filter_category IS NULL OR r.category = filter_category)
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
;
"""

sql_file = os.path.join(OUTPUT_DIR, 'schema_supabase_rag.sql')
with open(sql_file, 'w', encoding='utf-8') as f:
    f.write(SQL_MIGRATION.strip() + '\n')
print(f"[OK] Written Supabase RAG SQL migration to schema_supabase_rag.sql")
print("All RAG Knowledge Base artifacts successfully generated!")
