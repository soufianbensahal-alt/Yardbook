import { fireEvent,render,screen } from '@testing-library/react'
import { beforeEach,it,expect,vi } from 'vitest'
import { emptyState } from '../data/emptyState'
import type { FleetState } from '../types'
import { Debts } from './Debts'
import { MaintenanceEditor } from './MaintenanceEditor'
let state:FleetState
const upsert=vi.fn()
vi.mock('../store/FleetContext',()=>({useFleet:()=>({state,upsert,syncStatus:'local'})}))
beforeEach(()=>{upsert.mockClear();state=structuredClone(emptyState);state.customers=[{id:'c',name:'Cliente de prueba',dni:'',phone:'',email:'',rentals:0}]})
it('permite crear una deuda y registra un pago vinculado sin cambiar su importe original',()=>{
 const view=render(<Debts customerId="c"/>)
 fireEvent.click(screen.getByRole('button',{name:'Crear deuda'}))
 fireEvent.change(screen.getByLabelText('Importe original (€)'),{target:{value:'3000'}})
 fireEvent.change(screen.getByLabelText('Motivo'),{target:{value:'Saldo pendiente'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar deuda'}))
 expect(upsert).toHaveBeenCalledWith('debts',expect.objectContaining({originalAmount:3000,customerId:'c',reason:'Saldo pendiente'}))
 state={...state,debts:[upsert.mock.calls[0][1]]};view.rerender(<Debts customerId="c"/>)
 fireEvent.click(screen.getByRole('button',{name:'Registrar pago'}))
 fireEvent.change(screen.getByLabelText('Importe pagado (€)'),{target:{value:'500'}})
 fireEvent.click(screen.getAllByRole('button',{name:'Registrar pago'}).at(-1)!)
 expect(upsert).toHaveBeenLastCalledWith('debtPayments',expect.objectContaining({debtId:state.debts![0].id,amount:500,customerId:'c'}))
 expect(state.debts![0].originalAmount).toBe(3000)
})
it('conserva coste antiguo al abrirlo y guarda el desglose con suma única',()=>{
 const onClose=vi.fn()
 render(<MaintenanceEditor item={{id:'m',vehicleId:'v',type:'Revisión',date:'2026-09-28',cost:120,status:'completado',notes:''}} onClose={onClose}/>)
 expect(screen.getByLabelText('Importe total (€)')).toHaveValue(120)
 fireEvent.click(screen.getByRole('button',{name:'Desglosar costes'}))
 const otherCost=screen.getByLabelText('Otros gastos (€)')
 fireEvent.change(otherCost,{target:{value:''}})
 expect(otherCost).toHaveValue(null)
 fireEvent.change(otherCost,{target:{value:'20'}})
 fireEvent.click(screen.getByRole('button',{name:'Añadir material'}))
 fireEvent.change(screen.getByLabelText('Nombre del material 1'),{target:{value:'Filtro'}})
 const quantity=screen.getByLabelText('Cantidad'),unitPrice=screen.getByLabelText('Precio unitario (€)')
 fireEvent.change(quantity,{target:{value:''}})
 fireEvent.change(quantity,{target:{value:'3'}})
 fireEvent.change(unitPrice,{target:{value:''}})
 fireEvent.change(unitPrice,{target:{value:'27'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar mantenimiento'}).closest('form')!)
 expect(upsert).toHaveBeenCalledWith('maintenance',expect.objectContaining({cost:221,laborCost:120,otherCost:20,materials:[expect.objectContaining({name:'Filtro',quantity:3,unitPrice:27})]}))
 expect(onClose).toHaveBeenCalled()
})
