import { useMemo } from 'react'
import Ring from '../components/Ring'
import { addDays, formatLong, isFuture, relativeLabel, today } from '../date'
import { actions, useData } from '../store'
import { activeHabits, currentStreak, dayScore, goal, isDone, valueOf } from '../stats'
import type { Habit, ISODate } from '../types'

const MOODS = ['😖', '🙁', '😐', '🙂', '😄']

interface Props {
  date: ISODate
  setDate: (d: ISODate) => void
}

export default function DayView({ date, setDate }: Props) {
  const data = useData()
  const habits = useMemo(() => activeHabits(data, date), [data, date])
  const score = dayScore(data, date)
  const entry = data.entries[date]
  const future = isFuture(date)
  const isToday = date === today()

  return (
    <div className="stagger">
      <section className="daypanel">
        <div className="daypanel-text">
          <p className="eyebrow">{relativeLabel(date)}</p>
          <h1 className="dayline">{formatLong(date)}</h1>
          <p className="dayyear">{date.slice(0, 4)}</p>
        </div>
        <Ring
          value={score.rate}
          label={`${score.done}/${score.total}`}
          sub={score.total ? `${Math.round(score.rate * 100)}%` : '—'}
        />
      </section>

      <div className="datenav">
        <button className="ghost" onClick={() => setDate(addDays(date, -1))} aria-label="Tag zurück">
          ‹
        </button>
        <button className="ghost wide" onClick={() => setDate(today())} disabled={isToday}>
          {isToday ? 'aktueller Tag' : 'zu heute springen'}
        </button>
        <button
          className="ghost"
          onClick={() => setDate(addDays(date, 1))}
          disabled={isFuture(addDays(date, 1))}
          aria-label="Tag vor"
        >
          ›
        </button>
      </div>

      {future ? (
        <p className="empty">Zukunft lässt sich nicht eintragen. Nur nachtragen.</p>
      ) : (
        <>
          <ul className="habitlist">
            {habits.map((h) => (
              <HabitRow key={h.id} habit={h} date={date} />
            ))}
          </ul>

          {habits.length === 0 && (
            <p className="empty">
              Für diesen Tag gibt es noch keine Rituale. Lege welche unter „Ritual“ an.
            </p>
          )}

          <section className="card">
            <h2 className="cardtitle">Stimmung</h2>
            <div className="moodrow">
              {MOODS.map((m, i) => {
                const val = i + 1
                const on = entry?.mood === val
                return (
                  <button
                    key={m}
                    className={`mood ${on ? 'is-on' : ''}`}
                    onClick={() => actions.setMood(date, on ? undefined : val)}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="card">
            <h2 className="cardtitle">Notiz zum Tag</h2>
            <textarea
              className="note"
              rows={4}
              placeholder="Was war heute los?"
              value={entry?.note ?? ''}
              onChange={(e) => actions.setNote(date, e.target.value)}
            />
          </section>

          {score.hasEntry && (
            <button className="danger-ghost" onClick={() => actions.clearDay(date)}>
              Tag zurücksetzen
            </button>
          )}
        </>
      )}
    </div>
  )
}

function HabitRow({ habit, date }: { habit: Habit; date: ISODate }) {
  const data = useData()
  const value = valueOf(data, date, habit.id)
  const done = isDone(habit, value)
  const streak = currentStreak(data, habit, date)
  const step = habit.step ?? 1

  return (
    <li className={`habit ${done ? 'is-done' : ''}`}>
      <div className="habit-head">
        <span className="habit-emoji">{habit.emoji}</span>
        <div className="habit-name">
          <strong>{habit.name}</strong>
          <small>
            {habit.kind === 'check' && (done ? 'erledigt' : 'offen')}
            {habit.kind === 'count' && `${value} / ${goal(habit)} ${habit.unit ?? ''}`}
            {habit.kind === 'scale' && `Ziel ab ${goal(habit)}`}
            {streak > 1 && <em className="streak"> · {streak}× Serie</em>}
          </small>
        </div>
      </div>

      {habit.kind === 'check' && (
        <button
          className="check"
          aria-pressed={done}
          onClick={() => actions.setValue(date, habit.id, done ? 0 : 1)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {habit.kind === 'count' && (
        <div className="stepper">
          <button onClick={() => actions.setValue(date, habit.id, Math.max(0, value - step))} disabled={value === 0}>
            −
          </button>
          <span className="stepper-val">{value}</span>
          <button onClick={() => actions.setValue(date, habit.id, value + step)}>+</button>
        </div>
      )}

      {habit.kind === 'scale' && (
        <div className="scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`dot ${value >= n ? 'is-on' : ''} ${n === goal(habit) ? 'is-goal' : ''}`}
              onClick={() => actions.setValue(date, habit.id, value === n ? 0 : n)}
              aria-label={`${n} von 5`}
            />
          ))}
        </div>
      )}
    </li>
  )
}
