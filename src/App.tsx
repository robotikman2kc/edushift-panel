import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Index from "./pages/Index";

// Pengaturan Pages
import User from "./pages/pengaturan/User";
import Guru from "./pages/pengaturan/Guru";
import Kelas from "./pages/pengaturan/Kelas";
import Siswa from "./pages/pengaturan/Siswa";
import MataPelajaran from "./pages/pengaturan/MataPelajaran";

// Penilaian Pages
import InputNilai from "./pages/penilaian/InputNilai";

// Kehadiran Pages
import InputKehadiran from "./pages/kehadiran/InputKehadiran";
import RekapKehadiran from "./pages/kehadiran/RekapKehadiran";

// Data Pages
import BackupRestore from "./pages/data/BackupRestore";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
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
                    <Route 
                      path="/pengaturan/kategori-penilaian" 
                      element={<PlaceholderPage title="Kategori Penilaian" description="Kelola kategori penilaian" />} 
                    />
                    <Route 
                      path="/pengaturan/bobot-penilaian" 
                      element={<PlaceholderPage title="Bobot Penilaian" description="Kelola bobot penilaian" />} 
                    />

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
                    <Route 
                      path="/jurnal/jurnal-guru" 
                      element={<PlaceholderPage title="Jurnal Guru" description="Lihat jurnal mengajar guru" />} 
                    />
                    <Route 
                      path="/jurnal/input-jurnal" 
                      element={<PlaceholderPage title="Input Jurnal" description="Input jurnal mengajar" />} 
                    />

                    {/* Data Routes */}
                    <Route 
                      path="/data/manajemen-data" 
                      element={<PlaceholderPage title="Manajemen Data" description="Kelola data sistem" />} 
                    />
                    <Route 
                      path="/data/backup-restore" 
                      element={<BackupRestore />} 
                    />

                    {/* Akun Routes */}
                    <Route 
                      path="/akun/profil" 
                      element={<PlaceholderPage title="Profil" description="Kelola profil pengguna" />} 
                    />
                    <Route 
                      path="/akun/bantuan" 
                      element={<PlaceholderPage title="Bantuan" description="Panduan penggunaan sistem" />} 
                    />

                    {/* Catch all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
