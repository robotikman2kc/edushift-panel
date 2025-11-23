import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { localDB, KehadiranEskul, AnggotaEskul, Ekstrakurikuler } from "@/lib/localDB";
import { Save, FileDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function KehadiranEskulPage() {
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);
  const [anggotaEskul, setAnggotaEskul] = useState<AnggotaEskul[]>([]);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [kehadiranData, setKehadiranData] = useState<Record<string, { status: string; keterangan: string }>>({});

  useEffect(() => {
    loadEskulData();
  }, []);

  useEffect(() => {
    if (eskul && tanggal) {
      loadKehadiranData();
    }
  }, [eskul, tanggal]);

  const loadEskulData = () => {
    const eskuls = localDB.select('ekstrakurikuler');
    if (eskuls.length > 0) {
      const eskulData = eskuls[0];
      setEskul(eskulData);
      
      // Load anggota aktif
      const anggota = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
        a.ekstrakurikuler_id === eskulData.id && a.status === 'aktif'
      );
      setAnggotaEskul(anggota);
    } else {
      setEskul(null);
      setAnggotaEskul([]);
    }
  };

  const loadKehadiranData = () => {
    if (!eskul || !tanggal) return;
    
    const existingKehadiran = localDB.select('kehadiran_eskul', (k: KehadiranEskul) => 
      k.ekstrakurikuler_id === eskul.id && k.tanggal === tanggal
    );

    const newData: Record<string, { status: string; keterangan: string }> = {};
    anggotaEskul.forEach((anggota: AnggotaEskul) => {
      const kehadiran = existingKehadiran.find((k: KehadiranEskul) => k.anggota_id === anggota.id);
      newData[anggota.id] = kehadiran 
        ? { status: kehadiran.status_kehadiran, keterangan: kehadiran.keterangan || "" }
        : { status: "hadir", keterangan: "" };
    });

    setKehadiranData(newData);
  };

  const handleStatusChange = (anggotaId: string, status: string) => {
    setKehadiranData(prev => ({
      ...prev,
      [anggotaId]: { ...prev[anggotaId], status }
    }));
  };

  const handleKeteranganChange = (anggotaId: string, keterangan: string) => {
    setKehadiranData(prev => ({
      ...prev,
      [anggotaId]: { ...prev[anggotaId], keterangan }
    }));
  };

  const handleSimpan = () => {
    if (!eskul || !tanggal) {
      toast.error("Data tidak lengkap");
      return;
    }

    // Delete existing kehadiran for this date
    const existingKehadiran = localDB.select('kehadiran_eskul', (k: KehadiranEskul) => 
      k.ekstrakurikuler_id === eskul.id && k.tanggal === tanggal
    );
    existingKehadiran.forEach((k: KehadiranEskul) => {
      localDB.delete('kehadiran_eskul', k.id);
    });

    // Insert new kehadiran
    let successCount = 0;
    Object.entries(kehadiranData).forEach(([anggotaId, data]) => {
      const result = localDB.insert('kehadiran_eskul', {
        ekstrakurikuler_id: eskul.id,
        anggota_id: anggotaId,
        tanggal: tanggal,
        status_kehadiran: data.status,
        keterangan: data.keterangan
      });
      if (!result.error) successCount++;
    });

    if (successCount > 0) {
      toast.success(`Kehadiran ${successCount} anggota berhasil disimpan`);
    } else {
      toast.error("Gagal menyimpan kehadiran");
    }
  };

  const columns = [
    { key: "no", label: "No" },
    { key: "nisn", label: "NISN" },
    { key: "nama_siswa", label: "Nama Siswa" },
    { key: "tingkat", label: "Tingkat" },
    { key: "nama_kelas", label: "Kelas" },
    { key: "status_kehadiran", label: "Status Kehadiran" },
    { key: "keterangan", label: "Keterangan" }
  ];

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kehadiran Ekstrakurikuler"
          description="Input kehadiran anggota ekstrakurikuler"
        />
        <Card className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Silakan buat pengaturan ekstrakurikuler terlebih dahulu di menu "Kelola Ekstrakurikuler"
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kehadiran - ${eskul.nama_eskul}`}
        description={`Jadwal: ${eskul.hari_pertemuan}, ${eskul.jam_pertemuan}`}
      />

      <Card className="p-6">
        <div className="grid gap-4 mb-6 max-w-xs">
          <div className="grid gap-2">
            <Label htmlFor="tanggal">Tanggal Pertemuan</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
        </div>

        {anggotaEskul.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggotaEskul.map((anggota: AnggotaEskul, index: number) => {
                  const status = kehadiranData[anggota.id]?.status || "hadir";
                  const keterangan = kehadiranData[anggota.id]?.keterangan || "";
                  
                  return (
                    <TableRow key={anggota.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{anggota.nisn}</TableCell>
                      <TableCell>{anggota.nama_siswa}</TableCell>
                      <TableCell>{anggota.tingkat}</TableCell>
                      <TableCell>{anggota.nama_kelas}</TableCell>
                      <TableCell>
                        <Select
                          value={status}
                          onValueChange={(value) => handleStatusChange(anggota.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hadir">Hadir</SelectItem>
                            <SelectItem value="sakit">Sakit</SelectItem>
                            <SelectItem value="izin">Izin</SelectItem>
                            <SelectItem value="alpha">Alpha</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Keterangan..."
                          value={keterangan}
                          onChange={(e) => handleKeteranganChange(anggota.id, e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleSimpan}>
                <Save className="mr-2 h-4 w-4" />
                Simpan Kehadiran
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada anggota aktif yang terdaftar
          </div>
        )}
      </Card>
    </div>
  );
}
