'use strict';
/* ===================== 유틸/상수 ===================== */
const W=1280,H=720,IS_AUD=location.hash==='#aud';
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
  rect:{stroke:'#E23B2E',sw:4,fill:'#E23B2E',fillA:0,dash:0,radius:4},
  ellipse:{stroke:'#E23B2E',sw:4,fill:'#E23B2E',fillA:0,dash:0},
  arrow:{stroke:'#2563EB',sw:5,head:1,dash:0},
  num:{shape:'circle',fill:'#E23B2E',stroke:'#FFFFFF',sw:3,color:'#FFFFFF',size:44},
  text:{color:'#1C2026',size:28,bg:'#FFE066',bgA:0.9,bold:1},
  mosaic:{shape:'rect',mode:'pixel',strength:14,color:'#000000'},
  pen:{stroke:'#E23B2E',sw:5,alpha:1}
};
const KIND_NAME={rect:'사각형',ellipse:'원',arrow:'화살표',num:'번호',text:'글자',mosaic:'모자이크',pen:'펜'};
const DASH=[[0,'실선'],[1,'점선'],[2,'짧은 점선']];
const FIELDS={
  rect:[['stroke','선 색','color'],['sw','선 굵기','range',0,24,1],['fill','채움 색','color'],['fillA','채움 농도(0=투명)','range',0,1,.05],['radius','모서리 둥글기','range',0,60,1],['dash','선 모양','select',DASH]],
  ellipse:[['stroke','선 색','color'],['sw','선 굵기','range',0,24,1],['fill','채움 색','color'],['fillA','채움 농도(0=투명)','range',0,1,.05],['dash','선 모양','select',DASH]],
  arrow:[['stroke','색','color'],['sw','굵기','range',1,24,1],['head','화살촉','select',[[1,'한쪽'],[2,'양쪽'],[0,'없음']]],['dash','선 모양','select',DASH]],
  num:[['shape','모양','select',[['circle','원'],['square','사각'],['round','둥근 사각']]],['fill','채움 색','color'],['color','숫자 색','color'],['stroke','테두리 색','color'],['sw','테두리 굵기','range',0,10,1],['size','크기','range',20,120,1]],
  text:[['color','글자 색','color'],['size','글자 크기','range',12,120,1],['bold','굵게','check'],['bg','배경 색','color'],['bgA','배경 농도','range',0,1,.05]],
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
function newProject(){return {title:'제목 없는 강의',slides:[blankSlide()],assets:{},htmls:{},presets:loadPresets()||defPresets()};}
let P=IS_AUD?{assets:{},htmls:{},slides:[],presets:[]}:newProject();
let cur=0,tool='select',sel=null,nextNum=1,dirty=false,fileHandle=null,undo=[],redo=[],lastSnap=0,editText=false,draft=null,drag=null,clipObj=null,pasteMode='new';
const view={s:1};let activeFav=-1,msel=[],marq=null;
const TOOL_NAME={select:'선택',rect:'사각형',ellipse:'원',arrow:'화살표',num:'번호',text:'글자',mosaic:'모자이크',pen:'펜'};
const ST=clone(DEF);
const curSlide=()=>P.slides[cur];
const findObj=id=>curSlide().objects.find(o=>o.id===id);
const kindOf=o=>o&&o.t!=='img'?o.t:null;

function cloneObj(o){const c={...o};if(o.pts)c.pts=o.pts.map(p=>p.slice());return c;}
function snapState(){return {cur,slides:P.slides.map(s=>({...s,objects:s.objects.map(cloneObj),textEdits:s.textEdits?{...s.textEdits}:undefined}))};}
function snap(){undo.push(snapState());if(undo.length>60)undo.shift();redo=[];lastSnap=Date.now();markDirty();}
function restore(st){P.slides=st.slides;cur=clamp(st.cur,0,P.slides.length-1);sel=null;draft=null;renderAll();}
function doUndo(){if(!undo.length)return;redo.push(snapState());restore(undo.pop());markDirty();}
function doRedo(){if(!redo.length)return;undo.push(snapState());restore(redo.pop());markDirty();}
let autoT;
function markDirty(){dirty=true;$('#dirty').textContent='● 변경됨';clearTimeout(autoT);autoT=setTimeout(autosave,2500);}

/* ===================== 기하/히트테스트 ===================== */
function ptsBox(pts,pad){pad=pad||0;let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;for(const p of pts){x1=Math.min(x1,p[0]);y1=Math.min(y1,p[1]);x2=Math.max(x2,p[0]);y2=Math.max(y2,p[1]);}if(x1>x2)return {x:0,y:0,w:0,h:0};return {x:x1-pad,y:y1-pad,w:x2-x1+pad*2,h:y2-y1+pad*2};}
function textMetrics(o){const lines=String(o.text||'').split('\n');mctx.font=(o.bold?700:400)+' '+o.size+'px '+FONT;let w=0;for(const l of lines)w=Math.max(w,mctx.measureText(l).width);const pad=o.size*0.3,vp=o.size*0.2,lh=o.size*1.25;return {w:Math.max(o.size,w)+pad*2,h:lines.length*lh+vp*2,pad,vp,lh,lines};}
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
function hitTest(objs,x,y,tol){const z=zOrdered(objs);for(let i=z.length-1;i>=0;i--)if(hitObj(z[i],x,y,tol))return z[i];return null;}
function moveObj(o,orig,dx,dy){
  if(orig.pts)o.pts=orig.pts.map(p=>[p[0]+dx,p[1]+dy]);
  if('x' in orig)o.x=orig.x+dx;if('y' in orig)o.y=orig.y+dy;
  if('x1' in orig){o.x1=orig.x1+dx;o.y1=orig.y1+dy;o.x2=orig.x2+dx;o.y2=orig.y2+dy;}
}
function isBoxy(o){return o&&(o.t==='rect'||o.t==='ellipse'||o.t==='img'||(o.t==='mosaic'&&o.shape!=='free'));}
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
function unionBox(objs){const bs=objs.map(bbox),x1=Math.min(...bs.map(b=>b.x)),y1=Math.min(...bs.map(b=>b.y)),x2=Math.max(...bs.map(b=>b.x+b.w)),y2=Math.max(...bs.map(b=>b.y+b.h));return {x:x1,y:y1,w:x2-x1,h:y2-y1};}
function selFrame(){const l=selList();if(!l.length)return null;return l.length===1?{single:l[0],box:bbox(l[0]),list:l}:{box:unionBox(l),list:l};}
function unitsOf(list){const m=new Map();for(const o of list){const k=o.gid||o.id;if(!m.has(k))m.set(k,[]);m.get(k).push(o);}return [...m.values()].map(objs=>({objs,box:unionBox(objs)}));}
function dupObjs(list,dx,dy){const gm={};return list.map(o=>{const n=cloneObj(o);n.id=uid();if(n.gid){gm[n.gid]=gm[n.gid]||uid();n.gid=gm[n.gid];}moveObj(n,o,dx,dy);return n;});}
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
      m.lines.forEach((l,i)=>{s+='<text x="'+(o.x+m.pad)+'" y="'+(o.y+m.vp+i*m.lh+o.size*0.95)+'" font-size="'+o.size+'" font-weight="'+(o.bold?700:400)+'" fill="'+o.color+"\" font-family='"+FONT+"' xml:space=\"preserve\">"+esc(l)+'</text>';});
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
const imgCache=new Map();
function getImg(id){
  if(imgCache.has(id))return imgCache.get(id);
  const p=new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=P.assets[id];});
  imgCache.set(id,p);return p;
}
async function composeBase(slide){
  const imgs=slide.objects.filter(o=>o.t==='img');
  const key=slide.bg+'|'+imgs.map(o=>[o.id,o.src,Math.round(o.x),Math.round(o.y),Math.round(o.w),Math.round(o.h)].join()).join(';');
  if(slide._baseKey===key&&slide._base)return slide._base;
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle=slide.bg;g.fillRect(0,0,W,H);
  for(const o of imgs){const im=await getImg(o.src);if(im)g.drawImage(im,o.x,o.y,o.w,o.h);}
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
function buildSrcdoc(s){
  let html=P.htmls[s.htmlId]||'<p style="font:16px sans-serif;padding:30px">HTML 원본을 찾을 수 없어요</p>';
  const cfg={sel:s.sel||'',pick:s.pick==null?-1:s.pick,edits:s.textEdits||{}};
  const css='<style>'+(cfg.pick>=0?'html,body{overflow:hidden!important}':'')+'</style>';
  const inj=css+'<script>('+frameScript.toString()+')('+JSON.stringify(cfg).replace(/</g,'\\u003c')+');<\/script>';
  const m=html.match(/<head[^>]*>/i);
  if(m)return html.replace(m[0],m[0]+inj);
  return inj+html;
}

/* ===================== 슬라이드 그리기(공용) ===================== */
function paintSlide(root,slide,ink,opt){
  opt=opt||{};
  if(root._sid!==slide.id||!root._ok){
    root.innerHTML='<div class="l-bg"></div><div class="l-frame"></div><div class="l-img"></div><div class="l-mos"></div><svg class="l-ann" viewBox="0 0 1280 720" width="1280" height="720"></svg><svg class="l-ink" viewBox="0 0 1280 720" width="1280" height="720"></svg>';
    root._ok=1;root._sid=slide.id;root._fk=null;root._frame=null;root._maps={img:new Map(),mos:new Map()};
    root.style.position='relative';root.style.width=W+'px';root.style.height=H+'px';root.style.overflow='hidden';
  }
  $('.l-bg',root).style.background=slide.bg;
  /* HTML 프레임 */
  const fr=$('.l-frame',root);
  if(slide.type==='html'){
    if(opt.thumb){if(root._fk!=='thumb'){fr.innerHTML='<div class="thumb-html">HTML</div>';root._fk='thumb';root._frame=null;}}
    else{
      const key=frameKey(slide);
      if(root._fk!==key){fr.innerHTML='';const f=document.createElement('iframe');f.className='html-frame';f.setAttribute('sandbox','allow-scripts');f.srcdoc=buildSrcdoc(slide);fr.appendChild(f);root._fk=key;root._frame=f;}
      if(root._frame)root._frame.style.pointerEvents=opt.interactFrame?'auto':'none';
    }
  }else if(root._fk){fr.innerHTML='';root._fk=null;root._frame=null;}
  /* 이미지 */
  const ih=$('.l-img',root),im=root._maps.img,seenI=new Set();
  for(const o of slide.objects){
    if(o.t!=='img')continue;seenI.add(o.id);
    let el=im.get(o.id);
    if(!el){el=new Image();el.draggable=false;el.src=P.assets[o.src]||'';im.set(o.id,el);}
    ih.appendChild(el);
    el.style.cssText='left:'+o.x+'px;top:'+o.y+'px;width:'+o.w+'px;height:'+o.h+'px';
  }
  for(const [id,el] of im)if(!seenI.has(id)){el.remove();im.delete(id);}
  /* 모자이크 */
  const mh=$('.l-mos',root),mm=root._maps.mos,seenM=new Set();
  for(const o of slide.objects){
    if(o.t!=='mosaic')continue;seenM.add(o.id);
    const b=bbox(o);let el=mm.get(o.id);
    if(slide.type==='html'||opt.thumb&&false){
      if(!el||el.tagName!=='DIV'){if(el)el.remove();el=document.createElement('div');mm.set(o.id,el);}
      mh.appendChild(el);
      el.style.cssText='position:absolute;left:'+b.x+'px;top:'+b.y+'px;width:'+b.w+'px;height:'+b.h+'px;'+(o.mode==='solid'?'background:'+o.color+';':'backdrop-filter:blur('+Math.max(2,o.strength*0.6)+'px);')+(o.shape==='ellipse'?'border-radius:50%;':'')+(o.shape==='free'&&o.pts.length>2?'clip-path:polygon('+o.pts.map(p=>(p[0]-b.x)+'px '+(p[1]-b.y)+'px').join(',')+');':'');
    }else{
      if(!el||el.tagName!=='CANVAS'){if(el)el.remove();el=document.createElement('canvas');mm.set(o.id,el);}
      mh.appendChild(el);
      el.style.cssText='position:absolute;left:'+Math.floor(b.x)+'px;top:'+Math.floor(b.y)+'px;';
      const tok=el._tok=(el._tok||0)+1;
      mosaicCanvas(o,slide).then(r=>{if(el._tok!==tok||!r)return;el.width=r.cv.width;el.height=r.cv.height;el.getContext('2d').drawImage(r.cv,0,0);});
    }
  }
  for(const [id,el] of mm)if(!seenM.has(id)){el.remove();mm.delete(id);}
  $('.l-ann',root).innerHTML=annotations(slide.objects);
  if(ink)$('.l-ink',root).innerHTML=annotations(ink);
}

/* ===================== 편집 화면 렌더 ===================== */
const box=$('#box'),stageEl=$('#stage');
function fitStage(){
  const vp=$('#viewport'),vw=vp.clientWidth-32,vh=vp.clientHeight-32,s=Math.max(.1,Math.min(vw/W,vh/H));
  view.s=s;const o=$('#boxOuter');o.style.width=W*s+'px';o.style.height=H*s+'px';
  o.style.left=(vp.clientWidth-W*s)/2+'px';o.style.top=(vp.clientHeight-H*s)/2+'px';
  box.style.transform='scale('+s+')';
  $('#stPos').textContent='';updateStatus();
}
function updateStatus(){$('#stPos').textContent='슬라이드 '+(cur+1)+' / '+P.slides.length+'   ·   화면 '+Math.round(view.s*100)+'%';}
function renderStage(){
  const s=curSlide();
  stageEl.classList.toggle('edit',editText&&s.type==='html');
  paintSlide(stageEl,s,null,{interactFrame:editText&&s.type==='html'});
  box.classList.toggle('sel',tool==='select');
  renderUI();scheduleThumb();
}
function renderUI(){
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
    const hs=11/view.s,bb=fr.box;
    if(fr.list.length>1)for(const q of fr.list){const qb=bbox(q);h+='<rect x="'+qb.x+'" y="'+qb.y+'" width="'+qb.w+'" height="'+qb.h+'" fill="none" stroke="#93B4F8" stroke-width="1" vector-effect="non-scaling-stroke"/>';}
    h+='<rect x="'+bb.x+'" y="'+bb.y+'" width="'+bb.w+'" height="'+bb.h+'" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>';
    for(const hd of (fr.single?handlesOf(fr.single):boxHandles(bb)))h+='<rect x="'+(hd.x-hs/2)+'" y="'+(hd.y-hs/2)+'" width="'+hs+'" height="'+hs+'" fill="#fff" stroke="#2563EB" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
  }
  $('#ui').innerHTML=h;
}
/* 썸네일 */
const thumbEls=new Map();let thumbT;
function scheduleThumb(){clearTimeout(thumbT);thumbT=setTimeout(()=>{const t=thumbEls.get(curSlide().id);if(t)paintSlide(t.root,curSlide(),null,{thumb:true});},250);}
function renderThumbs(){
  const box2=$('#thumbs');
  if(!$('.ops',box2)){box2.innerHTML='<div class="ops"><button data-op="add" title="빈 슬라이드 추가">＋</button><button data-op="dup" title="복제">⧉</button><button data-op="up" title="위로">▲</button><button data-op="down" title="아래로">▼</button><button data-op="del" title="삭제">🗑</button></div>';}
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
function renderAll(){renderThumbs();renderStage();renderInspector();updateStatus();$$('#toolbar .tb').forEach(b=>b.classList.toggle('on',b.dataset.tool===tool));}
function go(i){cur=clamp(i,0,P.slides.length-1);sel=null;draft=null;editText=false;nextNum=1+Math.max(0,...curSlide().objects.filter(o=>o.t==='num').map(o=>+o.n||0));renderAll();}
function setTool(t,keep){tool=t;if(!keep)activeFav=-1;sel=null;draft=null;editText=false;$$('#toolbar .tb').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));box.classList.toggle('sel',t==='select');box.style.cursor=t==='select'?'default':(t==='text'?'text':'crosshair');renderUI();renderInspector();$('#stHint').textContent=HINTS[t]||'';markFavs();}
function markFavs(){$$('#favs .fav').forEach(b=>b.classList.toggle('on',+b.dataset.i===activeFav));const el=$('#stTool');if(el)el.textContent='현재 도구: '+(TOOL_NAME[tool]||'')+(activeFav>=0&&P.presets[activeFav]?' · 즐겨찾기 '+(activeFav+1)+'번 ('+P.presets[activeFav].name+')':'');}
const HINTS={select:'클릭: 선택 · Shift+클릭 또는 빈 곳 드래그: 여러 개 선택 · Ctrl+G: 그룹 · 모서리 점: 크기 · Delete: 삭제 · 숫자키 1~9: 선택한 도형에 즐겨찾기 스타일 적용',rect:'드래그해서 사각형 그리기 (Shift: 정사각형)',ellipse:'드래그해서 원 그리기 (Shift: 정원)',arrow:'드래그해서 화살표 그리기 (Shift: 각도 고정)',num:'클릭하면 번호가 하나씩 늘어나며 찍혀요',text:'클릭해서 글자 넣기 (Ctrl+Enter: 확정)',mosaic:'드래그해서 가리기 · 오른쪽 패널에서 사각/원/자유 영역 선택',pen:'드래그해서 자유롭게 그리기'};

