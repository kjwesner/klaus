
const en=document.documentElement.lang==='en', t=(a,b)=>en?b:a;
const menu=document.querySelector('.menubtn'), nav=document.querySelector('#nav');
function closeNav(){menu?.setAttribute('aria-expanded','false');nav?.classList.remove('open');}
menu?.addEventListener('click',()=>{const v=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',v);nav.classList.toggle('open',v);});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeNav();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeNav();menu.focus();}});
const mq=matchMedia('(prefers-reduced-motion: reduce)');
const hero=document.querySelector('.hero');
if(hero&&!mq.matches&&matchMedia('(min-width: 721px)').matches){let raf=0;
 const draw=()=>{raf=0;const y=Math.max(0,-hero.getBoundingClientRect().top);hero.style.setProperty('--zoom',1.095-Math.min(.095,y/hero.offsetHeight*.095));};
 addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(draw);},{passive:true});draw();
}
document.addEventListener('change',event=>{const picker=event.target.closest('[data-media-picker]');if(!picker)return;const preview=picker.parentElement.querySelector('[data-media-preview]');if(!preview)return;const id=picker.value;preview.hidden=!id;if(id)preview.src='/media-library/'+encodeURIComponent(id);});
const revealSelector='.hero .eyebrow,.hero h1,.hero p,.hero .actions,.hero-tech,.hero-foot,.infogrid>a,.sectionhead,.cardgrid>.card,.studio .split>div,.section>.wrap>.panel,.section>.wrap>.console,.tiles>.tile,.screen h1,.screen .intro,.formshell,.footmain>div';
let revealObserver=null;
function setupReveal(scope=document){
 if(mq.matches||!('IntersectionObserver'in window))return;
 const elements=scope.querySelectorAll(revealSelector);
 if(!elements.length)return;
 document.documentElement.classList.add('motion-ready');
 if(!revealObserver)revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
 }),{threshold:.12,rootMargin:'0px 0px -32px 0px'});
 elements.forEach((element,index)=>{
  if(element.classList.contains('scroll-reveal'))return;
  element.classList.add('scroll-reveal');element.style.setProperty('--reveal-delay',`${(index%4)*65}ms`);revealObserver.observe(element);
 });
}
setupReveal();
for(const group of document.querySelectorAll('[data-tabs]')){
 const tabs=[...group.querySelectorAll('[role=tab]')], panels=[...group.querySelectorAll('[role=tabpanel]')];
 function activate(i){tabs.forEach((tab,j)=>{tab.tabIndex=i===j?0:-1;tab.setAttribute('aria-selected',i===j);panels[j].hidden=i!==j;});}
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>activate(i));b.addEventListener('keydown',e=>{let j;if(e.key==='ArrowRight')j=(i+1)%tabs.length;if(e.key==='ArrowLeft')j=(i+tabs.length-1)%tabs.length;if(e.key==='Home')j=0;if(e.key==='End')j=tabs.length-1;if(j!==undefined){e.preventDefault();activate(j);tabs[j].focus();}});});
}
for(const v of document.querySelectorAll('[data-viewer]')){
 const b=v.querySelector('.load3d'), cap=v.querySelector('.modelcaption'), stage=v.querySelector('.viewstage'), controls=v.querySelector('.viewercontrols'), options=v.querySelector('.viewoptions');
 if(document.body.classList.contains('no-3d')){b?.remove();controls.hidden=true;options.hidden=true;cap.textContent=t('3D-Ansicht wurde in den Website-Einstellungen deaktiviert.','3D views are disabled in the website settings.');continue;}
 b.addEventListener('click',async()=>{b.disabled=true;b.firstChild.textContent=t('3D-Ansicht lädt …','Loading 3D viewer …');try{
 const m=await import('/viewer.js?v=3d-fallback-1');m.install(v,en);v.querySelector('.viewercontrols').querySelector('button').focus();
 }catch{stage.innerHTML='<div class="viewplaceholder viewer-fallback"><img src="/blueprint.svg" alt="" width="310" height="210"><p>'+t('Schematische 3D-Ansicht','Schematic 3D view')+'</p></div>';controls.hidden=true;options.hidden=true;cap.textContent=t('WebGL ist hier nicht verfügbar. Die schematische Zeichnung bleibt sichtbar.','WebGL is unavailable here. The schematic drawing remains available.');b.disabled=false;b.firstChild.textContent=t('Erneut versuchen','Try again');}});
}
function initWizard(wizard){
 if(wizard.dataset.initialized)return;
 wizard.dataset.initialized='true';
 const blocks=[...wizard.querySelectorAll('[data-step]')], track=wizard.closest('.formshell')?.querySelector('.wizardtrack'), nav=wizard.querySelector('.wiznav'), next=wizard.querySelector('[data-next]'),back=wizard.querySelector('[data-back]'), summary=wizard.querySelector('[data-summary]');
 const input=wizard.querySelector('input[type=file]'), preview=wizard.querySelector('.cad-preview');
 let current=0;
 function cell(term,desc){
  const d=document.createElement('div'),a=document.createElement('dt'),b=document.createElement('dd');
  a.textContent=term;b.textContent=desc;d.append(a,b);return d;
 }
 function renderSummary(){summary.replaceChildren();for(const node of [...wizard.elements]){
  if(!node.name||node.name==='consent'||!node.value)continue;
  const label=node.closest('label')?.firstChild.textContent.trim()||node.name;
  const value=node.type==='file'?[...node.files].map(x=>x.name).join(', '):node.tagName==='SELECT'?node.options[node.selectedIndex].text:node.value;
  summary.append(cell(label,value));
 }}
 function show(i,focus=true){current=i;blocks.forEach((f,j)=>f.hidden=i!==j);[...track.children].forEach((li,j)=>{if(j===i)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});next.hidden=i===5;back.hidden=i===0;nav.hidden=false;if(i===4)renderSummary();
 if(focus){const legend=blocks[i].querySelector('legend');legend.tabIndex=-1;legend.focus({preventScroll:false});}}
 function valid(i){for(const el of blocks[i].elements){if(!el.reportValidity())return false;}return true;}
 function forward(){if(valid(current))show(Math.min(5,current+1));}
 back.addEventListener('click',()=>show(current-1));next.addEventListener('click',forward);
 wizard.addEventListener('submit',e=>{if(current<5){e.preventDefault();forward();return;}for(let i=0;i<blocks.length;i++){
  const bad=[...blocks[i].elements].find(x=>x.willValidate&&!x.validity.valid);if(bad){e.preventDefault();show(i,false);bad.reportValidity();return;}
 }});
 wizard.noValidate=true;track.hidden=false;show(0,false);
 input.addEventListener('change',async()=>{
   const files=[...input.files];preview.replaceChildren();input.setCustomValidity('');
   if(files.length>3||files.some(f=>f.size>5*1024*1024)){input.setCustomValidity(t('Maximal 3 Dateien, je 5 MB.','Up to 3 files, 5 MB each.'));input.reportValidity();return;}
   const validPick=files.map(f=>f.name).join('|');
   for(const f of files){if(!/\.dxf$/i.test(f.name)||f.size>1024*1024)continue;
    const text=await f.text(); if(validPick!==[...input.files].map(f=>f.name).join('|'))return;
    const rows=text.trim().split(/\r?\n/);let all=[],current=null;
    for(let i=0;i<rows.length-1;i+=2){const x=rows[i].trim(),v=rows[i+1].trim();
      if(x==='0'){if(current)all.push(current);current=v==='LINE'?{}:null;}
      if(current&&['10','20','11','21'].includes(x))current[x]=Number(v);
    }if(current)all.push(current);
    all=all.filter(p=>['10','20','11','21'].every(x=>Number.isFinite(p[x])&&Math.abs(p[x])<=1e7)).slice(0,1500);
    if(!all.length)continue;
    const xs=all.flatMap(p=>[p[10],p[11]]),ys=all.flatMap(p=>[-p[20],-p[21]]);
    const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(1,Math.max(...xs)-x),h=Math.max(1,Math.max(...ys)-y),border=Math.max(w,h)*.08;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',[x-border,y-border,w+2*border,h+2*border].join(' '));svg.setAttribute('width','360');svg.setAttribute('height','180');svg.setAttribute('role','img');svg.setAttribute('aria-label',t('DXF Linienvorschau','DXF line preview'));
    for(const p of all){const line=document.createElementNS(svg.namespaceURI,'line');for(const [key,val] of Object.entries({x1:p[10],x2:p[11],y1:-p[20],y2:-p[21],stroke:'#ffffff','stroke-width':1,'vector-effect':'non-scaling-stroke'}))line.setAttribute(key,val);svg.append(line);}
    const label=document.createElement('p');label.textContent=f.name+' · '+t('DXF-Linienvorschau (keine vollständige CAD-Ansicht)','DXF line preview (partial CAD view)');preview.append(label,svg);
   }
 });
}
document.querySelectorAll('[data-wizard]').forEach(initWizard);

