import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { Trash2, AlertTriangle, Users, BookOpen, GraduationCap, School, Calendar, FileText, Database, Trash, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/common/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DeleteYearDataDialog } from "@/components/data/DeleteYearDataDialog";
import { getAllTahunAjaran } from "@/lib/academicYearUtils";
import { Badge } from "@/components/ui/badge";

interface DataStats {
  guru: number;
  kelas: number;
  mata_pelajaran: number;
  siswa: number;
  kehadiran: number;
  jenis_kegiatan: number;
  jurnal: number;
  nilai_siswa: number;
  jenis_penilaian: number;
  jadwal_pelajaran: number;
  jam_pelajaran: number;
  agenda_mengajar: number;
  catatan_kalender: number;
  hari_libur: number;
  ekstrakurikuler: number;
  anggota_eskul: number;
  kehadiran_eskul: number;
  nilai_eskul: number;
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
    nilai_siswa: 0,
    jenis_penilaian: 0,
    jadwal_pelajaran: 0,
    jam_pelajaran: 0,
    agenda_mengajar: 0,
    catatan_kalender: 0,
    hari_libur: 0,
    ekstrakurikuler: 0,
    anggota_eskul: 0,
    kehadiran_eskul: 0,
    nilai_eskul: 0
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
      const guruCount = await indexedDB.count('guru');
      const kelasCount = await indexedDB.count('kelas');
      const mataPelajaranCount = await indexedDB.count('mata_pelajaran');
      const siswaCount = await indexedDB.count('siswa');
      const kehadiranCount = await indexedDB.count('kehadiran');
      const jenisKegiatanCount = await indexedDB.count('jenis_kegiatan');
      const jurnalCount = await indexedDB.count('jurnal');
      const nilaiSiswaCount = await indexedDB.count('nilai_siswa');
      const jenisPenilaianCount = await indexedDB.count('jenis_penilaian');
      const jadwalPelajaranCount = await indexedDB.count('jadwal_pelajaran');
      const jamPelajaranCount = await indexedDB.count('jam_pelajaran');
      const agendaMengajarCount = await indexedDB.count('agenda_mengajar');
      const catatanKalenderCount = await indexedDB.count('catatan_kalender');
      const hariLiburCount = await indexedDB.count('hari_libur');
      const ekstrakurikulerCount = await indexedDB.count('ekstrakurikuler');
      const anggotaEskulCount = await indexedDB.count('anggota_eskul');
      const kehadiranEskulCount = await indexedDB.count('kehadiran_eskul');
      const nilaiEskulCount = await indexedDB.count('nilai_eskul');
      
