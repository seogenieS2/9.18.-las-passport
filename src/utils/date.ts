import { HealthGoalFootprint, HealthGoalAnswer } from '../types';

export const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getHealthGoalFootprintKey = (dateKey: string): string => {
  return `las_health_goal_footprint_${dateKey}`;
};

export const getHealthGoalFootprint = (dateKey: string): HealthGoalFootprint => {
  try {
    const raw = localStorage.getItem(getHealthGoalFootprintKey(dateKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        physical: (parsed.physical === 'yes' || parsed.physical === 'no') ? parsed.physical : null,
        social: (parsed.social === 'yes' || parsed.social === 'no') ? parsed.social : null,
        emotional: (parsed.emotional === 'yes' || parsed.emotional === 'no') ? parsed.emotional : null,
      };
    }
  } catch (e) {
    console.error('Failed to parse health goal footprint for', dateKey, e);
  }
  return {
    physical: null,
    social: null,
    emotional: null,
  };
};

export const saveHealthGoalFootprint = (dateKey: string, footprint: HealthGoalFootprint): void => {
  try {
    localStorage.setItem(getHealthGoalFootprintKey(dateKey), JSON.stringify(footprint));
  } catch (e) {
    console.error('Failed to save health goal footprint for', dateKey, e);
  }
};

export interface WeekDayFootprint {
  date: Date;
  dateKey: string;
  dayName: string;
  isFuture: boolean;
  isToday: boolean;
  answers: HealthGoalFootprint;
}

export const getWeekFootprintRecords = (refDate = new Date(), todayAnswers?: HealthGoalFootprint): WeekDayFootprint[] => {
  const todayKey = getLocalDateKey(refDate);
  const dayOfWeek = refDate.getDay(); // 0 (Sun) to 6 (Sat)
  const sunday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - dayOfWeek);

  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  const weekRecords: WeekDayFootprint[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    const dateKey = getLocalDateKey(d);
    const isFuture = dateKey > todayKey;
    const isToday = dateKey === todayKey;
    const answers = isFuture 
      ? { physical: null as HealthGoalAnswer, social: null as HealthGoalAnswer, emotional: null as HealthGoalAnswer } 
      : (isToday && todayAnswers)
        ? todayAnswers
        : getHealthGoalFootprint(dateKey);

    weekRecords.push({
      date: d,
      dateKey,
      dayName: DAY_NAMES[i],
      isFuture,
      isToday,
      answers,
    });
  }

  return weekRecords;
};

export interface MonthDayFootprint {
  dayNum: number;
  dateKey: string;
  isFuture: boolean;
  isToday: boolean;
  answers: HealthGoalFootprint;
  yesCount: number;
  statusSymbol: 'O' | '△' | 'X' | null;
}

export interface MonthFootprintData {
  year: number;
  month: number;
  firstDayOfWeek: number;
  daysInMonth: number;
  days: MonthDayFootprint[];
  physicalCount: number;
  socialCount: number;
  emotionalCount: number;
}

export const getMonthFootprintData = (refDate = new Date(), todayAnswers?: HealthGoalFootprint): MonthFootprintData => {
  const year = refDate.getFullYear();
  const monthIdx = refDate.getMonth();
  const todayKey = getLocalDateKey(refDate);

  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const days: MonthDayFootprint[] = [];
  let physicalCount = 0;
  let socialCount = 0;
  let emotionalCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIdx, day);
    const dateKey = getLocalDateKey(d);
    const isFuture = dateKey > todayKey;
    const isToday = dateKey === todayKey;

    if (isFuture) {
      days.push({
        dayNum: day,
        dateKey,
        isFuture: true,
        isToday: false,
        answers: { physical: null, social: null, emotional: null },
        yesCount: 0,
        statusSymbol: null,
      });
    } else {
      const answers = (isToday && todayAnswers) ? todayAnswers : getHealthGoalFootprint(dateKey);
      let count = 0;
      if (answers.physical === 'yes') {
        count++;
        physicalCount++;
      }
      if (answers.social === 'yes') {
        count++;
        socialCount++;
      }
      if (answers.emotional === 'yes') {
        count++;
        emotionalCount++;
      }

      let statusSymbol: 'O' | '△' | 'X' = 'X';
      if (count === 3) {
        statusSymbol = 'O';
      } else if (count === 1 || count === 2) {
        statusSymbol = '△';
      } else {
        statusSymbol = 'X';
      }

      days.push({
        dayNum: day,
        dateKey,
        isFuture: false,
        isToday,
        answers,
        yesCount: count,
        statusSymbol,
      });
    }
  }

  return {
    year,
    month: monthIdx + 1,
    firstDayOfWeek,
    daysInMonth,
    days,
    physicalCount,
    socialCount,
    emotionalCount,
  };
};
