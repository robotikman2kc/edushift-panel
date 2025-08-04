import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, AlertTriangle, Users, BookOpen, GraduationCap, School, Calendar, FileText, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/common/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface DataStats {
  guru: number;
  kelas: number;
  mata_pelajaran: number;
  siswa: number;
  kehadiran: number;
  jenis_kegiatan: number;
  jurnal: number;
}

const ManajemenData = () => {
  const [stats, setStats] = useState<DataStats>({
    guru: 0,
    kelas: 0,
    mata_pelajaran: 0,
    siswa: 0,
    kehadiran: 0,
    jenis_kegiatan: 0,
    jurnal: 0
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch data statistics
  const fetchStats = async () => {
    try {
      const [guruRes, kelasRes, matpelRes, siswaRes, kehadiranRes, jenisKegiatanRes, jurnalRes] = await Promise.all([
        supabase.from('guru').select('id', { count: 'exact', head: true }),
        supabase.from('kelas').select('id', { count: 'exact', head: true }),
        supabase.from('mata_pelajaran').select('id', { count: 'exact', head: true }),
        supabase.from('siswa').select('id', { count: 'exact', head: true }),
        supabase.from('kehadiran').select('id', { count: 'exact', head: true }),
        supabase.from('jenis_kegiatan').select('id', { count: 'exact', head: true }),
        supabase.from('jurnal').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        guru: guruRes.count || 0,
        kelas: kelasRes.count || 0,
        mata_pelajaran: matpelRes.count || 0,
        siswa: siswaRes.count || 0,
        kehadiran: kehadiranRes.count || 0,
        jenis_kegiatan: jenisKegiatanRes.count || 0,
        jurnal: jurnalRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Delete all data from a table
  const deleteAllData = async (tableName: 'guru' | 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal', displayName: string) => {
    setDeleting(tableName);
    try {
      const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      toast({
        title: "Berhasil Dihapus",
        description: `Semua ${displayName} berhasil dihapus`
      });

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: `Gagal menghapus semua ${displayName}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const dataTypes = [
    {
      key: 'kelas' as const,
      title: 'Data Kelas',
      description: 'Hapus semua data kelas yang terdaftar',
      icon: School,
      count: stats.kelas,
      color: 'green'
    },
    {
      key: 'siswa' as const,
      title: 'Daftar Siswa', 
      description: 'Hapus semua data siswa di seluruh kelas',
      icon: GraduationCap,
      count: stats.siswa,
      color: 'orange'
    },
    {
      key: 'kehadiran' as const,
      title: 'Data Kehadiran',
      description: 'Hapus semua record kehadiran siswa',
      icon: Calendar,
      count: stats.kehadiran,
      color: 'red'
    },
    {
      key: 'jurnal' as const,
      title: 'Data Jurnal Guru',
      description: 'Hapus semua jurnal yang dibuat guru',
      icon: FileText,
      count: stats.jurnal,
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
      red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
      indigo: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800'
    };
    return colors[color as keyof typeof colors];
  };

  const getIconColor = (color: string) => {
    const colors = {
      green: 'text-green-600',
      orange: 'text-orange-600', 
      red: 'text-red-600',
      indigo: 'text-indigo-600'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Data" 
        description="Kelola dan hapus data sistem secara massal"
      />

      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Peringatan:</strong> Fitur ini akan menghapus SEMUA data pada kategori yang dipilih. 
          Tindakan ini tidak dapat dibatalkan. Pastikan untuk melakukan backup terlebih dahulu.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {dataTypes.map((dataType) => {
          const Icon = dataType.icon;
          const isDeleting = deleting === dataType.key;
          
          return (
            <Card key={dataType.key} className={`border-2 ${getColorClasses(dataType.color)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${getIconColor(dataType.color)}`} />
                  {dataType.title}
                </CardTitle>
                <CardDescription>
                  {dataType.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    {loading ? (
                      <div className="h-8 bg-muted animate-pulse rounded" />
                    ) : (
                      <>
                        <p className={`text-3xl font-bold ${getIconColor(dataType.color)}`}>
                          {dataType.count}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total record tersimpan
                        </p>
                      </>
                    )}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        disabled={isDeleting || dataType.count === 0}
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Semua Data
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Konfirmasi Penghapusan
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>
                            Anda akan menghapus <strong>SEMUA {dataType.count} record</strong> dari {dataType.title}.
                          </p>
                          <p className="text-destructive font-medium">
                            Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data secara permanen.
                          </p>
                          <p>
                            Apakah Anda yakin ingin melanjutkan?
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteAllData(dataType.key, dataType.title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ya, Hapus Semua
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Database className="h-5 w-5" />
            Data Lainnya
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Data berikut dikelola melalui menu pengaturan dan tidak dapat dihapus massal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg text-center">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Data Guru</p>
              <p className="text-lg font-bold text-blue-600">{stats.guru}</p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg text-center">
              <BookOpen className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Mata Pelajaran</p>
              <p className="text-lg font-bold text-blue-600">{stats.mata_pelajaran}</p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg text-center">
              <Database className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Jenis Kegiatan</p>
              <p className="text-lg font-bold text-blue-600">{stats.jenis_kegiatan}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManajemenData;