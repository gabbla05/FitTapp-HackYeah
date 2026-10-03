export interface HabitEventRecord {
  id: string;
  category: 'water' | 'movement' | 'sleep' | 'mood' | 'food';
  value_num: number | null;
  value_text: string | null;
  feedback: 'too_easy' | 'just_right' | 'too_hard' | null;
  weather_condition: string | null;
  temperature_c: number | null;
  source: 'lock_push' | 'live_activity' | 'in_app' | 'background';
  created_at: string; // ISO 8601 string
}

export interface AttentionBudgetRecord {
  date: string; // YYYY-MM-DD
  pushed_count: number;
  daily_cap: number;
  quiet_hours_blocked: number;
}

export interface AdaptiveParamRecord {
  habit_key: string;
  current_target: number;
  difficulty_multiplier: number;
  consecutive_skips: number;
  updated_at: string;
}

export interface UserProfileRecord {
  username: string;
  is_onboarded: number; // 0 or 1
  created_at: string;
}

export const SQL_INIT_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY NOT NULL,
    is_onboarded INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habit_events (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    value_num REAL,
    value_text TEXT,
    feedback TEXT,
    weather_condition TEXT,
    temperature_c REAL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attention_budget_logs (
    date TEXT PRIMARY KEY NOT NULL,
    pushed_count INTEGER DEFAULT 0,
    daily_cap INTEGER DEFAULT 3,
    quiet_hours_blocked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS adaptive_parameters (
    habit_key TEXT PRIMARY KEY NOT NULL,
    current_target REAL NOT NULL,
    difficulty_multiplier REAL DEFAULT 1.0,
    consecutive_skips INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );
`;
