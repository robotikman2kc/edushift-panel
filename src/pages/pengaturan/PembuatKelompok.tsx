import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { indexedDB } from "@/lib/indexedDB";
import { Shuffle, Users, Copy, Download, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Siswa {
  id: string;
  nisn: string;
  nama_siswa: string;
  kelas_id: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
}

interface Kelas {
  id: string;
  nama_kelas: string;
}

interface MataPelajaran {
  id: string;
  nama_mata_pelajaran: string;
}

interface Group {
  groupNumber: number;
  members: Siswa[];
}

const PembuatKelompok = () => {
  const [kelasOptions, setKelasOptions] = useState<Kelas[]>([]);
  const [mataPelajaranOptions, setMataPelajaranOptions] = useState<MataPelajaran[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState<string>("");
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMethod, setGroupMethod] = useState<"by-count" | "by-size">("by-count");
  const [groupCount, setGroupCount] = useState<number>(4);
  const [groupSize, setGroupSize] = useState<number>(5);
  const [balanceGender, setBalanceGender] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKelas();
    loadMataPelajaran();
  }, []);

  useEffect(() => {
    if (selectedKelas) {
      loadSiswa();
    }
  }, [selectedKelas]);

  const loadKelas = async () => {
    try {
      const kelasData = await indexedDB.select("kelas");
      setKelasOptions(kelasData.sort((a: any, b: any) => a.nama_kelas.localeCompare(b.nama_kelas)));
    } catch (error) {
      console.error("Error loading kelas:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive",
      });
    }
  };

  const loadMataPelajaran = async () => {
    try {
      const mapelData = await indexedDB.select("mata_pelajaran");
      setMataPelajaranOptions(mapelData.sort((a: any, b: any) => a.nama_mata_pelajaran.localeCompare(b.nama_mata_pelajaran)));
    } catch (error) {
      console.error("Error loading mata pelajaran:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data mata pelajaran",
        variant: "destructive",
      });
    }
  };

  const loadSiswa = async () => {
    try {
      const allSiswa = await indexedDB.select("siswa");
      const filteredSiswa = allSiswa.filter((s: Siswa) => s.kelas_id === selectedKelas);
      setSiswaList(filteredSiswa);
      setGroups([]);
    } catch (error) {
      console.error("Error loading siswa:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive",
      });
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const createGroups = () => {
    if (siswaList.length === 0) {
      toast({
        title: "Tidak Ada Siswa",
        description: "Pilih kelas yang memiliki siswa terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let newGroups: Group[] = [];

      // Determine number of groups
      const numGroups = groupMethod === "by-count" 
        ? Math.min(groupCount, siswaList.length)
        : Math.ceil(siswaList.length / groupSize);

      if (balanceGender) {
        // Separate students by gender
        const lakiLaki = siswaList.filter(s => s.jenis_kelamin === "Laki-laki");
        const perempuan = siswaList.filter(s => s.jenis_kelamin === "Perempuan");

        // Shuffle each gender group
        const shuffledLakiLaki = shuffleArray(lakiLaki);
        const shuffledPerempuan = shuffleArray(perempuan);

        // Distribute males with base + remainder logic
        const maleGroups: Siswa[][] = [];
        const maleBase = Math.floor(lakiLaki.length / numGroups);
        const maleRemainder = lakiLaki.length % numGroups;
        
        let maleIndex = 0;
        for (let i = 0; i < numGroups; i++) {
          const size = maleBase + (i < maleRemainder ? 1 : 0);
          maleGroups.push(shuffledLakiLaki.slice(maleIndex, maleIndex + size));
          maleIndex += size;
        }

        // Distribute females with base + remainder logic
        const femaleGroups: Siswa[][] = [];
        const femaleBase = Math.floor(perempuan.length / numGroups);
        const femaleRemainder = perempuan.length % numGroups;
        
        let femaleIndex = 0;
        for (let i = 0; i < numGroups; i++) {
          const size = femaleBase + (i < femaleRemainder ? 1 : 0);
          femaleGroups.push(shuffledPerempuan.slice(femaleIndex, femaleIndex + size));
          femaleIndex += size;
        }

        console.log('Male distribution:', maleGroups.map(g => g.length));
        console.log('Female distribution before reverse:', femaleGroups.map(g => g.length));

        // Reverse female distribution to balance group sizes
        femaleGroups.reverse();
        
        console.log('Female distribution after reverse:', femaleGroups.map(g => g.length));

        // Combine males and females into groups
        for (let i = 0; i < numGroups; i++) {
          const combinedMembers = [...maleGroups[i], ...femaleGroups[i]];
          newGroups.push({
            groupNumber: i + 1,
            members: shuffleArray(combinedMembers), // Shuffle to randomize order within group
          });
        }

        console.log('Final group sizes:', newGroups.map(g => `${g.groupNumber}: ${g.members.length}`));

      } else {
        // Original random distribution with better balancing
        const shuffledSiswa = shuffleArray(siswaList);

        if (groupMethod === "by-count") {
          // Bagi berdasarkan jumlah kelompok dengan distribusi merata
          const actualGroupCount = Math.min(groupCount, siswaList.length);
          const baseSize = Math.floor(siswaList.length / actualGroupCount);
          const remainder = siswaList.length % actualGroupCount;

          let currentIndex = 0;
          for (let i = 0; i < actualGroupCount; i++) {
            const size = baseSize + (i < remainder ? 1 : 0);
            newGroups.push({
              groupNumber: i + 1,
              members: shuffledSiswa.slice(currentIndex, currentIndex + size),
            });
            currentIndex += size;
          }
        } else {
          // Bagi berdasarkan ukuran kelompok
          const actualGroupSize = Math.min(groupSize, siswaList.length);
          let currentIndex = 0;
          let groupNumber = 1;

          while (currentIndex < shuffledSiswa.length) {
            const members = shuffledSiswa.slice(currentIndex, currentIndex + actualGroupSize);
            newGroups.push({
              groupNumber,
              members,
            });
            currentIndex += actualGroupSize;
            groupNumber++;
          }
        }
      }

      setGroups(newGroups);
      toast({
        title: "Berhasil",
        description: `${newGroups.length} kelompok telah dibuat`,
      });
    } catch (error) {
      console.error("Error creating groups:", error);
      toast({
        title: "Error",
        description: "Gagal membuat kelompok",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (groups.length === 0) return;

    const selectedKelasName = kelasOptions.find(k => k.id === selectedKelas)?.nama_kelas || "";
    const selectedMapelName = selectedMapel && selectedMapel !== "none" 
      ? mataPelajaranOptions.find(m => m.id === selectedMapel)?.nama_mata_pelajaran || ""
      : "";
    
    let text = `DAFTAR KELOMPOK - ${selectedKelasName}\n`;
    if (selectedMapelName) {
      text += `Mata Pelajaran: ${selectedMapelName}\n`;
    }
    text += `${"=".repeat(50)}\n\n`;

    groups.forEach((group) => {
      text += `KELOMPOK ${group.groupNumber} (${group.members.length} siswa)\n`;
      group.members.forEach((member, idx) => {
        text += `${idx + 1}. ${member.nama_siswa}\n`;
      });
      text += "\n";
    });

    navigator.clipboard.writeText(text);
    toast({
      title: "Berhasil",
      description: "Daftar kelompok berhasil disalin ke clipboard",
    });
  };

  const exportToPDF = async () => {
    if (groups.length === 0) return;

    setLoading(true);

    try {
      const jsPDF = (await import("jspdf")).jsPDF;
      const autoTable = (await import("jspdf-autotable")).default;

      const { getCustomPDFTemplate } = await import("@/lib/exportUtils");
      const template = getCustomPDFTemplate("attendance");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = template.layout.margins.top;

      doc.setFont(template.styling.fontFamily);

      // Title
      doc.setFontSize(template.styling.fontSize.title);
      doc.setTextColor(0, 0, 0);
      const selectedKelasName = kelasOptions.find(k => k.id === selectedKelas)?.nama_kelas || "";
      const title = "DAFTAR KELOMPOK";
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, currentY);
      currentY += 6;

      doc.setFontSize(template.styling.fontSize.subtitle);
      const subtitle = selectedKelasName;
      const subtitleWidth = doc.getTextWidth(subtitle);
      doc.text(subtitle, (pageWidth - subtitleWidth) / 2, currentY);
      currentY += 8;

      // Mata Pelajaran info
      const selectedMapelName = selectedMapel && selectedMapel !== "none"
        ? mataPelajaranOptions.find(m => m.id === selectedMapel)?.nama_mata_pelajaran || ""
        : "";
      if (selectedMapelName) {
        doc.setFontSize(template.styling.fontSize.header);
        const mapelText = `Mata Pelajaran: ${selectedMapelName}`;
        const mapelWidth = doc.getTextWidth(mapelText);
        doc.text(mapelText, (pageWidth - mapelWidth) / 2, currentY);
        currentY += 10;
      } else {
        currentY += 2;
      }

      // Draw groups in 2 columns
      const leftColumnX = template.layout.margins.left;
      const rightColumnX = pageWidth / 2 + 5;
      const columnWidth = (pageWidth - template.layout.margins.left - template.layout.margins.right - 10) / 2;
      
      let leftY = currentY;
      let rightY = currentY;
      
      groups.forEach((group, index) => {
        const isLeftColumn = index % 2 === 0;
        const columnX = isLeftColumn ? leftColumnX : rightColumnX;
        let currentYPos = isLeftColumn ? leftY : rightY;
        
        // Check if we need a new page
        if (currentYPos > 240) {
          doc.addPage();
          currentYPos = template.layout.margins.top;
          if (isLeftColumn) {
            leftY = currentYPos;
            rightY = currentYPos;
          }
        }

        // Group header
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont(template.styling.fontFamily, 'bold');
        doc.text(`KELOMPOK ${group.groupNumber}`, columnX, currentYPos);
        currentYPos += 5;

        // Members table
        const tableData = group.members.map((member, idx) => [
          idx + 1,
          member.nama_siswa,
        ]);

        autoTable(doc, {
          startY: currentYPos,
          head: [["No", "Nama Lengkap"]],
          body: tableData,
          theme: "grid",
          margin: { left: columnX },
          tableWidth: columnWidth,
          styles: {
            fontSize: 8,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: template.styling.primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            1: { halign: "left" },
          },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 6;
        
        if (isLeftColumn) {
          leftY = finalY;
        } else {
          rightY = finalY;
        }
      });

      const fileName = `kelompok_${selectedKelasName.toLowerCase().replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Berhasil",
        description: "Daftar kelompok berhasil diekspor ke PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembuat Kelompok"
        description="Acak dan buat kelompok siswa secara otomatis"
      />

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi</CardTitle>
          <CardDescription>Pilih kelas dan tentukan cara pembagian kelompok</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pilih Kelas</Label>
              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasOptions.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedKelas && siswaList.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total siswa: {siswaList.length}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mata Pelajaran (Opsional)</Label>
              <Select value={selectedMapel} onValueChange={setSelectedMapel}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {mataPelajaranOptions.map((mapel) => (
                    <SelectItem key={mapel.id} value={mapel.id}>
                      {mapel.nama_mata_pelajaran}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Akan ditampilkan di PDF
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metode Pembagian</Label>
            <Select value={groupMethod} onValueChange={(value: any) => setGroupMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="by-count">Berdasarkan Jumlah Kelompok</SelectItem>
                <SelectItem value="by-size">Berdasarkan Ukuran Kelompok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupMethod === "by-count" ? (
              <div className="space-y-2">
                <Label>Jumlah Kelompok</Label>
                <Input
                  type="number"
                  min="1"
                  max={siswaList.length}
                  value={groupCount}
                  onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Siswa akan dibagi ke dalam {groupCount} kelompok
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Ukuran per Kelompok</Label>
                <Input
                  type="number"
                  min="1"
                  max={siswaList.length}
                  value={groupSize}
                  onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Setiap kelompok akan berisi {groupSize} siswa
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2 h-10">
                <Checkbox 
                  id="balance-gender" 
                  checked={balanceGender}
                  onCheckedChange={(checked) => setBalanceGender(checked as boolean)}
                />
                <label
                  htmlFor="balance-gender"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ratakan Distribusi Gender
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {balanceGender 
                  ? "Siswa laki-laki dan perempuan akan didistribusikan merata ke setiap kelompok"
                  : "Siswa akan diacak tanpa mempertimbangkan gender"
                }
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              onClick={createGroups}
              disabled={!selectedKelas || siswaList.length === 0 || loading}
              className="flex-1 md:flex-none"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              {groups.length > 0 ? "Acak Ulang" : "Buat Kelompok"}
            </Button>
            {groups.length > 0 && (
              <>
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Salin
                </Button>
                <Button variant="outline" onClick={exportToPDF} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups Display */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Hasil Kelompok ({groups.length} kelompok)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => {
                return (
                <Card key={group.groupNumber} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Kelompok {group.groupNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {group.members.map((member, idx) => (
                        <div
                          key={member.id}
                          className={`flex items-start gap-2 p-2 rounded-md transition-colors ${
                            member.jenis_kelamin === "Laki-laki" 
                              ? "bg-blue-50 hover:bg-blue-100 border border-blue-200" 
                              : "bg-pink-50 hover:bg-pink-100 border border-pink-200"
                          }`}
                        >
                          <span className={`text-xs font-medium min-w-[20px] ${
                            member.jenis_kelamin === "Laki-laki" ? "text-blue-600" : "text-pink-600"
                          }`}>
                            {idx + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              member.jenis_kelamin === "Laki-laki" ? "text-blue-900" : "text-pink-900"
                            }`}>
                              {member.nama_siswa}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedKelas && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Pilih kelas untuk memulai membuat kelompok
          </AlertDescription>
        </Alert>
      )}

      {selectedKelas && siswaList.length === 0 && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Tidak ada siswa di kelas ini
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PembuatKelompok;
