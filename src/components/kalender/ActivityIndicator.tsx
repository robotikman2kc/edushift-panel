import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityIndicatorProps {
  hasAgenda: boolean;
  hasAttendance: boolean;
  hasJournal: boolean;
  hasSchedule: boolean;
}

export function ActivityIndicator({ hasAgenda, hasAttendance, hasJournal, hasSchedule }: ActivityIndicatorProps) {
  const activities = [];
  if (hasAgenda) activities.push("Agenda");
  if (hasAttendance) activities.push("Kehadiran");
  if (hasJournal) activities.push("Jurnal");
  if (hasSchedule && !hasAgenda && !hasAttendance) activities.push("Jadwal");

  if (activities.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex gap-0.5 items-center justify-center mt-1">
            {hasAgenda && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            {hasAttendance && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            {hasJournal && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
            {hasSchedule && !hasAgenda && !hasAttendance && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{activities.join(", ")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
