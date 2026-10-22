(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS='http://www.w3.org/2000/svg';
  function el(tag,attrs,parent,text){var e=document.createElementNS(SVGNS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;parent.appendChild(e);return e}
  function css(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim()}

  // ---------- hero: simulated K-50 pumping cycle ----------
  var hero=document.getElementById('top'),cv=document.getElementById('sky'),ctx=cv.getContext('2d');
  var W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1);
  function size(){W=hero.clientWidth;H=hero.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  size();window.addEventListener('resize',function(){size();if(!running)draw(0)});
  var streaks=[];for(var i=0;i<56;i++)streaks.push({x:Math.random(),y:Math.random()*0.85,l:24+Math.random()*80,v:.5+Math.random()*1.4,a:.04+Math.random()*.14});
  var t=30,u=0,amp=1,last=0,running=false,visible=true;
  var hPhase=document.getElementById('hPhase'),hPhaseT=document.getElementById('hPhaseT'),hPow=document.getElementById('hPow'),hF=document.getElementById('hF'),hV=document.getElementById('hV'),hL=document.getElementById('hL'),hA=document.getElementById('hA');
  var hudTick=0,EL=40*Math.PI/180;
  function draw(dt){
    t+=dt*10;var tau=t%100,out=tau<80;
    var L=out?240+2*tau:400-8*(tau-80);
    u+=dt*(out?1.7:0.6);amp+=((out?1:0.25)-amp)*Math.min(1,dt*2.5);
    ctx.clearRect(0,0,W,H);
    var gx=W*(W<880?0.1:0.5),gy=H*0.86;
    // sea horizon
    ctx.fillStyle='rgba(4,8,15,.55)';ctx.fillRect(0,gy+6,W,H-gy);
    ctx.strokeStyle='rgba(238,243,248,.16)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,gy+6);ctx.lineTo(W,gy+6);ctx.stroke();
    // wind streaks, blowing left to right
    for(var i=0;i<streaks.length;i++){var s=streaks[i];ctx.strokeStyle='rgba(238,243,248,'+s.a+')';var x=s.x*W,y=s.y*gy;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+s.l,y);ctx.stroke();s.x+=s.v*dt*0.12;if(s.x>1.1){s.x=-0.12;s.y=Math.random()*0.85}}
    // geometry: tether at 40 degree elevation, 400 m maps to most of the free sky
    var maxPx=Math.min((W-gx-40)/Math.cos(EL),(gy-60)/Math.sin(EL))*0.95,k=maxPx/400;
    // altitude scale on the right
    ctx.font='500 10px "IBM Plex Mono", monospace';ctx.textAlign='right';
    for(var a=100;a<=300;a+=100){var yy=gy-a*k;if(yy<40)continue;ctx.strokeStyle='rgba(238,243,248,.07)';ctx.beginPath();ctx.moveTo(gx,yy);ctx.lineTo(W,yy);ctx.stroke();ctx.fillStyle='rgba(238,243,248,.35)';ctx.fillText(a+' m',W-12,yy-5)}
    var cx=gx+L*k*Math.cos(EL),cy=gy-L*k*Math.sin(EL);
    var ax=L*k*0.17*amp,ay=L*k*0.075*amp;
    // figure-eight guide
    ctx.setLineDash([4,7]);ctx.strokeStyle='rgba(255,107,31,.28)';ctx.lineWidth=1.5;ctx.beginPath();
    for(var j=0;j<=100;j++){var w=j/100*Math.PI*2,px=cx+ax*Math.sin(w),py=cy+ay*Math.sin(2*w);j?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();ctx.setLineDash([]);
    var kx=cx+ax*Math.sin(u),ky=cy+ay*Math.sin(2*u);
    // tether: taut on reel-out, sagging on reel-in
    var qx=(gx+kx)/2,qy=(gy+ky)/2+(out?4:26);
    ctx.strokeStyle=out?'rgba(238,243,248,.9)':'rgba(238,243,248,.4)';ctx.lineWidth=out?1.8:1.2;ctx.beginPath();ctx.moveTo(gx,gy-8);ctx.quadraticCurveTo(qx,qy,kx,ky);ctx.stroke();
    // ground station
    ctx.fillStyle='#EEF3F8';ctx.fillRect(gx-30,gy-6,60,12);
    ctx.fillStyle=out?'#FF6B1F':'#7E8EA0';ctx.beginPath();ctx.arc(gx,gy-8,7,0,Math.PI*2);ctx.fill();
    if(out){ctx.strokeStyle='rgba(255,107,31,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(gx,gy-8,12+4*Math.sin(t*3),0,Math.PI*2);ctx.stroke()}
    // wing
    var ang=Math.atan2(2*ay*Math.cos(2*u),ax*Math.cos(u)||0.0001);
    ctx.save();ctx.translate(kx,ky);ctx.rotate(ang);ctx.shadowColor='rgba(255,107,31,.55)';ctx.shadowBlur=16;ctx.fillStyle='#FF6B1F';
    ctx.beginPath();ctx.moveTo(-26,-5);ctx.quadraticCurveTo(0,-20,26,-5);ctx.lineTo(18,6);ctx.quadraticCurveTo(0,-4,-18,6);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#EEF3F8';ctx.fillRect(-6,-11,12,3);ctx.restore();
    // telemetry, a few times a second
    hudTick+=dt;if(hudTick>.12||dt===0){hudTick=0;
      var P=out?65+2.2*Math.sin(u*2):-10,F=out?32.5+1.1*Math.sin(u*2):1.3,V=out?2:-8;
      hPow.textContent=(P>0?'':'−')+Math.abs(P).toFixed(1)+' kW';hF.textContent=F.toFixed(1)+' kN';
      hV.textContent=(V>0?'+':'−')+Math.abs(V).toFixed(1)+' m/s';hL.textContent=Math.round(L)+' m';hA.textContent=Math.round(L*Math.sin(EL))+' m';
      hPhaseT.textContent=out?'REEL-OUT':'REEL-IN';hPhase.classList.toggle('in',!out);
      hPow.style.color=out?'':'var(--night-ink-2)'}
  }
  function frame(ts){if(!running)return;var dt=last?Math.min(.05,(ts-last)/1000):0;last=ts;draw(dt);requestAnimationFrame(frame)}
  function start(){if(running||reduce)return;running=true;last=0;requestAnimationFrame(frame)}
  function stop(){running=false}
  draw(0);
  if(!reduce){
    if('IntersectionObserver' in window){new IntersectionObserver(function(e){visible=e[0].isIntersecting;visible&&!document.hidden?start():stop()},{threshold:0}).observe(hero)}else start();
    document.addEventListener('visibilitychange',function(){document.hidden?stop():(visible&&start())});
  }

  // ---------- wind profile (one-seventh power law) ----------
  (function(){
    var s=document.getElementById('prof'),x0=60,x1=470,y0=330,y1=30,hMax=330,vMin=0.6,vMax=1.3;
    function X(v){return x0+(v-vMin)/(vMax-vMin)*(x1-x0)}function Y(h){return y0-h/hMax*(y0-y1)}
    var ink3=css('--ink-3'),rule=css('--rule'),orange=css('--orange'),ink=css('--ink'),ice=css('--ice');
    [0,100,200,300].forEach(function(h){el('line',{x1:x0,x2:x1,y1:Y(h),y2:Y(h),stroke:rule,'stroke-width':1},s);el('text',{x:x0-10,y:Y(h)+4,'text-anchor':'end'},s,h+' m')});
    [0.6,0.8,1.0,1.2].forEach(function(v){el('text',{x:X(v),y:y0+22,'text-anchor':'middle'},s,'×'+v.toFixed(1))});
    el('text',{x:(x0+x1)/2,y:y0+42,'text-anchor':'middle'},s,'wind speed relative to an 80 m hub');
    var d='';for(var h=10;h<=300;h+=5){var v=Math.pow(h/80,1/7);d+=(h===10?'M':'L')+X(v).toFixed(1)+' '+Y(h).toFixed(1)}
    el('path',{d:d,fill:'none',stroke:ice,'stroke-width':2.5},s);
    // tower turbine band (to 150 m tip height)
    el('rect',{x:x0,y:Y(150),width:x1-x0,height:Y(0)-Y(150),fill:ice,'fill-opacity':.07},s);
    el('text',{x:x0+10,y:Y(150)+18,class:'lbl'},s,'Tower turbine reach');
    el('rect',{x:x0,y:Y(300),width:x1-x0,height:Y(150)-Y(300),fill:orange,'fill-opacity':.07},s);
    el('text',{x:x0+10,y:Y(300)+18,class:'lbl'},s,'K-50 flight band');
    var v80=1,v300=Math.pow(300/80,1/7);
    el('circle',{cx:X(v80),cy:Y(80),r:5,fill:ink},s);el('text',{x:X(v80)-10,y:Y(80)+4,'text-anchor':'end',class:'lbl'},s,'80 m hub · ×1.00');
    el('circle',{cx:X(v300),cy:Y(300),r:6,fill:orange},s);el('text',{x:X(v300)-12,y:Y(300)+5,'text-anchor':'end',class:'big'},s,'×'+v300.toFixed(2));
  })();

  // ---------- pumping-cycle power chart, to scale ----------
  (function(){
    var g=document.getElementById('cycg'),x0=56,x1=500,yTop=30,yBot=250,pMax=70,pMin=-20;
    function X(s){return x0+s/100*(x1-x0)}function Y(p){return yTop+(pMax-p)/(pMax-pMin)*(yBot-yTop)}
    var rule=css('--rule'),ink3=css('--ink-3'),orange=css('--orange'),neg=css('--neg'),ink=css('--ink');
    [-10,0,25,50,65].forEach(function(p){el('line',{x1:x0,x2:x1,y1:Y(p),y2:Y(p),stroke:p===0?ink3:rule,'stroke-width':1},g);el('text',{x:x0-8,y:Y(p)+4,'text-anchor':'end'},g,p+' kW')});
    el('rect',{x:X(0),y:Y(65),width:X(80)-X(0),height:Y(0)-Y(65),fill:orange,'fill-opacity':.85},g);
    el('rect',{x:X(80),y:Y(0),width:X(100)-X(80),height:Y(-10)-Y(0),fill:neg,'fill-opacity':.8},g);
    el('line',{x1:x0,x2:x1,y1:Y(50),y2:Y(50),stroke:ink,'stroke-width':1.5,'stroke-dasharray':'5 4'},g);
    el('text',{x:x0+8,y:Y(50)-7,class:'t'},g,'Net 50 kW');
    el('text',{x:X(40),y:Y(65)+20,'text-anchor':'middle',class:'t',fill:'#140600',style:'fill:#140600'},g,'Reel-out · 80 s');
    el('text',{x:X(90),y:Y(-10)+16,'text-anchor':'middle'},g,'Reel-in');
    [0,20,40,60,80,100].forEach(function(s){el('text',{x:X(s),y:yBot+26,'text-anchor':'middle'},g,s+' s')});
  })();

  // ---------- cost bars grow when seen ----------
  var cost=document.getElementById('cost');
  if('IntersectionObserver' in window&&!reduce&&cost.getBoundingClientRect().top>innerHeight){var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){cost.classList.remove('pre');io.disconnect()}},{threshold:.3});io.observe(cost)}else cost.classList.remove('pre');

  // ---------- savings model ----------
  var uIn=document.getElementById('u'),cf=document.getElementById('cf'),dp=document.getElementById('dp');
  function fmt(n){return Math.round(n).toLocaleString('en-CA')}
  function calc(){
    var n=+uIn.value,c=+cf.value/100,p=+dp.value;
    var mwh=n*50*8760*c/1000,litres=mwh*1000*0.294,co2=litres*2.68/1000,save=litres*p,share=mwh/50000*100;
    document.getElementById('uo').textContent=n;document.getElementById('cfo').textContent=Math.round(c*100)+'%';document.getElementById('dpo').textContent='$'+p.toFixed(2)+'/L';
    document.getElementById('oE').textContent=fmt(mwh)+' MWh';
    document.getElementById('oL').textContent=(litres>=1e6?(litres/1e6).toFixed(2)+'M':fmt(Math.round(litres/100)*100))+' L';
    document.getElementById('oC').textContent=fmt(co2)+' t';
    document.getElementById('oS').textContent=save>=1e6?'$'+(save/1e6).toFixed(2)+'M':'$'+fmt(Math.round(save/100)*100);
    document.getElementById('oP').textContent=share.toFixed(1)+'%';document.getElementById('oPb').style.width=Math.min(100,share)+'%';
  }
  [uIn,cf,dp].forEach(function(i){i.addEventListener('input',calc)});calc();

  // ---------- nav: compact capsule, reading progress, active section ----------
  var nav=document.getElementById('nav'),prog=document.getElementById('prog');
  var links=[].slice.call(document.querySelectorAll('#menu a')),secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))});
  var ticking=false;
  function onScroll(){ticking=false;var y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
    nav.classList.toggle('compact',y>60);prog.style.transform='scaleX('+(max>0?Math.min(1,y/max):0).toFixed(4)+')';
    var cur=-1;secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<innerHeight*0.35)cur=i});links.forEach(function(a,i){a.classList.toggle('on',i===cur)})}
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

  // ---------- scroll reveals, counters, drawn lines ----------
  // Only things below the fold at load start hidden, so the first screen is complete at rest.
  function below(e){return e.getBoundingClientRect().top>innerHeight*0.95}
  var canIO='IntersectionObserver' in window&&!reduce;
  var rv=[].slice.call(document.querySelectorAll('.rv'));
  // stagger siblings that share a parent
  rv.forEach(function(e){var sib=[].filter.call(e.parentNode.children,function(c){return c.classList.contains('rv')});if(sib.length>1)e.style.setProperty('--i',sib.indexOf(e))});
  function count(e){var end=+e.dataset.count,pre=e.dataset.pre||'',suf=e.dataset.suf||'',sep=e.dataset.sep,t0=0;
    function f(ts){if(!t0)t0=ts;var k=Math.min(1,(ts-t0)/1400);k=1-Math.pow(1-k,3);var n=Math.round(end*k);e.textContent=pre+(sep?n.toLocaleString('en-CA'):n)+suf;if(k<1)requestAnimationFrame(f)}
    requestAnimationFrame(f)}
  var road=document.getElementById('road'),bar=document.getElementById('bar');
  if(canIO){
    var seen=new IntersectionObserver(function(en){en.forEach(function(x){if(!x.isIntersecting)return;var t=x.target;
      t.classList.remove('pre');if(t===road)road.classList.add('go');if(t.dataset.count)count(t);seen.unobserve(t)})},{threshold:.15,rootMargin:'0px 0px -6% 0px'});
    rv.forEach(function(e){if(below(e)){e.classList.add('pre');seen.observe(e)}});
    [].forEach.call(document.querySelectorAll('[data-count]'),function(e){if(below(e))seen.observe(e)});
    if(below(bar)){bar.classList.add('pre');seen.observe(bar)}
    if(below(road))seen.observe(road);else road.classList.add('go');
    // safety net: anything still hidden after the reader reaches it gets shown
    addEventListener('scroll',function(){rv.forEach(function(e){if(e.classList.contains('pre')&&e.getBoundingClientRect().top<innerHeight*0.6)e.classList.remove('pre')})},{passive:true});
  }else{road.classList.add('go')}

  // ---------- copy email ----------
  var cb=document.getElementById('copy');cb.addEventListener('click',function(){var m=document.getElementById('mail');
    function sel(){var r=document.createRange();r.selectNodeContents(m);var s=getSelection();s.removeAllRanges();s.addRange(r);cb.textContent='Selected'}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(m.textContent).then(function(){cb.textContent='Copied'},sel)}else sel()});
})();
