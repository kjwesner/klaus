
import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {mkdtempSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {DatabaseSync} from 'node:sqlite';
const dir=mkdtempSync(join(tmpdir(),'klaus-demo-test-'));
const dev=createServer();
let child,origin,db;
before(async()=>{
 for(const file of ['server.mjs','db','lib','public','package.json'])cpSync(file,join(dir,file),{recursive:true});
 dev.listen(0,'127.0.0.1');await once(dev,'listening');const port=dev.address().port;await new Promise(resolve=>dev.close(resolve));
 origin='http://127.0.0.1:'+port;
 child=spawn(process.execPath,['server.mjs'],{cwd:dir,env:{...process.env,APP_MODE:'demo',CLAMD_HOST:'',DEMO_DATA_DIR:join(dir,'.data'),PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let log='';child.stderr.on('data',v=>log+=v);
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server timeout '+log)),12000);child.stdout.on('data',c=>{if(c.toString().includes('Local demo:')){clearTimeout(timeout);resolve();}});child.on('exit',code=>{clearTimeout(timeout);reject(Error('Server exit '+code+': '+log));});});
 db=new DatabaseSync(join(dir,'.data','prototype.sqlite'));
});
after(async()=>{db?.close();if(child?.exitCode===null){child.kill();await once(child,'exit');}rmSync(dir,{recursive:true,force:true});});
const get=(path,cookie='')=>fetch(origin+path,{headers:{Cookie:cookie},redirect:'manual'});
const post=(path,values,cookie='',extra={})=>fetch(origin+path,{method:'POST',headers:{Origin:origin,Cookie:cookie,...extra},body:values instanceof FormData?values:new URLSearchParams(values),redirect:'manual'});
async function logIn(role){const r=await post('/de/aktionen/demo-login',{role});assert.equal(r.status,303);return r.headers.get('set-cookie').split(';')[0];}
const fixture=(name)=>get('/fixtures/demo.'+name).then(r=>r.blob());
const newRFQ=(details='')=>({consent:'yes',service:'fraestechnik',quantity:'34',material:'Aluminium',dimensions:'20 × 30',company:'Test GmbH',name:'Test Person',email:'rfq@example.test',details});
test('public routes resolve, locales preserve detail context and machine filters remove non-matches',async()=>{
 const pages=['','/leistungen','/leistungen/drehtechnik','/leistungen/fraestechnik','/leistungen/grossserien','/maschinenpark','/maschinenpark/3-achs-baz','/projekte','/unternehmen','/geschichte','/qualitaet','/technologie','/nachhaltigkeit','/karriere','/karriere/cnc-dreher','/bewerbung/cnc-dreher','/kontakt','/anfrage','/impressum','/datenschutz','/portal','/verwaltung'];
 for(const l of ['de','en'])for(const route of pages){const r=await get('/'+l+route);assert.equal(r.status,200,l+route);const html=await r.text();assert.match(html,new RegExp('lang="'+l+'"'));assert.ok(html.includes('href="/'+(l==='en'?'de':'en')+route+'"'));}
 const html=await get('/de/maschinenpark?category=milling&axes=5').then(r=>r.text());assert.match(html,/5-Achs-Bearbeitungszentrum/);assert.doesNotMatch(html,/<h3>3-Achs-Bearbeitungszentrum/);
 assert.match((await get('/de')).headers.get('x-robots-tag'),/noindex/);
 assert.equal((await get('/de/projekte/demo-gehaeuse')).status,404);
});
test('RFQ upload, validated persistence, receipt and staff review',async()=>{
 const customer=await logIn('customer'), sales=await logIn('sales');
 const f=new FormData();for(const [key,v] of Object.entries(newRFQ('<script>test</script>')))f.append(key,v);
 f.append('files',await fixture('dxf'),'test.dxf');
 const response=await post('/de/anfrage',f,customer);assert.equal(response.status,201);
 const number=(await response.text()).match(/DEMO-A-[0-9A-F-]{36}/)?.[0];assert.ok(number);
 const row=db.prepare('SELECT * FROM inquiries WHERE number=?').get(number);assert.equal(row.owner,'demo-customer');
 assert.equal(db.prepare("SELECT count(*) n FROM outbox WHERE kind='receipt' AND body LIKE ?").get('%'+number).n,1);
 const path='/de/verwaltung/anfragen/'+row.id;
 const html=await get(path,sales).then(r=>r.text());assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'));
 const file=db.prepare('SELECT id FROM files WHERE inquiry_id=?').get(row.id);
 assert.equal((await get('/datei/'+file.id)).status,404);
 assert.equal((await get('/datei/'+file.id,customer)).status,200);
 assert.equal((await post('/de/aktionen/inquiry-update',{id:row.id,status:'quoted',owner:row.owner,note:'Technical review complete'},sales)).status,303);
 assert.equal(db.prepare('SELECT status FROM inquiries WHERE id=?').get(row.id).status,'quoted');
 assert.equal((await post('/de/anfrage',{...newRFQ(),email:'someone@example.com'},customer)).status,422);
 const bad=new FormData();for(const [key,v] of Object.entries(newRFQ()))bad.append(key,v);
 bad.append('files',new Blob(['%PDF-1.4\nunscanned pdf']),'unsafe.pdf');
 assert.equal((await post('/de/anfrage',bad,customer)).status,422);
 assert.equal((await post('/de/anfrage',newRFQ(),customer,{Origin:'https://outside.test'})).status,403);
});
test('project owner isolation, messages, document versions and session revocation',async()=>{
 const c=await logIn('customer'), manager=await logIn('manager');
 assert.equal((await get('/de/portal/projekte/demo-private',c)).status,404);
 assert.equal((await post('/de/aktionen/message',{id:'demo-private',message:'Attack'},c)).status,404);
 assert.equal((await post('/de/aktionen/message',{id:'demo-project',message:'Demo customer follow-up'},c)).status,303);
 assert.match(await get('/de/verwaltung/projekte/demo-project',manager).then(r=>r.text()),/Demo customer follow-up/);
 const upload=new FormData();upload.set('id','demo-project');upload.set('files',await fixture('pdf'),'demo-zeichnung.pdf');
 assert.equal((await post('/de/aktionen/project-file',upload,manager)).status,303);
 assert.equal(db.prepare("SELECT max(version) n FROM files WHERE project_id='demo-project'").get().n,2);
 assert.match((await get('/datei/demo-doc?view=1',c)).headers.get('content-disposition'),/^inline/);
 assert.equal((await post('/de/aktionen/logout',{},c)).status,303);assert.equal((await get('/datei/demo-doc',c)).status,404);
});
test('CMS separation of draft, preview and release; demo references are blocked',async()=>{
 const editor=await logIn('editor'),admin=await logIn('admin');
 const path='/de/aktionen/cms-save', slug='test-whitepaper';
 const data={kind:'page',slug,index:'99',title_de:'Testentwurf',title_en:'Test draft',body_de:'Testinhalt',body_en:'Test content',source:'https://example.test/source'};
 assert.equal((await post(path,{...data,source:'javascript:alert(1)'},editor)).status,422);
 assert.equal((await post(path,data,editor)).status,303);
 assert.equal((await get('/de/'+slug)).status,404);
 assert.match(await get('/en/verwaltung/cms/page/'+slug+'?preview=1',editor).then(r=>r.text()),/Test draft/);
 assert.equal((await post('/de/aktionen/cms-publish',{kind:'page',slug},editor)).status,403);
 assert.equal((await post('/de/aktionen/cms-publish',{kind:'reference',slug:'demo-gehaeuse'},admin)).status,403);
 assert.equal((await post('/de/aktionen/cms-publish',{kind:'page',slug},admin)).status,303);
 assert.match(await get('/de/'+slug).then(r=>r.text()),/Testinhalt/);
 assert.equal(db.prepare('SELECT count(*) n FROM revisions WHERE slug=?').get(slug).n,2);
});
test('applications go only to HR and deletion cascades to attached test files',async()=>{
 const f=new FormData();f.set('name','Test Person');f.set('email','applicant@example.test');f.set('consent','yes');f.set('files',await fixture('pdf'),'test-cv.pdf');
 const submitted=await post('/de/bewerbung/cnc-dreher',f);assert.equal(submitted.status,201);
 const key=db.prepare("SELECT id FROM applications WHERE json_extract(data,'$.email')='applicant@example.test'").get().id;
 const file=db.prepare('SELECT id FROM files WHERE application_id=?').get(key).id;
 const hr=await logIn('hr'),sales=await logIn('sales');
 assert.equal((await get('/de/verwaltung/bewerbungen/'+key,sales)).status,403);
 assert.equal((await get('/datei/'+file,sales)).status,404);
 assert.equal((await get('/datei/'+file,hr)).status,200);
 assert.equal((await post('/de/aktionen/application-delete',{id:key,confirm:'yes'},hr)).status,303);
 assert.equal((await get('/datei/'+file,hr)).status,404);
});
test('invitation verification and password reset are local and single-use',async()=>{
 const admin=await logIn('admin'), email='invite@example.test', first='not-a-real-test-password', second='another-test-password-only';
 assert.equal((await post('/en/aktionen/invite',{name:'Invited test user',email,role:'customer'},admin)).status,303);
 const tokenFor=()=>db.prepare('SELECT body FROM outbox WHERE recipient=? ORDER BY id DESC LIMIT 1').get(email).body.split('token=')[1];
 const token=tokenFor();
 assert.equal((await post('/en/aktionen/password',{token,purpose:'invite',password:first})).status,200);
 assert.equal((await post('/en/aktionen/password',{token,purpose:'invite',password:first})).status,410);
 const login=await post('/en/aktionen/login',{email,password:first,area:'portal'});assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0];
 assert.match(await get('/en/portal',cookie).then(r=>r.text()),/Invited test user/);
 assert.equal((await post('/en/aktionen/reset',{email})).status,200);
 assert.equal((await post('/en/aktionen/password',{token:tokenFor(),purpose:'reset',password:second})).status,200);
 assert.doesNotMatch(await get('/en/portal',cookie).then(r=>r.text()),/Invited test user/);
 assert.equal((await post('/en/aktionen/login',{email,password:first,area:'portal'})).status,401);
 assert.equal((await post('/en/aktionen/login',{email,password:second,area:'portal'})).status,303);
});

