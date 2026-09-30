import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { emptyState } from '../data/emptyState'
import { createAdministrativeBackup } from './administrativeBackup'

describe('copia administrativa',()=>{
  it('genera el nombre legible y la estructura principal del ZIP',async()=>{
    const now=new Date('2026-09-30T10:00:00Z')
    const progress:number[]=[]
    const result=await createAdministrativeBackup(structuredClone(emptyState),'user-a',value=>progress.push(value.percent),now)
    expect(result.filename).toBe('Yardbook-Backup-2026-09-30.zip')
    const zip=await JSZip.loadAsync(result.blob)
    const root='Yardbook Backup - 2026-09-30/'
    for(const path of ['Clientes/clientes.xlsx','Flota/flota.xlsx','Alquileres/alquileres.xlsx','Pagos/pagos.xlsx','Pagos/deudas.xlsx','Mantenimiento/mantenimientos.xlsx','Mantenimiento/materiales.xlsx','ITV y Documentación/itv_documentacion.xlsx','Multas e Impuestos/multas_impuestos.xlsx','Calendario y Alertas/alertas.xlsx','Informes/resumen.xlsx','Configuración/configuracion.xlsx','Copia técnica/yardbook-backup.json','LEEME.txt'])expect(zip.file(root+path)).not.toBeNull()
    expect(progress.at(-1)).toBe(100)
  })
})
