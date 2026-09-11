(() => {
  const originalDownloadPack = window.downloadPack;

  function acCriteria(pack) {
    const unit = pack && pack.unit;
    if (!unit || !Array.isArray(unit.learningOutcomes)) return [];
    return unit.learningOutcomes.flatMap(lo => (lo.criteria || []).map(c => ({
      code: `${pack.unitId}.${c.id}`,
      wording: String(c.wording || '')
    })));
  }

  function draw6570PhotoPage(doc, p, photos) {
    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.text('Evidence Pack', PDF.left, PDF.top + 3);
    doc.setFont('helvetica','normal');
    doc.setFontSize(11);
    doc.text(p.title, PDF.left, PDF.top + 10);
    doc.setFontSize(8);
    doc.text(`Learner: ${state.profile.name || 'Not entered'}   Course: ${state.profile.courseKey}   Date: ${nowUK()}`, PDF.left, PDF.top + 16);
    const count = p.capture.length;
    const cols = 2;
    const rows = Math.ceil(count / cols);
    const gap = 4;
    const gridTop = PDF.top + 22;
    const gridBottom = PDF.pageH - PDF.bottom - 8;
    const cellW = (PDF.width - gap) / cols;
    const cellH = (gridBottom - gridTop - gap * (rows - 1)) / rows;
    for (let n = 0; n < count; n++) {
      const col = n % cols, row = Math.floor(n / cols);
      const x = PDF.left + col * (cellW + gap);
      const y = gridTop + row * (cellH + gap);
      doc.setDrawColor(190);
      doc.rect(x, y, cellW, cellH);
      if (photos[n]) addImageFit(doc, photos[n], x + 1, y + 1, cellW - 2, cellH - 2);
      doc.setFont('helvetica','bold');
      doc.setFontSize(7);
      doc.text(`${n + 1}. ${String(p.capture[n] || 'Photo').slice(0, 55)}`, x + 2, y + cellH - 3);
    }
  }

  function addACSResponsesPage(doc, p, e) {
    const completed = acCriteria(p).filter(c => String(e.acsResponses?.[c.code] || '').trim());
    if (!completed.length) return;

    doc.addPage();
    const L = PDF.left, W = PDF.width;
    let y = PDF.top + 3;
    const bottom = PDF.pageH - PDF.bottom - 5;

    const header = () => {
      doc.setFont('helvetica','bold');
      doc.setFontSize(16);
      doc.text('ACS Responses', L, y);
      y += 8;
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      y = writeWrapped(doc, `${p.title} · Unit ${p.unitId} · Learner: ${state.profile.name || 'Not entered'}`, L, y, W, 3.5);
      y += 5;
    };

    header();

    for (const item of completed) {
      const response = String(e.acsResponses[item.code]).trim();
      const wordingLines = doc.splitTextToSize(item.wording, W);
      const responseLines = doc.splitTextToSize(response, W);
      const needed = 8 + wordingLines.length * 3.8 + 5 + responseLines.length * 3.8 + 8;

      if (y + needed > bottom) {
        footer(doc, doc.getNumberOfPages());
        doc.addPage();
        y = PDF.top + 3;
        header();
      }

      doc.setFont('helvetica','bold');
      doc.setFontSize(10);
      doc.text(item.code, L, y);
      y += 5;
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      y = writeWrapped(doc, item.wording, L, y, W, 3.8);
      y += 3;
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      doc.text('Learner response', L, y);
      y += 4;
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      y = writeWrapped(doc, response, L, y, W, 3.8);
      y += 7;
    }

    footer(doc, doc.getNumberOfPages());
  }

  async function download6570(i) {
    const p = state.packs[i], e = state.evidence[p.id] || {};
    if (pct(p) < 100) { toast('Complete the photos and statement first'); return; }
    if (!e.signature) { toast('Please sign the touchscreen signature box before downloading'); return; }

    const required = p.capture.length;
    const photos = await Promise.all(p.capture.map((_, n) => photoGet(photoKey(p.id, n)).catch(() => null)));
    if (photos.length < required || photos.some(x => !x)) {
      toast(`All ${required} photos are required before downloading`);
      return;
    }

    const doc = newPdf();
    draw6570PhotoPage(doc, p, photos);

    doc.addPage();
    const L = PDF.left, W = PDF.width;
    let y = PDF.top + 3;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('Evidence Details', L, y); y += 9;
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    y = writeWrapped(doc, `Learner: ${state.profile.name || 'Not entered'} | Course: ${state.profile.courseKey} | Pack: ${p.title}`, L, y, W, 3.5);
    y += 3;
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('Photo details', L, y); y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    p.capture.forEach((x, n) => { y = writeWrapped(doc, `${n + 1}. ${x}`, L, y, W, 3.2); y += 1; });
    y += 2;
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('Learner statement', L, y); y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    y = writeWrapped(doc, e.statement || '', L, y, W, 3.2);
    y += 5;

    const acs = acCriteria(p);
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('ACS', L, y); y += 6;
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(`Unit ${p.unitId}`, L, y); y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    y = writeWrapped(doc, acs.map(c => c.code).join(', '), L, y, W, 4);
    y += 6;

    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('Learner signature', L, y); y += 4;
    if (e.signature) doc.addImage(e.signature, 'PNG', L, y, 55, 17);
    y += 20;
    doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text(`Signed electronically on ${e.signedDate || nowUK()}`, L, y);
    footer(doc, doc.getNumberOfPages());

    addACSResponsesPage(doc, p, e);

    const safe = (p.title || 'evidence-pack').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
    doc.save(`walsall-${safe}-${formatUKDate(e.signedDate || todayISO()).replaceAll('/','-')}.pdf`);
  }

  window.downloadPack = function(i) {
    if (state.profile.courseKey === '6570-05') return download6570(i);
    return originalDownloadPack(i);
  };
})();
