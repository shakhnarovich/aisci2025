// code to handle <tag data-alert="4-5">text </tag>; usually tag=span
(function () {
  function parseAlertSpec(spec) {
    return String(spec)
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!m) return null;
        const a = parseInt(m[1], 10);
        const b = m[2] ? parseInt(m[2], 10) : a;
        return [Math.min(a, b), Math.max(a, b)];
      })
      .filter(Boolean);
  }

  function inAnyRange(step, ranges) {
    for (const [a, b] of ranges) if (step >= a && step <= b) return true;
    return false;
  }

  function ensureRanges(el) {
    if (!el._alertRanges) {
      el._alertRanges = parseAlertSpec(el.getAttribute('data-alert'));
    }
    return el._alertRanges;
  }

  function currentStep() {
    const idx = Reveal.getIndices();
    const f = (typeof idx.f === 'number') ? idx.f : -1;
    return f + 1; // 1-based like Beamer overlays
  }

  function updateAlerts(root) {
    const step = currentStep();
    const scope = root || Reveal.getCurrentSlide();
    const els = scope.querySelectorAll('[data-alert]');
    els.forEach(el => {
      const ranges = ensureRanges(el);
      if (inAnyRange(step, ranges)) el.classList.add('alerted');
      else el.classList.remove('alerted');
    });
  }

  Reveal.on('ready',           () => updateAlerts());
  Reveal.on('slidechanged',    () => updateAlerts());
  Reveal.on('fragmentshown',   () => updateAlerts());
  Reveal.on('fragmenthidden',  () => updateAlerts());
})();

