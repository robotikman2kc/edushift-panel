import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  BookOpen, 
  UserCheck, 
  Calendar, 
  BarChart3, 
  Database,
  FileText,
  HelpCircle,
  Mail,
  Phone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Bantuan = () => {
  const features = [
    {
      icon: UserCheck,
      title: "Kehadiran",
      description: "Input dan rekap kehadiran siswa per kelas dan mata pelajaran",
    },
    {
      icon: BarChart3,
      title: "Penilaian",
      description: "Input nilai dan rekap nilai siswa dengan berbagai kategori penilaian",
    },
    {
      icon: Calendar,
      title: "Kalender",
      description: "Lihat agenda harian, kehadiran, dan aktivitas dalam kalender interaktif",
    },
    {
      icon: FileText,
      title: "Jurnal",
      description: "Catat agenda mengajar dan jurnal kegiatan guru",
    },
    {
      icon: Database,
      title: "Manajemen Data",
      description: "Kelola data guru, siswa, kelas, mata pelajaran, dan pengaturan sistem",
    },
  ];

  const faqItems = [
    {
      question: "Bagaimana cara menginput kehadiran siswa?",
      answer: "Buka menu Kehadiran > Input Kehadiran. Pilih tingkat, kelas, dan mata pelajaran. Pilih tanggal, lalu tandai status kehadiran setiap siswa (Hadir, Sakit, Izin, atau Alpha). Anda juga dapat menandai keaktifan siswa. Klik 'Simpan Kehadiran' setelah selesai.",
    },
    {
      question: "Bagaimana cara menambahkan nilai siswa?",
      answer: "Masuk ke menu Penilaian > Input Nilai. Pilih kelas, mata pelajaran, dan kategori penilaian (misalnya Tugas, UTS, UAS). Masukkan nilai untuk setiap siswa dan klik 'Simpan Nilai'.",
    },
    {
      question: "Bagaimana melihat rekap kehadiran atau nilai?",
      answer: "Untuk rekap kehadiran, buka menu Kehadiran > Rekap Kehadiran. Untuk rekap nilai, buka menu Penilaian > Rekap Nilai. Pilih filter yang diinginkan (kelas, mata pelajaran, periode). Anda dapat mengekspor data ke PDF atau Excel.",
    },
    {
      question: "Apakah filter yang saya pilih akan tersimpan?",
      answer: "Ya, sistem akan menyimpan pilihan filter terakhir Anda di halaman Input Kehadiran, Rekap Kehadiran, dan Rekap Nilai. Sehingga saat Anda kembali ke halaman tersebut, filter akan tetap sama.",
    },
    {
      question: "Bagaimana cara menambahkan siswa atau kelas baru?",
      answer: "Buka menu Pengaturan, pilih 'Siswa' untuk menambah siswa baru atau 'Kelas' untuk menambah kelas baru. Klik tombol 'Tambah' dan isi formulir yang tersedia.",
    },
    {
      question: "Bagaimana cara mengatur bobot penilaian?",
      answer: "Masuk ke menu Pengaturan > Bobot Penilaian. Pilih tingkat kelas, lalu atur bobot untuk setiap kategori penilaian (misalnya Tugas 30%, UTS 35%, UAS 35%).",
    },
    {
      question: "Bagaimana cara membuat agenda mengajar?",
      answer: "Buka menu Jurnal > Agenda Mengajar. Klik 'Tambah Agenda', pilih tanggal, kelas, mata pelajaran, isi materi dan keterangan. Anda juga bisa langsung ke agenda mengajar dari halaman Input Kehadiran dengan klik tombol 'Buka Agenda Mengajar'.",
    },
    {
      question: "Bagaimana cara backup data?",
      answer: "Pergi ke menu Data > Backup dan Restore. Klik 'Backup Data' untuk mengunduh semua data dalam format JSON. Simpan file backup di tempat yang aman.",
    },
    {
      question: "Apakah data saya aman?",
      answer: "Semua data tersimpan secara lokal di browser Anda menggunakan IndexedDB. Data tidak dikirim ke server eksternal. Pastikan untuk melakukan backup data secara berkala.",
    },
    {
      question: "Bagaimana cara mengubah format PDF laporan?",
      answer: "Buka menu Pengaturan > Format PDF. Anda dapat mengatur informasi sekolah, guru default, dan format tampilan untuk laporan kehadiran, nilai, dan jurnal.",
    },
  ];

  const quickTips = [
    "Gunakan fitur 'Jadwal Hari Ini' di Input Kehadiran untuk mengisi presensi lebih cepat",
    "Manfaatkan tombol 'Semua Hadir' untuk mengisi kehadiran secara massal",
    "Export data ke Excel untuk analisis lebih lanjut menggunakan spreadsheet",
    "Lihat statistik harian di sidebar Input Kehadiran untuk monitoring cepat",
    "Gunakan kalender untuk melihat pola kehadiran dan agenda dalam bentuk visual",
    "Filter yang tersimpan otomatis akan mempercepat pekerjaan berulang",
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bantuan & Panduan" 
        description="Panduan lengkap penggunaan Sistem Informasi Akademik"
      />

      {/* Fitur Utama */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Fitur Utama Sistem
          </CardTitle>
          <CardDescription>
            Kenali berbagai fitur yang tersedia di sistem ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
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
            Pertanyaan yang Sering Diajukan (FAQ)
          </CardTitle>
          <CardDescription>
            Temukan jawaban untuk pertanyaan umum tentang sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Tips Cepat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Tips & Trik
          </CardTitle>
          <CardDescription>
            Tips untuk menggunakan sistem dengan lebih efisien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
              >
                <Badge variant="outline" className="mt-0.5 shrink-0">
                  {index + 1}
                </Badge>
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dukungan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Butuh Bantuan Lebih Lanjut?
          </CardTitle>
          <CardDescription>
            Hubungi tim dukungan kami untuk bantuan teknis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  support@sistem-akademik.com
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Telepon</p>
                <p className="text-sm text-muted-foreground">
                  (021) 123-4567 (Senin - Jumat, 08:00 - 17:00)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Versi Sistem */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Sistem Informasi Akademik v1.0.0</p>
            <p className="mt-1">© 2024 - Dikembangkan dengan ❤️ untuk pendidikan Indonesia</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bantuan;