const inquiryDialog=document.querySelector('#inquiry-dialog'),dialogContent=inquiryDialog?.querySelector('.inquiry-dialog-content'),dialogClose=inquiryDialog?.querySelector('.inquiry-dialog-close');
let inquiryOpener=null;
async function openInquiry(url,trigger){
 if(!inquiryDialog||!dialogContent)return;
 inquiryOpener=trigger;
 dialogContent.innerHTML='<p class="inquiry-loading">'+t('Anfrageformular wird geladen …','Loading inquiry form …')+'</p>';
 inquiryDialog.showModal();
 try{
  const response=await fetch(url,{credentials:'same-origin'});if(!response.ok)throw new Error('Inquiry form unavailable');
  const page=new DOMParser().parseFromString(await response.text(),'text/html'),panel=page.querySelector('.formshell'),wizard=panel?.querySelector('[data-wizard]');
  if(!panel||!wizard||!inquiryDialog.open)throw new Error('Inquiry form unavailable');
  dialogContent.replaceChildren(panel);initWizard(wizard);setupReveal(panel);
  panel.querySelector('[data-step]:not([hidden]) input, [data-step]:not([hidden]) select')?.focus({preventScroll:true});
 }catch{
  if(inquiryDialog.open){inquiryDialog.close();location.assign(url);}
 }
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href]');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||!/^\/(de|en)\/anfrage\/?$/.test(url.pathname)||/^\/(de|en)\/anfrage\/?$/.test(location.pathname))return;
 event.preventDefault();openInquiry(url.pathname+url.search,link);
});
dialogClose?.addEventListener('click',()=>inquiryDialog.close());
inquiryDialog?.addEventListener('click',event=>{if(event.target===inquiryDialog)inquiryDialog.close();});
inquiryDialog?.addEventListener('close',()=>{dialogContent.replaceChildren();inquiryOpener?.focus({preventScroll:true});inquiryOpener=null;});

