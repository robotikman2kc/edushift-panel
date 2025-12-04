import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getActiveTahunAjaran, setActiveTahunAjaran, getAllTahunAjaranWithUpcoming } from "@/lib/academicYearUtils";

export function AcademicYearSelector() {
  const [activeTahunAjaran, setActiveTahunAjaranState] = useState("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveYear();
    loadAvailableYears();
  }, []);

  const loadActiveYear = async () => {
    const year = await getActiveTahunAjaran();
    setActiveTahunAjaranState(year);
  };

  const loadAvailableYears = async () => {
    const years = await getAllTahunAjaranWithUpcoming(3);
    setAvailableYears(years);
  };

  const handleYearChange = async (newYear: string) => {
    try {
      await setActiveTahunAjaran(newYear);
      setActiveTahunAjaranState(newYear);
      
      toast({
        variant: "success",
        title: "Tahun Ajaran Berubah",
        description: `Sekarang menampilkan data tahun ajaran ${newYear}`,
      });
      
      // Reload halaman agar semua data ter-refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah tahun ajaran",
        variant: "destructive"
      });
    }
  };

  if (availableYears.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium hidden sm:inline">Tahun Ajaran:</span>
      <Select value={activeTahunAjaran} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[140px] sm:w-[160px]">
          <SelectValue placeholder="Pilih tahun" />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge 
        variant="outline" 
        className="hidden sm:inline-flex bg-emerald-100 text-emerald-700 border-emerald-300 font-medium dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700"
      >
        Aktif
      </Badge>
    </div>
  );
}
