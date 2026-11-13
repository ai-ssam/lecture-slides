
/* ===================== HTML 가져오기 ===================== */
const SKIP=new Set(['SCRIPT','STYLE','SVG','NOSCRIPT','TEMPLATE','IFRAME','CANVAS','VIDEO','AUDIO','TEXTAREA','INPUT','SELECT','OPTION','BUTTON','HEAD']);
const INLINE=new Set(['B','I','EM','STRONG','SPAN','BR','A','CODE','SMALL','SUP','SUB','MARK','U','S','FONT','TIME','ABBR','WBR']);
const CANDS=['.reveal .slides section:not(:has(section))','section.slide','.slide','.slides > *','[data-slide]','body > section','main > section','.page','section'];
function isUnit(el){if(!el.textContent.trim())return false;for(const d of el.querySelectorAll('*'))if(!INLINE.has(d.tagName))return false;return true;}
function tagUnits(root){let n=0;const walk=el=>{for(const c of [...el.children]){if(SKIP.has(c.tagName.toUpperCase()))continue;if(isUnit(c))c.setAttribute('data-ls-id','t'+(++n));else walk(c);}};walk(root);return n;}
function countSel(doc,sel){try{return sel?doc.querySelectorAll(sel).length:1;}catch(e){return 0;}}
function detectSlides(doc){for(const s of CANDS){const n=countSel(doc,s);if(n>=2&&n<=300)return {sel:s,count:n};}return {sel:'',count:1};}
function openImportDialog(text,name){
  const doc=new DOMParser().parseFromString(text,'text/html'),det=detectSlides(doc);
  const m=modal('<h3>HTML 가져오기</h3><p>'+esc(name)+'</p><p>슬라이드를 <b id="ic">'+det.count+'</b>장으로 나눌 수 있어요. 나누는 기준(CSS 선택자)</p><input type="text" id="isel" value="'+esc(det.sel)+'" placeholder="예: .slide  (비우면 한 장으로 가져와요)"><p class="hint">글자 수정과 필기는 가져온 뒤에도 가능해요. 스타일·스크립트가 한 파일에 들어 있는 HTML이 가장 정확해요. 인터넷에서 불러오는 글꼴/라이브러리는 온라인일 때만 보여요.</p><div class="row"><button class="pri" id="iok">가져오기</button><button id="ino">취소</button></div>');
  $('#isel',m).addEventListener('input',()=>{$('#ic',m).textContent=countSel(doc,$('#isel',m).value.trim());});
  $('#ino',m).onclick=closeModal;
  $('#iok',m).onclick=()=>{const sel=$('#isel',m).value.trim();closeModal();doImport(text,name,sel);};
}
function doImport(text,name,sel){
  const doc=new DOMParser().parseFromString(text,'text/html');
  tagUnits(doc.body);
  const n=sel?countSel(doc,sel):1;if(sel&&!n){toast('선택자와 맞는 슬라이드가 없어요');return;}
  const hid=uid();P.htmls[hid]='<!DOCTYPE html>\n'+doc.documentElement.outerHTML;
  const news=[];for(let i=0;i<(sel?n:1);i++)news.push({id:uid(),type:'html',master:'none',bg:'#FFFFFF',htmlId:hid,sel:sel||'',pick:sel?i:-1,textEdits:{},objects:[],notes:'',label:name});
  snap();
  const only=P.slides.length===1&&P.slides[0].type==='blank'&&!P.slides[0].objects.length;
  if(only){P.slides=news;cur=0;}else{P.slides.splice(cur+1,0,...news);cur++;}
  go(cur);toast('HTML 슬라이드 '+news.length+'장을 가져왔어요');news.forEach(queueThumb);
}

