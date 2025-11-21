import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText } from "lucide-react";

const LaporanJurnalGuru = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Jurnal Guru"
        description="Download rekap jurnal mengajar guru"
      />

      <Card>
        <CardHeader>
          <CardTitle>Fitur Dalam Pengembangan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Halaman laporan jurnal guru akan segera tersedia. Anda akan dapat mengekspor 
            rekap jurnal mengajar dalam berbagai format dan periode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LaporanJurnalGuru;
