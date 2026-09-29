import { expect,it } from 'vitest'
import { emptyState } from '../data/emptyState'
import { mergeFleetState } from './stateMerge'
it('combina alertas de dos dispositivos sin borrar ninguna ni duplicar identificadores',()=>{
 const base=structuredClone(emptyState)
 const a={id:'a',title:'ITV',date:'2026-10-01',type:'itv' as const}
 const b={id:'b',title:'Otro',date:'2026-10-02',type:'otro' as const}
 const merged=mergeFleetState(base,{...base,events:[a]},{...base,events:[b]})
 expect(merged.events).toEqual([b,a])
 expect(mergeFleetState(base,{...base,events:[a]},merged).events).toHaveLength(2)
})
it('aplica la última acción local sobre un registro que otro dispositivo cambió',()=>{
 const event={id:'a',title:'ITV',date:'2026-10-01',type:'itv' as const}
 const base={...emptyState,events:[event]},remote={...base,events:[{...event,date:'2026-10-02'}]}
 expect(mergeFleetState(base,{...base,events:[]},remote).events).toEqual([])
 expect(mergeFleetState(base,{...base,events:[{...event,title:'ITV anual'}]},remote).events[0]).toMatchObject({title:'ITV anual',date:'2026-10-01'})
 expect(mergeFleetState(base,base,remote).events[0].date).toBe('2026-10-02')
})
it('conserva pagos simultáneos y bloquea sobrepagos al combinarlos',()=>{
 const debt={id:'d',customerId:'c',customerName:'Test',originalAmount:100,date:'2026-09-01',reason:'Test',notes:'',createdAt:'2026-09-01',updatedAt:'2026-09-01'}
 const p={id:'p1',debtId:'d',customerId:'c',amount:60,date:'2026-09-28',method:'Efectivo',notes:'',createdAt:'2026-09-28'}
 const base={...emptyState,debts:[debt]}
 expect(()=>mergeFleetState(base,{...base,debtPayments:[p]},{...base,debtPayments:[{...p,id:'p2'}]})).toThrow('saldo')
 const merged=mergeFleetState(base,{...base,debtPayments:[p]},{...base,debtPayments:[{...p,id:'p2',amount:40}]})
 expect(merged.debtPayments).toHaveLength(2)
})
