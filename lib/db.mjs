import { readFileSync, mkdirSync } from 'node:fs';
import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { resolve } from 'node:path';
import { entries, pair } from './content.mjs';
import {dataDir} from './location.mjs';
const cloudflareRuntime=Boolean(globalThis.__KLAUS_CLOUDFLARE__);
const cloudDatabase=globalThis.__KLAUS_DB;
const databaseScope=new AsyncLocalStorage();
// node:sqlite is intentionally unavailable in Cloudflare Workers. Keep that
// module out of the Worker module graph and load it only for local operation.
const DatabaseSync=cloudDatabase?null:(await import('node:sqlite')).DatabaseSync;
if(!cloudDatabase)mkdirSync(dataDir,{recursive:true,mode:0o700});
export const db = cloudDatabase||new DatabaseSync(resolve(dataDir,'prototype.sqlite'));
if(cloudDatabase)db.exec('CREATE TABLE IF NOT EXISTS migrations(id INTEGER PRIMARY KEY)');
else db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS migrations(id INTEGER PRIMARY KEY);');
const activeDatabase=()=>databaseScope.getStore()?.db||db;
export const withDatabase=(context,callback)=>databaseScope.run(context,callback);
export const get=(sql,...params)=>activeDatabase().prepare(sql).get(...params);
export const all=(sql,...params)=>activeDatabase().prepare(sql).all(...params);
export const run=(sql,...params)=>activeDatabase().prepare(sql).run(...params);
export function atomic(fn){const context=databaseScope.getStore();if(context?.atomic)return context.atomic(fn);if(globalThis.__KLAUS_ATOMIC)return globalThis.__KLAUS_ATOMIC(fn);const database=activeDatabase();database.exec('BEGIN IMMEDIATE');try{const value=fn();database.exec('COMMIT');return value;}catch(err){database.exec('ROLLBACK');throw err;}}
if(!get('SELECT id FROM migrations WHERE id=1')) atomic(()=>{db.exec(globalThis.__KLAUS_SCHEMA||readFileSync(new URL('../db/001-init.sql',import.meta.url),'utf8'));run('INSERT INTO migrations VALUES(1)');});
export const id = randomUUID;
export const secret=()=>randomBytes(32).toString('base64url');
export const hash=(value)=>createHash('sha256').update(value).digest('hex');
export const stamp=()=>Math.floor(Date.now()/1000);
export const audit=(actor,event,object=null)=>run('INSERT INTO audit(actor,event,object) VALUES(?,?,?)',actor?.id??null,event,object);
export const roles=['admin','editor','sales','manager','hr','customer'];
export const grants={admin:['cms','publish','sales','project','hr','users','settings'],editor:['cms'],sales:['sales','project'],manager:['project','sales'],hr:['hr'],customer:[]};
export const can=(user,key)=>Boolean(user&&grants[user.role]?.includes(key));
export const demoUsers=roles.map(role=>({id:'demo-'+role,role,name:'Demo · '+role,email:role+'@example.test'})).concat([{id:'demo-other',role:'customer',name:'Demo · Zweites Kundenkonto',email:'other@example.test'}]);
export function passwordHash(password){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function passwordOK(password,stored){const [salt,key]=String(stored||'dummy:'+('0'.repeat(128))).split(':');return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(key,'hex'));}
export function session(user){const token=secret();run('DELETE FROM sessions WHERE expires <= ?',stamp());run('INSERT INTO sessions VALUES(?,?,?)',hash(token),user.id,stamp()+28800);return token;}
export function userFor(req){const token=req.headers.cookie?.match(/(?:^|; )klaus_session=([A-Za-z0-9_-]{43})(?:;|$)/)?.[1];return token?get('SELECT u.*,s.token_hash session_hash FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires>? AND u.active=1 AND u.verified=1',hash(token),stamp()):null;}
export function limit(key,max,duration){return atomic(()=>{const t=stamp(), old=get('SELECT * FROM rate_limits WHERE key=?',key);if(old&&old.expires>t){if(old.count>=max)return false;run('UPDATE rate_limits SET count=count+1 WHERE key=?',key);}else{run('INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)',key,1,t+duration);}return true;});}
export function catalog(kind){return all('SELECT published FROM content WHERE kind=? AND published IS NOT NULL ORDER BY slug',kind).map(r=>JSON.parse(r.published)).sort((a,b)=>a.index.localeCompare(b.index));}
export function findContent(kind,slug,draft=false){const row=get('SELECT draft,published FROM content WHERE kind=? AND slug=?',kind,slug);return row&&(draft||row.published)?JSON.parse(draft?row.draft:row.published):null;}
export function documentAccess(user,file){if(!user||!file)return false;if(file.application_id)return can(user,'hr');if(file.project_id)return can(user,'project')||get('SELECT owner FROM projects WHERE id=?',file.project_id)?.owner===user.id;return can(user,'sales')||get('SELECT owner FROM inquiries WHERE id=?',file.inquiry_id)?.owner===user.id;}
export function projectAccess(user,project){return !!(user&&project&&(can(user,'project')||project.owner===user.id));}
export const fixtureDXF=Buffer.from('0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0.0\n20\n0.0\n30\n0.0\n11\n80.0\n21\n40.0\n31\n0.0\n0\nENDSEC\n0\nEOF\n');
function pdf(){const str='BT /F1 20 Tf 60 720 Td (KLAUS - Local demo document) Tj 0 -35 Td /F1 12 Tf (Illustrative sample. No customer data.) Tj ET';const objs=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+str.length+' >>\nstream\n'+str+'\nendstream'];let data='%PDF-1.4\n';const offsets=[0];for(const [i,o] of objs.entries()){offsets.push(data.length);data+=(i+1)+' 0 obj\n'+o+'\nendobj\n';}const xref=data.length;return Buffer.from(data+'xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');}
export const fixturePDF=pdf();
const demoRef={kind:'reference',slug:'demo-gehaeuse',index:'01',title:pair('DEMO · Präzisionsgehäuse','DEMO · Precision housing'),body:pair('Fiktiver Datensatz zur internen Vorführung des redaktionellen Workflows.','Fictional record for demonstrating editorial workflow internally.'),source:'',meta:{demo:true,category:'milling',material:'aluminium',industry:'engineering',type:'prototype'}};
if(!get("SELECT value FROM settings WHERE key='initialized'"))atomic(()=>{
 if(!cloudflareRuntime)for(const u of demoUsers)run('INSERT INTO users(id,email,name,role,verified) VALUES(?,?,?,?,1)',u.id,u.email,u.name,u.role);
 for(const c of [...entries,...(cloudflareRuntime?[]:[demoRef])]){const data=JSON.stringify(c);run('INSERT INTO content(kind,slug,draft,published) VALUES(?,?,?,?)',c.kind,c.slug,data,c.meta.demo?null:data);run('INSERT INTO revisions(kind,slug,content,action) VALUES(?,?,?,?)',c.kind,c.slug,data,c.meta.demo?'draft':'seed');}
 if(!cloudflareRuntime){
  const sample={company:'Demo Engineering',name:'Demo Kontakt',email:'buyer@example.test',service:'fraestechnik',quantity:24,material:'Aluminium',dimensions:'80 × 60 × 22 mm',tolerance:'±0,05 mm',delivery:'',phone:'',details:''};
  run('INSERT INTO inquiries(id,number,owner,status,data) VALUES(?,?,?,?,?)','demo-inquiry','DEMO-A-0001','demo-customer','review',JSON.stringify(sample));
  run('INSERT INTO projects(id,owner,title,status,inquiry_id,description) VALUES(?,?,?,?,?,?)','demo-project','demo-customer','DEMO · Frästeil / milled part','production','demo-inquiry','Lokaler Demovorgang / Local sample project');
  run('INSERT INTO projects(id,owner,title,status,description) VALUES(?,?,?,?,?)','demo-private','demo-other','DEMO · Separates Konto / Separate account','review','Isolierter Testdatensatz');
  run('INSERT INTO messages(project_id,author,body) VALUES(?,?,?)','demo-project','demo-manager','DEMO · Die technische Zeichnung liegt in Version 1 vor. / Drawing version 1 is available.');
  run('INSERT INTO files(id,project_id,name,mime,body,version,author) VALUES(?,?,?,?,?,?,?)','demo-doc','demo-project','demo-zeichnung.pdf','application/pdf',fixturePDF,1,'demo-manager');
 }
 run("INSERT INTO settings VALUES('initialized','1'),('retentionDays','30')");
});
run('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)','homeContent',JSON.stringify({eyebrow:{de:'KINDSBACH, DE  /  SEIT 1964',en:'KINDSBACH, DE  /  EST. 1964'},title:{de:'Hochpräzise\nFertigungslösungen\nfür höchste Ansprüche.',en:'High-precision\nmanufacturing\nfor exacting demands.'},body:{de:'Drehtechnik, Frästechnik und Großserienfertigung. Von der spanenden Bearbeitung bis zur integrierten Qualitätsprüfung.',en:'CNC turning, milling and volume production. From machining through to in-line quality inspection.'},media:''}));
run("INSERT OR IGNORE INTO settings(key,value) VALUES('threeDEnabled','true'),('siteStatus','\"live\"')");
run("DELETE FROM outbox WHERE kind='rfq'");
