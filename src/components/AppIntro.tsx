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
    {visible && <section className="app-intro" role="status" aria-label="Iniciando Yardbook">
      {reducedMotion
        ? <div className="app-intro-static" aria-hidden="true"><img src="/yardbook-logo.svg" alt="" /></div>
        : <video
            className="app-intro-video"
            src="/yardbook-motion.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            onEnded={finish}
            aria-hidden="true"
          />}
    </section>}
  </>
}
