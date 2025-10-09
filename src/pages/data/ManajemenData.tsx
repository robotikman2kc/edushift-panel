import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { localDB } from "@/lib/localDB";
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
  users: number;
}

const ManajemenData = () => {
  const [stats, setStats] = useState<DataStats>({
    guru: 0,
    kelas: 0,
    mata_pelajaran: 0,
    siswa: 0,
    kehadiran: 0,
    jenis_kegiatan: 0,
    jurnal: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch data statistics
  const fetchStats = async () => {
    try {
      const usersData = JSON.parse(localStorage.getItem('users') || '[]');
      setStats({
        guru: localDB.select('guru').length,
        kelas: localDB.select('kelas').length,
        mata_pelajaran: localDB.select('mata_pelajaran').length,
        siswa: localDB.select('siswa').length,
        kehadiran: localDB.select('kehadiran').length,
        jenis_kegiatan: localDB.select('jenis_kegiatan').length,
        jurnal: localDB.select('jurnal').length,
        users: usersData.length
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
  const deleteAllData = async (tableName: 'guru' | 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal' | 'users', displayName: string) => {
    setDeleting(tableName);
    try {
      if (tableName === 'users') {
        // Clear users from localStorage
        localStorage.setItem('users', JSON.stringify([]));
      } else {
        const result = localDB.clear(tableName);
        if (result.error) {
          throw new Error(result.error);
        }
      }

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
      key: 'users' as const,
      title: 'Data User',
      description: 'Hapus semua data pengguna sistem',
      icon: Users,
      count: stats.users,
      color: 'purple'
    },
    {
      key: 'guru' as const,
      title: 'Data Guru',
      description: 'Hapus semua data guru yang terdaftar',
      icon: Users,
      count: stats.guru,
      color: 'blue'
    },
    {
      key: 'mata_pelajaran' as const,
      title: 'Data Mata Pelajaran',
      description: 'Hapus semua data mata pelajaran',
      icon: BookOpen,
      count: stats.mata_pelajaran,
      color: 'cyan'
    },
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
      key: 'jenis_kegiatan' as const,
      title: 'Data Jenis Kegiatan',
      description: 'Hapus semua jenis kegiatan',
      icon: Database,
      count: stats.jenis_kegiatan,
      color: 'teal'
    },
    {
      key: 'jurnal' as const,
      title: 'Data Jurnal Guru',
      description: 'Hapus semua jurnal yang dibuat guru',
      icon: FileText,
      count: stats.jurnal,
      color: 'indigo'
    },
    {
      key: 'kehadiran' as const,
      title: 'Data Kehadiran',
      description: 'Hapus semua record kehadiran siswa',
      icon: Calendar,
      count: stats.kehadiran,
      color: 'red'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
      blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
      cyan: 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800',
      green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
      teal: 'bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800',
      indigo: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',
      red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    };
    return colors[color as keyof typeof colors];
  };

  const getIconColor = (color: string) => {
    const colors = {
      purple: 'text-purple-600',
      blue: 'text-blue-600',
      cyan: 'text-cyan-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      teal: 'text-teal-600',
      indigo: 'text-indigo-600',
      red: 'text-red-600'
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

    </div>
  );
};

export default ManajemenData;