(() => {
  const existingDownloadPack = window.downloadPack;

  function unique(values) {
    return [...new Set((values || []).filter(Boolean).map(String))];
  }

  function groups(pack) {
    const mapped = unique(pack.primaryKSBs || []);
    return {
      Knowledge: mapped.filter(x => /^K\d+$/i.test(x)).map(x => x.replace(/^K/i, '')),
      Skills: mapped.filter(x => /^S\d+$/i.test(x)).map(x => x.replace(/^S/i, '')),
      Behaviours: mapped.filter(x => /^B\d+$/i.test(x)).map(x => x.replace(/^B/i, ''))
    };
  }

  function addKSBPage(doc, pack) {
    const g = groups(pack);
    if (!g.Knowledge.length && !g.Skills.length && !g.Behaviours.length) return;

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KSBs', PDF.left, PDF.top + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(pack.title || '', PDF.left, PDF.top + 10);

    let y = PDF.top + 22;
    for (const [label, values] of Object.entries(g)) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(label, PDF.left, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      y = writeWrapped(doc, values.length ? values.join(', ') : 'None linked', PDF.left, y, PDF.width, 4.5) + 6;
    }
    footer(doc, doc.getNumberOfPages());
  }

  window.downloadPack = async function(i) {
    if (state.profile.courseKey === '6570-05') {
      return existingDownloadPack(i);
    }

    const p = state.packs[i], e = state.evidence[p.id] || {};
    if (pct(p) < 100) { toast('Complete the photos and statement first'); return; }
    if (!e.signature) { toast('Please sign the touchscreen signature box before downloading'); return; }

    const photos = await Promise.all(p.capture.slice(0, 6).map((_, n) => photoGet(photoKey(p.id, n))));
    if (photos.length < 6 || photos.some(x => !x)) {
      toast('All 6 photos are required before downloading');
      return;
    }

    const doc = newPdf();
    drawPhotoPage(doc, p, photos);
    drawDetailsPage(doc, p, e);
    addKSBPage(doc, p);

    const safe = (p.title || 'evidence-pack').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    doc.save(`walsall-${safe}-${formatUKDate(e.signedDate || todayISO()).replaceAll('/', '-')}.pdf`);
  };
})();