const portalDialog=document.querySelector('#portal-dialog'),portalForm=portalDialog?.querySelector('.portal-wizard');
let portalOpener=null;
function openPortal(trigger){if(!portalDialog)return;portalOpener=trigger;portalDialog.showModal();const chatOpen=portalForm?.classList.contains('portal-chat-open');portalForm?.querySelector(chatOpen?'[data-portal-message]':'select')?.focus({preventScroll:true});}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-portal-open]');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target)return;
 const url=new URL(link.href,location.href);if(url.origin!==location.origin)return;
 event.preventDefault();openPortal(link);
});
const portalClose=portalDialog?.querySelector('.portal-dialog-close');
portalClose?.addEventListener('click',()=>portalDialog.close());
const portalFullscreen=portalDialog?.querySelector('[data-portal-fullscreen]');
function syncPortalFullscreen(){const active=document.fullscreenElement===portalDialog||portalDialog?.classList.contains('is-fullscreen');portalFullscreen?.setAttribute('aria-label',active?t('Vollbild verlassen','Exit full screen'):t('Vollbild öffnen','Enter full screen'));portalFullscreen?.querySelector('[data-fullscreen-enter]')?.toggleAttribute('hidden',active);portalFullscreen?.querySelector('[data-fullscreen-exit]')?.toggleAttribute('hidden',!active);}
portalFullscreen?.addEventListener('click',async()=>{if(document.fullscreenElement===portalDialog){await document.exitFullscreen().catch(()=>{});syncPortalFullscreen();return;}if(document.fullscreenEnabled&&portalDialog.requestFullscreen){try{await portalDialog.requestFullscreen();syncPortalFullscreen();return;}catch{}}
 portalDialog.classList.toggle('is-fullscreen');syncPortalFullscreen();});
