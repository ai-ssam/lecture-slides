'use strict';
/* ===================== 유틸/상수 ===================== */
const W=1280,IS_AUD=location.hash==='#aud';let H=720;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const FONT='"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR","Segoe UI",sans-serif';
const mctx=document.createElement('canvas').getContext('2d');
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);}
function modal(html,cls){closeModal();const b=document.createElement('div');b.className='mback';b.innerHTML='<div class="modal '+(cls||'')+'">'+html+'</div>';$('#modals').appendChild(b);b.addEventListener('pointerdown',e=>{if(e.target===b&&!b.dataset.sticky)closeModal();});return b.firstChild;}
function closeModal(){$('#modals').innerHTML='';}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
const readFileText=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(f);});
const readFileURL=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});

/* ===================== 기본 스타일/즐겨찾기 ===================== */
const DEF={
  rect:{stroke:'#E23B2E',sw:4,fill:'#E23B2E',fillA:0,dash:0,radius:0},
  ellipse:{stroke:'#E23B2E',sw:4,fill:'#E23B2E',fillA:0,dash:0},
  arrow:{stroke:'#2563EB',sw:5,head:1,dash:0},
  line:{stroke:'#2563EB',sw:5,dash:0},
  img:{bw:0,bc:'#111111',radius:0,shadow:0,opacity:1,flip:0},
  num:{shape:'circle',fill:'#E23B2E',stroke:'#FFFFFF',sw:3,color:'#FFFFFF',size:44},
  text:{color:'#1C2026',size:28,bg:'#FFE066',bgA:0.9,bold:1,italic:0,underline:0,strike:0,align:'left',lh:1.25,font:'sans',outline:0,outlineC:'#FFFFFF',shadow:0},
  mosaic:{shape:'rect',mode:'pixel',strength:14,color:'#000000'},
  pen:{stroke:'#E23B2E',sw:5,alpha:1}
};
const KIND_NAME={rect:'사각형',ellipse:'원',arrow:'화살표',line:'직선',img:'이미지',num:'번호',text:'글자',mosaic:'모자이크',pen:'펜'};
const DASH=[[0,'실선'],[1,'점선'],[2,'짧은 점선']];
const FIELDS={
  rect:[['stroke','선 색','color'],['sw','선 굵기','range',0,24,1],['fill','채움 색','color'],['fillA','채움 농도(0=투명)','range',0,1,.05],['radius','모서리 둥글기','range',0,60,1],['dash','선 모양','select',DASH]],
  ellipse:[['stroke','선 색','color'],['sw','선 굵기','range',0,24,1],['fill','채움 색','color'],['fillA','채움 농도(0=투명)','range',0,1,.05],['dash','선 모양','select',DASH]],
  line:[['stroke','색','color'],['sw','굵기','range',1,24,1],['dash','선 모양','select',DASH]],
  img:[['bw','테두리 굵기','range',0,24,1],['bc','테두리 색','color'],['radius','모서리 둥글기','range',0,200,1],['shadow','그림자','check'],['opacity','투명도(1=불투명)','range',.1,1,.05],['flip','좌우 반전','check']],
  arrow:[['stroke','색','color'],['sw','굵기','range',1,24,1],['head','화살촉','select',[[1,'한쪽'],[2,'양쪽'],[0,'없음']]],['dash','선 모양','select',DASH]],
  num:[['shape','모양','select',[['circle','원'],['square','사각'],['round','둥근 사각']]],['fill','채움 색','color'],['color','숫자 색','color'],['stroke','테두리 색','color'],['sw','테두리 굵기','range',0,10,1],['size','크기','range',20,120,1]],
  text:[['color','글자 색','color'],['size','글자 크기','range',12,120,1],['font','글꼴','select',[['sans','고딕'],['serif','명조'],['mono','고정폭']]],['bold','굵게','check'],['italic','기울임','check'],['underline','밑줄','check'],['strike','취소선','check'],['align','정렬','select',[['left','왼쪽'],['center','가운데'],['right','오른쪽']]],['lh','줄 간격','range',1,2.4,.05],['bg','배경 색','color'],['bgA','배경 농도','range',0,1,.05],['outline','외곽선 굵기','range',0,10,.5],['outlineC','외곽선 색','color'],['shadow','그림자','check']],
  mosaic:[['shape','모양','select',[['rect','사각형'],['ellipse','원'],['free','자유 영역']]],['mode','종류','select',[['pixel','모자이크'],['blur','흐리게(블러)'],['solid','단색 가림']]],['strength','강도','range',4,60,1],['color','단색 가림 색','color']],
  pen:[['stroke','색','color'],['sw','굵기','range',1,60,1],['alpha','투명도(1=불투명)','range',.1,1,.05]]
};
const NUMERIC_SELECT=new Set(['dash','head']);
function defPresets(){
  return [
    {name:'빨간 박스',kind:'rect',style:{...DEF.rect}},
    {name:'파란 박스',kind:'rect',style:{...DEF.rect,stroke:'#2563EB',fill:'#2563EB'}},
    {name:'노란 형광',kind:'rect',style:{...DEF.rect,stroke:'#FFE066',sw:0,fill:'#FFE066',fillA:.5,radius:2}},
    {name:'빨간 원',kind:'ellipse',style:{...DEF.ellipse}},
    {name:'번호 ●',kind:'num',style:{...DEF.num}},
    {name:'번호 ■',kind:'num',style:{...DEF.num,shape:'square',fill:'#2563EB'}},
    {name:'파란 화살표',kind:'arrow',style:{...DEF.arrow}},
    {name:'모자이크',kind:'mosaic',style:{...DEF.mosaic}},
    {name:'라벨 글자',kind:'text',style:{...DEF.text}}
  ].map(p=>({id:uid(),...p}));
}
function loadPresets(){try{const v=JSON.parse(localStorage.getItem('ls.presets')||'null');if(Array.isArray(v)&&v.length)return v;}catch(e){}return null;}
function savePresets(){try{localStorage.setItem('ls.presets',JSON.stringify(P.presets));}catch(e){}}

/* ===================== 프로젝트 상태 ===================== */
function blankSlide(){return {id:uid(),type:'blank',bg:'#FFFFFF',objects:[],notes:''};}
function newProject(){return {title:'제목 없는 강의',ratio:'16:9',slides:[blankSlide()],masters:[],assets:{},htmls:{},presets:loadPresets()||defPresets()};}
let P=IS_AUD?{assets:{},htmls:{},slides:[],masters:[],presets:[]}:newProject();
let cur=0,tool='select',sel=null,nextNum=1,dirty=false,fileHandle=null,undo=[],redo=[],lastSnap=0,editText=false,draft=null,drag=null,clipObj=null,pasteMode='new',editMaster=null;
const lsGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}},lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
const RECT_VAR={sq:{radius:0,stroke:'#E23B2E',sw:4,fill:'#E23B2E',fillA:0},round:{radius:24,stroke:'#E23B2E',sw:4,fill:'#E23B2E',fillA:0},hl:{stroke:'#FFE066',sw:0,fill:'#FFE066',fillA:.5,radius:2}},VAR_NAME={sq:'직사각',round:'둥근사각',hl:'형광'};let toolVar='sq',cropId=null;
const LAY_DEF={lw:182,rw:272,lc:0,rc:0};let layout=Object.assign({},LAY_DEF);try{Object.assign(layout,JSON.parse(lsGet('ls.layout')||'{}'));}catch(e){}
function saveLayout(){lsSet('ls.layout',JSON.stringify(layout));}
function applyLayout(){
  const mx=Math.max(240,innerWidth-420);layout.lw=clamp(+layout.lw||182,110,Math.min(420,mx-layout.rw*(layout.rc?0:1)));layout.rw=clamp(+layout.rw||272,220,Math.min(520,mx-layout.lw*(layout.lc?0:1)));
  const rs=document.documentElement.style,tw=layout.lw-30;
  rs.setProperty('--lw',(layout.lc?0:layout.lw)+'px');rs.setProperty('--rw',(layout.rc?0:layout.rw)+'px');
  rs.setProperty('--tw',tw+'px');rs.setProperty('--ts',(tw/W)+'');rs.setProperty('--thH',(tw*H/W)+'px');
  document.body.classList.toggle('lc',!!layout.lc);document.body.classList.toggle('rc',!!layout.rc);
  const a=$('#bTL'),b=$('#bTR');if(a)a.classList.toggle('on',!layout.lc);if(b)b.classList.toggle('on',!layout.rc);
  document.querySelectorAll('#thumbs .sz button').forEach(x=>x.classList.toggle('on',+x.dataset.w===layout.lw));
}
function togglePanel(side){layout[side]=layout[side]?0:1;saveLayout();applyLayout();}
function setThumbSize(w){layout.lw=w;layout.lc=0;saveLayout();applyLayout();}
function initResizers(){
  for(const [id,side] of [['#rzL','lw'],['#rzR','rw']]){
    const r=$(id);
    r.addEventListener('pointerdown',e=>{e.preventDefault();r.setPointerCapture(e.pointerId);r.classList.add('drag');document.body.style.userSelect='none';});
    r.addEventListener('pointermove',e=>{if(!r.classList.contains('drag'))return;layout[side]=side==='lw'?e.clientX:innerWidth-e.clientX;applyLayout();});
    const end=()=>{if(!r.classList.contains('drag'))return;r.classList.remove('drag');document.body.style.userSelect='';saveLayout();};
    r.addEventListener('pointerup',end);r.addEventListener('pointercancel',end);
    r.addEventListener('dblclick',()=>{layout[side]=LAY_DEF[side];saveLayout();applyLayout();});
  }
  addEventListener('resize',applyLayout);
}
const view={s:1,z:1,px:0,py:0};let activeFav=-1,msel=[],marq=null,guides=[],spaceDown=false,styleClip=null;let snapOn=lsGet('ls.snap')!=='0',autoRenum=lsGet('ls.renum')!=='0';
const TOOL_NAME={select:'선택',rect:'사각형',ellipse:'원',line:'직선',arrow:'화살표',num:'번호',text:'글자',mosaic:'모자이크',pen:'펜'};
const ST=clone(DEF);
const curSlide=()=>editMaster?((P.masters||[]).find(m=>m.id===editMaster)||P.slides[cur]):P.slides[cur];
const findObj=id=>curSlide().objects.find(o=>o.id===id);
const kindOf=o=>o?o.t:null;

function cloneObj(o){const c={...o};if(o.pts)c.pts=o.pts.map(p=>p.slice());return c;}
function snapState(){return {cur,masters:(P.masters||[]).map(m=>({...m,objects:m.objects.map(cloneObj)})),slides:P.slides.map(s=>({...s,objects:s.objects.map(cloneObj),textEdits:s.textEdits?{...s.textEdits}:undefined}))};}
function snap(){undo.push(snapState());if(undo.length>60)undo.shift();redo=[];lastSnap=Date.now();markDirty();}
function restore(st){P.slides=st.slides;if(st.masters)P.masters=st.masters;cur=clamp(st.cur,0,P.slides.length-1);sel=null;msel=[];draft=null;cropId=null;if(editMaster&&!P.masters.some(m=>m.id===editMaster)){editMaster=null;document.body.classList.remove('mm');$('#mbar').hidden=true;}renderAll();}
function doUndo(){if(!undo.length)return;redo.push(snapState());restore(undo.pop());markDirty();}
function doRedo(){if(!redo.length)return;undo.push(snapState());restore(redo.pop());markDirty();}
let autoT;
function markDirty(){dirty=true;$('#dirty').textContent='● 변경됨';clearTimeout(autoT);autoT=setTimeout(autosave,2500);}

