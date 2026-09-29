import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useFleet } from '../store/FleetContext'
import { Modal } from './ui'
import { materialCategories, materialTotal, maintenanceCosts } from '../lib/maintenance'
import { discardStagedPhotos, materialPhotoUrl, uploadMaterialPhoto } from '../lib/materialPhotos'
import { euroWithCents as money, uid } from '../lib/format'
import type { MaintenanceMaterial, MaintenanceRecord, MaterialPhoto } from '../types'
const editableNumber=(value:number|undefined)=>Number.isFinite(value)?value:''
const parseEditableNumber=(value:string)=>value===''?Number.NaN:Number(value)
export function MaterialPhotoView({photo}:{photo:MaterialPhoto}) {
  const [thumbnail,setThumbnail]=useState(''),[full,setFull]=useState(''),[error,setError]=useState('')
  useEffect(()=>{let active=true;materialPhotoUrl(photo.thumbnailPath).then(url=>{if(active)setThumbnail(url)}).catch(()=>{if(active)setError('Fotografía no disponible')});return()=>{active=false}},[photo.thumbnailPath])
  return <div>{thumbnail&&<img src={thumbnail} alt="Miniatura del material" loading="lazy" className="h-24 w-24 rounded-xl object-cover"/>}<button type="button" className="text-sm font-bold text-brand-600" onClick={()=>void materialPhotoUrl(photo.path).then(setFull).catch(()=>setError('No se ha podido abrir la fotografía'))}>Ver fotografía</button>{error&&<p role="status" className="text-xs">{error}</p>}{full&&<Modal title="Fotografía del material" onClose={()=>setFull('')}><img src={full} alt="Material, pieza o justificante" className="h-auto w-full"/></Modal>}</div>
}
export function MaintenanceEditor({item,onClose}:{item:MaintenanceRecord;onClose:()=>void}) {
  const {state,upsert}=useFleet()
  const [draft,setDraft]=useState<MaintenanceRecord>(()=>({...item,id:item.id||uid('m')})),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const staged=useRef<MaterialPhoto[]>([]),saved=useRef(false)
  useEffect(()=>()=>{if(!saved.current)void discardStagedPhotos(staged.current).catch(()=>{})},[])
  const set=(patch:Partial<MaintenanceRecord>)=>setDraft(d=>({...d,...patch}))
  const update=(id:string,patch:Partial<MaintenanceMaterial>)=>setDraft(d=>({...d,materials:d.materials?.map(m=>m.id===id?{...m,...patch}:m)}))
  const costs=maintenanceCosts(draft)
  const add=()=>set({materials:[...(draft.materials||[]),{id:uid('material'),name:'',category:'Otros',quantity:1,unitPrice:0,purchaseDate:draft.date,notes:'',photos:[]}]})
  const upload=async(id:string,files:FileList|null)=>{
    const material=draft.materials?.find(m=>m.id===id);if(!files||!material)return
    if(files.length+material.photos.length>5){setError('Máximo 5 fotografías por material.');return}
    setBusy(true);setError('')
    try {for(const file of Array.from(files)){const photo=await uploadMaterialPhoto(file,draft.vehicleId,draft.id,id);staged.current.push(photo);setDraft(d=>({...d,materials:d.materials?.map(m=>m.id===id?{...m,photos:[...m.photos,photo]}:m)}))}}
    catch(err){setError(err instanceof Error?err.message:'No se ha podido subir la fotografía.')}finally{setBusy(false)}
  }
  const save=(e:FormEvent)=>{e.preventDefault();if(busy)return;upsert('maintenance',{...draft,cost:costs.total});saved.current=true;const retained=new Set((draft.materials||[]).flatMap(m=>m.photos.map(p=>p.id)));void discardStagedPhotos(staged.current.filter(p=>!retained.has(p.id))).catch(()=>{});onClose()}
  return <Modal title={item.id?'Editar mantenimiento':'Añadir mantenimiento'} onClose={()=>{if(!busy)onClose()}}><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
    {error&&<p role="alert" className="sm:col-span-2 text-red-700">{error}</p>}
    <label><span className="label">Vehículo</span><select className="field" required value={draft.vehicleId} onChange={e=>set({vehicleId:e.target.value})}>{state.vehicles.map(v=><option key={v.id} value={v.id}>{v.plate} · {v.name||v.model}</option>)}</select></label>
    <label><span className="label">Intervención</span><input className="field" required value={draft.type} onChange={e=>set({type:e.target.value})}/></label>
    <label><span className="label">Fecha</span><input className="field" type="date" required value={draft.date} onChange={e=>set({date:e.target.value})}/></label>
    <label><span className="label">Estado</span><select className="field" value={draft.status} onChange={e=>set({status:e.target.value as MaintenanceRecord['status']})}><option value="programado">Pendiente</option><option value="en curso">En curso</option><option value="completado">Finalizado</option></select></label>
    {costs.legacy?<><label><span className="label">Importe total (€)</span><input type="number" min="0" step=".01" className="field" value={editableNumber(draft.cost)} onChange={e=>set({cost:parseEditableNumber(e.target.value)})}/></label><div><p className="mb-2 text-sm text-stone-500">El importe existente se conserva. Al desglosarlo, distribúyelo para no volver a sumar materiales ya incluidos.</p><button type="button" className="btn-secondary" onClick={()=>set({laborCost:draft.cost,otherCost:0,materials:[]})}>Desglosar costes</button></div></>:<>
      <label><span className="label">Mano de obra (€)</span><input className="field" type="number" min="0" step=".01" required value={editableNumber(draft.laborCost)} onChange={e=>set({laborCost:parseEditableNumber(e.target.value)})}/></label><label><span className="label">Otros gastos (€)</span><input className="field" type="number" min="0" step=".01" required value={editableNumber(draft.otherCost)} onChange={e=>set({otherCost:parseEditableNumber(e.target.value)})}/></label>
      <fieldset className="sm:col-span-2 space-y-4"><legend className="mb-3 font-display text-xl font-bold">Materiales y repuestos</legend>{draft.materials?.map((m,index)=><div key={m.id} className="grid gap-3 rounded-xl border border-orange-100 p-4 sm:grid-cols-2">
        <label><span className="label">Nombre del material {index+1}</span><input required className="field" value={m.name} onChange={e=>update(m.id,{name:e.target.value})}/></label><label><span className="label">Categoría</span><select className="field" value={m.category} onChange={e=>update(m.id,{category:e.target.value})}>{materialCategories.map(c=><option key={c}>{c}</option>)}</select></label>
        <label><span className="label">Cantidad</span><input required type="number" min=".001" step=".001" className="field" value={editableNumber(m.quantity)} onChange={e=>update(m.id,{quantity:parseEditableNumber(e.target.value)})}/></label><label><span className="label">Precio unitario (€)</span><input required type="number" min="0" step=".01" className="field" value={editableNumber(m.unitPrice)} onChange={e=>update(m.id,{unitPrice:parseEditableNumber(e.target.value)})}/></label>
        <label><span className="label">Proveedor (opcional)</span><input className="field" value={m.supplier||''} onChange={e=>update(m.id,{supplier:e.target.value})}/></label><label><span className="label">Referencia / pieza (opcional)</span><input className="field" value={m.reference||''} onChange={e=>update(m.id,{reference:e.target.value})}/></label><label><span className="label">Fecha de compra</span><input className="field" type="date" required value={m.purchaseDate} onChange={e=>update(m.id,{purchaseDate:e.target.value})}/></label><p className="self-center font-bold">Total: {money.format(materialTotal(m))}</p>
        <label className="sm:col-span-2"><span className="label">Notas del material</span><textarea className="field" value={m.notes} onChange={e=>update(m.id,{notes:e.target.value})}/></label>
        <div className="sm:col-span-2"><p className="text-sm text-stone-500">Fotografías: {m.photos.length}/5 · Se comprimen antes de subirlas.</p><div className="my-3 flex flex-wrap gap-3">{m.photos.map(photo=><MaterialPhotoView photo={photo} key={photo.id}/>)}</div><label className="label">Galería o archivo<input className="field" type="file" accept="image/*" multiple disabled={busy||m.photos.length>=5} onChange={e=>{void upload(m.id,e.target.files);e.target.value=''}}/></label><label className="label mt-3">Cámara del móvil<input className="field" type="file" accept="image/*" capture="environment" disabled={busy||m.photos.length>=5} onChange={e=>{void upload(m.id,e.target.files);e.target.value=''}}/></label></div>
        <button type="button" className="btn-secondary" disabled={busy} onClick={()=>set({materials:draft.materials?.filter(x=>x.id!==m.id)})}>Quitar material</button>
      </div>)}<button type="button" className="btn-secondary" disabled={busy} onClick={add}>Añadir material</button></fieldset>
      <p className="sm:col-span-2">Mano de obra: {money.format(costs.labor)} · Materiales: {money.format(costs.materials)} · Otros: {money.format(costs.other)}<br/><strong>Total mantenimiento: {money.format(costs.total)}</strong></p>
    </>}
    <label className="sm:col-span-2"><span className="label">Notas</span><textarea className="field" value={draft.notes} onChange={e=>set({notes:e.target.value})}/></label><div className="sm:col-span-2 flex justify-end gap-3"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy?'Subiendo fotografías…':'Guardar mantenimiento'}</button></div>
  </form></Modal>
}
