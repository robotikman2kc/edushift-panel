import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { indexedDB } from "@/lib/indexedDB";
import { isWeekday, isHariLiburKerja } from "@/lib/hariLiburUtils";
import { format } from "date-fns";

export const JurnalDetailStatusWidget = () => {
  const [unfilledDays, setUnfilledDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkDays, setTotalWorkDays] = useState(0);

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
      const unfilled: Date[] = [];
      let workDayCount = 0;
      
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(today);
      lastDay.setHours(0, 0, 0, 0);
      
      for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        
        // Only check weekdays (Monday-Friday)
        if (!isWeekday(currentDate)) continue;
        
        workDayCount++;
        
        // Skip national holidays on weekdays
        const isHoliday = isHariLiburKerja(currentDate);
        if (isHoliday) continue;
        
        const dateStr = format(currentDate, "yyyy-MM-dd");
        if (!filledDates.has(dateStr)) {
          unfilled.push(new Date(currentDate));
        }
      }
      
      setUnfilledDays(unfilled);
      setTotalWorkDays(workDayCount);
    } catch (error) {
      console.error("Error checking unfilled jurnal:", error);
    } finally {
      setLoading(false);
    }
  };

  const filledDays = totalWorkDays - unfilledDays.length;
  const completionPercentage = totalWorkDays > 0 
    ? Math.round((filledDays / totalWorkDays) * 100) 
    : 0;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthName = monthNames[new Date().getMonth()];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Status Jurnal - {currentMonthName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Memuat...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Status Jurnal - {currentMonthName}
        </CardTitle>
        <CardDescription>
          Monitoring pengisian jurnal bulan berjalan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{totalWorkDays}</div>
            <div className="text-xs text-muted-foreground">Hari Kerja</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{filledDays}</div>
            <div className="text-xs text-muted-foreground">Terisi</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-destructive">{unfilledDays.length}</div>
            <div className="text-xs text-muted-foreground">Kosong</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Kelengkapan</span>
            <span className="font-semibold">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Alert for unfilled days */}
        {unfilledDays.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">
                  {unfilledDays.length} hari kerja belum terisi jurnal
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
        ) : (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Semua hari kerja bulan ini sudah terisi jurnal! 🎉
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
