import { useCallback, useEffect, useState, type ReactNode } from 'react'

const INTRO_DURATION = 6500
const REDUCED_MOTION_DURATION = 100

export function AppIntro({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  const finish = useCallback(() => setVisible(false), [])

  useEffect(() => {
    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timeout = window.setTimeout(finish, reducedMotion ? REDUCED_MOTION_DURATION : INTRO_DURATION)

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', closeWithEscape)

    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('keydown', closeWithEscape)
    }
  }, [finish])

  return <>
    {children}
    {visible && <section className="app-intro" role="status" aria-label="Iniciando Yardbook">
      <video
        className="app-intro-video"
        src="/yardbook-motion.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <button className="app-intro-skip" type="button" onClick={finish}>
        Saltar introducción <span aria-hidden="true">→</span>
      </button>
      <span className="app-intro-progress" aria-hidden="true" />
    </section>}
  </>
}