/* ===================== 기하/히트테스트 ===================== */
function ptsBox(pts,pad){pad=pad||0;let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;for(const p of pts){x1=Math.min(x1,p[0]);y1=Math.min(y1,p[1]);x2=Math.max(x2,p[0]);y2=Math.max(y2,p[1]);}if(x1>x2)return {x:0,y:0,w:0,h:0};return {x:x1-pad,y:y1-pad,w:x2-x1+pad*2,h:y2-y1+pad*2};}
const FONTS={sans:FONT,serif:'"Batang","Noto Serif KR","Nanum Myeongjo","Times New Roman",serif',mono:'"D2Coding","Consolas","Courier New",monospace'};
const fontOf=o=>FONTS[o.font]||FONT;
function textMetrics(o){const lines=String(o.text||'').split('\n');mctx.font=(o.italic?'italic ':'')+(o.bold?700:400)+' '+o.size+'px '+fontOf(o);let w=0;for(const l of lines)w=Math.max(w,mctx.measureText(l).width);const pad=o.size*0.3,vp=o.size*0.2,lh=o.size*(o.lh||1.25);return {w:Math.max(o.size,w)+pad*2,h:lines.length*lh+vp*2,pad,vp,lh,lines};}
function bbox(o){
  switch(o.t){
    case 'rect':case 'ellipse':case 'img':return {x:o.x,y:o.y,w:o.w,h:o.h};
    case 'mosaic':return o.shape==='free'?ptsBox(o.pts):{x:o.x,y:o.y,w:o.w,h:o.h};
    case 'pen':return ptsBox(o.pts,o.sw/2);
    case 'arrow':return {x:Math.min(o.x1,o.x2),y:Math.min(o.y1,o.y2),w:Math.abs(o.x2-o.x1),h:Math.abs(o.y2-o.y1)};
    case 'num':{const r=o.size/2;return {x:o.x-r,y:o.y-r,w:o.size,h:o.size};}
    case 'text':{const m=textMetrics(o);return {x:o.x,y:o.y,w:m.w,h:m.h};}
  }
  return {x:0,y:0,w:0,h:0};
}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;let t=l2?((px-ax)*dx+(py-ay)*dy)/l2:0;t=clamp(t,0,1);return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
function hitObj(o,x,y,tol){
  if(o.rot){const b0=bbox(o),cx=b0.x+b0.w/2,cy=b0.y+b0.h/2,r=-o.rot*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),dx=x-cx,dy=y-cy;x=cx+dx*cs-dy*sn;y=cy+dx*sn+dy*cs;}
  const b=bbox(o);
  switch(o.t){
    case 'img':case 'text':case 'mosaic':return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
    case 'num':return o.shape==='circle'?Math.hypot(x-o.x,y-o.y)<=o.size/2+tol:(Math.abs(x-o.x)<=o.size/2+tol&&Math.abs(y-o.y)<=o.size/2+tol);
    case 'arrow':return segDist(x,y,o.x1,o.y1,o.x2,o.y2)<=Math.max(tol,o.sw);
    case 'pen':{const r=Math.max(tol,o.sw/2+2);if(o.pts.length===1)return Math.hypot(x-o.pts[0][0],y-o.pts[0][1])<=r;for(let i=1;i<o.pts.length;i++)if(segDist(x,y,o.pts[i-1][0],o.pts[i-1][1],o.pts[i][0],o.pts[i][1])<=r)return true;return false;}
    case 'rect':{const half=o.sw/2+tol;const inOuter=x>=b.x-half&&x<=b.x+b.w+half&&y>=b.y-half&&y<=b.y+b.h+half;if(!inOuter)return false;if(o.fillA>0.05||o.sw===0)return true;const inInner=x>b.x+half&&x<b.x+b.w-half&&y>b.y+half&&y<b.y+b.h-half;return !inInner;}
    case 'ellipse':{const rx=b.w/2||1,ry=b.h/2||1,nx=(x-b.x-rx)/rx,ny=(y-b.y-ry)/ry,d=Math.hypot(nx,ny),r=Math.min(rx,ry),t=(tol+o.sw/2)/r;if(o.fillA>0.05||o.sw===0)return d<=1+t;return Math.abs(d-1)<=t;}
  }
  return false;
}
const LAYER={img:0,mosaic:1};
function zOrdered(objs){return objs.map((o,i)=>[o,i]).sort((a,b)=>((LAYER[a[0].t]??2)-(LAYER[b[0].t]??2))||(a[1]-b[1])).map(x=>x[0]);}
function hitTest(objs,x,y,tol,incLocked){const z=zOrdered(objs);for(let i=z.length-1;i>=0;i--){if(z[i].locked&&!incLocked)continue;if(hitObj(z[i],x,y,tol))return z[i];}return null;}
function moveObj(o,orig,dx,dy){
  if(orig.pts)o.pts=orig.pts.map(p=>[p[0]+dx,p[1]+dy]);
  if('x' in orig)o.x=orig.x+dx;if('y' in orig)o.y=orig.y+dy;
  if('x1' in orig){o.x1=orig.x1+dx;o.y1=orig.y1+dy;o.x2=orig.x2+dx;o.y2=orig.y2+dy;}
}
function isBoxy(o){return o&&(o.t==='rect'||o.t==='ellipse'||o.t==='img'||(o.t==='mosaic'&&o.shape!=='free'));}
function rotP(x,y,cx,cy,deg){const r=deg*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),dx=x-cx,dy=y-cy;return {x:cx+dx*cs-dy*sn,y:cy+dx*sn+dy*cs};}
function rbox(o){
  const b=bbox(o);if(!o.rot)return b;const cx=b.x+b.w/2,cy=b.y+b.h/2,xs=[],ys=[];
  for(const [px,py] of [[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]]){const q=rotP(px,py,cx,cy,o.rot);xs.push(q.x);ys.push(q.y);}
  const x1=Math.min(...xs),y1=Math.min(...ys);return {x:x1,y:y1,w:Math.max(...xs)-x1,h:Math.max(...ys)-y1};
}
const ROTT=['rect','ellipse','img','text','num'];
function rotatable(list){return list.length>0&&list.every(o=>o.t!=='mosaic');}
function rotateObj(o,og,fc,deg){
  const rp=(x,y)=>rotP(x,y,fc.x,fc.y,deg);
  if(og.pts){o.pts=og.pts.map(p=>{const q=rp(p[0],p[1]);return [q.x,q.y];});return;}
  if(og.t==='arrow'){const a=rp(og.x1,og.y1),b=rp(og.x2,og.y2);o.x1=a.x;o.y1=a.y;o.x2=b.x;o.y2=b.y;return;}
  const b=bbox(og),c0={x:b.x+b.w/2,y:b.y+b.h/2},c1=rp(c0.x,c0.y);
  moveObj(o,og,c1.x-c0.x,c1.y-c0.y);o.rot=(((og.rot||0)+deg)%360+360)%360;
}
function boxHandles(b){const x2=b.x+b.w,y2=b.y+b.h,cx=b.x+b.w/2,cy=b.y+b.h/2;return [{n:'nw',x:b.x,y:b.y},{n:'n',x:cx,y:b.y},{n:'ne',x:x2,y:b.y},{n:'e',x:x2,y:cy},{n:'se',x:x2,y:y2},{n:'s',x:cx,y:y2},{n:'sw',x:b.x,y:y2},{n:'w',x:b.x,y:cy}];}
function handlesOf(o){
  if(o.t==='arrow')return [{n:'a1',x:o.x1,y:o.y1},{n:'a2',x:o.x2,y:o.y2}];
  if(!isBoxy(o))return [];
  return boxHandles(bbox(o));
}
/* ---- 선택(여러 개/그룹) ---- */
function selIds(){if(!sel)return [];const ids=msel.includes(sel)?msel:[sel];return ids.filter(id=>findObj(id));}
function selList(){return selIds().map(findObj);}
function setSel(ids){
  const set=new Set(),objs=curSlide().objects;
  for(const id of ids){const o=findObj(id);if(!o)continue;set.add(id);if(o.gid)for(const q of objs)if(q.gid===o.gid)set.add(q.id);}
  msel=[...set];sel=msel.length?msel[0]:null;
}
function unionBox(objs){const bs=objs.map(rbox),x1=Math.min(...bs.map(b=>b.x)),y1=Math.min(...bs.map(b=>b.y)),x2=Math.max(...bs.map(b=>b.x+b.w)),y2=Math.max(...bs.map(b=>b.y+b.h));return {x:x1,y:y1,w:x2-x1,h:y2-y1};}
function selFrame(){const l=selList();if(!l.length)return null;const lk=l.some(o=>o.locked);if(l.length===1){const o=l[0];return {single:o,box:bbox(o),rot:o.rot||0,list:l,locked:lk};}return {box:unionBox(l),rot:0,list:l,locked:lk};}
function unitsOf(list){const m=new Map();for(const o of list){const k=o.gid||o.id;if(!m.has(k))m.set(k,[]);m.get(k).push(o);}return [...m.values()].map(objs=>({objs,box:unionBox(objs)}));}
function dupObjs(list,dx,dy){const gm={};return list.map(o=>{const n=cloneObj(o);n.id=uid();delete n.locked;if(n.gid){gm[n.gid]=gm[n.gid]||uid();n.gid=gm[n.gid];}moveObj(n,o,dx,dy);return n;});}
function boxResize(b0,hn,dx,dy,keep){
  let x1=b0.x,y1=b0.y,x2=b0.x+b0.w,y2=b0.y+b0.h;
  if(hn.includes('w'))x1+=dx;if(hn.includes('e'))x2+=dx;if(hn.includes('n'))y1+=dy;if(hn.includes('s'))y2+=dy;
  let nx=Math.min(x1,x2),ny=Math.min(y1,y2),nw=Math.max(4,Math.abs(x2-x1)),nh=Math.max(4,Math.abs(y2-y1));
  if(keep&&b0.w>0&&b0.h>0){const r=b0.w/b0.h;if(hn.length===2||hn==='e'||hn==='w')nh=nw/r;else nw=nh*r;ny=hn.includes('n')?b0.y+b0.h-nh:b0.y;nx=hn.includes('w')?b0.x+b0.w-nw:b0.x;if(hn==='n'||hn==='s')nx=b0.x+(b0.w-nw)/2;if(hn==='e'||hn==='w')ny=b0.y+(b0.h-nh)/2;}
  return {x:nx,y:ny,w:nw,h:nh};
}
function scaleObj(o,og,b0,b1){
  const sx=b0.w>0?b1.w/b0.w:1,sy=b0.h>0?b1.h/b0.h:1,mx=x=>b1.x+(x-b0.x)*sx,my=y=>b1.y+(y-b0.y)*sy,sa=(sx+sy)/2;
  if(og.pts)o.pts=og.pts.map(p=>[mx(p[0]),my(p[1])]);
  if(isBoxy(og)){o.x=mx(og.x);o.y=my(og.y);o.w=Math.max(2,og.w*sx);o.h=Math.max(2,og.h*sy);}
  else if(og.t==='arrow'){o.x1=mx(og.x1);o.y1=my(og.y1);o.x2=mx(og.x2);o.y2=my(og.y2);}
  else if(og.t==='num'){o.x=mx(og.x);o.y=my(og.y);o.size=Math.max(14,og.size*sa);}
  else if(og.t==='text'){o.x=mx(og.x);o.y=my(og.y);o.size=Math.max(8,og.size*sa);}
}

/* ===================== SVG 주석 렌더링 ===================== */
function dashAttr(o){return o.dash?' stroke-dasharray="'+(o.dash==1?(o.sw*2.2)+' '+(o.sw*1.6):(o.sw)+' '+(o.sw*1.2))+'"':'';}
function annItem(o){
  const s=annRaw(o);if(!o.rot||!s)return s;const b=bbox(o);
  return '<g transform="rotate('+o.rot+' '+(b.x+b.w/2)+' '+(b.y+b.h/2)+')">'+s+'</g>';
}
function annRaw(o){
  switch(o.t){
    case 'rect':return '<rect x="'+o.x+'" y="'+o.y+'" width="'+o.w+'" height="'+o.h+'" rx="'+(o.radius||0)+'" fill="'+(o.fillA>0?o.fill:'none')+'" fill-opacity="'+o.fillA+'" stroke="'+(o.sw>0?o.stroke:'none')+'" stroke-width="'+o.sw+'"'+dashAttr(o)+'/>';
    case 'ellipse':return '<ellipse cx="'+(o.x+o.w/2)+'" cy="'+(o.y+o.h/2)+'" rx="'+(o.w/2)+'" ry="'+(o.h/2)+'" fill="'+(o.fillA>0?o.fill:'none')+'" fill-opacity="'+o.fillA+'" stroke="'+(o.sw>0?o.stroke:'none')+'" stroke-width="'+o.sw+'"'+dashAttr(o)+'/>';
    case 'arrow':{
      const dx=o.x2-o.x1,dy=o.y2-o.y1,L=Math.hypot(dx,dy);if(L<1)return '';
      const ux=dx/L,uy=dy/L,hs=Math.min(L*0.6,o.sw*3+12);let x1=o.x1,y1=o.y1,x2=o.x2,y2=o.y2,s='';
      const head=(tx,ty,vx,vy)=>{const bx=tx-vx*hs,by=ty-vy*hs,px=-vy,py=vx;return '<polygon points="'+tx+','+ty+' '+(bx+px*hs*0.5)+','+(by+py*hs*0.5)+' '+(bx-px*hs*0.5)+','+(by-py*hs*0.5)+'" fill="'+o.stroke+'"/>';};
      if(o.head>=1){x2=o.x2-ux*hs*0.8;y2=o.y2-uy*hs*0.8;s+=head(o.x2,o.y2,ux,uy);}
      if(o.head==2){x1=o.x1+ux*hs*0.8;y1=o.y1+uy*hs*0.8;s+=head(o.x1,o.y1,-ux,-uy);}
      return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+o.stroke+'" stroke-width="'+o.sw+'" stroke-linecap="round"'+dashAttr(o)+'/>'+s;
    }
    case 'num':{
      const r=o.size/2,common='fill="'+o.fill+'" stroke="'+(o.sw>0?o.stroke:'none')+'" stroke-width="'+o.sw+'"';
      const sh=o.shape==='circle'?'<circle cx="'+o.x+'" cy="'+o.y+'" r="'+r+'" '+common+'/>':'<rect x="'+(o.x-r)+'" y="'+(o.y-r)+'" width="'+o.size+'" height="'+o.size+'" rx="'+(o.shape==='round'?r*0.4:0)+'" '+common+'/>';
      const fs=o.size*(String(o.n).length>1?0.46:0.58);
      return sh+'<text x="'+o.x+'" y="'+o.y+'" dy=".35em" text-anchor="middle" font-size="'+fs+'" font-weight="700" fill="'+o.color+"\" font-family='"+FONT+"'>"+esc(o.n)+'</text>';
    }
    case 'text':{
      const m=textMetrics(o);let s='';
      if(o.bgA>0)s+='<rect x="'+o.x+'" y="'+o.y+'" width="'+m.w+'" height="'+m.h+'" rx="'+(o.size*0.2)+'" fill="'+o.bg+'" fill-opacity="'+o.bgA+'"/>';
      const al=o.align||'left',tx=al==='center'?o.x+m.w/2:al==='right'?o.x+m.w-m.pad:o.x+m.pad,anc=al==='center'?'middle':al==='right'?'end':'start',dec=((o.underline?'underline ':'')+(o.strike?'line-through':'')).trim();
      const common=' text-anchor="'+anc+'" font-size="'+o.size+'" font-weight="'+(o.bold?700:400)+'"'+(o.italic?' font-style="italic"':'')+(dec?' text-decoration="'+dec+'"':'')+" font-family='"+fontOf(o)+"' xml:space=\"preserve\"";
      const ol=o.outline>0?' stroke="'+(o.outlineC||'#FFFFFF')+'" stroke-width="'+(o.outline*2)+'" stroke-linejoin="round" paint-order="stroke"':'';
      const sd=o.size*0.06+1;
      m.lines.forEach((l,i)=>{const y=o.y+m.vp+i*m.lh+o.size*0.95+(m.lh-o.size*1.25)/2;
        if(o.shadow)s+='<text x="'+(tx+sd)+'" y="'+(y+sd)+'"'+common+' fill="#000" fill-opacity=".38">'+esc(l)+'</text>';
        s+='<text x="'+tx+'" y="'+y+'"'+common+' fill="'+o.color+'"'+ol+'>'+esc(l)+'</text>';});
      return s;
    }
    case 'pen':{
      if(!o.pts.length)return '';
      let d='M'+o.pts[0][0].toFixed(1)+' '+o.pts[0][1].toFixed(1);if(o.pts.length===1)d+=' l0.01 0';
      for(let i=1;i<o.pts.length;i++)d+=' L'+o.pts[i][0].toFixed(1)+' '+o.pts[i][1].toFixed(1);
      return '<path d="'+d+'" fill="none" stroke="'+o.stroke+'" stroke-width="'+o.sw+'" stroke-opacity="'+(o.alpha==null?1:o.alpha)+'" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  }
  return '';
}
const annotations=objs=>objs.filter(o=>o.t!=='img'&&o.t!=='mosaic').map(annItem).join('');

/* ===================== 이미지/모자이크 합성 ===================== */
function imgCss(o){
  const c=o.crop;let s='';
  if(c&&(c.l||c.t||c.r||c.b))s+='object-view-box:inset('+(c.t*100)+'% '+(c.r*100)+'% '+(c.b*100)+'% '+(c.l*100)+'%);';
  const r=Math.min(o.radius||0,o.w/2,o.h/2);if(r>0)s+='border-radius:'+r+'px;';
  if(o.bw>0)s+='border:'+Math.min(o.bw,o.w/2,o.h/2)+'px solid '+(o.bc||'#111')+';';
  if(o.shadow)s+='box-shadow:0 6px 18px rgba(0,0,0,.35);';
  if(o.opacity!=null&&o.opacity<1)s+='opacity:'+o.opacity+';';
  return s;
}
function drawImgObj(g,o,im){
  const c=o.crop||{l:0,t:0,r:0,b:0},Nw=im.naturalWidth,Nh=im.naturalHeight,w=o.w,h=o.h,x=-w/2,y=-h/2;
  const r=Math.min(o.radius||0,w/2,h/2),bw=o.bw>0?Math.min(o.bw,w/2,h/2):0;
  const rr=(px,py,pw,ph,rad)=>{g.beginPath();if(g.roundRect&&rad>0)g.roundRect(px,py,pw,ph,rad);else g.rect(px,py,pw,ph);};
  g.save();g.translate(o.x+w/2,o.y+h/2);g.rotate((o.rot||0)*Math.PI/180);if(o.flip)g.scale(-1,1);
  if(o.opacity!=null&&o.opacity<1)g.globalAlpha=o.opacity;
  if(o.shadow){g.save();g.beginPath();g.rect(-6000,-6000,12000,12000);if(g.roundRect&&r>0)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h);g.clip('evenodd');g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=18;g.shadowOffsetY=6;rr(x,y,w,h,r);g.fillStyle='#000';g.fill();g.restore();}
  if(bw>0){rr(x,y,w,h,r);g.fillStyle=o.bc||'#111';g.fill();}
  g.save();rr(x+bw,y+bw,w-2*bw,h-2*bw,Math.max(0,r-bw));g.clip();
  g.drawImage(im,c.l*Nw,c.t*Nh,(1-c.l-c.r)*Nw,(1-c.t-c.b)*Nh,x+bw,y+bw,w-2*bw,h-2*bw);g.restore();
  g.restore();
}
const imgCache=new Map();
function getImg(id){
  if(imgCache.has(id))return imgCache.get(id);
  const p=new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=P.assets[id];});
  imgCache.set(id,p);return p;
}
async function composeBase(slide){
  const imgs=slide.objects.filter(o=>o.t==='img'),mst=masterOf(slide),mimgs=mst?mst.objects.filter(o=>o.t==='img'):[],bgc=(mst&&!slide.bgOwn)?mst.bg:slide.bg;
  const ik=o=>[o.id,o.src,Math.round(o.x),Math.round(o.y),Math.round(o.w),Math.round(o.h),o.rot||0,JSON.stringify([o.crop,o.bw,o.bc,o.radius,o.shadow,o.opacity,o.flip])].join();
  const key=bgc+'|'+mimgs.map(ik).join(';')+'||'+imgs.map(o=>[o.id,o.src,Math.round(o.x),Math.round(o.y),Math.round(o.w),Math.round(o.h),o.rot||0,JSON.stringify([o.crop,o.bw,o.bc,o.radius,o.shadow,o.opacity,o.flip])].join()).join(';');
  if(slide._baseKey===key&&slide._base)return slide._base;
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle=bgc;g.fillRect(0,0,W,H);
  for(const o of mimgs){const im=await getImg(o.src);if(im)drawImgObj(g,o,im);}
  for(const o of imgs){const im=await getImg(o.src);if(im)drawImgObj(g,o,im);}
  slide._baseKey=key;slide._base=c;return c;
}
async function mosaicCanvas(o,slide){
  const base=await composeBase(slide);
  const b=bbox(o),x=Math.floor(b.x),y=Math.floor(b.y),w=Math.max(1,Math.ceil(b.w)+1),h=Math.max(1,Math.ceil(b.h)+1);
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  g.save();
  if(o.shape==='ellipse'){g.beginPath();g.ellipse(w/2,h/2,Math.max(1,b.w/2),Math.max(1,b.h/2),0,0,Math.PI*2);g.clip();}
  else if(o.shape==='free'&&o.pts.length>2){g.beginPath();o.pts.forEach((p,i)=>i?g.lineTo(p[0]-x,p[1]-y):g.moveTo(p[0]-x,p[1]-y));g.closePath();g.clip();}
  if(o.mode==='solid'){g.fillStyle=o.color;g.fillRect(0,0,w,h);}
  else if(o.mode==='blur'){g.filter='blur('+Math.max(1,o.strength)+'px)';g.drawImage(base,-x,-y);g.filter='none';}
  else{
    const bs=Math.max(2,o.strength|0),sw=Math.max(1,Math.ceil(w/bs)),sh=Math.max(1,Math.ceil(h/bs));
    const t=document.createElement('canvas');t.width=sw;t.height=sh;const tg=t.getContext('2d');tg.imageSmoothingQuality='high';tg.drawImage(base,x,y,w,h,0,0,sw,sh);
    g.imageSmoothingEnabled=false;g.drawImage(t,0,0,sw,sh,0,0,sw*bs,sh*bs);
  }
  g.restore();
  return {cv,x,y};
}

