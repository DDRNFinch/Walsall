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

  function acCriteria(pack) {
    const unit = pack.unit;
    if (!unit || !Array.isArray(unit.learningOutcomes)) return [];
    return unit.learningOutcomes.flatMap(lo =>
      (lo.criteria || []).map(c => ({ lo: lo.id, ...c }))
    );
  }

  function acIds(pack) {
    if (Array.isArray(pack.linkedACs)) return unique(pack.linkedACs);
    if (Array.isArray(pack.assessmentCriteria)) return unique(pack.assessmentCriteria.map(x => typeof x === 'object' ? x.id : x));
    if (Array.isArray(pack.criteria)) return unique(pack.criteria.map(x => typeof x === 'object' ? x.id : x));
    return unique(acCriteria(pack).map(c => String(c.id)));
  }

  function addMappingPage(doc, pack, evidence) {
    const is6570 = state.profile.courseKey === '6570-05';
    const groups = ksbGroups(pack);
    const acs = is6570 ? acIds(pack) : [];
    if (!is6570 && !groups.Knowledge.length && !groups.Skills.length && !groups.Behaviours.length) return;
    if (is6570 && !acs.length) return;

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(is6570 ? 'ACS / Assessment Criteria' : 'KSBs', PDF.left, PDF.top + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(pack.title, PDF.left, PDF.top + 10);

    let y = PDF.top + 22;

    if (is6570) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Unit ${pack.unitId || ''}`, PDF.left, y);
      y += 8;

      const criteria = acCriteria(pack);
      const responses = evidence?.acsResponses || {};
      const completed = criteria.filter(c => String(responses[`${pack.unitId}.${c.id}`] || '').trim());

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      y = writeWrapped(
        doc,
        completed.length
          ? `${completed.length} of ${criteria.length} ACS response boxes completed. Only completed responses are included below.`
          : 'No optional ACS response boxes were completed.',
        PDF.left,
        y,
        PDF.width,
        4.5
      ) + 7;

      for (const c of completed) {
        const code = `${pack.unitId}.${c.id}`;
        const response = String(responses[code] || '').trim();

        if (y > PDF.bottom - 28) {
          footer(doc, doc.getNumberOfPages());
          doc.addPage();
          y = PDF.top + 8;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`Unit ${pack.unitId || ''} — ACS responses (continued)`, PDF.left, y);
          y += 8;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        y = writeWrapped(doc, code, PDF.left, y, PDF.width, 4.5) + 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        y = writeWrapped(doc, c.wording || '', PDF.left, y, PDF.width, 4.2) + 3;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('Learner response:', PDF.left, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        y = writeWrapped(doc, response, PDF.left, y, PDF.width, 4.2) + 7;
      }
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
    addMappingPage(doc, p, e);
    const safe = (p.title || 'evidence-pack').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    doc.save(`walsall-${safe}-${formatUKDate(e.signedDate || todayISO()).replaceAll('/', '-')}.pdf`);
  }

  window.downloadPack = directDownloadPack;
})();
