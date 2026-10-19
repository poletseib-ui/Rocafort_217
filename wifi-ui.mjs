import {wifiPayload} from './guest-tools.mjs?v=20261019';
export async function renderWifiQr(container,config){
  const {qrcodegen}=await import('./vendor/qrcodegen.mjs');
  const code=qrcodegen.QrCode.encodeText(wifiPayload(config),qrcodegen.QrCode.Ecc.MEDIUM),border=4,size=code.size+border*2;
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox',`0 0 ${size} ${size}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`QR per connectar a ${config.ssid}`);svg.setAttribute('shape-rendering','crispEdges');
  const background=document.createElementNS(ns,'rect');background.setAttribute('width',size);background.setAttribute('height',size);background.setAttribute('fill','#fff');svg.append(background);
  let path='';for(let y=0;y<code.size;y++)for(let x=0;x<code.size;x++)if(code.getModule(x,y))path+=`M${x+border},${y+border}h1v1h-1z`;
  const pixels=document.createElementNS(ns,'path');pixels.setAttribute('d',path);pixels.setAttribute('fill','#000');svg.append(pixels);container.replaceChildren(svg);
}