/* ===================== HTML 슬라이드 프레임 ===================== */
function frameScript(cfg){
  var editing=false;
  function slides(){try{return cfg.sel?[].slice.call(document.querySelectorAll(cfg.sel)):[];}catch(e){return [];}}
  function apply(){
    if(cfg.sel&&cfg.pick>=0){
      slides().forEach(function(el,i){
        if(i===cfg.pick){
          el.classList.add('active','present','is-active');el.removeAttribute('hidden');el.removeAttribute('aria-hidden');
          el.style.setProperty('opacity','1','important');el.style.setProperty('visibility','visible','important');
          if(getComputedStyle(el).display==='none')el.style.setProperty('display','block','important');
        }else{el.classList.remove('active','present','is-active');el.style.setProperty('display','none','important');}
      });
    }
    var ed=cfg.edits||{};
    for(var id in ed){var el2=document.querySelector('[data-ls-id="'+id+'"]');if(el2)el2.innerHTML=ed[id];}
  }
  function setEdit(on){
    editing=on;
    [].slice.call(document.querySelectorAll('[data-ls-id]')).forEach(function(el){
      if(on){el.setAttribute('contenteditable','true');el.style.outline='1px dashed rgba(37,99,235,.7)';el.style.cursor='text';}
      else{el.removeAttribute('contenteditable');el.style.outline='';el.style.cursor='';}
    });
  }
  function snapshot(){
    try{
      var cl=document.documentElement.cloneNode(true);
      [].slice.call(cl.querySelectorAll('script')).forEach(function(s){s.parentNode.removeChild(s);});
      var xml=new XMLSerializer().serializeToString(cl);
      var vw=window.innerWidth,vh=window.innerHeight,tw=480,th=Math.round(480*vh/vw);
      var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+vw+'" height="'+vh+'"><foreignObject x="0" y="0" width="'+vw+'" height="'+vh+'">'+xml+'</foreignObject></svg>';
      var img=new Image();
      img.onload=function(){try{var c=document.createElement('canvas');c.width=tw;c.height=th;var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,tw,th);g.drawImage(img,0,0,tw,th);parent.postMessage({ls:1,t:'thumb',url:c.toDataURL('image/jpeg',0.72)},'*');}catch(e){parent.postMessage({ls:1,t:'thumb',url:null},'*');}};
      img.onerror=function(){parent.postMessage({ls:1,t:'thumb',url:null},'*');};
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    }catch(e){parent.postMessage({ls:1,t:'thumb',url:null},'*');}
  }
  if(cfg.snap)window.addEventListener('load',function(){setTimeout(snapshot,1700);});
  document.addEventListener('DOMContentLoaded',function(){apply();setTimeout(apply,300);setTimeout(apply,1200);});
  window.addEventListener('load',function(){apply();setTimeout(apply,400);});
  document.addEventListener('click',function(e){if(editing){e.preventDefault();e.stopPropagation();}},true);
  document.addEventListener('keydown',function(e){if(editing)e.stopPropagation();},true);
  document.addEventListener('input',function(e){
    var el=e.target&&e.target.closest?e.target.closest('[data-ls-id]'):null;
    if(el&&editing)parent.postMessage({ls:1,t:'edit',id:el.getAttribute('data-ls-id'),html:el.innerHTML},'*');
  });
  window.addEventListener('message',function(e){if(e.data&&e.data.ls===1&&e.data.t==='editMode')setEdit(!!e.data.on);});
}
function frameKey(s){return s.htmlId+'|'+s.pick+'|'+s.sel+'|'+JSON.stringify(s.textEdits||{});}
function buildSrcdoc(s,snap){
  let html=P.htmls[s.htmlId]||'<p style="font:16px sans-serif;padding:30px">HTML 원본을 찾을 수 없어요</p>';
  const cfg={sel:s.sel||'',pick:s.pick==null?-1:s.pick,edits:s.textEdits||{},snap:!!snap};
  const css='<style>*{-webkit-print-color-adjust:exact;print-color-adjust:exact}'+(cfg.pick>=0?'html,body{overflow:hidden!important}':'')+'</style>';
  const inj=css+'<script>('+frameScript.toString()+')('+JSON.stringify(cfg).replace(/</g,'\\u003c')+');<\/script>';
  const m=html.match(/<head[^>]*>/i);
  if(m)return html.replace(m[0],m[0]+inj);
  return inj+html;
}

/* ===================== 마스터 ===================== */
function masterOf(slide){const ms=P.masters||[];if(!slide||slide.master==='none'||ms.includes(slide))return null;return ms.find(m=>m.id===slide.master)||ms[0]||null;}
function masterObjs(m,slide,opt){
  const idx=opt&&opt.idx!=null?opt.idx:P.slides.findIndex(x=>x.id===slide.id),total=opt&&opt.total!=null?opt.total:P.slides.length;
  return m.objects.map(o=>o.t==='text'&&/\{(n|total)\}/.test(o.text||'')?{...o,text:o.text.replace(/\{n\}/g,idx+1).replace(/\{total\}/g,total)}:o);
}
function syncImgs(ih,im,objs){
  const seen=new Set();
  for(const o of objs){
    if(o.t!=='img')continue;seen.add(o.id);
    let el=im.get(o.id);
    if(!el){el=new Image();el.draggable=false;el.src=P.assets[o.src]||'';im.set(o.id,el);}
    ih.appendChild(el);
    el.style.cssText='left:'+o.x+'px;top:'+o.y+'px;width:'+o.w+'px;height:'+o.h+'px;transform:rotate('+(o.rot||0)+'deg)'+(o.flip?' scaleX(-1)':'')+';'+imgCss(o);
  }
  for(const [id,el] of im)if(!seen.has(id)){el.remove();im.delete(id);}
}
/* ===================== 슬라이드 그리기(공용) ===================== */
function paintSlide(root,slide,ink,opt){
  opt=opt||{};root._pend=[];
  if(root._sid!==slide.id||!root._ok){
    root.innerHTML='<div class="l-bg"></div><div class="l-mimg"></div><svg class="l-mann" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'"></svg><div class="l-frame"></div><div class="l-img"></div><div class="l-mos"></div><svg class="l-ann" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'"></svg><svg class="l-ink" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'"></svg>';
    root._ok=1;root._sid=slide.id;root._fk=null;root._frame=null;root._maps={img:new Map(),mos:new Map(),mimg:new Map()};
    root.style.position='relative';root.style.width=W+'px';root.style.height=H+'px';root.style.overflow='hidden';
  }
  const mst=masterOf(slide);
  $('.l-bg',root).style.background=(mst&&!slide.bgOwn)?mst.bg:slide.bg;
  if(mst){syncImgs($('.l-mimg',root),root._maps.mimg,mst.objects);$('.l-mann',root).innerHTML=annotations(masterObjs(mst,slide,opt));}
  else{syncImgs($('.l-mimg',root),root._maps.mimg,[]);$('.l-mann',root).innerHTML='';}
  /* HTML 프레임 */
  const fr=$('.l-frame',root);
  if(slide.type==='html'){
    if(opt.thumb){const tk='thumb'+(slide.thumb?slide.thumb.length:0);if(root._fk!==tk){fr.innerHTML=slide.thumb?'<img class="thumb-img" src="'+slide.thumb+'">':'<div class="thumb-html">HTML</div>';root._fk=tk;root._frame=null;}}
    else{
      const key=frameKey(slide);
      if(root._fk!==key){fr.innerHTML='';const f=document.createElement('iframe');f.className='html-frame';f.setAttribute('sandbox','allow-scripts');f.srcdoc=buildSrcdoc(slide);fr.appendChild(f);root._fk=key;root._frame=f;}
      if(root._frame)root._frame.style.pointerEvents=opt.interactFrame?'auto':'none';
    }
  }else if(root._fk){fr.innerHTML='';root._fk=null;root._frame=null;}
  /* 이미지 */
  syncImgs($('.l-img',root),root._maps.img,slide.objects);
  /* 모자이크 */
  const mh=$('.l-mos',root),mm=root._maps.mos,seenM=new Set();
  for(const o of slide.objects){
    if(o.t!=='mosaic')continue;seenM.add(o.id);
    const b=bbox(o);let el=mm.get(o.id);
    if(slide.type==='html'||opt.thumb&&false){
      if(!el||el.tagName!=='DIV'){if(el)el.remove();el=document.createElement('div');mm.set(o.id,el);}
      mh.appendChild(el);
      el.style.cssText='position:absolute;left:'+b.x+'px;top:'+b.y+'px;width:'+b.w+'px;height:'+b.h+'px;'+(o.mode==='solid'||opt.print?'background:'+(o.mode==='solid'?o.color:'#6B7280')+';':'backdrop-filter:blur('+Math.max(2,o.strength*0.6)+'px);')+(o.shape==='ellipse'?'border-radius:50%;':'')+(o.shape==='free'&&o.pts.length>2?'clip-path:polygon('+o.pts.map(p=>(p[0]-b.x)+'px '+(p[1]-b.y)+'px').join(',')+');':'');
    }else{
      if(!el||el.tagName!=='CANVAS'){if(el)el.remove();el=document.createElement('canvas');mm.set(o.id,el);}
      mh.appendChild(el);
      el.style.cssText='position:absolute;left:'+Math.floor(b.x)+'px;top:'+Math.floor(b.y)+'px;';
      const tok=el._tok=(el._tok||0)+1;
      root._pend.push(mosaicCanvas(o,slide).then(r=>{if(el._tok!==tok||!r)return;el.width=r.cv.width;el.height=r.cv.height;el.getContext('2d').drawImage(r.cv,0,0);}));
    }
  }
  for(const [id,el] of mm)if(!seenM.has(id)){el.remove();mm.delete(id);}
  $('.l-ann',root).innerHTML=annotations(slide.objects);
  if(ink)$('.l-ink',root).innerHTML=annotations(ink);
}

/* ===================== 편집 화면 렌더 ===================== */
const box=$('#box'),stageEl=$('#stage');
function fitStage(){
  const vp=$('#viewport'),vw=vp.clientWidth-32,vh=vp.clientHeight-32,sf=Math.max(.1,Math.min(vw/W,vh/H)),s=sf*view.z;
  view.s=s;const o=$('#boxOuter');o.style.width=W*s+'px';o.style.height=H*s+'px';
  const cl=(vp.clientWidth-W*s)/2,ct=(vp.clientHeight-H*s)/2;
  if(view.z<=1.001){view.px=0;view.py=0;}
  const l=clamp(cl+view.px,60-W*s,vp.clientWidth-60),t=clamp(ct+view.py,60-H*s,vp.clientHeight-60);view.px=l-cl;view.py=t-ct;
  o.style.left=l+'px';o.style.top=t+'px';
  box.style.transform='scale('+s+')';
  updateStatus();
}
function updateStatus(){if(editMaster){const mm=(P.masters||[]).find(x=>x.id===editMaster);$('#stPos').textContent='마스터 편집 중'+(mm?' · '+mm.name:'')+'   ·   화면 '+Math.round(view.s*100)+'%';const zp=$('#zPct');if(zp)zp.textContent=Math.round(view.s*100)+'%';return;}const zp=$('#zPct');if(zp)zp.textContent=Math.round(view.s*100)+'%';const sb=$('#bSnap');if(sb)sb.classList.toggle('on',snapOn);$('#stPos').textContent='슬라이드 '+(cur+1)+' / '+P.slides.length+'   ·   화면 '+Math.round(view.s*100)+'%';}
function renderStage(){
  const s=curSlide();
  stageEl.classList.toggle('edit',editText&&s.type==='html');
  paintSlide(stageEl,s,null,{interactFrame:editText&&s.type==='html'});
  box.classList.toggle('sel',tool==='select');
  renderUI();scheduleThumb();
}
function renderUI(){
  if(cropId){const co=findObj(cropId);if(!co||selIds().join()!==cropId)cropId=null;}
  let h='';
  if(draft){
    if(draft.t==='mosaic'){
      const b=bbox(draft);
      if(draft.shape==='ellipse')h+='<ellipse cx="'+(b.x+b.w/2)+'" cy="'+(b.y+b.h/2)+'" rx="'+b.w/2+'" ry="'+b.h/2+'" fill="rgba(56,189,248,.18)" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6 4"/>';
      else if(draft.shape==='free')h+='<polygon points="'+draft.pts.map(p=>p.join(',')).join(' ')+'" fill="rgba(56,189,248,.18)" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6 4"/>';
      else h+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="rgba(56,189,248,.18)" stroke="#38BDF8" stroke-width="2" stroke-dasharray="6 4"/>';
    }else h+=annItem(draft);
  }
  if(marq)h+='<rect x="'+marq.x+'" y="'+marq.y+'" width="'+marq.w+'" height="'+marq.h+'" fill="rgba(37,99,235,.08)" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>';
  const fr=editText?null:selFrame();
  if(fr){
    const hs=11/view.s,b=fr.box,cx=b.x+b.w/2,cy=b.y+b.h/2;
    if(fr.list.length>1)for(const q of fr.list){const qb=rbox(q);h+='<rect x="'+qb.x+'" y="'+qb.y+'" width="'+qb.w+'" height="'+qb.h+'" fill="none" stroke="#93B4F8" stroke-width="1" vector-effect="non-scaling-stroke"/>';}
    h+='<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="none" stroke="'+(fr.locked?'#F59E0B':'#2563EB')+'" stroke-width="1.5" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"'+(fr.rot?' transform="rotate('+fr.rot+' '+cx+' '+cy+')"':'')+'/>';
    for(const hd of frameHandles(fr)){
      if(hd.n==='rot'){const t=rotP(cx,b.y,cx,cy,fr.rot);h+='<line x1="'+t.x+'" y1="'+t.y+'" x2="'+hd.x+'" y2="'+hd.y+'" stroke="#2563EB" stroke-width="1.5" vector-effect="non-scaling-stroke"/><circle cx="'+hd.x+'" cy="'+hd.y+'" r="'+(hs*0.62)+'" fill="#fff" stroke="#2563EB" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';}
      else h+='<rect x="'+(hd.x-hs/2)+'" y="'+(hd.y-hs/2)+'" width="'+hs+'" height="'+hs+'" fill="#fff" stroke="#2563EB" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
    }
  }
  if(cropId&&fr&&fr.single){const co=fr.single,c=co.crop||{l:0,t:0,r:0,b:0},Fw=co.w/(1-c.l-c.r),Fh=co.h/(1-c.t-c.b),cl=co.flip?c.r:c.l,ccx=co.x+co.w/2,ccy=co.y+co.h/2;h+='<rect x="'+(co.x-cl*Fw)+'" y="'+(co.y-c.t*Fh)+'" width="'+Fw+'" height="'+Fh+'" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"'+(co.rot?' transform="rotate('+co.rot+' '+ccx+' '+ccy+')"':'')+'/>';}
  if(fr&&fr.locked)h+='<text x="'+(fr.box.x+4)+'" y="'+(fr.box.y-6/view.s)+'" font-size="'+(15/view.s)+'">🔒 잠김</text>';
  for(const g of guides)h+=g.x!=null?'<line x1="'+g.x+'" y1="0" x2="'+g.x+'" y2="'+H+'" stroke="#EC4899" stroke-width="1" vector-effect="non-scaling-stroke"/>':'<line x1="0" y1="'+g.y+'" x2="'+W+'" y2="'+g.y+'" stroke="#EC4899" stroke-width="1" vector-effect="non-scaling-stroke"/>';
  $('#ui').innerHTML=h;
}
/* 썸네일 */
const thumbEls=new Map();let thumbT;
function scheduleThumb(){clearTimeout(thumbT);thumbT=setTimeout(()=>{const t=thumbEls.get(curSlide().id);if(t)paintSlide(t.root,curSlide(),null,{thumb:true});},250);}
function renderThumbs(){
  const box2=$('#thumbs');
  if(!$('.ops',box2)){box2.innerHTML='<div class="ops"><button data-op="add" title="빈 슬라이드 추가">＋</button><button data-op="dup" title="복제">⧉</button><button data-op="up" title="위로">▲</button><button data-op="down" title="아래로">▼</button><button data-op="del" title="삭제">🗑</button></div><div class="ops sz"><button data-op="sz" data-w="120" title="섬네일 작게">작게</button><button data-op="sz" data-w="182" title="섬네일 보통">보통</button><button data-op="sz" data-w="290" title="섬네일 크게">크게</button></div>';applyLayout();}
  const seen=new Set();
  P.slides.forEach((s,i)=>{
    seen.add(s.id);let t=thumbEls.get(s.id);
    if(!t){
      const el=document.createElement('div');el.className='th';el.draggable=true;el.innerHTML='<span class="n"></span><div class="tbox"><div class="troot"></div></div>';
      t={el,root:$('.troot',el)};thumbEls.set(s.id,t);
      el.addEventListener('click',()=>go(P.slides.findIndex(x=>x.id===s.id)));
      el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',s.id);});
      el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over');});
      el.addEventListener('dragleave',()=>el.classList.remove('over'));
      el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');const from=P.slides.findIndex(x=>x.id===e.dataTransfer.getData('text/plain')),to=P.slides.findIndex(x=>x.id===s.id);if(from<0||from===to)return;snap();const [m]=P.slides.splice(from,1);P.slides.splice(to,0,m);cur=P.slides.indexOf(m);renderAll();});
    }
    box2.appendChild(t.el);
    $('.n',t.el).textContent=i+1;t.el.classList.toggle('on',i===cur);
    paintSlide(t.root,s,null,{thumb:true});
  });
  for(const [id,t] of thumbEls)if(!seen.has(id)){t.el.remove();thumbEls.delete(id);}
  const on=thumbEls.get(curSlide().id);if(on)on.el.scrollIntoView({block:'nearest'});
}
function renderAll(){renderThumbs();renderStage();renderInspector();updateStatus();markTools();}
function go(i){if(editMaster)return;cur=clamp(i,0,P.slides.length-1);sel=null;draft=null;editText=false;nextNum=1+Math.max(0,...curSlide().objects.filter(o=>o.t==='num').map(o=>+o.n||0));renderAll();}
function markTools(){$$('#toolbar .tb').forEach(b=>b.classList.toggle('on',b.dataset.tool===tool&&(!b.dataset.var||b.dataset.var===toolVar)));}
function setTool(t,keep){if(editMaster&&t==='mosaic'){toast('마스터에서는 모자이크를 쓸 수 없어요');return;}tool=t;if(!keep)activeFav=-1;sel=null;draft=null;editText=false;cropId=null;markTools();box.classList.toggle('sel',t==='select');box.style.cursor=t==='select'?'default':(t==='text'?'text':'crosshair');renderUI();renderInspector();$('#stHint').textContent=HINTS[t]||'';markFavs();}
function markFavs(){$$('#favs .fav').forEach(b=>b.classList.toggle('on',+b.dataset.i===activeFav));const el=$('#stTool');if(el)el.textContent='현재 도구: '+((tool==='rect'?VAR_NAME[toolVar]:TOOL_NAME[tool])||'')+(activeFav>=0&&P.presets[activeFav]?' · 즐겨찾기 '+(activeFav+1)+'번 ('+P.presets[activeFav].name+')':'');}
const HINTS={select:'클릭: 선택 · Shift+클릭 또는 빈 곳 드래그: 여러 개 선택 · Ctrl+G: 그룹 · 모서리 점: 크기 · 위쪽 동그란 점: 회전(Shift: 15° 단위) · Delete: 삭제 · 숫자키 1~9: 즐겨찾기 스타일 적용 · Alt+클릭: 잠긴 도형 선택 · 스페이스+드래그: 화면 이동',rect:'드래그해서 사각형 그리기 (Shift: 정사각형)',ellipse:'드래그해서 원 그리기 (Shift: 정원)',arrow:'드래그해서 화살표 그리기 (Shift: 각도 고정)',line:'드래그해서 직선 그리기 (Shift: 각도 고정)',num:'클릭하면 번호가 하나씩 늘어나며 찍혀요',text:'클릭해서 글자 넣기 (Ctrl+Enter: 확정)',mosaic:'드래그해서 가리기 · 오른쪽 패널에서 사각/원/자유 영역 선택',pen:'드래그해서 자유롭게 그리기'};

