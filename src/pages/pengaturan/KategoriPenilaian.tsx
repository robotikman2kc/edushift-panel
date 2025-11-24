import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { DataTable } from "@/components/common/DataTable";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import type { JenisPenilaian } from "@/lib/indexedDB";
import { Badge } from "@/components/ui/badge";

export default function KategoriPenilaian() {
  const [categories, setCategories] = useState<JenisPenilaian[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JenisPenilaian | null>(null);
  const [deletingId, setDeletingId] = useState<string>("");
  const [formData, setFormData] = useState({
    nama_kategori: "",
    bobot: "",
    deskripsi: "",
    status: "Aktif",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await indexedDB.select("jenis_penilaian");
      setCategories(data as JenisPenilaian[]);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kategori penilaian",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nama_kategori: "",
      bobot: "",
      deskripsi: "",
      status: "Aktif",
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: JenisPenilaian) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nama_kategori: category.nama_kategori,
        bobot: category.bobot?.toString() || "",
        deskripsi: category.deskripsi || "",
        status: category.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.nama_kategori.trim()) {
      toast({
        title: "Validasi Gagal",
        description: "Nama kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    const bobot = parseFloat(formData.bobot) || 0;
    if (bobot < 0 || bobot > 100) {
      toast({
        title: "Validasi Gagal",
        description: "Bobot harus antara 0-100",
        variant: "destructive",
      });
      return;
    }

    try {
      const categoryData = {
        nama_kategori: formData.nama_kategori.trim(),
        bobot: bobot,
        deskripsi: formData.deskripsi.trim(),
        status: formData.status,
      };

      if (editingCategory) {
        await indexedDB.update("jenis_penilaian", editingCategory.id, categoryData);
        toast({
          variant: "success",
          title: "Berhasil",
          description: "Kategori penilaian berhasil diperbarui",
        });
      } else {
        await indexedDB.insert("jenis_penilaian", categoryData);
        toast({
          variant: "success",
          title: "Berhasil",
          description: "Kategori penilaian berhasil ditambahkan",
        });
      }

      handleCloseDialog();
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan kategori penilaian",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await indexedDB.delete("jenis_penilaian", deletingId);
      toast({
        variant: "success",
        title: "Berhasil",
        description: "Kategori penilaian berhasil dihapus",
      });
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus kategori penilaian",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId("");
    }
  };

  const columns = [
    {
      key: "nama_kategori",
      label: "Nama Kategori",
      sortable: true,
    },
    {
      key: "bobot",
      label: "Bobot Default",
      sortable: true,
    },
    {
      key: "deskripsi",
      label: "Deskripsi",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
    },
  ];

  const tableData = categories.map((cat) => ({
    ...cat,
    bobot: `${cat.bobot || 0}%`,
    deskripsi: cat.deskripsi || "-",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori Penilaian"
        description="Kelola kategori penilaian seperti PH, UTS, UAS, dll"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Kategori Penilaian</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_kategori">
                      Nama Kategori <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nama_kategori"
                      placeholder="Contoh: PH1, UTS, UAS"
                      value={formData.nama_kategori}
                      onChange={(e) =>
                        setFormData({ ...formData, nama_kategori: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bobot">Bobot Default (%)</Label>
                    <Input
                      id="bobot"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0-100"
                      value={formData.bobot}
                      onChange={(e) =>
                        setFormData({ ...formData, bobot: e.target.value })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Bobot default ini dapat disesuaikan per kelas di menu Bobot Penilaian
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Textarea
                      id="deskripsi"
                      placeholder="Deskripsi kategori penilaian"
                      value={formData.deskripsi}
                      onChange={(e) =>
                        setFormData({ ...formData, deskripsi: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Batal
                  </Button>
                  <Button onClick={handleSave}>Simpan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead>Bobot Default</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Belum ada data kategori penilaian
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.nama_kategori}</TableCell>
                        <TableCell>{cat.bobot || 0}%</TableCell>
                        <TableCell>{cat.deskripsi || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={cat.status === "Aktif" ? "default" : "secondary"}>
                            {cat.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(cat)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(cat.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori Penilaian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori penilaian ini? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
