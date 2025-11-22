import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { isWeekday, isHariLiburKerja } from "@/lib/hariLiburUtils";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export const JurnalStatusWidget = () => {
  const [unfilledCount, setUnfilledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUnfilledJurnal();
  }, []);

  const checkUnfilledJurnal = async () => {
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Get all jurnal entries for current month
      const allJurnal = await indexedDB.select("jurnal");
      const currentMonthJurnal = allJurnal.filter((j: any) => {
        const date = new Date(j.tanggal);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      // Create a set of dates that have jurnal entries
      const filledDates = new Set(
        currentMonthJurnal.map((j: any) => format(new Date(j.tanggal), "yyyy-MM-dd"))
      );
      
      // Check all days in current month up to today
      let unfilledDaysCount = 0;
      
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(today);
      lastDay.setHours(0, 0, 0, 0);
      
      for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        
        // Only check weekdays (Monday-Friday)
        if (!isWeekday(currentDate)) continue;
        
        // Skip national holidays on weekdays
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
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm">
          <strong>{unfilledCount} hari kerja</strong> belum terisi jurnal bulan ini
        </span>
        <Button 
          onClick={() => navigate("/jurnal/jurnal-guru")} 
          size="sm"
          variant="outline"
          className="flex-shrink-0 border-destructive/50 hover:bg-destructive/10"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Lihat Detail
        </Button>
      </AlertDescription>
    </Alert>
  );
};
