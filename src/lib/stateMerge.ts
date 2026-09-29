import type { FleetState } from '../types'
import { collections } from './backups'
import { cents } from './debts'
const equal=(a:unknown,b:unknown):boolean=>{
  if(a===b)return true
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return false
  const x=a as Record<string,unknown>,y=b as Record<string,unknown>,keys=Object.keys(x)
  return keys.length===Object.keys(y).length&&keys.every(k=>Object.hasOwn(y,k)&&equal(x[k],y[k]))
}
// Preserve independent edits from other devices; never silently overwrite a conflicting record.
export function mergeFleetState(base:FleetState,local:FleetState,remote:FleetState):FleetState {
  const merged=structuredClone(remote)
  for(const key of collections){
    const original=new Map((base[key]||[]).map(x=>[x.id,x]))
    const ours=new Map((local[key]||[]).map(x=>[x.id,x]))
    const theirs=new Map((remote[key]||[]).map(x=>[x.id,x]))
    for(const id of new Set([...original.keys(),...ours.keys()])){
      const before=original.get(id),next=ours.get(id),current=theirs.get(id)
      if(equal(before,next))continue
      if(!equal(before,current)&&!equal(next,current))throw new Error('El mismo registro cambió en otro dispositivo. Tus cambios siguen en la caché local. Guarda una copia antes de recargar y revisar el conflicto.')
      if(next)theirs.set(id,next);else theirs.delete(id)
    }
    Object.assign(merged,{[key]:[...theirs.values()]})
  }
  if(!equal(base.adminSettings,local.adminSettings)){
    if(!equal(base.adminSettings,remote.adminSettings)&&!equal(local.adminSettings,remote.adminSettings))throw new Error('La configuración cambió en otro dispositivo. Revisa los cambios antes de sincronizar.')
    merged.adminSettings=structuredClone(local.adminSettings)
  }
  for(const debt of merged.debts||[]){
    const paid=(merged.debtPayments||[]).filter(p=>p.debtId===debt.id).reduce((s,p)=>s+cents(p.amount),0)
    if(paid>cents(debt.originalAmount))throw new Error('Otro dispositivo ha registrado un pago de esta deuda. Revisa el saldo actualizado antes de confirmar otro pago.')
  }
  return merged
}
