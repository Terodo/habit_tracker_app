import { useMemo } from 'react'
import { WEEKDAYS, addMonths, dayNumber, formatMonth, monthGrid, monthKey, today } from '../date'
import { useData } from '../store'
import { monthReport, pct } from '../stats'
import type { ISODate, MonthKey } from '../types'

interface Props {
  month: MonthKey
  setMonth: (m: MonthKey) => void
  onPickDay: (d: ISODate) => void
}

export default function MonthView({ month, setMonth, onPickDay }: Props) {
  const data = useData()
  const report = useMemo(() => monthReport(data, month), [data, month])
  const grid = useMemo(() => monthGrid(month), [month])
  const byDate = useMemo(
    () => Object.fromEntries(report.days.map((d) => [d.date, d])),
    [report],
  )
  const nextDisabled = addMonths(month, 1) > monthKey(today())

  return (
    <div className="stagger">
      <div className="monthnav">
        <button className="ghost" onClick={() => setMonth(addMonths(month, -1))} aria-label="Monat zurück">
          ‹
        </button>
        <h1 className="monthtitle">{formatMonth(month)}</h1>
        <button
          className="ghost"
          onClick={() => setMonth(addMonths(month, 1))}
          disabled={nextDisabled}
          aria-label="Monat vor"
        >
          ›
        </button>
      </div>

      <section className="card">
        <div className="weekhead">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="calgrid">
          {grid.map((date, i) => {
            if (!date) return <span key={`pad-${i}`} className="cell is-pad" />
            const d = byDate[date]
            const rate = d?.score.rate ?? 0
            const perfect = !d.future && d.score.total > 0 && d.score.done === d.score.total
            return (
              <button
                key={date}
                className={`cell ${d.future ? 'is-future' : ''} ${perfect ? 'is-perfect' : ''} ${
                  date === today() ? 'is-today' : ''
                }`}
                style={{ '--fill': rate } as React.CSSProperties}
                onClick={() => onPickDay(date)}
              >
                <span className="cell-num">{dayNumber(date)}</span>
                {d.note?.trim() && <span className="cell-note" />}
              </button>
            )
          })}
        </div>
        <div className="legend">
          <span>leer</span>
          <i className="lg lg0" />
          <i className="lg lg1" />
          <i className="lg lg2" />
          <i className="lg lg3" />
          <span>voll</span>
        </div>
      </section>

      <section className="card">
        <h2 className="cardtitle">Verlauf je Ritual</h2>
        <div className="threads">
          {report.habits.map((s) => (
            <div key={s.habit.id} className="thread">
              <div className="thread-label">
                <span>{s.habit.emoji}</span>
                <strong>{s.habit.name}</strong>
                <em>{pct(s.rate)}</em>
              </div>
              <div className="thread-track">
                {s.perDay.map((d) => (
                  <i
                    key={d.date}
                    className={`tick ${d.done ? 'is-on' : ''} ${!d.active || d.future ? 'is-off' : ''}`}
                  />
                ))}
              </div>
            </div>
          ))}
          {report.habits.length === 0 && <p className="empty">Noch keine Daten in diesem Monat.</p>}
        </div>
      </section>
    </div>
  )
}
