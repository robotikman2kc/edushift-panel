import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { localAuth } from "@/lib/localAuth";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'guru';
  status: string;
  created_at: string;
}

const User = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { key: "nama", label: "Nama", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Role", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "created_at", label: "Tanggal Dibuat", sortable: true },
  ];

  const formFields = [
    { key: "nama", label: "Nama Lengkap", type: "text" as const, placeholder: "Masukkan nama lengkap", required: true },
    { key: "email", label: "Email", type: "email" as const, placeholder: "Masukkan email", required: true },
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const authUsers = localAuth.getAllUsers();
      
      // Format the data to match the expected structure
      const formattedData = authUsers.map(user => ({
        ...user,
        created_at: new Date().toLocaleDateString('id-ID'),
        status: 'Aktif'
      }));

      setUsers(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data user: " + error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (formData: Record<string, string>) => {
    try {
      // Check if user already exists
      const existingUsers = localAuth.getAllUsers();
      if (existingUsers.find(u => u.email === formData.email)) {
        toast({
          title: "Error",
          description: "Email sudah terdaftar",
          variant: "destructive",
        });
        return;
      }

      // Create new user
      localAuth.registerUser(formData.email, formData.nama, 'guru');

      toast({
        title: "Berhasil",
        description: "User baru berhasil ditambahkan",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menambahkan user: " + error,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, formData: Record<string, string>) => {
    try {
      const result = localAuth.updateUser(id, {
        nama: formData.nama,
        email: formData.email,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Berhasil",
        description: "Data user berhasil diperbarui",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memperbarui user: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = localAuth.deleteUser(id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Berhasil",
        description: "User berhasil dihapus",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus user: " + error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Daftar User" 
        description="Kelola data pengguna sistem"
      />
      
      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Cari nama, email, atau role..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        formFields={formFields}
        title="Daftar User"
        tableId="user"
      />
    </div>
  );
};

export default User;