import { cn } from "@/lib/utils";
import { ActivityIndicator } from "./ActivityIndicator";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasAgenda: boolean;
  hasAttendance: boolean;
  hasJournal: boolean;
  hasSchedule: boolean;
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
  onClick,
}: CalendarDayProps) {
  const day = date.getDate();
  const hasNoActivity = hasSchedule && !hasAgenda && !hasAttendance && !hasJournal;

  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-[50px] p-1.5 border transition-all hover:bg-accent/50 relative flex flex-col",
        !isCurrentMonth && "opacity-40",
        isToday && "border-primary border-2",
        isSelected && "bg-accent",
        hasNoActivity && isCurrentMonth && "bg-destructive/5"
      )}
    >
      <span
        className={cn(
          "text-sm font-medium",
          isToday && "text-primary font-bold",
          !isCurrentMonth && "text-muted-foreground"
        )}
      >
        {day}
      </span>
      <ActivityIndicator
        hasAgenda={hasAgenda}
        hasAttendance={hasAttendance}
        hasJournal={hasJournal}
        hasSchedule={hasSchedule}
      />
    </button>
  );
}
