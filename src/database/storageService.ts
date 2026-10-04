import { Platform } from 'react-native';
import {
  HabitEventRecord,
  AttentionBudgetRecord,
  AdaptiveParamRecord,
  UserProfileRecord,
  SQL_INIT_TABLES,
} from './schema';

// Reserved/Forbidden usernames (for registration validation)
const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'fittapp',
  'system',
  'null',
  'undefined',
  'moderator',
  'test',
]);

let nativeDb: any = null;

/**
 * Initializes the database (SQLite on native Android/iOS APK, persistent Storage on Web)
 */
export async function initDatabase(): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      const SQLite = await import('expo-sqlite');
      nativeDb = await SQLite.openDatabaseAsync('fittapp.db');
      await nativeDb.execAsync(SQL_INIT_TABLES);
      console.log('FitTapp SQLite database initialized on native platform.');
      return;
    } catch (err) {
      console.warn('Native SQLite init fallback to web storage:', err);
    }
  }

  // Web storage initialization
  if (typeof window !== 'undefined' && window.localStorage) {
    if (!window.localStorage.getItem('fittapp_db_events')) {
      window.localStorage.setItem('fittapp_db_events', JSON.stringify([]));
    }
    if (!window.localStorage.getItem('fittapp_db_adaptive')) {
      window.localStorage.setItem(
        'fittapp_db_adaptive',
        JSON.stringify({
          walk_distance: 1.5,
          desk_stretch_duration: 2.0,
        })
      );
    }
  }
}

/**
 * Checks if a username is available or already taken
 */
export async function checkUsernameAvailable(
  username: string
): Promise<{ available: boolean; reason?: string }> {
  const clean = username.trim().toLowerCase();

  if (!clean || clean.length < 3) {
    return { available: false, reason: 'Username must be at least 3 characters long.' };
  }

  if (clean.length > 20) {
    return { available: false, reason: 'Username must be 20 characters or fewer.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { available: false, reason: 'Username can only contain letters, numbers, and underscores.' };
  }

  if (RESERVED_USERNAMES.has(clean)) {
    return { available: false, reason: 'This username is reserved. Please pick another one.' };
  }

  // Check if taken in database
  if (nativeDb) {
    try {
      const row = await nativeDb.getFirstAsync(
        'SELECT username FROM users WHERE LOWER(username) = ?',
        [clean]
      );
      if (row) {
        return { available: false, reason: 'This username is already taken. Try another.' };
      }
      return { available: true };
    } catch (e) {
      console.warn('Error checking user in SQLite:', e);
    }
  }

  // Web check
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem('fittapp_registered_users');
    const list: string[] = existing ? JSON.parse(existing) : ['gabriel_dev', 'alex', 'sarah'];
    if (list.includes(clean)) {
      return { available: false, reason: 'This username is already taken. Try another.' };
    }
  }

  return { available: true };
}

/**
 * Registers a user profile with username
 */
