export type ISODate = string // YYYY-MM-DD
export type MonthKey = string // YYYY-MM

/**
 * check — erledigt / nicht erledigt
 * count — Menge gegen ein Ziel (20 Min lesen, 6 Gläser Wasser)
 * scale — Bewertung 1..5 (Fokus, Schlafqualität, Stimmung eines Bereichs)
 */
export type HabitKind = 'check' | 'count' | 'scale'

export interface Habit {
  id: string
  name: string
  emoji: string
  kind: HabitKind
  /** check: immer 1, count: Zielmenge, scale: Mindestwert der als "erfüllt" zählt */
  target: number
  /** Schrittweite fuer count */
  step?: number
  /** Einheit fuer count, z.B. "Min", "Gläser" */
  unit?: string
  order: number
  createdAt: ISODate
  archivedAt?: ISODate
}

export interface DayEntry {
  date: ISODate
  /** habitId -> Wert */
  values: Record<string, number>
  note?: string
  /** 1..5 */
  mood?: number
}

export interface AppData {
  version: 1
  habits: Habit[]
  entries: Record<ISODate, DayEntry>
  settings: {
    createdAt: string
  }
}
