(function () {
  // --- helpers ---
  
  function parseRanges(spec) {
    // Accepts ranges:
    // single step: 3
    // closed range: 1-2
    // open start: -3 (steps 1→3)
    // open end: 4- (steps 4→∞)
    // comma lists: 1-2,4-,7
    
    return String(spec)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(part => {
      // cases: "n", "a-b", "a-", "-b"
      // 1) single number
      let m = part.match(/^(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        return [n, n];
      }
      // 2) a-b (closed)
      m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        const a = parseInt(m[1], 10);
        const b = parseInt(m[2], 10);
        return [Math.min(a, b), Math.max(a, b)];
      }
      // 3) a- (open end)
      m = part.match(/^(\d+)\s*-\s*$/);
      if (m) {
        const a = parseInt(m[1], 10);
        return [a, Number.POSITIVE_INFINITY];
      }
      // 4) -b (open start)
      m = part.match(/^-\s*(\d+)$/);
      if (m) {
        const b = parseInt(m[1], 10);
        return [1, b];
      }
      return null; // ignore malformed pieces
    })
    .filter(Boolean);
  }

  function stepInRanges(step, ranges) {
    for (const [a, b] of ranges) if (step >= a && step <= b) return true;
    return false;
  }
  function currentStep() {
    const idx = Reveal.getIndices();
    const f = (typeof idx.f === 'number') ? idx.f : -1;
    return f + 1; // 1-based like Beamer overlays
  }

  // Cache parsed specs on elements
  function getRanges(el, attr, cacheKey) {
    if (!el[cacheKey]) el[cacheKey] = parseRanges(el.getAttribute(attr));
    return el[cacheKey];
  }

function ensureGlobalOverlay(){
  let ov = window._rjSpotOverlay;
  if (!ov){
    ov = document.createElement('div');
    ov.className = 'rj-spotlight-overlay-global';
    document.body.appendChild(ov);            // was .reveal .slides
    window._rjSpotOverlay = ov;
  }
  return ov;
}

function positionSpotlightGlobal(target){
  const ov = ensureGlobalOverlay();
  const tRect = target.getBoundingClientRect();   // viewport coords

  const cx = (tRect.left + tRect.right) / 2;      // viewport px
  const cy = (tRect.top  + tRect.bottom) / 2;

  // Read padding from the TARGET (inherits from ancestors / :root if not set)
  const cs   = getComputedStyle(target);
  let   pad  = parseFloat(cs.getPropertyValue('--spot-padding')); // '10px' -> 10
  if (!Number.isFinite(pad)) {
    // optional: fallback to :root if you really want a separate global default
    pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spot-padding'));
  }
  if (!Number.isFinite(pad)) pad = 12;  // final hard default
  
  const r = Math.hypot(tRect.width, tRect.height) / 2 + pad;

  // console.log('target=', tRect, 'cx,cy=', cx, cy, 'r=', r); // keep if you want
  ov.style.setProperty('--sx', `${cx}px`);
  ov.style.setProperty('--sy', `${cy}px`);
  ov.style.setProperty('--sr', `${r}px`);
  ov.classList.add('on');
}

function clearSpotlightGlobal(){
  const ov = window._rjSpotOverlay;
  if (ov) ov.classList.remove('on');
}




  
  // MathJax shim: define it up here, before updateEffects/wire

  function harvestMathJaxMarks(scope) {
    const root = scope || document;
  const nodes = root.querySelectorAll('[class*="rj-"]');
  nodes.forEach(el => {
    el.classList.forEach(cls => {
      let m;
      if ((m = cls.match(/^rj-alert-(.+)$/))     && !el.hasAttribute('data-alert'))      el.setAttribute('data-alert',      m[1]);
      if ((m = cls.match(/^rj-hide-(.+)$/))      && !el.hasAttribute('data-hide'))       el.setAttribute('data-hide',       m[1]);
      if ((m = cls.match(/^rj-strike-(.+)$/)) && !el.hasAttribute('data-strike')) el.setAttribute('data-strike', m[1]);
      if ((m = cls.match(/^rj-blur-(.+)$/))      && !el.hasAttribute('data-blur'))       el.setAttribute('data-blur',       m[1]);
      if ((m = cls.match(/^rj-jiggle-(.+)$/))    && !el.hasAttribute('data-jiggle'))     el.setAttribute('data-jiggle',     m[1]);
      if ((m = cls.match(/^rj-pulse-(.+)$/))    && !el.hasAttribute('data-pulse'))     el.setAttribute('data-pulse',     m[1]);
      
      if ((m = cls.match(/^rj-desaturate-(.+)$/))&& !el.hasAttribute('data-desaturate')) el.setAttribute('data-desaturate', m[1]);
      if ((m = cls.match(/^rj-spotlight-(.+)$/)) && !el.hasAttribute('data-spotlight'))
        el.setAttribute('data-spotlight', m[1]);
      if ((m = cls.match(/^rj-popover-(.+)$/)) && !el.hasAttribute('data-popover'))
        el.setAttribute('data-popover', '#'+m[1]);      
      // CLICK-driven enlarge aliases
      if (cls === 'rj-enlarge' && !el.hasAttribute('data-click')) {
        el.setAttribute('data-click', 'enlarge');                 // default "next"
      }
      if (cls === 'rj-enlarge-persist') {
        if (!el.hasAttribute('data-click')) el.setAttribute('data-click', 'enlarge');
        el.setAttribute('data-enlarge-persist', '');              // toggle/persist
      }
    });
  });
}
  
  
  function typesetIfMathJax(scope) {
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      // MathJax v3 accepts an array of DOM nodes to typeset
      return MathJax.typesetPromise(scope ? [scope] : undefined);
    }
    return Promise.resolve();
  }
  
  function updateEffects(scope) {
    const root = scope || Reveal.getCurrentSlide();

    // pull class-based marks from MathJax into data-* attrs
    harvestMathJaxMarks(root);

    const step = currentStep();

    // Alerts
    root.querySelectorAll('[data-alert]').forEach(el => {
      const ranges = getRanges(el, 'data-alert', '_alertRanges');
      el.classList.toggle('alerted', stepInRanges(step, ranges));
    });

    // Hides
    root.querySelectorAll('[data-hide]').forEach(el => {
      const ranges = getRanges(el, 'data-hide', '_hideRanges');
      el.classList.toggle('hidden', stepInRanges(step, ranges));
      // Optional: keep DOM flow stable by reserving space when hidden:
      // if (el.classList.contains('hidden')) el.style.pointerEvents = 'none'; else el.style.pointerEvents = '';
    });

    root.querySelectorAll('[data-strike]').forEach(el => {
      const r = getRanges(el, 'data-strike', '_strikeRanges');
      el.classList.toggle('struck', stepInRanges(step, r));
    });
    
    root.querySelectorAll('[data-blur]').forEach(el => {
      const r = getRanges(el, 'data-blur', '_blurRanges');
      el.classList.toggle('blurred', stepInRanges(step, r));
    });
    root.querySelectorAll('[data-jiggle]').forEach(el => {
      const r = getRanges(el, 'data-jiggle', '_jiggleRanges');
      // Re-trigger animation when step enters range
      const on = stepInRanges(step, r);
      if (on) {
	el.classList.remove('jiggling'); void el.offsetWidth; el.classList.add('jiggling');
      } else {
	el.classList.remove('jiggling');
      }
    });
    root.querySelectorAll('[data-pulse]').forEach(el => {
      const r = getRanges(el, 'data-pulse', '_pulseRanges');
      // Re-trigger animation when step enters range
      const on = stepInRanges(step, r);
      if (on) {
	el.classList.remove('pulsing'); void el.offsetWidth; el.classList.add('pulsing');
      } else {
	el.classList.remove('pulsing');
      }
    });
    
    root.querySelectorAll('[data-enlarge]').forEach(el => {
      const r = getRanges(el, 'data-enlarge', '_enlargeRanges');
      // Re-trigger animation when step enters range
      const on = stepInRanges(step, r);
      if (on) {
	el.classList.remove('enlarging'); void el.offsetWidth; el.classList.add('enlarging');
      } else {
	el.classList.remove('enlarging');
      }
    });
    
    root.querySelectorAll('[data-desaturate]').forEach(el => {
      const r = getRanges(el, 'data-desaturate', '_desatRanges');
      el.classList.toggle('desat', stepInRanges(step, r));
    });
    
    (function(){
      const slide = root.closest('section') || Reveal.getCurrentSlide();
      const candidates = [...root.querySelectorAll('[data-spotlight]')];
      let active = null;
      
      const stepNow = step;
      for (const el of candidates) {
      	const r = getRanges(el, 'data-spotlight', '_spotlightRanges');
	if (stepInRanges(stepNow, r)) active = el; // last one wins
	el.classList.remove('spotlit');
      }
      
      if (active) {
      	positionSpotlightGlobal(active);
      	active.classList.add('spotlit');
      } else {
      	clearSpotlightGlobal();
      }
    })();
  }

  // --- slide scale -> CSS var for popover typography ---
  function updateSlideScale(){
    try{
      const cfg = (typeof Reveal.getConfig === 'function') ? Reveal.getConfig() : {};
      const baseW = cfg.width  || 960;
      const baseH = cfg.height || 700;
      const s = Reveal.getCurrentSlide();
      if (!s) return;
      const r = s.getBoundingClientRect();
      const scale = Math.min(r.width / baseW, r.height / baseH);
      document.documentElement.style.setProperty('--slide-scale', String(scale));
    }catch(_){}
  }
  
  function safeOn(event, cb) {
    if (window.Reveal && typeof Reveal.on === 'function') {
      Reveal.on(event, cb);
    }
  }

  window.addEventListener('resize', () => {
    const slide = Reveal.getCurrentSlide();
    if (slide) updateEffects(slide);
    updateSlideScale();
  });
  
  function wire() {
    if (!(window.Reveal && typeof Reveal.getCurrentSlide === 'function')) return false;
    
    // Initial pass on the current slide (wait for MathJax to be ready)
    typesetIfMathJax(Reveal.getCurrentSlide()).then(() => updateEffects());
    
    Reveal.on('ready', () => {
      typesetIfMathJax(Reveal.getCurrentSlide()).then(() => {
       	updateEffects();
       	updateSlideScale();
      }); 
    });
    
    
    Reveal.on('slidechanged', e => {
      typesetIfMathJax(e.currentSlide).then(() => {
	updateEffects(e.currentSlide);
	updateSlideScale();
      });
    });
    
    Reveal.on('fragmentshown', e => {
      const slide = e.fragment.closest('section') || Reveal.getCurrentSlide();
      // typeset only the newly shown fragment (cheap)...
      typesetIfMathJax(e.fragment).then(() => {
      	// ...but update effects for the whole slide (step changed globally)
      	updateEffects(slide);
      });
    });
    
    Reveal.on('fragmenthidden', e => {
      const slide = e.fragment.closest('section') || Reveal.getCurrentSlide();
      // step decremented globally; no typeset needed here
      updateEffects(slide);
    });
    
    return true;
  }

  /* function wire() {
   *   if (!(window.Reveal && typeof Reveal.getCurrentSlide === 'function')) return false;
   *   safeOn('ready',           () => updateEffects());
   *   safeOn('slidechanged',    () => updateEffects());
   *   safeOn('fragmentshown',   () => updateEffects());
   *   safeOn('fragmenthidden',  () => updateEffects());
   *   return true;
   * }
   */
  if (!wire()) {
    let tries = 0;
    const id = setInterval(() => {
      if (wire() || ++tries > 40) clearInterval(id); // ~2s fallback window
    }, 50);
  }
})();