/* ===================== 화면 캡처 ===================== */
async function startCapture(){
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia)){toast('이 브라우저는 화면 캡처를 지원하지 않아요. Win+Shift+S 로 캡처한 뒤 Ctrl+V 하세요');return;}
  let stream;
  try{stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:10},audio:false});}catch(e){toast('캡처를 취소했어요');return;}
  const v=document.createElement('video');v.srcObject=stream;v.muted=true;v.playsInline=true;await v.play().catch(()=>{});
  const ov=document.createElement('div');ov.id='cap';
  ov.innerHTML='<div class="capbar"><b>캡처할 영역을 드래그하세요</b><span>Space = 화면 전체 · Esc = 닫기 · 공유 중인 화면이 바뀌면 그대로 따라와요</span><span id="capn">0장</span><button id="capall">전체 캡처</button><button id="capx">닫기</button></div><div class="capsel"></div><div class="flash"></div>';
  ov.insertBefore(v,ov.firstChild);document.body.appendChild(ov);
  const sel=$('.capsel',ov),flash=$('.flash',ov);let n=0,start=null;
  const mapPt=e=>{const r=v.getBoundingClientRect(),vw=v.videoWidth||1,vh=v.videoHeight||1,sc=Math.min(r.width/vw,r.height/vh),ox=r.left+(r.width-vw*sc)/2,oy=r.top+(r.height-vh*sc)/2;return {x:clamp((e.clientX-ox)/sc,0,vw),y:clamp((e.clientY-oy)/sc,0,vh),cx:e.clientX,cy:e.clientY};};
  const grab=async(x,y,w,h)=>{
    w=Math.round(w);h=Math.round(h);if(w<6||h<6)return;
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(v,Math.round(x),Math.round(y),w,h,0,0,w,h);
    flash.style.transition='none';flash.style.opacity='.8';requestAnimationFrame(()=>{flash.style.transition='opacity .35s';flash.style.opacity='0';});
    await addImage(c.toDataURL('image/png'));n++;$('#capn',ov).textContent=n+'장 캡처됨';
  };
  const close=()=>{stream.getTracks().forEach(t=>t.stop());ov.remove();document.removeEventListener('keydown',onKey,true);if(n)toast(n+'장 캡처했어요');};
  const onKey=e=>{if(e.code==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.code==='Space'){e.preventDefault();e.stopPropagation();grab(0,0,v.videoWidth,v.videoHeight);}};
  document.addEventListener('keydown',onKey,true);
  stream.getVideoTracks()[0].addEventListener('ended',close);
  $('#capx',ov).onclick=close;$('#capall',ov).onclick=()=>grab(0,0,v.videoWidth,v.videoHeight);
  ov.addEventListener('pointerdown',e=>{if(e.target.closest('.capbar'))return;start=mapPt(e);ov.setPointerCapture(e.pointerId);sel.style.display='block';});
  ov.addEventListener('pointermove',e=>{if(!start)return;const p=mapPt(e);sel.style.left=Math.min(start.cx,p.cx)+'px';sel.style.top=Math.min(start.cy,p.cy)+'px';sel.style.width=Math.abs(p.cx-start.cx)+'px';sel.style.height=Math.abs(p.cy-start.cy)+'px';});
  ov.addEventListener('pointerup',e=>{if(!start)return;const p=mapPt(e),s0=start;start=null;sel.style.display='none';grab(Math.min(s0.x,p.x),Math.min(s0.y,p.y),Math.abs(p.x-s0.x),Math.abs(p.y-s0.y));});
}

