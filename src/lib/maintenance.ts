import type { MaintenanceMaterial, MaintenanceRecord } from '../types'
export const materialCategories=['Motor','Aceite y filtros','Frenos','Neumáticos','Electricidad','Batería','Carrocería','Suspensión','Transmisión','Refrigeración','Iluminación','Interior','Consumibles','Otros']
export const materialTotal=(m:MaintenanceMaterial)=>Math.round(m.quantity*m.unitPrice*100)/100
export function maintenanceCosts(m:MaintenanceRecord) {
  const materials=Math.round((m.materials||[]).reduce((n,p)=>n+materialTotal(p),0)*100)/100
  // Legacy totals remain untouched until the user explicitly enables a breakdown.
  if(m.laborCost===undefined)return {labor:m.cost,materials:0,other:0,total:m.cost,legacy:true}
  const labor=m.laborCost,other=m.otherCost||0
  return {labor,materials,other,total:Math.round((labor+materials+other)*100)/100,legacy:false}
}
