import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useStorageMonitor, formatBytes } from "@/hooks/useStorageMonitor";
import { Database, HardDrive, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function StorageMonitor() {
  const { storageData, loading, error, refresh } = useStorageMonitor();

  const handleRefresh = async () => {
    toast.info("Memperbarui data storage...");
    await refresh();
    toast.success("Data storage berhasil diperbarui");
  };

  const getStorageStatus = (percentage: number) => {
    if (percentage < 50) return { color: "text-green-600", icon: CheckCircle2, label: "Aman" };
    if (percentage < 75) return { color: "text-yellow-600", icon: AlertCircle, label: "Peringatan" };
    return { color: "text-red-600", icon: XCircle, label: "Kritis" };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Storage Monitor"
          description="Pantau penggunaan penyimpanan lokal aplikasi"
        />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !storageData) {
    return (
      <div className="p-6">
        <PageHeader
          title="Storage Monitor"
          description="Pantau penggunaan penyimpanan lokal aplikasi"
        />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Gagal memuat data storage"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const status = getStorageStatus(storageData.total.percentage);
  const StatusIcon = status.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Storage Monitor"
          description="Pantau penggunaan penyimpanan lokal aplikasi"
        />
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Total Storage Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Total Storage
              </CardTitle>
              <CardDescription>
                Penggunaan storage keseluruhan dari browser
              </CardDescription>
            </div>
            <div className={`flex items-center gap-2 ${status.color}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-semibold">{status.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Terpakai</span>
              <span className="font-medium">
                {formatBytes(storageData.total.used)} / {formatBytes(storageData.total.quota)}
              </span>
            </div>
            <Progress value={storageData.total.percentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {storageData.total.percentage.toFixed(2)}% terpakai
            </p>
          </div>

          {storageData.total.percentage > 75 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Storage hampir penuh! Pertimbangkan untuk menghapus data lama atau melakukan backup dan clear.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Storage Breakdown */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* IndexedDB */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              IndexedDB
            </CardTitle>
            <CardDescription>Database lokal utama</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-bold">{formatBytes(storageData.indexedDB.size)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {storageData.indexedDB.tables.length} tabel
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Top 5 Tabel Terbesar:</p>
              {storageData.indexedDB.tables.slice(0, 5).map((table) => (
                <div key={table.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate pr-2">{table.name}</span>
                  <span className="font-medium">
                    {formatBytes(table.estimatedSize)} ({table.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* localStorage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              localStorage
            </CardTitle>
            <CardDescription>Storage sederhana key-value</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-3xl font-bold">{formatBytes(storageData.localStorage.size)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {storageData.localStorage.items} items
              </p>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Digunakan untuk settings dan data kecil lainnya
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* OPFS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              OPFS
            </CardTitle>
            <CardDescription>Origin Private File System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageData.opfs.supported ? (
              <>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold">{formatBytes(storageData.opfs.size)}</p>
                  <p className="text-sm text-muted-foreground mt-1">File storage</p>
                </div>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    OPFS aktif untuk penyimpanan file seperti foto profil
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  OPFS tidak didukung di browser ini. File disimpan sebagai base64.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Rekomendasi Optimasi</CardTitle>
          <CardDescription>Tips untuk mengoptimalkan penggunaan storage</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Lakukan backup berkala dan hapus data lama yang tidak diperlukan</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Gunakan fitur Export untuk mengarsipkan data semester sebelumnya</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Kompres gambar sebelum upload untuk menghemat storage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Hapus data jurnal atau kehadiran yang sudah sangat lama jika tidak diperlukan</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
