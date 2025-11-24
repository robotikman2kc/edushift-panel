import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, Users, BookOpen, GraduationCap } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { getActiveTahunAjaran, setActiveTahunAjaran, getAllTahunAjaran } from "@/lib/academicYearUtils";

interface YearStats {
  tahunAjaran: string;
  totalKelas: number;
  totalSiswa: number;
  totalJadwal: number;
  isActive: boolean;
}

export default function TahunAjaran() {
  const [yearStats, setYearStats] = useState<YearStats[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [duplicateClasses, setDuplicateClasses] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadYearStats();
  }, []);

  const loadYearStats = async () => {
    try {
      const years = await getAllTahunAjaran();
      const activeYear = await getActiveTahunAjaran();
      
      const stats: YearStats[] = await Promise.all(
        years.map(async (year) => {
          const kelas = await indexedDB.select('kelas', (k: any) => k.tahun_ajaran === year);
          const siswa = await indexedDB.select('siswa', (s: any) => s.tahun_ajaran === year);
          const jadwal = await indexedDB.select('jadwal_pelajaran', (j: any) => j.tahun_ajaran === year);
          
          return {
            tahunAjaran: year,
            totalKelas: kelas.length,
            totalSiswa: siswa.length,
            totalJadwal: jadwal.length,
            isActive: year === activeYear
          };
        })
      );
      
      setYearStats(stats.sort((a, b) => b.tahunAjaran.localeCompare(a.tahunAjaran)));
    } catch (error) {
      console.error("Error loading year stats:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data tahun ajaran",
        variant: "destructive"
      });
    }
  };

  const handleCreateNewYear = async () => {
    if (!newYear.trim()) {
      toast({
        title: "Error",
        description: "Tahun ajaran harus diisi",
        variant: "destructive"
      });
      return;
    }

    // Validate format (e.g., 2025/2026)
    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!yearPattern.test(newYear)) {
      toast({
        title: "Error",
        description: "Format tahun ajaran tidak valid. Gunakan format: 2025/2026",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if year already exists
      const existingYears = await getAllTahunAjaran();
      if (existingYears.includes(newYear)) {
        toast({
          title: "Error",
          description: "Tahun ajaran sudah ada",
          variant: "destructive"
        });
        return;
      }

      if (duplicateClasses) {
        // Get current active year
        const currentYear = await getActiveTahunAjaran();
        const kelasLama = await indexedDB.select('kelas', (k: any) => k.tahun_ajaran === currentYear);
        
        // Copy classes to new year
        for (const kelas of kelasLama) {
          await indexedDB.insert('kelas', {
            nama_kelas: kelas.nama_kelas,
            tingkat: kelas.tingkat,
            jurusan: kelas.jurusan,
            wali_kelas_id: kelas.wali_kelas_id,
            tahun_ajaran: newYear,
            kapasitas: kelas.kapasitas,
            status: 'Aktif'
          });
        }
        
        toast({
          title: "Berhasil",
          description: `Tahun ajaran ${newYear} berhasil dibuat dengan ${kelasLama.length} kelas`
        });
      } else {
        // Create at least one dummy kelas to mark year as existing
        await indexedDB.insert('kelas', {
          nama_kelas: 'Placeholder',
          tingkat: 'X',
          tahun_ajaran: newYear,
          kapasitas: 0,
          status: 'Tidak Aktif'
        });
        
        toast({
          title: "Berhasil",
          description: `Tahun ajaran ${newYear} berhasil dibuat`
        });
      }
      
      setIsDialogOpen(false);
      setNewYear("");
      setDuplicateClasses(true);
      loadYearStats();
    } catch (error) {
      console.error("Error creating new year:", error);
      toast({
        title: "Error",
        description: "Gagal membuat tahun ajaran baru",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (tahunAjaran: string) => {
    try {
      await setActiveTahunAjaran(tahunAjaran);
      toast({
        title: "Berhasil",
        description: `Tahun ajaran ${tahunAjaran} diaktifkan`
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengaktifkan tahun ajaran",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen Tahun Ajaran"
        description="Kelola tahun ajaran dan data per periode"
      />

      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">Daftar Tahun Ajaran</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Tahun Ajaran Baru
        </Button>
      </div>

      <div className="grid gap-3">
        {yearStats.map((stat) => (
          <Card key={stat.tahunAjaran}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">
                  {stat.tahunAjaran}
                </CardTitle>
                {stat.isActive && (
                  <Badge variant="outline" className="ml-1 bg-emerald-100 text-emerald-700 border-emerald-300 font-medium dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Aktif
                  </Badge>
                )}
              </div>
              {!stat.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetActive(stat.tahunAjaran)}
                >
                  Aktifkan
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Kelas</p>
                    <p className="text-xl font-bold">{stat.totalKelas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Siswa</p>
                    <p className="text-xl font-bold">{stat.totalSiswa}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Jadwal</p>
                    <p className="text-xl font-bold">{stat.totalJadwal}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Tahun Ajaran Baru</DialogTitle>
            <DialogDescription>
              Buat tahun ajaran baru dan tentukan apakah ingin menduplikasi kelas dari tahun sebelumnya
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newYear">Tahun Ajaran</Label>
              <Input
                id="newYear"
                placeholder="2026/2027"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Format: YYYY/YYYY (contoh: 2026/2027)
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="duplicate">Duplikasi Kelas</Label>
                <p className="text-sm text-muted-foreground">
                  Salin kelas dari tahun ajaran aktif saat ini
                </p>
              </div>
              <Switch
                id="duplicate"
                checked={duplicateClasses}
                onCheckedChange={setDuplicateClasses}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateNewYear} disabled={loading}>
              {loading ? "Membuat..." : "Buat Tahun Ajaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
