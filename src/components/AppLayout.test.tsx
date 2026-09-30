import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FleetProvider } from '../store/FleetContext'
import { AppLayout } from './AppLayout'
import { Modal } from './ui'

function setDesktop(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches, media:'', onchange:null, addListener:()=>{}, removeListener:()=>{}, addEventListener:()=>{}, removeEventListener:()=>{}, dispatchEvent:()=>false }),
  })
}

function renderLayout() {
  return render(<FleetProvider><MemoryRouter initialEntries={['/app']}><Routes><Route path="/app" element={<AppLayout/>}><Route index element={<p>Dashboard</p>}/></Route></Routes></MemoryRouter></FleetProvider>)
}

describe('AppLayout navigation',()=>{
  beforeEach(()=>localStorage.clear())

  it('contrae y expande el menú desde el hamburger en escritorio',()=>{
    setDesktop(true)
    const {container}=renderLayout()
    const toggle=container.querySelector('header .icon-btn') as HTMLButtonElement
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-label','Expandir menú')
    expect(toggle).toHaveAttribute('aria-expanded','false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-label','Alternar menú')
    expect(toggle).toHaveAttribute('aria-expanded','true')
  })

  it('muestra la navegación inferior y abre el panel Más en móvil',()=>{
    setDesktop(false)
    renderLayout()
    const mobileNav=screen.getByRole('navigation',{name:'Navegación móvil'})
    expect(mobileNav).toBeInTheDocument()
    expect(mobileNav.parentElement).toBe(document.body)
    expect(mobileNav).toHaveClass('mobile-bottom-nav','md:hidden')
    fireEvent.click(screen.getByRole('button',{name:'Más secciones'}))
    const secondaryNav=screen.getByRole('navigation',{name:'Navegación secundaria'})
    expect(secondaryNav).toBeInTheDocument()
    expect(secondaryNav.closest('section')?.parentElement).toBe(document.body)
    expect(screen.getByRole('img',{name:'Monkey Rentals'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Cerrar'}))
    expect(screen.queryByRole('navigation',{name:'Navegación secundaria'})).not.toBeInTheDocument()
  })

  it('mantiene Calendario como acceso rápido móvil y Pagos en la barra principal',()=>{
    setDesktop(false)
    renderLayout()
    expect(screen.getByRole('link',{name:'Abrir calendario'})).toBeInTheDocument()
    const mobileNav=screen.getByRole('navigation',{name:'Navegación móvil'})
    expect(mobileNav).toHaveTextContent('Pagos')
    expect(mobileNav).not.toHaveTextContent('Calendario')
  })

  it('abre y cierra el panel de notificaciones móvil por encima de la navegación',()=>{
    setDesktop(false)
    renderLayout()
    fireEvent.click(screen.getByRole('button',{name:'0 alertas'}))
    const panel=screen.getByRole('dialog',{name:'Notificaciones'})
    expect(panel).toBeInTheDocument()
    expect(panel.parentElement).toBe(document.body)
    expect(screen.getByText('No tienes avisos pendientes.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Cerrar notificaciones'}))
    expect(screen.queryByRole('dialog',{name:'Notificaciones'})).not.toBeInTheDocument()
  })

  it('no muestra la X del drawer al contraer el menú de escritorio',()=>{
    setDesktop(true)
    const {container}=renderLayout()
    fireEvent.click(container.querySelector('header .icon-btn') as HTMLButtonElement)
    expect(screen.queryByRole('button',{name:'Cerrar menú lateral'})).not.toBeInTheDocument()
    expect(container.querySelector('aside img')).toHaveClass('size-9')
  })
})

describe('Modal',()=>{
  it('se centra y mantiene un alto máximo responsive',()=>{
    render(<Modal title="Añadir vehículo" onClose={()=>{}}><p>Formulario</p></Modal>)
    const dialog=screen.getByRole('dialog')
    expect(dialog.parentElement).toBe(document.body)
    expect(dialog).toHaveClass('fixed','inset-0','h-dvh','w-screen','items-center','justify-center','z-[1000]')
    expect(dialog.firstElementChild).toHaveClass('max-h-[calc(100dvh-1.5rem)]','max-w-2xl','flex-col','overflow-hidden')
    expect(screen.getByText('Formulario').parentElement).toHaveClass('overflow-y-auto','overscroll-contain')
  })

  it('mantiene el foco del campo cuando el formulario se vuelve a renderizar',()=>{
    function FormModal(){
      const [value,setValue]=useState('')
      return <Modal title="Editar" onClose={()=>{}}><label>Dato<input aria-label="Dato" value={value} onChange={event=>setValue(event.target.value)}/></label></Modal>
    }
    render(<FormModal/>)
    const input=screen.getByRole('textbox',{name:'Dato'})
    input.focus()
    fireEvent.change(input,{target:{value:'abc'}})
    expect(input).toHaveValue('abc')
    expect(input).toHaveFocus()
  })

  it('mantiene bloqueado el fondo hasta cerrar todos los modales anidados',()=>{
    function NestedModals(){
      const [outer,setOuter]=useState(true),[inner,setInner]=useState(true)
      return <>{outer&&<Modal title="Exterior" onClose={()=>setOuter(false)}><button onClick={()=>setInner(false)}>Cerrar interior</button>{inner&&<Modal title="Interior" onClose={()=>setInner(false)}>Contenido</Modal>}</Modal>}</>
    }
    render(<NestedModals/>)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button',{name:'Cerrar interior'}))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button',{name:'Cerrar'}))
    expect(document.body.style.overflow).toBe('')
  })
})
