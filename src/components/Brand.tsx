import { Link } from 'react-router-dom'

export function Brand({ compact=false, light=false }: { compact?:boolean; light?:boolean }) {
  return <Link to="/" className={`inline-flex items-center rounded-lg ${compact?'justify-center':'gap-3'}`} aria-label="Yardbook, inicio">
    <img src="/yardbook-mark.svg" alt="" width={compact?36:42} height={compact?36:42} className={`${compact?'size-9':'size-10'} shrink-0`} />
    {!compact && <span className={`font-display text-xl font-extrabold tracking-tight ${light?'text-white':'text-ink'}`}>yardbook</span>}
  </Link>
}
