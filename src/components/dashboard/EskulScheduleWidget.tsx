import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { localDB, Ekstrakurikuler } from "@/lib/localDB";
import { Users, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface EskulScheduleWidgetProps {
  selectedDate: Date;
}

export function EskulScheduleWidget({ selectedDate }: EskulScheduleWidgetProps) {
  const navigate = useNavigate();
  const [todayEskul, setTodayEskul] = useState<Ekstrakurikuler[]>([]);

  useEffect(() => {
    loadTodayEskul();
  }, [selectedDate]);

  const loadTodayEskul = () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const today = days[selectedDate.getDay()];

    // Get ekstrakurikuler that meet today
    const eskuls = localDB.select('ekstrakurikuler', (e: Ekstrakurikuler) => 
      e.hari_pertemuan === today && e.status === 'aktif'
    );

    setTodayEskul(eskuls);
  };

  if (todayEskul.length === 0) {
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
        <div className="space-y-2">
          {todayEskul.map((eskul, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 cursor-pointer hover:shadow-md"
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
      </CardContent>
    </Card>
  );
}
