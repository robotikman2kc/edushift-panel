import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { analyzeLocalStorage, cleanupOldData, formatBytes, CleanupItem } from "@/lib/cleanupStorage";
import { Trash2, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CleanupStorage() {
  const [items, setItems] = useState<CleanupItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const analyzed = analyzeLocalStorage();
    setItems(analyzed);
    
    // Auto-select items that should be removed
    const autoSelect = new Set(
      analyzed.filter(item => item.shouldRemove).map(item => item.key)
    );
    setSelectedKeys(autoSelect);
  };

  const handleToggle = (key: string) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedKeys(newSelected);
  };

  const handleSelectAll = () => {
    const allRemovable = new Set(
      items.filter(item => item.shouldRemove).map(item => item.key)
    );
    setSelectedKeys(allRemovable);
  };

  const handleDeselectAll = () => {
    setSelectedKeys(new Set());
  };

  const handleCleanup = () => {
    if (selectedKeys.size === 0) {
      toast.error("Tidak ada item yang dipilih");
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmCleanup = () => {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const keysArray = Array.from(selectedKeys);
      const removedCount = cleanupOldData(keysArray);
      
      toast.success(`${removedCount} item berhasil dihapus`);
      
      // Reload data
      setSelectedKeys(new Set());
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const selectedSize = items
    .filter(item => selectedKeys.has(item.key))
    .reduce((sum, item) => sum + item.size, 0);
  const removableCount = items.filter(item => item.shouldRemove).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cleanup Storage"
        description="Bersihkan data lama yang sudah tidak terpakai dari localStorage"
      />

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(totalSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dapat Dihapus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {removableCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Item tidak terpakai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dipilih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {selectedKeys.size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(selectedSize)}
            </p>
          </CardContent>
        </Card>
      </div>

      {removableCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Ditemukan {removableCount} item yang tidak terpakai.</strong>
            <br />
            Item-item ini sudah dipindahkan ke IndexedDB atau sudah tidak digunakan lagi.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Pilih Semua yang Dapat Dihapus
          </Button>
          <Button onClick={handleDeselectAll} variant="outline" size="sm">
            Batal Pilih Semua
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleCleanup}
            variant="destructive"
            size="sm"
            disabled={selectedKeys.size === 0 || loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus {selectedKeys.size > 0 ? `(${selectedKeys.size})` : ''}
          </Button>
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Data di localStorage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.key}
                className={`p-4 border rounded-lg flex items-start gap-3 ${
                  item.shouldRemove ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200' : ''
                }`}
              >
                <Checkbox
                  checked={selectedKeys.has(item.key)}
                  onCheckedChange={() => handleToggle(item.key)}
                  disabled={!item.shouldRemove && item.size > 1024 * 10} // Don't allow removing large active data
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{item.key}</p>
                    {item.shouldRemove && (
                      <Badge variant="destructive" className="text-xs">
                        Tidak Terpakai
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-muted-foreground">
                      Ukuran: <strong>{formatBytes(item.size)}</strong>
                    </span>
                    {item.reason && (
                      <span className="text-orange-600">
                        {item.reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data di localStorage
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Data</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  Anda akan menghapus <strong>{selectedKeys.size} item</strong> dari localStorage
                  dengan total ukuran <strong>{formatBytes(selectedSize)}</strong>.
                </p>
                <p className="text-orange-600 font-semibold">
                  Data yang dihapus tidak dapat dikembalikan!
                </p>
                <p>Apakah Anda yakin ingin melanjutkan?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCleanup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
