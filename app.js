'use strict';

const NAXOS='https://raw.githubusercontent.com/DDRNFinch/Naxosv2/main/';
const SOURCE=NAXOS+'data/evidence-packs-source.json';
const APP_VERSION='4';
const state={view:'home',course:null,packs:[],courses:{},profile:{name:'',courseKey:'ST0095'},evidence:{},otj:[],currentPack:0};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('walsall-evidence',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
async function photoPut(key,value){const db=await dbPromise;return new Promise((res,rej)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(value,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function photoGet(key){const db=await dbPromise;return new Promise((res,rej)=>{const r=db.transaction('photos').objectStore('photos').get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function photoDelete(key){const db=await dbPromise;return new Promise((res,rej)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').delete(key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
function photoKey(id,n){return id+'::'+n}

async function load(){
  try{const saved=JSON.parse(localStorage.getItem('walsall-state')||'null');if(saved){Object.assign(state,saved);state.profile=saved.profile||state.profile;state.evidence=saved.evidence||{};state.otj=saved.otj||[];state.currentPack=saved.currentPack||0}}
  catch(e){console.warn('Saved data reset',e)}
  try{await loadCourse(state.profile.courseKey||'ST0095');render()}catch(e){console.error(e);$('#app').innerHTML=`<div class="page"><div class="card"><h2>Course could not load</h2><p class="muted">Walsall could not read the Naxosv2 course pack.</p><pre>${esc(e.stack||e)}</pre></div></div>`}
}
async function loadCourse(key){
  const source=await fetch(SOURCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Could not load Naxos source');return r.json()});
  state.courses=Object.fromEntries(Object.entries(source.courses||{}).filter(([,v])=>v.type==='standard-main-packs'));
  const cfg=source.courses[key];if(!cfg)throw Error('Course not found in Naxosv2: '+key);if(cfg.type!=='standard-main-packs')throw Error('This learner build currently supports standard learner packs.');
  const packs=await fetch(NAXOS+'data/standards/'+key+'/main-packs.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Could not load '+key+' packs');return r.json()});
  state.course={key,config:cfg,metadata:packs};state.packs=packs.packs||[];state.profile.courseKey=key;save();$('#courseLabel').textContent=key+' · '+state.packs.length+' packs';
}
function save(){localStorage.setItem('walsall-state',JSON.stringify(state))}
function pct(pack){const e=state.evidence[pack.id]||{photos:[],statement:''};const photos=Math.min((e.photos||[]).filter(Boolean).length,pack.capture.length);const statement=(e.statement||'').trim().length>=100?1:0;return Math.round((photos/pack.capture.length)*80+statement*20)}
function status(pack){const p=pct(pack);return p>=100?'Complete':p?'In progress':'Not started'}
function render(){document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));if(state.view==='home')renderHome();else if(state.view==='packs')renderPacks();else if(state.view==='otj')renderOTJ();else renderProfile()}
function renderHome(){const done=state.packs.filter(p=>pct(p)>=100).length,hours=state.otj.reduce((a,b)=>a+Number(b.hours||0),0);$('#app').innerHTML=`<div class="page"><section class="hero"><h1>${esc(state.profile.name||'Your evidence portfolio')}</h1><p>${esc(state.course?.key||'Course')} · ${done}/${state.packs.length} packs complete</p></section><div class="grid"><div class="card"><h3>Evidence packs</h3><strong>${done}/${state.packs.length}</strong><div class="progress"><i style="width:${state.packs.length?done/state.packs.length*100:0}%"></i></div><button class="btn primary full" onclick="go('packs')">Continue packs</button></div><div class="card"><h3>Off-the-job</h3><strong>${hours.toFixed(1)} hours</strong><p class="muted">${state.otj.length} entries</p><button class="btn full" onclick="go('otj')">Open OTJ</button></div></div><div class="card stack" style="margin-top:12px"><h3>Your course</h3><p class="muted">The packs shown here come directly from Naxosv2. Course content is not editable by learners.</p></div></div>`}
function renderPacks(){const html=state.packs.map((p,i)=>`<div class="card pack" onclick="openPack(${i})"><div class="pack-num">${String(i+1).padStart(2,'0')}</div><div style="flex:1"><h3>${esc(p.title)}</h3><p class="muted">${esc(p.summary)}</p><div class="status">${status(p)} · ${pct(p)}%</div><div class="progress"><i style="width:${pct(p)}%"></i></div></div></div>`).join('');$('#app').innerHTML=`<div class="page"><h1>Evidence packs</h1><p class="muted">Follow the Naxosv2 packs. Each pack tells you what evidence to collect.</p><div class="stack">${html}</div></div>`}
async function openPack(i){state.currentPack=i;save();const p=state.packs[i],e=state.evidence[p.id]||{photos:[],statement:''};const photos=await Promise.all(p.capture.map((_,n)=>photoGet(photoKey(p.id,n)).catch(()=>null)));$('#app').innerHTML=`<div class="page"><button class="btn" onclick="go('packs')">← All packs</button><div class="card" style="margin-top:12px"><div class="status">PACK ${String(i+1).padStart(2,'0')}</div><h1>${esc(p.title)}</h1><p class="muted">${esc(p.summary)}</p><h3>Follow these photo prompts</h3><ul class="checklist">${p.capture.map((x,n)=>`<li><span class="${photos[n]?'tick':''}">${photos[n]?'✓':'○'}</span> ${esc(x)}</li>`).join('')}</ul></div><div class="card stack" style="margin-top:12px"><h3>Take your photos</h3><p class="muted">Take one clear photo for each prompt. Photos are saved on this device.</p><div class="photo-grid">${p.capture.map((prompt,n)=>photoBox(p.id,n,prompt,photos[n])).join('')}</div></div><div class="card stack" style="margin-top:12px"><h3>Your statement</h3><p class="muted">Explain what you did, how you did it and how you checked the finished work. Minimum 100 words.</p><textarea id="statement" placeholder="Write your statement here…" oninput="saveStatement('${p.id}',this.value)">${esc(e.statement||'')}</textarea><div class="status"><span id="wordCount">${wordCount(e.statement||'')}</span> words · minimum 100</div></div><div class="card stack" style="margin-top:12px"><h3>Mapped KSBs</h3><p class="muted">${(p.primaryKSBs||[]).map(esc).join(' · ')}</p><button class="btn green full" ${pct(p)<100?'disabled':''} onclick="downloadPack(${i})">Download completed pack PDF</button></div></div>`}
function photoBox(id,n,prompt,data){return `<div><label class="photo-box">${data?`<img src="${data}" alt="${esc(prompt)}"><button onclick="event.preventDefault();removePhoto('${id}',${n})">×</button>`:`<input type="file" accept="image/*" capture="environment" style="position:absolute;inset:0;opacity:0;cursor:pointer" onchange="addPhoto(event,'${id}',${n})"><div style="padding:18px;text-align:center"><strong>+ Photo</strong><div class="prompt">${esc(prompt)}</div></div>`}</label></div>`}
function wordCount(s){return s.trim()?s.trim().split(/\s+/).length:0}
function saveStatement(id,v){state.evidence[id]=state.evidence[id]||{photos:[],statement:''};state.evidence[id].statement=v;save();const w=$('#wordCount');if(w)w.textContent=wordCount(v)}
async function addPhoto(ev,id,n){const file=ev.target.files?.[0];if(!file)return;try{const data=await resizeImage(file,1200);await photoPut(photoKey(id,n),data);state.evidence[id]=state.evidence[id]||{photos:[],statement:''};state.evidence[id].photos=state.evidence[id].photos||[];state.evidence[id].photos[n]={name:file.name};save();await openPack(state.currentPack)}catch(e){console.error(e);toast('Photo could not be saved')}}
async function removePhoto(id,n){const e=state.evidence[id];if(e?.photos){e.photos[n]=null;while(e.photos.length&&e.photos[e.photos.length-1]===null)e.photos.pop()}await photoDelete(photoKey(id,n));save();openPack(state.currentPack)}
function resizeImage(file,max){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const scale=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.72))};im.onerror=reject;im.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}
function renderOTJ(){const total=state.otj.reduce((a,b)=>a+Number(b.hours||0),0),rows=state.otj.map((x,i)=>`<div class="card"><div style="display:flex;justify-content:space-between"><strong>${esc(x.date)}</strong><strong>${Number(x.hours).toFixed(1)}h</strong></div><p>${esc(x.activity)}</p><p class="muted">${esc(x.learning)}</p><button class="btn" onclick="deleteOTJ(${i})">Delete</button></div>`).join('');$('#app').innerHTML=`<div class="page"><div class="hero"><h1>Off-the-job training</h1><p>${total.toFixed(1)} hours recorded</p></div><div class="card stack"><h3>Add OTJ entry</h3><input class="input" id="otjDate" type="date" value="${new Date().toISOString().slice(0,10)}"><input class="input" id="otjHours" type="number" min="0.25" step="0.25" placeholder="Hours"><input class="input" id="otjActivity" placeholder="What did you do?"><textarea id="otjLearning" placeholder="What did you learn?"></textarea><button class="btn primary full" onclick="addOTJ()">Save OTJ entry</button></div><div class="stack" style="margin-top:12px">${rows||'<div class="card muted">No OTJ entries yet.</div>'}</div><button class="btn green full" style="margin-top:12px" ${state.otj.length?'':'disabled'} onclick="downloadOTJ()">Download collated OTJ PDF</button></div>`}
function addOTJ(){const date=$('#otjDate').value,hours=Number($('#otjHours').value),activity=$('#otjActivity').value.trim(),learning=$('#otjLearning').value.trim();if(!date||!hours||!activity){toast('Enter date, hours and activity');return}state.otj.push({date,hours,activity,learning});state.otj.sort((a,b)=>a.date.localeCompare(b.date));save();renderOTJ();toast('OTJ entry saved')}
function deleteOTJ(i){state.otj.splice(i,1);save();renderOTJ()}
function renderProfile(){const opts=Object.keys(state.courses).map(k=>`<option value="${esc(k)}" ${k===state.profile.courseKey?'selected':''}>${esc(k)}</option>`).join('');$('#app').innerHTML=`<div class="page"><div class="card stack"><h1>Profile</h1><label>Name<input class="input" id="name" value="${esc(state.profile.name)}" placeholder="Your name"></label><label>Course<select class="input" id="course">${opts}</select></label><button class="btn primary full" onclick="saveProfile()">Save profile</button><p class="muted">Course packs are read directly from Naxosv2. Learners can select their assigned course, but cannot change its pack content.</p></div></div>`}
async function saveProfile(){const newKey=$('#course').value;state.profile.name=$('#name').value.trim();if(newKey!==state.profile.courseKey){try{await loadCourse(newKey)}catch(e){toast(e.message);return}}save();renderHome();toast('Profile saved')}
function go(v){state.view=v;render()}

function newPdf(){const {jsPDF}=window.jspdf;return new jsPDF({unit:'mm',format:'a4',compress:true})}
const PDF={left:15,right:15,top:18,bottom:18,width:180,pageH:297};
function pageHeader(doc,title,subtitle){doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text(title,PDF.left,PDF.top);doc.setFont('helvetica','normal');doc.setFontSize(9);if(subtitle)doc.text(subtitle,PDF.left,PDF.top+6);return PDF.top+15}
function footer(doc,page){doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Walsall Evidence',PDF.left,PDF.pageH-9);doc.text(`Page ${page}`,PDF.pageH-25,PDF.pageH-9,{align:'right'})}
function ensureSpace(doc,y,needed,page,title,subtitle){if(y+needed>PDF.pageH-PDF.bottom){footer(doc,page);doc.addPage();page++;y=pageHeader(doc,title,subtitle)}return {y,page}}
function writeWrapped(doc,text,x,y,width,line=4.8){const lines=doc.splitTextToSize(String(text||''),width);for(const lineText of lines){doc.text(lineText,x,y);y+=line}return y}
function addImageFit(doc,data,x,y,maxW,maxH){const props=doc.getImageProperties(data);const ratio=Math.min(maxW/props.width,maxH/props.height);const w=props.width*ratio,h=props.height*ratio;doc.addImage(data,'JPEG',x,y,w,h);return {w,h}}
function addPhotoBlock(doc,data,label,y,page,title,subtitle){doc.setFont('helvetica','bold');doc.setFontSize(10);let s=ensureSpace(doc,y,10,page,title,subtitle);y=s.y;page=s.page;doc.text(label,PDF.left,y);y+=5;const maxH=92;const fit=addImageFit(doc,data,PDF.left,y,PDF.width,maxH);y+=fit.h+7;return {y,page}}

async function downloadPack(i){
  const p=state.packs[i],e=state.evidence[p.id];
  if(pct(p)<100){toast('Complete the photos and statement first');return}
  const photos=await Promise.all(p.capture.map((_,n)=>photoGet(photoKey(p.id,n))));
  if(photos.some(x=>!x)){toast('One or more photos are missing');return}
  const doc=newPdf();let page=1;let y=pageHeader(doc,'Evidence Pack',p.title);
  doc.setFontSize(10);doc.setFont('helvetica','normal');
  y=writeWrapped(doc,`Learner: ${state.profile.name||'Not entered'}`,PDF.left,y,PDF.width);y+=4;
  y=writeWrapped(doc,`Course: ${state.profile.courseKey}`,PDF.left,y,PDF.width);y+=7;
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('Pack summary',PDF.left,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(10);y=writeWrapped(doc,p.summary,PDF.left,y,PDF.width);y+=7;
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Evidence photographs',PDF.left,y);y+=8;doc.setFont('helvetica','normal');doc.setFontSize(10);
  for(let n=0;n<p.capture.length;n++){
    const s=ensureSpace(doc,y,112,page,'Evidence Pack',p.title);y=s.y;page=s.page;
    const result=addPhotoBlock(doc,photos[n],`${n+1}. ${p.capture[n]}`,y,page,'Evidence Pack',p.title);y=result.y;page=result.page;
  }
  let s=ensureSpace(doc,y,35,page,'Evidence Pack',p.title);y=s.y;page=s.page;y+=2;
  doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('Learner statement',PDF.left,y);y+=7;doc.setFont('helvetica','normal');doc.setFontSize(10);y=writeWrapped(doc,e.statement,PDF.left,y,PDF.width);y+=8;
  s=ensureSpace(doc,y,30,page,'Evidence Pack',p.title);y=s.y;page=s.page;
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('Mapped KSBs',PDF.left,y);y+=6;doc.setFont('helvetica','normal');doc.setFontSize(9);y=writeWrapped(doc,(p.primaryKSBs||[]).join(' · '),PDF.left,y,PDF.width,4.2);y+=6;
  footer(doc,page);doc.save(`${safe(p.title)} - ${safe(state.profile.name||'Learner')}.pdf`)
}
function downloadOTJ(){
  const doc=newPdf();let page=1;let y=pageHeader(doc,'Off-the-job training record',state.profile.courseKey);
  doc.setFont('helvetica','normal');doc.setFontSize(10);y=writeWrapped(doc,`Learner: ${state.profile.name||'Not entered'}`,PDF.left,y,PDF.width);y+=4;const total=state.otj.reduce((a,b)=>a+Number(b.hours||0),0);y=writeWrapped(doc,`Total hours: ${total.toFixed(1)}`,PDF.left,y,PDF.width);y+=8;
  state.otj.forEach((x,i)=>{
    let s=ensureSpace(doc,y,35,page,'Off-the-job training record',state.profile.courseKey);y=s.y;page=s.page;
    doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(`${x.date} — ${Number(x.hours).toFixed(1)} hours`,PDF.left,y);y+=6;doc.setFont('helvetica','normal');doc.setFontSize(10);y=writeWrapped(doc,x.activity,PDF.left,y,PDF.width);if(x.learning){y+=2;doc.setFont('helvetica','italic');y=writeWrapped(doc,'Learning: '+x.learning,PDF.left,y,PDF.width)}y+=7;doc.setFont('helvetica','normal');
  });
  footer(doc,page);doc.save(`${safe(state.profile.name||'Learner')} - Off the Job Training.pdf`)
}
function safe(s){return String(s||'').replace(/[^a-z0-9 _-]/gi,'').trim()||'Evidence'}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
document.querySelectorAll('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));$('#profileBtn').addEventListener('click',()=>go('profile'));load();
window.go=go;window.openPack=openPack;window.addPhoto=addPhoto;window.removePhoto=removePhoto;window.saveStatement=saveStatement;window.downloadPack=downloadPack;window.addOTJ=addOTJ;window.deleteOTJ=deleteOTJ;window.downloadOTJ=downloadOTJ;window.saveProfile=saveProfile;