/* ===================== 발표 ===================== */
let pres=null;
const PTOOLS=[['none','커서','Esc'],['pen','펜','P'],['hl','형광펜','H'],['rect','사각형','R'],['ellipse','원','O'],['arrow','화살표','A'],['laser','레이저','L'],['erase','지우개','E']];
const INKTOOLS=['pen','hl','rect','ellipse','arrow','erase'];
const PCOL=['#E23B2E','#2563EB','#16A34A','#F59E0B','#111111','#FFFFFF'];
const inkOf=sid=>pres.ink[sid]||(pres.ink[sid]=[]);
const presSlide=()=>P.slides[pres.idx];
function startPresent(mode,from){
  if(pres)return;if(editMaster){toast('마스터 편집을 먼저 끝내 주세요');return;}
  pres={idx:clamp(from,0,P.slides.length-1),tool:'none',color:PCOL[0],width:5,ink:{},blank:null,aud:null,t0:Date.now(),mode,draft:null,drag:null,ending:false,timer:null};
  const el=$('#pres');el.hidden=false;el.className=mode;
  el.innerHTML='<div id="pmain"><div id="pboxOuter"><div id="pbox"><div id="pstage"></div><svg id="pink" viewBox="0 0 1280 '+H+'"></svg><div id="plaser"></div><div id="pblank"></div></div></div><div id="pcount"></div><div id="ptools"><div class="bar">'
    +PTOOLS.map(t=>'<button data-pt="'+t[0]+'" title="'+t[1]+' ('+t[2]+')">'+t[1]+'</button>').join('')
    +'<span class="vs"></span>'+PCOL.map(c=>'<button class="c" data-pc="'+c+'" style="background:'+c+'" title="색"></button>').join('')
    +'<span class="vs"></span><button data-pa="thin" title="[">가늘게</button><button data-pa="thick" title="]">굵게</button>'
    +'<span class="vs"></span><button data-pa="undo" title="Ctrl+Z">되돌리기</button><button data-pa="clear" title="C">필기 지우기</button><button data-pa="black" title="B">검은 화면</button><button data-pa="end" title="Esc">끝내기</button></div></div></div>'
    +'<aside id="pside"><div class="cap">경과 시간 (클릭하면 0부터)</div><div id="ptimer">00:00</div><div class="cap">다음 슬라이드</div><div id="pnext"><div class="r"></div></div><div class="cap">발표자 메모</div><div id="pnotes"></div><div class="cap" id="paudst"></div><div><button data-pa="aud">청중 창 다시 열기</button></div></aside>';
  fitP();
  const pink=$('#pink'),pbox=$('#pbox');
  const ppt=e=>{const r=pbox.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};};
  pink.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;const p=ppt(e),t=pres.tool;pink.setPointerCapture(e.pointerId);
    if(t==='erase'){pres.drag={k:'erase'};eraseAt(p);return;}
    if(t==='pen'||t==='hl'){pres.drag={k:'free',pts:[[p.x,p.y]]};pres.draft=penObj(pres.drag.pts);}
    else pres.drag={k:'shape',start:p};
    drawInk();
  });
  pink.addEventListener('pointermove',e=>{
    const d=pres.drag;if(!d)return;const p=ppt(e);
    if(d.k==='erase'){eraseAt(p);return;}
    if(d.k==='free'){const l=d.pts[d.pts.length-1];if(Math.hypot(p.x-l[0],p.y-l[1])>1.5)d.pts.push([p.x,p.y]);}
    else{pres.draft=shapeObj(pres.tool,d.start,p,e.shiftKey);}
    drawInk();
  });
  const up=()=>{
    const d=pres&&pres.drag;if(!d)return;pres.drag=null;
    if(pres.draft){const b=bbox(pres.draft),ok=pres.draft.t==='pen'||(pres.draft.t==='arrow'?Math.hypot(pres.draft.x2-pres.draft.x1,pres.draft.y2-pres.draft.y1)>6:(b.w>4&&b.h>4));if(ok)inkOf(presSlide().id).push(pres.draft);}
    pres.draft=null;drawInk();sendInk();
  };
  pink.addEventListener('pointerup',up);pink.addEventListener('pointercancel',up);
  pbox.addEventListener('pointermove',e=>{
    if(pres.tool!=='laser')return;const p=ppt(e),l=$('#plaser');l.style.display='block';l.style.left=p.x+'px';l.style.top=p.y+'px';audSend({t:'laser',x:p.x,y:p.y,on:true});
  });
  pbox.addEventListener('pointerleave',()=>{$('#plaser').style.display='none';audSend({t:'laser',on:false});});
  pbox.addEventListener('click',e=>{if(pres.tool==='none'&&presSlide().type!=='html'&&!pres.blank&&e.target.closest('#pbox'))showP(pres.idx+1);});
  $('#pres').onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.pt)setPTool(b.dataset.pt);
    else if(b.dataset.pc){pres.color=b.dataset.pc;if(!INKTOOLS.includes(pres.tool)||pres.tool==='erase')setPTool('pen');markPButtons();}
    else if(b.dataset.pa)presAction(b.dataset.pa);
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  };
  $('#ptimer').onclick=()=>{pres.t0=Date.now();};
  pres.timer=setInterval(tickP,1000);tickP();
  if(mode==='single'){const r=$('#pres').requestFullscreen&&$('#pres').requestFullscreen();if(r&&r.catch)r.catch(()=>{});}
  if(mode==='presenter')openAudience();
  setPTool('none');showP(pres.idx);
}
function fitP(){
  if(!pres)return;const m=$('#pmain');if(!m)return;
  const s=Math.min(m.clientWidth/W,m.clientHeight/H),o=$('#pboxOuter');
  o.style.width=W*s+'px';o.style.height=H*s+'px';o.style.left=(m.clientWidth-W*s)/2+'px';o.style.top=(m.clientHeight-H*s)/2+'px';$('#pbox').style.transform='scale('+s+')';
}
function tickP(){
  if(!pres)return;const t=Math.floor((Date.now()-pres.t0)/1000),mm=String(Math.floor(t/60)).padStart(2,'0'),ss=String(t%60).padStart(2,'0');
  const el=$('#ptimer');if(el)el.textContent=mm+':'+ss;
  const st=$('#paudst');if(st&&pres.mode==='presenter')st.textContent=(pres.aud&&!pres.aud.closed)?'청중 창 연결됨 (더블클릭하면 전체화면)':'⚠ 청중 창이 닫혀 있어요';
}
function penObj(pts){return pres.tool==='hl'?{id:uid(),t:'pen',pts,stroke:'#FFE066',sw:26,alpha:.4}:{id:uid(),t:'pen',pts,stroke:pres.color,sw:pres.width,alpha:1};}
function shapeObj(t,a,b,shift){
  if(t==='arrow'){let x2=b.x,y2=b.y;if(shift){const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),an=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*(Math.PI/4);x2=a.x+Math.cos(an)*L;y2=a.y+Math.sin(an)*L;}return {id:uid(),t:'arrow',x1:a.x,y1:a.y,x2,y2,stroke:pres.color,sw:pres.width,head:1,dash:0};}
  const r=normRect(a,b,shift);return {id:uid(),t,...r,stroke:pres.color,sw:pres.width,fill:pres.color,fillA:0,radius:0,dash:0};
}
function eraseAt(p){const l=inkOf(presSlide().id),n=l.length;pres.ink[presSlide().id]=l.filter(o=>!hitObj(o,p.x,p.y,12));if(pres.ink[presSlide().id].length!==n){drawInk();sendInk();}}
function drawInk(){if(!pres)return;$('#pink').innerHTML=annotations(inkOf(presSlide().id))+(pres.draft?annItem(pres.draft):'');}
function paintP(){const s=presSlide();paintSlide($('#pstage'),s,null,{interactFrame:pres.tool==='none'});}
function showP(i){
  i=clamp(i,0,P.slides.length-1);pres.idx=i;pres.drag=null;pres.draft=null;
  paintP();drawInk();$('#pcount').textContent=(i+1)+' / '+P.slides.length;
  if(pres.mode==='presenter'){
    $('#pnotes').textContent=presSlide().notes||'(메모 없음)';
    const nx=P.slides[i+1],r=$('#pnext .r');
    if(nx){r.style.display='block';paintSlide(r,nx,null,{thumb:true});}else{r.style.display='none';}
  }
  syncAud();
}
function markPButtons(){
  $$('#ptools [data-pt]').forEach(b=>b.classList.toggle('on',b.dataset.pt===pres.tool));
  $$('#ptools [data-pc]').forEach(b=>b.classList.toggle('on',b.dataset.pc===pres.color));
}
function setPTool(t){
  pres.tool=t;pres.drag=null;pres.draft=null;markPButtons();
  $('#pink').classList.toggle('on',INKTOOLS.includes(t));
  $('#pbox').style.cursor=t==='none'?'default':(t==='laser'?'none':'crosshair');
  if(t!=='laser'){$('#plaser').style.display='none';audSend({t:'laser',on:false});}
  paintP();drawInk();
}
function setBlank(m){pres.blank=pres.blank===m?null:m;const b=$('#pblank');b.style.display=pres.blank?'block':'none';b.style.background=pres.blank==='w'?'#fff':'#000';audSend({t:'blank',mode:pres.blank});}
function presAction(a){
  const sid=presSlide().id;
  if(a==='undo'){inkOf(sid).pop();drawInk();sendInk();}
  else if(a==='clear'){pres.ink[sid]=[];drawInk();sendInk();}
  else if(a==='black')setBlank('b');
  else if(a==='thin'){pres.width=Math.max(1,pres.width-2);toast('굵기 '+pres.width);}
  else if(a==='thick'){pres.width=Math.min(40,pres.width+2);toast('굵기 '+pres.width);}
  else if(a==='end')endPresent();
  else if(a==='aud')openAudience();
}
function presKey(e){
  if(pres.ending)return;
  const c=e.code,ctrl=e.ctrlKey||e.metaKey;
  const nav=d=>{e.preventDefault();if(pres.blank)setBlank(pres.blank);showP(pres.idx+d);};
  if(ctrl&&c==='KeyZ'){e.preventDefault();presAction('undo');return;}
  if(ctrl)return;
  if(['ArrowRight','ArrowDown','PageDown','Space','Enter'].includes(c)){nav(1);return;}
  if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(c)){nav(-1);return;}
  if(c==='Home'){nav(-1e9);return;}if(c==='End'){nav(1e9);return;}
  const tk={KeyP:'pen',KeyH:'hl',KeyR:'rect',KeyO:'ellipse',KeyA:'arrow',KeyL:'laser',KeyE:'erase'};
  if(tk[c]){e.preventDefault();setPTool(pres.tool===tk[c]?'none':tk[c]);return;}
  if(c==='KeyC'){presAction('clear');return;}
  if(c==='KeyB'){setBlank('b');return;}
  if(c==='KeyW'){setBlank('w');return;}
  if(c==='BracketLeft'){presAction('thin');return;}if(c==='BracketRight'){presAction('thick');return;}
  const m=c.match(/^(?:Digit|Numpad)([1-6])$/);if(m){pres.color=PCOL[+m[1]-1];if(pres.tool==='none'||pres.tool==='laser'||pres.tool==='erase')setPTool('pen');else markPButtons();return;}
  if(c==='Escape'){e.preventDefault();if(pres.blank)setBlank(pres.blank);else if(pres.tool!=='none')setPTool('none');else endPresent();}
}
function endPresent(){
  if(!pres||pres.ending)return;
  const n=Object.values(pres.ink).reduce((a,l)=>a+l.length,0);
  if(!n){closePresent(false);return;}
  pres.ending=true;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  const m=modal('<h3>발표를 끝낼까요?</h3><p>이번 발표에서 필기한 내용이 '+n+'개 있어요.</p><div class="row"><button class="pri" id="e1">필기를 슬라이드에 남기기</button><button id="e2">필기 버리기</button><button id="e3">계속 발표</button></div>');
  m.parentNode.dataset.sticky='1';
  $('#e1',m).onclick=()=>{closeModal();closePresent(true);};
  $('#e2',m).onclick=()=>{closeModal();closePresent(false);};
  $('#e3',m).onclick=()=>{closeModal();pres.ending=false;if(pres.mode==='single'){const r=$('#pres').requestFullscreen&&$('#pres').requestFullscreen();if(r&&r.catch)r.catch(()=>{});}fitP();};
}
function closePresent(save){
  const p=pres;clearInterval(p.timer);
  if(save){snap();for(const sid in p.ink){const s=P.slides.find(x=>x.id===sid);if(s)p.ink[sid].forEach(o=>s.objects.push(o));}}
  audSend({t:'end'});try{if(p.aud&&!p.aud.closed)p.aud.close();}catch(e){}
  pres=null;const el=$('#pres');el.hidden=true;el.innerHTML='';
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  go(clamp(p.idx,0,P.slides.length-1));
}
document.addEventListener('fullscreenchange',()=>{if(pres&&pres.mode==='single'&&!document.fullscreenElement&&!pres.ending)endPresent();else fitP();});
window.addEventListener('resize',()=>{fitP();});
/* 청중 창 */
function audSend(m){const a=pres&&pres.aud;if(a&&!a.closed){try{a.postMessage(Object.assign({ls:1},m),'*');}catch(e){}}}
function slim(s){return JSON.parse(JSON.stringify(s,(k,v)=>k[0]==='_'?undefined:v));}
function syncAud(){if(!pres)return;const s=presSlide();audSend({t:'show',n:pres.idx,total:P.slides.length,slide:slim(s),html:s.type==='html'?P.htmls[s.htmlId]:null,ink:inkOf(s.id),blank:pres.blank});}
function sendInk(){if(!pres)return;audSend({t:'ink',sid:presSlide().id,ink:inkOf(presSlide().id)});}
function openAudience(){
  if(!pres)return;
  const url=location.href.split('#')[0]+'#aud';
  const w=window.open(url,'lsAudience','popup=yes,width=1024,height=576');
  if(!w){toast('팝업이 막혔어요. 주소창 오른쪽에서 팝업을 허용해 주세요');return;}
  pres.aud=w;
  try{if(window.getScreenDetails){window.getScreenDetails().then(d=>{const ext=d.screens.find(s=>!s.isPrimary);if(ext&&w&&!w.closed){w.moveTo(ext.availLeft,ext.availTop);w.resizeTo(ext.availWidth,ext.availHeight);}}).catch(()=>{});}}catch(e){}
}
window.addEventListener('message',e=>{
  const m=e.data;if(!m||m.ls!==1||IS_AUD)return;
  if(m.t==='ready'&&pres&&e.source===pres.aud){audSend({t:'init',assets:P.assets,masters:P.masters||[],ratio:P.ratio||'16:9'});syncAud();}
});
/* 청중 창 쪽 */
function initAudience(){
  document.body.classList.add('aud-mode');document.title='청중 화면';
  const a=$('#aud');
  a.innerHTML='<div id="audBoxOuter"><div id="audBox"><div id="audStage"></div><svg id="audInk" viewBox="0 0 1280 '+H+'"></svg><div id="audLaser"></div><div id="audBlank"></div></div></div><div id="audMsg">발표자 화면과 연결하는 중…<br>이 창을 더블클릭하면 전체화면이 돼요</div>';
  const fit=()=>{const s=Math.min(innerWidth/W,innerHeight/H),o=$('#audBoxOuter');o.style.width=W*s+'px';o.style.height=H*s+'px';o.style.left=(innerWidth-W*s)/2+'px';o.style.top=(innerHeight-H*s)/2+'px';$('#audBox').style.transform='scale('+s+')';};
  fit();addEventListener('resize',fit);
  addEventListener('dblclick',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});});
  let curId=null;
  addEventListener('message',e=>{
    const m=e.data;if(!m||m.ls!==1||e.source!==window.opener)return;
    if(m.t==='init'){P.assets=m.assets||{};P.masters=m.masters||[];applyRatio(m.ratio||'16:9');fit();}
    else if(m.t==='show'){
      $('#audMsg').style.display='none';
      if(m.html)P.htmls[m.slide.htmlId]=m.html;
      curId=m.slide.id;paintSlide($('#audStage'),m.slide,null,{interactFrame:false,idx:m.n,total:m.total});
      $('#audInk').innerHTML=annotations(m.ink||[]);audBlank(m.blank);
    }
    else if(m.t==='ink'){if(m.sid===curId)$('#audInk').innerHTML=annotations(m.ink||[]);}
    else if(m.t==='laser'){const l=$('#audLaser');if(m.on){l.style.display='block';l.style.left=m.x+'px';l.style.top=m.y+'px';}else l.style.display='none';}
    else if(m.t==='blank')audBlank(m.mode);
    else if(m.t==='end'){window.close();}
  });
  function audBlank(mode){const b=$('#audBlank');b.style.display=mode?'block':'none';b.style.background=mode==='w'?'#fff':'#000';}
  if(window.opener)window.opener.postMessage({ls:1,t:'ready'},'*');
  else $('#audMsg').innerHTML='이 창은 발표자 화면에서 열어야 해요.<br>편집 화면의 「발표자 보기」 버튼을 눌러주세요.';
}

