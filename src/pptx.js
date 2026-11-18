
/* ===================== PowerPoint(.pptx) 내보내기 ===================== */
function hex6(c){c=String(c||'#000000').trim();if(/^#[0-9a-f]{3}$/i.test(c))c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return /^#[0-9a-f]{6}$/i.test(c)?c.slice(1).toUpperCase():'000000';}
const PPT_FONT={sans:'Malgun Gothic',serif:'Batang',mono:'Consolas'};
async function pptImage(sl,o,k){
  const data=P.assets[o.src];if(!data)return;
  const plain=!o.crop&&!(o.bw>0)&&!(o.radius>0)&&!o.shadow;
  if(plain){const opt={data,x:o.x*k,y:o.y*k,w:o.w*k,h:o.h*k,rotate:o.rot||0,flipH:!!o.flip};if(o.opacity!=null&&o.opacity<1)opt.transparency=Math.round((1-o.opacity)*100);sl.addImage(opt);return;}
  const im=await getImg(o.src);if(!im)return;
  const c=document.createElement('canvas');c.width=W;c.height=H;drawImgObj(c.getContext('2d'),o,im);
  const rb=rbox(o),pad=Math.ceil((o.bw||0)+(o.shadow?44:6)),x0=Math.max(0,Math.floor(rb.x-pad)),y0=Math.max(0,Math.floor(rb.y-pad)),x1=Math.min(W,Math.ceil(rb.x+rb.w+pad)),y1=Math.min(H,Math.ceil(rb.y+rb.h+pad));
  if(x1<=x0||y1<=y0)return;
  const c2=document.createElement('canvas');c2.width=x1-x0;c2.height=y1-y0;c2.getContext('2d').drawImage(c,x0,y0,x1-x0,y1-y0,0,0,x1-x0,y1-y0);
  sl.addImage({data:c2.toDataURL('image/png'),x:x0*k,y:y0*k,w:(x1-x0)*k,h:(y1-y0)*k});
}
function pptAnn(pptx,sl,o,k,pt){
  const ST=pptx.ShapeType,dash=d=>d==1?'dash':d==2?'sysDash':'solid';
  const lineOf=(c,w,d)=>w>0?{color:hex6(c),width:Math.max(.25,w*pt),dashType:dash(d)}:{type:'none'};
  switch(o.t){
    case 'rect':case 'ellipse':{
      const opt={x:o.x*k,y:o.y*k,w:o.w*k,h:o.h*k,rotate:o.rot||0,fill:o.fillA>0?{color:hex6(o.fill),transparency:Math.round((1-o.fillA)*100)}:{type:'none'},line:lineOf(o.stroke,o.sw,o.dash)};
      let shape=o.t==='ellipse'?ST.ellipse:ST.rect;
      if(o.t==='rect'&&o.radius>0){shape=ST.roundRect;opt.rectRadius=Math.min(o.radius,Math.min(o.w,o.h)/2)*k;}
      sl.addShape(shape,opt);
      if(o.t==='rect'&&o.badge!=null&&o.badge!==''){const bp=badgePt(o),c0={x:o.x+o.w/2,y:o.y+o.h/2},q=o.rot?rotP(bp.x,bp.y,c0.x,c0.y,o.rot):bp;pptAnn(pptx,sl,{t:'num',x:q.x,y:q.y,size:o.badgeS||40,n:o.badge,fill:o.badgeC||(o.sw>0?o.stroke:o.fill),stroke:'#FFFFFF',sw:2,color:'#FFFFFF',shape:'circle'},k,pt);}
      return;}
    case 'arrow':{
      const opt={x:Math.min(o.x1,o.x2)*k,y:Math.min(o.y1,o.y2)*k,w:Math.abs(o.x2-o.x1)*k,h:Math.abs(o.y2-o.y1)*k,flipH:o.x1>o.x2,flipV:o.y1>o.y2,line:lineOf(o.stroke,o.sw,o.dash)};
      if(o.head>=1)opt.line.endArrowType='triangle';if(o.head===2)opt.line.beginArrowType='triangle';
      sl.addShape(ST.line,opt);return;}
    case 'num':{
      const r=o.size/2,fs=o.size*(String(o.n).length>1?.46:.58);
      const opt={shape:o.shape==='circle'?ST.ellipse:(o.shape==='round'?ST.roundRect:ST.rect),x:(o.x-r)*k,y:(o.y-r)*k,w:o.size*k,h:o.size*k,rotate:o.rot||0,fill:{color:hex6(o.fill)},line:lineOf(o.stroke,o.sw,0),fontFace:PPT_FONT.sans,fontSize:Math.max(6,Math.round(fs*pt*2)/2),bold:true,color:hex6(o.color),align:'center',valign:'middle',margin:0,fit:'none'};
      if(o.shape==='round')opt.rectRadius=r*0.4*k;
      sl.addText(String(o.n),opt);return;}
    case 'text':{
      const m=textMetrics(o),boxed=o.boxW>0,hasBg=o.bgA>0,rr=Math.min(o.boxR!=null?o.boxR:o.size*.2,m.h/2,m.w/2);
      const opt={shape:(hasBg||boxed)&&rr>1?ST.roundRect:ST.rect,x:o.x*k,y:o.y*k,w:m.w*k,h:m.h*k,rotate:o.rot||0,fontFace:PPT_FONT[o.font]||PPT_FONT.sans,fontSize:Math.max(6,Math.round(o.size*pt*2)/2),color:hex6(o.color),bold:!!o.bold,italic:!!o.italic,underline:o.underline?{style:'sng'}:undefined,strike:o.strike?'sngStrike':undefined,align:o.align||'left',valign:'middle',margin:[m.pad*pt,m.pad*pt,m.vp*pt,m.vp*pt],lineSpacingMultiple:Math.max(.8,(o.lh||1.25)/1.2),fit:'none',wrap:false};
      if(hasBg)opt.fill={color:hex6(o.bg),transparency:Math.round((1-o.bgA)*100)};
      if(boxed)opt.line={color:hex6(o.boxC||'#F97316'),width:Math.max(.25,o.boxW*pt)};
      if(opt.shape===ST.roundRect)opt.rectRadius=rr*k;
      sl.addText(String(o.text||''),opt);return;}
    case 'pen':{
      const pts=[];for(const p of o.pts){const q=pts[pts.length-1];if(!q||Math.hypot(p[0]-q[0],p[1]-q[1])>=1.5)pts.push(p);}
      if(pts.length<2)return;const b=ptsBox(pts,0),w=Math.max(b.w,1),h=Math.max(b.h,1);
      const line={color:hex6(o.stroke),width:Math.max(.25,o.sw*pt)};if(o.alpha!=null&&o.alpha<1)line.transparency=Math.round((1-o.alpha)*100);
      sl.addShape(ST.custGeom,{x:b.x*k,y:b.y*k,w:w*k,h:h*k,points:pts.map((p,i)=>({x:(p[0]-b.x)*k,y:(p[1]-b.y)*k,moveTo:i===0})),line,fill:{type:'none'}});return;}
  }
}
async function exportPPTX(){
  if(typeof PptxGenJS==='undefined'){toast('PowerPoint 모듈을 불러오지 못했어요');return;}
  if(editMaster){toast('마스터 편집을 먼저 끝내 주세요');return;}
  toast('PowerPoint 파일 만드는 중…');
  try{
    const inW=P.ratio==='4:3'?10:13.333,inH=inW*H/W,k=inW/W,pt=k*72,pptx=new PptxGenJS();
    pptx.defineLayout({name:'LS',width:inW,height:inH});pptx.layout='LS';pptx.title=P.title||'강의';
    let flat=0,html=0;
    for(let i=0;i<P.slides.length;i++){
      const s=P.slides[i],mst=masterOf(s),bgc=(mst&&!s.bgOwn)?mst.bg:s.bg,sl=pptx.addSlide(),mobjs=mst?masterObjs(mst,s,{idx:i,total:P.slides.length}):[];
      sl.background={color:hex6(bgc)};
      const hasMosaic=s.objects.some(o=>o.t==='mosaic');
      if(s.type==='html'){
        html++;sl.addText('HTML 슬라이드 — PowerPoint로 변환되지 않았어요.\n강의슬라이드에서 PDF로 저장해 쓰세요.',{x:inW*.1,y:inH*.38,w:inW*.8,h:inH*.24,align:'center',valign:'middle',fontFace:PPT_FONT.sans,fontSize:Math.round(24*pt/.75*.75),color:'6B7280',fit:'none'});
      }else if(hasMosaic){
        /* 모자이크가 있으면 원본 이미지가 남지 않도록 이미지를 한 장으로 합쳐 넣어요 */
        flat++;const base=await composeBase(s),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(base,0,0);
        for(const o of s.objects){if(o.t!=='mosaic')continue;const r=await mosaicCanvas(o,s);if(r)g.drawImage(r.cv,r.x,r.y);}
        sl.addImage({data:c.toDataURL('image/png'),x:0,y:0,w:inW,h:inH});
        for(const o of mobjs)if(o.t!=='img')pptAnn(pptx,sl,o,k,pt);
      }else{
        for(const o of mobjs)if(o.t==='img')await pptImage(sl,o,k);
        for(const o of mobjs)if(o.t!=='img')pptAnn(pptx,sl,o,k,pt);
        for(const o of s.objects)if(o.t==='img')await pptImage(sl,o,k);
      }
      for(const o of s.objects)if(o.t!=='img'&&o.t!=='mosaic')pptAnn(pptx,sl,o,k,pt);
      if(s.notes)sl.addNotes(s.notes);
    }
    const blob=await pptx.write({outputType:'blob'});
    download(blob,(P.title||'강의')+'.pptx');
    toast('PowerPoint 파일을 내려받았어요'+(flat?' · 모자이크가 있는 '+flat+'장은 이미지가 하나로 합쳐졌어요':'')+(html?' · HTML 슬라이드 '+html+'장은 안내 문구로 대체됐어요':''));
  }catch(err){console.error(err);toast('PPTX 저장 실패: '+(err&&err.message||err));}
}
