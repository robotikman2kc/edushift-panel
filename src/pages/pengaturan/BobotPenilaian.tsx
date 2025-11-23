import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Save, AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import type { Kelas, JenisPenilaian } from "@/lib/indexedDB";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { saveBobotForKelas } from "@/lib/bobotUtils";
import { getActiveTahunAjaran } from "@/lib/academicYearUtils";
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

interface BobotKategori {
  kategori_id: string;
  nama_kategori: string;
  bobot: number;
  deskripsi?: string;
}

interface BobotKelas {
  id: string;
  kelas_id: string;
  bobot_kategori: BobotKategori[];
  created_at: string;
  updated_at?: string;
}

export default function BobotPenilaian() {
  const [selectedTingkat, setSelectedTingkat] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Kelas[]>([]);
  const [categories, setCategories] = useState<JenisPenilaian[]>([]);
  const [bobotValues, setBobotValues] = useState<{ [key: string]: number }>({});
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBobot, setTotalBobot] = useState(0);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string>("");

  const tingkatOptions = [
    { value: "X", label: "Kelas X" },
    { value: "XI", label: "Kelas XI" },
    { value: "XII", label: "Kelas XII" },
  ];

  useEffect(() => {
    const initData = async () => {
      const year = await getActiveTahunAjaran();
      setActiveTahunAjaran(year);
      loadData(year);
    };
    initData();
  }, []);

  useEffect(() => {
    if (selectedTingkat) {
      console.log("Filtering tingkat:", selectedTingkat);
      console.log("All classes:", classes);
      const filtered = classes.filter(
        (kelas) => kelas.tingkat === selectedTingkat && kelas.status === "Aktif"
      );
      console.log("Filtered classes:", filtered);
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [selectedTingkat, classes]);

  useEffect(() => {
    if (selectedClass) {
      loadBobotForClass(selectedClass);
    }
  }, [selectedClass, categories]);

  useEffect(() => {
    const total = Object.values(bobotValues).reduce((sum, value) => sum + (value || 0), 0);
    setTotalBobot(total);
  }, [bobotValues]);

  const loadData = async (year?: string) => {
    try {
      const currentYear = year || activeTahunAjaran || await getActiveTahunAjaran();
      
      const [kelasData, kategoriData] = await Promise.all([
        indexedDB.select("kelas", (k: any) => k.tahun_ajaran === currentYear),
        indexedDB.select("jenis_penilaian"),
      ]);

      console.log("Loaded kelas data:", kelasData);
      console.log("Total kelas:", kelasData.length);
      
      setClasses(kelasData as Kelas[]);
      const activeCategories = (kategoriData as JenisPenilaian[]).filter(
        (k) => k.status === "Aktif"
      );
      
      console.log("All kategori data:", kategoriData);
      console.log("Active categories with details:", activeCategories.map(c => ({
        id: c.id,
        nama: c.nama_kategori,
        bobot: c.bobot,
        status: c.status
      })));
      
      setCategories(activeCategories);
      
      console.log("Active categories:", activeCategories.length);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    }
  };

  const loadBobotForClass = async (kelasId: string) => {
    try {
      // Load saved bobot from pengaturan table
      const savedBobot = await indexedDB.select("pengaturan");
      const bobotKey = `bobot_penilaian_${kelasId}`;
      const excludedKey = `excluded_categories_${kelasId}`;
      
      const bobotData = savedBobot.find((s: any) => s.key === bobotKey);
      const excludedData = savedBobot.find((s: any) => s.key === excludedKey);

      // Load excluded categories
      if (excludedData && excludedData.value) {
        setExcludedCategories(JSON.parse(excludedData.value));
      } else {
        setExcludedCategories([]);
      }

      if (bobotData && bobotData.value) {
        const parsedBobot = JSON.parse(bobotData.value);
        setBobotValues(parsedBobot);
      } else {
        // Initialize with default bobot from categories
        const defaultBobot: { [key: string]: number } = {};
        categories.forEach((cat) => {
          defaultBobot[cat.id] = cat.bobot || 0;
        });
        setBobotValues(defaultBobot);
      }
    } catch (error) {
      console.error("Error loading bobot:", error);
      // Initialize with default values
      const defaultBobot: { [key: string]: number } = {};
      categories.forEach((cat) => {
        defaultBobot[cat.id] = cat.bobot || 0;
      });
      setBobotValues(defaultBobot);
      setExcludedCategories([]);
    }
  };

  const handleBobotChange = (categoryId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBobotValues((prev) => ({
      ...prev,
      [categoryId]: numValue,
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) {
      toast({
        title: "Peringatan",
        description: "Silakan pilih kelas terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (totalBobot !== 100) {
      toast({
        title: "Validasi Gagal",
        description: `Total bobot harus 100%. Saat ini: ${totalBobot}%`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save custom bobot for this kelas
      await saveBobotForKelas(selectedClass, bobotValues);

      // Save excluded categories
      const excludedKey = `excluded_categories_${selectedClass}`;
      const existing = await indexedDB.select("pengaturan");
      const existingExcluded = existing.find((s: any) => s.key === excludedKey);

      if (existingExcluded) {
        await indexedDB.update("pengaturan", existingExcluded.id, {
          value: JSON.stringify(excludedCategories),
        });
      } else {
        await indexedDB.insert("pengaturan", {
          key: excludedKey,
          value: JSON.stringify(excludedCategories),
        });
      }

      toast({
        title: "Berhasil",
        description: "Bobot penilaian berhasil disimpan dan akan digunakan untuk kelas ini",
      });
    } catch (error) {
      console.error("Error saving bobot:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan bobot penilaian",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = () => {
    // Add to excluded list
    setExcludedCategories((prev) => [...prev, categoryToDelete]);
    
    // Set bobot to 0
    setBobotValues((prev) => ({
      ...prev,
      [categoryToDelete]: 0,
    }));

    setIsDeleteDialogOpen(false);
    setCategoryToDelete("");
    
    toast({
      title: "Berhasil",
      description: "Kategori berhasil dihapus dari kelas ini",
    });
  };

  const handleRestoreCategory = (categoryId: string) => {
    // Remove from excluded list
    setExcludedCategories((prev) => prev.filter((id) => id !== categoryId));
    
    // Restore default bobot
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setBobotValues((prev) => ({
        ...prev,
        [categoryId]: category.bobot || 0,
      }));
    }

    toast({
      title: "Berhasil",
      description: "Kategori berhasil dipulihkan",
    });
  };

  const handleReset = () => {
    if (selectedClass) {
      loadBobotForClass(selectedClass);
      toast({
        title: "Reset",
        description: "Bobot penilaian direset ke nilai tersimpan",
      });
    }
  };

  const getProgressColor = () => {
    if (totalBobot === 100) return "bg-green-500";
    if (totalBobot > 100) return "bg-red-500";
    return "bg-yellow-500";
  };

  const selectedClassName = classes.find((k) => k.id === selectedClass)?.nama_kelas || "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bobot Penilaian"
        description={`Atur bobot penilaian untuk setiap kategori per kelas - Tahun Ajaran ${activeTahunAjaran}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Kelas</CardTitle>
            <CardDescription>
              Pilih tingkat dan kelas untuk mengatur bobot penilaian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat</Label>
              <Select value={selectedTingkat} onValueChange={setSelectedTingkat}>
                <SelectTrigger id="tingkat">
                  <SelectValue placeholder="Pilih Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedTingkat}
              >
                <SelectTrigger id="kelas">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2">Total Bobot</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-bold">{totalBobot}%</span>
                  </div>
                  <Progress value={totalBobot} className={getProgressColor()} />
                  {totalBobot === 100 ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Total bobot sudah 100%
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {totalBobot > 100
                          ? `Total bobot melebihi 100% (${totalBobot}%)`
                          : `Total bobot kurang dari 100% (${totalBobot}%)`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bobot Configuration Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedClassName
                ? `Pengaturan Bobot - ${selectedClassName}`
                : "Pengaturan Bobot Penilaian"}
            </CardTitle>
            <CardDescription>
              Atur bobot untuk setiap kategori penilaian (dalam persen)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClass ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Silakan pilih tingkat dan kelas untuk mengatur bobot penilaian</p>
              </div>
            ) : (
              <div className="space-y-6">
                {categories.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Belum ada kategori penilaian. Silakan tambahkan kategori terlebih dahulu.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-4">
                      {categories.map((category) => {
                        const isExcluded = excludedCategories.includes(category.id);
                        
                        return (
                          <div
                            key={category.id}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                              isExcluded 
                                ? "bg-muted/50 opacity-60" 
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <div className="flex-1">
                              <Label className="text-base font-medium">
                                {category.nama_kategori}
                                {isExcluded && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Tidak digunakan)
                                  </span>
                                )}
                              </Label>
                              {category.deskripsi && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {category.deskripsi}
                                </p>
                              )}
                            </div>
                            {isExcluded ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreCategory(category.id)}
                              >
                                Pulihkan
                              </Button>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={bobotValues[category.id] || 0}
                                    onChange={(e) =>
                                      handleBobotChange(category.id, e.target.value)
                                    }
                                    className="w-24 text-right"
                                  />
                                  <span className="text-sm font-medium">%</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading || totalBobot !== 100}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Menyimpan..." : "Simpan Bobot"}
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Total bobot dari semua kategori penilaian harus tepat 100%</p>
          <p>• Setiap kelas dapat memiliki pengaturan bobot yang berbeda</p>
          <p>• Bobot digunakan untuk menghitung nilai akhir siswa berdasarkan kategori penilaian</p>
          <p>• Kategori yang dihapus tidak akan ditampilkan di kelas ini dan bobotnya otomatis menjadi 0%</p>
          <p>• Kategori yang dihapus dapat dipulihkan kembali dengan tombol "Pulihkan"</p>
          <p>• Pastikan untuk menyimpan perubahan sebelum berpindah ke kelas lain</p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori dari Kelas</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini dari kelas{" "}
              {selectedClassName}? Kategori akan disembunyikan dan bobotnya akan menjadi 0%.
              Anda dapat memulihkannya kembali nanti jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
