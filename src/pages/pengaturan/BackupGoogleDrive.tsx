import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Save, Cloud, AlertCircle, CheckCircle, Upload, FileText, Calendar } from "lucide-react";
import { googleDriveBackup } from "@/lib/googleDriveBackup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const BackupGoogleDrive = () => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [backupInterval, setBackupInterval] = useState("7"); // days
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [nextBackup, setNextBackup] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isManualBackup, setIsManualBackup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await googleDriveBackup.getSettings();
    setWebhookUrl(settings.webhookUrl || "");
    setBackupInterval(settings.intervalDays.toString());
    setLastBackup(settings.lastBackupDate);
    
    if (settings.lastBackupDate) {
      const next = new Date(settings.lastBackupDate);
      next.setDate(next.getDate() + settings.intervalDays);
      setNextBackup(next);
    }
  };

  const handleSave = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Webhook URL tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      toast({
        title: "Error",
        description: "Format URL tidak valid",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await googleDriveBackup.saveSettings({
        webhookUrl: webhookUrl.trim(),
        intervalDays: parseInt(backupInterval),
      });

      toast({
        title: "Berhasil",
        description: "Pengaturan backup berhasil disimpan",
      });

      loadSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Masukkan Webhook URL terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const result = await googleDriveBackup.testConnection(webhookUrl.trim());
      
      if (result.success) {
        toast({
          title: "Koneksi Berhasil",
          description: "Webhook URL valid dan terhubung dengan Google Drive",
        });
      } else {
        throw new Error(result.error || "Koneksi gagal");
      }
    } catch (error: any) {
      toast({
        title: "Koneksi Gagal",
        description: error.message || "Tidak dapat terhubung ke webhook",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleManualBackup = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Konfigurasi webhook URL terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsManualBackup(true);
    try {
      const result = await googleDriveBackup.performBackup();
      
      if (result.success) {
        toast({
          title: "Backup Berhasil",
          description: `Data berhasil dibackup ke Google Drive (${result.fileName})`,
        });
        loadSettings();
      } else {
        throw new Error(result.error || "Backup gagal");
      }
    } catch (error: any) {
      toast({
        title: "Backup Gagal",
        description: error.message || "Gagal melakukan backup",
        variant: "destructive",
      });
    } finally {
      setIsManualBackup(false);
    }
  };

  const getDaysUntilBackup = () => {
    if (!nextBackup) return null;
    const now = new Date();
    const diff = nextBackup.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysUntil = getDaysUntilBackup();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Backup Google Drive" 
        description="Konfigurasi backup otomatis data ke Google Drive"
      />

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Panduan Setup Google Apps Script
          </CardTitle>
          <CardDescription>
            Ikuti langkah berikut untuk setup backup otomatis ke Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">1</Badge>
              <div className="flex-1">
                <p className="font-medium">Buka Google Apps Script</p>
                <p className="text-sm text-muted-foreground">
                  Kunjungi <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">script.google.com</a> dan buat project baru
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div className="flex-1">
                <p className="font-medium">Copy Script Berikut</p>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var fileName = data.fileName || 'backup_' + new Date().toISOString().split('T')[0] + '.json';
    var fileContent = JSON.stringify(data.content, null, 2);
    
    // Ganti FOLDER_ID dengan ID folder Google Drive Anda
    var folderId = 'FOLDER_ID_ANDA';
    var folder = DriveApp.getFolderById(folderId);
    
    // Cek apakah file dengan nama sama sudah ada
    var files = folder.getFilesByName(fileName);
    if (files.hasNext()) {
      var file = files.next();
      file.setContent(fileContent);
    } else {
      folder.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, fileName: fileName })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`}</pre>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div className="flex-1">
                <p className="font-medium">Ganti FOLDER_ID</p>
                <p className="text-sm text-muted-foreground">
                  Buka folder Google Drive Anda, copy ID dari URL (bagian setelah /folders/)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contoh: https://drive.google.com/drive/folders/<span className="text-primary font-mono">1ABC...XYZ</span>
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div className="flex-1">
                <p className="font-medium">Deploy sebagai Web App</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Klik Deploy → <strong>New deployment</strong> (BUKAN Manage deployments!)
                </p>
                <p className="text-sm text-muted-foreground">
                  Select type: Web app → Execute as: <strong>Me</strong> → Who has access: <strong>Anyone</strong> → Deploy
                </p>
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    ⚠️ Penting: Setiap kali update script, buat <strong>New deployment</strong> baru untuk mendapatkan URL terbaru!
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">5</Badge>
              <div className="flex-1">
                <p className="font-medium">Copy Webhook URL</p>
                <p className="text-sm text-muted-foreground">
                  Setelah deploy, copy Web app URL dan paste di form di bawah
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Konfigurasi Backup
          </CardTitle>
          <CardDescription>
            Atur webhook URL dan interval backup otomatis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">
              Webhook URL Google Apps Script
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://script.google.com/macros/s/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL dari Google Apps Script Web App deployment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Interval Backup Otomatis</Label>
            <Select value={backupInterval} onValueChange={setBackupInterval}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Setiap Hari</SelectItem>
                <SelectItem value="3">Setiap 3 Hari</SelectItem>
                <SelectItem value="7">Setiap Minggu</SelectItem>
                <SelectItem value="14">Setiap 2 Minggu</SelectItem>
                <SelectItem value="30">Setiap Bulan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting || !webhookUrl}>
              {isTesting ? "Testing..." : "Test Koneksi"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Status Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Backup Terakhir</p>
              <p className="text-lg font-semibold">
                {lastBackup ? new Date(lastBackup).toLocaleString('id-ID') : 'Belum pernah backup'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Backup Selanjutnya</p>
              <p className="text-lg font-semibold">
                {nextBackup ? (
                  <>
                    {new Date(nextBackup).toLocaleDateString('id-ID')}
                    {daysUntil !== null && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({daysUntil > 0 ? `${daysUntil} hari lagi` : 'Hari ini'})
                      </span>
                    )}
                  </>
                ) : (
                  'Belum terjadwal'
                )}
              </p>
            </div>
          </div>

          {webhookUrl && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Backup otomatis aktif. Aplikasi akan otomatis backup saat online dan sudah waktunya.
              </AlertDescription>
            </Alert>
          )}

          {!webhookUrl && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Konfigurasi webhook URL untuk mengaktifkan backup otomatis.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleManualBackup} 
            disabled={isManualBackup || !webhookUrl}
            className="w-full"
          >
            {isManualBackup ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Sedang Backup...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Backup Manual Sekarang
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupGoogleDrive;
