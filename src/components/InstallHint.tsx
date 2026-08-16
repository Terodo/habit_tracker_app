import { useEffect, useState } from 'react'

const KEY = 'kadenz.installhint.dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * Zwei Welten:
 * Android/Chrome feuert `beforeinstallprompt` — wir fangen es ab und bieten einen echten Knopf.
 * iOS/Safari kennt das Event nicht und verlangt den Umweg ueber "Teilen" — dort nur Anleitung.
 */
export default function InstallHint() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOS, setShowIOS] = useState(false)
  const [dismissed, setDismissed] = useState(() => Boolean(localStorage.getItem(KEY)))

  useEffect(() => {
    if (isStandalone()) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setPrompt(null)
      setShowIOS(false)
      localStorage.setItem(KEY, '1')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    const ua = navigator.userAgent
    const iOS = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1)
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    if (iOS && safari) setShowIOS(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (dismissed || (!prompt && !showIOS)) return null

  const close = () => {
    localStorage.setItem(KEY, '1')
    setDismissed(true)
  }

  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    setPrompt(null)
    if (outcome === 'accepted') close()
  }

  return (
    <div className="installhint">
      <div className="installhint-body">
        <strong>Als App installieren</strong>
        {prompt ? (
          <>
            <p>Kadenz landet im App-Drawer — eigenes Icon, Vollbild, offline nutzbar.</p>
            <button type="button" className="installbtn" onClick={install}>
              Jetzt installieren
            </button>
          </>
        ) : (
          <p>
            Teilen-Symbol <ShareGlyph /> antippen → „Zum Home-Bildschirm". Danach startet Kadenz im
            Vollbild und funktioniert offline.
          </p>
        )}
      </div>
      <button type="button" aria-label="Hinweis schließen" onClick={close}>
        ×
      </button>
    </div>
  )
}

function ShareGlyph() {
  return (
    <svg className="glyph" viewBox="0 0 24 24" width="15" height="15" aria-hidden>
      <path
        d="M12 3v11M12 3L8.5 6.5M12 3l3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 10H5v10h14V10h-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
