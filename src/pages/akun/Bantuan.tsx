import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  UserCheck, 
  Calendar, 
  BarChart3, 
  Database,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  Code,
  Save,
  Search,
  Lightbulb,
  GraduationCap,
  Shield,
  Zap,
  Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Bantuan = () => {
  const { toast } = useToast();
  const [developerNotes, setDeveloperNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const savedNotes = localStorage.getItem("developer_notes") || "";
    setDeveloperNotes(savedNotes);
  }, []);

  const handleSaveNotes = () => {
    localStorage.setItem("developer_notes", developerNotes);
    toast({
      title: "Catatan Tersimpan",
      description: "Catatan pengembang berhasil disimpan",
    });
  };

  const features = [
    {
      icon: UserCheck,
      title: "Kehadiran Siswa",
      description: "Input dan rekap kehadiran siswa per kelas dan mata pelajaran dengan fitur massal",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      icon: BarChart3,
      title: "Penilaian",
      description: "Sistem penilaian lengkap dengan bobot, kategori, dan analisis otomatis",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      icon: Calendar,
      title: "Kalender Akademik",
      description: "Kalender interaktif dengan agenda, libur nasional, dan periode non-pembelajaran",
      color: "bg-green-500/10 text-green-600 dark:text-green-400"
    },
    {
      icon: FileText,
      title: "Jurnal Mengajar",
      description: "Catat dan kelola jurnal mengajar dengan detail materi dan kegiatan",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
    },
    {
      icon: GraduationCap,
      title: "Ekstrakurikuler",
      description: "Kelola kegiatan eskul, anggota, kehadiran, dan penilaian eskul",
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400"
    },
    {
      icon: Database,
      title: "Manajemen Data",
      description: "Kelola master data guru, siswa, kelas, jadwal, dan backup/restore",
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
    },
  ];

  const faqItems = [
    {
      category: "Kehadiran",
      question: "Bagaimana cara menginput kehadiran siswa?",
      answer: "Buka menu Kehadiran > Input Kehadiran. Pilih tingkat, kelas, dan mata pelajaran. Pilih tanggal, lalu tandai status kehadiran setiap siswa (Hadir, Sakit, Izin, atau Alpha). Gunakan tombol 'Semua Hadir' untuk efisiensi. Klik 'Simpan Kehadiran' setelah selesai.",
    },
    {
      category: "Kehadiran",
      question: "Apa itu fitur 'Jadwal Hari Ini' di Input Kehadiran?",
      answer: "Fitur ini menampilkan jadwal pelajaran Anda hari ini berdasarkan data di menu Pengaturan > Jadwal Pelajaran. Klik pada jadwal untuk langsung mengisi kehadiran kelas tersebut tanpa perlu memilih filter manual.",
    },
    {
      category: "Penilaian",
      question: "Bagaimana cara menambahkan nilai siswa?",
      answer: "Masuk ke menu Penilaian > Input Nilai. Pilih kelas, mata pelajaran, dan kategori penilaian (misalnya Tugas, UTS, UAS). Masukkan nilai untuk setiap siswa dan klik 'Simpan Nilai'. Sistem akan otomatis menghitung nilai akhir berdasarkan bobot.",
    },
    {
      category: "Penilaian",
      question: "Bagaimana cara mengatur bobot penilaian?",
      answer: "Masuk ke Pengaturan > Bobot Penilaian. Pilih tingkat kelas, lalu atur bobot untuk setiap kategori (misal Tugas 30%, UTS 35%, UAS 35%). Pastikan total bobot = 100%. Bobot akan otomatis diterapkan saat menghitung nilai akhir siswa.",
    },
    {
      category: "Laporan",
      question: "Bagaimana melihat dan mengekspor rekap data?",
      answer: "Untuk rekap kehadiran: buka Kehadiran > Rekap Kehadiran. Untuk rekap nilai: buka Penilaian > Rekap Nilai. Untuk laporan: buka menu Laporan. Pilih filter yang diinginkan, lalu klik tombol Export PDF atau Excel sesuai kebutuhan.",
    },
    {
      category: "Jurnal",
      question: "Bagaimana cara membuat agenda mengajar?",
      answer: "Buka Jurnal > Agenda Mengajar atau Jurnal Guru. Klik 'Tambah Agenda', pilih tanggal, kelas, mata pelajaran, isi materi pembelajaran dan keterangan. Anda juga bisa langsung membuat agenda dari halaman Input Kehadiran dengan klik 'Buka Agenda Mengajar'.",
    },
    {
      category: "Ekstrakurikuler",
      question: "Bagaimana mengelola data ekstrakurikuler?",
      answer: "Buka menu Ekstrakurikuler > Kelola Ekstrakurikuler untuk membuat eskul baru. Lalu ke Kelola Anggota untuk menambah siswa. Gunakan Kehadiran Eskul untuk presensi dan Input Nilai Eskul untuk penilaian anggota.",
    },
    {
      category: "Kalender",
      question: "Fitur apa saja yang ada di Kalender?",
      answer: "Kalender menampilkan: (1) Hari libur nasional otomatis, (2) Catatan pribadi per tanggal, (3) Periode non-pembelajaran (libur semester/ujian), (4) Indikator kehadiran dan jurnal harian. Klik tanggal untuk melihat detail atau menambah catatan.",
    },
    {
      category: "Data",
      question: "Bagaimana cara menambahkan siswa atau kelas baru?",
      answer: "Buka menu Pengaturan, pilih 'Siswa' untuk menambah siswa baru atau 'Kelas' untuk kelas baru. Klik tombol 'Tambah Data' dan isi formulir. Data siswa dan kelas harus diisi terlebih dahulu sebelum input kehadiran atau nilai.",
    },
    {
      category: "Data",
      question: "Bagaimana cara backup dan restore data?",
      answer: "Pergi ke Data > Backup dan Restore. Klik 'Backup Data' untuk download semua data (format JSON). Simpan file di tempat aman. Untuk restore, klik 'Restore Data' dan pilih file backup JSON yang telah disimpan sebelumnya.",
    },
    {
      category: "Data",
      question: "Apakah data saya aman? Apakah tersimpan di cloud?",
      answer: "Semua data tersimpan secara lokal di browser Anda menggunakan IndexedDB dan OPFS. Data TIDAK dikirim ke server eksternal atau cloud. Ini menjamin privasi penuh, namun Anda harus rutin backup data untuk menghindari kehilangan data.",
    },
    {
      category: "Pengaturan",
      question: "Bagaimana cara mengubah format PDF laporan?",
      answer: "Buka Pengaturan > Format PDF. Atur informasi sekolah (nama, alamat, logo), data guru default, dan format tampilan untuk berbagai jenis laporan (kehadiran, nilai, jurnal). Perubahan akan langsung diterapkan saat generate PDF.",
    },
    {
      category: "Pengaturan",
      question: "Apakah filter yang saya pilih akan tersimpan?",
      answer: "Ya, sistem menyimpan filter terakhir di halaman Input Kehadiran, Rekap Kehadiran, Input Nilai, dan Rekap Nilai. Saat kembali ke halaman tersebut, filter akan otomatis terisi sesuai pilihan terakhir untuk mempercepat pekerjaan berulang.",
    },
  ];

  const quickTips = [
    {
      icon: Zap,
      title: "Jadwal Hari Ini",
      tip: "Gunakan fitur 'Jadwal Hari Ini' di Input Kehadiran untuk mengisi presensi lebih cepat tanpa memilih filter manual"
    },
    {
      icon: Zap,
      title: "Semua Hadir",
      tip: "Manfaatkan tombol 'Semua Hadir' untuk mengisi kehadiran secara massal, lalu edit yang tidak hadir"
    },
    {
      icon: FileText,
      title: "Export Data",
      tip: "Export rekap ke Excel untuk analisis lebih lanjut atau PDF untuk dokumentasi formal"
    },
    {
      icon: BarChart3,
      title: "Statistik Real-time",
      tip: "Lihat statistik harian di sidebar Input Kehadiran untuk monitoring performa kelas secara cepat"
    },
    {
      icon: Calendar,
      title: "Visualisasi Kalender",
      tip: "Gunakan halaman Kalender untuk melihat pola kehadiran, agenda, dan aktivitas dalam bentuk visual yang mudah dipahami"
    },
    {
      icon: Save,
      title: "Filter Otomatis",
      tip: "Filter yang Anda pilih akan otomatis tersimpan dan mempercepat pekerjaan berulang di hari berikutnya"
    },
    {
      icon: Shield,
      title: "Backup Rutin",
      tip: "Lakukan backup data minimal 1 minggu sekali ke Google Drive atau perangkat lokal untuk keamanan data"
    },
    {
      icon: Award,
      title: "Analisis Nilai",
      tip: "Gunakan halaman Rekap Nilai untuk melihat ranking siswa dan analisis performa per kategori penilaian"
    },
  ];

  const tutorials = [
    {
      title: "Tutorial Input Kehadiran Cepat",
      steps: [
        "Buka menu Kehadiran > Input Kehadiran",
        "Klik salah satu kartu di bagian 'Jadwal Hari Ini' (jika tersedia)",
        "Atau pilih manual: Tingkat > Kelas > Mata Pelajaran > Tanggal",
        "Klik tombol 'Semua Hadir' untuk mengisi semua siswa sebagai hadir",
        "Edit status siswa yang tidak hadir (Sakit/Izin/Alpha)",
        "Tambahkan catatan jika diperlukan",
        "Klik 'Simpan Kehadiran'"
      ]
    },
    {
      title: "Tutorial Input Nilai dan Lihat Ranking",
      steps: [
        "Buka menu Penilaian > Input Nilai",
        "Pilih Kelas dan Mata Pelajaran",
        "Pilih Kategori Penilaian (Tugas/UTS/UAS/dll)",
        "Masukkan nilai untuk setiap siswa",
        "Klik 'Simpan Nilai'",
        "Untuk melihat ranking, buka Penilaian > Rekap Nilai",
        "Pilih filter yang sama, sistem akan otomatis mengurutkan dan menampilkan ranking"
      ]
    },
    {
      title: "Tutorial Backup dan Restore Data",
      steps: [
        "Buka menu Data > Backup dan Restore",
        "Klik tombol 'Backup Data'",
        "File JSON akan otomatis terunduh ke perangkat Anda",
        "Simpan file di folder yang aman (misal: Google Drive, OneDrive)",
        "Untuk restore: klik 'Restore Data', pilih file backup JSON",
        "Konfirmasi restore dan tunggu proses selesai",
        "Data akan kembali seperti saat backup dibuat"
      ]
    },
    {
      title: "Tutorial Membuat Laporan PDF",
      steps: [
        "Buka menu Laporan sesuai jenis yang diinginkan",
        "Pilih filter (Kelas, Mata Pelajaran, Periode, dll)",
        "Klik tombol 'Preview PDF' untuk melihat hasil",
        "Jika sudah sesuai, klik 'Download PDF'",
        "PDF akan tersimpan dan siap untuk dicetak atau dibagikan",
        "Anda dapat mengatur format PDF di menu Pengaturan > Format PDF"
      ]
    },
  ];

  const troubleshooting = [
    {
      problem: "Data hilang setelah browser ditutup",
      solution: "Data tersimpan di IndexedDB browser. Pastikan Anda tidak menghapus cache/data browser. Lakukan backup rutin ke file JSON atau Google Drive untuk keamanan."
    },
    {
      problem: "Tidak bisa menyimpan data",
      solution: "Periksa kapasitas storage browser. Buka Data > Monitor Storage untuk melihat penggunaan. Jika penuh, hapus data tahun ajaran lama atau lakukan cleanup storage."
    },
    {
      problem: "Filter tidak tersimpan",
      solution: "Pastikan browser mengizinkan localStorage. Cek pengaturan privasi browser Anda. Jika menggunakan mode incognito/private, filter tidak akan tersimpan."
    },
    {
      problem: "PDF tidak bisa diunduh",
      solution: "Pastikan browser mengizinkan download otomatis. Cek popup blocker dan pengaturan download di browser Anda."
    },
    {
      problem: "Foto profil berkedip atau tidak muncul",
      solution: "Foto tersimpan di OPFS (Origin Private File System). Coba upload ulang foto dengan ukuran lebih kecil (max 2MB). Gunakan format JPG atau PNG."
    },
    {
      problem: "Jadwal Hari Ini tidak muncul",
      solution: "Pastikan Anda sudah mengisi data di menu Pengaturan > Jadwal Pelajaran. Jadwal harus sesuai dengan hari yang sedang aktif."
    },
  ];

  // Filter FAQ berdasarkan search query
  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bantuan & Panduan" 
        description="Pusat bantuan lengkap untuk Sistem Informasi Akademik"
      />

      {/* Hero Section */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <HelpCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Selamat Datang di Pusat Bantuan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Temukan panduan lengkap, tutorial step-by-step, dan solusi untuk setiap pertanyaan Anda tentang sistem
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari bantuan... (contoh: cara input kehadiran, backup data, dll)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="faq" className="flex flex-col gap-1 py-2">
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="tutorial" className="flex flex-col gap-1 py-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs">Tutorial</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex flex-col gap-1 py-2">
            <Lightbulb className="h-4 w-4" />
            <span className="text-xs">Tips</span>
          </TabsTrigger>
          <TabsTrigger value="troubleshoot" className="flex flex-col gap-1 py-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs">Troubleshoot</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          {/* Fitur Utama */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Fitur Utama Sistem
              </CardTitle>
              <CardDescription>
                Kenali berbagai fitur powerful yang tersedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Pertanyaan yang Sering Diajukan
              </CardTitle>
              <CardDescription>
                {searchQuery 
                  ? `Ditemukan ${filteredFAQ.length} pertanyaan yang sesuai dengan pencarian "${searchQuery}"`
                  : "Temukan jawaban untuk pertanyaan umum tentang sistem"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFAQ.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQ.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="shrink-0 mt-0.5">
                            {item.category}
                          </Badge>
                          <span>{item.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada hasil untuk "{searchQuery}"</p>
                  <p className="text-sm mt-1">Coba kata kunci lain atau hubungi dukungan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutorial Tab */}
        <TabsContent value="tutorial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tutorial Step-by-Step
              </CardTitle>
              <CardDescription>
                Panduan lengkap penggunaan fitur-fitur utama sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {tutorials.map((tutorial, idx) => (
                  <div key={idx} className="p-5 rounded-lg border bg-gradient-to-br from-card to-muted/20">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{idx + 1}</span>
                      </div>
                      {tutorial.title}
                    </h3>
                    <div className="space-y-2.5 pl-10">
                      {tutorial.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-3 text-sm">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-medium text-primary">{stepIdx + 1}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Tips & Trik Produktivitas
              </CardTitle>
              <CardDescription>
                Gunakan sistem dengan lebih efisien dan maksimal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickTips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-br from-card to-accent/5 hover:shadow-md transition-all"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <tip.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Troubleshooting Tab */}
        <TabsContent value="troubleshoot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Troubleshooting & Solusi
              </CardTitle>
              <CardDescription>
                Solusi untuk masalah umum yang mungkin Anda temui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {troubleshooting.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                        <HelpCircle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-destructive">{item.problem}</h4>
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded bg-green-500/10 shrink-0 mt-0.5">
                            <Zap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.solution}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Catatan Pengembang */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Catatan Pengembang
          </CardTitle>
          <CardDescription>
            Catat bug, saran fitur, atau masukan untuk pengembangan sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Tuliskan catatan Anda di sini... (misal: bug yang ditemukan, saran fitur baru, masukan UX/UI, dll)"
            value={developerNotes}
            onChange={(e) => setDeveloperNotes(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={handleSaveNotes} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Simpan Catatan
          </Button>
        </CardContent>
      </Card>

      {/* Dukungan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Butuh Bantuan Lebih Lanjut?
          </CardTitle>
          <CardDescription>
            Hubungi tim dukungan untuk bantuan teknis dan konsultasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-card to-blue-500/5 hover:shadow-md transition-all">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">
                  annasjatiabdillah@gmail.com
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-card to-green-500/5 hover:shadow-md transition-all">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold">WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  +62 877-3377-4277
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Versi Sistem */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <div className="p-2 rounded-full bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-lg">Sistem Informasi Akademik</p>
            <Badge variant="outline" className="text-xs">Version 1.0.0</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              © 2025 - Dikembangkan dengan ❤️ untuk pendidikan Indonesia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bantuan;
