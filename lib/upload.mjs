import {connect} from 'node:net';
import {hash,fixtureDXF,fixturePDF} from './db.mjs';
const max=5*1024*1024;
const safeHashes=new Set([hash(fixtureDXF),hash(fixturePDF)]);
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
export async function formData(req,limit=16*1024*1024){
 const type=req.headers['content-type']??'';
 if(!/^(multipart\/form-data;|application\/x-www-form-urlencoded(?:;|$))/i.test(type))throw new HttpError(415,'Nicht unterstütztes Formularformat / Unsupported form format');
 if(Number(req.headers['content-length'])>limit)throw new HttpError(413,'Dateien zu groß / Files too large');
 let length=0;const chunks=[];
 for await(const chunk of req.iterator({destroyOnReturn:false})){length+=chunk.length;if(length>limit){req.resume();throw new HttpError(413,'Dateien zu groß / Files too large');}chunks.push(chunk);}
 try{return await new Request('http://localhost',{method:'POST',headers:{'content-type':type},body:Buffer.concat(chunks)}).formData();}catch{throw new HttpError(400,'Ungültige Formulardaten / Invalid form data');}
}
export async function scan(body){
 if(safeHashes.has(hash(body)))return;
 if(!process.env.CLAMD_HOST)throw new HttpError(422,'Ohne konfigurierten Virenscanner sind nur die bereitgestellten Testdateien zulässig. / Only supplied sample files are accepted until scanning is configured.');
 const result=await new Promise((resolve,reject)=>{
  const socket=connect(Number(process.env.CLAMD_PORT||3310),process.env.CLAMD_HOST);let data='';
  socket.setTimeout(8000,()=>socket.destroy(new Error('Timeout')));
  socket.once('connect',()=>{const n=Buffer.alloc(4);n.writeUInt32BE(body.length);socket.write('zINSTREAM\0');socket.write(n);socket.write(body);socket.write(Buffer.alloc(4));});
  socket.on('data',chunk=>{data+=chunk;if(data.length>4096)socket.destroy(new Error('Response too large'));});
  socket.on('end',()=>resolve(data));socket.on('error',reject);
 }).catch(()=>{throw new HttpError(503,'Dateiprüfung nicht verfügbar / File scan unavailable');});
 if(!/^stream: OK\s*\0?$/.test(result))throw new HttpError(422,'Datei nicht freigegeben / File rejected by scanner');
}
export async function uploads(form,field='files',mode='engineering'){
 const items=form.getAll(field).filter(v=>typeof v!=='string'&&v.name&&v.size);
 if(items.length>3)throw new HttpError(422,'Maximal 3 Dateien / Maximum 3 files');
 return Promise.all(items.map(async file=>{
  const name=file.name.normalize('NFKC').replace(/[^\p{L}\p{N}_. -]/gu,'_').slice(-120);
  const ext=name.split('.').at(-1)?.toLowerCase();
  const body=Buffer.from(await file.arrayBuffer()), head=body.subarray(0,4096).toString('latin1');
  if(body.length>max)throw new HttpError(413,'Maximal 5 MB je Datei / Maximum 5 MB per file');
  const allowed=ext==='pdf'&&/^%PDF-1\.[0-7]/.test(head)||
   mode==='engineering'&&((['step','stp'].includes(ext)&&/^\s*ISO-10303-21;/i.test(head))||
   (['iges','igs'].includes(ext)&&head.split(/\r?\n/)[0]?.[72]==='S')||
   (ext==='dxf'&&/^\s*0\s+SECTION\s+2\s+/i.test(head)));
  if(!allowed)throw new HttpError(422,'Nicht unterstütztes Dateiformat / Unsupported file format');
  await scan(body);
  return {name,mime:ext==='pdf'?'application/pdf':'application/octet-stream',body};
 }));
}
export function field(form,key,max,{required=true}={}){
 const raw=form.get(key); const v=typeof raw==='string'?raw.trim():'';
 if((required&&!v)||v.length>max||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(v))throw new HttpError(422,'Bitte prüfen / Check field: '+key);
 return v;
}
export function emailAddress(v){const email=v.trim().toLowerCase();if(email.length>254||!/^[-a-z0-9.!#$%&'*+/=?^_`{|}~]+@[-a-z0-9](?:[-a-z0-9.]*[-a-z0-9])?\.[a-z]{2,}$/i.test(email)||email.includes('..'))throw new HttpError(422,'Bitte eine gültige E-Mail-Adresse eingeben / Enter a valid email address');return email;}

