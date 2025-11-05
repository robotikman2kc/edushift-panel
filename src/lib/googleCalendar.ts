// Google Calendar API untuk hari libur Indonesia (public calendar, no auth needed)

const GOOGLE_CALENDAR_API_KEY = "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs"; // Public API key
const INDONESIAN_HOLIDAY_CALENDAR_ID = "en.indonesian%23holiday%40group.v3.google.com";

export interface GoogleCalendarHoliday {
  id: string;
  summary: string;
  start: {
    date: string;
  };
  description?: string;
}

export async function fetchIndonesianHolidays(year: number): Promise<Array<{
  tanggal: string;
  nama: string;
  keterangan: string;
}>> {
  try {
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${INDONESIAN_HOLIDAY_CALENDAR_ID}/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const holidays = data.items.map((event: GoogleCalendarHoliday) => ({
      tanggal: event.start.date,
      nama: event.summary,
      keterangan: "Libur Nasional"
    }));
    
    return holidays;
  } catch (error) {
    console.error("Error fetching holidays from Google Calendar:", error);
    throw error;
  }
}

export async function syncHolidaysForYears(startYear: number, endYear: number): Promise<Array<{
  tanggal: string;
  nama: string;
  keterangan: string;
}>> {
  const allHolidays = [];
  
  for (let year = startYear; year <= endYear; year++) {
    try {
      const holidays = await fetchIndonesianHolidays(year);
      allHolidays.push(...holidays);
    } catch (error) {
      console.error(`Failed to fetch holidays for year ${year}:`, error);
    }
  }
  
  return allHolidays;
}
