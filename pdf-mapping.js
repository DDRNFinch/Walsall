(() => {
  function unique(values) {
    return [...new Set((values || []).filter(Boolean).map(String))];
  }

  function ksbGroups(pack) {
    const mapped = unique(pack.primaryKSBs || []);
    return {
      Knowledge: unique(mapped.filter(x => /^K\d+$/i.test(x)).map(x => x.replace(/^K/i, ''))),
      Skills: unique(mapped.filter(x => /^S\d+$/i.test(x)).map(x => x.replace(/^S/i, ''))),
      Behaviours: unique(mapped.filter(x => /^B\d+$/i.test(x)).map(x => x.replace(/^B/i, '')))
    };
  }

  function acIds(pack) {
    if (Array.isArray(pack.linkedACs)) return unique(pack.linkedACs);
    if (Array.isArray(pack.assessmentCriteria)) return unique(pack.assessmentCriteria.map(x => typeof x === 'object' ? x.id : x));
    if (Array.isArray(pack.criteria)) return unique(pack.criteria.map(x => typeof x === 'object' ? x.id : x));
    const unit = pack.unit;
    if (!unit || !Array.isArray(unit.learningOutcomes)) return [];
    return unique(unit.learningOutcomes.flatMap(lo => (lo.criteria || []).map(c => String(c.id))));
  }

  function addMappingPage(doc, pack) {
    const is6570 = state.profile.courseKey === '6570-05';
    const groups = ksbGroups(pack);
    const acs = is6570 ? acIds(pack) : [];
    if (!is6570 && !groups.Knowledge.length && !groups.Skills.length && !groups.Behaviours.length) return;
    if (is6570 && !acs.length) return;

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(is6570 ? 'Acs' : 'KSBs', PDF.left, PDF.top + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(pack.title, PDF.left, PDF.top + 10);

    let y = PDF.top + 22;
    if (is6570) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Unit ${pack.unitId || ''}`, PDF.left, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      writeWrapped(doc, acs.join(', '), PDF.left, y, PDF.width, 4.5);
    } else {
      const line = (label, values) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(label, PDF.left, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        y = writeWrapped(doc, values.length ? values.join(', ') : 'None linked', PDF.left, y, PDF.width, 4.5) + 5;
      };
      line('Knowledge', groups.Knowledge);
      line('Skills', groups.Skills);
      line('Behaviours', groups.Behaviours);
    }
    footer(doc, doc.getNumberOfPages());
  }

  async function directDownloadPack(i) {
    const p = state.packs[i];
    const e = state.evidence[p.id] || {};
    if (pct(p) < 100) { toast('Complete the photos and statement first'); return; }
    if (!e.signature) { toast('Please sign the touchscreen signature box before downloading'); return; }

    const photos = await Promise.all((p.capture || []).slice(0, 6).map((_, n) => photoGet(photoKey(p.id, n))));
    const required = state.profile.courseKey === '6570-05' ? Math.min((p.capture || []).length, 6) : 6;
    if (photos.length < required || photos.slice(0, required).some(x => !x)) {
      toast(`All ${required} photos are required before downloading`);
      return;
    }

    const doc = newPdf();
    drawPhotoPage(doc, p, photos);
    drawDetailsPage(doc, p, e);
    addMappingPage(doc, p);
    const safe = (p.title || 'evidence-pack').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    doc.save(`walsall-${safe}-${formatUKDate(e.signedDate || todayISO()).replaceAll('/', '-')}.pdf`);
  }

  // The original downloadPack is a lexical function inside app.js. Replacing
  // the global function directly is the reliable way to make the PDF use the
  // mapping-aware export without changing the existing evidence workflow.
  window.downloadPack = directDownloadPack;
})();