      setStats({
        guru: guruCount,
        kelas: kelasCount,
        mata_pelajaran: mataPelajaranCount,
        siswa: siswaCount,
        kehadiran: kehadiranCount,
        jenis_kegiatan: jenisKegiatanCount,
        jurnal: jurnalCount,
        nilai_siswa: nilaiSiswaCount,
        jenis_penilaian: jenisPenilaianCount,
        jadwal_pelajaran: jadwalPelajaranCount,
        jam_pelajaran: jamPelajaranCount,
        agenda_mengajar: agendaMengajarCount,
        catatan_kalender: catatanKalenderCount,
        hari_libur: hariLiburCount,
        ekstrakurikuler: ekstrakurikulerCount,
        anggota_eskul: anggotaEskulCount,
        kehadiran_eskul: kehadiranEskulCount,
        nilai_eskul: nilaiEskulCount
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
  const deleteAllData = async (tableName: string, displayName: string) => {
    setDeleting(tableName);
    try {
      const result = await indexedDB.clear(tableName as any);
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Berhasil Dihapus",
        description: `Semua ${displayName} berhasil dihapus`
      });

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
    { key: 'guru', title: 'Guru', icon: Users, count: stats.guru },
    { key: 'mata_pelajaran', title: 'Mata Pelajaran', icon: BookOpen, count: stats.mata_pelajaran },
    { key: 'kelas', title: 'Kelas', icon: School, count: stats.kelas },
    { key: 'siswa', title: 'Siswa', icon: GraduationCap, count: stats.siswa },
    { key: 'nilai_siswa', title: 'Nilai Siswa', icon: FileText, count: stats.nilai_siswa },
    { key: 'jenis_penilaian', title: 'Jenis Penilaian', icon: Database, count: stats.jenis_penilaian },
    { key: 'kehadiran', title: 'Kehadiran', icon: Calendar, count: stats.kehadiran },
    { key: 'jadwal_pelajaran', title: 'Jadwal Pelajaran', icon: Calendar, count: stats.jadwal_pelajaran },
    { key: 'jam_pelajaran', title: 'Jam Pelajaran', icon: Calendar, count: stats.jam_pelajaran },
    { key: 'jenis_kegiatan', title: 'Jenis Kegiatan', icon: Database, count: stats.jenis_kegiatan },
    { key: 'jurnal', title: 'Jurnal', icon: FileText, count: stats.jurnal },
    { key: 'agenda_mengajar', title: 'Agenda Mengajar', icon: FileText, count: stats.agenda_mengajar },
    { key: 'catatan_kalender', title: 'Catatan Kalender', icon: Calendar, count: stats.catatan_kalender },
    { key: 'hari_libur', title: 'Hari Libur', icon: Calendar, count: stats.hari_libur },
    { key: 'ekstrakurikuler', title: 'Ekstrakurikuler', icon: GraduationCap, count: stats.ekstrakurikuler },
    { key: 'anggota_eskul', title: 'Anggota Eskul', icon: Users, count: stats.anggota_eskul },
    { key: 'kehadiran_eskul', title: 'Kehadiran Eskul', icon: Calendar, count: stats.kehadiran_eskul },
    { key: 'nilai_eskul', title: 'Nilai Eskul', icon: FileText, count: stats.nilai_eskul }
  ];

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Manajemen Data" 
        description="Kelola dan hapus data sistem"
      />

      <Alert variant="destructive" className="py-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Penghapusan data bersifat <strong>permanen</strong> dan tidak dapat dibatalkan. Backup terlebih dahulu.
        </AlertDescription>
      </Alert>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hapus Data Master</CardTitle>
          <CardDescription className="text-xs">Hapus semua data per kategori</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr,80px,60px] gap-2 p-2 text-xs font-medium bg-muted/50">
              <div>Kategori</div>
              <div className="text-center">Jumlah</div>
              <div className="text-center">Aksi</div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {dataTypes.map((dataType) => {
                  const Icon = dataType.icon;
                  const isDeleting = deleting === dataType.key;
                  
                  return (
                    <div 
                      key={dataType.key} 
                      className="grid grid-cols-[1fr,80px,60px] gap-2 p-2 items-center hover:bg-muted/30 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{dataType.title}</span>
                      </div>
                      
                      <div className="flex justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {dataType.count}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-center items-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isDeleting || dataType.count === 0}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Konfirmasi Penghapusan
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Anda akan menghapus <strong>{dataType.count} record</strong> dari {dataType.title}.
                                <br />
                                <span className="text-destructive font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteAllData(dataType.key, dataType.title)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Year Data */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trash className="h-4 w-4 text-destructive" />
            Hapus Per Tahun Ajaran
          </CardTitle>
          <CardDescription className="text-xs">Hapus semua data terkait tahun ajaran tertentu</CardDescription>
        </CardHeader>
        <CardContent>
          {yearDataStats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Tidak ada data tahun ajaran
            </p>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-[1fr,auto,auto] gap-2 p-2 text-xs font-medium bg-muted/50">
                <div>Tahun Ajaran</div>
                <div className="text-center w-24">Total Data</div>
                <div className="w-20 text-center">Aksi</div>
              </div>
              
              <div className="divide-y">
                {yearDataStats.map((yearStat) => {
                  const totalData = yearStat.totalKelas + yearStat.totalSiswa + yearStat.totalNilai + 
                                  yearStat.totalKehadiran + yearStat.totalJadwal + yearStat.totalAgenda;
                  
                  return (
                    <div 
                      key={yearStat.tahunAjaran}
                      className="grid grid-cols-[1fr,auto,auto] gap-2 p-2 items-center hover:bg-muted/30 transition-colors text-sm"
                    >
                      <div>
                        <div className="font-medium">{yearStat.tahunAjaran}</div>
                        <div className="text-xs text-muted-foreground">
                          Kelas: {yearStat.totalKelas} • Siswa: {yearStat.totalSiswa} • Nilai: {yearStat.totalNilai}
                        </div>
                      </div>
                      
                      <div className="text-center w-24">
                        <Badge variant="secondary" className="text-xs">
                          {totalData}
                        </Badge>
                      </div>
                      
                      <div className="w-20 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteYearClick(yearStat)}
                          disabled={totalData === 0}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
