(() => {
  const originalOpenPack = window.openPack;

  function saveACS(id, code, value) {
    state.evidence[id] = state.evidence[id] || { photos: [], statement: '', signature: '', signedDate: '', tags: {} };
    state.evidence[id].acsResponses = state.evidence[id].acsResponses || {};
    state.evidence[id].acsResponses[code] = value;
    save();
  }

  function addACSBoxes(p, e) {
    const unit = p.unit;
    const criteria = (unit?.learningOutcomes || []).flatMap(lo =>
      (lo.criteria || []).map(c => ({ lo: lo.id, ...c }))
    );
    if (!criteria.length) return;

    const cards = [...document.querySelectorAll('.card')];
    const card = cards.find(x => x.querySelector('h3')?.textContent.trim() === 'Unit criteria');
    if (!card) return;

    const list = criteria.map(c => {
      const code = `${p.unitId}.${c.id}`;
      const value = e.acsResponses?.[code] || '';
      return `<div class="ksb-box acs-box">
        <div class="ksb-code">${esc(code)}</div>
        <div class="ksb-description">${esc(c.wording || '')}</div>
        <textarea class="ksb-response acs-response" placeholder="Optional: add notes, explain what you did, or record supporting evidence…" oninput="saveACS('${p.id}','${code}',this.value)">${esc(value)}</textarea>
      </div>`;
    }).join('');

    card.innerHTML = `<div class="w6570-step"><span>4</span><div><h3>Unit criteria</h3><p class="muted">Review the official assessment criteria for this unit. The text boxes are optional and are saved automatically.</p></div></div><div class="ksb-list">${list}</div>`;
  }

  window.saveACS = saveACS;

  window.openPack = async function(i) {
    if (state.profile.courseKey !== '6570-05') return originalOpenPack(i);
    await originalOpenPack(i);
    const p = state.packs[i];
    const e = state.evidence[p.id] || {};
    addACSBoxes(p, e);
  };
})();
