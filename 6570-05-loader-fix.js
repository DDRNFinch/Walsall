(() => {
  const NAXOS='https://raw.githubusercontent.com/DDRNFinch/Naxosv2/main/data/6570-05/';
  const FILES=['source/course-core.js','source/unit-102.js','source/units-234-235.js','source/unit-238.js','source/units-303-300-502.js','source/unit-313.js','source/unit-690.js','source/unit-701.js','source/unit-828.js','source/unit-837.js','normalise.js'];
  let ready;
  const guidance={
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
  };
  async function load(){
    if(ready)return ready;
    ready=(async()=>{
      window.NVQPLUS_COURSE_DATA=null; window.NAXOS_6570_05=null;
      for(const file of FILES){const r=await fetch(NAXOS+file+'?walsall-fix=1',{cache:'no-store'});if(!r.ok)throw new Error('Naxos source request failed: '+file);const text=await r.text();(0,eval)(text);}
      if(!window.NAXOS_6570_05?.units?.length)throw new Error('Naxosv2 6570-05 data normalised with no units');
      return window.NAXOS_6570_05;
    })();
    return ready;
  }
  const old=window.loadCourse;
  window.loadCourse=async function(key){
    if(key!=='6570-05')return old(key);
    const data=await load();
    const ids=['102','234','235','303','300','313','502','701',state.profile.optional6570||'238'];
    const packs=ids.map(id=>{const u=data.units.find(x=>String(x.id)===id);if(!u)return null;const optional=!['102','234','235','303','300','313','502','701'].includes(id);return {id:'6570-05-unit-'+id,title:'Unit '+id+' — '+u.title,summary:(optional?'Optional unit':'Mandatory unit')+' · Level '+u.level+' · Portfolio evidence',capture:guidance[id]||[],primaryKSBs:[],course:'6570-05',unitId:id,optional,unit:u};}).filter(Boolean);
    state.course={key:'6570-05',config:{title:data.course.title,type:'nvq-unit-packs'},metadata:{packs,source:'Naxosv2'}};state.packs=packs;state.profile.courseKey='6570-05';state.courses=state.courses||{};state.courses['6570-05']=state.course.config;save();
    const label=document.getElementById('courseLabel');if(label)label.textContent='6570-05 · Trowel Occupations · 9 packs';
  };
})();