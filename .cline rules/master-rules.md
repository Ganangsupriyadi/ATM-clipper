# Master Agent Rules & Engineering Standards

Aturan ini dikumpulkan dari standar industri agen AI, *design taste*, prinsip YAGNI (Ponytail), token-efficiency (Caveman), serta *anti-slop* filter untuk memastikan kode dan UI yang dihasilkan bersih, tidak generik, dan efisien.

---

## 1. Anti-Slop & UI Design Taste (Anti-AI Cliché)
- **Zero Emojis:** DILARANG KERAS menggunakan emoji di dalam kode, markup, teks UI, atau alt-teks. Gunakan ikon murni (Radix/Phosphor SVG) jika diperlukan.
- **Batasan Warna & Efek:** Maksimal 1 warna aksen dengan saturasi di bawah 80%. **TIDAK BOLEH** ada gradien ungu/biru neon AI (*Lila ban*), *box-shadow glow* berlebihan, atau sudut lengkung (*border-radius*) yang acak-acakan tanpa hierarki.
- **Tipografi Bersih:** Jangan gunakan font *Inter* atau *Serif* untuk Dashboard/Software UI. Gunakan *Geist*, *Satoshi*, atau *Cabinet Grotesk*. Hindari penekanan kata tunggal secara norak atau *all-caps* berlebih pada label.
- **Layout Profesional:** Hindari layout simetris membosankan secara membabi buta. Gunakan CSS Grid (`grid-cols-1 md:grid-cols-3`) ketimbang *flexbox percentage math* yang rapuh. Jangan pernah menggunakan `h-screen` pada Hero section (gunakan `min-h-[100svh]`).
- **State Interaktif Wajib:** Selalu sediakan *Loading state* (skeleton), *Empty state*, dan *Error state* yang fungsional, bukan sekadar *spinner* lingkaran kosong standar.

---

## 2. Token & Response Efficiency (Caveman Style)
- **To the Point:** Berikan jawaban atau penjelasan teknis dengan ringkas dan to the point tanpa basa-basi pembuka (*no greeting, no "let me check", no recap*). 
- **Pertahankan Blok Kode:** Jangan pernah meringkas atau mengubah struktur kode, path, *command*, atau pesan *error* secara sembarangan (*payload verbatim*).

---

## 3. Engineering & YAGNI Principle (Ponytail Standard)
- **Tulis Kode yang Dibutuhkan Saja:** Pikirkan kode seperti senior developer yang malas menulis kode berlebih. Jangan menambahkan *boilerplate*, lapisan abstraksi (*wrapper* berlebih), atau *dependency* baru jika platform bawaan atau *standard library* sudah bisa melakukannya.
- **Validasi & Keamanan:** Meskipun ringkas, **TIDAK BOLEH** mengorbankan validasi batas kepercayaan (*trust-boundary*), penanganan error data, keamanan, atau aksesibilitas.
- **Setiap Logika Kritis Harus Diuji:** Logika yang melibatkan *branch*, *loop*, *parser*, keuangan, atau keamanan **wajib** menyertakan setidaknya satu unit test sederhana.

---

## 4. Micro-Interactions & Motion Design
- **Hemat Animasi:** Gunakan animasi atau transisi hanya saat mengonfirmasi aksi pengguna (bukan efek acak yang memenuhi setiap elemen).
- **Performa Kompositor:** Jangan pernah menganimasikan properti layout (`top`, `left`, `width`, `height`). Gunakan secara eksklusif properti performa tinggi seperti `transform` dan `opacity`.