import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { isWeekday, isHariLiburKerja } from "@/lib/hariLiburUtils";
import { format } from "date-fns";

export const JurnalStatusWidget = () => {
  const [unfilledCount, setUnfilledCount] = useState(0);
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
      
      let unfilledDaysCount = 0;
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
          unfilledDaysCount++;
        }
      }
      
      setUnfilledCount(unfilledDaysCount);
    } catch (error) {
      console.error("Error checking unfilled jurnal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || unfilledCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="text-xs flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      {unfilledCount} hari jurnal kosong
    </Badge>
  );
};
