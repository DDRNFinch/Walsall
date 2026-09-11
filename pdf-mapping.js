(() => {
  const originalDrawDetailsPage = window.drawDetailsPage;
  if (typeof originalDrawDetailsPage !== 'function') return;

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
    const unit = pack.unit;
    if (!unit || !Array.isArray(unit.learningOutcomes)) return [];
    return unique(unit.learningOutcomes.flatMap(lo => (lo.criteria || []).map(c => String(c.id))));
  }

  function addLine(doc, label, values, x, y, width) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    const text = values.length ? values.join(', ') : 'None linked';
    return writeWrapped(doc, text, x + 34, y, width - 34, 4.2) + 1;
  }

  function addMappingPage(doc, pack) {
    const is6570 = state.profile.courseKey === '6570-05';
    const groups = ksbGroups(pack);
    const acs = is6570 ? acIds(pack) : [];

    // Do not add an empty mapping page.
    if (!is6570 && !groups.Knowledge.length && !groups.Skills.length && !groups.Behaviours.length) return;
    if (is6570 && !acs.length) return;

    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(is6570 ? 'Assessment Criteria' : 'KSBs', PDF.left, PDF.top + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(pack.title, PDF.left, PDF.top + 10);

    let y = PDF.top + 20;
    if (is6570) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Acs', PDF.left, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Unit ${pack.unitId}`, PDF.left, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      y = writeWrapped(doc, acs.join(', '), PDF.left, y, PDF.width, 4.5);
    } else {
      y = addLine(doc, 'Knowledge', groups.Knowledge, PDF.left, y, PDF.width);
      y += 5;
      y = addLine(doc, 'Skills', groups.Skills, PDF.left, y, PDF.width);
      y += 5;
      y = addLine(doc, 'Behaviours', groups.Behaviours, PDF.left, y, PDF.width);
    }

    footer(doc, doc.getNumberOfPages());
  }

  window.drawDetailsPage = function(doc, pack, evidence) {
    originalDrawDetailsPage(doc, pack, evidence);
    addMappingPage(doc, pack);
  };
})();
