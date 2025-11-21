import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { indexedDB } from "@/lib/indexedDB";
import { getAllTahunAjaranWithUpcoming } from "@/lib/academicYearUtils";

interface SemesterSelectorProps {
  semester: string;
  tahunAjaran: string;
  onSemesterChange: (semester: string) => void;
  onTahunAjaranChange: (tahunAjaran: string) => void;
}

export const SemesterSelector: React.FC<SemesterSelectorProps> = ({
  semester,
  tahunAjaran,
  onSemesterChange,
  onTahunAjaranChange,
}) => {
  const [activeSemester, setActiveSemester] = useState<string>("");
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<string>("");
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<string[]>([]);

  useEffect(() => {
    loadActiveSemester();
    loadTahunAjaranOptions();
  }, []);

  const loadActiveSemester = async () => {
    try {
      const settings = await indexedDB.select("pengaturan");
      const semesterSetting = settings.find((s: any) => s.key === "semester_aktif");
      const tahunSetting = settings.find((s: any) => s.key === "tahun_ajaran_aktif");
      
      if (semesterSetting) setActiveSemester(semesterSetting.value);
      if (tahunSetting) setActiveTahunAjaran(tahunSetting.value);
    } catch (error) {
      console.error("Error loading active semester:", error);
    }
  };

  const loadTahunAjaranOptions = async () => {
    try {
      const years = await getAllTahunAjaranWithUpcoming(3);
      setTahunAjaranOptions(years);
    } catch (error) {
      console.error("Error loading tahun ajaran options:", error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="semester">Semester</Label>
        <Select value={semester} onValueChange={onSemesterChange}>
          <SelectTrigger id="semester">
            <SelectValue placeholder="Pilih semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Semester 1</SelectItem>
            <SelectItem value="2">Semester 2</SelectItem>
          </SelectContent>
        </Select>
        {activeSemester === semester && (
          <p className="text-xs text-muted-foreground">Semester aktif</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tahun-ajaran">Tahun Ajaran</Label>
        <Select value={tahunAjaran} onValueChange={onTahunAjaranChange}>
          <SelectTrigger id="tahun-ajaran">
            <SelectValue placeholder="Pilih tahun ajaran" />
          </SelectTrigger>
          <SelectContent>
            {tahunAjaranOptions.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeTahunAjaran === tahunAjaran && (
          <p className="text-xs text-muted-foreground">Tahun ajaran aktif</p>
        )}
      </div>
    </div>
  );
};
