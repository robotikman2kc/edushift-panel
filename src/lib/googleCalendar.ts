// Google Calendar API untuk hari libur Indonesia (public calendar, no auth needed)

const GOOGLE_CALENDAR_API_KEY = "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs"; // Public API key
const INDONESIAN_HOLIDAY_CALENDAR_ID = "en.indonesian.official%23holiday%40group.v.calendar.google.com";

export interface GoogleCalendarHoliday {
  id: string;
  summary: string;
  start: {
    date: string;
  };
  description?: string;
}

// Fungsi untuk menerjemahkan nama hari libur ke Bahasa Indonesia
function translateHolidayName(englishName: string): string {
  const translations: Record<string, string> = {
    "New Year's Day": "Tahun Baru Masehi",
    "Chinese New Year's Day": "Tahun Baru Imlek",
    "Chinese New Year Joint Holiday": "Cuti Bersama Tahun Baru Imlek",
    "Ascension of the Prophet Muhammad": "Isra Mi'raj Nabi Muhammad SAW",
    "Good Friday": "Wafat Yesus Kristus",
    "Ascension Day": "Kenaikan Yesus Kristus",
    "Vesak Day": "Hari Raya Waisak",
    "Pancasila Day": "Hari Lahir Pancasila",
    "Independence Day": "Hari Kemerdekaan RI",
    "Idul Fitri": "Idul Fitri",
    "Idul Fitri Holiday": "Idul Fitri",
    "Idul Fitri Joint Holiday": "Cuti Bersama Idul Fitri",
    "Idul Adha": "Idul Adha",
    "Idul Adha Joint Holiday": "Cuti Bersama Idul Adha",
    "Islamic New Year": "Tahun Baru Islam",
    "Christmas Day": "Hari Raya Natal",
    "Bali's Day of Silence and Hindu New Year (Nyepi)": "Hari Raya Nyepi",
    "Joint Holiday for Bali's Day of Silence and Hindu New Year (Nyepi)": "Cuti Bersama Nyepi",
    "The Birthday of Prophet Muhammad": "Maulid Nabi Muhammad SAW",
    "Joint Holiday": "Cuti Bersama",
  };

  // Cek exact match dulu
  if (translations[englishName]) {
    return translations[englishName];
  }

  // Cek partial match untuk tentative dates
  for (const [key, value] of Object.entries(translations)) {
    if (englishName.includes(key)) {
      // Jika ada kata "tentative", tambahkan keterangan
      if (englishName.toLowerCase().includes("tentative")) {
        return `${value} (tentatif)`;
      }
      return value;
    }
  }

  // Jika tidak ada terjemahan, kembalikan nama asli
  return englishName;
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
      nama: translateHolidayName(event.summary),
      keterangan: event.description || "Libur"
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
