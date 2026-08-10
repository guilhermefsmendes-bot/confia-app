export interface DailyCheckInData {
  date: string;
  mood: number;
  need: string;
  completed: boolean;
}

const KEY = "confia_daily_checkin";
const HISTORY_KEY = "confia_daily_checkin_history";

export function getDailyCheckIn(): DailyCheckInData | null {
  try {
    const stored = localStorage.getItem(KEY);

    if (!stored) return null;

    return JSON.parse(stored) as DailyCheckInData;
  } catch {
    return null;
  }
}

export function getDailyCheckInHistory(): DailyCheckInData[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);

    if (!stored) return [];

    return JSON.parse(stored) as DailyCheckInData[];
  } catch {
    return [];
  }
}

export function saveDailyCheckIn(
  mood: number,
  need: string
): DailyCheckInData {
  const data: DailyCheckInData = {
    date: new Date().toISOString().split("T")[0],
    mood,
    need,
    completed: true,
  };

  localStorage.setItem(KEY, JSON.stringify(data));

  const history = getDailyCheckInHistory();

  // Substitui o registo do mesmo dia, se existir
  const updatedHistory = [
    ...history.filter((item) => item.date !== data.date),
    data,
  ];

  // Mantém apenas os últimos 30 dias
  updatedHistory.sort((a, b) => a.date.localeCompare(b.date));

  const last30Days = updatedHistory.slice(-30);

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(last30Days)
  );

  return data;
}

export function hasCompletedToday(): boolean {
  const data = getDailyCheckIn();

  if (!data) return false;

  const today = new Date().toISOString().split("T")[0];

  return data.date === today && data.completed;
}