/* ===================== 인스펙터 ===================== */
function ctl(f,val){
  const k=f[0],label=f[1],type=f[2];let inp='';
  if(type==='color')inp='<button type="button" class="cbtn" data-k="'+k+'" data-color="'+val+'" style="background:'+val+'" title="색 선택"></button>';
  else if(type==='range')inp='<div class="rg"><input type="range" data-k="'+k+'" min="'+f[3]+'" max="'+f[4]+'" step="'+f[5]+'" value="'+val+'"><input type="number" class="rn" data-k="'+k+'" min="'+f[3]+'" max="'+f[4]+'" step="'+f[5]+'" value="'+val+'"></div>';
  else if(type==='check')inp='<input type="checkbox" data-k="'+k+'"'+(val?' checked':'')+'>';
  else if(type==='select')inp='<select data-k="'+k+'"'+(NUMERIC_SELECT.has(k)?' data-num="1"':'')+'>'+f[3].map(op=>'<option value="'+op[0]+'"'+(String(op[0])===String(val)?' selected':'')+'>'+op[1]+'</option>').join('')+'</select>';
  return '<div class="fld"><label>'+label+'</label>'+inp+'</div>';
}
function pickStyle(kind,src){const r={};for(const f of FIELDS[kind]){let v=src[f[0]];if(v==null&&DEF[kind])v=DEF[kind][f[0]];r[f[0]]=v;}return r;}

