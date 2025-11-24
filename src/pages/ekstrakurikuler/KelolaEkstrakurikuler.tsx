import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eskulDB } from "@/lib/eskulDB";
import { Save } from "lucide-react";
import { toast } from "sonner";

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function KelolaEkstrakurikuler() {
  const [eskulId, setEskulId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    nama_eskul: "",
    pembimbing: "",
    hari_pertemuan: "",
    jam_pertemuan: "",
    deskripsi: "",
    status: "aktif"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const eskuls = await eskulDB.select('ekstrakurikuler');
      if (eskuls.length > 0) {
        const eskul = eskuls[0];
        setEskulId(eskul.id);
        setFormData({
          nama_eskul: eskul.nama_eskul,
          pembimbing: eskul.pembimbing,
          hari_pertemuan: eskul.hari_pertemuan,
          jam_pertemuan: eskul.jam_pertemuan,
          deskripsi: eskul.deskripsi || "",
          status: eskul.status
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama_eskul || !formData.pembimbing || !formData.hari_pertemuan || !formData.jam_pertemuan) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    if (eskulId) {
      // Update existing
      const result = await eskulDB.update('ekstrakurikuler', eskulId, formData);
      if (result.error) {
        toast.error("Gagal mengupdate pengaturan ekstrakurikuler");
      } else {
        toast.success("Pengaturan ekstrakurikuler berhasil diupdate");
      }
    } else {
      // Create new
      const result = await eskulDB.insert('ekstrakurikuler', formData);
      if (result.error) {
        toast.error("Gagal menyimpan pengaturan ekstrakurikuler");
      } else {
        toast.success("Pengaturan ekstrakurikuler berhasil disimpan");
        if (result.data) {
          setEskulId(result.data.id);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pengaturan Ekstrakurikuler"
          description="Kelola pengaturan ekstrakurikuler sekolah"
        />
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Ekstrakurikuler"
        description="Kelola pengaturan ekstrakurikuler sekolah"
      />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="nama_eskul">Nama Ekstrakurikuler *</Label>
            <Input
              id="nama_eskul"
              value={formData.nama_eskul}
              onChange={(e) => setFormData({ ...formData, nama_eskul: e.target.value })}
              placeholder="Contoh: Pramuka"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pembimbing">Guru Pembimbing *</Label>
            <Input
              id="pembimbing"
              value={formData.pembimbing}
              onChange={(e) => setFormData({ ...formData, pembimbing: e.target.value })}
              placeholder="Nama guru pembimbing ekstrakurikuler"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="hari_pertemuan">Hari Pertemuan *</Label>
              <Select
                value={formData.hari_pertemuan}
                onValueChange={(value) => setFormData({ ...formData, hari_pertemuan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {HARI_OPTIONS.map((hari) => (
                    <SelectItem key={hari} value={hari}>
                      {hari}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jam_pertemuan">Jam Pertemuan *</Label>
              <Input
                id="jam_pertemuan"
                type="time"
                value={formData.jam_pertemuan}
                onChange={(e) => setFormData({ ...formData, jam_pertemuan: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Deskripsi ekstrakurikuler"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
