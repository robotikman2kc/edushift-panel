import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasAgenda: boolean;
  hasAttendance: boolean;
  hasJournal: boolean;
  hasSchedule: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  hasNotes?: boolean;
  noteColor?: string;
  onClick: () => void;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  hasAgenda,
  hasAttendance,
  hasJournal,
  hasSchedule,
  isHoliday = false,
  holidayName,
  hasNotes = false,
  noteColor,
  onClick,
}: CalendarDayProps) {
  const dayNumber = format(date, "d");
  
  const isWorkingDay = hasSchedule && !isHoliday;
  const hasAnyActivity = hasAgenda || hasAttendance || hasJournal;

  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-[80px] p-2 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors relative",
        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
        isToday && "bg-primary/10 font-semibold",
        isHoliday && !hasNotes && "bg-red-50 dark:bg-red-950",
        hasNotes && noteColor,
        isSelected && "ring-2 ring-inset ring-primary"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isHoliday && !hasNotes && "text-red-600 dark:text-red-400",
            hasNotes && "text-white"
          )}>
            {dayNumber}
          </span>
          {isToday && (
            <span className={cn(
              "text-[10px] px-1 rounded",
              hasNotes ? "bg-white/20 text-white" : "bg-primary text-primary-foreground"
            )}>
              Hari ini
            </span>
          )}
        </div>
        
        {isHoliday && !hasNotes && (
          <div className="text-[10px] text-red-600 dark:text-red-400 font-medium mb-1 line-clamp-2">
            {holidayName}
          </div>
        )}
        
        {hasNotes && (
          <div className="text-[10px] text-white font-medium mb-1 line-clamp-2 drop-shadow">
            {isHoliday ? holidayName : "Ada Catatan"}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mt-auto">
          {hasAgenda && <div className="w-2 h-2 rounded-full bg-green-500" title="Agenda" />}
          {hasAttendance && <div className="w-2 h-2 rounded-full bg-blue-500" title="Kehadiran" />}
          {hasJournal && <div className="w-2 h-2 rounded-full bg-yellow-500" title="Jurnal" />}
          {hasSchedule && !hasAnyActivity && (
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" title="Jadwal" />
          )}
        </div>
      </div>
    </div>
  );
}
