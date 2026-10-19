// Cloudflare Worker: fitxatges privats de Rocafort 217.
// Secrets: HOUSEHOLD_KEY i GUEST_KEY. Binding D1: DB.
const encoder = new TextEncoder();
async function sameKey(a,b) {
  if(typeof a!=='string'||typeof b!=='string')return false;
  const [x,y]=await Promise.all([a,b].map(k=>crypto.subtle.digest('SHA-256',encoder.encode(k))));
  const left=new Uint8Array(x),right=new Uint8Array(y);let different=0;
  for(let i=0;i<left.length;i++)different|=left[i]^right[i];
  return different===0;
}
class BadRequest extends Error {}
async function readBody(request){
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new BadRequest('Cal enviar JSON.');
  if(Number(request.headers.get('Content-Length')||0)>16384)throw new BadRequest('Petició massa gran.');
  const reader=request.body?.getReader();if(!reader)throw new BadRequest('Petició buida.');
  const chunks=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>16384){await reader.cancel();throw new BadRequest('Petició massa gran.');}chunks.push(value);}
  const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  try{const b=JSON.parse(new TextDecoder().decode(bytes));if(!b||typeof b!=='object'||Array.isArray(b))throw new Error();return b;}catch{throw new BadRequest('JSON no vàlid.');}
}
async function settings(env){const row=await env.DB.prepare('SELECT value FROM settings WHERE id=1').first();if(!row)throw new Error('schema');return JSON.parse(row.value);}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin');
    const allowed=env.ALLOWED_ORIGIN;
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
    const send=(status,value)=>new Response(JSON.stringify(value),{status,headers});
    if(!allowed||!/^https?:\/\/[^/]+$/.test(allowed))return send(503,{error:'Falta configurar ALLOWED_ORIGIN sense camí ni barra final.'});
    if(origin&&origin!==allowed)return send(403,{error:'Origen no autoritzat'});
    if(origin){headers['Access-Control-Allow-Origin']=allowed;headers['Access-Control-Allow-Headers']='Authorization, Content-Type';headers['Access-Control-Allow-Methods']='GET, POST, PUT, OPTIONS';headers['Access-Control-Max-Age']='86400';}
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const url=new URL(request.url);
    if(request.method==='GET'&&url.pathname==='/api/health')return send(200,{ok:true,service:'rocafort-217'});
    const publicAccess=env.PUBLIC_ACCESS==='true';
    if(request.method==='GET'&&url.pathname==='/api/access')return send(200,{publicAccess});
    if(request.method==='GET'&&url.pathname==='/api/wifi'){
      // Els propietaris activen explícitament la compartició pública.
      if(env.WIFI_ENABLED!=='true'||!env.WIFI_SSID)return send(200,{configured:false});
      const security=env.WIFI_SECURITY||'WPA',password=env.WIFI_PASSWORD||'';
      if(!['WPA','WEP','nopass'].includes(security)||new TextEncoder().encode(env.WIFI_SSID).length>32||(security!=='nopass'&&!password)||password.length>128)return send(200,{configured:false});
      return send(200,{configured:true,ssid:env.WIFI_SSID,password:security==='nopass'?'':password,security,hidden:env.WIFI_HIDDEN==='true'});
    }
    if(!url.pathname.startsWith('/api/'))return send(404,{error:'No trobat'});
    if(!env.DB||!publicAccess&&(typeof env.HOUSEHOLD_KEY!=='string'||env.HOUSEHOLD_KEY.length<24||typeof env.GUEST_KEY!=='string'||env.GUEST_KEY.length<24||env.HOUSEHOLD_KEY===env.GUEST_KEY))return send(503,{error:'Cal configurar DB i dues claus diferents d’almenys 24 caràcters.'});
    const authorization=request.headers.get('Authorization')||'';
    if(authorization.length>1024)return send(401,{error:'Clau incorrecta'});
    const token=authorization.startsWith('Bearer ')?authorization.slice(7):'';
    const [isHome,isGuest]=publicAccess?[true,false]:await Promise.all([sameKey(token,env.HOUSEHOLD_KEY),sameKey(token,env.GUEST_KEY)]);
    if(!isHome&&!isGuest)return send(401,{error:'Clau incorrecta o sessió caducada'});
    try{
      if(request.method==='POST'&&url.pathname==='/api/events'){
        const b=await readBody(request);
        if(!['pol','partner','guest'].includes(b.person)||!['in','out'].includes(b.action)||(!isHome&&b.person!=='guest'))return send(403,{error:'Fitxatge no permès'});
        if(typeof b.requestId!=='string'||! /^[a-zA-Z0-9-]{10,80}$/.test(b.requestId)||b.person==='guest'&&typeof b.name!=='string')return send(400,{error:'Nom o identificador no vàlid'});
        const name=b.person==='guest'?b.name.normalize('NFKC').trim():(await settings(env))[b.person];
        if(!name||name.length>80)return send(400,{error:'Nom no vàlid'});
        const id=crypto.randomUUID(),at=Date.now();
        // La restricció UNIQUE i INSERT OR IGNORE resolen reintents simultanis.
        const result=await env.DB.prepare('INSERT OR IGNORE INTO events(id,person,name,action,at,request_id) VALUES(?,?,?,?,?,?)').bind(id,b.person,name,b.action,at,b.requestId).run();
        const saved=await env.DB.prepare('SELECT id,person,name,action,at FROM events WHERE request_id=?').bind(b.requestId).first();
        if(!saved)throw new Error('write');
        if(saved.person!==b.person||saved.action!==b.action||saved.name!==name)return send(409,{error:'Identificador ja utilitzat per un altre moviment'});
        return send(result.meta.changes?201:200,{ok:true,id:saved.id,at:saved.at});
      }
      if(!isHome)return send(403,{error:'Només la llar pot consultar aquestes dades'});
      if(request.method==='GET'&&url.pathname==='/api/state'){
        const results=await env.DB.batch([env.DB.prepare('SELECT id,person,name,action,at FROM events ORDER BY at,id'),env.DB.prepare('SELECT value FROM settings WHERE id=1')]);
        if(!results[1].results[0])throw new Error('schema');
        return send(200,{events:results[0].results,settings:JSON.parse(results[1].results[0].value)});
      }
      if(request.method==='PUT'&&url.pathname==='/api/settings'){
        const b=await readBody(request);
        if(!Number.isFinite(b.rent)||b.rent<0||b.rent>100000||!['half','presence'].includes(b.split)||!['pol','partner'].every(k=>typeof b[k]==='string'&&b[k].trim().length>0&&b[k].length<=80))return send(400,{error:'Configuració no vàlida'});
        const s={rent:b.rent,pol:b.pol.trim(),partner:b.partner.trim(),split:b.split};
        await env.DB.prepare('UPDATE settings SET value=? WHERE id=1').bind(JSON.stringify(s)).run();return send(200,{ok:true});
      }
      if(request.method==='PUT'&&/^\/api\/events\/[a-zA-Z0-9-]+$/.test(url.pathname)){
        const b=await readBody(request);
        if(!Number.isSafeInteger(b.at)||b.at<0||b.at>Date.now()||!['in','out'].includes(b.action))return send(400,{error:'Hora o acció no vàlida'});
        const result=await env.DB.prepare('UPDATE events SET at=?,action=? WHERE id=?').bind(b.at,b.action,url.pathname.slice(12)).run();return send(result.meta.changes?200:404,{ok:!!result.meta.changes});
      }
      return send(404,{error:'No trobat'});
    }catch(error){
      if(error instanceof BadRequest)return send(400,{error:error.message});
      return send(503,{error:'No s’ha pogut accedir a les dades. Comprova el binding DB i que s’hagi executat schema.sql; torna-ho a provar.'});
    }
  }
};