/* ---- 꾸미기: 아이콘 버튼 줄 + 내 꾸미기 칩 ---- */
const DECO_KEYS={text:['color','bold','italic','underline','strike','font','bg','bgA','outline','outlineC','shadow'],img:['bw','bc','radius','shadow','opacity','flip']};
const DECO_BUILTIN={
  text:[
    {name:'강조 노란띠',style:{color:'#1C2026',bold:1,bg:'#FFE066',bgA:.9,outline:0,shadow:0}},
    {name:'제목',style:{color:'#111827',bold:1,size:44,bgA:0,outline:0,shadow:0}},
    {name:'캡처용',style:{color:'#FFFFFF',bold:1,bgA:0,outline:3,outlineC:'#111111',shadow:1}},
    {name:'파란 라벨',style:{color:'#FFFFFF',bold:1,bg:'#2563EB',bgA:.95,outline:0,shadow:0}}
  ],
  img:[
    {name:'캡처용',style:{bw:2,bc:'#CBD5E1',radius:0,shadow:1,opacity:1}},
    {name:'둥근 카드',style:{bw:0,radius:24,shadow:1,opacity:1}},
    {name:'액자',style:{bw:10,bc:'#FFFFFF',radius:4,shadow:1,opacity:1}},
    {name:'반투명',style:{opacity:.45,shadow:0}}
  ]
};
let myDeco=(()=>{try{const v=JSON.parse(lsGet('ls.decos')||'null');if(v&&Array.isArray(v.text)&&Array.isArray(v.img))return v;}catch(e){}return{text:[],img:[]};})();
function saveDecos(){lsSet('ls.decos',JSON.stringify(myDeco));}
let detOpen=lsGet('ls.det')==='1';
function contrastOf(hex){const m=/^#?([0-9a-f]{6})$/i.exec(hex||'');if(!m)return '#FFFFFF';const n=parseInt(m[1],16),r=n>>16,g=(n>>8)&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>150?'#111111':'#FFFFFF';}
function decoRow(kind,src){
  const g=k=>src[k]!=null?src[k]:DEF[kind][k],B=(id,on,inner,tip)=>'<button type="button" data-dec="'+id+'" class="'+(on?'on':'')+'" title="'+tip+'">'+inner+'</button>';
  let h='<div class="tglrow decrow">';
  if(kind==='text'){
    h+=B('shadow',g('shadow'),'<span style="text-shadow:2px 2px 2px #888">가</span>','그림자 켜기/끄기')
      +B('outline',g('outline')>0,'<span style="-webkit-text-stroke:1.2px #111;color:#fff">가</span>','외곽선 켜기/끄기 (색은 글자 색에 맞춰 자동)')
      +B('tbg',g('bgA')>0,'<span style="background:#FFE066;padding:0 4px;border-radius:2px">가</span>','배경 띠 켜기/끄기');
  }else{
    h+=B('bw',g('bw')>0,'▢','테두리 켜기/끄기')+B('radius',g('radius')>0,'◜','둥근 모서리 켜기/끄기')+B('ishadow',g('shadow'),'◪','그림자 켜기/끄기')+B('flip',g('flip'),'⇋','좌우 반전')+B('opacity',g('opacity')<1,'◔','반투명 켜기/끄기');
  }
  h+='</div>';
  const bi=DECO_BUILTIN[kind],my=myDeco[kind];
  h+='<div class="chips">'+bi.map((d,i)=>'<button type="button" class="chip" data-dapply="b'+i+'" title="기본 세트">'+esc(d.name)+'</button>').join('')
    +my.map((d,i)=>'<span class="chip my"><button type="button" data-dapply="m'+i+'" title="내 꾸미기 적용">'+esc(d.name)+'</button><button type="button" class="cx" data-dren="'+i+'" title="이름 바꾸기">✎</button><button type="button" class="cx" data-ddel="'+i+'" title="삭제">×</button></span>').join('')
    +'<button type="button" class="chip add" data-dsave="1" title="지금 선택한 꾸미기를 이름 붙여 저장">＋ 내 꾸미기 저장</button></div>';
  return h;
}
function applyDeco(kind,style){
  const list=selList();if(list.length){if(Date.now()-lastSnap>700)snap();for(const o of list)Object.assign(o,style);}
  Object.assign(ST[kind],style);renderStage();renderInspector();
}
function decoClick(b){
  const kind=curKind();if(!kind||(kind!=='text'&&kind!=='img'))return;
  const l=selList(),src=l.length?l[0]:ST[kind],g=k=>src[k]!=null?src[k]:DEF[kind][k];
  if(b.dataset.dec){
    const id=b.dataset.dec;
    if(id==='shadow'||id==='ishadow')applyDeco(kind,{shadow:g('shadow')?0:1});
    else if(id==='outline')applyDeco(kind,g('outline')>0?{outline:0}:{outline:3,outlineC:contrastOf(g('color'))});
    else if(id==='tbg')applyDeco(kind,{bgA:g('bgA')>0?0:.9});
    else if(id==='bw')applyDeco(kind,g('bw')>0?{bw:0}:{bw:4});
    else if(id==='radius')applyDeco(kind,{radius:g('radius')>0?0:24});
    else if(id==='flip')applyDeco(kind,{flip:g('flip')?0:1});
    else if(id==='opacity')applyDeco(kind,{opacity:g('opacity')<1?1:.6});
    return;
  }
  if(b.dataset.dapply){const a=b.dataset.dapply,i=+a.slice(1),d=(a[0]==='b'?DECO_BUILTIN:myDeco)[kind][i];if(d)applyDeco(kind,clone(d.style));return;}
  if(b.dataset.dsave){const name=prompt('내 꾸미기 이름',(kind==='text'?'글자 ':'이미지 ')+(myDeco[kind].length+1));if(!name)return;const st={};for(const k of DECO_KEYS[kind])st[k]=g(k);myDeco[kind].push({id:uid(),name:name.trim().slice(0,20)||'내 꾸미기',style:st});saveDecos();renderInspector();toast('내 꾸미기에 저장했어요');return;}
  if(b.dataset.dren!=null){const d=myDeco[kind][+b.dataset.dren];if(!d)return;const n=prompt('새 이름',d.name);if(n&&n.trim()){d.name=n.trim().slice(0,20);saveDecos();renderInspector();}return;}
  if(b.dataset.ddel!=null){const d=myDeco[kind][+b.dataset.ddel];if(!d)return;if(!confirm('「'+d.name+'」을(를) 지울까요?'))return;myDeco[kind].splice(+b.dataset.ddel,1);saveDecos();renderInspector();return;}
}
function curKind(){const list=selList();if(list.length){return list.every(q=>q.t===list[0].t)?kindOf(list[0]):null;}return tool!=='select'?tool:null;}
const TXT_TGL=new Set(['bold','italic','underline','strike','align']);
function textToggleRow(src){
  const g=(k)=>src[k]!=null?src[k]:DEF.text[k],T=(k,lab)=>'<button type="button" data-tgl="'+k+'" class="'+(g(k)?'on':'')+'" title="'+lab+'">'+({bold:'<b>가</b>',italic:'<i>가</i>',underline:'<u>가</u>',strike:'<s>가</s>'})[k]+'</button>',A=(v,lab)=>'<button type="button" data-tgl="align" data-v="'+v+'" class="'+(g('align')===v?'on':'')+'" title="'+lab+' 정렬">'+({left:'◧',center:'▣',right:'◨'})[v]+'</button>';
  return '<div class="tglrow">'+T('bold','굵게')+T('italic','기울임')+T('underline','밑줄')+T('strike','취소선')+'<span class="tsep"></span>'+A('left','왼쪽')+A('center','가운데')+A('right','오른쪽')+'</div>';
}
function renderInspector(){
  const list=selList(),o=list.length===1?list[0]:null,s=curSlide();
  let kind=null;if(list.length){if(list.every(q=>q.t===list[0].t))kind=kindOf(list[0]);}else if(tool!=='select')kind=tool;
  const src=list.length?list[0]:(kind?ST[kind]:null);
  let h='';if(list.length)h+=alignPanelHTML(list);
  if(kind&&src){
    h+='<h4>'+KIND_NAME[kind]+' 스타일'+(list.length>1?' · 선택한 '+list.length+'개':o?' · 선택한 도형':' · 다음에 그릴 도형')+'</h4>';
    if(kind==='text')h+=textToggleRow(src);
    if(kind==='text'||kind==='img')h+=decoRow(kind,src);
    let hd='';const DET=kind==='img'?null:new Set(['bg','bgA','outline','outlineC','shadow']);
    for(const f of FIELDS[kind]){if(list.length&&list[0].t==='mosaic'&&f[0]==='shape')continue;if(kind==='text'&&TXT_TGL.has(f[0]))continue;let v=src[f[0]];if(v==null&&DEF[kind])v=DEF[kind][f[0]];const c=ctl(f,v);if(kind==='img'||(DET&&DET.has(f[0])&&kind==='text'))hd+=c;else h+=c;}
    if(hd)h+='<details id="detBox"'+(detOpen?' open':'')+'><summary>자세히 (색·굵기·투명도 직접 조절)</summary>'+hd+'</details>';
    if(kind==='num'){h+='<div class="fld"><label>다음 번호</label><input type="number" id="nn" min="0" value="'+nextNum+'"></div>';h+='<label class="chk"><input type="checkbox" id="autoRenum"'+(autoRenum?' checked':'')+'> 번호를 지우면 자동으로 다시 매기기</label><div class="arow ic">'+AB('renum','다시 매기기','이 슬라이드의 번호를 1부터 순서대로 다시 매겨요')+'</div>';}
    if(o&&ROTT.includes(o.t))h+=ctl(['rot','회전(°)','range',0,360,1],Math.round(o.rot||0));
    if(kind==='img'){
      if(o){h+=cropId===o.id?'<p class="hint">✂ 자르는 중 · 가장자리/모서리를 끌어서 자르고, 늘리면 다시 살아나요 (점선 = 원본 크기)</p><button class="btn" id="bCropEnd">✔ 자르기 끝내기 (Enter)</button><button class="btn" id="bCropReset">원본 크기로 되돌리기</button>':'<button class="btn" id="bCrop">✂ 이미지 자르기 (더블클릭)</button><button class="btn" id="bBgFill">🖼 배경으로 만들기 (꽉 채움·맨 뒤·잠금)</button>'+(o.crop?'<button class="btn" id="bCropReset">자르기 취소 (원본 복원)</button>':'');}
    }else h+='<button class="btn" id="addFav">★ 이 스타일을 즐겨찾기에 저장</button>';
  }
  else if(!list.length){h+='<h4>도구</h4><p class="hint">위쪽 도구를 고르거나, 도형을 클릭해서 스타일을 바꿔요. 자주 쓰는 모양은 ★로 저장하고 숫자키 1~9 로 불러오세요.</p>';const nl=s.objects.filter(o=>o.locked).length;if(nl)h+='<p class="hint">🔒 잠긴 도형 '+nl+'개 (Alt+클릭으로 선택)</p><button class="btn" data-act="unlockAll">모두 잠금 해제</button>';}
  if(editMaster){
    h+='<h4>🧩 마스터 · 모든 슬라이드 뒤에 깔려요</h4>';
    h+='<div class="fld"><label>이름</label><input type="text" id="mName" value="'+esc(s.name||'')+'"></div>';
    h+='<div class="fld"><label>배경색</label><button type="button" class="cbtn" data-id="bg" data-color="'+s.bg+'" style="background:'+s.bg+'" title="색 선택"></button></div>';
    h+='<p class="hint">배경 이미지는 「이미지 넣기」 후 이미지를 선택해 「배경으로 만들기」를 누르세요. 글자에 {n} 은 쪽 번호, {total} 은 전체 쪽수로 바뀌어요.</p>';
    h+='<button class="btn" id="mPageNo">＋ 쪽번호 글자 넣기</button><button class="btn" id="mApplyAll">모든 슬라이드에 이 마스터 적용</button><button class="btn" id="mDel">이 마스터 삭제</button><button class="btn" id="mDone" style="background:#7C3AED;color:#fff;border-color:#7C3AED">✔ 마스터 편집 끝내기</button>';
    $('#inspector').innerHTML=h;return;
  }
  h+='<h4>슬라이드 '+(cur+1)+'</h4>';
  const ms=P.masters||[],mcur=masterOf(s);
  h+='<div class="fld"><label>배경색</label><button type="button" class="cbtn" data-id="bg" data-color="'+((mcur&&!s.bgOwn)?mcur.bg:s.bg)+'" style="background:'+((mcur&&!s.bgOwn)?mcur.bg:s.bg)+'" title="색 선택"></button></div>';
  if(mcur&&s.bgOwn)h+='<button class="btn" id="bgFromMaster">마스터 배경색 사용</button>';
  h+='<div class="fld"><label>마스터</label><select id="slMaster"><option value="none"'+(s.master==='none'?' selected':'')+'>없음</option>'+ms.map(m=>'<option value="'+m.id+'"'+(mcur&&mcur.id===m.id&&s.master!=='none'?' selected':'')+'>'+esc(m.name)+'</option>').join('')+'</select></div>';
  h+='<div class="arow"><button id="mEdit" style="min-width:90px">🧩 '+(ms.length?'마스터 편집':'마스터 만들기')+'</button>'+(ms.length?'<button id="mNew" style="min-width:90px">＋ 새 마스터</button>':'')+'</div>';
  h+='<div class="fld"><label>화면비(전체)</label><select id="slRatio"><option value="16:9"'+(P.ratio!=='4:3'?' selected':'')+'>16:9 (와이드)</option><option value="4:3"'+(P.ratio==='4:3'?' selected':'')+'>4:3 (발표용 표준)</option></select></div>';
  if(s.type==='html'){
    h+='<button class="btn" id="bEditText">'+(editText?'✔ 텍스트 편집 끝내기':'✎ 텍스트 편집 (E)')+'</button>';
    h+='<p class="hint">HTML 슬라이드는 원본 모양 그대로 보여요. 글자 수정은 위 버튼, 도형·모자이크·펜은 그 위에 얹혀요.</p>';
  }
  h+='<h4>발표자 메모</h4><textarea id="notes" placeholder="발표자 화면에만 보여요">'+esc(s.notes||'')+'</textarea>';
  $('#inspector').innerHTML=h;
}
$('#inspector').addEventListener('toggle',e=>{if(e.target.id==='detBox'){detOpen=e.target.open;lsSet('ls.det',detOpen?'1':'0');}},true);
$('#inspector').addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='mName'){const m=curSlide();m.name=t.value;markDirty();return;}
  if(t.id==='nn'){nextNum=Math.max(0,+t.value||0);return;}
  if(t.id==='autoRenum'){autoRenum=t.checked;lsSet('ls.renum',t.checked?'1':'0');return;}
  if(t.id==='bg'){if(Date.now()-lastSnap>700)snap();curSlide().bg=t.value;if(!editMaster)curSlide().bgOwn=1;renderStage();return;}
  if(t.id==='notes'){curSlide().notes=t.value;markDirty();return;}
  const k=t.dataset.k;if(!k)return;
  let v=t.type==='checkbox'?(t.checked?1:0):t.value;
  if(t.type==='range'||t.type==='number'||t.dataset.num){
    if(v==='')return;v=+v;if(isNaN(v))return;
    if(t.type==='number'||t.type==='range'){const mn=+t.min,mx=+t.max;if(!isNaN(mn))v=Math.max(mn,v);if(!isNaN(mx))v=Math.min(mx,v);}
    const rg=t.closest('.rg');if(rg)$$('input',rg).forEach(i=>{if(i!==t)i.value=v;});
  }
  setProp(k,v);
});
$('#inspector').addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='slMaster'){snap();curSlide().master=t.value;renderAll();return;}
  if(t.id==='slRatio'){changeRatio(t.value);return;}if(!(t.classList&&t.classList.contains('rn')))return;
  const mn=+t.min,mx=+t.max;let v=+t.value;if(isNaN(v))v=mn;v=Math.min(mx,Math.max(mn,v));t.value=v;
  const rg=t.closest('.rg');if(rg)$('input[type=range]',rg).value=v;
});
$('#inspector').addEventListener('click',e=>{
  if(e.target.id==='addFav')addFavorite();
  if(e.target.id==='bEditText')toggleTextEdit();
  if(e.target.id==='bCrop'){startCrop();return;}
  if(e.target.id==='bBgFill'){bgFill();return;}
  if(e.target.id==='mEdit'){enterMaster();return;}
  if(e.target.id==='mNew'){enterMaster(true);return;}
  if(e.target.id==='mDone'){exitMaster();return;}
  if(e.target.id==='mPageNo'){addPageNo();return;}
  if(e.target.id==='mApplyAll'){masterApplyAll();return;}
  if(e.target.id==='mDel'){masterDelete();return;}
  if(e.target.id==='bgFromMaster'){snap();delete curSlide().bgOwn;renderStage();renderInspector();return;}
  if(e.target.id==='bCropEnd'){cropId=null;renderUI();renderInspector();return;}
  if(e.target.id==='bCropReset'){cropReset();return;}
  const dc=e.target.closest('[data-dec],[data-dapply],[data-dsave],[data-dren],[data-ddel]');if(dc){decoClick(dc);return;}
  const tg=e.target.closest('[data-tgl]');if(tg){const k=tg.dataset.tgl;let v;if(tg.dataset.v!=null)v=tg.dataset.v;else{const l=selList(),sr=l.length?l[0]:ST.text;v=(sr[k]!=null?sr[k]:DEF.text[k])?0:1;}setProp(k,v);renderInspector();return;}
  const ac=e.target.closest('[data-act]');if(ac)doAct(ac.dataset.act);
  const cb=e.target.closest('.cbtn');
  if(cb)openColorPopup(cb,cb.dataset.color,v=>{
    cb.style.background=v;cb.dataset.color=v;
    if(cb.dataset.id==='bg'){if(Date.now()-lastSnap>700)snap();curSlide().bg=v;if(!editMaster)curSlide().bgOwn=1;renderStage();}
    else setProp(cb.dataset.k,v);
  });
});
/* ---- 격자 색상표 ---- */
const QUICK=['#E23B2E','#2563EB','#FFE066','#16A34A','#F59E0B','#111111','#FFFFFF','#7C3AED','#EC4899','#06B6D4'];
const GRAYS=['#FFFFFF','#F2F2F2','#D9D9D9','#BFBFBF','#A6A6A6','#808080','#595959','#404040','#262626','#000000'];
const HUES=[4,28,48,130,170,210,232,275,325,20];
function hsl2hex(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(255*c).toString(16).padStart(2,'0');};return ('#'+f(0)+f(8)+f(4)).toUpperCase();}
const HUEROWS=[88,74,58,44,30].map(L=>HUES.map((h,i)=>hsl2hex(h,i===9?35:80,L)));
function recentColors(){try{return JSON.parse(localStorage.getItem('ls.recent')||'[]');}catch(e){return [];}}
function addRecent(c){c=String(c).toUpperCase();let r=recentColors().filter(x=>x!==c);r.unshift(c);try{localStorage.setItem('ls.recent',JSON.stringify(r.slice(0,10)));}catch(e){}}
function closeColorPopup(){const p=$('#cpop');if(p)p.remove();document.removeEventListener('pointerdown',cpOut,true);}
function cpOut(e){if(!e.target.closest('#cpop'))closeColorPopup();}
function openColorPopup(anchor,cur,cb){
  closeColorPopup();
  const up=String(cur).toUpperCase();
  const sw=c=>'<button type="button" class="sw'+(c.toUpperCase()===up?' on':'')+'" data-c="'+c+'" style="background:'+c+'" title="'+c+'"></button>';
  const rec=recentColors();
  const p=document.createElement('div');p.id='cpop';
  p.innerHTML='<div class="cp-t">자주 쓰는 색</div><div class="cp-g">'+QUICK.map(sw).join('')+'</div>'
    +(rec.length?'<div class="cp-t">최근 쓴 색</div><div class="cp-g">'+rec.map(sw).join('')+'</div>':'')
    +'<div class="cp-t">색상표</div><div class="cp-g">'+GRAYS.map(sw).join('')+HUEROWS.map(r=>r.map(sw).join('')).join('')+'</div>'
    +'<button type="button" class="cp-more">더 많은 색…</button><input type="color" class="cp-native" value="'+(/^#[0-9a-f]{6}$/i.test(cur)?cur:'#000000')+'">';
  document.body.appendChild(p);
  const r=anchor.getBoundingClientRect();
  p.style.left=Math.max(8,Math.min(innerWidth-p.offsetWidth-8,r.left-p.offsetWidth+r.width))+'px';
  p.style.top=Math.max(8,Math.min(innerHeight-p.offsetHeight-8,r.bottom+4))+'px';
  p.addEventListener('click',e=>{
    const b=e.target.closest('.sw');
    if(b){cb(b.dataset.c);addRecent(b.dataset.c);closeColorPopup();return;}
    if(e.target.classList.contains('cp-more'))$('.cp-native',p).click();
  });
  const nat=$('.cp-native',p);
  nat.addEventListener('input',()=>cb(nat.value.toUpperCase()));
  nat.addEventListener('change',()=>{addRecent(nat.value);closeColorPopup();});
  setTimeout(()=>document.addEventListener('pointerdown',cpOut,true),0);
}
const IC=body=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
const OL=d=>'<path d="'+d+'" stroke="#F59E0B" stroke-width="2.4"/>';
const BR=(x,y,w,h,f)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="1.6" stroke="#2563EB" stroke-width="1.8"'+(f?' fill="'+f+'"':'')+'/>';
const ICONS={
  al:IC(OL('M3.5 3v18')+BR(6,5.5,14,5)+BR(6,13.5,9,5)),
  ac:IC(OL('M12 3v18')+BR(5,5.5,14,5)+BR(8,13.5,8,5)),
  ar:IC(OL('M20.5 3v18')+BR(4,5.5,14,5)+BR(9,13.5,9,5)),
  at:IC(OL('M3 3.5h18')+BR(5.5,6,5,14)+BR(13.5,6,5,9)),
  am:IC(OL('M3 12h18')+BR(5.5,4,5,16)+BR(13.5,7,5,10)),
  ab:IC(OL('M3 20.5h18')+BR(5.5,4,5,14)+BR(13.5,9,5,9)),
  dh:IC(OL('M3 3v18')+OL('M21 3v18')+BR(5.5,6,3.5,12)+BR(10.25,8,3.5,8)+BR(15,6,3.5,12)),
  dv:IC(OL('M3 3h18')+OL('M3 21h18')+BR(6,5.5,12,3.5)+BR(8,10.25,8,3.5)+BR(6,15,12,3.5)),
  sw:IC(BR(4,4,16,6)+BR(4,14,16,6)+OL('M4 12h16')),
  sh:IC(BR(4,4,6,16)+BR(14,4,6,16)+OL('M12 4v16')),
  sb:IC(BR(3.5,4,7,7)+BR(13.5,13,7,7)+OL('M10.5 11.5h3')+OL('M10.5 14.5h3')),
  grp:IC('<rect x="2.5" y="2.5" width="19" height="19" rx="2" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="3 2.5"/>'+BR(6,6,6,6)+BR(12,12,6,6)),
  ungrp:IC(BR(3.5,3.5,7,7)+BR(13.5,13.5,7,7)+OL('M12 12h0')),
  front:IC(BR(3.5,3.5,12,12)+'<rect x="8.5" y="8.5" width="12" height="12" rx="1.6" fill="#F59E0B" stroke="#B45309" stroke-width="1.2"/>'),
  back:IC('<rect x="3.5" y="3.5" width="12" height="12" rx="1.6" fill="#F59E0B" stroke="#B45309" stroke-width="1.2"/>'+BR(8.5,8.5,12,12,'#fff')),
  lock:IC('<rect x="5" y="11" width="14" height="9" rx="2" stroke="#2563EB" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#2563EB" stroke-width="1.8"/>'),
  fwd:null,bwd:null,
  unlock:IC('<rect x="5" y="11" width="14" height="9" rx="2" stroke="#F59E0B" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7" stroke="#F59E0B" stroke-width="1.8"/>'),
  scopy:IC('<path d="M5 19c3 0 3-3 5-5l6-8 2 2-8 6c-2 2-2 5-5 5z" stroke="#2563EB" stroke-width="1.8"/><circle cx="17.5" cy="5.5" r="1.6" fill="#F59E0B"/>'),
  spaste:IC('<rect x="5" y="5" width="14" height="16" rx="2" stroke="#2563EB" stroke-width="1.8"/><rect x="9" y="3" width="6" height="4" rx="1" fill="#F59E0B" stroke="#B45309" stroke-width="1"/>'),
  renum:IC('<circle cx="7" cy="12" r="4" stroke="#2563EB" stroke-width="1.8"/><circle cx="17" cy="12" r="4" stroke="#F59E0B" stroke-width="1.8"/>')
};
ICONS.fwd=ICONS.front;ICONS.bwd=ICONS.back;
const AB=(a,cap,ti)=>'<button data-act="'+a+'" title="'+ti+'">'+ICONS[a]+'<span>'+cap+'</span></button>';
function alignPanelHTML(list){
  const units=unitsOf(list),multi=units.length>1,anyG=list.some(o=>o.gid),allLk=list.every(o=>o.locked);
  let h='<h4>'+(list.length>1?list.length+'개 선택됨':'정렬')+(multi?'':' (슬라이드 기준)')+'</h4>';
  h+='<div class="arow ic">'+AB('al','왼쪽','왼쪽 맞춤')+AB('ac','가운데','가로 가운데 맞춤')+AB('ar','오른쪽','오른쪽 맞춤')+AB('at','위','위쪽 맞춤')+AB('am','중간','세로 중간 맞춤')+AB('ab','아래','아래쪽 맞춤')+'</div>';
  if(multi){
    h+='<div class="arow ic">'+AB('dh','가로 간격','가로 간격 균등 (3개 이상)')+AB('dv','세로 간격','세로 간격 균등 (3개 이상)')+AB('sw','너비 같게','처음 선택한 도형 기준')+AB('sh','높이 같게','처음 선택한 도형 기준')+AB('sb','크기 같게','처음 선택한 도형 기준')+'</div>';
  }
  h+='<div class="arow ic">'+(multi?AB('grp','그룹','그룹 만들기 (Ctrl+G)'):'')+(anyG?AB('ungrp','그룹 풀기','그룹 풀기 (Ctrl+Shift+G)'):'')+'</div>';
  h+='<h4>배치 · 잠금 · 스타일</h4><div class="arow ic">'+AB('front','맨 앞','맨 앞으로 (Ctrl+Shift+])')+AB('fwd','앞으로','한 단계 앞으로 (])')+AB('bwd','뒤로','한 단계 뒤로 ([)')+AB('back','맨 뒤','맨 뒤로 (Ctrl+Shift+[)')+'</div>';
  h+='<div class="arow ic">'+AB(allLk?'unlock':'lock',allLk?'잠금 해제':'잠금',allLk?'잠금 해제':'잠그면 실수로 움직이지 않아요')+(list.length===1&&kindOf(list[0])?AB('scopy','스타일 복사','스타일 복사 (Ctrl+Alt+C)'):'')+(styleClip?AB('spaste','스타일 붙여넣기','복사한 스타일 적용 (Ctrl+Alt+V)'):'')+'</div>';
  return h;
}
function shiftUnit(u,dx,dy){for(const o of u.objs)moveObj(o,cloneObj(o),dx,dy);}
function renumber(){
  const s=curSlide(),nums=s.objects.map((o,i)=>[o,i]).filter(x=>x[0].t==='num'&&x[0].n!==''&&!isNaN(+x[0].n));
  nums.sort((p,q)=>(+p[0].n)-(+q[0].n)||p[1]-q[1]);nums.forEach((x,i)=>{x[0].n=i+1;});
  nextNum=1+Math.max(0,...s.objects.filter(o=>o.t==='num').map(o=>+o.n||0));return nums.length;
}
function zAct(a){
  const s=curSlide(),ids=new Set(selIds());if(!ids.size)return;snap();const arr=s.objects;
  if(a==='front'||a==='back'){const sl=arr.filter(o=>ids.has(o.id)),rs=arr.filter(o=>!ids.has(o.id));s.objects=a==='front'?rs.concat(sl):sl.concat(rs);return;}
  const layers=new Set(arr.filter(o=>ids.has(o.id)).map(o=>LAYER[o.t]??2));
  for(const L of layers){
    const ix=[];arr.forEach((o,i)=>{if((LAYER[o.t]??2)===L)ix.push(i);});const seq=ix.map(i=>arr[i]);
    if(a==='fwd'){for(let i=seq.length-2;i>=0;i--)if(ids.has(seq[i].id)&&!ids.has(seq[i+1].id)){const t=seq[i];seq[i]=seq[i+1];seq[i+1]=t;}}
    else{for(let i=1;i<seq.length;i++)if(ids.has(seq[i].id)&&!ids.has(seq[i-1].id)){const t=seq[i];seq[i]=seq[i-1];seq[i-1]=t;}}
    ix.forEach((p,k)=>{arr[p]=seq[k];});
  }
}
const SHARED_STYLE=['stroke','sw','fill','fillA','dash'];
function copyStyle(){
  const l=selList();if(l.length!==1){toast('스타일을 복사할 도형을 하나만 선택하세요');return;}
  const k=kindOf(l[0]);if(!k){toast('이미지는 스타일 복사를 지원하지 않아요');return;}
  styleClip={kind:k,style:pickStyle(k,l[0])};toast('스타일을 복사했어요 · 다른 도형을 선택해 붙여넣기 (Ctrl+Alt+V)');renderInspector();
}
function pasteStyle(){
  if(!styleClip){toast('먼저 도형을 선택하고 스타일을 복사하세요 (Ctrl+Alt+C)');return;}
  const l=selList().filter(o=>kindOf(o));if(!l.length)return;snap();
  for(const o of l){const k=kindOf(o);for(const f of FIELDS[k]){const key=f[0];if(!(key in styleClip.style))continue;if(k===styleClip.kind?!(k==='mosaic'&&key==='shape'):SHARED_STYLE.includes(key))o[key]=styleClip.style[key];}}
  renderStage();renderInspector();toast('스타일을 붙여넣었어요');
}
function snapMove(d,dx,dy,off){
  guides=[];if(!snapOn||off||!d.box0)return [dx,dy];
  const th=7/view.s,b=d.box0,ids=new Set(d.origs.map(o=>o.id)),xs=[0,W/2,W],ys=[0,H/2,H];
  for(const o of curSlide().objects){if(ids.has(o.id))continue;const r=rbox(o);xs.push(r.x,r.x+r.w/2,r.x+r.w);ys.push(r.y,r.y+r.h/2,r.y+r.h);}
  const bx=[b.x+dx,b.x+dx+b.w/2,b.x+dx+b.w],by=[b.y+dy,b.y+dy+b.h/2,b.y+dy+b.h];
  const best=(src,tg)=>{let r=null;for(const v of src)for(const t of tg){const df=t-v;if(Math.abs(df)<=th&&(r===null||Math.abs(df)<Math.abs(r)))r=df;}return r;};
  const sx=best(bx,xs),sy=best(by,ys);
  if(sx!==null)dx+=sx;if(sy!==null)dy+=sy;
  const fx=[b.x+dx,b.x+dx+b.w/2,b.x+dx+b.w],fy=[b.y+dy,b.y+dy+b.h/2,b.y+dy+b.h];
  if(sx!==null){const seen=new Set();for(const v of fx)for(const t of xs)if(Math.abs(t-v)<.5&&!seen.has(Math.round(t))){seen.add(Math.round(t));guides.push({x:t});}}
  if(sy!==null){const seen=new Set();for(const v of fy)for(const t of ys)if(Math.abs(t-v)<.5&&!seen.has(Math.round(t))){seen.add(Math.round(t));guides.push({y:t});}}
  return [dx,dy];
}
function doAct(a){
  if(a==='renum'){snap();const n=renumber();renderStage();renderInspector();toast(n?'번호 '+n+'개를 1부터 다시 매겼어요':'다시 매길 번호가 없어요');return;}
  if(a==='unlockAll'){snap();curSlide().objects.forEach(o=>delete o.locked);renderStage();renderInspector();toast('모든 잠금을 풀었어요');return;}
  const list=selList();if(!list.length)return;
  if(a==='front'||a==='back'||a==='fwd'||a==='bwd'){zAct(a);renderStage();renderInspector();return;}
  if(a==='lock'||a==='unlock'){snap();for(const o of list){if(a==='lock')o.locked=1;else delete o.locked;}renderStage();renderInspector();toast(a==='lock'?'잠갔어요 · Alt+클릭으로 다시 선택할 수 있어요':'잠금을 풀었어요');return;}
  if(a==='scopy'){copyStyle();return;}if(a==='spaste'){pasteStyle();return;}
  const units=unitsOf(list);
  if(['al','ac','ar','at','am','ab'].includes(a)){
    snap();const ref=units.length===1?{x:0,y:0,w:W,h:H}:unionBox(list);
    for(const u of units){const b=u.box;let dx=0,dy=0;
      if(a==='al')dx=ref.x-b.x;else if(a==='ar')dx=ref.x+ref.w-(b.x+b.w);else if(a==='ac')dx=ref.x+ref.w/2-(b.x+b.w/2);
      else if(a==='at')dy=ref.y-b.y;else if(a==='ab')dy=ref.y+ref.h-(b.y+b.h);else dy=ref.y+ref.h/2-(b.y+b.h/2);
      shiftUnit(u,dx,dy);}
  }else if(a==='dh'||a==='dv'){
    if(units.length<3){toast('3개 이상 선택해야 간격을 맞출 수 있어요');return;}
    snap();const hz=a==='dh';units.sort((p,q)=>hz?p.box.x-q.box.x:p.box.y-q.box.y);
    const f=units[0].box,l=units[units.length-1].box,tot=units.reduce((s,u)=>s+(hz?u.box.w:u.box.h),0),span=hz?(l.x+l.w-f.x):(l.y+l.h-f.y),gap=(span-tot)/(units.length-1);
    let pos=hz?f.x:f.y;for(const u of units){const d=pos-(hz?u.box.x:u.box.y);shiftUnit(u,hz?d:0,hz?0:d);pos+=(hz?u.box.w:u.box.h)+gap;}
  }else if(a==='sw'||a==='sh'||a==='sb'){
    snap();const ref=units[0].box;let skipped=0;
    for(const u of units.slice(1)){
      if(u.objs.length!==1){skipped++;continue;}const o=u.objs[0];
      if(isBoxy(o)){if(a!=='sh')o.w=ref.w;if(a!=='sw')o.h=ref.h;}
      else if(o.t==='num'){o.size=a==='sh'?ref.h:ref.w;}else skipped++;
    }
    toast('처음 선택한 도형 기준으로 맞췄어요'+(skipped?' (그룹/선/펜 등 '+skipped+'개 제외)':''));
  }else if(a==='grp'){
    if(units.length<2)return;snap();const g=uid();for(const o of list)o.gid=g;toast('그룹으로 묶었어요');
  }else if(a==='ungrp'){
    snap();for(const o of list)delete o.gid;toast('그룹을 풀었어요');
  }
  renderStage();renderInspector();
}
function setProp(k,v){
  if(k==='rot'){const l=selList().filter(q=>ROTT.includes(q.t));if(l.length){if(Date.now()-lastSnap>700)snap();for(const o of l)o.rot=v;renderStage();}return;}
  const list=selList();let kind=null;
  if(list.length){if(list.every(q=>q.t===list[0].t))kind=kindOf(list[0]);}else if(tool!=='select')kind=tool;
  if(!kind)return;
  if(list.length){if(Date.now()-lastSnap>700)snap();for(const o of list)if(!(o.t==='mosaic'&&k==='shape'))o[k]=v;}
  ST[kind][k]=v;renderStage();
}
function toggleTextEdit(){
  const s=curSlide();if(s.type!=='html')return;
  editText=!editText;if(editText){sel=null;tool='select';}
  const f=stageEl._frame;if(f&&f.contentWindow)f.contentWindow.postMessage({ls:1,t:'editMode',on:editText},'*');
  renderStage();renderInspector();toast(editText?'글자를 클릭해서 바로 수정하세요':'텍스트 편집을 마쳤어요');
}
window.addEventListener('message',e=>{
  const m=e.data;if(!m||m.ls!==1)return;
  if(IS_AUD)return;
  if(m.t==='edit'&&stageEl._frame&&e.source===stageEl._frame.contentWindow){
    const s=curSlide();if(s.type!=='html')return;
    if(Date.now()-lastSnap>1500)snap();
    s.textEdits=s.textEdits||{};s.textEdits[m.id]=m.html;stageEl._fk=frameKey(s);markDirty();scheduleThumb();clearTimeout(window._thT);window._thT=setTimeout(()=>queueThumb(s),2000);
  }
});

/* ===================== 즐겨찾기 ===================== */
function presetPreview(p){
  const s=p.style;let o;const lw=Math.min(s.sw==null?3:s.sw,4);
  switch(p.kind){
    case 'rect':o={t:'rect',x:5,y:5,w:34,h:20,...s,sw:lw};break;
    case 'ellipse':o={t:'ellipse',x:5,y:4,w:34,h:22,...s,sw:lw};break;
    case 'arrow':o={t:'arrow',x1:5,y1:23,x2:38,y2:7,...s,sw:Math.min(lw,3)};break;
    case 'line':o={t:'arrow',x1:5,y1:23,x2:38,y2:7,...s,head:0,sw:Math.min(lw,3)};break;
    case 'num':o={t:'num',x:22,y:15,n:1,...s,size:24,sw:Math.min(lw,2)};break;
    case 'text':o={t:'text',x:4,y:6,text:'Aa',...s,size:14};break;
    case 'pen':o={t:'pen',pts:[[5,22],[15,8],[25,22],[38,8]],...s,sw:lw};break;
    case 'mosaic':{let g='';for(let i=0;i<5;i++)for(let j=0;j<3;j++)g+='<rect x="'+(6+i*6.4)+'" y="'+(5+j*6.6)+'" width="6.4" height="6.6" fill="'+((i+j)%2?'#9CA3AF':'#D1D5DB')+'"/>';return '<svg viewBox="0 0 44 30">'+g+'</svg>';}
  }
  return '<svg viewBox="0 0 44 30">'+annItem(o)+'</svg>';
}
function renderFavs(){
  $('#favs').innerHTML=P.presets.map((p,i)=>'<button class="fav" data-i="'+i+'" title="'+esc((i<9?(i+1)+'번 · ':'')+p.name)+'">'+presetPreview(p)+(i<9?'<b>'+(i+1)+'</b>':'')+'</button>').join('')+'<button class="favbtn" id="favAdd" title="현재 스타일을 즐겨찾기로 저장">★＋</button><button class="favbtn" id="favMng">관리</button>';markFavs();
}
$('#favs').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='favAdd')addFavorite();else if(b.id==='favMng')manageFavs();else if(b.dataset.i!=null)applyPreset(+b.dataset.i);
});
function applyPreset(i){
  const p=P.presets[i];if(!p)return;
  const l=selList();
  const pk=p.kind==='line'?'arrow':p.kind;
  if(l.length&&tool==='select'&&l.every(q=>kindOf(q)===pk)){
    snap();for(const o of l){const st=clone(p.style);if(o.t==='mosaic')delete st.shape;if(p.kind==='line')st.head=0;Object.assign(o,st);}renderStage();renderInspector();toast('적용: '+p.name);return;
  }
  Object.assign(ST[p.kind],clone(p.style));setTool(p.kind,true);activeFav=i;markFavs();toast((i<9?(i+1)+'번 · ':'')+p.name);
}
function addFavorite(){
  const o=selList()[0],kind=o?kindOf(o):(tool!=='select'?tool:null);
  if(!kind){toast('도형을 선택하거나 도구를 먼저 고르세요');return;}
  if(kind==='img'){toast('이미지는 즐겨찾기에 저장할 수 없어요');return;}
  const name=prompt('즐겨찾기 이름',KIND_NAME[kind]+' '+(P.presets.length+1));if(!name)return;
  P.presets.push({id:uid(),name,kind,style:clone(pickStyle(kind,o||ST[kind]))});savePresets();renderFavs();markDirty();toast('즐겨찾기에 저장했어요 ('+P.presets.length+'번째)');
}
function manageFavs(){
  const draw=()=>{
    const m=modal('<h3>즐겨찾기 관리</h3><p class="hint">1~9번은 숫자키로 바로 불러와요. 이름을 고치거나 순서를 바꾸세요.</p><div class="plist">'+P.presets.map((p,i)=>'<div class="it" data-i="'+i+'">'+presetPreview(p)+'<span style="width:18px">'+(i<9?i+1:'')+'</span><input type="text" value="'+esc(p.name)+'"><button data-a="up">▲</button><button data-a="dn">▼</button><button data-a="del">삭제</button></div>').join('')+'</div><div class="row"><button id="pExp">내보내기</button><button id="pImp">가져오기</button><button id="pReset">기본값으로</button><button class="pri" id="pOk">닫기</button></div>');
    m.addEventListener('input',e=>{const it=e.target.closest('.it');if(it&&e.target.type==='text'){P.presets[+it.dataset.i].name=e.target.value;savePresets();markDirty();}});
    m.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.id==='pOk'){closeModal();renderFavs();return;}
      if(b.id==='pExp'){download(new Blob([JSON.stringify({format:'lecture-presets',presets:P.presets},null,1)],{type:'application/json'}),'즐겨찾기.lecture-presets');return;}
      if(b.id==='pImp'){$('#fPre').click();return;}
      if(b.id==='pReset'){if(confirm('즐겨찾기를 기본값으로 되돌릴까요?')){P.presets=defPresets();savePresets();draw();renderFavs();}return;}
      const it=b.closest('.it');if(!it)return;const i=+it.dataset.i,a=b.dataset.a;
      if(a==='del'){P.presets.splice(i,1);}else if(a==='up'&&i>0){[P.presets[i-1],P.presets[i]]=[P.presets[i],P.presets[i-1]];}else if(a==='dn'&&i<P.presets.length-1){[P.presets[i+1],P.presets[i]]=[P.presets[i],P.presets[i+1]];}
      savePresets();markDirty();draw();renderFavs();
    });
  };
  draw();
}
$('#fPre').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const d=JSON.parse(await readFileText(f));const list=d.presets||d;if(!Array.isArray(list))throw 0;P.presets=list.map(p=>({...p,id:uid()}));savePresets();renderFavs();markDirty();closeModal();toast('즐겨찾기 '+list.length+'개를 가져왔어요');}
  catch(err){toast('즐겨찾기 파일을 읽을 수 없어요');}
});