/* ===================== 단축키/도움말 ===================== */
function showHelp(){
  modal('<h3>단축키</h3><table>'
  +'<tr><th>편집</th><td><kbd>V</kbd> 선택 <kbd>R</kbd> 사각형 <kbd>O</kbd> 원 <kbd>L</kbd> 직선 <kbd>A</kbd> 화살표 <kbd>N</kbd> 번호 <kbd>T</kbd> 글자 <kbd>M</kbd> 모자이크 <kbd>P</kbd> 펜</td></tr>'
  +'<tr><th>즐겨찾기</th><td><kbd>1</kbd>~<kbd>9</kbd> 해당 스타일로 도구 전환 (도형을 선택해 둔 상태면 그 도형에 스타일 적용)</td></tr>'
  +'<tr><th>도형</th><td><kbd>Delete</kbd> 삭제 · 방향키 1px 이동(Shift 10px) · <kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> 복사 · <kbd>Ctrl</kbd>+<kbd>D</kbd> 복제 · 더블클릭 글자/번호 수정 · <kbd>Shift</kbd>+클릭 또는 빈 곳 드래그로 여러 개 선택 · <kbd>Ctrl</kbd>+<kbd>A</kbd> 전체 · <kbd>Ctrl</kbd>+<kbd>G</kbd> 그룹 · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd> 그룹 풀기 · 선택하면 위쪽에 생기는 동그란 점을 끌어 회전 (<kbd>Shift</kbd>: 15°씩)</td></tr>'
  +'<tr><th>배치</th><td><kbd>]</kbd>/<kbd>[</kbd> 한 단계 앞/뒤 · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>]</kbd>/<kbd>[</kbd> 맨 앞/맨 뒤 · <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd>/<kbd>V</kbd> 스타일 복사/붙여넣기 · <kbd>Alt</kbd>+클릭 잠긴 도형 선택 · 드래그 중 <kbd>Alt</kbd> 스냅 잠시 끄기</td></tr>'
  +'<tr><th>화면</th><td><kbd>Ctrl</kbd>+휠 또는 <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>-</kbd> 확대·축소 · <kbd>Ctrl</kbd>+<kbd>0</kbd> 맞춤 · <kbd>Space</kbd>+드래그 또는 휠 버튼 드래그로 이동</td></tr>'
  +'<tr><th>마스터</th><td>오른쪽 패널 「마스터 만들기/편집」 · 글자에 <kbd>{n}</kbd> 쪽번호, <kbd>{total}</kbd> 전체 쪽수 · 이미지 선택 후 「배경으로 만들기」</td></tr>'
  +'<tr><th>슬라이드</th><td><kbd>PageUp</kbd>/<kbd>PageDown</kbd> 이동 · 방향키(선택 없을 때) · <kbd>E</kbd> HTML 글자 편집</td></tr>'
  +'<tr><th>붙여넣기</th><td><kbd>Ctrl</kbd>+<kbd>V</kbd> 이미지/HTML 코드 · 파일을 창에 끌어놓아도 돼요 (이미지, .html, .lecture)</td></tr>'
  +'<tr><th>파일</th><td><kbd>Ctrl</kbd>+<kbd>S</kbd> 저장 · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> 다른 이름 · <kbd>Ctrl</kbd>+<kbd>P</kbd> 인쇄/PDF · <kbd>Ctrl</kbd>+<kbd>Z</kbd>/<kbd>Y</kbd> 되돌리기/다시</td></tr>'
  +'<tr><th>발표 시작</th><td><kbd>F5</kbd> 처음부터 · <kbd>Shift</kbd>+<kbd>F5</kbd> 현재부터</td></tr>'
  +'<tr><th>발표 중</th><td><kbd>→</kbd><kbd>Space</kbd> 다음 · <kbd>←</kbd> 이전 · <kbd>P</kbd> 펜 · <kbd>H</kbd> 형광펜 · <kbd>R</kbd> 사각형 · <kbd>O</kbd> 원 · <kbd>A</kbd> 화살표 · <kbd>L</kbd> 레이저 · <kbd>E</kbd> 지우개 · <kbd>C</kbd> 필기 지우기 · <kbd>B</kbd> 검은 화면 · <kbd>W</kbd> 흰 화면 · <kbd>1</kbd>~<kbd>6</kbd> 색 · <kbd>[</kbd><kbd>]</kbd> 굵기 · <kbd>Esc</kbd> 도구 해제/종료</td></tr>'
  +'</table><p class="hint">한글 입력 상태에서도 단축키는 동작해요. 캡처는 위쪽 「캡처」 버튼이나 Win+Shift+S 후 Ctrl+V 를 쓰세요.</p><div class="row"><button class="pri" id="hOk">닫기</button></div>');
  $('#hOk').onclick=closeModal;
}
document.addEventListener('keydown',e=>{
  if(IS_AUD||e.isComposing)return;
  if(pres){presKey(e);return;}
  if($('#modals').firstChild){if(e.key==='Escape')closeModal();return;}
  if($('#cap'))return;
  const t=e.target,tn=t&&t.tagName,c=e.code,ctrl=e.ctrlKey||e.metaKey;
  const typing=(tn==='INPUT'&&!['color','range','checkbox'].includes(t.type))||tn==='TEXTAREA'||(t&&t.isContentEditable);
  if(ctrl&&c==='KeyP'){e.preventDefault();showPrintDialog();return;}
  if(ctrl&&c==='KeyS'){e.preventDefault();saveProject(e.shiftKey);return;}
  if(typing)return;
  if(ctrl&&c==='KeyZ'){e.preventDefault();e.shiftKey?doRedo():doUndo();return;}
  if(ctrl&&c==='KeyY'){e.preventDefault();doRedo();return;}
  if(ctrl&&e.altKey&&c==='KeyC'){e.preventDefault();copyStyle();return;}
  if(ctrl&&e.altKey&&c==='KeyV'){e.preventDefault();pasteStyle();return;}
  if(ctrl&&(c==='Equal'||c==='NumpadAdd')){e.preventDefault();zoomAt(1.25);return;}
  if(ctrl&&(c==='Minus'||c==='NumpadSubtract')){e.preventDefault();zoomAt(1/1.25);return;}
  if(ctrl&&(c==='Digit0'||c==='Numpad0')){e.preventDefault();zoomFit();return;}
  if(ctrl&&e.shiftKey&&(c==='BracketRight'||c==='BracketLeft')){e.preventDefault();doAct(c==='BracketRight'?'front':'back');return;}
  if(ctrl&&c==='KeyC'){const l=selList();if(l.length){clipObj=l.map(cloneObj);e.preventDefault();toast('복사했어요 · Ctrl+V 로 붙여넣기');}return;}
  if(ctrl&&c==='KeyA'){e.preventDefault();setSel(curSlide().objects.filter(o=>!o.locked).map(o=>o.id));renderUI();renderInspector();return;}
  if(ctrl&&c==='KeyG'){e.preventDefault();doAct(e.shiftKey?'ungrp':'grp');return;}
  if(ctrl&&c==='KeyD'){const l=selList();if(l.length){e.preventDefault();snap();const ns=dupObjs(l,24,24);curSlide().objects.push(...ns);setSel(ns.map(o=>o.id));renderStage();renderInspector();}return;}
  if(ctrl)return;
  if(c==='BracketRight'||c==='BracketLeft'){if(sel){e.preventDefault();doAct(c==='BracketRight'?'fwd':'bwd');}return;}
  if((tn==='SELECT'||(tn==='INPUT'&&t.type==='range'))&&c.startsWith('Arrow'))return;
  if(c==='F5'){e.preventDefault();startPresent('single',e.shiftKey?cur:0);return;}
  const m=c.match(/^(?:Digit|Numpad)([1-9])$/);if(m){applyPreset(+m[1]-1);return;}
  const tk={KeyV:'select',KeyR:'rect',KeyO:'ellipse',KeyL:'line',KeyA:'arrow',KeyN:'num',KeyT:'text',KeyM:'mosaic',KeyP:'pen'};
  if(tk[c]){e.preventDefault();setTool(tk[c]);return;}
  if(c==='KeyE'){toggleTextEdit();return;}
  if(c==='Delete'||c==='Backspace'){if(sel){e.preventDefault();deleteSel();}return;}
  if(c==='Escape'&&cropId){cropId=null;renderUI();renderInspector();return;}
  if(c==='Enter'&&cropId){cropId=null;renderUI();renderInspector();return;}
  if(c==='Escape'){if(editText)toggleTextEdit();else if(sel){sel=null;renderUI();renderInspector();}else setTool('select');return;}
  if(c==='PageDown'){e.preventDefault();go(cur+1);return;}if(c==='PageUp'){e.preventDefault();go(cur-1);return;}
  if(c==='Home'){go(0);return;}if(c==='End'){go(P.slides.length-1);return;}
  if(c.startsWith('Arrow')){
    const l=selList().filter(o=>!o.locked);e.preventDefault();
    if(l.length){if(Date.now()-lastSnap>600)snap();const st=e.shiftKey?10:1,dx=c==='ArrowLeft'?-st:c==='ArrowRight'?st:0,dy=c==='ArrowUp'?-st:c==='ArrowDown'?st:0;for(const o of l)moveObj(o,cloneObj(o),dx,dy);renderStage();}
    else go(cur+(c==='ArrowRight'||c==='ArrowDown'?1:-1));
  }
});

