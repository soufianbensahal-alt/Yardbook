import { useCallback, useEffect, useState, type ReactNode } from 'react'

const INTRO_DURATION = 6500
const REDUCED_MOTION_DURATION = 500

export function AppIntro({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight,
    coarse: typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches),
  }))
  const [reducedMotion] = useState(() => typeof window !== 'undefined'
    && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
  const aspect = viewport.height / Math.max(1, viewport.width)
  const mobile = viewport.width <= 500
  const tablet = viewport.coarse && viewport.width <= 1366
  const motionBase = mobile
    ? aspect > 1.94 ? '/yardbook-motion-mobile-tall.mp4' : '/yardbook-motion-mobile.mp4'
    : tablet
      ? aspect > 1.05 ? '/yardbook-motion-tablet-portrait.mp4' : aspect >= 0.56 ? '/yardbook-motion-tablet-landscape.mp4' : '/yardbook-motion.mp4'
      : '/yardbook-motion.mp4'
  const motionSource = theme === 'dark' ? motionBase.replace('.mp4', '-dark.mp4') : motionBase
  const finish = useCallback(() => setVisible(false), [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight, coarse:Boolean(window.matchMedia?.('(pointer: coarse)').matches) })
    window.addEventListener('resize', updateViewport, { passive: true })
    window.addEventListener('orientationchange', updateViewport, { passive: true })
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const updateTheme = () => setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light')
    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes:true, attributeFilter:['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(finish, reducedMotion ? REDUCED_MOTION_DURATION : INTRO_DURATION)
    return () => window.clearTimeout(timeout)
  }, [finish, reducedMotion, motionSource])

  return <>
    {children}
    {visible && <section className={`app-intro${reducedMotion ? ' app-intro-reduced' : ''}`} role="status" aria-label="Iniciando Yardbook">
      {reducedMotion
        ? <div className="app-intro-static" aria-hidden="true"><img src={theme === 'dark' ? '/yardbook-logo-light.svg' : '/yardbook-logo.svg'} alt="" /></div>
        : <video
            key={motionSource}
            className={`app-intro-video${mobile ? ' app-intro-video-mobile' : ''}`}
            src={motionSource}
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