export async function registerUser(username: string): Promise<UserProfileRecord> {
  const clean = username.trim();
  const now = new Date().toISOString();
  const profile: UserProfileRecord = {
    username: clean,
    is_onboarded: 1,
    created_at: now,
  };

  if (nativeDb) {
    try {
      await nativeDb.runAsync(
        'INSERT OR REPLACE INTO users (username, is_onboarded, created_at) VALUES (?, ?, ?)',
        [clean, 1, now]
      );
    } catch (e) {
      console.warn('Error writing user to SQLite:', e);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('fittapp_current_user', JSON.stringify(profile));
    const existing = window.localStorage.getItem('fittapp_registered_users');
    const list: string[] = existing ? JSON.parse(existing) : ['gabriel_dev', 'alex', 'sarah'];
    if (!list.includes(clean.toLowerCase())) {
      list.push(clean.toLowerCase());
      window.localStorage.setItem('fittapp_registered_users', JSON.stringify(list));
    }
  }

  return profile;
}

/**
 * Gets the active user profile (null if not yet registered)
 */
export async function getUserProfile(): Promise<UserProfileRecord | null> {
  if (nativeDb) {
    try {
      const row: any = await nativeDb.getFirstAsync(
        'SELECT username, is_onboarded, created_at FROM users LIMIT 1'
      );
      if (row) {
        return {
          username: row.username,
          is_onboarded: Number(row.is_onboarded),
          created_at: row.created_at,
        };
      }
    } catch (e) {
      console.warn('Error reading user from SQLite:', e);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem('fittapp_current_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }

  return null;
}

/**
 * Logs a single habit event (water, movement, sleep, mood, food)
 */
export async function logHabitEvent(
  event: Omit<HabitEventRecord, 'id' | 'created_at'>
): Promise<HabitEventRecord> {
  const record: HabitEventRecord = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  if (nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT INTO habit_events (
          id, category, value_num, value_text, feedback,
          weather_condition, temperature_c, source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.category,
          record.value_num,
          record.value_text,
          record.feedback,
          record.weather_condition,
          record.temperature_c,
          record.source,
          record.created_at,
        ]
      );
    } catch (e) {
      console.warn('Error logging habit event in SQLite:', e);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem('fittapp_db_events');
      const events: HabitEventRecord[] = raw ? JSON.parse(raw) : [];
      events.push(record);
      window.localStorage.setItem('fittapp_db_events', JSON.stringify(events));
    } catch {}
  }

  return record;
}

/**
 * Gets aggregated summary of today's logged habits
 */
export async function getTodayHabitSummary(): Promise<{
  waterMl: number;
  movementDone: boolean;
  movementType: 'walk' | 'stretch' | null;
  sleepHours: number;
  sleepQuality: string;
  moodLogged: string;
  foodLogged: boolean;
}> {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  let events: HabitEventRecord[] = [];

  if (nativeDb) {
    try {
      const rows: any = await nativeDb.getAllAsync(
        `SELECT * FROM habit_events WHERE created_at LIKE ?`,
        [`${todayStr}%`]
      );
      events = rows || [];
    } catch (e) {
      console.warn('Error reading today events from SQLite:', e);
    }
  } else if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem('fittapp_db_events');
    const all: HabitEventRecord[] = raw ? JSON.parse(raw) : [];
    events = all.filter((e) => e.created_at.startsWith(todayStr));
  }

  let waterMl = 0;
  let movementDone = false;
  let movementType: 'walk' | 'stretch' | null = null;
  let sleepHours = 0;
  let sleepQuality = 'Not logged yet';
  let moodLogged = 'Not logged yet';
  let foodLogged = false;

  for (const ev of events) {
    if (ev.category === 'water' && ev.value_num) {
      waterMl += ev.value_num;
    }
    if (ev.category === 'movement') {
      movementDone = true;
      if (ev.value_text === 'walk' || ev.value_text === 'stretch') {
        movementType = ev.value_text;
      }
    }
    if (ev.category === 'sleep') {
      if (ev.value_num) sleepHours = ev.value_num;
      if (ev.value_text) sleepQuality = ev.value_text;
    }
    if (ev.category === 'mood' && ev.value_text) {
      moodLogged = ev.value_text;
    }
    if (ev.category === 'food') {
      foodLogged = true;
    }
  }

  return {
    waterMl, // Pure zero if fresh; learns entirely from user's actual responses
    movementDone,
    movementType,
    sleepHours,
    sleepQuality,
    moodLogged,
    foodLogged,
  };
}

/**
 * Gets Attention Budget status for today (clean start: 0/3)
 */
export async function getAttentionBudgetStatus(): Promise<{
  pushedCount: number;
  dailyCap: number;
  remaining: number;
}> {
  const todayStr = new Date().toISOString().slice(0, 10);
  let pushedCount = 0;
  let dailyCap = 3;

  if (nativeDb) {
    try {
      const row: any = await nativeDb.getFirstAsync(
        'SELECT pushed_count, daily_cap FROM attention_budget_logs WHERE date = ?',
        [todayStr]
      );
      if (row) {
        pushedCount = row.pushed_count;
        dailyCap = row.daily_cap;
      }
    } catch {}
  } else if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(`fittapp_budget_${todayStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      pushedCount = parsed.pushedCount ?? 0;
      dailyCap = parsed.dailyCap ?? 3;
    }
  }

  return {
    pushedCount,
    dailyCap,
    remaining: Math.max(0, dailyCap - pushedCount),
  };
}

/**
 * Resets today's attention budget usage back to 0
 */
export async function resetAttentionBudget(): Promise<void> {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT INTO attention_budget_logs (date, pushed_count, daily_cap)
         VALUES (?, 0, 3)
         ON CONFLICT(date) DO UPDATE SET pushed_count = 0`,
        [todayStr]
      );
    } catch (e) {
      console.warn('Error resetting budget in SQLite:', e);
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        `fittapp_budget_${todayStr}`,
        JSON.stringify({ pushedCount: 0, dailyCap: 3 })
      );
    } catch {}
  }
}

