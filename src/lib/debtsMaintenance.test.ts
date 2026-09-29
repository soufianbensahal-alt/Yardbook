import { describe,it,expect } from 'vitest'
import { emptyState } from '../data/emptyState'
import { debtBalance, debtPaymentHistory, validateDebtPayment } from './debts'
import { maintenanceCosts } from './maintenance'
import { buildReport, economicMovements } from './reports'
import { buildReportWorkbook } from './reportWorkbook'
import { createBackup, parseBackup } from './backups'
import type { ClientDebt, DebtPayment, MaintenanceRecord } from '../types'
const debt:ClientDebt={id:'d',customerId:'c',customerName:'Cliente de prueba',originalAmount:3000,date:'2026-08-01',dueDate:'2026-10-01',reason:'Saldo anterior',notes:'',createdAt:'2026-08-01T00:00:00Z',updatedAt:'2026-08-01T00:00:00Z'}
const payment=(id:string,amount:number,date:string):DebtPayment=>({id,debtId:'d',customerId:'c',amount,date,method:'Transferencia',notes:'',createdAt:`${date}T09:00:00Z`})
describe('deudas y costes reales',()=>{
 it('conserva los 3000 originales, calcula abonos y solo contabiliza lo cobrado en su fecha',()=>{
   const state={...emptyState,debts:[debt],debtPayments:[payment('p2',1000,'2026-09-02'),payment('p1',500,'2026-08-10')]}
   expect(debtBalance(debt,state.debtPayments,'2026-09-28')).toEqual({paid:1500,remaining:1500,status:'Pago parcial'})
   expect(debtPaymentHistory(debt,state.debtPayments).map(p=>p.remaining)).toEqual([2500,1500])
   expect(debt.originalAmount).toBe(3000)
   const report=buildReport(state,'2026-09-28')
   expect(report.summary.totalPaid).toBe(1500);expect(report.summary.monthIncome).toBe(1000)
   expect(buildReport({...state,debtPayments:[]}).summary.totalPaid).toBe(0)
   const names=buildReportWorkbook(state,'2026-09-28').map(s=>s.sheet)
   expect(names).toContain('Deudas');expect(names).toContain('Pagos de deuda')
   expect(parseBackup(JSON.stringify(createBackup(state,'owner')),'owner').data.debtPayments).toEqual(state.debtPayments)
 })
 it('rechaza sobrepagos, duplicados, deudas canceladas y clientes ajenos',()=>{
   const state={...emptyState,debts:[debt],debtPayments:[payment('p1',500,'2026-08-01')]}
   expect(()=>validateDebtPayment(state,payment('p2',2500.01,'2026-09-01'))).toThrow('saldo')
   expect(()=>validateDebtPayment(state,payment('p1',1,'2026-09-01'))).toThrow('registrado')
   expect(()=>validateDebtPayment({...state,debts:[{...debt,cancelled:true}]},payment('p2',1,'2026-09-01'))).toThrow('activa')
   expect(()=>validateDebtPayment(state,{...payment('p2',1,'2026-09-01'),customerId:'other'})).toThrow('cliente')
 })
 it('evita errores de céntimos y diferencia deuda pagada y vencida',()=>{
   const d={...debt,originalAmount:.3}
   expect(debtBalance(d,[payment('p1',.1,'2026-09-01'),payment('p2',.2,'2026-09-02')]).remaining).toBe(0)
   expect(debtBalance(debt,[],'2026-10-02').status).toBe('Atrasada')
 })
 it('desglosa 120 + 81 + 20 sin sumar otra vez el total y conserva importes antiguos',()=>{
   const m:MaintenanceRecord={id:'m',vehicleId:'v',type:'Reparación motor',date:'2026-09-01',status:'completado',notes:'',cost:221,laborCost:120,otherCost:20,materials:[{id:'part',name:'Pieza',category:'Motor',quantity:3,unitPrice:27,purchaseDate:'2026-08-31',notes:'',photos:[]}]}
   expect(maintenanceCosts(m).total).toBe(221)
   const state={...emptyState,maintenance:[m]}
   const movements=economicMovements(state)
   expect(movements.reduce((s,x)=>s+x.amount,0)).toBe(221)
   expect(movements.map(x=>x.category)).toEqual(['Mano de obra','Repuestos','Reparaciones'])
   expect(buildReport(state,'2026-09-28').summary.monthExpenses).toBe(221)
   expect(maintenanceCosts({...m,laborCost:undefined}).total).toBe(221)
 })
})
