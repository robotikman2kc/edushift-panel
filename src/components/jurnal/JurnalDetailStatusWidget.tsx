import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { isWeekday, isHariLiburKerja } from "@/lib/hariLiburUtils";
import { format } from "date-fns";

export const JurnalDetailStatusWidget = () => {
  const [unfilledDays, setUnfilledDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUnfilledJurnal();
  }, []);

  const checkUnfilledJurnal = async () => {
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const allJurnal = await indexedDB.select("jurnal");
      const currentMonthJurnal = allJurnal.filter((j: any) => {
        const date = new Date(j.tanggal);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      const filledDates = new Set(
        currentMonthJurnal.map((j: any) => format(new Date(j.tanggal), "yyyy-MM-dd"))
      );
      
      const unfilled: Date[] = [];
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(today);
      lastDay.setHours(0, 0, 0, 0);
      
      for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        if (!isWeekday(currentDate)) continue;
        
        const isHoliday = isHariLiburKerja(currentDate);
        if (isHoliday) continue;
        
        const dateStr = format(currentDate, "yyyy-MM-dd");
        if (!filledDates.has(dateStr)) {
          unfilled.push(new Date(currentDate));
        }
      }
      
      setUnfilledDays(unfilled);
    } catch (error) {
      console.error("Error checking unfilled jurnal:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthName = monthNames[new Date().getMonth()];

  if (loading) return null;

  if (unfilledDays.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Semua jurnal bulan {currentMonthName} sudah terisi lengkap! 🎉
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p>
            <strong>{unfilledDays.length} hari kerja</strong> di bulan {currentMonthName} belum terisi jurnal:
          </p>
          <div className="flex flex-wrap gap-1">
            {unfilledDays.map((date, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {format(date, "dd MMM")}
              </Badge>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
