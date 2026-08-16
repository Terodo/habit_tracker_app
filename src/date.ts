import type { ISODate, MonthKey } from './types'

export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function toISO(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const today = (): ISODate => toISO(new Date())

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function addMonths(mk: MonthKey, n: number): MonthKey {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return monthKey(toISO(d))
}

export const monthKey = (s: ISODate): MonthKey => s.slice(0, 7)

export function monthDays(mk: MonthKey): ISODate[] {
  const [y, m] = mk.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  return Array.from({ length: count }, (_, i) => `${mk}-${String(i + 1).padStart(2, '0')}`)
}

/** Montag-first Raster mit Null-Padding vorne */
export function monthGrid(mk: MonthKey): (ISODate | null)[] {
  const days = monthDays(mk)
  const first = fromISO(days[0]).getDay() // 0 = So
  const pad = (first + 6) % 7
  return [...Array.from({ length: pad }, () => null), ...days]
}

/** 0 = Montag */
export function weekdayIndex(s: ISODate): number {
  return (fromISO(s).getDay() + 6) % 7
}

export const dayNumber = (s: ISODate): number => Number(s.slice(8, 10))

export function isFuture(s: ISODate): boolean {
  return s > today()
}

const LONG = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
const MONTH = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })
const SHORT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })

export function formatLong(s: ISODate): string {
  return LONG.format(fromISO(s))
}

export function formatMonth(mk: MonthKey): string {
  return MONTH.format(fromISO(`${mk}-01`))
}

export function formatShort(s: ISODate): string {
  return SHORT.format(fromISO(s))
}

export function relativeLabel(s: ISODate): string {
  const t = today()
  if (s === t) return 'Heute'
  if (s === addDays(t, -1)) return 'Gestern'
  if (s === addDays(t, -2)) return 'Vorgestern'
  if (s === addDays(t, 1)) return 'Morgen'
  const diff = Math.round((fromISO(s).getTime() - fromISO(t).getTime()) / 86400000)
  return diff < 0 ? `vor ${Math.abs(diff)} Tagen` : `in ${diff} Tagen`
}
