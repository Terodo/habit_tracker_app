import { useState } from 'react'
import InstallHint from './components/InstallHint'
import { monthKey, today } from './date'
import type { ISODate, MonthKey } from './types'
import DayView from './views/DayView'
import MonthView from './views/MonthView'
import StatsView from './views/StatsView'
import HabitsView from './views/HabitsView'

export type Tab = 'day' | 'month' | 'stats' | 'habits'

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'day', label: 'Tag', glyph: '◆' },
  { id: 'month', label: 'Monat', glyph: '▦' },
  { id: 'stats', label: 'Bilanz', glyph: '◧' },
  { id: 'habits', label: 'Ritual', glyph: '✳' },
]

/** App-Shortcuts aus dem Manifest landen als ?tab=… hier */
function initialTab(): Tab {
  const wanted = new URLSearchParams(window.location.search).get('tab')
  return TABS.some((t) => t.id === wanted) ? (wanted as Tab) : 'day'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [date, setDate] = useState<ISODate>(today())
  const [month, setMonth] = useState<MonthKey>(monthKey(today()))

  const openDay = (d: ISODate) => {
    setDate(d)
    setTab('day')
  }

  return (
    <div className="phone">
      <div className="grain" aria-hidden />
      <header className="topbar">
        <span className="wordmark">Kadenz</span>
        <span className="wordmark-sub">täglicher almanach</span>
      </header>

      <InstallHint />

      <main className="screen" key={tab}>
        {tab === 'day' && <DayView date={date} setDate={setDate} />}
        {tab === 'month' && (
          <MonthView month={month} setMonth={setMonth} onPickDay={openDay} />
        )}
        {tab === 'stats' && <StatsView month={month} setMonth={setMonth} />}
        {tab === 'habits' && <HabitsView />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => {
              if (t.id === 'day' && tab === 'day') setDate(today())
              setTab(t.id)
            }}
          >
            <span className="tab-glyph">{t.glyph}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