/**
 * Calculates dynamic weekly rhythm with optional weekOffset (0 = current week, -1 = last week, etc.)
 */
export async function getWeeklyRitualDays(weekOffset: number = 0): Promise<{
  days: Array<{ dayName: string; completed: boolean; isToday?: boolean }>;
  weekLabel: string;
  hasPreviousWeekData: boolean;
}> {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const currentTodayIdx = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Target week's Monday at 00:00:00
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentTodayIdx + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  // Target week's Sunday at 23:59:59.999
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const mondayIso = monday.toISOString();
  const sundayIso = sunday.toISOString();

  let targetEvents: HabitEventRecord[] = [];
  let olderEventsCount = 0;

  if (nativeDb) {
    try {
      const rows: any = await nativeDb.getAllAsync(
        `SELECT created_at FROM habit_events WHERE created_at >= ? AND created_at <= ?`,
        [mondayIso, sundayIso]
      );
      targetEvents = rows || [];

      const older: any = await nativeDb.getFirstAsync(
        `SELECT COUNT(*) as count FROM habit_events WHERE created_at < ?`,
        [mondayIso]
      );
      olderEventsCount = older?.count || 0;
    } catch (e) {
      console.warn('Error fetching weekly events from SQLite:', e);
    }
  }

  if (targetEvents.length === 0 && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem('fittapp_db_events');
      if (raw) {
        const all: HabitEventRecord[] = JSON.parse(raw);
        targetEvents = all.filter((e) => {
          const t = new Date(e.created_at).getTime();
          return t >= monday.getTime() && t <= sunday.getTime();
        });
        olderEventsCount = all.filter((e) => new Date(e.created_at).getTime() < monday.getTime()).length;
      }
    } catch {}
  }

  const activeDaysSet = new Set<number>();
  for (const ev of targetEvents) {
    const d = new Date(ev.created_at);
    const dayIdx = (d.getDay() + 6) % 7;
    activeDaysSet.add(dayIdx);
  }

  // Format week label
  let weekLabel = 'This Week';
  if (weekOffset === -1) {
    weekLabel = 'Last Week';
  } else if (weekOffset < -1) {
    weekLabel = `${Math.abs(weekOffset)} weeks ago`;
  }

  const days = dayNames.map((name, idx) => ({
    dayName: name,
    completed: activeDaysSet.has(idx),
    isToday: weekOffset === 0 && idx === currentTodayIdx,
  }));

  return {
    days,
    weekLabel,
    hasPreviousWeekData: olderEventsCount > 0,
  };
}

/**
 * Calculates real consecutive active weeks using ISO 8601 standard
 */
