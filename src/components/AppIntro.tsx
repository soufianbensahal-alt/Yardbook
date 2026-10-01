import { useCallback, useEffect, useState, type ReactNode } from 'react'

const INTRO_DURATION = 6500
const REDUCED_MOTION_DURATION = 500

export function AppIntro({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [reducedMotion] = useState(() => typeof window !== 'undefined'
    && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
  const finish = useCallback(() => setVisible(false), [])

  useEffect(() => {
    const timeout = window.setTimeout(finish, reducedMotion ? REDUCED_MOTION_DURATION : INTRO_DURATION)
    return () => window.clearTimeout(timeout)
  }, [finish, reducedMotion])

  return <>
    {children}
    {visible && <section className={`app-intro${reducedMotion ? ' app-intro-reduced' : ''}`} role="status" aria-label="Iniciando Yardbook">
      <div className="app-intro-stage" aria-hidden="true">
        <header className="app-intro-header">
          <span>YARDBOOK <i>/</i> IDENTIDAD VISUAL</span>
          <span>GESTIÓN DE FLOTAS</span>
        </header>
        <div className="app-intro-brand">
          <img src="/yardbook-mark.svg" alt="" />
          <span>yardbook</span>
        </div>
        <p className="app-intro-claim">Tu flota. Bajo control.</p>
        <footer className="app-intro-footer">Un punto de encuentro para todos tus vehículos.</footer>
      </div>
    </section>}
  </>
}