// click-driven effects
// define a click dispatcher
(() => {
  const inited = new WeakSet();

  // Describe how each effect is triggered in YOUR CSS (no CSS changes needed).
  // Adjust/add entries to mirror your existing fragment effects.
  const EFFECTS = {
    jiggle: { requireAttr: 'data-jiggle', addClass: 'jiggling' },
    pulse:  { requireAttr: 'data-pulse',  addClass: 'pulsing'  },
    enlarge:  { requireAttr: 'data-enlarge',  addClass: 'enlarging'  },
    // Example: pure-class effect you may already have:
    // flash: { addClass: 'rj-flash' }
  };

  // Parse CSS time strings to ms (e.g., "0.3s", "120ms", "0s,0s")
  function toMS(str) {
    if (!str) return 0;
    return Math.max(...String(str).split(',').map(s => {
      s = s.trim();
      return s.endsWith('ms') ? parseFloat(s) :
             s.endsWith('s')  ? parseFloat(s) * 1000 : 0;
    }));
  }

  // Robust re-trigger that works for both animations and transitions
  function retrigger(el, cls) {
    el.classList.remove(cls);

    const prevAnim = el.style.animation;
    const prevTrans = el.style.transition;
    el.style.animation = 'none';
    el.style.transition = 'none';
    void el.offsetWidth; // reflow
    el.style.animation = prevAnim;
    el.style.transition = prevTrans;

    el.classList.add(cls);

    const cs = getComputedStyle(el);
    const aT = toMS(cs.animationDelay) + toMS(cs.animationDuration);
    const tT = toMS(cs.transitionDelay) + toMS(cs.transitionDuration);
    const fallback = Math.max(aT, tT, 300) + 50;

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      el.classList.remove(cls);
    };
    el.addEventListener('animationend', cleanup, { once: true });
    el.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, fallback);
  }


  // --- enlarge persistence state + helpers ---
  let currentEnlarged = null;
  let revertArmed = false;
  let currentPopover = null;
  let currentPopoverHost = null;
  let currentPopoverRawLeft = null;
  let currentPopoverRawTop = null;
  let currentPopoverRawWidth = null;
  let currentPopoverRawMaxWidth = null;
  let currentPopoverRawMaxHeight = null;
  

  // Convert % to slide-relative pixels; pass through px/vw/vh/calc(...)
  function resolvePos(val, axis){
    const s = String(val).trim();
    const m = s.match(/^([0-9.+-]+)%$/);
    if (!m) return s;
    const pct = parseFloat(m[1]) / 100;
    const slide = Reveal.getCurrentSlide();
    const r = slide ? slide.getBoundingClientRect() : document.body.getBoundingClientRect();
    const px = axis === 'x' ? (r.left + pct * r.width) : (r.top + pct * r.height);
    return `${px}px`;
  }

  function positionPopover(host, left, top){
    const pop = ensurePopover();
    pop.style.left = resolvePos(left, 'x');
    pop.style.top  = resolvePos(top,  'y');
    currentPopoverHost = host;
    currentPopoverRawLeft = left;
    currentPopoverRawTop  = top;
  }


  // Convert % lengths to slide-relative px for width/height limits
  function resolveLen(val, axis){
    const s = String(val || '').trim();
    const m = s.match(/^([0-9.+-]+)%$/);
    if (!m) return s;  // pass through px, vw/vh, rem, calc(), etc.
    const pct = parseFloat(m[1]) / 100;
    const slide = Reveal.getCurrentSlide();
    const r = slide ? slide.getBoundingClientRect() : document.body.getBoundingClientRect();
    const px = axis === 'y' ? (pct * r.height) : (pct * r.width);
    return `${px}px`;
  }

  function sizePopover(host, w, mw, mh){
    const pop = ensurePopover();
    // NOTE: setting style properties overrides the CSS var defaults
    if (w)  pop.style.width     = resolveLen(w,  'x'); else pop.style.removeProperty('width');
    if (mw) pop.style.maxWidth  = resolveLen(mw, 'x'); else pop.style.removeProperty('max-width');
    if (mh) pop.style.maxHeight = resolveLen(mh, 'y'); else pop.style.removeProperty('max-height');
    currentPopoverRawWidth = w;
    currentPopoverRawMaxWidth = mw;
    currentPopoverRawMaxHeight = mh;
  }

  
  function ensurePopover(){
    if (currentPopover) return currentPopover;
    const pop = document.createElement('div');
    pop.className = 'rj-popover';
    // clicks inside the popover shouldn't advance slides
    pop.addEventListener('pointerdown', e => { e.stopPropagation(); }, { capture:true });
    document.body.appendChild(pop);
    currentPopover = pop;
    return pop;
  }

  function typesetIfMathJaxLocal(node){
    if (window.MathJax && typeof MathJax.typesetPromise === 'function'){
      return MathJax.typesetPromise([node]);
    }
    return Promise.resolve();
  }

  function hidePopover(){
    if (!currentPopover) return;
    currentPopover.classList.remove('on');
    currentPopover.replaceChildren(); // clear content
    currentPopoverHost = null;
    currentPopoverRawLeft = null;
    currentPopoverRawTop = null;
    currentPopoverRawWidth = null;
    currentPopoverRawMaxWidth = null;
    currentPopoverRawMaxHeight = null;
  }  
  function clearEnlarge() {
    if (!currentEnlarged) return;
    currentEnlarged.classList.remove('enlarged', 'enlarging');
    currentEnlarged = null;
    hidePopover();
  }
  
  function armRevertOnNextInput() {
    if (revertArmed) return;
    revertArmed = true;
    const onAny = () => {
      clearEnlarge();
      document.removeEventListener('pointerdown', onAny, true);
      document.removeEventListener('keydown', onAny, true);
      revertArmed = false;
    };
    // avoid catching the same click that triggered enlarge
    setTimeout(() => {
      document.addEventListener('pointerdown', onAny, { once:true, capture:true });
      document.addEventListener('keydown', onAny,     { once:true, capture:true });
    }, 0);
  }
  
  // keep things tidy when changing slides
  if (window.Reveal?.on) Reveal.on('slidechanged', clearEnlarge);
  // keep % positions aligned with the slide on window resizes
  window.addEventListener('resize', () => {
    if (currentPopover && currentPopoverHost && currentPopoverRawLeft && currentPopoverRawTop){
      positionPopover(currentPopoverHost, currentPopoverRawLeft, currentPopoverRawTop);
    }
  });

  window.addEventListener('resize', () => {
    if (currentPopover && currentPopoverHost){
      if (currentPopoverRawLeft && currentPopoverRawTop){
        positionPopover(currentPopoverHost, currentPopoverRawLeft, currentPopoverRawTop);
      }
      sizePopover(currentPopoverHost, currentPopoverRawWidth, currentPopoverRawMaxWidth, currentPopoverRawMaxHeight);
    }
  });
  
  function attachIfHasClickables(slide) {
    if (inited.has(slide)) return;
    //if (!slide.querySelector('[data-click]')) return; // only slides that need it
    inited.add(slide);

    slide.addEventListener('click', (e) => {
      const el = e.target.closest('[data-click]');
      if (!el || !slide.contains(el)) return;
      
      // Stop click from advancing slides unless explicitly allowed
      if (el.dataset.clickBubble !== 'true') {
	e.preventDefault();
	e.stopPropagation();
      }

      // Read raw effect name and normalize aliases
      const rawName  = el.dataset.click; 
      const isPersist = rawName === 'enlarge-persist' || el.hasAttribute('data-enlarge-persist');
      const name     = (rawName === 'enlarge-persist') ? 'enlarge' : rawName;
      
      const spec = EFFECTS[name] || { addClass: name };
      
      // --- SPECIAL CASE: ENLARGE with per-element persistence ---
      if (name === 'enlarge') {
	// Ensure attribute exists if you want CSS scoped by [data-enlarge]
	if (spec.requireAttr && !el.hasAttribute(spec.requireAttr)) {
	  el.setAttribute(spec.requireAttr, '');
	}
	// per-element options (computed above)
	const mode = isPersist ? 'toggle' : 'next';
	
        const scale = el.getAttribute('data-scale');
        if (scale) el.style.setProperty('--enlarge-scale', scale);
	
        // helper: show popover for this element if it declares one
        const showPopoverFor = (host) => {
	  // content source: data-popover selector OR a direct child <template data-role="pop">
	  const sel = host.getAttribute('data-popover');
	  let tpl = sel ? document.querySelector(sel) :
		    host.querySelector(':scope > template[data-role="pop"], :scope > template.rj-popover-content');
          if (!tpl) return; // nothing to show
          const pop = ensurePopover();
          pop.replaceChildren(tpl.content.cloneNode(true));
	  
          // position from data-* or CSS vars on host
          const cs = getComputedStyle(host);
          const left = host.getAttribute('data-pop-left') || cs.getPropertyValue('--pop-left') || '50%';
          const top  = host.getAttribute('data-pop-top')  || cs.getPropertyValue('--pop-top')  || '50%';
          const w    = host.getAttribute('data-pop-width')|| cs.getPropertyValue('--pop-width')|| '';
          const mw   = host.getAttribute('data-pop-max-width')|| cs.getPropertyValue('--pop-max-width')|| '';
          const mh   = host.getAttribute('data-pop-max-height')|| cs.getPropertyValue('--pop-max-height')|| '';
	  const fs   = host.getAttribute('data-pop-font-size')|| cs.getPropertyValue('--pop-font-size')|| '';
	  const lh   = host.getAttribute('data-pop-line-height')|| cs.getPropertyValue('--pop-line-height')|| '';

	  
	  positionPopover(host, left.trim(), top.trim());
          if (w)  pop.style.setProperty('--pop-width', w.trim());
          if (mw) pop.style.setProperty('--pop-max-width', mw.trim());
          if (mh) pop.style.setProperty('--pop-max-height', mh.trim());
	  if (fs) pop.style.setProperty('--pop-font-size', fs.trim());
	  if (lh) pop.style.setProperty('--pop-line-height', lh.trim());
	  sizePopover(host, w && w.trim(), mw && mw.trim(), mh && mh.trim());
	  
          typesetIfMathJaxLocal(pop).then(()=> pop.classList.add('on'));
        };
	
        //if (mode === 'toggle') {    // click toggles held state       	  
//          typesetIfMathJaxLocal(pop).then(()=> pop.classList.add('on'));
  //      };

        if (mode === 'toggle') {             // click toggles held state
	  // clicking same element toggles held state
	  if (el.classList.contains('enlarged')) {
	    el.classList.remove('enlarged', 'enlarging');
            if (currentEnlarged === el) currentEnlarged = null;
	    hidePopover();
            return;
    	  }
	  // (optional single selection): collapse other enlarged
     	  if (currentEnlarged && currentEnlarged !== el) clearEnlarge();
	  
     	  // Play the animation, then hold enlarged
	  el.classList.remove('enlarged', 'enlarging');
     	  void el.offsetWidth;                 // restart CSS animation
	  el.classList.add('enlarging');
     	  el.addEventListener('animationend', function holdOnce() {
            el.removeEventListener('animationend', holdOnce);
            el.classList.add('enlarged');
            currentEnlarged = el;
              showPopoverFor(el);
            }, { once: true });
            return;
        }

        // Default "next" mode: auto-revert on next key/click anywhere
        if (currentEnlarged && currentEnlarged !== el) clearEnlarge();
        el.classList.remove('enlarged', 'enlarging');
        void el.offsetWidth;
        el.classList.add('enlarging');
        el.addEventListener('animationend', function holdOnce() {
          el.removeEventListener('animationend', holdOnce);
          el.classList.add('enlarged');        // persist visually
          currentEnlarged = el;
          armRevertOnNextInput();              // next input will clear it
          showPopoverFor(el);
        }, { once: true });

        return; // IMPORTANT: don't fall through to generic retrigger
      }
      
      // --- DEFAULT PATH for other click effects (jiggle, pulse, …) ---
      if (spec.requireAttr && !el.hasAttribute(spec.requireAttr)) {
	el.setAttribute(spec.requireAttr, '');
      }
      const times = +(el.dataset.clickTimes || 1);
      for (let i = 0; i < times; i++) {
	setTimeout(() => retrigger(el, spec.addClass), i * 60);
      }
    }, { capture: true });
  }
  
  Reveal.on('ready',        e => attachIfHasClickables(e.currentSlide));
  Reveal.on('slidechanged', e => attachIfHasClickables(e.currentSlide));
})();


