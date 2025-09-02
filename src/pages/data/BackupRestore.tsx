import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { localDB } from "@/lib/localDB";
import { Download, Upload, Database, AlertTriangle, Users, BookOpen, GraduationCap, School, Calendar, FileText, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataStats {
  kelas: number;
  mata_pelajaran: number;
  siswa: number;
  kehadiran: number;
  jenis_kegiatan: number;
  jurnal: number;
}

const BackupRestore = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [stats, setStats] = useState<DataStats>({
    kelas: 0,
    mata_pelajaran: 0,
    siswa: 0,
    kehadiran: 0,
    jenis_kegiatan: 0,
    jurnal: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch data statistics
  const fetchStats = async () => {
    try {
      setStats({
        kelas: localDB.select('kelas').length,
        mata_pelajaran: localDB.select('mata_pelajaran').length,
        siswa: localDB.select('siswa').length,
        kehadiran: localDB.select('kehadiran').length,
        jenis_kegiatan: localDB.select('jenis_kegiatan').length,
        jurnal: localDB.select('jurnal').length
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

  // Export individual table
  const exportTable = async (tableName: 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal', displayName: string) => {
    try {
      const data = localDB.select(tableName);

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Berhasil",
        description: `Data ${displayName} berhasil diekspor`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: `Gagal mengekspor data ${displayName}`,
        variant: "destructive"
      });
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Fetch data from all tables except users
      const backupData: any = {};
      
      const tables: ('kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal')[] = 
        ['kelas', 'mata_pelajaran', 'siswa', 'kehadiran', 'jenis_kegiatan', 'jurnal'];
      
      for (const table of tables) {
        const data = localDB.select(table);
        backupData[table] = data;
      }

      // Add timestamp to backup
      backupData.backup_info = {
        created_at: new Date().toISOString(),
        version: "2.0",
        tables: tables
      };

      // Create and download backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Berhasil",
        description: "Data berhasil dibackup dan diunduh"
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Error",
        description: "Gagal membuat backup data",
        variant: "destructive"
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validate backup format
      if (!backupData.backup_info || !backupData.backup_info.tables) {
        throw new Error('Format backup tidak valid');
      }

      // Clear existing data and restore each table
      const tables: ('kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal')[] = 
        ['kelas', 'mata_pelajaran', 'siswa', 'kehadiran', 'jenis_kegiatan', 'jurnal'];
      
      for (const table of tables) {
        if (backupData[table]) {
          // Clear existing data
          const clearResult = localDB.clear(table);
          if (clearResult.error) {
            console.warn(`Warning clearing ${table}:`, clearResult.error);
          }
          
          // Restore data
          if (backupData[table].length > 0) {
            for (const item of backupData[table]) {
              const insertResult = localDB.insert(table, item);
              if (insertResult.error) {
                throw new Error(`Error restoring ${table}: ${insertResult.error}`);
              }
            }
          }
        }
      }

      // Refresh stats after restore
      fetchStats();

      toast({
        title: "Restore Berhasil",
        description: "Data berhasil dipulihkan dari backup"
      });
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal restore data",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Backup dan Restore" 
        description="Backup dan pulihkan data sistem"
      />

      <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Perhatian:</strong> Fitur restore akan menghapus semua data yang ada dan menggantinya dengan data dari backup. 
              Pastikan Anda sudah membuat backup terbaru sebelum melakukan restore.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Backup Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup Data
                </CardTitle>
                <CardDescription>
                  Buat backup semua data sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Data yang akan dibackup:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Data Kelas ({stats.kelas} record)</li>
                    <li>Data Mata Pelajaran ({stats.mata_pelajaran} record)</li>
                    <li>Data Siswa ({stats.siswa} record)</li>
                    <li>Data Kehadiran ({stats.kehadiran} record)</li>
                    <li>Data Jenis Kegiatan ({stats.jenis_kegiatan} record)</li>
                    <li>Data Jurnal ({stats.jurnal} record)</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full"
                >
                  {isBackingUp ? (
                    <>
                      <Database className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Backup...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Buat Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Restore Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Restore Data
                </CardTitle>
                <CardDescription>
                  Pulihkan data dari file backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Pilih file backup (.json) untuk dipulihkan.</p>
                  <p className="text-destructive mt-2">
                    <strong>Peringatan:</strong> Semua data yang ada akan diganti dengan data dari backup.
                  </p>
                </div>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    disabled={isRestoring}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium"
                  />
                  {isRestoring && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="h-4 w-4 animate-spin" />
                      Memproses restore...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Catatan Penting:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Backup tidak menyertakan data pengguna (login) dan data guru untuk keamanan</li>
              <li>• File backup disimpan dalam format JSON</li>
              <li>• Lakukan backup secara berkala untuk menjaga keamanan data</li>
              <li>• Pastikan file backup disimpan di tempat yang aman</li>
              <li>• Proses restore akan menghapus semua data yang ada sebelumnya</li>
            </ul>
          </div>
      </div>
    </div>
  );
};

export default BackupRestore;