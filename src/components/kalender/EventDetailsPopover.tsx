import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info, PartyPopper, AlertCircle, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface EventDetail {
  type: 'holiday' | 'periode' | 'note';
  title: string;
  description?: string;
  dateRange?: { start: string; end: string };
  color?: string;
}

interface EventDetailsPopoverProps {
  events: EventDetail[];
  date: Date;
}

export function EventDetailsPopover({ events, date }: EventDetailsPopoverProps) {
  if (events.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'holiday':
        return <PartyPopper className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'periode':
        return <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'note':
        return <StickyNote className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'periode':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
      case 'note':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-muted border-border';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return 'text-red-900 dark:text-red-100';
      case 'periode':
        return 'text-orange-900 dark:text-orange-100';
      case 'note':
        return 'text-purple-900 dark:text-purple-100';
      default:
        return 'text-foreground';
    }
  };

  const getDescriptionColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return 'text-red-700 dark:text-red-300';
      case 'periode':
        return 'text-orange-700 dark:text-orange-300';
      case 'note':
        return 'text-purple-700 dark:text-purple-300';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-5 w-5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm absolute top-1 right-1"
        >
          <Info className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">
            Peringatan - {format(date, "dd MMMM yyyy", { locale: id })}
          </h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
          {events.map((event, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${getBackgroundColor(event.type)}`}
            >
              <div className="flex items-start gap-2">
                {getIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${getTextColor(event.type)}`}>
                    {event.title}
                  </p>
                  {event.description && (
                    <p className={`text-xs mt-1 ${getDescriptionColor(event.type)}`}>
                      {event.description}
                    </p>
                  )}
                  {event.dateRange && (
                    <p className={`text-xs mt-1 ${getDescriptionColor(event.type)} opacity-75`}>
                      {format(new Date(event.dateRange.start), "dd MMM", { locale: id })} - {format(new Date(event.dateRange.end), "dd MMM yyyy", { locale: id })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
