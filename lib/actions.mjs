
import {id,secret,stamp,hash,run,get,all,can,audit,atomic,session,roles,passwordHash,passwordOK,findContent,limit} from './db.mjs';
import {stages,pair,categories} from './content.mjs';
import {field,emailAddress,uploads,HttpError,scan} from './upload.mjs';
import {labels} from './console.mjs';
const stop=(s,m)=>{throw new HttpError(s,m);};
const denied=()=>stop(403,'Zugriff verweigert / Access denied');
const invalid=()=>stop(422,'Bitte Angaben prüfen / Check the submitted values');
const missing=()=>stop(404,'Nicht gefunden / Not found');
const who=(user,role)=>{if(!can(user,role))denied();};
const optional=(f,key,max=200)=>field(f,key,max,{required:false});
const needed=(f,key,max=200)=>field(f,key,max);
const mail=(recipient,kind,subject,body)=>run('INSERT INTO outbox(recipient,kind,subject,body) VALUES(?,?,?,?)',recipient,kind,subject,body);
const st=(f)=>{const v=needed(f,'status',30);if(!Object.hasOwn(stages,v))invalid();return v;};
const isCustomer=(key)=>key&&get("SELECT id FROM users WHERE role='customer' AND active=1 AND id=?",key);
const sid=(f)=>needed(f,'id',80);
const validSlug=(s)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const slugFromTitle=(s)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,75).replace(/-+$/g,'')||id();
function authToken(uid,purpose){const token=secret();run('DELETE FROM auth_tokens WHERE user_id=? AND purpose=? OR expires<=?',uid,purpose,stamp());run('INSERT INTO auth_tokens VALUES(?,?,?,?)',hash(token),uid,purpose,stamp()+3600);return token;}
function saveFiles(list,where,key,user){
 if(!['inquiry_id','project_id','application_id'].includes(where))throw Error('Invalid relation');
 for(const f of list){const version=get('SELECT coalesce(max(version),0)+1 n FROM files WHERE '+where+'=? AND name=?',key,f.name).n;
 run('INSERT INTO files(id,'+where+',name,mime,body,version,author) VALUES(?,?,?,?,?,?,?)',id(),key,f.name,f.mime,f.body,version,user?.id??null);}
}
export async function submitInquiry(l,f,user){
 if(needed(f,'consent',10)!=='yes')invalid();
 const service=needed(f,'service',80);if(!findContent('service',service))invalid();
 const quantityRaw=needed(f,'quantity',10),quantity=Number(quantityRaw);if(!/^\d+$/.test(quantityRaw)||!Number.isSafeInteger(quantity)||quantity<1||quantity>100000000)invalid();
 const delivery=optional(f,'delivery',10);if(delivery&&(!/^\d{4}-\d{2}-\d{2}$/.test(delivery)||isNaN(Date.parse(delivery))||new Date(delivery).toISOString().slice(0,10)!==delivery))invalid();
 const data={service,material:needed(f,'material'),dimensions:needed(f,'dimensions'),quantity,tolerance:optional(f,'tolerance'),delivery,details:optional(f,'details',5000),company:needed(f,'company'),name:needed(f,'name'),email:emailAddress(needed(f,'email')),phone:optional(f,'phone',60)};
 const files=await uploads(f),uid=id(),number='KJ-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+uid.slice(0,6).toUpperCase();
 atomic(()=>{run('INSERT INTO inquiries(id,number,owner,data) VALUES(?,?,?,?)',uid,number,user?.role==='customer'?user.id:null,JSON.stringify(data));saveFiles(files,'inquiry_id',uid,user);audit(user,'inquiry.created',uid);});
 return number;
}
export async function submitApplication(l,job,f,user){
 if(!findContent('job',job))missing();if(needed(f,'consent',10)!=='yes')invalid();
 const data={name:needed(f,'name'),email:emailAddress(needed(f,'email')),details:optional(f,'details',5000)};
 const files=await uploads(f,'files','application');if(!files.length)invalid();
 const uid=id(),number='KJ-B-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+uid.slice(0,6).toUpperCase();
 atomic(()=>{run('INSERT INTO applications(id,number,job,data) VALUES(?,?,?,?)',uid,number,job,JSON.stringify(data));saveFiles(files,'application_id',uid,user);mail(data.email,'application','Local demo application',number);audit(user,'application.created',uid);});
 return number;
}
export async function action(l,op,f,user,rateKey){
 const base='/'+l,portal=base+'/portal',admin=base+'/verwaltung';
 const dest=(p)=>({to:p});
 const ok=(p)=>dest(p+'?ok=1');
 const makeSession=(u,p)=>{if(user)run('DELETE FROM sessions WHERE token_hash=?',user.session_hash);audit(u,'session.started');return {to:p,token:session(u)};};
 if(op==='login'){
  const email=emailAddress(needed(f,'email')),password=needed(f,'password',256),area=needed(f,'area',40);
  if(!limit('auth:'+rateKey+':'+email,6,900))stop(429,'Bitte später erneut versuchen / Try again later');
  const u=get('SELECT * FROM users WHERE email=?',email),good=passwordOK(password,u?.password);
  if(!u||!u.verified||!u.active||!u.password||!good||(area==='verwaltung'&&u.role==='customer'))stop(401,'Anmeldung fehlgeschlagen / Sign-in failed');
  return makeSession(u,u.role==='customer'?portal:admin);
 }
 if(op==='reset'){
  const email=emailAddress(needed(f,'email'));
  if(!limit('reset:'+rateKey+':'+email,3,1200))stop(429,'Bitte später erneut versuchen / Try again later');
  const u=get('SELECT * FROM users WHERE email=? AND active=1 AND verified=1 AND password IS NOT NULL',email);
  if(u)atomic(()=>{const token=authToken(u.id,'reset');mail(email,'reset','Local password reset',portal+'/neu?token='+token);audit(u,'password.reset.requested');});
  return {feedback:pair('Falls das Konto existiert, liegt der Link im Administrations-Postausgang. Ohne Mailanbieter wird er nicht automatisch versendet.','If the account exists, the link is in the administration outbox. It is not sent automatically until a mail provider is configured.')};
 }
 if(op==='password'){
  const token=needed(f,'token',43),purpose=needed(f,'purpose',10),pw=needed(f,'password',256);
  if(!/^[A-Za-z0-9_-]{43}$/.test(token)||!['invite','reset'].includes(purpose)||pw.length<14)invalid();
  const rec=get('SELECT a.user_id FROM auth_tokens a JOIN users u ON u.id=a.user_id WHERE token_hash=? AND purpose=? AND expires>? AND active=1',hash(token),purpose,stamp());
  if(!rec)stop(410,'Link abgelaufen oder bereits verwendet / Link expired or already used');
  const digest=passwordHash(pw);
  atomic(()=>{run('DELETE FROM auth_tokens WHERE user_id=?',rec.user_id);run('DELETE FROM sessions WHERE user_id=?',rec.user_id);run('UPDATE users SET password=?,verified=1 WHERE id=?',digest,rec.user_id);run('DELETE FROM outbox WHERE kind IN (\'reset\',\'invite\') AND substr(body,-43)=?',token);audit({id:rec.user_id},'password.updated');});
  return {feedback:pair('Passwort gespeichert. Sie können sich jetzt anmelden.','Password saved. You can sign in now.')};
 }
 if(op==='initial-admin'){
  if(!limit('initial-admin:'+rateKey,5,900))stop(429,'Bitte später erneut versuchen / Try again later');
  const name=needed(f,'name',120),email=emailAddress(needed(f,'email')),password=needed(f,'password',256);
  if(password.length<14)stop(422,'Das Passwort muss mindestens 14 Zeichen haben / Password must be at least 14 characters');
  if(get("SELECT id FROM users WHERE role='admin' AND active=1 AND verified=1 AND id NOT LIKE 'demo-%'"))stop(409,'Ein Administrator ist bereits eingerichtet / An administrator is already configured');
  if(get('SELECT id FROM users WHERE email=?',email))stop(409,'Diese E-Mail-Adresse ist bereits vergeben / This email address is already in use');
  const uid=id(),digest=passwordHash(password),newAdmin={id:uid,name,email,role:'admin'};
  atomic(()=>{if(get("SELECT id FROM users WHERE role='admin' AND active=1 AND verified=1 AND id NOT LIKE 'demo-%'"))stop(409,'Ein Administrator ist bereits eingerichtet / An administrator is already configured');run('INSERT INTO users(id,email,name,role,password,active,verified) VALUES(?,?,? ,\'admin\',?,1,1)',uid,email,name,digest);audit(newAdmin,'admin.initialized');});
  return {to:admin,token:session(newAdmin)};
 }
 if(op==='logout'){
  if(user){run('DELETE FROM sessions WHERE token_hash=?',user.session_hash);audit(user,'session.ended');}
  return {to:base,clear:true};
 }
 if(!user)denied();
 if(op==='inquiry-update'||op==='inquiry-file'){
  who(user,'sales');const key=sid(f),r=get('SELECT * FROM inquiries WHERE id=?',key);if(!r)missing();
  if(op==='inquiry-update'){const owner=optional(f,'owner',80)||null, assignee=optional(f,'assignee',80)||null, status=st(f),note=optional(f,'note',5000);
   if((owner&&!isCustomer(owner))||(assignee&&!get("SELECT id FROM users WHERE id=? AND role IN ('admin','sales','manager') AND active=1",assignee)))invalid();
   if(get('SELECT id FROM projects WHERE inquiry_id=? AND owner IS NOT ?',key,owner))stop(409,'Kundenkonto muss zum Projekt passen / Client account must match the project');
   atomic(()=>{run('UPDATE inquiries SET status=?,assignee=?,owner=? WHERE id=?',status,assignee,owner,key);if(note)run('INSERT INTO notes(inquiry_id,author,body) VALUES(?,?,?)',key,user.id,note);audit(user,'inquiry.updated',key);});
  }else{const files=await uploads(f,'files','application');if(!files.length)invalid();atomic(()=>{saveFiles(files,'inquiry_id',key,user);audit(user,'inquiry.file.added',key);});}
  return ok(admin+'/anfragen/'+key);
 }
 if(op==='project-save'){
  who(user,'project');
  const key=optional(f,'id',80),owner=needed(f,'owner',80),inquiry=optional(f,'inquiry',80)||null,title=needed(f,'title'),description=optional(f,'description',5000),status=st(f);
  if(!isCustomer(owner))invalid();
  const inquiryRecord=inquiry?get('SELECT owner FROM inquiries WHERE id=?',inquiry):null;
  if(inquiry&&(!inquiryRecord||inquiryRecord.owner!==owner))stop(409,'Bitte Anfrage zuerst dem gleichen Kundenkonto zuordnen / Assign the inquiry to the same client account first');
  const row=key?get('SELECT owner FROM projects WHERE id=?',key):null;
  if(key&&!row)missing();
  if(row&&row.owner!==owner&&(get('SELECT id FROM files WHERE project_id=?',key)||get('SELECT id FROM messages WHERE project_id=?',key)))stop(409,'Projekt mit Dokumenten oder Nachrichten kann nicht übertragen werden / Projects with files or messages cannot be transferred');
  const pid=key||id();
  atomic(()=>{if(key)run('UPDATE projects SET owner=?,title=?,status=?,inquiry_id=?,description=? WHERE id=?',owner,title,status,inquiry,description,pid);else run('INSERT INTO projects(id,owner,title,status,inquiry_id,description) VALUES(?,?,?,?,?,?)',pid,owner,title,status,inquiry,description);audit(user,'project.saved',pid);});
  return ok(admin+'/projekte/'+pid);
 }
 if(op==='message'||op==='project-file'){
  const key=sid(f),p=get('SELECT * FROM projects WHERE id=?',key);
  const internal=can(user,'project');
  if(!p||(!internal&&p.owner!==user.id))missing();
  if(op==='message'){const m=needed(f,'message',5000);atomic(()=>{run('INSERT INTO messages(project_id,author,body) VALUES(?,?,?)',key,user.id,m);audit(user,'project.message',key);});}
  else{if(!internal)denied();const fz=await uploads(f);if(!fz.length)invalid();atomic(()=>{saveFiles(fz,'project_id',key,user);audit(user,'project.file.added',key);});}
  return ok((internal?admin:portal)+'/projekte/'+key);
 }
 if(op==='application-status'||op==='application-delete'){
  who(user,'hr');const key=sid(f);if(!get('SELECT id FROM applications WHERE id=?',key))missing();
  atomic(()=>{if(op==='application-delete'){if(needed(f,'confirm',10)!=='yes')invalid();run("DELETE FROM outbox WHERE kind='application' AND body=(SELECT number FROM applications WHERE id=?)",key);run('DELETE FROM applications WHERE id=?',key);}else{const status=st(f);if(!['received','review','done'].includes(status))invalid();run('UPDATE applications SET status=? WHERE id=?',status,key);}audit(user,op,key);});
  return ok(admin+'/bewerbungen'+(op==='application-status'?'/'+key:''));
 }
 if(op==='cms-save'||op==='cms-publish'||op==='cms-delete'){
  who(user,op==='cms-publish'?'publish':'cms');
  const kind=needed(f,'kind',20),providedSlug=optional(f,'slug',75);
  const entryTitle=['job','reference'].includes(kind)&&op==='cms-save'?needed(f,'title_de',200):'';
  const slug=providedSlug||(entryTitle?slugFromTitle(entryTitle):'');
  if(!Object.hasOwn(labels,kind)||!validSlug(slug)||slug==='neu')invalid();
  const old=get('SELECT * FROM content WHERE kind=? AND slug=?',kind,slug);
  if(!providedSlug&&old)stop(409,'Ein Eintrag mit diesem Titel existiert bereits / An entry with this title already exists');
  if(op==='cms-delete'){
   if(!['job','reference'].includes(kind)||!old)missing();
   if(needed(f,'confirm',10)!=='yes')invalid();
   atomic(()=>{run('DELETE FROM revisions WHERE kind=? AND slug=?',kind,slug);run('DELETE FROM content WHERE kind=? AND slug=?',kind,slug);audit(user,'cms.deleted',kind+'/'+slug);});
   return ok(admin+'/'+(kind==='job'?'karriere':'website-projekte')+'/'+kind);
  }
  if(op==='cms-publish'){
   if(!old)missing();
   const draft=JSON.parse(old.draft);
   if(draft.meta.demo)denied();
   if(!draft.source&&!['job','reference'].includes(kind))stop(422,'Für die Freigabe ist eine Quellen-URL erforderlich / A source URL is required for publication');
   atomic(()=>{run('UPDATE content SET published=draft,updated_at=CURRENT_TIMESTAMP WHERE kind=? AND slug=?',kind,slug);run('INSERT INTO revisions(kind,slug,content,action,author) VALUES(?,?,?,?,?)',kind,slug,old.draft,'published',user.id);audit(user,'cms.published',kind+'/'+slug);});
  }else{
   const prior=old?JSON.parse(old.draft):null;
   let source=optional(f,'source',400);
   if(source){try{const u=new URL(source);if(u.protocol!=='https:'||u.username||u.password)invalid();}catch{invalid();}}
   const meta={...prior?.meta};
   let title,body,index;
   if(kind==='job'){
    title=pair(entryTitle,needed(f,'title_en',200));body=pair(needed(f,'body_de',5000),needed(f,'body_en',5000));index=prior?.index||'99';source='';
    const salary=(key)=>{const value=optional(f,key,16);if(value&&(!/^\d{1,9}(?:\.\d{1,2})?$/.test(value)||!Number.isFinite(Number(value))||Number(value)<0))invalid();return value?Number(value):null;};
    meta.salaryMonth=salary('salary_month');meta.salaryYear=salary('salary_year');meta.media=null;
   }else if(kind==='reference'){
    title=pair(entryTitle,needed(f,'title_en',200));body=pair(needed(f,'body_de',5000),needed(f,'body_en',5000));index=prior?.index||'99';source='';
    meta.media=prior?.meta?.media||null;
   }else{
    const metaKeys={service:['category'],machine:['category','manufacturer','model','axes','range','service'],page:[]}[kind];
    for(const key of metaKeys){const s=optional(f,key,120);if(key==='axes'&&s&&(!/^\d{1,3}$/.test(s)||Number(s)<1))invalid();if(key==='service'&&s&&!findContent('service',s,true))invalid();meta[key]=s?(key==='axes'?Number(s):s):null;}
    const media=optional(f,'media',60);if(media&&!get('SELECT id FROM media WHERE id=?',media))invalid();meta.media=media||null;
    meta.seo=pair(optional(f,'seo_de',120),optional(f,'seo_en',120));
    index=needed(f,'index',8);title=pair(needed(f,'title_de'),needed(f,'title_en'));body=pair(needed(f,'body_de',5000),needed(f,'body_en',5000));
   }
   const data=JSON.stringify({kind,slug,index,title,body,source,meta});
   atomic(()=>{
    if(['job','reference'].includes(kind))run('INSERT INTO content(kind,slug,draft,published) VALUES(?,?,?,?) ON CONFLICT(kind,slug) DO UPDATE SET draft=excluded.draft,published=excluded.published,updated_at=CURRENT_TIMESTAMP',kind,slug,data,data);
    else run('INSERT INTO content(kind,slug,draft) VALUES(?,?,?) ON CONFLICT(kind,slug) DO UPDATE SET draft=excluded.draft,updated_at=CURRENT_TIMESTAMP',kind,slug,data);
    run('INSERT INTO revisions(kind,slug,content,action,author) VALUES(?,?,?,?,?)',kind,slug,data,['job','reference'].includes(kind)?'published':'draft',user.id);audit(user,['job','reference'].includes(kind)?'cms.published':'cms.saved',kind+'/'+slug);
   });
  }
  const section=kind==='job'?'karriere':kind==='reference'?'website-projekte':'cms';
  return ok(admin+'/'+section+'/'+kind+'/'+slug);
 }
 if(op==='website-save'){
  who(user,'cms');
  const media=optional(f,'media',60);if(media&&!get('SELECT id FROM media WHERE id=?',media))invalid();
  const data={eyebrow:pair(needed(f,'eyebrow_de',160),needed(f,'eyebrow_en',160)),title:pair(needed(f,'title_de',500),needed(f,'title_en',500)),body:pair(needed(f,'body_de',1500),needed(f,'body_en',1500)),media:media||''};
  run("UPDATE settings SET value=? WHERE key='homeContent'",JSON.stringify(data));audit(user,'cms.home.saved','home');return ok(admin+'/cms/website');
 }
 if(op==='user-create'){
  who(user,'users');const name=needed(f,'name',120),email=emailAddress(needed(f,'email')),role=needed(f,'role',20),password=needed(f,'password',256);
  if(!roles.includes(role)||password.length<14)invalid();if(get('SELECT id FROM users WHERE email=?',email))stop(409,'Diese E-Mail-Adresse ist bereits vergeben / This email address is already in use');
  const uid=id();atomic(()=>{run('INSERT INTO users(id,email,name,role,password,active,verified) VALUES(?,?,?,?,?,1,1)',uid,email,name,role,passwordHash(password));audit(user,'user.created',uid);});return ok(admin+'/benutzer');
 }
 if(op==='media-add'){
  who(user,'cms');const file=f.get('image'),credit=needed(f,'credit',200);if(!file||typeof file==='string'||!file.size||file.size>5*1024*1024)invalid();
  const body=Buffer.from(await file.arrayBuffer());
  const mime=body.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))?'image/png':body.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))?'image/jpeg':body.toString('ascii',0,4)==='RIFF'&&body.toString('ascii',8,12)==='WEBP'?'image/webp':null;
  if(!mime)invalid();
  const ext=file.name.split('.').pop().toLowerCase(),expected={ 'image/png':'png','image/jpeg':['jpg','jpeg'],'image/webp':'webp' }[mime];
  if(!(Array.isArray(expected)?expected.includes(ext):ext===expected))invalid();
  if(process.env.CLAMD_HOST)await scan(body);
  const uid=id(),name=file.name.normalize('NFKC').replace(/[^\p{L}\p{N}_. -]/gu,'_').slice(-120);
  atomic(()=>{run('INSERT INTO media VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)',uid,name,mime,body,credit);audit(user,'media.added',uid);});return ok(admin+'/medien');
 }
 if(op==='invite'){
  who(user,'users');const email=emailAddress(needed(f,'email')),name=needed(f,'name'),role=needed(f,'role',20);
  if(!roles.includes(role))invalid();if(get('SELECT id FROM users WHERE email=?',email))stop(409,'Konto existiert bereits / Account already exists');
  atomic(()=>{const uid=id();run('INSERT INTO users(id,email,name,role) VALUES(?,?,?,?)',uid,email,name,role);const token=authToken(uid,'invite');mail(email,'invite','KLAUS Website-Konto',portal+'/einladung?token='+token);audit(user,'user.invited',uid);});return ok(admin+'/benutzer');
 }
 if(op==='user-role'){
  who(user,'users');const key=sid(f),role=needed(f,'role',20),active=needed(f,'active',1);
  if(key.startsWith('demo-')||key===user.id)denied();if(!roles.includes(role)||!['0','1'].includes(active))invalid();if(!get('SELECT id FROM users WHERE id=?',key))missing();
  if(role!=='customer'&&get('SELECT id FROM projects WHERE owner=?',key))stop(409,'Konto ist einem Kundenprojekt zugeordnet / Account is assigned to a client project');
  atomic(()=>{run('UPDATE users SET role=?,active=? WHERE id=?',role,Number(active),key);run('DELETE FROM sessions WHERE user_id=?',key);audit(user,'user.role.changed',key);});return ok(admin+'/benutzer');
 }
 if(op==='retention'){
  who(user,'settings');const n=Number(needed(f,'days',3));if(!Number.isInteger(n)||n<1||n>365)invalid();
  run("UPDATE settings SET value=? WHERE key='retentionDays'",JSON.stringify(n));audit(user,'retention.saved');return ok(admin+'/einstellungen');
 }
 if(op==='site-settings'){
  who(user,'settings');const siteStatus=needed(f,'siteStatus',10);
  if(!['live','off'].includes(siteStatus))invalid();
  atomic(()=>{run("UPDATE settings SET value='true' WHERE key='threeDEnabled'");run("UPDATE settings SET value=? WHERE key='siteStatus'",JSON.stringify(siteStatus));audit(user,'site.settings.saved',siteStatus);});
  return ok(admin+'/einstellungen');
 }
 missing();
}

