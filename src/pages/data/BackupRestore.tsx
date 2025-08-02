import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, Database, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BackupRestore = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Fetch data from all tables except users
      const backupData: any = {};
      
      // Fetch guru data
      const { data: guruData, error: guruError } = await supabase.from('guru').select('*');
      if (guruError) throw new Error(`Error backing up guru: ${guruError.message}`);
      backupData.guru = guruData;

      // Fetch kelas data
      const { data: kelasData, error: kelasError } = await supabase.from('kelas').select('*');
      if (kelasError) throw new Error(`Error backing up kelas: ${kelasError.message}`);
      backupData.kelas = kelasData;

      // Fetch mata_pelajaran data
      const { data: mataPelajaranData, error: mataPelajaranError } = await supabase.from('mata_pelajaran').select('*');
      if (mataPelajaranError) throw new Error(`Error backing up mata_pelajaran: ${mataPelajaranError.message}`);
      backupData.mata_pelajaran = mataPelajaranData;

      // Fetch siswa data
      const { data: siswaData, error: siswaError } = await supabase.from('siswa').select('*');
      if (siswaError) throw new Error(`Error backing up siswa: ${siswaError.message}`);
      backupData.siswa = siswaData;

      // Fetch kehadiran data
      const { data: kehadiranData, error: kehadiranError } = await supabase.from('kehadiran').select('*');
      if (kehadiranError) throw new Error(`Error backing up kehadiran: ${kehadiranError.message}`);
      backupData.kehadiran = kehadiranData;
      // Add timestamp to backup
      backupData.backup_info = {
        created_at: new Date().toISOString(),
        version: "1.0",
        tables: ['guru', 'kelas', 'mata_pelajaran', 'siswa', 'kehadiran']
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
      
      // Restore guru data
      if (backupData.guru) {
        const { error: deleteError } = await supabase.from('guru').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) console.warn('Warning deleting guru:', deleteError.message);
        
        if (backupData.guru.length > 0) {
          const { error: insertError } = await supabase.from('guru').insert(backupData.guru);
          if (insertError) throw new Error(`Error restoring guru: ${insertError.message}`);
        }
      }

      // Restore kelas data
      if (backupData.kelas) {
        const { error: deleteError } = await supabase.from('kelas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) console.warn('Warning deleting kelas:', deleteError.message);
        
        if (backupData.kelas.length > 0) {
          const { error: insertError } = await supabase.from('kelas').insert(backupData.kelas);
          if (insertError) throw new Error(`Error restoring kelas: ${insertError.message}`);
        }
      }

      // Restore mata_pelajaran data
      if (backupData.mata_pelajaran) {
        const { error: deleteError } = await supabase.from('mata_pelajaran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) console.warn('Warning deleting mata_pelajaran:', deleteError.message);
        
        if (backupData.mata_pelajaran.length > 0) {
          const { error: insertError } = await supabase.from('mata_pelajaran').insert(backupData.mata_pelajaran);
          if (insertError) throw new Error(`Error restoring mata_pelajaran: ${insertError.message}`);
        }
      }

      // Restore siswa data
      if (backupData.siswa) {
        const { error: deleteError } = await supabase.from('siswa').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) console.warn('Warning deleting siswa:', deleteError.message);
        
        if (backupData.siswa.length > 0) {
          const { error: insertError } = await supabase.from('siswa').insert(backupData.siswa);
          if (insertError) throw new Error(`Error restoring siswa: ${insertError.message}`);
        }
      }

      // Restore kehadiran data
      if (backupData.kehadiran) {
        const { error: deleteError } = await supabase.from('kehadiran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) console.warn('Warning deleting kehadiran:', deleteError.message);
        
        if (backupData.kehadiran.length > 0) {
          const { error: insertError } = await supabase.from('kehadiran').insert(backupData.kehadiran);
          if (insertError) throw new Error(`Error restoring kehadiran: ${insertError.message}`);
        }
      }

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Backup dan Restore</h1>
        <p className="text-muted-foreground">
          Kelola backup dan restore data sistem sekolah
        </p>
      </div>

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
              Buat backup semua data kecuali data pengguna
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Data yang akan dibackup:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Data Guru</li>
                <li>Data Kelas</li>
                <li>Data Mata Pelajaran</li>
                <li>Data Siswa</li>
                <li>Data Kehadiran</li>
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
    </div>
  );
};

export default BackupRestore;