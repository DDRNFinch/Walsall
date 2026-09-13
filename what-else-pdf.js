(function(){
  function unique(a){return Array.from(new Set((a||[]).filter(Boolean).map(String)))}
  function hits(label){return Object.values(state.evidence||{}).reduce(function(n,e){return n+((e&&e.whatElseHits&&Array.isArray(e.whatElseHits[label]))?e.whatElseHits[label].length:0)},0)}
  function addPage(doc,p,e){if(state.profile.courseKey==='6570-05')return;var m=window.__naxosWhatElseMappings||{};var rows=Object.entries(m).filter(function(x){return x[0]!=='_course'});if(!rows.length)return;doc.addPage();doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('What Else Evidence',PDF.left,PDF.top+3);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(p.title,PDF.left,PDF.top+10);var y=PDF.top+22;rows.forEach(function(x){if(y>PDF.pageH-40){footer(doc,doc.getNumberOfPages());doc.addPage();y=PDF.top+8}var label=x[0],codes=x[1]||[],current=e.whatElseHits&&Array.isArray(e.whatElseHits[label])?e.whatElseHits[label].length:0;doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(label+' - '+hits(label)+'x evidenced'+(current?' - this pack':'') ,PDF.left,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(8);y=writeWrapped(doc,'Naxosv2 mapping: '+unique(codes).join(', '),PDF.left,y,PDF.width,4)+6});footer(doc,doc.getNumberOfPages())}
  var old=window.downloadPack;
  window.downloadPack=async function(i){
    var p=state.packs[i],e=state.evidence[p.id]||{};
    if(state.profile.courseKey==='6570-05')return old(i);
    var mappings=await fetch(NAXOS+'data/standards/'+encodeURIComponent(state.profile.courseKey||'ST0095')+'/main-packs.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){return j.whatElseMappings||{}});
    window.__naxosWhatElseMappings=mappings;
    var before=window.jspdf;
    await old(i);
  };
})();