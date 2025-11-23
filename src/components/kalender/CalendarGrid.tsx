import { CalendarDay } from "./CalendarDay";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format } from "date-fns";

interface CalendarData {
  date: string;
  hasAgenda: boolean;
  hasAttendance: boolean;
  hasJournal: boolean;
  hasSchedule: boolean;
  isHoliday: boolean;
  holidayName?: string;
  hasNotes: boolean;
  noteColor?: string;
  noteText?: string;
  isPeriodeNonPembelajaran: boolean;
  periodeNama?: string;
}

interface CalendarGridProps {
  currentDate: Date;
  calendarData: Map<string, CalendarData>;
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function CalendarGrid({ currentDate, calendarData, selectedDate, onDateClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Days of Week */}
      <div className="grid grid-cols-7 bg-muted">
        {WEEKDAYS.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold border-b">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayData = calendarData.get(dateKey) || {
            date: dateKey,
            hasAgenda: false,
            hasAttendance: false,
            hasJournal: false,
            hasSchedule: false,
            isHoliday: false,
            hasNotes: false,
            isPeriodeNonPembelajaran: false,
          };

          return (
            <CalendarDay
              key={dateKey}
              date={day}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isSameDay(day, new Date())}
              isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
              hasAgenda={dayData.hasAgenda}
              hasAttendance={dayData.hasAttendance}
              hasJournal={dayData.hasJournal}
              hasSchedule={dayData.hasSchedule}
              isHoliday={dayData.isHoliday}
              holidayName={dayData.holidayName}
              hasNotes={dayData.hasNotes}
              noteColor={dayData.noteColor}
              noteText={dayData.noteText}
              isPeriodeNonPembelajaran={dayData.isPeriodeNonPembelajaran}
              periodeNama={dayData.periodeNama}
              onClick={() => onDateClick(day)}
            />
          );
        })}
      </div>
    </div>
  );
}