/* ===================== 시작 ===================== */
function initEditor(){
  applyRatio(P.ratio||'16:9');renderFavs();fitStage();new ResizeObserver(fitStage).observe($('#viewport'));
  renderAll();setTool('select');
  $('#title').addEventListener('input',e=>{P.title=e.target.value;markDirty();});
  $('#bNew').onclick=()=>{if(dirty&&!confirm('저장하지 않은 변경이 있어요. 새로 시작할까요?'))return;loadProject({format:'lecture-slides',title:'제목 없는 강의',slides:[blankSlide()],assets:{},htmls:{},presets:P.presets});fileHandle=null;};
  $('#bOpen').onclick=openProject;$('#bSave').onclick=()=>saveProject(false);$('#bSaveAs').onclick=()=>saveProject(true);
  $('#bCap').onclick=()=>{if(editMaster){toast('마스터 편집을 먼저 끝내 주세요');return;}startCapture();};
  $('#mbDone').onclick=exitMaster;
  $('#bSnap').onclick=()=>{snapOn=!snapOn;lsSet('ls.snap',snapOn?'1':'0');updateStatus();toast(snapOn?'스냅 켬: 도형이 가장자리·중앙에 달라붙어요':'스냅 끔');};
  $('#zIn').onclick=()=>zoomAt(1.25);$('#zOut').onclick=()=>zoomAt(1/1.25);$('#zPct').onclick=zoomFit;
  $('#bImg').onclick=()=>$('#fImg').click();
  $('#fImg').addEventListener('change',async e=>{const fs=[...e.target.files];e.target.value='';await addImageFiles(fs);});
  $('#bHtml').onclick=()=>{
    const m=modal('<h3>HTML 가져오기</h3><p>Claude나 Gemini가 만든 HTML 파일을 고르거나, 코드를 붙여넣으세요.</p><div class="row"><button class="pri" id="hFile">HTML 파일 선택</button></div><p class="hint">또는 코드 붙여넣기</p><textarea id="hTxt" placeholder="<!DOCTYPE html> ..."></textarea><div class="row"><button id="hGo">붙여넣은 코드로 가져오기</button><button id="hNo">취소</button></div>');
    $('#hFile',m).onclick=()=>$('#fHtml').click();$('#hNo',m).onclick=closeModal;
    $('#hGo',m).onclick=()=>{const t=$('#hTxt',m).value;if(!t.trim())return;openImportDialog(t,'붙여넣은 HTML');};
  };
  $('#fHtml').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(f)openImportDialog(await readFileText(f),f.name);});
  $('#bPdf').onclick=()=>$('#fPdf').click();
  $('#fPdf').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(f)openPdfDialog(f);});
  $('#bPng').onclick=exportPNG;$('#bPrint').onclick=showPrintDialog;$('#bUndo').onclick=doUndo;$('#bRedo').onclick=doRedo;$('#bHelp').onclick=showHelp;
  $('#bPlay').onclick=()=>startPresent('single',cur);$('#bPresenter').onclick=()=>startPresent('presenter',cur);
  $('#pasteMode').onchange=e=>{pasteMode=e.target.value;};
  $('#toolbar').addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(!b)return;setTool(b.dataset.tool);if(b.dataset.var){toolVar=b.dataset.var;Object.assign(ST.rect,clone(RECT_VAR[toolVar]));markTools();markFavs();renderInspector();}});
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  offerRestore();
}
if(IS_AUD)initAudience();else initEditor();

