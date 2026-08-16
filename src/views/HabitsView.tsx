import { useRef, useState } from 'react'
import { actions, useData } from '../store'
import type { Habit, HabitKind } from '../types'

const KIND_LABEL: Record<HabitKind, string> = {
  check: 'Abhaken',
  count: 'Menge',
  scale: 'Skala 1–5',
}

const EMOJIS = ['🏃', '📖', '💧', '🌙', '🎯', '🧘', '🥗', '💪', '✍️', '🎸', '🧹', '☎️', '🚭', '💤']

export default function HabitsView() {
  const data = useData()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const habits = [...data.habits].sort((a, b) => a.order - b.order)
  const active = habits.filter((h) => !h.archivedAt)
  const archived = habits.filter((h) => h.archivedAt)

  const exportFile = () => {
    const blob = new Blob([actions.exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kadenz-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File) => {
    try {
      actions.importJSON(await file.text())
      alert('Import erfolgreich.')
    } catch (err) {
      alert(`Import fehlgeschlagen: ${(err as Error).message}`)
    }
  }

  return (
    <div className="stagger">
      <h1 className="monthtitle left">Rituale</h1>

      <ul className="habitedit">
        {active.map((h, i) => (
          <li key={h.id}>
            {editing === h.id ? (
              <HabitForm
                habit={h}
                onCancel={() => setEditing(null)}
                onSave={(patch) => {
                  actions.updateHabit(h.id, patch)
                  setEditing(null)
                }}
              />
            ) : (
              <div className="editrow">
                <span className="habit-emoji">{h.emoji}</span>
                <div className="habit-name">
                  <strong>{h.name}</strong>
                  <small>
                    {KIND_LABEL[h.kind]}
                    {h.kind === 'count' && ` · Ziel ${h.target} ${h.unit ?? ''} · Schritt ${h.step ?? 1}`}
                    {h.kind === 'scale' && ` · erfüllt ab ${h.target}`}
                  </small>
                </div>
                <div className="rowactions">
                  <button className="icon" onClick={() => actions.move(h.id, -1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button
                    className="icon"
                    onClick={() => actions.move(h.id, 1)}
                    disabled={i === active.length - 1}
                  >
                    ↓
                  </button>
                  <button className="icon" onClick={() => setEditing(h.id)}>
                    ✎
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <HabitForm
          onCancel={() => setAdding(false)}
          onSave={(patch) => {
            actions.addHabit({
              name: patch.name ?? 'Neu',
              emoji: patch.emoji ?? '✳',
              kind: patch.kind ?? 'check',
              target: patch.target ?? 1,
              step: patch.step,
              unit: patch.unit,
            })
            setAdding(false)
          }}
        />
      ) : (
        <button className="primary" onClick={() => setAdding(true)}>
          + Ritual hinzufügen
        </button>
      )}

      {archived.length > 0 && (
        <section className="card">
          <h2 className="cardtitle">Archiv</h2>
          <p className="hint">
            Archivierte Rituale zählen ab dem Archivdatum nicht mehr — alte Monate bleiben korrekt.
          </p>
          {archived.map((h) => (
            <div key={h.id} className="editrow is-muted">
              <span className="habit-emoji">{h.emoji}</span>
              <div className="habit-name">
                <strong>{h.name}</strong>
                <small>archiviert am {h.archivedAt}</small>
              </div>
              <button className="icon" onClick={() => actions.toggleArchive(h.id)}>
                ↺
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2 className="cardtitle">Daten</h2>
        <p className="hint">
          Alles liegt lokal auf diesem Gerät. Kein Konto, keine Cloud. Sichere regelmäßig per Export.
        </p>
        <div className="btnrow">
          <button className="ghost wide" onClick={exportFile}>
            Export (JSON)
          </button>
          <button className="ghost wide" onClick={() => fileRef.current?.click()}>
            Import
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importFile(f)
            e.target.value = ''
          }}
        />
        <button
          className="danger-ghost"
          onClick={() => {
            if (confirm('Alle Daten löschen und mit Beispiel-Ritualen neu starten?')) actions.resetAll()
          }}
        >
          Alles zurücksetzen
        </button>
      </section>
    </div>
  )
}

function HabitForm({
  habit,
  onSave,
  onCancel,
}: {
  habit?: Habit
  onSave: (patch: Partial<Habit>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(habit?.name ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✳')
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'check')
  const [target, setTarget] = useState(String(habit?.target ?? 1))
  const [step, setStep] = useState(String(habit?.step ?? 1))
  const [unit, setUnit] = useState(habit?.unit ?? '')

  return (
    <div className="card form">
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Laufen" />
      </label>

      <span className="fieldlabel">Symbol</span>
      <div className="emojigrid">
        {EMOJIS.map((e) => (
          <button key={e} className={`emoji ${emoji === e ? 'is-on' : ''}`} onClick={() => setEmoji(e)}>
            {e}
          </button>
        ))}
      </div>

      <span className="fieldlabel">Art</span>
      <div className="segmented">
        {(Object.keys(KIND_LABEL) as HabitKind[]).map((k) => (
          <button key={k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {kind !== 'check' && (
        <div className="fieldrow">
          <label className="field">
            <span>{kind === 'count' ? 'Ziel' : 'erfüllt ab'}</span>
            <input
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          {kind === 'count' && (
            <>
              <label className="field">
                <span>Schritt</span>
                <input
                  inputMode="numeric"
                  value={step}
                  onChange={(e) => setStep(e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <label className="field">
                <span>Einheit</span>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Min" />
              </label>
            </>
          )}
        </div>
      )}

      <div className="btnrow">
        <button className="ghost wide" onClick={onCancel}>
          Abbrechen
        </button>
        <button
          className="primary wide"
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              name: name.trim(),
              emoji,
              kind,
              target: kind === 'check' ? 1 : Math.max(1, Number(target) || 1),
              step: kind === 'count' ? Math.max(1, Number(step) || 1) : undefined,
              unit: kind === 'count' ? unit.trim() || undefined : undefined,
            })
          }
        >
          Speichern
        </button>
      </div>

      {habit && (
        <div className="btnrow">
          <button className="ghost wide" onClick={() => actions.toggleArchive(habit.id)}>
            Archivieren
          </button>
          <button
            className="danger-ghost wide"
            onClick={() => {
              if (confirm(`„${habit.name}“ inklusive aller Einträge löschen?`)) {
                actions.deleteHabit(habit.id)
                onCancel()
              }
            }}
          >
            Löschen
          </button>
        </div>
      )}
    </div>
  )
}
