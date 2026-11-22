
import {company,sources,timeline,categories,pair} from './content.mjs';
import {catalog,findContent,get} from './db.mjs';
import {esc,txt,local,title,btn,link,screen,attrs,input,area,select,hidden,form,submit,pill,viewer,uploadHelp} from './ui.mjs';
export const paths={service:'leistungen',machine:'maschinenpark',reference:'projekte',job:'karriere',page:''};
const copy=(l)=> (a,b)=>txt(l,a,b);
const block=(content,cls='')=>'<section class="section '+cls+'"><div class="wrap">'+content+'</div></section>';
const ct=(l,a,b)=>'<div class="eyebrow"><i class="pip"></i>'+txt(l,a,b)+'</div>';
const info=(l,s)=>'<div class="empty">'+esc(s)+'</div>';
const urlFor=(l,e)=>'/'+l+'/'+(paths[e.kind]?paths[e.kind]+'/':'')+e.slug;
function card(l,e){
 const t=copy(l), href=urlFor(l,e);
 const image=e.meta.media?'/media-library/'+esc(e.meta.media):e.kind==='service'?'/media/'+({turning:'turning.webp',series:'series.webp',milling:'cnc.webp'}[e.meta.category]||'cnc.webp'):'/blueprint.svg';
 return '<article class="card '+esc(e.kind)+'"><a tabindex="-1" aria-hidden="true" href="'+href+'" class="cardimage"><img src="'+image+'" alt="" loading="lazy" width="480" height="190"><span class="index">'+esc(e.index)+' / '+t('TECHNIK','ENGINEERING')+'</span></a><div class="cardbody"><span class="micro">'+esc(local(l,categories[e.meta.category])||e.kind)+'</span><h3>'+title(l,e.title)+'</h3><p>'+title(l,e.body)+'</p>'+link(href,t('Details ansehen','View details'))+'</div></article>';
}
function sectionHead(l,k,h,p=''){return '<div class="sectionhead"><div>'+ct(l,k,k)+'<h2>'+esc(h)+'</h2></div>'+(p?'<p>'+esc(p)+'</p>':'')+'</div>';}
export function home(l){
 const t=copy(l), b='/'+l;
 const cfg=JSON.parse(get("SELECT value FROM settings WHERE key='homeContent'")?.value||'{}');
 const heroTitle=local(l,cfg.title)||t('Hochpräzise\nFertigungslösungen\nfür höchste Ansprüche.','High-precision\nmanufacturing\nfor exacting demands.');
 const heroBody=local(l,cfg.body)||t('Drehtechnik, Frästechnik und Großserienfertigung. Von der spanenden Bearbeitung bis zur integrierten Qualitätsprüfung.','CNC turning, milling and volume production. From machining through to in-line quality inspection.');
 const heroEyebrow=local(l,cfg.eyebrow)||t('KINDSBACH, DE  /  SEIT 1964','KINDSBACH, DE  /  EST. 1964');
 const heroImage=cfg.media?'/media-library/'+esc(cfg.media):'/media/cnc.webp';
 return '<section class="hero"><img class="heroimg" src="'+heroImage+'" alt="" fetchpriority="high" width="1672" height="941"><div class="wrap heroinner"><div class="eyebrow"><span class="pip"></span>'+esc(heroEyebrow)+'</div><h1>'+esc(heroTitle).replace(/\r?\n/g,'<br>')+'</h1><p>'+esc(heroBody)+'</p><div class="actions">'+btn(b+'/anfrage',t('Projektanfrage starten','Start project inquiry'))+btn(b+'/leistungen',t('Leistungen entdecken','Explore capabilities'),'ghost')+'</div></div><a class="hero-tech" href="#studio"><span><i class="pip"></i> TECHNIKSTUDIO / 01</span><img src="/blueprint.svg" alt="" width="150" height="78"><span>ISO VIEW / SAMPLE ↗</span><small>'+t('Schematische Darstellung','Schematic illustration')+'</small></a><div class="hero-foot"><a href="#capabilities">↓ '+t('WEITER ENTDECKEN','EXPLORE FURTHER')+'</a><span>'+t('01 / CNC-KONZEPTVISUALISIERUNG','01 / CNC CONCEPT VISUALISATION')+'</span></div></section>'+
 '<div class="infobar"><div class="wrap infogrid">'+catalog('service').map(e=>'<a href="'+urlFor(l,e)+'"><code>'+esc(e.index)+'</code><strong>'+title(l,e.title)+'</strong><span aria-hidden="true">↗</span></a>').join('')+'</div></div>'+
 '<section class="section" id="capabilities"><div class="wrap">'+sectionHead(l,t('01 / FERTIGUNG','01 / MANUFACTURING'),t('Präzision in Serie.','Precision at scale.'),t('Drei Fertigungsfelder für unterschiedliche Geometrien, Werkstoffe und Losgrößen.','Three machining disciplines for different geometries, materials and batch sizes.'))+'<div class="cardgrid">'+catalog('service').map(e=>card(l,e)).join('')+'</div></div></section>'+
 '<section class="section studio" id="studio"><div class="wrap split"><div>'+ct(l,'02 / ENGINEERING STUDIO','02 / ENGINEERING STUDIO')+'<h2>'+t('Präzision in<br>Bewegung.','Precision<br>in motion.')+'</h2><p>'+t('Vom Rohling zum bearbeiteten Werkstück: Drehen, zoomen und zerlegen Sie eine schematische Baugruppe in unserem interaktiven Technikstudio.','From raw blank to machined part: rotate, zoom and explode a schematic assembly in our interactive engineering studio.')+'</p>'+btn(b+'/maschinenpark',t('Maschinenpark erkunden','Explore the machines'),'ghost')+'</div>'+viewer(l,'part','studio-viewer')+'</div></section>'+
 block('<div class="split"><div>'+ct(l,'03 / KINDSBACH, DE','03 / KINDSBACH, DE')+'<h2>'+t('Seit 1964.','Since 1964.')+'</h2><p class="intro">'+t('Von der mechanischen Werkstatt zum CNC-Familienunternehmen.','From a mechanical workshop to a family-run CNC business.')+'</p></div><div class="channellist">'+[['unternehmen',t('Unternehmen','Company')],['qualitaet',t('Qualität und Messtechnik','Quality and metrology')],['karriere',t('Karriere in Kindsbach','Careers in Kindsbach')]].map(([s,k],i)=>'<a class="channel" href="'+b+'/'+s+'"><span><span class="num">0'+(i+1)+'</span>'+k+'</span><span>↗</span></a>').join('')+'</div></div>')+
 block('<div class="panel split"><div>'+ct(l,'04 / RFQ','04 / RFQ')+'<h2>'+t('Ihr nächstes Projekt.','Your next project.')+'</h2></div><div><p class="muted">'+t('Werkstoff, Stückzahl und technische Unterlagen in einer strukturierten Anfrage zusammenführen.','Bring material, quantity and technical documents together in one structured inquiry.')+'</p>'+btn(b+'/anfrage',t('Projektanfrage starten','Start project inquiry'))+'</div></div>','slim');
}
const labels={
 category:pair('Verfahren / Bereich','Process / field'), manufacturer:pair('Hersteller','Manufacturer'),model:pair('Modell','Model'),axes:pair('Achsen','Axes'),range:pair('Arbeitsbereich','Working range'),industry:pair('Branche','Industry'),material:pair('Material','Material'),type:pair('Art','Type'),location:pair('Standort','Location'),experience:pair('Erfahrung','Experience')
};
const localizedValue=(l,v)=>local(l,categories[v])||local(l,({engineering:pair('Maschinenbau','Engineering'),aluminium:pair('Aluminium','Aluminium'),prototype:pair('Prototyp','Prototype'),'full-time':pair('Vollzeit','Full-time'),qualified:pair('Berufsausbildung','Apprenticeship or equivalent')})[v])||v;
export function listing(l,kind,params){
 const t=copy(l), data=catalog(kind), b='/'+l;
 const keymap={service:[t('Leistungen','Capabilities'),t('Spanende Fertigung in drei Disziplinen.','Machining in three disciplines.'),[]],machine:[t('Maschinenpark','Machine park'),t('Ein Überblick über öffentlich dokumentierte Maschinentypen und Fertigungslinien.','An overview of publicly documented machine types and production lines.'),['category','manufacturer','model','axes','range']],reference:[t('Projekte','Projects'),t('Dieser Bereich ist für freigegebene Referenzen vorgesehen.','This area is reserved for approved case studies.'),['industry','category','material','type']],job:[t('Karriere','Careers'),t('Ausgeschriebene Tätigkeiten aus Produktion und Technik am Standort Kindsbach.','Roles listed in production and engineering at the Kindsbach site.'),['category','type','location','experience']]};
 const [heading,desc,defaultKeys]=keymap[kind], keys=['reference','job'].includes(kind)?[]:defaultKeys;
 const filtered=data.filter(e=>keys.every(k=>!params.get(k)||String(e.meta[k]??'')===params.get(k))&&(!params.get('q')||(local(l,e.title)+' '+local(l,e.body)).toLowerCase().includes(params.get('q').toLowerCase())));
 const filters=keys.length?'<form class="filters" method="get" action="'+b+'/'+paths[kind]+'">'+keys.map(k=>{const vals=[...new Set(data.map(e=>e.meta[k]).filter(x=>x!=null&&x!==''))];return select(local(l,labels[k]),k,[['',t('Alle','All')],...vals.map(v=>[String(v),localizedValue(l,v)])],params.get(k)||'',true);}).join('')+input(t('Suche','Search'),'q',params.get('q')||'',{optional:true,max:100})+submit(t('Filtern','Filter'))+link(b+'/'+paths[kind],t('Zurücksetzen','Reset'))+'</form>':'';
 const empty=kind==='reference'&&!data.length?t('Es liegen noch keine freigegebenen Referenzen vor.','There are no approved case studies yet.'):t('Keine passenden Einträge.','No matching entries.');
 return {heading,body:screen(l,'KLAUS / '+heading,heading,desc)+block(filters+(filtered.length?'<div class="cardgrid">'+filtered.map(e=>card(l,e)).join('')+'</div>':info(l,empty)))+(kind==='machine'?block('<div class="split"><div><h2>'+t('CNC-Simulation.','CNC simulation.')+'</h2><p class="intro">'+t('Erkunden Sie Spindel, Werkstück und Aufspannung eines schematischen Bearbeitungszentrums.','Explore the spindle, workpiece and fixture of a schematic machining centre.')+'</p></div>'+viewer(l,'machine')+'</div>','studio'):kind==='job'?block(link(sources.career,t('Offizielle Karriereseite','Official careers page'))):'')};
}
const process=[
 [pair('Konzept','Concept'),pair('Fertigungs- und Messkonzepte werden erarbeitet und an Prototypen erprobt.','Machining and measurement concepts are developed and tested on prototypes.')],
 [pair('Vorrichtungen','Fixtures'),pair('Spannvorrichtungen und Messmittel werden konstruiert und im eigenen Haus hergestellt.','Workholding and measuring tools are designed and made in-house.')],
 [pair('Automatisierung','Automation'),pair('Fertigungsmaschinen werden automatisiert und mit integrierter Werkstückvermessung verbunden.','Production machines are automated and integrated with part measurement.')],
 [pair('Prüfung','Inspection'),pair('Die Qualitätsseite beschreibt eine abschließende Kontrolle gefertigter Teile.','The quality page describes final inspection of machined parts.')]
];
function tabs(l,data,prefix='tab'){
 return '<div data-tabs><div class="tabs" role="tablist" aria-label="'+txt(l,'Abschnitte','Sections')+'">'+data.map(([k],i)=>'<button type="button" role="tab" aria-controls="'+prefix+'pane-'+i+'" id="'+prefix+'-'+i+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'">'+title(l,k)+'</button>').join('')+'</div>'+data.map(([,p],i)=>'<div class="tabpane" role="tabpanel" tabindex="0" id="'+prefix+'pane-'+i+'" aria-labelledby="'+prefix+'-'+i+'" '+(i?'hidden':'')+'>'+title(l,p)+'</div>').join('')+'</div>';
}
function companySections(l){
 const pages=catalog('page').filter(page=>page.slug!=='unternehmen');
 return '<div class="company-sections">'+pages.map((page,index)=>{
  let content='<p>'+title(l,page.body)+'</p>';
  if(page.slug==='geschichte')content+='<h3>1964 — 2019</h3>'+tabs(l,timeline.map(([year,heading,body])=>[pair(String(year),String(year)),pair(heading.de+' — '+body.de,heading.en+' — '+body.en)]),'company-history');
  if(page.slug==='qualitaet')content+='<p>'+txt(l,'Die Unternehmenswebsite stellt Zertifikatslinks bereit. Die Gültigkeit ist vor einer Veröffentlichung dieses Entwurfs zu prüfen.','The official site provides certificate links. Verify their validity before publishing this concept.')+'</p>';
  if(page.slug==='technologie')content+='<p>'+txt(l,'Fertigungs- und Messkonzepte werden an Prototypen erprobt. KLAUS beschreibt außerdem die eigene Konstruktion und Fertigung von Spann- und Messvorrichtungen.','Manufacturing and measurement concepts are tested on prototypes. KLAUS also describes how it designs and makes fixtures and measuring devices in-house.')+'</p>';
  if(page.source)content+=link(page.source,txt(l,'Quelle: Unternehmenswebsite','Source: company website'));
  return '<details class="company-section"><summary class="channel"><span><span class="num">'+String(index+1).padStart(2,'0')+'</span>'+title(l,page.title)+'</span><span class="company-chevron" aria-hidden="true">⌄</span></summary><div class="company-section-body article">'+content+'</div></details>';
 }).join('')+'<a class="channel company-contact" href="/'+l+'/kontakt">'+txt(l,'Standort und Kontakt','Location and contact')+' <span aria-hidden="true">↗</span></a></div>';
}
export function detail(l,e,preview=false){
 const t=copy(l), b='/'+l, heading=local(l,e.title), desc=local(l,e.body), meta=e.meta;
 const list=meta.facts?.length?'<ul class="list">'+meta.facts.map(a=>'<li>'+title(l,a)+'</li>').join('')+'</ul>':'';
 const official=e.source?link(e.source,t('Quelle: Unternehmenswebsite','Source: company website')):'';
 let extra='', action='';
 const approvedImage=meta.media?'<img class="detail-media" src="/media-library/'+esc(meta.media)+'" alt="" loading="lazy">':'';
 if(e.kind==='service'){
  action=btn(b+'/anfrage?leistung='+e.slug,t('Projekt anfragen','Start inquiry'));
  const rel=catalog('machine').filter(x=>x.meta.service===e.slug);
  extra=block('<div class="split detaillead"><div>'+ct(l,'01 / FERTIGUNG','01 / MANUFACTURING')+'<h2>'+t('Technische Möglichkeiten','Technical capabilities')+'</h2>'+list+official+'</div>'+(approvedImage||'<figure class="detailfigure"><img src="/media/'+({turning:'turning.webp',milling:'cnc.webp',series:'series.webp'}[meta.category]||'cnc.webp')+'" alt="" loading="lazy"><figcaption>'+t('CNC-KONZEPTVISUALISIERUNG','CNC CONCEPT VISUALISATION')+'</figcaption></figure>')+'</div>')+block('<div class="article"><h2>'+t('Vom Konzept zur Prüfung','From concept to inspection')+'</h2>'+tabs(l,process)+'</div>','studio')+block(sectionHead(l,'02 / EQUIPMENT',t('Passende Maschinentypen','Related machine types'))+'<div class="cardgrid">'+rel.map(k=>card(l,k)).join('')+'</div>');
 } else if(e.kind==='machine'){
  action=btn(b+'/anfrage?leistung='+esc(meta.service||''),t('Projekt anfragen','Start inquiry'));
  extra=block('<div class="split detaillead"><div><h2>'+t('Technische Daten','Specifications')+'</h2><dl class="specs">'+attrs(l,Object.fromEntries(Object.keys(labels).map(k=>[local(l,labels[k]),localizedValue(l,meta[k])])))+'</dl>'+official+(meta.service?'<p>'+link(b+'/leistungen/'+meta.service,t('Zugehörige Leistung','Related capability'))+'</p>':'')+approvedImage+'</div>'+viewer(l,'machine')+'</div>');
 } else if(e.kind==='job'){
  action=btn(b+'/bewerbung/'+e.slug,t('Bewerbung im Demoportal testen','Test the demo application'))+' '+official;
  const currency=value=>new Intl.NumberFormat(l==='de'?'de-DE':'en-GB',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(value));
  const pay=attrs(l,{[t('Gehalt/Monat','Salary/month')]:meta.salaryMonth==null?'':currency(meta.salaryMonth),[t('Gehalt/Jahr','Salary/year')]:meta.salaryYear==null?'':currency(meta.salaryYear)});
  if(pay)extra=block('<div class="article"><dl class="specs">'+pay+'</dl></div>');
 } else if(e.kind==='reference'){
  extra=block('<div class="article">'+approvedImage+list+official+'</div>');
 } else {
  if(e.slug==='unternehmen')extra=block(companySections(l));
  if(e.slug==='geschichte')extra=block('<div class="article"><h2>1964 — 2019</h2>'+tabs(l,timeline.map(([y,h,p])=>[pair(String(y),String(y)),pair(h.de+' — '+p.de,h.en+' — '+p.en)]))+'</div>');
  if(e.slug==='qualitaet')extra=block('<div class="article"><h2>'+t('Qualitätswesen','Quality management')+'</h2><p>'+t('Die Unternehmenswebsite stellt Zertifikatslinks bereit. Die Gültigkeit ist vor einer Veröffentlichung dieses Entwurfs zu prüfen.','The official site provides certificate links. Verify their validity before publishing this concept.')+'</p>'+link(sources.certs,t('Downloads der Unternehmenswebsite','Downloads on the company website'))+'</div>');
  if(e.slug==='technologie')extra=block(viewer(l));
  if(official)extra+=block(official,'slim');
 }
 return {heading,seoTitle:local(l,meta.seo),description:desc,image:meta.media?'/media-library/'+meta.media:undefined,body:(preview?'<div class="wrap"><p class="note">CMS PREVIEW · '+t('Nicht öffentlich','Not public')+'</p></div>':'')+screen(l,'KLAUS / '+(e.kind==='page'?t('Unternehmen','Company'):local(l,categories[meta.category])||'ENGINEERING'),heading,desc,action?'<div class="actions">'+action+'</div>':'')+extra};
}
export function contact(l){
 const t=copy(l),heading=t('Kontakt','Contact');
 const map='https://www.openstreetmap.org/search?query='+encodeURIComponent(company.address+', '+company.city);
 return {heading,body:screen(l,'KINDSBACH / DE',t('Standort & Kontakt','Location & contact'),company.name)+block('<div class="split"><div><h3>'+company.address+'<br>'+company.city+'</h3><p class="intro">Tel. '+company.phone+'<br>'+company.email+'</p><p class="muted">'+t('Öffentlich angegebene Unternehmenskontaktdaten. Demo-Formulare senden nichts an diese Adresse.','Public company contact details. Demo forms never send to this address.')+'</p>'+link(company.source,t('Offizieller Kontakt','Official contact'))+'</div><a class="map" href="'+esc(map)+'" aria-label="'+t('Interaktive Karte bei OpenStreetMap öffnen','Open interactive map on OpenStreetMap')+'"><svg viewBox="0 0 500 310" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0v24" fill="none" stroke="#224059"/></pattern></defs><rect width="500" height="310" fill="url(#grid)"/><circle cx="250" cy="130" r="65" stroke="#466883" fill="none"/><circle cx="250" cy="130" r="17" fill="#67bdff"/><path d="M250 144v26" stroke="#67bdff" stroke-width="3"/><text x="250" y="208" fill="#def2ff" font-family="monospace" text-anchor="middle" font-size="16">KINDSBACH ↗</text><text x="250" y="235" fill="#a9c0d3" font-family="monospace" text-anchor="middle" font-size="11">OPENSTREETMAP / EXTERNAL</text></svg></a></div>')};
}
export function legal(l,which){
 const t=copy(l),privacy=which==='datenschutz',heading=privacy?t('Datenschutz & Cookies','Privacy & cookies'):t('Impressum','Legal notice');
 return {heading,body:screen(l,'KONZEPT / DEMO',heading,t('Unabhängiger, unveröffentlichter Konzeptentwurf.','Independent, unpublished concept.'))+block('<div class="article">'+(privacy?'<p>'+t('Die lokale Demo speichert Eingaben und Testdateien in einer lokalen Datenbank. Für die Anmeldung wird ein notwendiges Sitzungscookie gesetzt. Es sind keine Tracker, externen Kartenframes oder Marketing-Cookies eingebunden. Verwenden Sie ausschließlich erfundene Testdaten.','The local demo stores submissions and sample files in a local database. A necessary session cookie is set at sign-in. There are no trackers, external map embeds or marketing cookies. Use fictional test data only.')+'</p>':'<p>'+t('Diese Demo wurde nicht von KLAUS-MASCHINENBAU beauftragt. Das Unternehmensimpressum gilt für den bestehenden offiziellen Auftritt.','This demo was not commissioned by KLAUS-MASCHINENBAU. The company’s legal notice applies to its existing official site.')+'</p>')+'<p>'+t('Vor einer Veröffentlichung müssen Betreiberangaben und Rechtstexte fachlich geprüft und ergänzt werden.','Before publication, operator details and legal information require professional review and completion.')+'</p>'+link(privacy?sources.privacy:sources.legal,t('Offizielle Unternehmenswebsite öffnen','Open official company website'))+'</div>')};
}
export function inquiry(l,params){
 const t=copy(l),b='/'+l,h=t('Projektanfrage','Project inquiry'),steps=[t('Verfahren','Process'),t('Werkstück','Part'),t('Dateien','Files'),t('Kontakt','Contact'),t('Prüfen','Review'),t('Senden','Submit')];
 const f=(i,body)=>'<fieldset data-step="'+i+'"><legend>'+steps[i]+'</legend>'+body+'</fieldset>';
 const body=f(0,select(t('Benötigte Fertigungsart','Required capability'),'service',[['',t('Bitte wählen','Select a capability')],...catalog('service').map(s=>[s.slug,local(l,s.title)])],params.get('leistung')||''))+
 f(1,'<div class="fields">'+input(t('Material','Material'),'material')+input(t('Abmessungen','Dimensions'),'dimensions')+input(t('Stückzahl','Quantity'),'quantity','',{type:'number',extra:'min="1" max="100000000" step="1"'})+input(t('Toleranz','Tolerance'),'tolerance','',{optional:true})+input(t('Wunschtermin','Requested delivery'),'delivery','',{type:'date',optional:true})+'</div>'+area(t('Weitere Anforderungen','Additional requirements'),'details','',true))+
 f(2,'<label>'+t('Dateien · PDF, STEP, STP, IGES, IGS, DXF','Files · PDF, STEP, STP, IGES, IGS, DXF')+'<input type="file" name="files" accept=".pdf,.step,.stp,.iges,.igs,.dxf" multiple></label>'+uploadHelp(l)+'<div class="cad-preview" aria-live="polite"></div>')+
 f(3,'<div class="fields">'+input(t('Unternehmen','Company'),'company')+input(t('Ansprechpartner','Contact name'),'name')+input(t('E-Mail-Adresse','Email address'),'email','',{type:'email',extra:'autocomplete="email"'})+input(t('Telefon (optional)','Phone (optional)'),'phone','',{type:'tel',optional:true})+'</div>')+
 f(4,'<dl class="specs" data-summary></dl>')+
 f(5,'<label class="check"><input type="checkbox" name="consent" value="yes" required>'+t('Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung der Anfrage zu.','I agree to the processing of my details for handling this inquiry.')+'</label><p>'+link(b+'/datenschutz',t('Datenschutzinformationen','Privacy information'))+'</p>'+submit(t('Projektanfrage senden','Send project inquiry')));
 const track='<ol class="wizardtrack" hidden>'+steps.map((s,i)=>'<li><b>0'+(i+1)+'</b><span>'+s+'</span></li>').join('')+'</ol>';
 return {heading:h,body:screen(l,'KLAUS MASCHINENBAU / ANFRAGE',h,t('Fertigung, Werkstück, Zeichnung und Kontaktdaten in einer strukturierten Anfrage erfassen.','Send a structured inquiry with your process, part, drawings and contact details.'))+block('<div class="formshell panel"><p class="note">'+t('Ihre Anfrage wird im Administrationsbereich gespeichert.','Your inquiry will be saved in the administration inbox.')+'</p>'+track+form(b+'/anfrage',body+'<div class="wiznav" hidden><button type="button" data-back class="btn ghost">'+t('Zurück','Back')+'</button><button type="button" data-next class="btn primary">'+t('Weiter','Continue')+' →</button></div>',true,'data-wizard')+'</div>')};
}
export function application(l,job){
 const t=copy(l), b='/'+l, heading=t('Demo-Bewerbung','Demo application');
 return {heading,body:screen(l,'KARRIERE / LOCAL DEMO',heading,local(l,job.title))+block('<div class="panel formshell"><p class="note">'+t('Nur erfundene Angaben. Die Demo übermittelt keine Bewerbung.','Fictional details only. This demo does not forward applications.')+'</p>'+form(b+'/bewerbung/'+job.slug,'<div class="fields">'+input(t('Name','Name'),'name')+input(t('Demo-E-Mail · @example.test','Demo email · @example.test'),'email','',{type:'email',extra:'pattern="[^@]+@example[.]test"'})+'</div>'+area(t('Weitere Angaben','Additional information'),'details','',true)+'<label>'+t('Lebenslauf und weitere Unterlagen (PDF)','CV and supporting documents (PDF)')+'<input type="file" name="files" accept=".pdf" multiple required></label>'+uploadHelp(l,'application')+'<label class="check"><input type="checkbox" name="consent" value="yes" required>'+t('Ich verwende ausschließlich Testdaten.','I am using test data only.')+'</label><p>'+link(b+'/datenschutz',t('Datenschutzinformationen','Privacy information'))+'</p>'+submit(t('Demo-Bewerbung speichern','Save demo application')),true)+'</div>')};
}

