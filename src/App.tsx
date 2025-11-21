import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { schemaMigrations } from "@/lib/dataMigrations";
import { googleDriveBackup } from "@/lib/googleDriveBackup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

// Pengaturan Pages
import User from "./pages/pengaturan/User";
import Guru from "./pages/pengaturan/Guru";
import Kelas from "./pages/pengaturan/Kelas";
import Siswa from "./pages/pengaturan/Siswa";
import MataPelajaran from "./pages/pengaturan/MataPelajaran";
import JadwalPelajaran from "./pages/pengaturan/JadwalPelajaran";
import BobotPenilaian from "./pages/pengaturan/BobotPenilaian";

// Penilaian Pages
import InputNilai from "./pages/penilaian/InputNilai";
import RekapNilai from "./pages/penilaian/RekapNilai";

// Kehadiran Pages
import InputKehadiran from "./pages/kehadiran/InputKehadiran";
import RekapKehadiran from "./pages/kehadiran/RekapKehadiran";

// Data Pages
import ManajemenData from "./pages/data/ManajemenData";
import BackupRestore from "./pages/data/BackupRestore";
import BackupGoogleDrive from "./pages/data/BackupGoogleDrive";
import StorageMonitor from "./pages/data/StorageMonitor";

// Jurnal Pages
import JurnalGuru from "./pages/jurnal/JurnalGuru";
import AgendaMengajar from "./pages/jurnal/AgendaMengajar";

// Kalender Pages
import Kalender from "./pages/kalender/Kalender";

// Akun Pages
import Profil from "./pages/akun/Profil";
import Bantuan from "./pages/akun/Bantuan";
import FormatPDF from "./pages/pengaturan/FormatPDF";
import Notifikasi from "./pages/pengaturan/Notifikasi";

// Laporan Pages
import LaporanKehadiran from "./pages/laporan/LaporanKehadiran";
import LaporanPenilaian from "./pages/laporan/LaporanPenilaian";
import LaporanJurnalGuru from "./pages/laporan/LaporanJurnalGuru";

// Placeholder for other pages
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Run data migrations on app start
    const runMigrations = async () => {
      await schemaMigrations.runAllMigrations();
    };
    runMigrations();

    // Check and perform auto backup
    const checkAutoBackup = async () => {
      await googleDriveBackup.autoBackup();
    };
    checkAutoBackup();

    // Setup periodic backup check (every hour)
    const backupInterval = setInterval(() => {
      checkAutoBackup();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(backupInterval);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Pengaturan Routes */}
                  <Route path="/pengaturan/user" element={<User />} />
                  <Route path="/pengaturan/guru" element={<Guru />} />
                  <Route path="/pengaturan/kelas" element={<Kelas />} />
                  <Route path="/pengaturan/siswa" element={<Siswa />} />
                  <Route path="/pengaturan/mata-pelajaran" element={<MataPelajaran />} />
                  <Route path="/pengaturan/jadwal-pelajaran" element={<JadwalPelajaran />} />
                  <Route path="/pengaturan/bobot-penilaian" element={<BobotPenilaian />} />
                  <Route path="/pengaturan/format-pdf" element={<FormatPDF />} />
                  <Route path="/pengaturan/notifikasi" element={<Notifikasi />} />

                  {/* Penilaian Routes */}
                  <Route path="/penilaian/input-nilai" element={<InputNilai />} />
                  <Route path="/penilaian/rekap-nilai" element={<RekapNilai />} />

                  {/* Kehadiran Routes */}
                  <Route path="/kehadiran/input-kehadiran" element={<InputKehadiran />} />
                  <Route path="/kehadiran/rekap-kehadiran" element={<RekapKehadiran />} />
                  <Route 
                    path="/kehadiran/statistik-kehadiran" 
                    element={<PlaceholderPage title="Statistik Kehadiran" description="Lihat statistik kehadiran" />} 
                  />

                  {/* Jurnal Routes */}
                  <Route path="/jurnal/jurnal-guru" element={<JurnalGuru />} />
                  <Route path="/jurnal/agenda-mengajar" element={<AgendaMengajar />} />
                  <Route 
                    path="/jurnal/input-jurnal" 
                    element={<PlaceholderPage title="Input Jurnal" description="Input jurnal mengajar" />} 
                  />

                  {/* Kalender Route */}
                  <Route path="/kalender" element={<Kalender />} />

                  {/* Data Routes */}
                  <Route path="/data/manajemen-data" element={<ManajemenData />} />
                  <Route path="/data/backup-restore" element={<BackupRestore />} />
                  <Route path="/data/backup-google-drive" element={<BackupGoogleDrive />} />
                  <Route path="/data/storage-monitor" element={<StorageMonitor />} />

                  {/* Laporan Routes */}
                  <Route path="/laporan/kehadiran" element={<LaporanKehadiran />} />
                  <Route path="/laporan/penilaian" element={<LaporanPenilaian />} />
                  <Route path="/laporan/jurnal-guru" element={<LaporanJurnalGuru />} />

                  {/* Akun Routes */}
                  <Route path="/akun/profil" element={<Profil />} />
                  <Route path="/akun/bantuan" element={<Bantuan />} />

                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DashboardLayout>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
