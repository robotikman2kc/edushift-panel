import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { localDB, AnggotaEskul, Ekstrakurikuler } from "@/lib/localDB";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function KelolaAnggota() {
  const [anggota, setAnggota] = useState<AnggotaEskul[]>([]);
  const [eskul, setEskul] = useState<Ekstrakurikuler | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load eskul data
    const eskuls = localDB.select('ekstrakurikuler');
    if (eskuls.length > 0) {
      const eskulData = eskuls[0];
      setEskul(eskulData);
      
      // Load anggota for this eskul
      const anggotaData = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
        a.ekstrakurikuler_id === eskulData.id
      );
      setAnggota(anggotaData);
    } else {
      setEskul(null);
      setAnggota([]);
    }
  };

  const columns = [
    { key: "nisn", label: "NISN", sortable: true },
    { key: "nama_siswa", label: "Nama Siswa", sortable: true },
    { key: "tingkat", label: "Tingkat", sortable: true },
    { key: "nama_kelas", label: "Kelas", sortable: true },
    { key: "tanggal_masuk", label: "Tanggal Masuk", sortable: true },
    { key: "status", label: "Status", sortable: false }
  ];

  const formFields = [
    { key: "nisn", label: "NISN", type: "text" as const, placeholder: "Nomor Induk Siswa Nasional", required: true },
    { key: "nama_siswa", label: "Nama Siswa", type: "text" as const, placeholder: "Nama lengkap siswa", required: true },
    { key: "tingkat", label: "Tingkat", type: "select" as const, placeholder: "Pilih tingkat", required: true, options: [
      { value: "X", label: "X" },
      { value: "XI", label: "XI" },
      { value: "XII", label: "XII" }
    ]},
    { key: "nama_kelas", label: "Nama Kelas", type: "text" as const, placeholder: "Contoh: X IPA 1", required: true },
    { key: "tanggal_masuk", label: "Tanggal Masuk", type: "date" as const, required: true }
  ];

  // Helper function untuk parse tanggal dari berbagai format
  const parseDate = (dateStr: any): string | undefined => {
    if (!dateStr) return undefined;
    
    // Handle Excel serial dates
    if (typeof dateStr === 'number' || !isNaN(Number(dateStr))) {
      const serialNumber = typeof dateStr === 'number' ? dateStr : Number(dateStr);
      const EXCEL_EPOCH_OFFSET = 25569;
      const MILLISECONDS_PER_DAY = 86400000;
      const unixTimestamp = (serialNumber - EXCEL_EPOCH_OFFSET) * MILLISECONDS_PER_DAY;
      const jsDate = new Date(unixTimestamp);
      
      if (!isNaN(jsDate.getTime())) {
        const year = jsDate.getUTCFullYear();
        const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    const dateString = String(dateStr);
    
    // Check if already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      return dateString.trim();
    }
    
    // Parse DD/MM/YYYY or D/M/YYYY format
    const parts = dateString.trim().split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      const isoFormat = `${year}-${month}-${day}`;
      const parsedDate = new Date(isoFormat);
      
      if (!isNaN(parsedDate.getTime())) {
        return isoFormat;
      }
    }
    
    return undefined;
  };

  const handleAdd = async (formData: Record<string, string>) => {
    if (!eskul) {
      toast.error("Pengaturan ekstrakurikuler belum dibuat");
      return;
    }

    const dataToSave = {
      ...formData,
      ekstrakurikuler_id: eskul.id,
      status: "aktif"
    };

    const result = localDB.insert('anggota_eskul', dataToSave);
    if (result.error) {
      toast.error("Gagal menambahkan anggota");
    } else {
      toast.success("Anggota berhasil ditambahkan");
      loadData();
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    const result = localDB.update('anggota_eskul', id, formData);
    if (result.error) {
      toast.error("Gagal mengupdate anggota");
    } else {
      toast.success("Anggota berhasil diupdate");
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const result = localDB.delete('anggota_eskul', id);
    if (result.error) {
      toast.error("Gagal menghapus anggota");
    } else {
      toast.success("Anggota berhasil dihapus");
      loadData();
    }
  };

  const handleImport = async (data: Record<string, string>[]) => {
    if (!eskul) {
      toast.error("Pengaturan ekstrakurikuler belum dibuat");
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          // Skip baris kosong atau baris instruksi
          if (!row.NISN || !row["Nama Siswa"] || 
              String(row.NISN).trim() === '' || 
              String(row["Nama Siswa"]).trim() === '' ||
              String(row.Tingkat).includes('Format:') ||
              String(row["Tanggal Masuk"]).includes('Format:')) {
            continue;
          }

          // Cek apakah NISN sudah ada - jika ada, update data
          const allAnggota = localDB.select('anggota_eskul', (a: AnggotaEskul) => 
            a.ekstrakurikuler_id === eskul.id
          );
          const existingAnggota = allAnggota.find(a => a.nisn === row.NISN);

          const anggotaData = {
            ekstrakurikuler_id: eskul.id,
            nisn: String(row.NISN).trim(),
            nama_siswa: String(row["Nama Siswa"]).trim(),
            tingkat: String(row.Tingkat).trim(),
            nama_kelas: String(row["Nama Kelas"]).trim(),
            tanggal_masuk: parseDate(row["Tanggal Masuk"]) || new Date().toISOString().split('T')[0],
            status: "aktif"
          };

          if (existingAnggota) {
            // Update existing
            const result = localDB.update('anggota_eskul', existingAnggota.id, anggotaData);
            if (result.error) {
              throw new Error(result.error);
            }
          } else {
            // Insert new
            const result = localDB.insert('anggota_eskul', anggotaData);
            if (result.error) {
              throw new Error(result.error);
            }
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`NISN ${row.NISN}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Berhasil import ${successCount} anggota`);
        loadData();
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} data gagal diimport`, {
          description: errors.slice(0, 3).join('; ')
        });
      }
    } catch (error: any) {
      toast.error("Gagal import data: " + error.message);
    }
  };

  // Format data untuk tampilan tabel
  const formattedAnggota = anggota.map((item, index) => ({
    ...item,
    no: index + 1
  }));

  if (!eskul) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Kelola Anggota Ekstrakurikuler"
          description="Kelola data anggota ekstrakurikuler"
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
        title={`Kelola Anggota - ${eskul.nama_eskul}`}
        description="Kelola data anggota ekstrakurikuler"
      />

      <DataTable
        columns={columns}
        data={formattedAnggota}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={handleImport}
        formFields={formFields}
        searchPlaceholder="Cari anggota..."
        title="Data Anggota Ekstrakurikuler"
        tableId="anggota-eskul"
      />
    </div>
  );
}
