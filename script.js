
// add title on 1st slide
document.addEventListener('DOMContentLoaded', () => {
    const docTitle = document.title;
    const titleElement = document.getElementById('doc-title');
    if (titleElement) {
	titleElement.textContent = docTitle;
    }
  const subEl = document.getElementById('doc-subtitle');
  const tpl = document.getElementById('subtitle');
  
  if (subEl && tpl) {
    subEl.textContent = tpl.content.textContent.trim();
  }
  
});

document.addEventListener('DOMContentLoaded', () => {
  // Set controlsList for videos
  document.querySelectorAll('video').forEach(video => {
    video.setAttribute('controlsList', 'nodownload noplaybackrate');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // --- move footer ---
  const footer = document.querySelector('.footer-bar');
  const slides = document.querySelector('.reveal .slides');
  if (footer && slides && footer.parentElement !== slides) {
    slides.appendChild(footer);
  }
  
  // --- title and subtitle ---
  const titleEl = document.getElementById('doc-title');
  if (titleEl) titleEl.textContent = document.title;
  
  const subEl = document.getElementById('doc-subtitle');
  const tplSubtitle = document.getElementById('subtitle');
  if (subEl && tplSubtitle) subEl.textContent = tplSubtitle.content.textContent.trim();
  
  // --- author ---
  const authorEl = document.getElementById('doc-author');
  const tplAuthor = document.getElementById('author');
  if (authorEl && tplAuthor) {
    authorEl.textContent = tplAuthor.content.textContent.trim();
  }

  // --- date ---
  const dateEl = document.getElementById('doc-date');
  const tplDate = document.getElementById('date');
  if (dateEl && tplDate) {
    dateEl.textContent = tplDate.content.textContent.trim();
  }
  
  // --- footer-left ---
  const footerLeft = document.querySelector('.footer-left');
  if (footerLeft) {
    const title = document.title;
    const subtitle = tplSubtitle ? tplSubtitle.content.textContent.trim() : '';
    const author = tplAuthor ? tplAuthor.content.textContent.trim() : (authorEl ? authorEl.textContent : '');
    const date = tplDate ? tplDate.content.textContent.trim() : '';

    footerLeft.textContent = subtitle
			   ? `${title} : ${subtitle} · ${author} · ${date}`
			   : `${title} · ${author} · ${date}`;
  }
});


Reveal.on('slidechanged', async event => {

  updateSectionLabel(event.currentSlide);
    updateSlideNumber();
    updateFooterVisibility(event.currentSlide);
    
    
    const slide = event.currentSlide;

    const upcoming = Reveal.getSlidePastCount() + 1;
    const nextSlide = Reveal.getSlides()[upcoming];


    if (nextSlide?.classList.contains('preload')) {
	const media = nextSlide.querySelectorAll('video, img');
	media.forEach(el => {
	    if (el.tagName === 'VIDEO') {
		el.load();
	    } else if (el.tagName === 'IMG') {
		const src = el.getAttribute('src');
		if (src) {
		    const img = new Image();
		    img.src = src;
		}
	    }
	});
    }
    
    // Composable behaviors
    const behaviors = (slide.dataset.behaviors || '').split(',').map(b => b.trim());
    
    for (const behavior of behaviors) {
	switch (behavior) {
	case 'plot-spline':
            await handlePlotSpline(slide);
            break;
	case 'video-panel':
            handleVideoPanel(slide);
            break;
	case 'multi-play':
            handleMultiPlay(slide);
            break;
	    
	}
    }
});

// handle the 1st slide
Reveal.on('ready', event => {
  updateSectionLabel(event.currentSlide);
  updateSlideNumber();
  updateFooterVisibility(event.currentSlide);
});


Reveal.on('fragmentshown', async event => {
    const frag = event.fragment;
    const slide = frag.closest('section');

    
    if (frag.dataset.trigger === 'start-video') {
	const video = slide.querySelector('video');
	video.loop = true;
	video.play();
    }
    
    if (frag.dataset.trigger === 'stop-video') {
	const video = slide.querySelector('video');
	video.pause();
	//video.currentTime = 0;
    }
    
    // handling multi-video panels
    if (frag.dataset.trigger === 'start-multi-video') {
	document.querySelectorAll('.multi-video').forEach(video => {
	    video.currentTime = 0;
	    video.play();
	});
    }

    if (frag.dataset.trigger === 'resume-multi-video') {
	document.querySelectorAll('.multi-video').forEach(video => {
	    video.play();
	});
    }

    if (frag.dataset.trigger === 'stop-multi-video') {
	document.querySelectorAll('.multi-video').forEach(video => {
	    video.pause();
	});
    }

    // handling all videos on the page
    if (frag.dataset.trigger === 'start-all-video') {
	document.querySelectorAll('video').forEach(video => {
	    video.currentTime = 0;
	    video.play();
	});
    }

    if (frag.dataset.trigger === 'resume-all-video') {
	document.querySelectorAll('video').forEach(video => {
	    video.play();
	});
    }

    if (frag.dataset.trigger === 'stop-all-video') {
	document.querySelectorAll('video').forEach(video => {
	    video.pause();
	});
    }
    
});

let currentSection = '';
let currentSubsection = '';
let currentSubsubsection = '';

function updateSectionLabel(slide) {
  const sec = slide.getAttribute('data-section');
  const sub = slide.getAttribute('data-subsection');
  const subsub = slide.getAttribute('data-subsubsection');

  if (sec !== null) currentSection = sec;
  if (sub !== null) currentSubsection = sub;
  if (subsub !== null) currentSubsubsection = subsub;

  if (sec !== null) {
    currentSubsection = '';
    currentSubsubsection = '';
  } else if (sub !== null) {
    currentSubsubsection = '';
  }

  let label = currentSection;
  if (currentSubsection) label += ' : ' + currentSubsection;
  if (currentSubsubsection) label += ' : ' + currentSubsubsection;

  document.getElementById('section-label-overlay').textContent = label;
}

function updateSlideNumber() {
    const current = Reveal.getSlidePastCount();
    //const total = Reveal.getTotalSlides();
    document.getElementById('slide-number-overlay').textContent = `${current}`;
}


function updateFooterVisibility(slide) {
  const footerBar = document.getElementById('footer-bar');
  if (!footerBar) return;

  const shouldHide = slide.classList.contains('nofooter');
  footerBar.style.visibility = shouldHide ? 'hidden' : 'visible';
}


// Find the "active" section label for the current slide:
// 1) If the slide or any ancestor has data-section, use it.
// 2) Otherwise, climb to the top-level section and scan previous siblings
//    for the most recent data-section (Beamer-like behavior).
function resolveSectionLabel(slide) {
  if (!slide) return '';

  // 1) Check slide and ancestors
  let s = slide;
  while (s && s.tagName === 'SECTION') {
    if (s.hasAttribute('data-section')) {
      const val = s.getAttribute('data-section').trim();
      if (val) return val;
    }
    s = s.parentElement ? s.parentElement.closest('section') : null;
  }

  // Find top-level section (direct child of .slides)
  let top = slide;
  while (
    top &&
    top.tagName === 'SECTION' &&
    top.parentElement &&
    !top.parentElement.classList.contains('slides')
  ) {
    top = top.parentElement.closest('section') || top.parentElement;
  }

  // 2) Scan backward among top-level siblings
  let cur = top;
  while (cur && cur.tagName === 'SECTION') {
    if (cur.hasAttribute('data-section')) {
      const val = cur.getAttribute('data-section').trim();
      if (val) return val;
    }
    cur = cur.previousElementSibling;
  }

  return '';
}

function updateSectionOverlay() {
  const el = document.getElementById('section-label-overlay');
  if (!el || !window.Reveal) return;
  const slide = Reveal.getCurrentSlide();
  el.textContent = resolveSectionLabel(slide);
}

// Hook updates
if (window.Reveal && typeof Reveal.on === 'function') {
  Reveal.on('ready', updateSectionOverlay);
  Reveal.on('slidechanged', updateSectionOverlay); // fires on forward/back jumps
}

// Also run once after you move the footer into .slides
document.addEventListener('DOMContentLoaded', updateSectionOverlay);



// Behavior handlers


async function handlePlotSpline(slide) {
  const container = slide.querySelector('.plot-container');
    const src = container.dataset.src;

    await dataPlot(container, src);
    await addSplineToPlot(container);
}


function handleVideoPanel(slide) {
    // TODO select only panel videos
    const videos = Array.from(slide.querySelectorAll('video'));
    // reset all videos
    videos.forEach(v => {
	v.pause();
	v.currentTime = 0;
    });
    
    let index = 0;
    
    const playNext = () => {
	if (index < videos.length) {
	    videos[index].play();
	    index++;
	}
	
	if (index >= videos.length) { // done playing all of them
	    cleanup();
	}
    };
    
    const onClick = () => {
	playNext();
	e.stopPropagation();
    };
	
    
    const onKeyDown = e => {
	if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
	    playNext();
	    e.preventDefault(); // prevent advancing fragment or slide
	    e.stopPropagation();
	}
    };
    
    const cleanup = () => {
	slide.removeEventListener('click', onClick);
	window.removeEventListener('keydown', onKeyDown);
    };
    
    // Add listeners
    slide.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    
    // Clean up on slide change
    Reveal.on('slidechanged', () => {
	cleanup();
    });    
}





// multiple videos on the slide start at the same time
function handleMultiPlay(slide) {
  const videos = slide.querySelectorAll('.multi-video');
  videos.forEach(video => {
    video.currentTime = 0;
    video.play();
  });
}

// tabular proportional fit
/**
 * Make a .tabular.tabular--grid.two-row-captions.proportional-fit container
 * allocate column widths from image aspect ratios at the desired height,
 * and scale them down together if the sum would overflow.
 *
 * Call on Reveal 'ready' and 'slidechanged', or after images load.
 */
function fitTabularProportional(container) {
  if (!container) return;

  // 1) Collect first-row images (the ones paired with captions)
  const imgs = Array.from(container.querySelectorAll(':scope > img'));
  if (imgs.length === 0) return;

  // 2) Ensure images are loaded to get natural sizes
  const waitLoads = imgs.map(img => img.complete ? Promise.resolve() :
                                     new Promise(res => img.addEventListener('load', res, {once:true})));
  Promise.all(waitLoads).then(() => {
    const cs = getComputedStyle(container);
    const cols = parseInt(cs.getPropertyValue('--cols')) || imgs.length;

    // column-gap in px:
    const gapX = parseFloat(cs.columnGap) || 0;

    // Desired height in px (resolved from --img-height via computed style on any img)
    const targetPx = parseFloat(getComputedStyle(imgs[0]).height); // already resolves cm → px
    if (!isFinite(targetPx) || targetPx <= 0) return;

    // Sum widths at target height using intrinsic aspect ratios
    let sumW = 0;
    for (const img of imgs.slice(0, cols)) {
      const ar = img.naturalWidth / img.naturalHeight; // aspect ratio
      sumW += ar * targetPx;
    }

    const containerWidth = container.clientWidth;
    const totalGaps = gapX * (cols - 1);

    // If everything fits, scale=1; else scale down to fit
    const scale = Math.min(1, (containerWidth - totalGaps) / sumW);

    // Apply by reducing the common height; captions stay aligned under each column
    const newHeight = targetPx * scale;
    container.style.setProperty('--img-height', `${newHeight}px`);
  });
}

// data visulization tools


// Simple linear interpolation


async function addSplineToPlot(container) {

  d=container.dataset;
    // Load data if not provided
    if (!container._x || !container._y) {
	await dataPlot(container,d.src); // set _x and _y
    }

    const traceSpline = {
	x: container._x,
	y: container._y,
	mode: 'lines',
	type: 'scatter',
	opacity: d.lineOpacity || 0.5,
	
	line: {
            shape: 'spline',
            color: d.lineColor || 'gray',
            width: d.lineWidth || 7,
	},
	name: 'Spline'
    };
    
    Plotly.addTraces(container, traceSpline);
}

// draw x and y from file
async function dataPlot(container, src) {
    const d=container.dataset;
    const text = await fetch(src).then(res => res.text());
    const rows = text.trim().split('\n').map(r => r.split(',').map(Number));
    const x = rows.map(r => r[0]);
    const y = rows.map(r => r[1]);
    container._x = x;
    container._y = y;
    
    const tracePoints = {
	x: x,
	y: y,
	mode: 'markers',
	type: 'scatter',
	marker: {
            size: 10,
            color: d.color || 'blue',
            symbol: d.marker || 'circle'
	},
	name: 'Points'
    };

    const layout = {
	margin: { t: 10, b: 80, l: 40, r: 10 },
	font: {
	    size: 36,
	    color: 'black'
	},
	showlegend: false,
	xaxis: {
	    title: {text: d.xLabel || "x", standoff: 30},
	    showgrid: false,
	    zeroline: false,
	    ticks: 'outside',
	    mirror: true,
	    linecolor: 'black',
	    ticklen: 6,
	    autorange: true,
	    automargin:true,
	    rangemode: 'tozero' // or 'normal' or 'nonnegative'
	},
	yaxis: {
	    title: {text: d.yLabel || "y", standoff: 30},
	    showgrid: false,
	    zeroline: false,
	    ticks: 'outside',
	    mirror: true,
	    linecolor: 'black',
	    ticklen: 6,
	    autorange: true,
	    automargin:true,
	    rangemode: 'tozero' // or 'normal' or 'nonnegative'
	}

    };
    await Plotly.newPlot(container, [tracePoints], layout);

}

//handle <br> inside list items
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal .slides li br').forEach(br => {
    const spacer = document.createElement('span');
    spacer.className = 'br-gap';
    spacer.setAttribute('aria-hidden', 'true');
    br.replaceWith(spacer);
  });
});


