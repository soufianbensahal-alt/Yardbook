import type { ClientDebt, DebtPayment, FleetState } from '../types'
export const cents = (n:number) => Math.round((n + Number.EPSILON) * 100)
export function debtBalance(debt:ClientDebt, payments:DebtPayment[], today=new Date().toISOString().slice(0,10)) {
  const paid=cents(payments.filter(p=>p.debtId===debt.id).reduce((s,p)=>s+cents(p.amount)/100,0))/100
  const remaining=Math.max(0,cents(debt.originalAmount)-cents(paid))/100
  const status=debt.cancelled?'Cancelada':remaining===0?'Pagada':debt.dueDate&&debt.dueDate<today?'Atrasada':paid>0?'Pago parcial':'Pendiente'
  return {paid,remaining,status}
}
export function validateDebtPayment(state:FleetState,payment:DebtPayment) {
  const debt=state.debts?.find(d=>d.id===payment.debtId)
  if(!debt || debt.cancelled || debt.customerId!==payment.customerId)throw new Error('Selecciona una deuda activa del cliente.')
  if(state.debtPayments?.some(p=>p.id===payment.id))throw new Error('Este pago ya está registrado.')
  if(!Number.isFinite(payment.amount)||cents(payment.amount)<=0||cents(payment.amount)>cents(debtBalance(debt,state.debtPayments||[]).remaining))throw new Error('El pago debe ser mayor que cero y no superar el saldo pendiente.')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(payment.date)||!payment.method.trim())throw new Error('Completa la fecha y el método de pago.')
}
export function debtSummary(state:FleetState,today=new Date().toISOString().slice(0,10)) {
  const payments=state.debtPayments||[],debts=state.debts||[]
  const active=debts.filter(d=>!d.cancelled)
  return {original:active.reduce((s,d)=>s+d.originalAmount,0),paid:payments.reduce((s,p)=>s+p.amount,0),pending:active.reduce((s,d)=>s+debtBalance(d,payments,today).remaining,0),monthRecovered:payments.filter(p=>p.date.slice(0,7)===today.slice(0,7)).reduce((s,p)=>s+p.amount,0),customers:new Set(active.filter(d=>debtBalance(d,payments,today).remaining>0).map(d=>d.customerId)).size}
}
export function debtPaymentHistory(debt:ClientDebt,payments:DebtPayment[]) {
  let balance=cents(debt.originalAmount)
  return payments.filter(p=>p.debtId===debt.id).sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)).map(p=>{balance-=cents(p.amount);return {...p,remaining:Math.max(0,balance)/100}})
}
