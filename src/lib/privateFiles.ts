import { getRemoteOwnerId, privateStorage, privateTable, readRemoteSession, storageSignedUrl } from './remoteStore'
import { uid } from './format'
import type { MaintenanceFile, PrivateFile, RentalDocument, RentalDocumentType } from '../types'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp'])
const ALLOWED_TYPES = new Set([...IMAGE_TYPES,'application/pdf'])
type Target =
  | { type:'maintenance'; recordId:string; vehicleId:string }
  | { type:'rental'; recordId:string; vehicleId:string; customerId:string; documentType:RentalDocumentType }

function ownerId() {
  const owner=getRemoteOwnerId(readRemoteSession())
  if(!owner)throw new Error('Inicia sesión para guardar archivos privados.')
  return owner
}

export function validatePrivateFile(file:File) {
  if(!ALLOWED_TYPES.has(file.type))throw new Error('Formato no admitido. Usa PDF, JPG, PNG o WebP.')
  if(file.size>MAX_FILE_SIZE)throw new Error('El archivo supera el límite de 10 MB.')
}

function safeName(name:string) { return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-90) || 'archivo' }
async function imageBlob(file:File,max:number,quality:number) {
  const bitmap=await createImageBitmap(file)
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height))
  const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale)
  canvas.getContext('2d')?.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close()
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se ha podido procesar la imagen.')),'image/webp',quality))
}

export async function uploadPrivateFile(file:File,target:Target):Promise<MaintenanceFile|RentalDocument> {
  validatePrivateFile(file)
  const owner=ownerId(), id=uid('file'), image=IMAGE_TYPES.has(file.type), bucket=target.type==='maintenance'?'maintenance-files':'rental-documents'
  const extension=image?'webp':'pdf'
  const path=`${owner}/${target.recordId}/${id}-${safeName(file.name.replace(/\.[^.]+$/,''))}.${extension}`
  const thumbnailPath=image?`${owner}/${target.recordId}/${id}-thumb.webp`:undefined
  const body=image?await imageBlob(file,2200,.86):file
  if(body.size>MAX_FILE_SIZE)throw new Error('La imagen sigue superando 10 MB después de optimizarla.')
  await privateStorage(`object/${bucket}/${path}`,{method:'POST',body})
  try {
    if(thumbnailPath)await privateStorage(`object/${bucket}/${thumbnailPath}`,{method:'POST',body:await imageBlob(file,420,.78)})
    const common:PrivateFile={id,fileName:file.name,path,thumbnailPath,size:body.size,mimeType:image?'image/webp':'application/pdf',kind:image?'image':'pdf',uploadedAt:new Date().toISOString()}
    const row=target.type==='maintenance'
      ? {id,user_id:owner,maintenance_id:target.recordId,vehicle_id:target.vehicleId,file_name:common.fileName,storage_path:path,thumbnail_path:thumbnailPath||null,mime_type:common.mimeType,file_size:common.size,file_type:common.kind}
      : {id,user_id:owner,rental_id:target.recordId,vehicle_id:target.vehicleId,customer_id:target.customerId,document_type:target.documentType,file_name:common.fileName,storage_path:path,thumbnail_path:thumbnailPath||null,mime_type:common.mimeType,file_size:common.size}
    await privateTable(target.type==='maintenance'?'maintenance_files':'rental_documents','?on_conflict=id',{method:'POST',body:JSON.stringify([row])})
    return target.type==='maintenance'?common:{...common,documentType:target.documentType}
  } catch(error) {
    await privateStorage(`object/${bucket}`,{method:'DELETE',body:JSON.stringify({prefixes:[path,...(thumbnailPath?[thumbnailPath]:[])]})}).catch(()=>{})
    throw error
  }
}

export async function privateFileUrl(file:PrivateFile,target:'maintenance'|'rental',download=false) {
  const bucket=target==='maintenance'?'maintenance-files':'rental-documents'
  const response=await privateStorage(`object/sign/${bucket}/${file.path}`,{method:'POST',body:JSON.stringify({expiresIn:300,download:download?file.fileName:undefined})})
  const data=await response.json() as {signedURL:string}
  return storageSignedUrl(data.signedURL)
}

export async function privateThumbnailUrl(file:PrivateFile,target:'maintenance'|'rental') {
  if(!file.thumbnailPath)return ''
  return privateFileUrl({...file,path:file.thumbnailPath},target)
}

export async function deletePrivateFile(file:PrivateFile,target:'maintenance'|'rental') {
  const bucket=target==='maintenance'?'maintenance-files':'rental-documents'
  await privateStorage(`object/${bucket}`,{method:'DELETE',body:JSON.stringify({prefixes:[file.path,...(file.thumbnailPath?[file.thumbnailPath]:[])]})})
  await privateTable(target==='maintenance'?'maintenance_files':'rental_documents',`?id=eq.${encodeURIComponent(file.id)}`,{method:'DELETE'})
}
