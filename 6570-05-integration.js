(() => {
  const originalLoadCourse = window.loadCourse;
  const originalRenderPacks = window.renderPacks;
  const originalOpenPack = window.openPack;

  const PACKS = [
    ['Set out masonry','Solid/cavity set-out, openings, profiles, line, level and dimensions',['Set-out drawing','Profiles and datum','Line and level','Dimensions','Opening positions','Finished set-out']],
    ['Build cavity walling','Brick/block walling, returns, openings, bond and wall ties',['Preparation','Brick/block work','Returns and corners','Openings','Wall ties','Finished wall']],
    ['Install cavity details','Insulation, DPC, trays, weeps, fire stopping and closures',['Insulation','DPC','Cavity trays','Weep holes','Fire stopping','Closures']],
    ['Form openings & lintels','Opening dimensions, lintels, bearing and feature courses',['Opening set-out','Dimensions','Lintel position','Bearing','Feature course','Finished opening']],
    ['Build solid walling','Solid walls, bonds, capping and quality checks',['Preparation','Bond and gauge','Line and level','Capping','Joint finish','Quality check']],
    ['Build piers & decorative walling','Piers, projecting brickwork, contrasting and banding',['Set-out','Foundation/base','Pier construction','Projection','Banding/detail','Finished work']],
    ['Build raking or gable walling','Rake set-out, cutting, construction and finish',['Rake set-out','Cutting plan','First course','Raking work','Cuts and joints','Finished gable']],
    ['Mix mortar','Gauging, ratios, hand/mechanical/silo mixing',['Materials','Mix ratio','Gauging','Mixing method','Consistency','Safe storage']],
    ['Cut bricks & blocks','Measure, mark, hand cut and power cut where appropriate',['Measure','Mark out','Select method','Hand cut','Power cut','Check finished cut']],
    ['Apply joint finishes','Half-round, flush, weather-struck and recessed',['Prepare joints','Flush','Recessed','Weather-struck','Half-round','Final finish']],
    ['Repair brickwork','Identify defect, remove, replace and match',['Identify defect','Protect area','Remove damaged work','Prepare replacement','Match existing','Finished repair']],
    ['Complete & protect masonry','Final checks, protection, waste and finished condition',['Final inspection','Clean down','Protect work','Waste management','Snagging','Finished condition']]
  ];

  const makePacks = () => PACKS.map((p, i) => ({
    id: `6570-05-${String(i + 1).padStart(2, '0')}`,
    title: p[0],
    summary: p[1],
    capture: p[2],
    primaryKSBs: [],
    course: '6570-05'
  }));

  window.loadCourse = async function(key) {
    if (key !== '6570-05') {
      await originalLoadCourse(key);
      state.courses['6570-05'] = { title: '6570-05 · Level 3 Trowel Occupations', type: 'local-integrated' };
      return;
    }
    const packs = makePacks();
    state.course = {
      key: '6570-05',
      config: { title: '6570-05 · Level 3 Trowel Occupations', type: 'local-integrated' },
      metadata: { packs }
    };
    state.packs = packs;
    state.profile.courseKey = '6570-05';
    state.courses = state.courses || {};
    state.courses['6570-05'] = state.course.config;
    save();
    const label = document.getElementById('courseLabel');
    if (label) label.textContent = '6570-05 · 12 packs';
  };

  function courseIs6570() { return state.profile.courseKey === '6570-05'; }

  window.renderPacks = function() {
    if (!courseIs6570()) return originalRenderPacks();
    const html = state.packs.map((p, i) => `
      <div class="card pack w6570-pack" onclick="openPack(${i})">
        <div class="w6570-pack-top"><span class="w6570-num">${String(i + 1).padStart(2, '0')}</span><span class="w6570-pill">${status(p)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p class="muted">${esc(p.summary)}</p>
        <div class="progress"><i style="width:${pct(p)}%"></i></div>
        <div class="w6570-pack-foot"><span>${pct(p)}% complete</span><span>Open →</span></div>
      </div>`).join('');
    $('#app').innerHTML = `<div class="page">
      <section class="w6570-course-head"><div class="w6570-eyebrow">Course</div><h1>6570-05</h1><p>Level 3 Trowel Occupations</p><div class="w6570-course-progress"><i style="width:${state.packs.length ? Math.round(state.packs.filter(p => pct(p) >= 100).length / state.packs.length * 100) : 0}%"></i></div></section>
      <div class="w6570-section-title"><div><h2>Evidence packs</h2><p>Follow each natural task, capture evidence and complete the pack.</p></div><span class="w6570-pill">${state.packs.filter(p => pct(p) >= 100).length}/${state.packs.length}</span></div>
      <div class="stack">${html}</div>
    </div>`;
  };

  window.openPack = async function(i) {
    if (!courseIs6570()) return originalOpenPack(i);
    state.currentPack = i;
    save();
    const p = state.packs[i];
    const e = state.evidence[p.id] || { photos: [], statement: '', signature: '', signedDate: '', confidence: 0 };
    const photos = await Promise.all(p.capture.map((_, n) => photoGet(photoKey(p.id, n)).catch(() => null)));
    const selected = e.tags || {};
    const signed = e.signature ? `<span class="status">Signed ${esc(e.signedDate || '')}</span>` : '';
    const tags = ['PPE','RAMS','Drawings','Materials','Tools','Quality','Waste','Teamwork'];

    $('#app').innerHTML = `<div class="page">
      <button class="btn" onclick="go('packs')">← Evidence packs</button>
      <section class="w6570-hero"><div class="w6570-eyebrow">Pack ${i + 1} of ${state.packs.length}</div><h1>${esc(p.title)}</h1><p>${esc(p.summary)}</p></section>
      <section class="card"><h3>What to capture</h3><ul class="checklist w6570-list"><li>Show the work before, during and after the task where useful.</li><li>Include safe working, preparation and the finished result.</li><li>Make sure the evidence clearly shows your own work.</li></ul></section>
      <section class="card stack"><div class="w6570-step"><span>1</span><div><h3>Take your photos</h3><p class="muted">Use clear, relevant photos. Add more where the task needs it.</p></div></div><div class="photo-grid w6570-photo-grid">${p.capture.map((prompt, n) => photoBox(p.id, n, prompt, photos[n])).join('')}</div></section>
      <section class="card stack"><div class="w6570-step"><span>2</span><div><h3>What else is shown?</h3><p class="muted">Select anything relevant to the evidence.</p></div></div><div class="tags w6570-tags">${tags.map(x => `<button type="button" class="tag ${selected[x] ? 'on' : ''}" onclick="toggle6570Tag('${p.id}','${x}',this)">${x}</button>`).join('')}</div></section>
      <section class="card stack"><div class="w6570-step"><span>3</span><div><h3>Explain your work</h3><p class="muted">Describe what you did, how you did it and how you checked the finished work. Minimum 100 words.</p></div></div><textarea id="statement" placeholder="Write your statement here…" oninput="saveStatement('${p.id}',this.value)">${esc(e.statement || '')}</textarea><div class="status"><span id="wordCount">${wordCount(e.statement || '')}</span> words · minimum 100</div></section>
      <section class="card stack"><div class="w6570-step"><span>4</span><div><h3>Knowledge & evidence</h3><p class="muted">Review the knowledge and behaviours demonstrated by this natural task.</p></div></div><div class="tags w6570-tags"><span class="tag on">Knowledge</span><span class="tag on">Behaviour</span><span class="tag">Skills</span></div></section>
      <section class="card stack"><div class="w6570-step"><span>5</span><div><h3>Review & complete</h3><p class="muted">Check your evidence and sign before downloading the completed pack.</p></div></div><label class="w6570-confidence">Confidence<select id="confidence6570" class="input"><option value="1">1 — Not confident</option><option value="2">2</option><option value="3">3 — Getting there</option><option value="4">4</option><option value="5">5 — Confident</option></select></label></section>
      <section class="card stack"><h3>Touchscreen signature</h3><p class="muted">Sign below before downloading. The signature date is saved automatically.</p><div style="border:2px solid #cbd5d1;border-radius:14px;background:#fff;overflow:hidden;touch-action:none"><canvas id="signatureCanvas" width="900" height="280" style="display:block;width:100%;height:180px;touch-action:none"></canvas></div><div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="btn" type="button" onclick="clearSignature()">Clear signature</button>${signed}</div></section>
      <button class="btn green full" style="margin-top:12px" ${pct(p) < 100 ? 'disabled' : ''} onclick="downloadPack(${i})">Download completed pack PDF</button>
    </div>`;
    const confidence = document.getElementById('confidence6570');
    if (confidence) { confidence.value = String(e.confidence || 5); confidence.onchange = () => { e.confidence = Number(confidence.value); state.evidence[p.id] = e; save(); }; }
    initSignatureCanvas(e.signature || '');
  };

  window.toggle6570Tag = function(id, tag, button) {
    const e = state.evidence[id] || { photos: [], statement: '', signature: '', signedDate: '', tags: {} };
    e.tags = e.tags || {};
    e.tags[tag] = !e.tags[tag];
    state.evidence[id] = e;
    button.classList.toggle('on', !!e.tags[tag]);
    save();
  };

  const oldRenderHome = window.renderHome;
  window.renderHome = function() {
    if (!courseIs6570()) return oldRenderHome();
    const done = state.packs.filter(p => pct(p) >= 100).length;
    const hours = state.otj.reduce((a, b) => a + Number(b.hours || 0), 0);
    const progress = state.packs.length ? Math.round(done / state.packs.length * 100) : 0;
    $('#app').innerHTML = `<div class="page"><section class="w6570-home-hero"><div class="w6570-eyebrow">Course</div><h1>6570-05<br>Level 3 Trowel Occupations</h1><div class="w6570-course-progress"><i style="width:${progress}%"></i></div><div class="w6570-progress-row"><span>Evidence progress</span><strong>${progress}%</strong></div></section><section class="card w6570-confidence-card"><div class="w6570-score">${progress}%</div><div><h3>Evidence progress</h3><p class="muted">${done} of ${state.packs.length} evidence packs complete.</p></div></section><section class="card"><div class="w6570-section-title"><div><h3>Evidence packs</h3><p>Follow each natural task, capture evidence and complete the pack.</p></div><span class="w6570-pill">${done}/${state.packs.length}</span></div><button class="btn primary full" onclick="go('packs')">Open evidence packs</button></section><section class="card"><h3>Off-the-job learning</h3><p class="muted">Record your hours and keep your learning evidence together.</p><button class="btn full" onclick="go('otj')">Open OTJ · ${hours.toFixed(1)} hours</button></section></div>`;
  };
})();