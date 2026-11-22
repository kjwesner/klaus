
import {all,get,can,roles,projectAccess,findContent,catalog,fixturePDF} from './db.mjs';
import {pair,stages} from './content.mjs';
import {esc,txt,local,title,btn,link,screen,input,area,select,hidden,form,submit,pill,attrs,uploadHelp} from './ui.mjs';
import {detail} from './public.mjs';
import {HttpError} from './upload.mjs';
const tFor=l=>(a,b)=>txt(l,a,b);
const items={
 dashboard:[pair('Übersicht','Overview'),null],anfragen:[pair('Anfragen','Inquiries'),'sales'],projekte:[pair('Projekte','Projects'),'project'],dokumente:[pair('Dokumente','Documents'),null],nachrichten:[pair('Nachrichten','Messages'),null],
 karriere:[pair('Karriere','Careers'),'cms'],'website-projekte':[pair('Projekte','Projects'),'cms'],medien:[pair('Medien','Media'),'cms'],bewerbungen:[pair('Bewerbungen','Applications'),'hr'],benutzer:[pair('Zugriffs-Rechte','Access rights'),'users'],einstellungen:[pair('Einstellungen','Settings'),'settings']
};
export const labels={service:pair('Leistungen','Capabilities'),machine:pair('Maschinen','Machines'),reference:pair('Projekte','Projects'),job:pair('Karriere','Careers'),page:pair('Unternehmensseiten','Company pages')};
const roleLabels={admin:pair('Administration','Administrator'),editor:pair('Redaktion','Editor'),sales:pair('Vertrieb','Sales'),manager:pair('Projektmanagement','Project manager'),hr:pair('Personal','HR'),customer:pair('Kunde','Customer')};
export const names={material:pair('Werkstoff','Material'),dimensions:pair('Abmessungen','Dimensions'),quantity:pair('Stückzahl','Quantity'),tolerance:pair('Toleranz','Tolerance'),delivery:pair('Wunschtermin','Delivery requested'),details:pair('Anforderungen','Requirements'),conversation:pair('Gesprächsverlauf','Conversation'),company:pair('Firma','Company'),name:pair('Kontaktname','Contact name'),email:pair('E-Mail','Email'),phone:pair('Telefon','Phone'),service:pair('Leistung','Capability')};
const cols=(l,d)=>Object.fromEntries(Object.entries(d).map(([k,v])=>[local(l,names[k])||k,k==='service'?(local(l,findContent('service',v)?.title)||v):v]));
const box=(h,s)=>'<section class="panel">'+(h?'<h3>'+esc(h)+'</h3>':'')+s+'</section>';
const table=(cols,rows,empty)=>rows.length?'<div class="tablebox"><table><thead><tr>'+cols.map(c=>'<th scope="col">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="muted">'+esc(empty)+'</p>';
const statuses=l=>Object.entries(stages).map(([key,value])=>[key,local(l,value)]);
const status=(l,v)=>pill(local(l,stages[v])||v);
const customers=()=>all("SELECT id,name FROM users WHERE role='customer' AND active=1 ORDER BY name").map(u=>[u.id,u.name]);
const staff=()=>all("SELECT id,name FROM users WHERE role IN ('sales','manager','admin') AND active=1 ORDER BY name").map(u=>[u.id,u.name]);
const post=(l,op,p='',files=false)=>form('/'+l+'/aktionen/'+op,p,files);
const mediaField=(l,value='')=>'<label>'+ (l==='de'?'Bild':'Image')+'<select name="media" data-media-picker><option value="">'+(l==='de'?'Standardbild verwenden':'Use default image')+'</option>'+all('SELECT id,name FROM media ORDER BY name').map(x=>'<option value="'+esc(x.id)+'" '+(x.id===value?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label><img class="admin-media-preview" data-media-preview '+(value?'src="/media-library/'+esc(value)+'"':'hidden')+' alt="">';
const projectImageField=(value='')=>'<label>Bild<input type="file" name="image" accept="image/webp,image/png,image/jpeg,.webp,.png,.jpg,.jpeg" '+(value?'':'required')+'></label><p class="muted">'+(value?'<img class="admin-media-preview" src="/media-library/'+esc(value)+'" alt="Aktuelles Projektbild">':'Eigenes oder freigegebenes Bild, maximal 5 MB.')+'</p>';
export function account(l,area,sub='',token=''){
 const t=tFor(l), b='/'+l, staff=area==='verwaltung', heading=staff?t('Verwaltung','Administration'):t('Kundenportal','Client portal');
 const password=(name='password')=>input(t('Passwort (mind. 14 Zeichen)','Password (at least 14 characters)'),name,'',{type:'password',max:256,extra:'minlength="14" autocomplete="'+(sub?'new-password':'current-password')+'"'});
 const mail=input(t('E-Mail-Adresse','Email address'),'email','',{type:'email',extra:'autocomplete="username"'});
 let body;
 if(sub==='setup'){
  body=box(t('Ersten Administrator einrichten','Set up the first administrator'),'<p class="note">'+t('Erstelle dein persönliches Administratorkonto. Danach ist die Verwaltung nur noch mit diesem oder einem weiteren Administrator-Konto erreichbar.','Create your personal administrator account. After setup, the administration is accessible only to this or another administrator account.')+'</p>'+post(l,'initial-admin','<div class="fields">'+input(t('Name','Name'),'name')+input(t('E-Mail-Adresse','Email address'),'email','',{type:'email'})+password()+'</div>'+submit(t('Administrator anlegen','Create administrator'))));
 }else if(sub==='passwort'){
  body=box(t('Passwort zurücksetzen','Reset password'),'<p class="muted">'+t('Zurücksetzungsanforderungen werden im Administrations-Postausgang gespeichert.','Password reset requests are stored in the administration outbox.')+'</p>'+post(l,'reset',mail+'<p></p>'+submit(t('Link anfordern','Request link'))));
 }else if(sub==='einladung'||sub==='neu'){
  body=box(sub==='neu'?t('Neues Passwort','New password'):t('Einladung annehmen','Accept invitation'),post(l,'password',hidden('token',token)+hidden('purpose',sub==='neu'?'reset':'invite')+password()+'<p class="muted">'+t('Mindestens 14 Zeichen.','At least 14 characters.')+'</p>'+submit(t('Passwort speichern','Save password'))));
 }else{
  body=box(t('Anmelden','Sign in'),post(l,'login',hidden('area',area)+'<div class="fields">'+mail+password()+'</div>'+submit(t('Anmelden','Sign in')))+'<p></p>'+link(b+'/portal/passwort',t('Passwort vergessen?','Forgot password?')));
  if(staff&&!get("SELECT id FROM users WHERE role='admin' AND active=1 AND verified=1 AND id NOT LIKE 'demo-%'"))body+='<p class="note">'+t('Noch kein Administrator eingerichtet?','No administrator set up yet?')+' '+link(b+'/verwaltung/setup',t('Erstes Administratorkonto anlegen','Create the first administrator account'))+'</p>';
 }
 return {heading,body:screen(l,sub==='setup'?'KLAUS / ADMIN SETUP':'KLAUS / ADMINISTRATION',heading)+'<section class="section slim"><div class="wrap formshell">'+body+'</div></section>'};
}
export function consolePage(l,user,isAdmin,segments,params){
 const t=tFor(l), key=segments[0]|| (isAdmin?'anfragen':'dashboard'), rawSub=segments[1]||'', sub=key==='karriere'?'job':key==='website-projekte'?'reference':rawSub, third=segments[2]||'';
 const b='/'+l, base=b+(isAdmin?'/verwaltung':'/portal');
 const tabs=isAdmin?['anfragen','karriere','website-projekte','benutzer','einstellungen']:['dashboard','anfragen','projekte','dokumente','nachrichten','einstellungen'];
 if(!tabs.includes(key))throw new HttpError(404,'Bereich nicht gefunden / Section not found');
 if(isAdmin&&items[key][1]&&!can(user,items[key][1]))throw new HttpError(403,'Zugriff verweigert / Access denied');
 const heading=isAdmin?t('Verwaltung','Administration'):t('Kundenportal','Client portal');
 const displayName=user.id==='demo-admin'?t('Website-Administrator','Website administrator'):user.name;
 const displayEmail=user.id==='demo-admin'?t('Lokaler Administrationszugang','Local administrator access'):user.email;
 const section=local(l,items[key][0]);
 const url=(s,id='')=>base+'/'+s+(id?'/'+id:'');
 const p=(op,html,files=false)=>post(l,op,hidden('target',base)+html,files);
 const none=t('Keine Einträge vorhanden.','No entries yet.');
 const inquiryRows=()=>isAdmin?all("SELECT * FROM inquiries WHERE number NOT LIKE 'DEMO-%' ORDER BY created_at DESC LIMIT 100"):all('SELECT * FROM inquiries WHERE owner=? ORDER BY created_at DESC LIMIT 100',user.id);
 const projectRows=()=>isAdmin?all('SELECT * FROM projects ORDER BY created_at DESC LIMIT 100'):all('SELECT * FROM projects WHERE owner=? ORDER BY created_at DESC LIMIT 100',user.id);
 const files=(where,id)=>{
  if(!['inquiry_id','project_id','application_id'].includes(where))throw Error('Invalid relation');
  const f=all('SELECT id,name,version,created_at,mime FROM files WHERE '+where+'=? ORDER BY name,version DESC',id);
  return table([t('Datei','File'),t('Version','Version'),t('Datum','Date')],f.map(row=>[link('/datei/'+row.id,row.name)+(row.mime==='application/pdf'&&get('SELECT length(body) size FROM files WHERE id=? AND body=?',row.id,fixturePDF)?' · '+link('/datei/'+row.id+'?view=1',t('Vorschau','Preview')):''),String(row.version),esc(row.created_at)]),none);
 };
 let body='';
 if(key==='dashboard'){
  if(isAdmin){
   const stats=[];
   if(can(user,'sales'))stats.push([t('Neue Anfragen','New inquiries'),"SELECT count(*) n FROM inquiries WHERE status='received' AND number NOT LIKE 'DEMO-%'",'anfragen'],[t('Offene Anfragen','Open inquiries'),"SELECT count(*) n FROM inquiries WHERE status!='done' AND number NOT LIKE 'DEMO-%'",'anfragen']);
   if(can(user,'project'))stats.push([t('Aktive Projekte','Active projects'),"SELECT count(*) n FROM projects WHERE status!='done'",'projekte'],[t('Projektnachrichten','Project messages'),'SELECT count(*) n FROM messages','projekte']);
   if(can(user,'hr'))stats.push([t('Bewerbungen','Applications'),'SELECT count(*) n FROM applications','bewerbungen']);
   if(can(user,'cms'))stats.push([t('Offene Entwürfe','Pending drafts'),'SELECT count(*) n FROM content WHERE published IS NULL OR draft<>published','cms']);
   body='<div class="tiles">'+stats.map(([label,sql,k])=>'<a class="tile" href="'+url(k)+'"><strong>'+get(sql).n+'</strong>'+esc(label)+'</a>').join('')+'</div>'+box(t('Angemeldet als','Signed in as'),'<p>'+esc(displayName)+' · '+title(l,roleLabels[user.role])+'</p><p class="muted">'+t('Inhalte und Änderungen werden dauerhaft in der Website gespeichert.','Content and changes are saved to the website.')+'</p>');
  }else{
   const n=get('SELECT count(*) n FROM inquiries WHERE owner=?',user.id).n,k=get('SELECT count(*) n FROM projects WHERE owner=?',user.id).n, d=get('SELECT count(*) n FROM files f JOIN projects p ON p.id=f.project_id WHERE p.owner=?',user.id).n, m=get('SELECT count(*) n FROM messages m JOIN projects p ON p.id=m.project_id WHERE p.owner=?',user.id).n;
   body='<div class="tiles">'+[['anfragen',n],['projekte',k],['dokumente',d],['nachrichten',m]].map(([s,v])=>'<a class="tile" href="'+url(s)+'"><strong>'+v+'</strong>'+title(l,items[s][0])+'</a>').join('')+'</div>'+box(t('Willkommen','Welcome'),'<p>'+esc(user.name)+'</p>'+btn(b+'/anfrage',t('Neue Projektanfrage','New project inquiry')));
  }
 }else if(key==='anfragen'){
  if(!sub){body=box(section,table([t('Vorgang','Inquiry'),t('Firma','Company'),'Status'],inquiryRows().map(r=>[link(url(key,r.id),r.number),esc(JSON.parse(r.data).company),status(l,r.status)]),none));}
  else{
   const r=get('SELECT * FROM inquiries WHERE id=?',sub);
   if(!r||r.number.startsWith('DEMO-')||(!isAdmin&&r.owner!==user.id))throw new HttpError(404,'Anfrage nicht gefunden / Inquiry not found');
   const data=JSON.parse(r.data);
   body=box(r.number,status(l,r.status)+'<dl class="specs">'+attrs(l,cols(l,data))+'</dl>')+box(t('Anlagen','Attachments'),files('inquiry_id',r.id));
   if(isAdmin){
    const notes=all('SELECT n.*,u.name FROM notes n LEFT JOIN users u ON u.id=n.author WHERE inquiry_id=? ORDER BY n.id DESC',r.id);
    body+=box(t('Bearbeiten','Manage'),p('inquiry-update',hidden('id',r.id)+'<div class="fields">'+select('Status','status',statuses(l),r.status)+select(t('Zuständig','Assignee'),'assignee',[['','—'],...staff()],r.assignee||'',true)+select(t('Kundenkonto','Client account'),'owner',[['','—'],...customers()],r.owner||'',true)+area(t('Interne Notiz','Internal note'),'note','',true)+'</div>'+submit(t('Speichern','Save'))))+
    box(t('Angebotsdokument','Quote document'),p('inquiry-file',hidden('id',r.id)+'<label>PDF<input type="file" name="files" accept=".pdf" required></label>'+uploadHelp(l,'application')+submit(t('Datei speichern','Save file')),true))+
    box(t('Interne Notizen','Internal notes'),notes.map(n=>'<div class="bubble"><small>'+esc(n.name)+' · '+esc(n.created_at)+'</small><br>'+esc(n.body)+'</div>').join('')||'<p class="muted">'+none+'</p>');
   }
  }
 }else if(key==='projekte'){
  if(!sub){body=box(section,table([t('Projekt','Project'),'Status'],projectRows().map(r=>[link(url(key,r.id),r.title),status(l,r.status)]),none));
   if(isAdmin)body+=box(t('Projekt anlegen','Create project'),p('project-save','<div class="fields">'+input(t('Titel','Title'),'title')+select(t('Kundenkonto','Client account'),'owner',[['','—'],...customers()])+select('Status','status',statuses(l),'received')+select(t('Zugehörige Anfrage','Related inquiry'),'inquiry',[['','—'],...inquiryRows().map(x=>[x.id,x.number])],'',true)+area(t('Beschreibung','Description'),'description','',true)+'</div>'+submit(t('Projekt erstellen','Create project'))));
  }else{
   const r=get('SELECT * FROM projects WHERE id=?',sub);
   if(!projectAccess(user,r))throw new HttpError(404,'Projekt nicht gefunden / Project not found');
   body=box(r.title,status(l,r.status)+'<p class="summary">'+esc(r.description)+'</p>');
   if(isAdmin)body+=box(t('Projekt bearbeiten','Edit project'),p('project-save',hidden('id',r.id)+'<div class="fields">'+input(t('Titel','Title'),'title',r.title)+select(t('Kundenkonto','Client account'),'owner',customers(),r.owner)+select('Status','status',statuses(l),r.status)+select(t('Anfrage','Inquiry'),'inquiry',[['','—'],...inquiryRows().map(x=>[x.id,x.number])],r.inquiry_id||'',true)+area(t('Beschreibung','Description'),'description',r.description,true)+'</div>'+submit(t('Speichern','Save'))));
   body+=box(t('Dokumente & Versionen','Documents & versions'),files('project_id',r.id)+(isAdmin?p('project-file',hidden('id',r.id)+'<label>'+t('Datei','File')+'<input type="file" name="files" accept=".pdf,.step,.stp,.iges,.igs,.dxf" required></label>'+uploadHelp(l)+submit(t('Version hochladen','Upload version')),true):''));
   const messages=all('SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.author WHERE project_id=? ORDER BY m.id DESC LIMIT 100',r.id);
   body+=box(t('Projektnachrichten','Project messages'),messages.map(n=>'<div class="bubble"><small>'+esc(n.name)+' · '+esc(n.created_at)+'</small><br>'+esc(n.body)+'</div>').join('')+p('message',hidden('id',r.id)+area(t('Neue Nachricht','New message'),'message')+submit(t('Nachricht speichern','Save message'))));
  }
 }else if(key==='dokumente'){
  const rows=all('SELECT f.id,f.name,f.version,p.title,p.id project FROM files f JOIN projects p ON p.id=f.project_id WHERE p.owner=? ORDER BY f.created_at DESC LIMIT 100',user.id);
  body=box(section,table([t('Datei','File'),t('Projekt','Project'),t('Version','Version')],rows.map(r=>[link('/datei/'+r.id,r.name),link(url('projekte',r.project),r.title),String(r.version)]),none));
 }else if(key==='nachrichten'){
  const rows=all('SELECT m.body,m.created_at,u.name,p.title,p.id project FROM messages m JOIN projects p ON p.id=m.project_id JOIN users u ON u.id=m.author WHERE p.owner=? ORDER BY m.id DESC LIMIT 100',user.id);
  body=box(section,table([t('Projekt','Project'),t('Absender','Author'),t('Nachricht','Message')],rows.map(r=>[link(url('projekte',r.project),r.title),esc(r.name),esc(r.body)]),none));
 }else if(key==='bewerbungen'){
  if(!sub){const rows=all('SELECT * FROM applications ORDER BY created_at DESC LIMIT 100');body=box(section,table([t('Vorgang','Application'),t('Stelle','Role'),'Status'],rows.map(r=>[link(url(key,r.id),r.number),esc(local(l,findContent('job',r.job)?.title)||r.job),status(l,r.status)]),none));}
  else{const r=get('SELECT * FROM applications WHERE id=?',sub);if(!r)throw new HttpError(404,'Bewerbung nicht gefunden / Application not found');body=box(r.number,status(l,r.status)+'<dl class="specs">'+attrs(l,cols(l,JSON.parse(r.data)))+'</dl>'+files('application_id',r.id))+
   box(t('Bearbeiten','Manage'),p('application-status',hidden('id',r.id)+select('Status','status',statuses(l).filter(([x])=>['received','review','done'].includes(x)),r.status)+submit(t('Speichern','Save')))+p('application-delete',hidden('id',r.id)+'<label class="check"><input type="checkbox" name="confirm" value="yes" required>'+t('Testbewerbung und Anlagen endgültig löschen','Permanently delete test application and attachments')+'</label>'+submit(t('Bewerbung löschen','Delete application'),'ghost')));}
 }else if(['cms','karriere','website-projekte'].includes(key)){
  if(!Object.hasOwn(labels,sub)&&sub!=='website'&&sub)throw new HttpError(404,'Ungültiger Inhaltstyp / Invalid content type');
  const choices=key==='cms'?'<div class="actionbar">'+btn(url(key,'website'),t('Startseite','Home page'),'ghost')+Object.entries(labels).map(([k,v])=>btn(url(key,k),local(l,v),'ghost')).join('')+'</div>':'';
  const list=all('SELECT * FROM content ORDER BY kind,slug').filter(r=>!sub||r.kind===sub);
  if(sub==='website'){
   const cfg=JSON.parse(get("SELECT value FROM settings WHERE key='homeContent'")?.value||'{}');
   body=box(t('Startseite bearbeiten','Edit home page'),choices+'<p class="muted">'+t('Änderungen an dieser Startseite werden beim Speichern sofort sichtbar.','Changes to this home page go live as soon as you save.')+'</p>'+p('website-save','<div class="fields">'+input(t('Kleine Überschrift (DE)','Eyebrow (DE)'),'eyebrow_de',cfg.eyebrow?.de||'')+input(t('Eyebrow (EN)','Eyebrow (EN)'),'eyebrow_en',cfg.eyebrow?.en||'')+area(t('Hauptüberschrift (DE) · Zeilenumbruch möglich','Main heading (DE) · line breaks allowed'),'title_de',cfg.title?.de||'')+area(t('Main heading (EN) · line breaks allowed','Main heading (EN) · line breaks allowed'),'title_en',cfg.title?.en||'')+area(t('Einleitung (DE)','Introduction (DE)'),'body_de',cfg.body?.de||'')+area(t('Introduction (EN)','Introduction (EN)'),'body_en',cfg.body?.en||'')+mediaField(l,cfg.media||'')+'</div>'+submit(t('Änderungen speichern','Save changes'))));
  }else if(!third){
   body=box(key==='cms'?'CMS':section,choices+table([t('Eintrag','Entry'),...(key==='cms'?[t('Typ','Type')]:[]),'Status'],list.map(r=>[link(url(key,key==='cms'?r.kind+'/'+r.slug:sub+'/'+r.slug),local(l,JSON.parse(r.draft).title)),...(key==='cms'?[title(l,labels[r.kind])]:[]),r.draft===r.published?pill(t('Veröffentlicht','Published')):pill(t('Entwurf','Draft'))]),none)+(sub?'<p></p>'+btn(url(key,sub+'/neu'),t('Neuen Eintrag anlegen','Create an entry')):''));
  }else{
   const row=get('SELECT * FROM content WHERE kind=? AND slug=?',sub,third);
   if(!row&&third!=='neu')throw new HttpError(404,'Eintrag nicht gefunden / Entry not found');
   const draft=row?JSON.parse(row.draft):{title:pair('',''),body:pair('',''),index:'99',source:'',meta:{}};
   const m=draft.meta;
   const metaKeys={service:['category'],machine:['category','manufacturer','model','axes','range','service'],reference:['category','industry','material','type'],job:['category','type','location','experience'],page:[]}[sub];
   let fields='',withFiles=false;
   if(sub==='job')fields=(row?hidden('slug',third):'')+'<div class="fields">'+input('Titel (DE)','title_de',draft.title.de)+input('Titel (EN)','title_en',draft.title.en)+area('Text (DE)','body_de',draft.body.de)+area('Text (EN)','body_en',draft.body.en)+input('Gehalt/Monat','salary_month',m.salaryMonth??'',{optional:true,type:'number',extra:'min="0" step="0.01"'})+input('Gehalt/Jahr','salary_year',m.salaryYear??'',{optional:true,type:'number',extra:'min="0" step="0.01"'})+'</div>';
   else if(sub==='reference'){fields=(row?hidden('slug',third):'')+'<div class="fields">'+input('Titel','title',draft.title.de)+area('Text','body',draft.body.de)+projectImageField(m.media||'')+'</div>';withFiles=true;}
   else fields=(row?hidden('slug',third):input('Slug','slug','',{extra:'pattern="[a-z0-9-]+"'}))+'<div class="fields">'+input('Titel (DE)','title_de',draft.title.de)+input('Title (EN)','title_en',draft.title.en)+area('Text (DE)','body_de',draft.body.de)+area('Text (EN)','body_en',draft.body.en)+input(t('Sortierindex','Sort index'),'index',draft.index)+input(t('Quell-URL','Source URL'),'source',draft.source,{optional:true,max:400})+metaKeys.map(k=>input(k,k,m[k]??'',{optional:true,type:k==='axes'?'number':'text'})).join('')+mediaField(l,m.media||'')+input('SEO title (DE)','seo_de',m.seo?.de||'',{optional:true})+input('SEO title (EN)','seo_en',m.seo?.en||'',{optional:true})+'</div>';
   body=box(row?local(l,draft.title):t('Neuer Eintrag','New entry'),choices+p('cms-save',hidden('kind',sub)+hidden('index',draft.index||'99')+fields+submit(['job','reference'].includes(sub)?t('Speichern & veröffentlichen','Save & publish'):t('Entwurf speichern','Save draft')),withFiles));
   if(row){
    body+=box(t('Vorschau & Freigabe','Preview & approval'),btn(url(key,sub+'/'+third)+'?preview=1',t('Entwurf öffnen','Preview draft'),'ghost')+
     (['job','reference'].includes(sub)?'<p class="note">'+t('Änderungen werden beim Speichern direkt auf der Website veröffentlicht.','Changes are published on the website as soon as you save them.')+'</p>':m.demo?'<p class="note">'+t('Interner Demoeintrag. Veröffentlichung ist gesperrt.','Internal demo entry. Publishing is disabled.')+'</p>':can(user,'publish')&&!m.demo?p('cms-publish',hidden('kind',sub)+hidden('slug',third)+'<p></p>'+submit(t('Veröffentlichen','Publish'))):'')+
     (['job','reference'].includes(sub)?p('cms-delete',hidden('kind',sub)+hidden('slug',third)+'<label class="check"><input type="checkbox" name="confirm" value="yes" required>'+t('Löschen dieses Eintrags bestätigen','Confirm deletion of this entry')+'</label>'+submit(t('Eintrag löschen','Delete entry'),'ghost')):''));
    const revisions=all('SELECT * FROM revisions WHERE kind=? AND slug=? ORDER BY id DESC LIMIT 25',sub,third);
    body+=box(t('Änderungsverlauf','Revision history'),revisions.map(r=>{const snap=JSON.parse(r.content);return '<details><summary>'+esc(r.created_at)+' · '+esc(r.action)+' · '+esc(local(l,snap.title))+'</summary><p>'+esc(local(l,snap.body))+'</p></details>';}).join(''));
   }
  }
 }else if(key==='medien'){
  body=box(section,'<div class="admin-media-grid">'+all('SELECT id,name,credit FROM media ORDER BY created_at DESC').map(r=>'<article class="admin-media-card"><img src="/media-library/'+esc(r.id)+'" alt="'+esc(r.name)+'"><strong>'+esc(r.name)+'</strong><span>'+esc(r.credit)+'</span><a href="/media-library/'+esc(r.id)+'" target="_blank" rel="noopener">'+t('Bild öffnen','Open image')+' ↗</a></article>').join('')+'</div>'+(!all('SELECT id FROM media LIMIT 1').length?'<p class="muted">'+none+'</p>':''))+box(t('Neues Bild hochladen','Upload a new image'),p('media-add','<label>'+t('Bilddatei · WebP, PNG oder JPEG','Image file · WebP, PNG, or JPEG')+'<input type="file" name="image" accept="image/webp,image/png,image/jpeg,.webp,.png,.jpg,.jpeg" required></label>'+input(t('Quelle / Lizenz','Source / license'),'credit')+'<p class="muted">'+t('Nur Rasterbilder bis 5 MB. Nach dem Upload kannst du sie bei einem Inhalt oder auf der Startseite auswählen.','Raster images only, up to 5 MB. After uploading, select them on a content item or the home page.')+'</p>'+submit(t('Bild hochladen','Upload image')),true));
 }else if(key==='benutzer'){
  const rows=all("SELECT id,name,email,role,active,verified FROM users WHERE id NOT LIKE 'demo-%' ORDER BY role,name");
  body=box(section,table([t('Konto','Account'),'E-Mail',t('Rolle','Role'),t('Zugriff','Access')],rows.map(r=>[esc(r.name),esc(r.email),title(l,roleLabels[r.role]),p('user-role',hidden('id',r.id)+select(t('Rolle','Role'),'role',roles.map(x=>[x,local(l,roleLabels[x])]),r.role)+select(t('Konto','Account'),'active',[['1',t('Aktiv','Active')],['0',t('Gesperrt','Disabled')]],String(r.active))+submit(t('Speichern','Save'),'ghost'))]),none))+box(t('Echtes Konto anlegen','Create a real account'),p('user-create','<div class="fields">'+input(t('Name','Name'),'name')+input(t('E-Mail-Adresse','Email address'),'email','',{type:'email'})+select(t('Rolle','Role'),'role',roles.map(x=>[x,local(l,roleLabels[x])]),'admin')+input(t('Startpasswort · mindestens 14 Zeichen','Initial password · at least 14 characters'),'password','',{type:'password',max:256,extra:'minlength="14" autocomplete="new-password"'})+'</div><p class="muted">'+t('Das Konto wird sofort aktiviert. Teile das Startpasswort sicher mit der Person.','The account is activated immediately. Share the initial password securely with the person.')+'</p>'+submit(t('Konto anlegen','Create account'))));
 }else if(key==='einstellungen'){
  const own=box(t('Sitzung','Session'),'<p>'+esc(displayName)+' · '+esc(displayEmail)+'</p>'+post(l,'logout',submit(t('Abmelden','Sign out'),'ghost')));
  if(!isAdmin)body=own;
  else{
   const log=all('SELECT event,object,created_at FROM audit ORDER BY id DESC LIMIT 40');
   const siteStatus=JSON.parse(get("SELECT value FROM settings WHERE key='siteStatus'")?.value||'"live"');
   const statusLabel=siteStatus==='live'?t('Die Website ist live.','The website is live.'):t('Die Website ist offline.','The website is offline.');
   const liveButton='<button class="btn primary" type="submit" name="siteStatus" value="live">'+t('Seite live stellen','Set website live')+'</button>';
   const offButton='<button class="btn ghost" type="submit" name="siteStatus" value="off">'+t('Seite offline stellen','Set website offline')+'</button>';
   body=own+box(t('Website-Status','Website status'),'<p>'+statusLabel+'</p>'+p('site-settings','<div class="actions">'+liveButton+offButton+'</div>'))+box(t('Aufbewahrung','Retention'),p('retention',input(t('Tage für Bewerbungen','Days to retain applications'),'days',JSON.parse(get("SELECT value FROM settings WHERE key='retentionDays'").value),{type:'number',extra:'min="1" max="365"'})+submit(t('Speichern','Save'))))+
    box(t('Aktivitätsprotokoll','Activity log'),table(['Event',t('Objekt','Object'),t('Datum','Date')],log.map(r=>[esc(r.event),esc(r.object),esc(r.created_at)]),none));
  }
 }
 if(params.has('preview')&&['cms','karriere','website-projekte'].includes(key)&&sub&&third&&third!=='neu'){
  const draft=findContent(sub,third,true);if(!draft)throw new HttpError(404,'Entwurf nicht gefunden / Draft not found');
  const back='<div class="wrap"><p class="note">'+link(url(key,sub+'/'+third),t('Zurück zum CMS','Back to CMS'))+'</p></div>';
  const d=detail(l,draft,true);return {...d,body:back+d.body};
 }
 const nav=tabs.filter(k=>!isAdmin||!items[k][1]||can(user,items[k][1])).map(k=>'<a href="'+(k==='dashboard'?base:url(k))+'" '+(k===key?'aria-current="page"':'')+'>'+title(l,items[k][0])+'</a>').join('');
 const feedback=params.has('ok')?'<p class="note" role="status">'+t('Gespeichert.','Saved.')+'</p>':'';
 return {heading:section+' · '+heading,body:screen(l,'KLAUS / WEBSITE-VERWALTUNG',heading,t('Website und Inhalte verwalten','Manage the website and its content')+' · '+local(l,roleLabels[user.role]))+'<section class="section slim"><div class="wrap console"><nav class="sidebar" aria-label="'+heading+'">'+nav+post(l,'logout',submit(t('Abmelden','Sign out'),'ghost small'))+'</nav><div><p class="micro">'+esc(section)+'</p>'+feedback+body+'</div></div></section>'};
}

