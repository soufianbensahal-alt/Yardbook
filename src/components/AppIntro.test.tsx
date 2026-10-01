import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppIntro } from './AppIntro'

describe('AppIntro', () => {
  afterEach(() => vi.useRealTimers())

  it('muestra la introduccion una vez y se oculta automaticamente', () => {
    vi.useFakeTimers()
    render(<AppIntro><main>Aplicacion</main></AppIntro>)

    expect(screen.getByRole('status', { name:'Iniciando Yardbook' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/Saltar introducción/i)).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(6500))
    expect(screen.queryByRole('status', { name:'Iniciando Yardbook' })).not.toBeInTheDocument()
    expect(screen.getByText('Aplicacion')).toBeInTheDocument()
  })
})
