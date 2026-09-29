// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { it,expect,vi } from 'vitest'
it('no vuelve a mostrar avisos reintentados y no muestra notificaciones de otra cuenta',async()=>{
 const handlers:Record<string,(event:unknown)=>void>={},showNotification=vi.fn().mockResolvedValue(undefined)
 const storage=new Map<string,unknown>([['owner','owner-a']])
 const context={self:{addEventListener:(name:string,handler:(e:unknown)=>void)=>{handlers[name]=handler},registration:{showNotification}},store:storage,Promise}
 runInNewContext(readFileSync('public/notification-sw.js','utf8')+`\nownerStore=async(mode,value,key='owner')=>{if(mode==='readwrite')store.set(key,value);return store.get(key)}`,context)
 const push=(ownerId:string,tag:string)=>new Promise<void>((resolve,reject)=>handlers.push({data:{json:()=>({ownerId,tag,body:'ITV',url:'/app/calendario?reminder=test'})},waitUntil:(p:Promise<void>)=>p.then(resolve,reject)}))
 await Promise.all([push('owner-a','delivery-1'),push('owner-a','delivery-1'),push('owner-b','delivery-2')])
 expect(showNotification).toHaveBeenCalledTimes(1)
 expect(showNotification.mock.calls[0][1]).toMatchObject({tag:'delivery-1',data:{ownerId:'owner-a'}})
})
