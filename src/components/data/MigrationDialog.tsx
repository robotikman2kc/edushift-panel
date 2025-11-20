import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Database,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { dataMigration } from '@/lib/migrationUtils';
import { toast } from 'sonner';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingTables: { table: string; recordCount: number }[];
  totalRecords: number;
  onMigrationComplete: () => void;
}

export function MigrationDialog({
  open,
  onOpenChange,
  pendingTables,
  totalRecords,
  onMigrationComplete,
}: MigrationDialogProps) {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    try {
      const backup = localStorage.getItem('localdb_backup');
      if (!backup) {
        toast.error('Tidak ada backup yang tersedia');
        return;
      }

      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Backup berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh backup');
      console.error(error);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);
    setProgress(0);

    try {
      const result = await dataMigration.migrateData((prog, msg) => {
        setProgress(prog);
        setProgressMessage(msg);
      });

      if (result.success) {
        setMigrationReport(result.report);
        setMigrationComplete(true);
        setProgress(100);
        
        // Clear localStorage data
        await dataMigration.clearLocalStorageData();
        
        // Mark migration as completed
        localStorage.setItem('migrationCompleted', new Date().toISOString());
        
        toast.success('Migrasi data berhasil!');
        
        // Wait a bit before calling completion callback
        setTimeout(() => {
          onMigrationComplete();
        }, 2000);
      } else {
        setError(result.error || 'Migrasi gagal');
        toast.error('Migrasi gagal: ' + result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error('Migrasi gagal: ' + errorMessage);
    } finally {
      setMigrating(false);
    }
  };

  const handleClose = () => {
    if (!migrating) {
      onOpenChange(false);
      if (migrationComplete) {
        // Reset state for next time
        setMigrationComplete(false);
        setProgress(0);
        setProgressMessage('');
        setMigrationReport(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migrasi Data ke IndexedDB
          </DialogTitle>
          <DialogDescription>
            {migrationComplete 
              ? 'Migrasi data telah berhasil diselesaikan'
              : 'Pindahkan data Anda ke sistem penyimpanan yang lebih baik'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!migrationComplete && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Keuntungan IndexedDB:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Kapasitas lebih besar (hingga 500MB+)</li>
                      <li>Performa lebih cepat untuk data besar</li>
                      <li>Mendukung pencarian kompleks</li>
                      <li>Lebih aman dan terstruktur</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Data yang akan dipindah ({totalRecords} records):
                </h4>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-2">
                    {pendingTables.map(({ table, recordCount }) => (
                      <div key={table} className="flex justify-between items-center text-sm">
                        <span className="font-mono">{table}</span>
                        <span className="text-muted-foreground">{recordCount} records</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <p className="font-medium mb-1">⚠️ Catatan:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Proses ini aman dan reversible</li>
                    <li>Backup otomatis akan dibuat</li>
                    <li>Pengaturan Anda tidak akan berubah</li>
                    <li>Estimasi waktu: ~{Math.ceil(totalRecords / 100)} detik</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}

          {migrating && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progressMessage}
              </div>
            </div>
          )}

          {migrationComplete && migrationReport && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    ✅ Migrasi Berhasil!
                  </p>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p>Total records: {totalRecords}</p>
                    <p>localStorage sekarang hanya untuk pengaturan kecil</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-medium">Error:</p>
                <p className="text-sm">{error}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!migrationComplete && (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadBackup}
                disabled={migrating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={migrating}
              >
                Nanti Saja
              </Button>
              <Button
                onClick={handleMigrate}
                disabled={migrating}
              >
                {migrating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memigrasikan...
                  </>
                ) : (
                  'Migrate Sekarang'
                )}
              </Button>
            </>
          )}
          {migrationComplete && (
            <Button onClick={handleClose}>
              Tutup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
