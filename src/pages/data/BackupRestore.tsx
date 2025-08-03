import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, Database, AlertTriangle, Users, BookOpen, GraduationCap, School, Calendar, FileText, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DataStats {
  guru: number;
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
    guru: 0,
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

  // Export individual table
  const exportTable = async (tableName: 'guru' | 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal', displayName: string) => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;

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
      
      const tables: ('guru' | 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal')[] = 
        ['guru', 'kelas', 'mata_pelajaran', 'siswa', 'kehadiran', 'jenis_kegiatan', 'jurnal'];
      
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw new Error(`Error backing up ${table}: ${error.message}`);
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
      const tables: ('guru' | 'kelas' | 'mata_pelajaran' | 'siswa' | 'kehadiran' | 'jenis_kegiatan' | 'jurnal')[] = 
        ['guru', 'kelas', 'mata_pelajaran', 'siswa', 'kehadiran', 'jenis_kegiatan', 'jurnal'];
      
      for (const table of tables) {
        if (backupData[table]) {
          const { error: deleteError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (deleteError) console.warn(`Warning deleting ${table}:`, deleteError.message);
          
          if (backupData[table].length > 0) {
            const { error: insertError } = await supabase.from(table).insert(backupData[table]);
            if (insertError) throw new Error(`Error restoring ${table}: ${insertError.message}`);
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
        title="Manajemen Data" 
        description="Kelola data sistem, backup, restore, dan statistik"
      />

      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics">Statistik Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistik Database
              </CardTitle>
              <CardDescription>
                Ringkasan jumlah data di setiap tabel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Guru</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.guru}</p>
                    <p className="text-sm text-blue-600/70">Total guru</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <School className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">Kelas</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.kelas}</p>
                    <p className="text-sm text-green-600/70">Total kelas</p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">Mata Pelajaran</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.mata_pelajaran}</p>
                    <p className="text-sm text-purple-600/70">Total mapel</p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">Siswa</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{stats.siswa}</p>
                    <p className="text-sm text-orange-600/70">Total siswa</p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-900 dark:text-red-100">Kehadiran</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.kehadiran}</p>
                    <p className="text-sm text-red-600/70">Total record</p>
                  </div>

                  <div className="bg-cyan-50 dark:bg-cyan-950 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5 text-cyan-600" />
                      <h3 className="font-semibold text-cyan-900 dark:text-cyan-100">Jenis Kegiatan</h3>
                    </div>
                    <p className="text-2xl font-bold text-cyan-600">{stats.jenis_kegiatan}</p>
                    <p className="text-sm text-cyan-600/70">Total jenis</p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Jurnal</h3>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{stats.jurnal}</p>
                    <p className="text-sm text-indigo-600/70">Total jurnal</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data per Tabel
              </CardTitle>
              <CardDescription>
                Export data individual dari setiap tabel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <h4 className="font-medium">Data Guru</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.guru} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('guru', 'Guru')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="h-4 w-4" />
                    <h4 className="font-medium">Data Kelas</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.kelas} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('kelas', 'Kelas')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4" />
                    <h4 className="font-medium">Mata Pelajaran</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.mata_pelajaran} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('mata_pelajaran', 'Mata Pelajaran')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4" />
                    <h4 className="font-medium">Data Siswa</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.siswa} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('siswa', 'Siswa')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h4 className="font-medium">Data Kehadiran</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.kehadiran} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('kehadiran', 'Kehadiran')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" />
                    <h4 className="font-medium">Jenis Kegiatan</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.jenis_kegiatan} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('jenis_kegiatan', 'Jenis Kegiatan')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <h4 className="font-medium">Data Jurnal</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{stats.jurnal} record</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => exportTable('jurnal', 'Jurnal')}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup" className="space-y-6">
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
                    <li>Data Guru ({stats.guru} record)</li>
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
              <li>• Backup tidak menyertakan data pengguna (login) untuk keamanan</li>
              <li>• File backup disimpan dalam format JSON</li>
              <li>• Lakukan backup secara berkala untuk menjaga keamanan data</li>
              <li>• Pastikan file backup disimpan di tempat yang aman</li>
              <li>• Proses restore akan menghapus semua data yang ada sebelumnya</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackupRestore;