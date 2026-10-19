export const guestIdentity=name=>String(name).normalize('NFKC').trim().toLocaleLowerCase('ca');
const searchKey=name=>guestIdentity(name).normalize('NFD').replace(/\p{M}/gu,'');
export function registeredGuestNames(events){
  const known=new Map();
  for(const e of events)if(e.person==='guest'&&e.name?.trim()){
    const name=e.name.normalize('NFKC').trim(),key=guestIdentity(name);
    if(!known.has(key))known.set(key,name);
  }
  return [...known.values()].sort((a,b)=>a.localeCompare(b,'ca'));
}
export function suggestGuestNames(events,query){
  const prefix=searchKey(query);
  return prefix?registeredGuestNames(events).filter(name=>searchKey(name).startsWith(prefix)).slice(0,6):[];
}
export function isFirstGuestEntry(events,name,action){
  return action==='in'&&!registeredGuestNames(events).some(n=>guestIdentity(n)===guestIdentity(name));
}
export function wifiPayload({ssid,password='',security='WPA',hidden=false}){
  if(typeof ssid!=='string'||!ssid||new TextEncoder().encode(ssid).length>32)throw new Error('Nom de xarxa no vàlid.');
  if(!['WPA','WEP','nopass'].includes(security)||typeof password!=='string'||password.length>128)throw new Error('Configuració Wi-Fi no vàlida.');
  const escape=value=>value.replace(/[\\;,:"']/g,ch=>'\\'+ch);
  return `WIFI:T:${security};S:${escape(ssid)};P:${escape(security==='nopass'?'':password)};H:${hidden?'true':'false'};;`;
}
