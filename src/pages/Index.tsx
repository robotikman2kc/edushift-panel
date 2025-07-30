import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-foreground">
          Selamat Datang di Sistem Manajemen Sekolah
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Platform terpadu untuk mengelola data siswa, guru, nilai, kehadiran, dan administrasi sekolah dengan mudah dan efisien.
        </p>
        {user && (
          <p className="text-lg text-primary font-medium">
            Halo, {user.email?.split('@')[0]}! Selamat datang kembali.
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Manajemen Data</h3>
            <p className="text-muted-foreground">Kelola data siswa, guru, dan kelas dengan sistem yang terintegrasi</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Penilaian</h3>
            <p className="text-muted-foreground">Input dan kelola nilai UTS, UAS, dan penilaian harian</p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Kehadiran</h3>
            <p className="text-muted-foreground">Catat dan monitor kehadiran siswa secara real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
