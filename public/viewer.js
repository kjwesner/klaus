
import * as T from '/vendor/three.module.min.js';
export function install(root,en){
 const tr=(a,b)=>en?b:a, machine=root.dataset.viewer==='machine';
 const stage=root.querySelector('.viewstage'), cap=root.querySelector('.modelcaption'), controls=root.querySelector('.viewercontrols'), opt=root.querySelector('.viewoptions');
 const renderer=new T.WebGLRenderer({antialias:devicePixelRatio<1.6,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
 renderer.domElement.setAttribute('aria-label',tr('Schematisches Modell. Kamera über die Schaltflächen steuerbar.','Schematic model. Use the view buttons to control the camera.'));
 renderer.domElement.setAttribute('role','img');stage.replaceChildren(renderer.domElement);
 const scene=new T.Scene(), camera=new T.PerspectiveCamera(32,1,.1,90), model=new T.Group();scene.add(model);
 scene.add(new T.HemisphereLight(0xffffff,0x343434,2.25));
 for(const [color,x,y,z,int] of [[0xffffff,6,10,5,3.8],[0xdddddd,-5,2,-4,3.5],[0xaaaaaa,-6,4,7,1.6]]){
  const l=new T.DirectionalLight(color,int);l.position.set(x,y,z);scene.add(l);
 }
 const mat=(c)=>new T.MeshStandardMaterial({color:c,metalness:.59,roughness:.26});
 const metal=mat(0x8a8a8a), chrome=mat(0xe0e0e0), dark=mat(0x333333), silver=mat(0xaaaaaa);
 const parts=[], focus=[];
 function create(geo,material,x,y,z,parent=model){
  const m=new T.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;
 }
 const box=(w,h,d,m,x=0,y=0,z=0,g)=>create(new T.BoxGeometry(w,h,d),m,x,y,z,g);
 const cyl=(r,h,m,x=0,y=0,z=0,g)=>create(new T.CylinderGeometry(r,r,h,56),m,x,y,z,g);
 function profile(w,d,r){
  const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;
 }
 function hole(s,x,y,r){const h=new T.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h);}
 function plate(w,d,h,aperture,y,m){
  const s=profile(w,d,.23); if(aperture){hole(s,0,0,.59);for(const x of [-1.12,1.12])for(const z of [-.62,.62])hole(s,x,z,.13);}
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:.042,bevelSize:.045,bevelSegments:2,curveSegments:32,steps:1});
  g.rotateX(-Math.PI/2);return create(g,m,0,y,0);
 }
 if(machine){
  box(4.3,.34,3.2,dark,0,-1.22);box(4,.19,2.93,metal,0,-.95);
  box(.52,2.79,1.02,dark,-1.67,.48,-.77);box(3.4,.45,.82,dark,-.1,1.83,-.77);
  const chuck=new T.Group();model.add(chuck);chuck.position.set(0,0,.1);
  cyl(.42,.53,metal,0,1.44,0,chuck);cyl(.31,.45,chrome,0,1.07,0,chuck);cyl(.15,.66,silver,0,.64,0,chuck);
  focus.push(chuck);const work=plate(2.3,1.55,.27,true,-.38,chrome);work.scale.setScalar(.78);focus.push(work);
  const mount=new T.Group();model.add(mount);
  box(2.78,.23,1.78,metal,0,-.68,.12,mount);for(let x=-1.12;x<=1.14;x+=.38)box(.064,.017,1.6,dark,x,-.555,.12,mount);
  focus.push(mount);
 } else {
  const cut=plate(2.91,1.93,.26,true,-.57,metal);
  const capPlate=plate(2.88,1.84,.18,true,-.22,chrome);parts.push([cut,-.57,-.64],[capPlate,-.22,.12]);
  const rim=new T.Mesh(new T.TorusGeometry(.58,.085,24,64),silver);rim.rotation.x=-Math.PI/2;rim.position.y=.01;model.add(rim);parts.push([rim,.01,.9]);
  for(const x of [-1.12,1.12])for(const z of [-.62,.62]){const pin=cyl(.105,.31,chrome,x,-.08,z);parts.push([pin,-.08,.73]);}
  let explode=0;
  const renderParts=()=>{parts.forEach(([part,y,f])=>{part.visible=true;part.position.y=y+f*explode;});draw();};
  opt.querySelector('[data-explode]').addEventListener('input',e=>{explode=Number(e.target.value)/100;renderParts();});
  const explodeInput=opt.querySelector('[data-explode]');
 }
 let theta=.66,phi=1.07,distance=machine?10.5:7.6;
 function draw(){camera.position.set(distance*Math.sin(phi)*Math.sin(theta),distance*Math.cos(phi),distance*Math.sin(phi)*Math.cos(theta));camera.lookAt(0,machine?.19:-.05,0);renderer.render(scene,camera);}
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;draw();camera.updateProjectionMatrix();draw();}
 const ro=new ResizeObserver(resize);ro.observe(stage);
 let currentPointer=null;
 renderer.domElement.addEventListener('pointerdown',e=>{renderer.domElement.setPointerCapture(e.pointerId);currentPointer=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointermove',e=>{if(!currentPointer)return;theta-=(e.clientX-currentPointer[0])*.012;phi=Math.max(.045,Math.min(3.02,phi-(e.clientY-currentPointer[1])*.012));currentPointer=[e.clientX,e.clientY];draw();});
 for(const name of ['pointerup','pointercancel','lostpointercapture']) renderer.domElement.addEventListener(name,()=>{currentPointer=null;});
 controls.addEventListener('click',async e=>{
  const a=e.target.dataset.view;if(a==='iso'){theta=.66;phi=1.07;}
  if(a==='front'){theta=0;phi=Math.PI/2;}if(a==='top'){theta=0;phi=.045;}
  if(a==='in')distance=Math.max(3.9,distance*.85);if(a==='out')distance=Math.min(17,distance*1.17);
  if(a==='full'){try{if(document.fullscreenElement){await document.exitFullscreen();}else{await root.requestFullscreen();}}catch{cap.textContent=tr('Vollbild nicht verfügbar.','Full screen unavailable.');}}
  draw();
 });
 opt.addEventListener('click',e=>{if(e.target.dataset.hot===undefined)return;const i=Number(e.target.dataset.hot);
  for(const [index,obj] of focus.entries()){const pulse=index===i?0x125d91:0;obj.traverse(m=>{if(m.isMesh){if(!m.userData.unique){m.material=m.material.clone();m.userData.unique=true;}m.material.emissive.setHex(pulse);}});}
  for(const b of opt.querySelectorAll('button'))b.setAttribute('aria-pressed',b===e.target);
  cap.textContent=[tr('Spindel · führt das rotierende Werkzeug','Spindle · holds the rotating cutting tool'),tr('Werkstück · wird spanend bearbeitet','Part · material is removed by machining'),tr('Aufspannung · fixiert das Werkstück','Workholding · secures the part')][i];draw();
 });
 stage.addEventListener('webglcontextlost',e=>{e.preventDefault();cap.textContent=tr('3D-Kontext unterbrochen. Seite neu laden.','3D context lost. Reload the page.');});
 controls.hidden=false;opt.hidden=false;resize();
}