/* ===================== 마우스 조작 ===================== */
function pt(e){const r=box.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
function makeObj(kind,extra){const o={id:uid(),t:kind,...clone(ST[kind]),...extra};if(kind==='line'){o.t='arrow';o.head=0;}return o;}
function normRect(a,b,shift){let x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);if(shift){const m=Math.max(w,h);w=h=m;x=b.x<a.x?a.x-m:a.x;y=b.y<a.y?a.y-m:a.y;}return {x,y,w,h};}
const CUR={nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize',a1:'move',a2:'move'};
function frameHandles(fr){
  if(fr.locked)return [];
  const b=fr.box,cx=b.x+b.w/2,cy=b.y+b.h/2;let hs=[];
  if(fr.single&&fr.single.t==='arrow')hs=handlesOf(fr.single);
  else if(!fr.single||isBoxy(fr.single))hs=boxHandles(b).map(h=>{const q=rotP(h.x,h.y,cx,cy,fr.rot);return {n:h.n,x:q.x,y:q.y};});
  if(rotatable(fr.list)&&!(cropId&&fr.single&&fr.single.id===cropId)){const q=rotP(cx,b.y-34/view.s,cx,cy,fr.rot);hs.push({n:'rot',x:q.x,y:q.y});}
  return hs;
}
function handleAt(fr,p){const hs=12/view.s;for(const hd of frameHandles(fr))if(Math.abs(hd.x-p.x)<=hs&&Math.abs(hd.y-p.y)<=hs)return hd;return null;}
const ROT_SVG="<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 4a8 8 0 1 0 7.5 5.2' fill='none' stroke='white' stroke-width='4.5' stroke-linecap='round'/><path d='M12 4a8 8 0 1 0 7.5 5.2' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'/><path d='M21 2.5v8h-8z' fill='black' stroke='white' stroke-width='1.2'/></svg>";
const ROT_CURSOR='url("data:image/svg+xml,'+encodeURIComponent(ROT_SVG)+'") 12 12, grab';
const BASE_ANG={e:0,se:45,s:90,sw:135,w:180,nw:225,n:270,ne:315},CUR4=['ew-resize','nwse-resize','ns-resize','nesw-resize'];
function cursorFor(n,rot){
  if(n==='rot')return ROT_CURSOR;if(n==='a1'||n==='a2')return 'move';
  const a=((BASE_ANG[n]+(rot||0))%360+360)%360;return CUR4[Math.round(a/45)%4];
}
function updateCursor(e){
  if(drag||document.querySelector('.te'))return;
  let c=tool==='select'?'default':(tool==='text'?'text':'crosshair');
  if(spaceDown){box.style.cursor='grab';return;}
  if(tool==='select'&&!editText){
    const p=pt(e),fr=selFrame(),hd=fr&&handleAt(fr,p);
    if(hd)c=cursorFor(hd.n,fr.rot);
    else if(hitTest(curSlide().objects,p.x,p.y,8/view.s+2))c='move';
  }
  box.style.cursor=c;
}
box.addEventListener('pointerdown',e=>{
  if(e.button!==0||editText||document.querySelector('.te'))return;
  const p=pt(e),s=curSlide();box.setPointerCapture(e.pointerId);
  if(tool==='select'){
    const fr=selFrame(),hd=fr&&handleAt(fr,p);
    if(hd&&hd.n==='rot'){
      snap();box.style.cursor=ROT_CURSOR;const c={x:fr.box.x+fr.box.w/2,y:fr.box.y+fr.box.h/2};
      drag={kind:'rotate',c,a0:Math.atan2(p.y-c.y,p.x-c.x),origs:fr.list.map(cloneObj),single:!!fr.single};return;
    }
    if(hd){
      snap();box.style.cursor=cursorFor(hd.n,fr.rot);
      if(fr.single)drag={kind:(cropId&&fr.single.id===cropId?'crop':'resize'),h:hd.n,orig:cloneObj(fr.single),id:fr.single.id,start:p};
      else drag={kind:'resizeM',h:hd.n,box0:{...fr.box},origs:fr.list.map(cloneObj),start:p};
      return;
    }
    const hit=hitTest(s.objects,p.x,p.y,8/view.s+2,e.altKey);
    if(hit){
      if(hit.locked){setSel([hit.id]);drag=null;renderUI();renderInspector();toast('잠긴 도형이에요 · 오른쪽 패널에서 잠금을 풀 수 있어요');return;}
      if(e.shiftKey){
        const cur2=selIds(),mem=hit.gid?s.objects.filter(q=>q.gid===hit.gid).map(q=>q.id):[hit.id];
        setSel(cur2.includes(hit.id)?cur2.filter(id=>!mem.includes(id)):cur2.concat(hit.id));
        drag=null;renderUI();renderInspector();return;
      }
      if(!selIds().includes(hit.id))setSel([hit.id]);
      snap();drag={kind:'move',origs:selList().map(cloneObj),start:p,moved:false};drag.box0=unionBox(drag.origs);renderUI();renderInspector();
    }else{
      const base=e.shiftKey?selIds():[];if(!e.shiftKey)setSel([]);
      drag={kind:'marquee',start:p,base};marq={x:p.x,y:p.y,w:0,h:0};renderUI();renderInspector();
    }
    return;
  }
  if(tool==='num'){snap();const o=makeObj('num',{x:p.x,y:p.y,n:nextNum});nextNum++;s.objects.push(o);renderStage();renderInspector();return;}
  if(tool==='text'){drag={kind:'text',start:p};return;}
  if(tool==='pen'||(tool==='mosaic'&&ST.mosaic.shape==='free')){drag={kind:'free',pts:[[p.x,p.y]]};draft=tool==='pen'?makeObj('pen',{pts:drag.pts}):makeObj('mosaic',{shape:'free',pts:drag.pts});renderUI();return;}
  drag={kind:'draw',start:p};
});
box.addEventListener('pointermove',e=>{
  if(!drag){updateCursor(e);return;}const p=pt(e),s=curSlide();
  if(drag.kind==='move'){
    let dx=p.x-drag.start.x,dy=p.y-drag.start.y;
    if(!drag.moved&&Math.hypot(dx,dy)<3/view.s)return;drag.moved=true;
    let lx=false,ly=false;
    if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy)){dy=0;ly=true;}else{dx=0;lx=true;}}
    const sn=snapMove(drag,dx,dy,e.altKey);if(!lx)dx=sn[0];if(!ly)dy=sn[1];
    for(const og of drag.origs){const o=findObj(og.id);if(o&&!o.locked)moveObj(o,og,dx,dy);}
    renderStage();
  }else if(drag.kind==='resize'){
    const o=findObj(drag.id);if(!o)return;resizeObj(o,drag,p,e.shiftKey);renderStage();
  }else if(drag.kind==='crop'){
    const o=findObj(drag.id);if(!o)return;cropResize(o,drag,p);renderStage();renderInspector();
  }else if(drag.kind==='resizeM'){
    const b1=boxResize(drag.box0,drag.h,p.x-drag.start.x,p.y-drag.start.y,e.shiftKey);
    for(const og of drag.origs){const o=findObj(og.id);if(o)scaleObj(o,og,drag.box0,b1);}
    renderStage();
  }else if(drag.kind==='rotate'){
    let deg=(Math.atan2(p.y-drag.c.y,p.x-drag.c.x)-drag.a0)*180/Math.PI;
    const o1=drag.origs[0];
    if(e.shiftKey){if(drag.single&&o1.t!=='arrow'&&!o1.pts)deg=Math.round(((o1.rot||0)+deg)/15)*15-(o1.rot||0);else deg=Math.round(deg/15)*15;}
    for(const og of drag.origs){const o=findObj(og.id);if(o)rotateObj(o,og,drag.c,deg);}
    renderStage();
  }else if(drag.kind==='marquee'){
    marq=normRect(drag.start,p,false);renderUI();
  }else if(drag.kind==='draw'){
    if(tool==='arrow'||tool==='line'){let x2=p.x,y2=p.y;if(e.shiftKey){const dx=p.x-drag.start.x,dy=p.y-drag.start.y,L=Math.hypot(dx,dy),a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);x2=drag.start.x+Math.cos(a)*L;y2=drag.start.y+Math.sin(a)*L;}draft=makeObj(tool,{x1:drag.start.x,y1:drag.start.y,x2,y2});}
    else{const r=normRect(drag.start,p,e.shiftKey);draft=tool==='mosaic'?makeObj('mosaic',r):makeObj(tool,r);}
    renderUI();
  }else if(drag.kind==='free'){
    const l=drag.pts[drag.pts.length-1];if(Math.hypot(p.x-l[0],p.y-l[1])>1.5)drag.pts.push([p.x,p.y]);renderUI();
  }
});
function endDrag(e){
  if(!drag)return;const d=drag;drag=null;guides=[];const s=curSlide();
  if(d.kind==='text'){startText(d.start);return;}
  if(d.kind==='marquee'){
    const m=marq;marq=null;
    if(m&&(m.w>3||m.h>3)){const ids=s.objects.filter(o=>{if(o.locked)return false;const b=rbox(o);return b.x<m.x+m.w&&b.x+b.w>m.x&&b.y<m.y+m.h&&b.y+b.h>m.y;}).map(o=>o.id);setSel(d.base.concat(ids));}
    renderUI();renderInspector();return;
  }
  if(d.kind==='move'){if(!d.moved)undo.pop();renderStage();return;}
  if(d.kind==='resize'||d.kind==='resizeM'||d.kind==='rotate'||d.kind==='crop'){renderStage();return;}
  if(d.kind==='draw'&&draft){
    const b=bbox(draft);const ok=draft.t==='arrow'?Math.hypot(draft.x2-draft.x1,draft.y2-draft.y1)>6:(b.w>5&&b.h>5);
    if(ok){snap();s.objects.push(draft);}
  }else if(d.kind==='free'&&draft){
    if(draft.t==='pen'||d.pts.length>3){snap();s.objects.push(draft);}
  }
  draft=null;renderStage();
}
box.addEventListener('pointerup',endDrag);box.addEventListener('pointercancel',endDrag);
function resizeObj(o,d,p,shift){
  const og=d.orig;
  if(d.h==='a1'){o.x1=p.x;o.y1=p.y;if(shift){const dx=o.x1-o.x2,dy=o.y1-o.y2,L=Math.hypot(dx,dy),a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);o.x1=o.x2+Math.cos(a)*L;o.y1=o.y2+Math.sin(a)*L;}return;}
  if(d.h==='a2'){o.x2=p.x;o.y2=p.y;if(shift){const dx=o.x2-o.x1,dy=o.y2-o.y1,L=Math.hypot(dx,dy),a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);o.x2=o.x1+Math.cos(a)*L;o.y2=o.y1+Math.sin(a)*L;}return;}
  /* 회전된 도형도 맞는 방향으로 늘어나도록 변화량을 도형 기준 좌표로 바꿔서 계산 */
  const rot=(og.rot||0)*Math.PI/180,cs=Math.cos(rot),sn=Math.sin(rot),dx=p.x-d.start.x,dy=p.y-d.start.y;
  const dxl=dx*cs+dy*sn,dyl=-dx*sn+dy*cs,b0={x:og.x,y:og.y,w:og.w,h:og.h};
  const b1=boxResize(b0,d.h,dxl,dyl,(o.t==='img')!==shift);
  const c0={x:b0.x+b0.w/2,y:b0.y+b0.h/2},off={x:b1.x+b1.w/2-c0.x,y:b1.y+b1.h/2-c0.y};
  const cw={x:c0.x+off.x*cs-off.y*sn,y:c0.y+off.x*sn+off.y*cs};
  o.w=b1.w;o.h=b1.h;o.x=cw.x-b1.w/2;o.y=cw.y-b1.h/2;
}
box.addEventListener('dblclick',e=>{
  if(tool!=='select'||editText)return;const p=pt(e),o=hitTest(curSlide().objects,p.x,p.y,8/view.s+2);
  if(!o)return;
  if(o.t==='text'){setSel([o.id]);openTextEditor(o,false);}
  else if(o.t==='img'){setSel([o.id]);startCrop();}
  else if(o.t==='num'){const v=prompt('번호',o.n);if(v!=null&&v!==''){snap();o.n=isNaN(+v)?v:+v;renderStage();}}
});
function startText(p){
  snap();const o=makeObj('text',{x:p.x,y:p.y,text:''});curSlide().objects.push(o);setSel([o.id]);openTextEditor(o,true);
}
function openTextEditor(o,isNew){
  const m=textMetrics(o);const ta=document.createElement('textarea');ta.className='te';
  ta.value=o.text;ta.style.cssText='left:'+o.x+'px;top:'+o.y+'px;font-size:'+o.size+'px;font-weight:'+(o.bold?700:400)+';font-style:'+(o.italic?'italic':'normal')+';text-align:'+(o.align||'left')+';line-height:'+(o.lh||1.25)+';font-family:'+fontOf(o)+';min-width:'+Math.max(160,m.w)+'px;width:'+Math.max(160,m.w+20)+'px;height:'+Math.max(m.h,o.size*1.6)+'px;padding:'+(o.size*0.2)+'px '+(o.size*0.3)+'px;transform-origin:0 0;';
  box.appendChild(ta);ta.focus();ta.select();
  let done=false;
  const fit=()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+4+'px';};
  ta.addEventListener('input',fit);fit();
  const commit=()=>{
    if(done)return;done=true;const v=ta.value;ta.remove();
    if(!v.trim()){if(isNew){const s=curSlide();s.objects=s.objects.filter(x=>x.id!==o.id);sel=null;}}
    else{o.text=v;}
    if(isNew)setTool('select');sel=o.text?o.id:null;renderStage();renderInspector();markDirty();
  };
  ta.addEventListener('blur',commit);
  ta.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){ta.value=isNew?'':o.text;commit();}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){commit();}});
  ta.addEventListener('pointerdown',e=>e.stopPropagation());
}

