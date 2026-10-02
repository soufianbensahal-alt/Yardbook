import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppIntro } from './AppIntro'

describe('AppIntro', () => {
  afterEach(() => {
    vi.useRealTimers()
    delete document.documentElement.dataset.theme
    Object.defineProperty(window, 'innerWidth', { configurable:true, value:1024 })
    Object.defineProperty(window, 'innerHeight', { configurable:true, value:768 })
  })

  it('muestra la introduccion una vez y se oculta automaticamente', () => {
    vi.useFakeTimers()
    render(<AppIntro><main>Aplicacion</main></AppIntro>)

    expect(screen.getByRole('status', { name:'Iniciando Yardbook' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/Saltar introducción/i)).not.toBeInTheDocument()
    expect(document.querySelector('video')).toHaveAttribute('src', '/yardbook-motion.mp4')
    expect(document.body.style.overflow).toBe('hidden')
    act(() => vi.advanceTimersByTime(6500))
    expect(screen.queryByRole('status', { name:'Iniciando Yardbook' })).not.toBeInTheDocument()
    expect(screen.getByText('Aplicacion')).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('selecciona el motion vertical de acuerdo con la proporción de pantalla', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', { configurable:true, value:390 })
    Object.defineProperty(window, 'innerHeight', { configurable:true, value:844 })
    const tall = render(<AppIntro><main>Aplicacion</main></AppIntro>)
    expect(document.querySelector('video')).toHaveAttribute('src', '/yardbook-motion-mobile-tall.mp4')
    tall.unmount()

    Object.defineProperty(window, 'innerWidth', { configurable:true, value:375 })
    Object.defineProperty(window, 'innerHeight', { configurable:true, value:667 })
    render(<AppIntro><main>Aplicacion</main></AppIntro>)
    expect(document.querySelector('video')).toHaveAttribute('src', '/yardbook-motion-mobile.mp4')
  })

  it('usa el motion oscuro cuando la interfaz está en modo oscuro', () => {
    vi.useFakeTimers()
    document.documentElement.dataset.theme = 'dark'
    Object.defineProperty(window, 'innerWidth', { configurable:true, value:390 })
    Object.defineProperty(window, 'innerHeight', { configurable:true, value:844 })

    render(<AppIntro><main>Aplicacion</main></AppIntro>)

    expect(document.querySelector('video')).toHaveAttribute('src', '/yardbook-motion-mobile-tall-dark.mp4')
  })
})
