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
        isHoliday && "bg-red-50 dark:bg-red-950",
        isSelected && "ring-2 ring-inset ring-primary"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isHoliday && "text-red-600 dark:text-red-400"
          )}>
            {dayNumber}
          </span>
          {isToday && (
            <span className="text-[10px] bg-primary text-primary-foreground px-1 rounded">
              Hari ini
            </span>
          )}
        </div>
        
        {isHoliday && (
          <div className="text-[10px] text-red-600 dark:text-red-400 font-medium mb-1 line-clamp-2">
            {holidayName}
          </div>
        )}
        
        <div className="flex flex-wrap gap-1 mt-auto">
          {hasAgenda && <div className="w-2 h-2 rounded-full bg-green-500" />}
          {hasAttendance && <div className="w-2 h-2 rounded-full bg-blue-500" />}
          {hasJournal && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
          {hasSchedule && !hasAnyActivity && (
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
          )}
        </div>
      </div>
    </div>
  );
}
