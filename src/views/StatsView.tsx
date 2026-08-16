import { useMemo } from 'react'
import Ring from '../components/Ring'
import { addMonths, formatMonth, formatShort, monthKey, today } from '../date'
import { useData } from '../store'
import { monthReport, pct } from '../stats'
import type { MonthKey } from '../types'

const MOODS = ['😖', '🙁', '😐', '🙂', '😄']

interface Props {
  month: MonthKey
  setMonth: (m: MonthKey) => void
}

export default function StatsView({ month, setMonth }: Props) {
  const data = useData()
  const report = useMemo(() => monthReport(data, month), [data, month])
  const prev = useMemo(() => monthReport(data, addMonths(month, -1)), [data, month])
  const delta = report.overallRate - prev.overallRate
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

      <section className="card summary">
        <Ring value={report.overallRate} size={112} label={pct(report.overallRate)} sub="erfüllt" />
        <div className="summary-side">
          <Stat k="Tage notiert" v={String(report.trackedDays)} />
          <Stat k="perfekte Tage" v={String(report.perfectDays)} />
          <Stat
            k="ggü. Vormonat"
            v={`${delta >= 0 ? '+' : ''}${Math.round(delta * 100)} pp`}
            tone={delta > 0.005 ? 'up' : delta < -0.005 ? 'down' : undefined}
          />
          <Stat
            k="Stimmung ⌀"
            v={report.moodAvg ? `${report.moodAvg.toFixed(1)} ${MOODS[Math.round(report.moodAvg) - 1]}` : '—'}
          />
        </div>
      </section>

      {report.bestHabit && (
        <section className="card highlights">
          <h2 className="cardtitle">Auffällig</h2>
          <p className="hl">
            <span className="hl-tag">stark</span> {report.bestHabit.habit.emoji}{' '}
            <strong>{report.bestHabit.habit.name}</strong> — {pct(report.bestHabit.rate)}, längste
            Serie {report.bestHabit.bestStreak} Tage.
          </p>
          {report.weakestHabit && (
            <p className="hl">
              <span className="hl-tag is-weak">schwach</span> {report.weakestHabit.habit.emoji}{' '}
              <strong>{report.weakestHabit.habit.name}</strong> — nur {pct(report.weakestHabit.rate)}{' '}
              ({report.weakestHabit.done} von {report.weakestHabit.possible} Tagen).
            </p>
          )}
        </section>
      )}

      <section className="card">
        <h2 className="cardtitle">Je Ritual</h2>
        <div className="bars">
          {report.habits.map((s) => (
            <div key={s.habit.id} className="bar">
              <div className="bar-top">
                <span>
                  {s.habit.emoji} {s.habit.name}
                </span>
                <b>{pct(s.rate)}</b>
              </div>
              <div className="bar-track">
                <i style={{ width: `${Math.round(s.rate * 100)}%` }} />
              </div>
              <div className="bar-meta">
                {s.done}/{s.possible} Tage
                {s.habit.kind === 'count' && ` · Summe ${s.sum} ${s.habit.unit ?? ''}`}
                {s.bestStreak > 1 && ` · beste Serie ${s.bestStreak}`}
                {s.currentStreak > 1 && ` · aktuell ${s.currentStreak}`}
              </div>
            </div>
          ))}
          {report.habits.length === 0 && <p className="empty">Keine Daten für diesen Monat.</p>}
        </div>
      </section>

      <section className="card">
        <h2 className="cardtitle">Wochentage</h2>
        <div className="wdchart">
          {report.byWeekday.map((w) => (
            <div key={w.label} className="wd">
              <div className="wd-col">
                <i style={{ height: `${Math.max(3, Math.round(w.rate * 100))}%` }} />
              </div>
              <span className="wd-label">{w.label}</span>
              <span className="wd-val">{pct(w.rate)}</span>
            </div>
          ))}
        </div>
      </section>

      {report.notes.length > 0 && (
        <section className="card">
          <h2 className="cardtitle">Notizen des Monats</h2>
          <ul className="notelist">
            {report.notes.map((n) => (
              <li key={n.date}>
                <span className="notedate">{formatShort(n.date)}</span>
                <p>{n.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: 'up' | 'down' }) {
  return (
    <div className="stat">
      <span className="stat-k">{k}</span>
      <span className={`stat-v ${tone ? `is-${tone}` : ''}`}>{v}</span>
    </div>
  )
}