document.addEventListener('fullscreenchange',syncPortalFullscreen);
portalDialog?.addEventListener('click',event=>{if(event.target===portalDialog)portalDialog.close();});
portalDialog?.addEventListener('close',()=>{if(document.fullscreenElement===portalDialog)document.exitFullscreen().catch(()=>{});portalDialog.classList.remove('is-fullscreen');syncPortalFullscreen();portalOpener?.focus({preventScroll:true});portalOpener=null;});
if(portalForm){
 const steps=[...portalForm.querySelectorAll('[data-portal-step]')],track=portalForm.querySelector('.wizardtrack'),next=portalForm.querySelector('[data-portal-next]'),back=portalForm.querySelector('[data-portal-back]'),summary=portalForm.querySelector('.portal-summary'),chatStage=portalForm.querySelector('[data-portal-chat-stage]'),chatlog=portalForm.querySelector('[data-portal-chatlog]'),composer=portalForm.querySelector('[data-portal-composer]'),message=portalForm.querySelector('[data-portal-message]'),filesInput=portalForm.querySelector('[data-portal-files]'),attachmentList=portalForm.querySelector('[data-portal-attachments]'),sendMessage=portalForm.querySelector('[data-portal-send]');let current=0,pendingAttachments=[],aiBusy=false;const history=[],inquiryId=crypto.randomUUID();let inquiryNumber='';
 portalForm.noValidate=true;
 function updateSummary(){summary.replaceChildren();for(const field of portalForm.querySelectorAll('input[name],select[name],textarea[name]')){if(field.matches('[data-portal-message]')||!field.value)continue;const label=document.createElement('dt');label.textContent=field.closest('label')?.childNodes[0]?.textContent.trim()||field.name;const value=document.createElement('dd');value.textContent=field.tagName==='SELECT'?field.options[field.selectedIndex].text:field.value;summary.append(label,value);}}
 function showStep(index){current=index;steps.forEach((step,i)=>step.hidden=i!==index);[...track.children].forEach((item,i)=>{if(i===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current','step');});back.hidden=index===0;next.hidden=false;next.childNodes[0].textContent=index===steps.length-1?t('Chat öffnen','Open chat'):t('Weiter','Next');if(index<steps.length)steps[index].querySelector('input,select,textarea')?.focus({preventScroll:true});}
 function validStep(){for(const field of steps[current].querySelectorAll('input,select,textarea'))if(!field.reportValidity())return false;return true;}
 function appendChat(role,content,files=[]){const line=document.createElement('div');line.className='portal-chat-line';line.dataset.role=role;const text=document.createElement('div');text.textContent=content;line.append(text);for(const file of files){const chip=document.createElement('div');chip.className='portal-message-file';if(file.data&&file.mime?.startsWith('image/')){const image=document.createElement('img');image.src='data:'+file.mime+';base64,'+file.data;image.alt=file.name;chip.append(image);}const name=document.createElement('span');name.textContent=file.name;chip.append(name);line.append(chip);}chatlog.append(line);chatlog.hidden=false;return line;}
 function renderAttachments(){attachmentList.replaceChildren();attachmentList.hidden=!pendingAttachments.length;pendingAttachments.forEach((file,index)=>{const chip=document.createElement('div');chip.className='portal-file-chip';if(file.preview){const image=document.createElement('img');image.src=file.preview;image.alt='';chip.append(image);}const name=document.createElement('span');name.textContent=file.name;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',t('Anhang entfernen','Remove attachment')+': '+file.name);remove.addEventListener('click',()=>{if(file.preview)URL.revokeObjectURL(file.preview);pendingAttachments.splice(index,1);renderAttachments();});chip.append(name,remove);attachmentList.append(chip);});}
 function notifyAttachmentIssue(text){appendChat('assistant',text);}
 function readDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error(t('Datei konnte nicht gelesen werden.','Could not read file.')));reader.readAsDataURL(file);});}
 filesInput?.addEventListener('change',async()=>{const selected=[...filesInput.files];filesInput.value='';if(pendingAttachments.length+selected.length>3){notifyAttachmentIssue(t('Maximal drei Dateien pro Nachricht.','Up to three files per message.'));return;}let total=pendingAttachments.reduce((sum,item)=>sum+item.size,0);for(const file of selected){const extension=file.name.split('.').pop().toLowerCase(),isImage=['image/png','image/jpeg','image/webp'].includes(file.type),isPdf=extension==='pdf'&&file.type==='application/pdf',isText=['txt','md','csv','json','dxf'].includes(extension);if(file.size>5*1024*1024||total+file.size>8*1024*1024){notifyAttachmentIssue(t('Dateien: maximal 5 MB pro Datei und 8 MB insgesamt.','Attachments: 5 MB per file and 8 MB total.'));return;}if(!isImage&&!isPdf&&!isText){notifyAttachmentIssue(t('Dateityp nicht unterstützt. Erlaubt sind Bilder, PDF, TXT, MD, CSV, JSON und DXF.','Unsupported file type. Use images, PDF, TXT, MD, CSV, JSON, or DXF.'));return;}if(isText&&file.size>100*1024){notifyAttachmentIssue(t('Textdateien dürfen höchstens 100 KB groß sein.','Text files must be no larger than 100 KB.'));return;}try{let item={name:file.name,mime:isImage?file.type:isPdf?'application/pdf':'text/plain',size:file.size};if(isImage||isPdf){const dataUrl=await readDataUrl(file);item.data=dataUrl.split(',')[1];if(isImage)item.preview=URL.createObjectURL(file);}else item.text=await file.text();pendingAttachments.push(item);total+=file.size;}catch(error){notifyAttachmentIssue(error.message);}}renderAttachments();});
 function openChat(){if(portalForm.classList.contains('portal-chat-open'))return;updateSummary();const userSummary=[...summary.querySelectorAll('dt')].map(dt=>dt.textContent+': '+dt.nextElementSibling.textContent).join('\n');appendChat('user',userSummary);track.hidden=true;steps.forEach(step=>step.hidden=true);portalForm.querySelector('.wiznav').hidden=true;chatStage.hidden=false;portalForm.classList.add('portal-chat-open');portalDialog.querySelector('#portal-dialog-title').textContent='Karl Johann AI';composer.hidden=false;sendMessage.hidden=false;}
 async function askAI(){if(aiBusy)return;aiBusy=true;openChat();sendMessage.disabled=true;const waiting=appendChat('assistant','');waiting.classList.add('is-typing');waiting.setAttribute('aria-label',t('Karl Johann AI schreibt','Karl Johann AI is typing'));waiting.innerHTML='<i></i><i></i><i></i>';message.focus({preventScroll:true});try{const context=Object.fromEntries(new FormData(portalForm).entries());const response=await fetch('/'+(en?'en':'de')+'/ki',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({context,messages:history,inquiryId})});const result=await response.json(),requestIsNew=!inquiryNumber;if(result.inquiryNumber&&!inquiryNumber)inquiryNumber=result.inquiryNumber;const inquiryNote=requestIsNew&&inquiryNumber?'\n\n'+t('Ihre Anfrage ist erfasst. Vorgangsnummer: ','Your inquiry is saved. Reference: ')+inquiryNumber:'';if(!response.ok)throw new Error((result.error||t('Die KI-Anfrage ist fehlgeschlagen.','The AI request failed.'))+(requestIsNew?inquiryNote:''));history.push({role:'assistant',content:result.answer});for(const item of history)delete item.attachments;waiting.classList.remove('is-typing');waiting.removeAttribute('aria-label');waiting.textContent=result.answer+inquiryNote;}catch(error){waiting.classList.remove('is-typing');waiting.removeAttribute('aria-label');waiting.textContent=error.message||t('Das lokale KI-Modell ist nicht erreichbar.','The local AI model is unavailable.');}finally{aiBusy=false;sendMessage.disabled=false;}}
 next?.addEventListener('click',()=>{if(!validStep())return;if(current===steps.length-1){history.push({role:'user',content:t('Bitte beantworte mein Anliegen und stelle bei Bedarf Rückfragen.','Please help with my request and ask follow-up questions if needed.')});askAI();return;}showStep(current+1);});back?.addEventListener('click',()=>showStep(Math.max(0,current-1)));
 sendMessage?.addEventListener('click',()=>{if(aiBusy||sendMessage.disabled)return;const content=message.value.trim();if(!content&&!pendingAttachments.length)return;const attachments=pendingAttachments.map(({name,mime,data,text})=>({name,mime,data,text}));const requestText=content||t('Bitte prüfe die angehängten Dateien.','Please review the attached files.');history.push({role:'user',content:requestText,attachments});appendChat('user',requestText,attachments);pendingAttachments.forEach(file=>{if(file.preview)URL.revokeObjectURL(file.preview);});pendingAttachments=[];renderAttachments();message.value='';askAI();});
 message?.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(!sendMessage.disabled)sendMessage.click();}});
 showStep(0);
}
if(document.body.classList.contains('portal-start'))openPortal(document.querySelector('a[data-portal-open]'));

