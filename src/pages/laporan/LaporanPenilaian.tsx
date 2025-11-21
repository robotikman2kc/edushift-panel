import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

const LaporanPenilaian = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Penilaian"
        description="Download rekap penilaian berdasarkan periode"
      />

      <Card>
        <CardHeader>
          <CardTitle>Fitur Dalam Pengembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Halaman laporan penilaian akan segera tersedia. Anda akan dapat mengekspor 
            rekap penilaian siswa dalam berbagai format dan periode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LaporanPenilaian;