/* ===================== PDF 가져오기 (pdf.js) ===================== */
let pdfReady=false;
function initPdfJs(){
  if(pdfReady)return true;if(!window.pdfjsLib)return false;
  const w=document.getElementById('pdfWorkerSrc');
  pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([w.textContent],{type:'text/javascript'}));
  pdfReady=true;return true;
}
function parsePageRange(str,n){
  str=(str||'').trim();if(!str)return Array.from({length:n},(_,i)=>i+1);
  const set=new Set();
  for(const part of str.split(',')){
    const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)continue;
    let a=+m[1],b=m[2]?+m[2]:a;if(a>b)[a,b]=[b,a];
    for(let i=Math.max(1,a);i<=Math.min(n,b);i++)set.add(i);
  }
  return [...set].sort((x,y)=>x-y);
}
async function openPdfDialog(file){
  if(!initPdfJs()){toast('PDF 모듈을 불러오지 못했어요');return;}
  let pdf;
  try{pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;}
  catch(err){toast('PDF를 열 수 없어요: '+(err&&err.message||err));return;}
  const n=pdf.numPages;
  const m=modal('<h3>PDF 가져오기</h3><p>'+esc(file.name)+' · 총 <b>'+n+'</b>쪽</p>'
    +'<p>가져올 쪽 (비우면 전체, 예: 1-5, 8)</p><input type="text" id="pgr" placeholder="전체">'
    +'<p>화질</p><select id="pgq"><option value="1.5">보통 (파일이 작아요)</option><option value="2.2" selected>선명 (권장)</option><option value="3">아주 선명 (파일이 커요)</option></select>'
    +'<p class="hint">쪽마다 슬라이드 한 장으로 들어오고, 그 위에 도형·모자이크·글자·필기를 올릴 수 있어요. PDF 안의 원래 글자는 수정되지 않아요.</p>'
    +'<div class="row"><button class="pri" id="pgo">가져오기</button><button id="pno">취소</button></div>');
  m.parentNode.dataset.sticky='1';
  $('#pno',m).onclick=()=>{closeModal();pdf.destroy();};
  $('#pgo',m).onclick=async()=>{
    const pages=parsePageRange($('#pgr',m).value,n),q=+$('#pgq',m).value;
    if(!pages.length){toast('가져올 쪽을 확인해 주세요');return;}
    if(pages.length>60&&!confirm(pages.length+'쪽은 많은 편이라 파일이 커질 수 있어요. 계속할까요?'))return;
    m.innerHTML='<h3>PDF 가져오는 중…</h3><p id="pgp">0 / '+pages.length+'</p>';
    const news=[];
    try{
      for(let i=0;i<pages.length;i++){
        const page=await pdf.getPage(pages[i]),v1=page.getViewport({scale:1});
        const fit=Math.min(W/v1.width,H/v1.height),vw=v1.width*fit,vh=v1.height*fit;
        const vp=page.getViewport({scale:fit*q}),c=document.createElement('canvas');
        c.width=Math.round(vp.width);c.height=Math.round(vp.height);
        const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
        await page.render({canvasContext:g,viewport:vp}).promise;
        const url=c.toDataURL('image/jpeg',0.92),aid=uid();P.assets[aid]=url;
        const sl=blankSlide();sl.objects.push({id:uid(),t:'img',src:aid,x:(W-vw)/2,y:(H-vh)/2,w:vw,h:vh});sl.label='PDF '+pages[i]+'쪽';sl.master='none';news.push(sl);
        const pp=document.getElementById('pgp');if(pp)pp.textContent=(i+1)+' / '+pages.length;
        page.cleanup();
      }
    }catch(err){closeModal();toast('PDF 변환 중 오류: '+(err&&err.message||err));pdf.destroy();return;}
    pdf.destroy();snap();
    const only=P.slides.length===1&&P.slides[0].type==='blank'&&!P.slides[0].objects.length;
    if(only){P.slides=news;cur=0;}else{P.slides.splice(cur+1,0,...news);cur++;}
    closeModal();go(cur);toast('PDF '+news.length+'쪽을 슬라이드로 가져왔어요');
  };
}