/* ===================== 인스펙터 ===================== */
function ctl(f,val){
  const k=f[0],label=f[1],type=f[2];let inp='';
  if(type==='color')inp='<button type="button" class="cbtn" data-k="'+k+'" data-color="'+val+'" style="background:'+val+'" title="색 선택"></button>';
  else if(type==='range')inp='<div class="rg"><input type="range" data-k="'+k+'" min="'+f[3]+'" max="'+f[4]+'" step="'+f[5]+'" value="'+val+'"><input type="number" class="rn" data-k="'+k+'" min="'+f[3]+'" max="'+f[4]+'" step="'+f[5]+'" value="'+val+'"></div>';
  else if(type==='check')inp='<input type="checkbox" data-k="'+k+'"'+(val?' checked':'')+'>';
  else if(type==='select')inp='<select data-k="'+k+'"'+(NUMERIC_SELECT.has(k)?' data-num="1"':'')+'>'+f[3].map(op=>'<option value="'+op[0]+'"'+(String(op[0])===String(val)?' selected':'')+'>'+op[1]+'</option>').join('')+'</select>';
  return '<div class="fld"><label>'+label+'</label>'+inp+'</div>';
}
function pickStyle(kind,src){const r={};for(const f of FIELDS[kind])r[f[0]]=src[f[0]];return r;}
function renderInspector(){
  const list=selList(),o=list.length===1?list[0]:null,s=curSlide();
  let kind=null;if(list.length){if(list.every(q=>q.t===list[0].t))kind=kindOf(list[0]);}else if(tool!=='select')kind=tool;
  const src=list.length?list[0]:(kind?ST[kind]:null);
  let h='';if(list.length)h+=alignPanelHTML(list);
  if(kind&&src){
    h+='<h4>'+KIND_NAME[kind]+' 스타일'+(list.length>1?' · 선택한 '+list.length+'개':o?' · 선택한 도형':' · 다음에 그릴 도형')+'</h4>';
    for(const f of FIELDS[kind]){if(list.length&&list[0].t==='mosaic'&&f[0]==='shape')continue;h+=ctl(f,src[f[0]]);}
    if(kind==='num')h+='<div class="fld"><label>다음 번호</label><input type="number" id="nn" min="0" value="'+nextNum+'"></div>';
    h+='<button class="btn" id="addFav">★ 이 스타일을 즐겨찾기에 저장</button>';
  }else if(o&&o.t==='img'){h+='<h4>이미지</h4><p class="hint">드래그로 이동, 모서리 점으로 크기 조절, Delete 로 삭제. 위에 모자이크/도형을 올려보세요.</p>';}
  else if(!list.length)h+='<h4>도구</h4><p class="hint">위쪽 도구를 고르거나, 도형을 클릭해서 스타일을 바꿔요. 자주 쓰는 모양은 ★로 저장하고 숫자키 1~9 로 불러오세요.</p>';
  h+='<h4>슬라이드 '+(cur+1)+'</h4>';
  h+='<div class="fld"><label>배경색</label><button type="button" class="cbtn" data-id="bg" data-color="'+s.bg+'" style="background:'+s.bg+'" title="색 선택"></button></div>';
  if(s.type==='html'){
    h+='<button class="btn" id="bEditText">'+(editText?'✔ 텍스트 편집 끝내기':'✎ 텍스트 편집 (E)')+'</button>';
    h+='<p class="hint">HTML 슬라이드는 원본 모양 그대로 보여요. 글자 수정은 위 버튼, 도형·모자이크·펜은 그 위에 얹혀요.</p>';
  }
  h+='<h4>발표자 메모</h4><textarea id="notes" placeholder="발표자 화면에만 보여요">'+esc(s.notes||'')+'</textarea>';
  $('#inspector').innerHTML=h;
}
$('#inspector').addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='nn'){nextNum=Math.max(0,+t.value||0);return;}
  if(t.id==='bg'){if(Date.now()-lastSnap>700)snap();curSlide().bg=t.value;renderStage();return;}
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
  const t=e.target;if(!(t.classList&&t.classList.contains('rn')))return;
  const mn=+t.min,mx=+t.max;let v=+t.value;if(isNaN(v))v=mn;v=Math.min(mx,Math.max(mn,v));t.value=v;
  const rg=t.closest('.rg');if(rg)$('input[type=range]',rg).value=v;
});
$('#inspector').addEventListener('click',e=>{
  if(e.target.id==='addFav')addFavorite();
  if(e.target.id==='bEditText')toggleTextEdit();
  const ac=e.target.closest('[data-act]');if(ac)doAct(ac.dataset.act);
  const cb=e.target.closest('.cbtn');
  if(cb)openColorPopup(cb,cb.dataset.color,v=>{
    cb.style.background=v;cb.dataset.color=v;
    if(cb.dataset.id==='bg'){if(Date.now()-lastSnap>700)snap();curSlide().bg=v;renderStage();}
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
function alignPanelHTML(list){
  const units=unitsOf(list),multi=units.length>1,anyG=list.some(o=>o.gid);
  const B=(a,t,ti)=>'<button data-act="'+a+'" title="'+ti+'">'+t+'</button>';
  let h='<h4>'+(list.length>1?list.length+'개 선택됨':'정렬')+(multi?'':' (슬라이드 기준)')+'</h4>';
  h+='<div class="arow">'+[['al','왼쪽'],['ac','가운데'],['ar','오른쪽'],['at','위'],['am','중간'],['ab','아래']].map(a=>B(a[0],a[1],'맞춤')).join('')+'</div>';
  if(multi){
    h+='<div class="arow">'+B('dh','가로 간격 균등','3개 이상')+B('dv','세로 간격 균등','3개 이상')+'</div>';
    h+='<div class="arow">'+B('sw','너비 같게','처음 선택한 도형 기준')+B('sh','높이 같게','처음 선택한 도형 기준')+B('sb','크기 같게','처음 선택한 도형 기준')+'</div>';
  }
  h+='<div class="arow">'+(multi?B('grp','그룹 만들기 (Ctrl+G)','묶어서 함께 이동/크기 조절'):'')+(anyG?B('ungrp','그룹 풀기 (Ctrl+Shift+G)',''):'')+'</div>';
  return h;
}
function shiftUnit(u,dx,dy){for(const o of u.objs)moveObj(o,cloneObj(o),dx,dy);}
function doAct(a){
  const list=selList();if(!list.length)return;const units=unitsOf(list);
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
    s.textEdits=s.textEdits||{};s.textEdits[m.id]=m.html;stageEl._fk=frameKey(s);markDirty();scheduleThumb();
  }
});

/* ===================== 즐겨찾기 ===================== */
function presetPreview(p){
  const s=p.style;let o;const lw=Math.min(s.sw==null?3:s.sw,4);
  switch(p.kind){
    case 'rect':o={t:'rect',x:5,y:5,w:34,h:20,...s,sw:lw};break;
    case 'ellipse':o={t:'ellipse',x:5,y:4,w:34,h:22,...s,sw:lw};break;
    case 'arrow':o={t:'arrow',x1:5,y1:23,x2:38,y2:7,...s,sw:Math.min(lw,3)};break;
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
  if(l.length&&tool==='select'&&l.every(q=>kindOf(q)===p.kind)){
    snap();for(const o of l){const st=clone(p.style);if(o.t==='mosaic')delete st.shape;Object.assign(o,st);}renderStage();renderInspector();toast('적용: '+p.name);return;
  }
  Object.assign(ST[p.kind],clone(p.style));setTool(p.kind,true);activeFav=i;markFavs();toast((i<9?(i+1)+'번 · ':'')+p.name);
}
function addFavorite(){
  const o=selList()[0],kind=o?kindOf(o):(tool!=='select'?tool:null);
  if(!kind){toast('도형을 선택하거나 도구를 먼저 고르세요');return;}
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
function makeObj(kind,extra){return {id:uid(),t:kind,...clone(ST[kind]),...extra};}
function normRect(a,b,shift){let x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);if(shift){const m=Math.max(w,h);w=h=m;x=b.x<a.x?a.x-m:a.x;y=b.y<a.y?a.y-m:a.y;}return {x,y,w,h};}
const CUR={nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize',a1:'move',a2:'move'};
function frameHandles(fr){return fr.single?handlesOf(fr.single):boxHandles(fr.box);}
function handleAt(fr,p){const hs=12/view.s;for(const hd of frameHandles(fr))if(Math.abs(hd.x-p.x)<=hs&&Math.abs(hd.y-p.y)<=hs)return hd;return null;}
function updateCursor(e){
  if(drag||document.querySelector('.te'))return;
  let c=tool==='select'?'default':(tool==='text'?'text':'crosshair');
  if(tool==='select'&&!editText){
    const p=pt(e),fr=selFrame(),hd=fr&&handleAt(fr,p);
    if(hd)c=CUR[hd.n]||'pointer';
    else if(hitTest(curSlide().objects,p.x,p.y,8/view.s+2))c='move';
  }
  box.style.cursor=c;
}
box.addEventListener('pointerdown',e=>{
  if(e.button!==0||editText||document.querySelector('.te'))return;
  const p=pt(e),s=curSlide();box.setPointerCapture(e.pointerId);
  if(tool==='select'){
    const fr=selFrame(),hd=fr&&handleAt(fr,p);
    if(hd){
      snap();box.style.cursor=CUR[hd.n]||'move';
      if(fr.single)drag={kind:'resize',h:hd.n,orig:cloneObj(fr.single),id:fr.single.id,start:p};
      else drag={kind:'resizeM',h:hd.n,box0:{...fr.box},origs:fr.list.map(cloneObj),start:p};
      return;
    }
    const hit=hitTest(s.objects,p.x,p.y,8/view.s+2);
    if(hit){
      if(e.shiftKey){
        const cur2=selIds(),mem=hit.gid?s.objects.filter(q=>q.gid===hit.gid).map(q=>q.id):[hit.id];
        setSel(cur2.includes(hit.id)?cur2.filter(id=>!mem.includes(id)):cur2.concat(hit.id));
        drag=null;renderUI();renderInspector();return;
      }
      if(!selIds().includes(hit.id))setSel([hit.id]);
      snap();drag={kind:'move',origs:selList().map(cloneObj),start:p,moved:false};renderUI();renderInspector();
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
    if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;}
    for(const og of drag.origs){const o=findObj(og.id);if(o)moveObj(o,og,dx,dy);}
    renderStage();
  }else if(drag.kind==='resize'){
    const o=findObj(drag.id);if(!o)return;resizeObj(o,drag,p,e.shiftKey);renderStage();
  }else if(drag.kind==='resizeM'){
    const b1=boxResize(drag.box0,drag.h,p.x-drag.start.x,p.y-drag.start.y,e.shiftKey);
    for(const og of drag.origs){const o=findObj(og.id);if(o)scaleObj(o,og,drag.box0,b1);}
    renderStage();
  }else if(drag.kind==='marquee'){
    marq=normRect(drag.start,p,false);renderUI();
  }else if(drag.kind==='draw'){
    if(tool==='arrow'){let x2=p.x,y2=p.y;if(e.shiftKey){const dx=p.x-drag.start.x,dy=p.y-drag.start.y,L=Math.hypot(dx,dy),a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);x2=drag.start.x+Math.cos(a)*L;y2=drag.start.y+Math.sin(a)*L;}draft=makeObj('arrow',{x1:drag.start.x,y1:drag.start.y,x2,y2});}
    else{const r=normRect(drag.start,p,e.shiftKey);draft=tool==='mosaic'?makeObj('mosaic',r):makeObj(tool,r);}
    renderUI();
  }else if(drag.kind==='free'){
    const l=drag.pts[drag.pts.length-1];if(Math.hypot(p.x-l[0],p.y-l[1])>1.5)drag.pts.push([p.x,p.y]);renderUI();
  }
});
function endDrag(e){
  if(!drag)return;const d=drag;drag=null;const s=curSlide();
  if(d.kind==='text'){startText(d.start);return;}
  if(d.kind==='marquee'){
    const m=marq;marq=null;
    if(m&&(m.w>3||m.h>3)){const ids=s.objects.filter(o=>{const b=bbox(o);return b.x<m.x+m.w&&b.x+b.w>m.x&&b.y<m.y+m.h&&b.y+b.h>m.y;}).map(o=>o.id);setSel(d.base.concat(ids));}
    renderUI();renderInspector();return;
  }
  if(d.kind==='move'){if(!d.moved)undo.pop();renderStage();return;}
  if(d.kind==='resize'||d.kind==='resizeM'){renderStage();return;}
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
  let x1=og.x,y1=og.y,x2=og.x+og.w,y2=og.y+og.h;const dx=p.x-d.start.x,dy=p.y-d.start.y,hn=d.h;
  if(hn.includes('w'))x1+=dx;if(hn.includes('e'))x2+=dx;if(hn.includes('n'))y1+=dy;if(hn.includes('s'))y2+=dy;
  let nx=Math.min(x1,x2),ny=Math.min(y1,y2),nw=Math.abs(x2-x1),nh=Math.abs(y2-y1);
  if((o.t==='img')!==shift&&og.w>0&&og.h>0){ /* 이미지는 기본 비율 유지, Shift 로 자유 변형 */
    const r=og.w/og.h;if(hn.length===2||hn==='e'||hn==='w'){nh=nw/r;}else{nw=nh*r;}
    if(hn.includes('n'))ny=og.y+og.h-nh;else ny=og.y;
    if(hn.includes('w'))nx=og.x+og.w-nw;else nx=og.x;
    if(hn==='n'||hn==='s')nx=og.x+(og.w-nw)/2;
    if(hn==='e'||hn==='w')ny=og.y+(og.h-nh)/2;
  }
  o.x=nx;o.y=ny;o.w=Math.max(4,nw);o.h=Math.max(4,nh);
}
box.addEventListener('dblclick',e=>{
  if(tool!=='select'||editText)return;const p=pt(e),o=hitTest(curSlide().objects,p.x,p.y,8/view.s+2);
  if(!o)return;
  if(o.t==='text'){setSel([o.id]);openTextEditor(o,false);}
  else if(o.t==='num'){const v=prompt('번호',o.n);if(v!=null&&v!==''){snap();o.n=isNaN(+v)?v:+v;renderStage();}}
});
function startText(p){
  snap();const o=makeObj('text',{x:p.x,y:p.y,text:''});curSlide().objects.push(o);setSel([o.id]);openTextEditor(o,true);
}
function openTextEditor(o,isNew){
  const m=textMetrics(o);const ta=document.createElement('textarea');ta.className='te';
  ta.value=o.text;ta.style.cssText='left:'+o.x+'px;top:'+o.y+'px;font-size:'+o.size+'px;font-weight:'+(o.bold?700:400)+';min-width:'+Math.max(160,m.w)+'px;width:'+Math.max(160,m.w+20)+'px;height:'+Math.max(m.h,o.size*1.6)+'px;padding:'+(o.size*0.2)+'px '+(o.size*0.3)+'px;transform-origin:0 0;';
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
function addBlank(){snap();const s=blankSlide();s.bg=curSlide().bg;P.slides.splice(cur+1,0,s);go(cur+1);}
function dupSlide(){snap();const o=curSlide(),s={...clone({...o,_base:undefined}),id:uid()};P.slides.splice(cur+1,0,s);go(cur+1);}
function delSlide(){
  snap();
  if(P.slides.length===1){P.slides[0]=blankSlide();go(0);return;}
  P.slides.splice(cur,1);go(Math.min(cur,P.slides.length-1));
}
function moveSlide(d){const j=cur+d;if(j<0||j>=P.slides.length)return;snap();const [m]=P.slides.splice(cur,1);P.slides.splice(j,0,m);cur=j;renderAll();}
$('#thumbs').addEventListener('click',e=>{
  const b=e.target.closest('button[data-op]');if(!b)return;
  ({add:addBlank,dup:dupSlide,del:delSlide,up:()=>moveSlide(-1),down:()=>moveSlide(1)})[b.dataset.op]();
});
function deleteSel(){const s=curSlide(),ids=new Set(selIds());if(!ids.size)return;snap();s.objects=s.objects.filter(o=>!ids.has(o.id));sel=null;msel=[];renderStage();renderInspector();}

/* ===================== 이미지 넣기/붙여넣기 ===================== */
async function addImage(dataURL){
  const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=dataURL;});
  const aid=uid();P.assets[aid]=dataURL;imgCache.set(aid,Promise.resolve(im));
  const m=24,sc=Math.min((W-m*2)/im.naturalWidth,(H-m*2)/im.naturalHeight,1.6),w=im.naturalWidth*sc,h=im.naturalHeight*sc;
  const obj={id:uid(),t:'img',src:aid,x:(W-w)/2,y:(H-h)/2,w,h};
  snap();let s=curSlide();
  const empty=s.type==='blank'&&!s.objects.length;
  if(pasteMode==='new'&&!empty){const ns=blankSlide();ns.bg=s.bg;P.slides.splice(cur+1,0,ns);cur++;s=ns;}
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
    else if(/\.lecture$/i.test(f.name)||/\.json$/i.test(f.name)){if(!dirty||confirm('저장하지 않은 변경이 있어요. 그래도 열까요?'))openText(await readFileText(f),null);}
  }
});