/* ===================== 슬라이드 조작 ===================== */
function addBlank(){if(editMaster)return;snap();const s=blankSlide(),cs=curSlide();s.bg=cs.bg;s.bgOwn=cs.bgOwn;s.master=cs.master==='none'&&cs.type!=='blank'?undefined:cs.master;P.slides.splice(cur+1,0,s);go(cur+1);}
function dupSlide(){if(editMaster)return;snap();const o=curSlide(),s={...clone({...o,_base:undefined}),id:uid()};P.slides.splice(cur+1,0,s);go(cur+1);}
function delSlide(){
  if(editMaster)return;snap();
  if(P.slides.length===1){P.slides[0]=blankSlide();go(0);return;}
  P.slides.splice(cur,1);go(Math.min(cur,P.slides.length-1));
}
function moveSlide(d){if(editMaster)return;const j=cur+d;if(j<0||j>=P.slides.length)return;snap();const [m]=P.slides.splice(cur,1);P.slides.splice(j,0,m);cur=j;renderAll();}
$('#thumbs').addEventListener('click',e=>{
  const b=e.target.closest('button[data-op]');if(!b)return;
  if(b.dataset.op==='sz'){setThumbSize(+b.dataset.w);return;}
  ({add:addBlank,dup:dupSlide,del:delSlide,up:()=>moveSlide(-1),down:()=>moveSlide(1)})[b.dataset.op]();
});
function deleteSel(){const s=curSlide(),ids=new Set(selIds().filter(id=>!findObj(id).locked));if(!ids.size){if(sel)toast('잠긴 도형은 지울 수 없어요 · 먼저 잠금을 풀어주세요');return;}snap();const hadNum=s.objects.some(o=>ids.has(o.id)&&o.t==='num');s.objects=s.objects.filter(o=>!ids.has(o.id));sel=null;msel=[];if(hadNum&&autoRenum)renumber();renderStage();renderInspector();}

/* ===================== 이미지 넣기/붙여넣기 ===================== */
async function addImage(dataURL){
  const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=dataURL;});
  const aid=uid();P.assets[aid]=dataURL;imgCache.set(aid,Promise.resolve(im));
  const m=24,sc=Math.min((W-m*2)/im.naturalWidth,(H-m*2)/im.naturalHeight,1.6),w=im.naturalWidth*sc,h=im.naturalHeight*sc;
  const obj={id:uid(),t:'img',src:aid,x:(W-w)/2,y:(H-h)/2,w,h};
  snap();let s=curSlide();
  const empty=s.type==='blank'&&!s.objects.length;
  if(!editMaster&&pasteMode==='new'&&!empty){const ns=blankSlide();ns.bg=s.bg;ns.bgOwn=s.bgOwn;ns.master=s.master==='none'?undefined:s.master;P.slides.splice(cur+1,0,ns);cur++;s=ns;}
  else if(pasteMode==='here'&&s.objects.some(o=>o.t==='img')){obj.x+=24;obj.y+=24;}
  s.objects.push(obj);
  sel=null;nextNum=1;renderAll();toast('이미지를 넣었어요');
}
async function addImageFiles(files){for(const f of files){if(f.type.startsWith('image/'))await addImage(await readFileURL(f));}}
document.addEventListener('paste',async e=>{
  if(IS_AUD||pres)return;
  const t=e.target;if(t&&(t.tagName==='INPUT'&&t.type==='text'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
  const items=[...(e.clipboardData&&e.clipboardData.items||[])];
  const img=items.find(i=>i.type.startsWith('image/'));
  if(img){e.preventDefault();await addImageFiles([img.getAsFile()]);return;}
  const txt=e.clipboardData&&e.clipboardData.getData('text/plain')||'';
  if(/^\s*(<!doctype html|<html)/i.test(txt)){e.preventDefault();openImportDialog(txt,'붙여넣은 HTML');return;}
  if(clipObj&&clipObj.length){e.preventDefault();snap();const ns=dupObjs(clipObj,24,24);clipObj=ns.map(cloneObj);curSlide().objects.push(...ns);setSel(ns.map(o=>o.id));renderStage();renderInspector();}
});
window.addEventListener('dragover',e=>e.preventDefault());
window.addEventListener('drop',async e=>{
  if(IS_AUD)return;e.preventDefault();const fs=[...e.dataTransfer.files];if(!fs.length)return;
  for(const f of fs){
    if(f.type.startsWith('image/'))await addImage(await readFileURL(f));
    else if(/\.html?$/i.test(f.name))openImportDialog(await readFileText(f),f.name);
    else if(/\.pdf$/i.test(f.name)||f.type==='application/pdf')openPdfDialog(f);
    else if(/\.lecture$/i.test(f.name)||/\.json$/i.test(f.name)){if(!dirty||confirm('저장하지 않은 변경이 있어요. 그래도 열까요?'))openText(await readFileText(f),null);}
  }
});

/* ===================== 저장/열기/자동저장 ===================== */
function usedAssets(){const u=new Set();P.slides.concat(P.masters||[]).forEach(s=>s.objects.forEach(o=>{if(o.t==='img')u.add(o.src);}));return u;}
function serialize(){
  const u=usedAssets(),assets={};for(const k of u)if(P.assets[k])assets[k]=P.assets[k];
  const uh=new Set(P.slides.filter(s=>s.type==='html').map(s=>s.htmlId)),htmls={};for(const k of uh)if(P.htmls[k])htmls[k]=P.htmls[k];
  return JSON.stringify({format:'lecture-slides',version:1,title:P.title,ratio:P.ratio||'16:9',slides:P.slides,masters:P.masters||[],assets,htmls,presets:P.presets,savedAt:new Date().toISOString()},(k,v)=>k[0]==='_'?undefined:v);
}
function loadProject(d){
  if(!d||d.format!=='lecture-slides')throw new Error('강의슬라이드 파일이 아니에요');
  if(editMaster){editMaster=null;document.body.classList.remove('mm');$('#mbar').hidden=true;}
  P={title:d.title||'제목 없는 강의',ratio:d.ratio==='4:3'?'4:3':'16:9',masters:d.masters||[],slides:d.slides&&d.slides.length?d.slides:[blankSlide()],assets:d.assets||{},htmls:d.htmls||{},presets:d.presets&&d.presets.length?d.presets:(loadPresets()||defPresets())};
  imgCache.clear();undo=[];redo=[];sel=null;editText=false;dirty=false;$('#dirty').textContent='';
  $('#title').value=P.title;for(const [,t] of thumbEls)t.el.remove();thumbEls.clear();stageEl._ok=0;stageEl._sid=null;applyRatio(P.ratio);
  renderFavs();go(0);P.slides.filter(s=>s.type==='html'&&!s.thumb).forEach(queueThumb);
}
function openText(text,handle){try{loadProject(JSON.parse(text));fileHandle=handle;toast('열었어요: '+P.title);}catch(err){toast('열 수 없어요: '+err.message);}}
async function saveProject(as){
  const data=serialize();
  try{
    if(window.showSaveFilePicker){
      if(!fileHandle||as)fileHandle=await window.showSaveFilePicker({suggestedName:(P.title||'강의')+'.lecture',types:[{description:'강의슬라이드 프로젝트',accept:{'application/json':['.lecture']}}]});
      const w=await fileHandle.createWritable();await w.write(data);await w.close();
      toast('저장했어요: '+fileHandle.name);
    }else{download(new Blob([data],{type:'application/json'}),(P.title||'강의')+'.lecture');toast('파일로 내려받았어요');}
    dirty=false;$('#dirty').textContent='저장됨';setTimeout(()=>{if(!dirty)$('#dirty').textContent='';},2500);
  }catch(err){if(err&&err.name==='AbortError')return;toast('저장 실패: '+(err&&err.message||err));}
}
async function openProject(){
  if(dirty&&!confirm('저장하지 않은 변경이 있어요. 그래도 열까요?'))return;
  if(window.showOpenFilePicker){
    try{const [h]=await window.showOpenFilePicker({types:[{description:'강의슬라이드 프로젝트',accept:{'application/json':['.lecture','.json']}}]});openText(await (await h.getFile()).text(),h);}catch(err){}
  }else $('#fOpen').click();
}
$('#fOpen').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(f)openText(await readFileText(f),null);});
const idb={
  open(){return new Promise((res,rej)=>{const r=indexedDB.open('lecture-slides',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});},
  async set(k,v){const d=await this.open();return new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error);});},
  async get(k){const d=await this.open();return new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
};
async function autosave(){try{await idb.set('auto',serialize());}catch(e){}}
async function offerRestore(){
  try{
    const v=await idb.get('auto');if(!v)return;const d=JSON.parse(v);
    if(!(d.slides&&(d.slides.length>1||d.slides[0].objects.length||d.slides[0].type==='html')))return;
    const b=document.createElement('div');b.id='banner';b.innerHTML='<span>저장하지 못한 이전 작업이 있어요 ('+esc(d.title||'')+')</span><button id="rOk">복구</button><button id="rNo">무시</button>';document.body.appendChild(b);
    $('#rOk',b).onclick=()=>{loadProject(d);b.remove();markDirty();};$('#rNo',b).onclick=()=>b.remove();
  }catch(e){}
}
async function exportPNG(){
  const s=curSlide();if(s.type==='html'){toast('HTML 슬라이드는 PNG 저장이 안 돼요. 발표 화면에서 캡처해 주세요');return;}
  const base=await composeBase(s),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(base,0,0);
  for(const o of s.objects){if(o.t!=='mosaic')continue;const r=await mosaicCanvas(o,s);if(r)g.drawImage(r.cv,r.x,r.y);}
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+(masterOf(s)?annotations(masterObjs(masterOf(s),s,{})):'')+annotations(s.objects)+'</svg>';
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
  g.drawImage(img,0,0);c.toBlob(b=>download(b,(P.title||'슬라이드')+'-'+(cur+1)+'.png'));
}

