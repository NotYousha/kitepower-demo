// Liquid glass: pointer-tracked specular on every .lg surface, plus real edge refraction on .lg.rf surfaces.
// Refraction builds one SVG displacement map per surface, sized to it, so the bend sits in a fixed-width band
// along the rounded edge however wide the surface is. Chromium is the only engine that accepts an SVG filter
// inside backdrop-filter; everywhere else the CSS blur + saturate fallback stays in place.
(function(){
  var NS='http://www.w3.org/2000/svg',root=document.documentElement;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;

  // specular highlight follows the pointer; written per element, never on :root, so only that surface restyles
  if(fine){
    document.addEventListener('pointermove',function(e){
      var t=e.target.closest?e.target.closest('.lg'):null;if(!t)return;
      var r=t.getBoundingClientRect();
      t.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      t.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    },{passive:true});
  }

  var brands=(navigator.userAgentData&&navigator.userAgentData.brands)||[];
  var chromium=brands.some(function(b){return /Chromium/.test(b.brand)});
  if(!chromium||matchMedia('(prefers-reduced-transparency: reduce)').matches)return;

  var svg=document.createElementNS(NS,'svg');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');
  svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  document.body.appendChild(svg);
  root.classList.add('refract');

  var SCALE=0.5; // maps are drawn at half resolution and stretched; the displacement is smooth so nothing is lost

  function edgeMap(w,h,radius,band){
    var cw=Math.max(2,Math.ceil(w*SCALE)),ch=Math.max(2,Math.ceil(h*SCALE));
    var r=Math.min(radius,w/2,h/2)*SCALE,b=band*SCALE;
    var c=document.createElement('canvas');c.width=cw;c.height=ch;
    var g=c.getContext('2d'),img=g.createImageData(cw,ch),d=img.data,hx=cw/2,hy=ch/2;
    for(var y=0;y<ch;y++){
      for(var x=0;x<cw;x++){
        var px=x+0.5-hx,py=y+0.5-hy,ax=Math.abs(px),ay=Math.abs(py);
        var qx=ax-(hx-r),qy=ay-(hy-r);
        // signed distance to the rounded rectangle (negative inside)
        var ox=Math.max(qx,0),oy=Math.max(qy,0);
        var sd=Math.sqrt(ox*ox+oy*oy)+Math.min(Math.max(qx,qy),0)-r;
        var depth=-sd,R=128,G=128;
        if(depth>=0&&depth<b){
          var nx,ny;
          if(qx>0&&qy>0){var l=Math.sqrt(qx*qx+qy*qy)||1;nx=qx/l;ny=qy/l}
          else if(qx>qy){nx=1;ny=0}else{nx=0;ny=1}
          nx*=px<0?-1:1;ny*=py<0?-1:1;
          var m=1-depth/b;m=m*m*(3-2*m);
          // sample from further inside the surface: content near the rim is pulled outward, like a lens edge
          R=128-nx*m*127;G=128-ny*m*127;
        }
        var i=(y*cw+x)*4;d[i]=R;d[i+1]=G;d[i+2]=128;d[i+3]=255;
      }
    }
    g.putImageData(img,0,0);
    return c.toDataURL();
  }

  var seq=0,built=new WeakMap();
  function build(el){
    var w=Math.round(el.offsetWidth),h=Math.round(el.offsetHeight);
    if(w<24||h<24)return;
    var prev=built.get(el);
    if(prev&&prev.w===w&&prev.h===h)return;
    var radius=parseFloat(getComputedStyle(el).borderTopLeftRadius)||0;
    var band=Math.max(10,Math.min(26,Math.min(w,h)*0.32));
    var id=prev?prev.id:'lgf-'+(++seq);
    var f=prev?prev.f:document.createElementNS(NS,'filter');
    if(!prev){f.setAttribute('id',id);svg.appendChild(f)}
    f.setAttribute('x','0');f.setAttribute('y','0');f.setAttribute('width',w);f.setAttribute('height',h);
    f.setAttribute('filterUnits','userSpaceOnUse');f.setAttribute('primitiveUnits','userSpaceOnUse');
    f.setAttribute('color-interpolation-filters','sRGB');
    f.innerHTML='';
    var im=document.createElementNS(NS,'feImage');
    im.setAttribute('href',edgeMap(w,h,radius,band));
    im.setAttribute('x','0');im.setAttribute('y','0');im.setAttribute('width',w);im.setAttribute('height',h);
    im.setAttribute('preserveAspectRatio','none');im.setAttribute('result','map');
    var dm=document.createElementNS(NS,'feDisplacementMap');
    dm.setAttribute('in','SourceGraphic');dm.setAttribute('in2','map');
    dm.setAttribute('scale',Math.round(band*1.5));
    dm.setAttribute('xChannelSelector','R');dm.setAttribute('yChannelSelector','G');
    f.appendChild(im);f.appendChild(dm);
    el.style.setProperty('--lg-url','url(#'+id+')');
    el.classList.add('rf-on');
    built.set(el,{w:w,h:h,id:id,f:f});
  }

  var els=[].slice.call(document.querySelectorAll('.lg.rf'));
  function all(){els.forEach(build)}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(all);
  all();
  if('ResizeObserver' in window){
    var pending=null;
    var ro=new ResizeObserver(function(entries){
      // rebuild after the resize settles; a nav that animates its width would otherwise rebuild every frame
      clearTimeout(pending);pending=setTimeout(function(){entries.forEach(function(e){build(e.target)})},180);
    });
    els.forEach(function(el){ro.observe(el)});
  }
})();