/* ===================== 저장/열기/자동저장 ===================== */
function usedAssets(){const u=new Set();P.slides.forEach(s=>s.objects.forEach(o=>{if(o.t==='img')u.add(o.src);}));return u;}
function serialize(){
  const u=usedAssets(),assets={};for(const k of u)if(P.assets[k])assets[k]=P.assets[k];
  const uh=new Set(P.slides.filter(s=>s.type==='html').map(s=>s.htmlId)),htmls={};for(const k of uh)if(P.htmls[k])htmls[k]=P.htmls[k];
  return JSON.stringify({format:'lecture-slides',version:1,title:P.title,slides:P.slides,assets,htmls,presets:P.presets,savedAt:new Date().toISOString()},(k,v)=>k[0]==='_'?undefined:v);
}
function loadProject(d){
  if(!d||d.format!=='lecture-slides')throw new Error('강의슬라이드 파일이 아니에요');
  P={title:d.title||'제목 없는 강의',slides:d.slides&&d.slides.length?d.slides:[blankSlide()],assets:d.assets||{},htmls:d.htmls||{},presets:d.presets&&d.presets.length?d.presets:(loadPresets()||defPresets())};
  imgCache.clear();undo=[];redo=[];sel=null;editText=false;dirty=false;$('#dirty').textContent='';
  $('#title').value=P.title;for(const [,t] of thumbEls)t.el.remove();thumbEls.clear();stageEl._ok=0;stageEl._sid=null;
  renderFavs();go(0);
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
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+annotations(s.objects)+'</svg>';
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
  g.drawImage(img,0,0);c.toBlob(b=>download(b,(P.title||'슬라이드')+'-'+(cur+1)+'.png'));
}
