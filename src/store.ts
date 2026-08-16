import { useSyncExternalStore } from 'react'
import type { AppData, DayEntry, Habit, ISODate } from './types'
import { today } from './date'

const KEY = 'kadenz.v1'

export const uid = (): string => Math.random().toString(36).slice(2, 10)

function seed(): AppData {
  const start = today()
  const mk = (name: string, emoji: string, extra: Partial<Habit>, order: number): Habit => ({
    id: uid(),
    name,
    emoji,
    kind: 'check',
    target: 1,
    order,
    createdAt: start,
    ...extra,
  })
  return {
    version: 1,
    habits: [
      mk('Bewegung', '🏃', {}, 0),
      mk('Lesen', '📖', { kind: 'count', target: 20, step: 5, unit: 'Min' }, 1),
      mk('Wasser', '💧', { kind: 'count', target: 6, step: 1, unit: 'Gläser' }, 2),
      mk('Kein Handy im Bett', '🌙', {}, 3),
      mk('Fokus', '🎯', { kind: 'scale', target: 3 }, 4),
    ],
    entries: {},
    settings: { createdAt: new Date().toISOString() },
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.habits)) return seed()
    return { ...parsed, entries: parsed.entries ?? {} }
  } catch {
    return seed()
  }
}

let data: AppData = load()
const listeners = new Set<() => void>()

function commit(next: AppData) {
  data = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch (err) {
    console.error('Speichern fehlgeschlagen', err)
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const getSnapshot = () => data

export function useData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function withEntry(d: AppData, date: ISODate, fn: (e: DayEntry) => DayEntry): AppData {
  const current: DayEntry = d.entries[date] ?? { date, values: {} }
  return { ...d, entries: { ...d.entries, [date]: fn({ ...current, values: { ...current.values } }) } }
}

/** Leere Einträge wieder entfernen, damit die Monatsübersicht ehrlich bleibt */
function prune(d: AppData, date: ISODate): AppData {
  const e = d.entries[date]
  if (!e) return d
  const empty =
    Object.values(e.values).every((v) => !v) && !e.note?.trim() && e.mood === undefined
  if (!empty) return d
  const entries = { ...d.entries }
  delete entries[date]
  return { ...d, entries }
}

export const actions = {
  setValue(date: ISODate, habitId: string, value: number) {
    const v = Math.max(0, Math.round(value * 100) / 100)
    commit(
      prune(
        withEntry(data, date, (e) => {
          if (v === 0) delete e.values[habitId]
          else e.values[habitId] = v
          return e
        }),
        date,
      ),
    )
  },

  setNote(date: ISODate, note: string) {
    commit(prune(withEntry(data, date, (e) => ({ ...e, note })), date))
  },

  setMood(date: ISODate, mood: number | undefined) {
    commit(prune(withEntry(data, date, (e) => ({ ...e, mood })), date))
  },

  clearDay(date: ISODate) {
    const entries = { ...data.entries }
    delete entries[date]
    commit({ ...data, entries })
  },

  addHabit(input: Omit<Habit, 'id' | 'order' | 'createdAt'> & { createdAt?: ISODate }) {
    const habit: Habit = {
      ...input,
      id: uid(),
      order: data.habits.length,
      createdAt: input.createdAt ?? today(),
    }
    commit({ ...data, habits: [...data.habits, habit] })
  },

  updateHabit(id: string, patch: Partial<Habit>) {
    commit({ ...data, habits: data.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })
  },

  toggleArchive(id: string) {
    commit({
      ...data,
      habits: data.habits.map((h) =>
        h.id === id ? { ...h, archivedAt: h.archivedAt ? undefined : today() } : h,
      ),
    })
  },

  deleteHabit(id: string) {
    const entries: Record<ISODate, DayEntry> = {}
    for (const [date, e] of Object.entries(data.entries)) {
      const values = { ...e.values }
      delete values[id]
      entries[date] = { ...e, values }
    }
    commit({ ...data, habits: data.habits.filter((h) => h.id !== id), entries })
  },

  move(id: string, dir: -1 | 1) {
    const list = [...data.habits].sort((a, b) => a.order - b.order)
    const i = list.findIndex((h) => h.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    commit({ ...data, habits: list.map((h, idx) => ({ ...h, order: idx })) })
  },

  exportJSON(): string {
    return JSON.stringify(data, null, 2)
  },

  importJSON(raw: string) {
    const parsed = JSON.parse(raw) as AppData
    if (parsed.version !== 1 || !Array.isArray(parsed.habits)) {
      throw new Error('Unbekanntes Format')
    }
    commit({ ...parsed, entries: parsed.entries ?? {} })
  },

  resetAll() {
    commit(seed())
  },
}
