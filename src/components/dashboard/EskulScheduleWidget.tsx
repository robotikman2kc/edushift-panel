import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eskulDB } from "@/lib/eskulDB";
import { Ekstrakurikuler } from "@/lib/indexedDB";
import { indexedDB } from "@/lib/indexedDB";
import { Users, Clock, Calendar, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface EskulScheduleWidgetProps {
  selectedDate: Date;
}

export function EskulScheduleWidget({ selectedDate }: EskulScheduleWidgetProps) {
  const navigate = useNavigate();
  const [todayEskul, setTodayEskul] = useState<Ekstrakurikuler[]>([]);
  const [currentPeriode, setCurrentPeriode] = useState<any>(null);

  useEffect(() => {
    loadTodayEskul();
    checkPeriodeNonPembelajaran();
  }, [selectedDate]);

  const loadTodayEskul = async () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const today = days[selectedDate.getDay()];

    // Get ekstrakurikuler that meet today
    const eskuls = await eskulDB.select('ekstrakurikuler', (e: Ekstrakurikuler) => 
      e.hari_pertemuan === today && e.status === 'aktif'
    );

    setTodayEskul(eskuls);
  };

  const checkPeriodeNonPembelajaran = async () => {
    try {
      const todayDate = format(selectedDate, "yyyy-MM-dd");
      
      // Check if today falls within any non-teaching period
      const allPeriode = await indexedDB.select("periode_non_pembelajaran");
      const activePeriode = allPeriode.find((p: any) => 
        todayDate >= p.tanggal_mulai && todayDate <= p.tanggal_selesai
      );
      
      setCurrentPeriode(activePeriode || null);
    } catch (error) {
      console.error("Error checking periode non pembelajaran:", error);
    }
  };

  // Don't show if no ekstrakurikuler and no active periode
  if (todayEskul.length === 0 && !currentPeriode) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Jadwal Ekstrakurikuler Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentPeriode ? (
          <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <CalendarOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-100 mb-1">
                  {currentPeriode.nama}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                  {format(new Date(currentPeriode.tanggal_mulai), "dd MMM yyyy", { locale: idLocale })} - {format(new Date(currentPeriode.tanggal_selesai), "dd MMM yyyy", { locale: idLocale })}
                </p>
                {currentPeriode.keterangan && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {currentPeriode.keterangan}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
          {todayEskul.map((eskul, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors duration-200 cursor-pointer hover:shadow-md"
              onClick={() => navigate('/ekstrakurikuler/kehadiran')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{eskul.nama_eskul}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {eskul.hari_pertemuan}
                    </Badge>
                  </div>
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{eskul.pembimbing}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{eskul.jam_pertemuan}</span>
                    </div>
                    {eskul.deskripsi && (
                      <p className="text-xs text-muted-foreground mt-1">{eskul.deskripsi}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