/* ===================== 인쇄 / PDF 저장 ===================== */
async function buildPrintRoot(opts){
  const root=$('#printRoot');root.innerHTML='';
  const list=opts.range==='cur'?[curSlide()]:P.slides,pending=[];
  for(const s of list){
    const pg=document.createElement('div');pg.className='pp'+(opts.notes?' notes':'');
    const ph=document.createElement('div');ph.className='ph';const r=document.createElement('div');ph.appendChild(r);pg.appendChild(ph);
    paintSlide(r,s,null,{print:true});pending.push(...r._pend);
    if(opts.notes){const n=document.createElement('div');n.className='pn';n.textContent=s.notes||'';pg.appendChild(n);}
    root.appendChild(pg);
  }
  await Promise.all(pending);
  await Promise.all([...root.querySelectorAll('img')].map(im=>(im.decode?im.decode():Promise.resolve()).catch(()=>{})));
  await Promise.all([...root.querySelectorAll('iframe')].map(f=>new Promise(res=>{f.addEventListener('load',()=>setTimeout(res,500));setTimeout(res,3500);})));
  let st=$('#pgstyle');if(!st){st=document.createElement('style');st.id='pgstyle';document.head.appendChild(st);}
  st.textContent=opts.notes?'@page{size:A4 portrait;margin:12mm}':'@page{size:'+W+'px '+H+'px;margin:0}';
}
async function printSlides(opts){
  toast('인쇄 준비 중…');
  await buildPrintRoot(opts);
  const done=()=>{$('#printRoot').innerHTML='';window.removeEventListener('afterprint',done);};
  window.addEventListener('afterprint',done);
  window.print();
}
function showPrintDialog(){
  const m=modal('<h3>인쇄 / PDF로 저장</h3>'
    +'<p><b>범위</b></p><label><input type="radio" name="pr" value="all" checked> 전체 슬라이드 ('+P.slides.length+'장)</label><br><label><input type="radio" name="pr" value="cur"> 지금 슬라이드만</label>'
    +'<p><b>모양</b></p><label><input type="radio" name="pm" value="slides" checked> 슬라이드만 (한 페이지에 한 장, 16:9)</label><br><label><input type="radio" name="pm" value="notes"> 슬라이드 + 발표자 메모 (A4 세로)</label>'
    +'<p class="hint">다음에 열리는 인쇄창에서 대상(프린터)을 「PDF로 저장」으로 고르면 PDF 파일이 만들어져요. HTML 슬라이드 위의 모자이크/블러는 인쇄에서 회색 상자로 가려져요.</p>'
    +'<div class="row"><button class="pri" id="prGo">인쇄창 열기</button><button id="prNo">취소</button></div>');
  $('#prNo',m).onclick=closeModal;
  $('#prGo',m).onclick=()=>{const v=n=>m.querySelector('input[name='+n+']:checked').value;const o={range:v('pr'),notes:v('pm')==='notes'};closeModal();printSlides(o);};
}

/* ===================== HTML 슬라이드 섬네일 만들기 ===================== */
const thumbQ=[];let thumbBusy=false;
function queueThumb(s){if(s&&s.type==='html'&&!thumbQ.includes(s.id))thumbQ.push(s.id);runThumbQ();}
async function runThumbQ(){
  if(thumbBusy||IS_AUD)return;thumbBusy=true;let n=0;const total=thumbQ.length;
  while(thumbQ.length){
    const id=thumbQ.shift();const s=P.slides.find(x=>x.id===id);if(!s||s.type!=='html')continue;
    n++;if(total>3)$('#stHint').textContent='HTML 슬라이드 섬네일 만드는 중… '+n+'/'+total;
    await makeThumb(s);
  }
  thumbBusy=false;if(total>3)$('#stHint').textContent=HINTS[tool]||'';
}
function makeThumb(s){
  return new Promise(res=>{
    const f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts');
    f.style.cssText='position:fixed;left:-4000px;top:0;width:'+W+'px;height:'+H+'px;border:0;visibility:hidden';
    f.srcdoc=buildSrcdoc(s,true);
    const t=setTimeout(done,9000);
    function onmsg(e){const m=e.data;if(e.source!==f.contentWindow||!m||m.ls!==1||m.t!=='thumb')return;if(m.url){s.thumb=m.url;const th=thumbEls.get(s.id);if(th)paintSlide(th.root,s,null,{thumb:true});}done();}
    function done(){clearTimeout(t);window.removeEventListener('message',onmsg);f.remove();res();}
    window.addEventListener('message',onmsg);document.body.appendChild(f);
  });
}

/* ===================== 확대/축소 · 화면 이동 ===================== */
function zoomAt(f,cx,cy){
  const vp=$('#viewport'),vr=vp.getBoundingClientRect();if(cx==null){cx=vr.left+vr.width/2;cy=vr.top+vr.height/2;}
  const r=$('#boxOuter').getBoundingClientRect(),s0=view.s,lx=(cx-r.left)/s0,ly=(cy-r.top)/s0;
  view.z=clamp(view.z*f,1,8);fitStage();
  const r2=$('#boxOuter').getBoundingClientRect();view.px+=cx-(r2.left+lx*view.s);view.py+=cy-(r2.top+ly*view.s);fitStage();renderUI();
}
function zoomFit(){view.z=1;view.px=0;view.py=0;fitStage();renderUI();}
$('#viewport').addEventListener('wheel',e=>{
  if(IS_AUD||pres)return;
  if(e.ctrlKey||e.metaKey){e.preventDefault();zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY);}
  else if(view.z>1){e.preventDefault();if(e.shiftKey)view.px-=e.deltaY;else{view.px-=e.deltaX;view.py-=e.deltaY;}fitStage();}
},{passive:false});
$('#viewport').addEventListener('pointerdown',e=>{
  if(IS_AUD||pres)return;
  if(!(e.button===1||(e.button===0&&spaceDown)))return;
  e.preventDefault();e.stopPropagation();
  const sx=e.clientX,sy=e.clientY,px0=view.px,py0=view.py,vp=$('#viewport');vp.style.cursor='grabbing';
  const mv=ev=>{view.px=px0+ev.clientX-sx;view.py=py0+ev.clientY-sy;fitStage();};
  const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);vp.style.cursor='';};
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);
},true);
document.addEventListener('keydown',e=>{
  if(e.code!=='Space'||IS_AUD||pres)return;
  const t=e.target,tn=t&&t.tagName;if(tn==='INPUT'&&!['color','range','checkbox'].includes(t.type)||tn==='TEXTAREA'||tn==='BUTTON'&&false||(t&&t.isContentEditable)||document.querySelector('.te')||$('#modals').firstChild)return;
  e.preventDefault();if(!spaceDown){spaceDown=true;box.style.cursor='grab';}
});
document.addEventListener('keyup',e=>{if(e.code==='Space'&&spaceDown){spaceDown=false;box.style.cursor=tool==='select'?'default':(tool==='text'?'text':'crosshair');}});
window.addEventListener('blur',()=>{spaceDown=false;});

/* ===================== 이미지 자르기 ===================== */
function startCrop(){const l=selList();if(l.length!==1||l[0].t!=='img')return;if(l[0].locked){toast('잠긴 이미지는 자를 수 없어요');return;}cropId=l[0].id;renderUI();renderInspector();toast('가장자리를 끌어서 자르세요 · Enter 로 끝내기');}
function cropFrame(o,c){return {Fw:o.w/(1-c.l-c.r),Fh:o.h/(1-c.t-c.b)};}
function cropPlace(o,og,nb){
  const rot=(og.rot||0)*Math.PI/180,cs=Math.cos(rot),sn=Math.sin(rot),c0={x:og.x+og.w/2,y:og.y+og.h/2},off={x:nb.x+nb.w/2-c0.x,y:nb.y+nb.h/2-c0.y};
  const cw={x:c0.x+off.x*cs-off.y*sn,y:c0.y+off.x*sn+off.y*cs};o.w=nb.w;o.h=nb.h;o.x=cw.x-nb.w/2;o.y=cw.y-nb.h/2;
}
function cropResize(o,d,p){
  const og=d.orig,c0=og.crop||{l:0,t:0,r:0,b:0},{Fw,Fh}=cropFrame(og,c0);
  const rot=(og.rot||0)*Math.PI/180,cs=Math.cos(rot),sn=Math.sin(rot),dx=p.x-d.start.x,dy=p.y-d.start.y,dxl=dx*cs+dy*sn,dyl=-dx*sn+dy*cs;
  const cl=og.flip?c0.r:c0.l,cr=og.flip?c0.l:c0.r;
  const fullL=og.x-cl*Fw,fullR=og.x+og.w+cr*Fw,fullT=og.y-c0.t*Fh,fullB=og.y+og.h+c0.b*Fh;
  let x1=og.x,x2=og.x+og.w,y1=og.y,y2=og.y+og.h;
  if(d.h.includes('w'))x1=clamp(x1+dxl,fullL,x2-10);if(d.h.includes('e'))x2=clamp(x2+dxl,x1+10,fullR);
  if(d.h.includes('n'))y1=clamp(y1+dyl,fullT,y2-10);if(d.h.includes('s'))y2=clamp(y2+dyl,y1+10,fullB);
  const ncl=(x1-fullL)/Fw,ncr=(fullR-x2)/Fw,nct=(y1-fullT)/Fh,ncb=(fullB-y2)/Fh;
  o.crop=og.flip?{l:ncr,r:ncl,t:nct,b:ncb}:{l:ncl,r:ncr,t:nct,b:ncb};
  cropPlace(o,og,{x:x1,y:y1,w:x2-x1,h:y2-y1});
}
function cropReset(){
  const l=selList();if(l.length!==1||l[0].t!=='img'||!l[0].crop)return;const o=l[0];snap();
  const og=cloneObj(o),c=og.crop,{Fw,Fh}=cropFrame(og,c),cl=og.flip?c.r:c.l;
  cropPlace(o,og,{x:og.x-cl*Fw,y:og.y-c.t*Fh,w:Fw,h:Fh});delete o.crop;renderStage();renderInspector();toast('원본 크기로 되돌렸어요');
}

/* ===================== 화면비 ===================== */
function applyRatio(r){
  P.ratio=r==='4:3'?'4:3':'16:9';H=P.ratio==='4:3'?960:720;
  const rs=document.documentElement.style;rs.setProperty('--H',H+'px');rs.setProperty('--phH',(700*H/W)+'px');
  for(const s of ['#ui','#audInk','#pink']){const e=$(s);if(e)e.setAttribute('viewBox','0 0 '+W+' '+H);}
  stageEl._ok=0;for(const [,t] of thumbEls)t.root._ok=0;
  applyLayout();fitStage();
}

/* ===================== 마스터 편집 ===================== */
function enterMaster(create){
  if(editMaster)return;
  const ms=P.masters=P.masters||[],s=P.slides[cur];let m=null;
  if(!create)m=masterOf(s);
  if(!m){snap();m={id:uid(),name:'마스터 '+(ms.length+1),bg:s.bgOwn||!ms.length?s.bg:ms[0].bg,type:'blank',objects:[],notes:''};if(!ms.length&&s.bg==='#FFFFFF')m.bg='#FFFFFF';ms.push(m);s.master=m.id;markDirty();}
  editMaster=m.id;sel=null;msel=[];draft=null;editText=false;cropId=null;nextNum=1;
  document.body.classList.add('mm');$('#mbar').hidden=false;$('#mbName').textContent=m.name;
  setTool('select');renderAll();toast('마스터 편집 · 여기에 넣은 것은 모든 슬라이드 뒤에 깔려요');
}
function exitMaster(){
  if(!editMaster)return;editMaster=null;sel=null;msel=[];draft=null;cropId=null;
  document.body.classList.remove('mm');$('#mbar').hidden=true;
  for(const [,t] of thumbEls)t.root._ok=0;stageEl._ok=0;renderAll();toast('마스터 편집을 마쳤어요');
}
function addPageNo(){
  if(!editMaster)return;snap();const m=curSlide();
  const o={id:uid(),t:'text',...clone(DEF.text),text:'{n} / {total}',size:22,bold:0,bgA:0,color:'#6B7280'};
  const tm=textMetrics(o);o.x=W-tm.w-30;o.y=H-tm.h-18;m.objects.push(o);setSel([o.id]);renderStage();renderInspector();
}
function masterApplyAll(){
  if(!editMaster)return;snap();let n=0;for(const s of P.slides){if(s.type==='html')continue;s.master=editMaster;n++;}
  toast(n+'장에 적용했어요 (HTML 슬라이드 제외)');
}
function masterDelete(){
  const m=curSlide();if(!editMaster)return;if(!confirm('마스터 「'+m.name+'」를 삭제할까요? 이 마스터를 쓰던 슬라이드는 다른 마스터(없으면 없음)로 바뀌어요.'))return;
  snap();P.masters=P.masters.filter(x=>x.id!==m.id);exitMaster();
}
function fillGeom(o,im){
  const sa=W/H,ia=im.naturalWidth/im.naturalHeight,c={l:0,t:0,r:0,b:0};
  if(ia>sa){const k=(1-sa/ia)/2;c.l=k;c.r=k;}else if(ia<sa){const k=(1-ia/sa)/2;c.t=k;c.b=k;}
  o.x=0;o.y=0;o.w=W;o.h=H;o.rot=0;if(c.l||c.t)o.crop=c;else delete o.crop;
}
function bgFill(){
  const l=selList();if(l.length!==1||l[0].t!=='img')return;const o=l[0];
  getImg(o.src).then(im=>{
    if(!im)return;snap();fillGeom(o,im);o.locked=1;o.bgfill=1;
    const s=curSlide();s.objects=s.objects.filter(q=>q!==o);s.objects.unshift(o);
    cropId=null;sel=null;msel=[];renderStage();renderInspector();toast('배경으로 만들었어요 · 잠겨 있어서 안 움직여요 (Alt+클릭으로 선택, 잠금 해제 가능)');
  });
}
async function refitBgs(){
  for(const s of P.slides.concat(P.masters||[]))for(const o of s.objects){if(o.t==='img'&&o.bgfill){const im=await getImg(o.src);if(im)fillGeom(o,im);}}
  renderAll();
}
function changeRatio(r){
  if(r===P.ratio)return;
  if(r==='16:9'&&P.slides.concat(P.masters||[]).some(s=>s.objects.some(o=>{const b=bbox(o);return b.y+b.h>720+2;}))&&!confirm('16:9로 바꾸면 화면 아래쪽(높이 720 밖)에 있던 도형은 안 보이게 돼요. 바꿀까요?')){renderInspector();return;}
  applyRatio(r);markDirty();renderAll();refitBgs();toast('화면비를 '+r+' 로 바꿨어요 (배경으로 만든 이미지는 자동으로 다시 맞춰요)');
}
