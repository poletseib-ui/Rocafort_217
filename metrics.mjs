const formatter = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function parts(t) { return Object.fromEntries(formatter.formatToParts(new Date(t)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)])); }
export function localTime(y,m,d,h=0) {
  const target=Date.UTC(y,m-1,d,h); let t=target;
  for(let i=0;i<4;i++){const p=parts(t);t+=target-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);}
  return t;
}
export function dayAt(t,h,offset=0){const p=parts(t), d=new Date(Date.UTC(p.year,p.month-1,p.day+offset));return localTime(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),h);}
export function monthBounds(month){const [y,m]=month.split('-').map(Number);return [localTime(y,m,1),localTime(y,m+1,1)];}
export function reconstruct(events,now=Date.now()){
  const groups=new Map(), intervals=[], issues=[];
  for(const e of events){const key=e.person==='guest'?`guest:${e.name.normalize('NFKC').trim().toLocaleLowerCase('ca')}`:e.person;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
  for(const [key,list] of groups){list.sort((a,b)=>a.at-b.at||String(a.id).localeCompare(String(b.id)));let open=null,last=null;
    const add=(start,end,estimated,reason)=>{if(end>start)intervals.push({key,name:list[0].name,person:list[0].person,start,end,estimated,reason});};
    for(const e of list.filter(e=>e.at<=now)){
      if(e.action==='in'){
        if(open){const end=dayAt(e.at,8);if(end>=open.at&&end<=e.at){add(open.at,end,true,'Dues entrades: sortida estimada a les 08:00.');issues.push({key,at:e.at,text:'Sortida estimada a les 08:00',estimated:true});}else{issues.push({key,at:e.at,text:'Dues entrades: les 08:00 queden fora de l’interval. Tram omès; cal revisar.',estimated:false});}}
        open=e;
      } else {
        if(open){add(open.at,e.at,false,'');open=null;}
        else{const start=dayAt(e.at,19,-1);if(!last||start>=last.at){add(start,e.at,true,'Entrada estimada a les 19:00 del dia anterior.');issues.push({key,at:e.at,text:'Entrada estimada a les 19:00 del dia anterior',estimated:true});}else{issues.push({key,at:e.at,text:'Dues sortides: les 19:00 se solapen amb el fitxatge anterior. Tram omès; cal revisar.',estimated:false});}}
      }
      last=e;
    }
    if(open)add(open.at,now,false,'Estada oberta fins ara');
  }
  return {intervals,issues};
}
function intersection(a,b){return Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));}
export function summarize(events,month,now=Date.now(),rent=1013){
  const [start,end]=monthBounds(month), cutoff=Math.min(end,now), {intervals,issues}=reconstruct(events,now), totals={pol:0,partner:0}, estimated={pol:0,partner:0}, weekdays={pol:Array(7).fill(0),partner:Array(7).fill(0)}, days={pol:new Set(),partner:new Set()}, guests=new Map();
  const clipped=intervals.map(i=>({...i,start:Math.max(start,i.start),end:Math.min(cutoff,i.end)})).filter(i=>i.end>i.start);
  for(const i of clipped){if(i.person==='guest'){if(!guests.has(i.key))guests.set(i.key,{name:i.name,hours:0,days:new Set()});guests.get(i.key).hours+=(i.end-i.start)/36e5;}else{totals[i.person]+=(i.end-i.start)/36e5;if(i.estimated)estimated[i.person]+=(i.end-i.start)/36e5;}
    let t=i.start;while(t<i.end){const next=Math.min(dayAt(t,0,1),i.end),p=parts(t), date=`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`,weekday=(new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay()+6)%7;
      if(i.person==='guest')guests.get(i.key).days.add(date);else{days[i.person].add(date);weekdays[i.person][weekday]+=(next-t)/36e5;}t=next;}
  }
  let together=0;for(const a of clipped.filter(i=>i.person==='pol'))for(const b of clipped.filter(i=>i.person==='partner'))together+=intersection(a,b)/36e5;
  const occupied=totals.pol+totals.partner-together, elapsed=Math.max(0,cutoff-start)/36e5;
  return {totals,estimated,weekdays,days:{pol:days.pol.size,partner:days.partner.size},together,occupied,empty:Math.max(0,elapsed-occupied),calendarHourly:rent/((end-start)/36e5),daily:rent/((Date.UTC(parts(end-1).year,parts(end-1).month-1,parts(end-1).day)-Date.UTC(parts(start).year,parts(start).month-1,1))/864e5+1),guests:[...guests.values()].map(g=>({...g,days:[...g.days]})),issues:issues.filter(i=>i.at>=start&&i.at<end),intervals:clipped};
}
