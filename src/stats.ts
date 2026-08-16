import { addDays, fromISO, monthDays, today } from './date'
import type { AppData, Habit, ISODate, MonthKey } from './types'

export function activeHabits(data: AppData, date: ISODate): Habit[] {
  return data.habits
    .filter((h) => h.createdAt <= date && (!h.archivedAt || h.archivedAt > date))
    .sort((a, b) => a.order - b.order)
}

export function goal(h: Habit): number {
  return h.kind === 'check' ? 1 : Math.max(1, h.target)
}

export function valueOf(data: AppData, date: ISODate, habitId: string): number {
  return data.entries[date]?.values[habitId] ?? 0
}

export function isDone(h: Habit, value: number): boolean {
  return value >= goal(h)
}

export interface DayScore {
  done: number
  total: number
  rate: number
  hasEntry: boolean
}

export function dayScore(data: AppData, date: ISODate): DayScore {
  const habits = activeHabits(data, date)
  const done = habits.filter((h) => isDone(h, valueOf(data, date, h.id))).length
  const entry = data.entries[date]
  return {
    done,
    total: habits.length,
    rate: habits.length ? done / habits.length : 0,
    hasEntry: Boolean(entry && (Object.keys(entry.values).length || entry.note || entry.mood)),
  }
}

/** Aktuelle Serie. Heute zählt nicht als Abbruch, solange der Tag noch läuft. */
export function currentStreak(data: AppData, h: Habit, upto: ISODate = today()): number {
  let cursor = upto
  if (!isDone(h, valueOf(data, cursor, h.id))) {
    if (cursor !== today()) return 0
    cursor = addDays(cursor, -1)
  }
  let n = 0
  while (cursor >= h.createdAt) {
    if (!isDone(h, valueOf(data, cursor, h.id))) break
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function longestStreak(data: AppData, h: Habit): number {
  let best = 0
  let run = 0
  let cursor = h.createdAt
  const end = today()
  while (cursor <= end) {
    if (isDone(h, valueOf(data, cursor, h.id))) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
    cursor = addDays(cursor, 1)
  }
  return best
}

export interface HabitMonthStat {
  habit: Habit
  done: number
  possible: number
  rate: number
  sum: number
  bestStreak: number
  currentStreak: number
  perDay: { date: ISODate; done: boolean; active: boolean; future: boolean }[]
}

export interface MonthReport {
  mk: MonthKey
  days: { date: ISODate; score: DayScore; mood?: number; note?: string; future: boolean }[]
  trackedDays: number
  perfectDays: number
  overallRate: number
  moodAvg: number | null
  habits: HabitMonthStat[]
  bestHabit?: HabitMonthStat
  weakestHabit?: HabitMonthStat
  byWeekday: { label: string; rate: number; n: number }[]
  notes: { date: ISODate; note: string }[]
}

const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function monthReport(data: AppData, mk: MonthKey): MonthReport {
  const t = today()
  const dates = monthDays(mk)
  const past = dates.filter((d) => d <= t)

  const days = dates.map((date) => {
    const e = data.entries[date]
    return { date, score: dayScore(data, date), mood: e?.mood, note: e?.note, future: date > t }
  })

  const habits: HabitMonthStat[] = data.habits
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((habit) => {
      const perDay = dates.map((date) => {
        const active = habit.createdAt <= date && (!habit.archivedAt || habit.archivedAt > date)
        return {
          date,
          active,
          future: date > t,
          done: active && isDone(habit, valueOf(data, date, habit.id)),
        }
      })
      const relevant = perDay.filter((d) => d.active && !d.future)
      const done = relevant.filter((d) => d.done).length
      const sum = past.reduce((acc, d) => acc + valueOf(data, d, habit.id), 0)
      let best = 0
      let run = 0
      for (const d of perDay) {
        if (d.done) {
          run++
          if (run > best) best = run
        } else if (!d.future) {
          run = 0
        }
      }
      return {
        habit,
        done,
        possible: relevant.length,
        rate: relevant.length ? done / relevant.length : 0,
        sum,
        bestStreak: best,
        currentStreak: currentStreak(data, habit),
        perDay,
      }
    })
    .filter((s) => s.possible > 0)

  const pastDays = days.filter((d) => !d.future)
  const trackedDays = pastDays.filter((d) => d.score.hasEntry).length
  const perfectDays = pastDays.filter((d) => d.score.total > 0 && d.score.done === d.score.total).length
  const rateSum = pastDays.reduce((a, d) => a + d.score.rate, 0)
  const moods = pastDays.map((d) => d.mood).filter((m): m is number => typeof m === 'number')

  const byWeekday = WD.map((label, i) => {
    const rel = pastDays.filter((d) => (fromISO(d.date).getDay() + 6) % 7 === i)
    return {
      label,
      n: rel.length,
      rate: rel.length ? rel.reduce((a, d) => a + d.score.rate, 0) / rel.length : 0,
    }
  })

  const ranked = habits.slice().sort((a, b) => b.rate - a.rate)

  return {
    mk,
    days,
    trackedDays,
    perfectDays,
    overallRate: pastDays.length ? rateSum / pastDays.length : 0,
    moodAvg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    habits,
    bestHabit: ranked[0],
    weakestHabit: ranked.length > 1 ? ranked[ranked.length - 1] : undefined,
    byWeekday,
    notes: pastDays
      .filter((d) => d.note?.trim())
      .map((d) => ({ date: d.date, note: d.note!.trim() })),
  }
}

export const pct = (n: number): string => `${Math.round(n * 100)}%`
