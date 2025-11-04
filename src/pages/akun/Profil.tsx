import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { User, Mail, Save, Eye, EyeOff, Camera, Upload, Phone, MapPin, Calendar as CalendarIcon, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  email: string;
  nama: string;
  role: string;
  status: string;
  avatar_url?: string;
  telepon?: string;
  alamat?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  bio?: string;
  jenis_kelamin?: 'Laki-laki' | 'Perempuan';
}

const Profil = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    telepon: "",
    alamat: "",
    tanggal_lahir: "",
    tempat_lahir: "",
    bio: "",
    jenis_kelamin: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    console.log('Fetching profile, user:', user);
    
    if (!user) {
      console.log('No user found, loading default admin');
      // Jika tidak ada user dari auth, ambil user admin default
      try {
        const allUsers = await indexedDB.select('users' as any);
        console.log('All users:', allUsers);
        
        if (allUsers.length > 0) {
          const adminUser = allUsers.find((u: any) => u.role === 'admin') || allUsers[0];
          console.log('Using user:', adminUser);
          
          setProfile(adminUser);
          setFormData({
            nama: adminUser.nama,
            email: adminUser.email,
            telepon: adminUser.telepon || "",
            alamat: adminUser.alamat || "",
            tanggal_lahir: adminUser.tanggal_lahir || "",
            tempat_lahir: adminUser.tempat_lahir || "",
            bio: adminUser.bio || "",
            jenis_kelamin: adminUser.jenis_kelamin || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        }
      } catch (error) {
        console.error('Error fetching default user:', error);
      }
      setIsLoading(false);
      return;
    }
    
    try {
      const userData = await indexedDB.selectById('users' as any, user.id);
      console.log('User data:', userData);
      
      if (!userData) {
        throw new Error('Profile not found');
      }

      setProfile(userData);
      setFormData({
        nama: userData.nama,
        email: userData.email,
        telepon: userData.telepon || "",
        alamat: userData.alamat || "",
        tanggal_lahir: userData.tanggal_lahir || "",
        tempat_lahir: userData.tempat_lahir || "",
        bio: userData.bio || "",
        jenis_kelamin: userData.jenis_kelamin || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Gagal memuat profil",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        throw new Error("Password baru dan konfirmasi password tidak sama");
      }

      // Tentukan user ID yang akan di-update
      const userId = user?.id || profile?.id;
      if (!userId) {
        throw new Error('User ID tidak ditemukan');
      }

      // Update profile data
      const result = await indexedDB.update('users' as any, userId, {
        nama: formData.nama,
        email: formData.email,
        telepon: formData.telepon,
        alamat: formData.alamat,
        tanggal_lahir: formData.tanggal_lahir,
        tempat_lahir: formData.tempat_lahir,
        bio: formData.bio,
        jenis_kelamin: formData.jenis_kelamin as 'Laki-laki' | 'Perempuan'
      });

      if (result.error) {
        throw new Error(result.error);
      }

      await fetchProfile();
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui profil",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const userId = user?.id || profile?.id;
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Simple file to base64 conversion for local storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Update user profile with avatar URL (base64)
        const result = await indexedDB.update('users' as any, userId, { avatar_url: base64 });
        
        if (result.error) {
          throw new Error(result.error);
        }

        // Refresh profile
        await fetchProfile();

        toast({
          title: "Berhasil",
          description: "Foto profil berhasil diperbarui"
        });
        
        setIsUploadingAvatar(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Gagal membaca file gambar",
          variant: "destructive"
        });
        setIsUploadingAvatar(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Gagal mengunggah foto profil",
        variant: "destructive"
      });
      setIsUploadingAvatar(false);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        nama: profile.nama,
        email: profile.email,
        telepon: profile.telepon || "",
        alamat: profile.alamat || "",
        tanggal_lahir: profile.tanggal_lahir || "",
        tempat_lahir: profile.tempat_lahir || "",
        bio: profile.bio || "",
        jenis_kelamin: profile.jenis_kelamin || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profil" description="Kelola informasi profil Anda" />
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profil" description="Kelola informasi profil Anda" />
        <div className="text-center text-muted-foreground">
          Profil tidak ditemukan
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Profil" 
        description="Kelola informasi profil Anda"
      />

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Profil
            </CardTitle>
            <CardDescription>
              Kelola informasi dasar profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url} alt={profile.nama} />
                <AvatarFallback className="text-lg">
                  {profile.nama.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">Foto Profil</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload foto profil Anda (JPG, PNG, maksimal 2MB)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Upload className="mr-2 h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-3 w-3" />
                        Upload Foto
                      </>
                    )}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telepon">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telepon"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={formData.telepon}
                      onChange={(e) => setFormData(prev => ({ ...prev, telepon: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                  <Select
                    value={formData.jenis_kelamin}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jenis_kelamin: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="jenis_kelamin">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tempat_lahir"
                      placeholder="Jakarta"
                      value={formData.tempat_lahir}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempat_lahir: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tanggal_lahir"
                      type="date"
                      value={formData.tanggal_lahir}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="alamat"
                    placeholder="Masukkan alamat lengkap"
                    value={formData.alamat}
                    onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                    disabled={!isEditing}
                    className="pl-10 min-h-20"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Deskripsi</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    placeholder="Ceritakan tentang diri Anda"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    className="pl-10 min-h-24"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={profile.role}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Input
                    value={profile.status}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profil
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Save className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>
                Kosongkan jika tidak ingin mengubah password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Masukkan password baru"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Konfirmasi password baru"
                />
              </div>

              {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-destructive">
                  Password tidak sama
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profil;