(() => {
  const originalLoadCourse = window.loadCourse;
  const originalRenderPacks = window.renderPacks;
  const originalOpenPack = window.openPack;
  const NAXOS = 'https://raw.githubusercontent.com/DDRNFinch/Naxosv2/main/data/6570-05/';
  const SOURCE_FILES = ['source/course-core.js','source/unit-102.js','source/units-234-235.js','source/unit-238.js','source/units-303-300-502.js','source/unit-313.js','source/unit-690.js','source/unit-701.js','source/unit-828.js','source/unit-837.js'];
  const OPTIONAL = ['238','690','828','837'];
  let nvqReady = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = NAXOS + src + '?walsall=657005';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load Naxosv2 6570-05 source: ' + src));
      document.head.appendChild(s);
    });
  }

  async function loadNVQ() {
    if (nvqReady) return nvqReady;
    nvqReady = (async () => {
      window.NVQPLUS_COURSE_DATA = null;
      await loadScript('source/course-core.js');
      for (const file of SOURCE_FILES.slice(1)) await loadScript(file);
      await loadScript('normalise.js');
      if (!window.NAXOS_6570_05 || !window.NAXOS_6570_05.units?.length) throw new Error('Naxosv2 6570-05 course data did not load');
      return window.NAXOS_6570_05;
    })();
    return nvqReady;
  }

  const unitPack = (unit, index, optional) => {
    const guidance = {
      '102':['the work area and site conditions','PPE, RPE or other controls in use','safe access and housekeeping','hazards and how they are controlled'],
      '234':['job information before starting','cladding set-out and supports','materials and fixings','openings and hidden details before covering','line, level, plumb and joint checks','the completed cladding'],
      '235':['the drawing or job information','materials before use','setting out and first-course checks','masonry work in progress','openings and hidden details before concealment','line, level, plumb and gauge checks','the finished structure'],
      '303':['the project information used','the planned work method and sequence','resource and access considerations','risk controls','any change to the planned method','communication of the final method'],
      '300':['the work activity being planned','resource quantities and availability','the planned sequence','progress against the programme','external factors or changes','how resources were adjusted'],
      '313':['the drawing or template','setting out for the feature','materials and components','architectural or decorative work in progress','checks to curves, angles or profiles','the finished feature'],
      '502':['communication about the work','coordination with another person or trade','advice or information shared','a change or issue discussed','how agreement was reached'],
      '701':['the drawing or specification','datum and reference points','profiles, lines, levels or gauge','opening positions','measurements and checks','the final set-out before construction'],
      '238':['job information and thin-joint system','first-course level bed','block cutting and preparation','walling in progress','openings and ties or insulation before covering','finished line, level and plumb checks'],
      '690':['the original defect or condition','existing materials and bond','removal and preparation','repair or replacement work','matching and quality checks','the finished repair'],
      '828':['the specialist element and specification','support angles or fire barriers before concealment','positioning and fixing','integration with masonry','levels, plumb or alignment checks','the finished specialist detail'],
      '837':['drainage drawing or levels','excavation and bedding','pipework or chamber installation','falls and alignment checks','connections and seals','testing and completed drainage']
    }[String(unit.id)] || [];
    return {
      id:`6570-05-unit-${unit.id}`,
      title:`Unit ${unit.id} — ${unit.title}`,
      summary:`${optional ? 'Optional unit' : 'Mandatory unit'} · Level ${unit.level} · Portfolio evidence`,
      capture:guidance,
      primaryKSBs:[],
      course:'6570-05',
      unitId:String(unit.id),
      optional:!!optional,
      unit
    };
  };

  async function makePacks(optionalId) {
    const data = await loadNVQ();
    const mandatory = ['102','234','235','303','300','313','502','701'];
    const ids = mandatory.concat([optionalId || '238']);
    return ids.map(id => unitPack(data.units.find(u => String(u.id) === id), ids.indexOf(id), OPTIONAL.includes(id))).filter(Boolean);
  }

  function courseIs6570(){ return state.profile.courseKey === '6570-05'; }
  function selectedOptional(){ return state.profile.optional6570 || '238'; }

  window.loadCourse = async function(key) {
    if (key !== '6570-05') {
      await originalLoadCourse(key);
      state.courses['6570-05'] = { title:'6570-05 · Level 3 NVQ Diploma in Trowel Occupations (Construction)', type:'nvq-unit-packs' };
      return;
    }
    const data = await loadNVQ();
    const packs = await makePacks(selectedOptional());
    state.course = { key:'6570-05', config:{ title:data.course.title, type:'nvq-unit-packs' }, metadata:{ packs, source:'Naxosv2' } };
    state.packs = packs;
    state.profile.courseKey = key;
    state.courses = state.courses || {};
    state.courses['6570-05'] = state.course.config;
    save();
    const label = document.getElementById('courseLabel');
    if (label) label.textContent = '6570-05 · Trowel Occupations · 9 packs';
  };

  window.renderPacks = function(){
    if(!courseIs6570()) return originalRenderPacks();
    const done=state.packs.filter(p=>pct(p)>=100).length;
    const html=state.packs.map((p,i)=>`<div class="card pack w6570-pack" onclick="openPack(${i})"><div class="w6570-pack-top"><span class="w6570-num">${String(i+1).padStart(2,'0')}</span><span class="w6570-pill">${p.optional?'OPTIONAL · ':''}${status(p)}</span></div><h3>${esc(p.title)}</h3><p class="muted">${esc(p.summary)}</p><div class="progress"><i style="width:${pct(p)}%"></i></div><div class="w6570-pack-foot"><span>${pct(p)}% complete</span><span>Open →</span></div></div>`).join('');
    $('#app').innerHTML=`<div class="page"><section class="w6570-course-head"><div class="w6570-eyebrow">Naxosv2 course</div><h1>6570-05</h1><p>Level 3 NVQ Diploma in Trowel Occupations (Construction)</p><div class="w6570-course-progress"><i style="width:${state.packs.length?Math.round(done/state.packs.length*100):0}%"></i></div></section><div class="card stack"><h3>Optional unit</h3><p class="muted">Naxosv2 requires one optional unit. Changing it changes the optional pack only; your mandatory packs remain unchanged.</p><select id="optional6570" class="input">${OPTIONAL.map(id=>{const u=window.NAXOS_6570_05.units.find(x=>String(x.id)===id);return `<option value="${id}" ${id===selectedOptional()?'selected':''}>Unit ${id} — ${esc(u?.title||'')}</option>`}).join('')}</select></div><div class="w6570-section-title"><div><h2>Evidence packs</h2><p>These packs are taken directly from the Naxosv2 6570-05 Trowel Occupations course units.</p></div><span class="w6570-pill">${done}/${state.packs.length}</span></div><div class="stack">${html}</div></div>`;
    const select=$('#optional6570');
    if(select) select.onchange=async()=>{state.profile.optional6570=select.value;save();state.view='packs';await window.loadCourse('6570-05');renderPacks();};
  };

  window.openPack = async function(i){
    if(!courseIs6570()) return originalOpenPack(i);
    state.currentPack=i;save();
    const p=state.packs[i], e=state.evidence[p.id]||{photos:[],statement:'',signature:'',signedDate:'',confidence:0};
    const photos=await Promise.all(p.capture.map((_,n)=>photoGet(photoKey(p.id,n)).catch(()=>null)));
    const selected=e.tags||{};
    const signed=e.signature?`<span class="status">Signed ${esc(e.signedDate||'')}</span>`:'';
    const unit=p.unit;
    const criteria=(unit?.learningOutcomes||[]).flatMap(lo=>(lo.criteria||[]).map(c=>({lo:lo.id, ...c}))).slice(0,20);
    $('#app').innerHTML=`<div class="page"><button class="btn" onclick="go('packs')">← Evidence packs</button><section class="w6570-hero"><div class="w6570-eyebrow">${p.optional?'Optional':'Mandatory'} · Unit ${esc(p.unitId)}</div><h1>${esc(p.title)}</h1><p>${esc(p.summary)}</p></section><section class="card"><h3>Official Naxosv2 unit</h3><p class="muted">${esc(unit?.title||'')}</p><p class="muted">This pack follows the official unit criteria and Naxosv2 selection rules. Evidence is not automatically awarded from a photo or statement.</p></section><section class="card stack"><div class="w6570-step"><span>1</span><div><h3>Take your photos</h3><p class="muted">Capture clear evidence of the activity. Use additional photos where needed.</p></div></div><div class="photo-grid w6570-photo-grid">${p.capture.map((prompt,n)=>photoBox(p.id,n,prompt,photos[n])).join('')}</div></section><section class="card stack"><div class="w6570-step"><span>2</span><div><h3>What else have you covered?</h3><p class="muted">Select relevant areas covered by this evidence.</p></div></div><div class="tags w6570-tags">${['PPE / RPE','Drawings / specifications','RAMS / method statement','Materials / resources','Tools / equipment','Setting out','Quality checks','Waste / environment','Communication','Teamwork','Problem solving','Work programme / sequence'].map(x=>`<button type="button" class="tag ${selected[x]?'on':''}" onclick="toggle6570Tag('${p.id}','${x}',this)">${x}</button>`).join('')}</div></section><section class="card stack"><div class="w6570-step"><span>3</span><div><h3>Explain your work</h3><p class="muted">Describe what you did, how you followed the unit requirements and how you checked the finished work. Minimum 100 words.</p></div></div><textarea id="statement" placeholder="Write your statement here…" oninput="saveStatement('${p.id}',this.value)">${esc(e.statement||'')}</textarea><div class="status"><span id="wordCount">${wordCount(e.statement||'')}</span> words · minimum 100</div></section><section class="card stack"><div class="w6570-step"><span>4</span><div><h3>Unit criteria</h3><p class="muted">Review the official criteria covered by this unit. Lettered requirements and minimum selections remain governed by Naxosv2.</p></div></div><div class="ksb-list">${criteria.map(c=>`<div class="ksb-box"><div class="ksb-code">${esc(p.unitId+'.'+c.id)}</div><div class="ksb-description">${esc(c.wording)}</div></div>`).join('')}</div></section><section class="card stack"><h3>Touchscreen signature</h3><p class="muted">Sign below before downloading. The signature date is saved automatically.</p><div style="border:2px solid #cbd5d1;border-radius:14px;background:#fff;overflow:hidden;touch-action:none"><canvas id="signatureCanvas" width="900" height="280" style="display:block;width:100%;height:180px;touch-action:none"></canvas></div><div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="btn" type="button" onclick="clearSignature()">Clear signature</button>${signed}</div></section><button class="btn green full" style="margin-top:12px" ${pct(p)<100?'disabled':''} onclick="downloadPack(${i})">Download completed pack PDF</button></div>`;
    initSignatureCanvas(e.signature||'');
  };

  window.toggle6570Tag=function(id,tag,button){const e=state.evidence[id]||{photos:[],statement:'',signature:'',signedDate:'',tags:{}};e.tags=e.tags||{};e.tags[tag]=!e.tags[tag];state.evidence[id]=e;button.classList.toggle('on',!!e.tags[tag]);save();};

  const oldRenderHome=window.renderHome;
  window.renderHome=function(){
    if(!courseIs6570()) return oldRenderHome();
    const done=state.packs.filter(p=>pct(p)>=100).length,hours=state.otj.reduce((a,b)=>a+Number(b.hours||0),0),progress=state.packs.length?Math.round(done/state.packs.length*100):0;
    $('#app').innerHTML=`<div class="page"><section class="w6570-home-hero"><div class="w6570-eyebrow">Naxosv2 course</div><h1>6570-05<br>Level 3 NVQ Diploma in Trowel Occupations</h1><div class="w6570-course-progress"><i style="width:${progress}%"></i></div><div class="w6570-progress-row"><span>Evidence progress</span><strong>${progress}%</strong></div></section><section class="card"><h3>Evidence packs</h3><p class="muted">8 mandatory unit packs plus 1 selected optional unit pack, following the Naxosv2 6570-05 structure.</p><button class="btn primary full" onclick="go('packs')">Open evidence packs</button></section><section class="card"><h3>Off-the-job learning</h3><p class="muted">${hours.toFixed(1)} hours recorded.</p><button class="btn full" onclick="go('otj')">Open OTJ</button></section></div>`;
  };
})();