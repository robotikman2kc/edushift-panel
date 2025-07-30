import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const User = () => {
  const [users] = useState([
    {
      id: 1,
      nama: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "Aktif",
      tanggal_dibuat: "2024-01-15"
    },
    {
      id: 2,
      nama: "Jane Smith",
      email: "jane@example.com",
      role: "Guru",
      status: "Aktif",
      tanggal_dibuat: "2024-01-20"
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const columns = [
    { key: "nama", label: "Nama", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "tanggal_dibuat", label: "Tanggal Dibuat", sortable: true },
  ];

  const handleAdd = () => {
    setIsDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    toast({
      title: "Edit User",
      description: `Mengedit user: ${user.nama}`,
    });
  };

  const handleDelete = (user: any) => {
    toast({
      title: "Hapus User",
      description: `Menghapus user: ${user.nama}`,
      variant: "destructive",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Data",
      description: "Data user berhasil diexport",
    });
  };

  const handleImport = () => {
    toast({
      title: "Import Data",
      description: "Memulai proses import data user",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "User Baru",
      description: "User baru berhasil ditambahkan",
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Management User" 
        description="Kelola data pengguna sistem"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>Tambah User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input id="nama" placeholder="Masukkan nama lengkap" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Masukkan email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Masukkan password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="guru">Guru</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Cari nama, email, atau role..."
      />
    </div>
  );
};

export default User;