export async function getRealStreakWeeks(): Promise<number> {
  let events: { created_at: string }[] = [];
  if (nativeDb) {
    try {
      const rows: any = await nativeDb.getAllAsync(
        `SELECT DISTINCT created_at FROM habit_events ORDER BY created_at ASC`
      );
      events = rows || [];
    } catch {}
  }
  if (events.length === 0 && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem('fittapp_db_events');
      if (raw) events = JSON.parse(raw);
    } catch {}
  }

  if (events.length === 0) return 0;

  // Helper for ISO 8601 week: YYYY-Www (Monday start, Sunday end)
  const getIsoWeek = (d: Date): string => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const currentIsoWeek = getIsoWeek(new Date());
  const activeWeeks = new Set<string>();

  for (const ev of events) {
    activeWeeks.add(getIsoWeek(new Date(ev.created_at)));
  }

  // If no activity in current week, streak is 0
  if (!activeWeeks.has(currentIsoWeek)) {
    return 0;
  }

  // Count consecutive weeks backwards from current
  let streak = 1;
  let checkDate = new Date();
  while (true) {
    checkDate.setDate(checkDate.getDate() - 7);
    const prevWeek = getIsoWeek(checkDate);
    if (activeWeeks.has(prevWeek)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Increments attention budget pushed count
 */
export async function incrementAttentionBudget(): Promise<number> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const status = await getAttentionBudgetStatus();
  const nextCount = status.pushedCount + 1;

  if (nativeDb) {
    try {
      await nativeDb.runAsync(
        `INSERT INTO attention_budget_logs (date, pushed_count, daily_cap) 
         VALUES (?, ?, ?) 
         ON CONFLICT(date) DO UPDATE SET pushed_count = ?`,
        [todayStr, nextCount, status.dailyCap, nextCount]
      );
    } catch {}
  } else if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(
      `fittapp_budget_${todayStr}`,
      JSON.stringify({ pushedCount: nextCount, dailyCap: status.dailyCap })
    );
  }

  return nextCount;
}

/**
 * Adaptive Engine: Calibrates walk distance or stretch based on feedback
 */
export async function calibrateAdaptiveGoal(
  habitKey: 'walk_distance' | 'desk_stretch_duration',
  feedback: 'too_easy' | 'just_right' | 'too_hard'
): Promise<number> {
  let currentTarget = habitKey === 'walk_distance' ? 1.5 : 2.0;

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem('fittapp_db_adaptive');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[habitKey]) currentTarget = parsed[habitKey];
    }
  }

  let nextTarget = currentTarget;
  if (feedback === 'too_easy') {
    nextTarget = +(currentTarget * 1.2).toFixed(1); // +20%
  } else if (feedback === 'too_hard') {
    nextTarget = Math.max(0.5, +(currentTarget * 0.8).toFixed(1)); // -20%
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem('fittapp_db_adaptive');
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[habitKey] = nextTarget;
    window.localStorage.setItem('fittapp_db_adaptive', JSON.stringify(parsed));
  }

  return nextTarget;
}

/**
 * Zero-UI Scorecard: Computes real mathematical ratio of lock-screen interactions vs in-app
 */
export async function getZeroUiStats(): Promise<{
  scorePercent: number;
  lockScreenCount: number;
  inAppCount: number;
  totalEvents: number;
  timeSavedMins: number;
}> {
  let events: HabitEventRecord[] = [];

  if (nativeDb) {
    try {
      const rows: any = await nativeDb.getAllAsync(
        `SELECT source FROM habit_events`
      );
      events = rows || [];
    } catch (e) {
      console.warn('Error reading events for Zero-UI scorecard:', e);
    }
  }

  if (events.length === 0 && typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem('fittapp_db_events');
      if (raw) events = JSON.parse(raw);
    } catch {}
  }

  const lockScreenCount = events.filter((e) => e.source === 'lock_push').length;
  const inAppCount = events.filter((e) => e.source === 'in_app' || e.source === 'live_activity').length;
  const totalEvents = lockScreenCount + inAppCount;

  // If no events yet recorded, default to 100% Zero-UI potential, 0 minutes saved
  const scorePercent = totalEvents > 0 ? Math.round((lockScreenCount / totalEvents) * 100) : 100;
  // Estimated 35 seconds saved per lock-screen interaction (vs opening, unlocking phone, navigating tabs)
  const timeSavedMins = Math.round((lockScreenCount * 35) / 60);

  return {
    scorePercent,
    lockScreenCount,
    inAppCount,
    totalEvents,
    timeSavedMins,
  };
}
