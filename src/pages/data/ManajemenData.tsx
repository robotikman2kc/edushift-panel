import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { Trash2, AlertTriangle, Users, BookOpen, GraduationCap, School, Calendar, FileText, Database, Trash } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/common/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DeleteYearDataDialog } from "@/components/data/DeleteYearDataDialog";
import { getAllTahunAjaran } from "@/lib/academicYearUtils";

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
  const [deleteYearDialogOpen, setDeleteYearDialogOpen] = useState(false);
  const [selectedYearStats, setSelectedYearStats] = useState<any>(null);
  const [yearDataStats, setYearDataStats] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch data statistics
  const fetchStats = async () => {
    try {
      const usersData = JSON.parse(localStorage.getItem('users') || '[]');
      const guruCount = await indexedDB.count('guru');
      const kelasCount = await indexedDB.count('kelas');
      const mataPelajaranCount = await indexedDB.count('mata_pelajaran');
      const siswaCount = await indexedDB.count('siswa');
      const kehadiranCount = await indexedDB.count('kehadiran');
      const jenisKegiatanCount = await indexedDB.count('jenis_kegiatan');
      const jurnalCount = await indexedDB.count('jurnal');
      
      setStats({
        guru: guruCount,
        kelas: kelasCount,
        mata_pelajaran: mataPelajaranCount,
        siswa: siswaCount,
        kehadiran: kehadiranCount,
        jenis_kegiatan: jenisKegiatanCount,
        jurnal: jurnalCount,
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
    loadYearDataStats();
  }, []);

  const loadYearDataStats = async () => {
    try {
      const years = await getAllTahunAjaran();
      const allKelas = await indexedDB.select("kelas");
      const allSiswa = await indexedDB.select("siswa");
      const allNilai = await indexedDB.select("nilai_siswa");
      const allKehadiran = await indexedDB.select("kehadiran");
      const allJadwal = await indexedDB.select("jadwal_pelajaran");
      const allAgenda = await indexedDB.select("agenda_mengajar");
      
      const statsPerYear = years.map((year) => {
        const kelasInYear = allKelas.filter((k: any) => k.tahun_ajaran === year);
        const kelasIds = kelasInYear.map((k: any) => k.id);
        const siswaInYear = allSiswa.filter((s: any) => kelasIds.includes(s.kelas_id));
        const siswaIds = siswaInYear.map((s: any) => s.id);
        
        return {
          tahunAjaran: year,
          totalKelas: kelasInYear.length,
          totalSiswa: siswaInYear.length,
          totalNilai: allNilai.filter((n: any) => siswaIds.includes(n.siswa_id) && n.tahun_ajaran === year).length,
          totalKehadiran: allKehadiran.filter((k: any) => kelasIds.includes(k.kelas_id)).length,
          totalJadwal: allJadwal.filter((j: any) => j.tahun_ajaran === year).length,
          totalAgenda: allAgenda.filter((a: any) => a.tahun_ajaran === year).length,
        };
      });
      
      setYearDataStats(statsPerYear.sort((a, b) => a.tahunAjaran.localeCompare(b.tahunAjaran)));
    } catch (error) {
      console.error("Error loading year data stats:", error);
    }
  };

  const handleDeleteYearClick = (yearStats: any) => {
    setSelectedYearStats(yearStats);
    setDeleteYearDialogOpen(true);
  };

  // Delete all data from a table
  const deleteAllData = async (tableName: 'guru' | 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal' | 'users', displayName: string) => {
    setDeleting(tableName);
    try {
      if (tableName === 'users') {
        // Clear users from localStorage
        localStorage.setItem('users', JSON.stringify([]));
      } else {
        const result = await indexedDB.clear(tableName);
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
    <div className="space-y-4">
      <PageHeader 
        title="Manajemen Data" 
        description="Kelola dan hapus data sistem secara massal"
      />

      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 py-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
          <strong>Peringatan:</strong> Fitur ini akan menghapus SEMUA data pada kategori yang dipilih. 
          Tindakan ini tidak dapat dibatalkan. Pastikan untuk melakukan backup terlebih dahulu.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {dataTypes.map((dataType) => {
          const Icon = dataType.icon;
          const isDeleting = deleting === dataType.key;
          
          return (
            <Card key={dataType.key} className={`border ${getColorClasses(dataType.color)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={`h-5 w-5 ${getIconColor(dataType.color)}`} />
                  {dataType.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {dataType.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  {loading ? (
                    <div className="h-6 bg-muted animate-pulse rounded" />
                  ) : (
                    <>
                      <p className={`text-2xl font-bold ${getIconColor(dataType.color)}`}>
                        {dataType.count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total record
                      </p>
                    </>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      disabled={isDeleting || dataType.count === 0}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                          Menghapus...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Hapus
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Year-based data management */}
      <Card className="border border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash className="h-5 w-5 text-destructive" />
            Hapus Data Per Tahun Ajaran
          </CardTitle>
          <CardDescription className="text-xs">
            Hapus semua data terkait tahun ajaran tertentu untuk efisiensi memori
          </CardDescription>
        </CardHeader>
        <CardContent>
          {yearDataStats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              Tidak ada data tahun ajaran
            </p>
          ) : (
            <div className="space-y-2">
              {yearDataStats.map((yearStat) => {
                const totalData = yearStat.totalKelas + yearStat.totalSiswa + yearStat.totalNilai + 
                                yearStat.totalKehadiran + yearStat.totalJadwal + yearStat.totalAgenda;
                
                return (
                  <div 
                    key={yearStat.tahunAjaran}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm">{yearStat.tahunAjaran}</h4>
                      <p className="text-xs text-muted-foreground">
                        {totalData} data (Kelas: {yearStat.totalKelas}, Siswa: {yearStat.totalSiswa}, 
                        Nilai: {yearStat.totalNilai}, Hadir: {yearStat.totalKehadiran})
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteYearClick(yearStat)}
                      disabled={totalData === 0}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Hapus
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteYearDataDialog
        open={deleteYearDialogOpen}
        onOpenChange={setDeleteYearDialogOpen}
        yearStats={selectedYearStats}
        onDeleteSuccess={() => {
          fetchStats();
          loadYearDataStats();
        }}
      />
    </div>
  );
};

export default ManajemenData;