import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider } from "@/hooks/useAuth";
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

// Kehadiran Pages
import InputKehadiran from "./pages/kehadiran/InputKehadiran";
import RekapKehadiran from "./pages/kehadiran/RekapKehadiran";

// Data Pages
import ManajemenData from "./pages/data/ManajemenData";
import BackupRestore from "./pages/data/BackupRestore";

// Jurnal Pages
import JurnalGuru from "./pages/jurnal/JurnalGuru";
import AgendaMengajar from "./pages/jurnal/AgendaMengajar";

// Akun Pages
import Profil from "./pages/akun/Profil";
import FormatPDF from "./pages/pengaturan/FormatPDF";
import Notifikasi from "./pages/pengaturan/Notifikasi";

// Placeholder for other pages
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
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
                  <Route 
                    path="/penilaian/rekap-nilai" 
                    element={<PlaceholderPage title="Rekap Nilai" description="Lihat rekap nilai siswa" />} 
                  />

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

                  {/* Data Routes */}
                  <Route path="/data/manajemen-data" element={<ManajemenData />} />
                  <Route path="/data/backup-restore" element={<BackupRestore />} />

                  {/* Akun Routes */}
                  <Route path="/akun/profil" element={<Profil />} />
                  <Route 
                    path="/akun/bantuan" 
                    element={<PlaceholderPage title="Bantuan" description="Panduan penggunaan sistem" />} 
                  />

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

export default App;
