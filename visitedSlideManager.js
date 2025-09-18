
// Initialize global state if not already set
window.slideState = window.slideState || {
  visitedSlides: new Set(),
  fragmentFullyRevealed: new Set()
};

// Utility to get a unique identifier for each slide
function getSlideId(slide) {
  return (
    slide.getAttribute('data-id') ||
    slide.dataset.type ||
    slide.dataset.src ||
    slide.innerText.slice(0, 40).trim()
  );
}

Reveal.on('slidechanged', event => {
    const slide = event.currentSlide;

    if (slide.dataset.skipVisitedManager === "true") return;
    
    const id = getSlideId(slide);
    
    const fullyRevealed = window.slideState.fragmentFullyRevealed.has(id);
    
    if (window.slideState.visitedSlides.has(id) && fullyRevealed) {
	// Already seen and fully revealed: instantly show all fragments
	const fragments = slide.querySelectorAll('.fragment');
	
	fragments.forEach(frag => {
	    frag.classList.add('visible');
	    frag.classList.remove('fragment');
	    frag.style.transition = 'opacity 0.3s ease-in';
	    frag.style.opacity = '1';
	    
	});

	// Reset Reveal's internal fragment index and sync
	slide.setAttribute('data-fragment-index', -1);
	Reveal.sync();	
	
    } else {
	// First visit or not fully revealed yet
	window.slideState.visitedSlides.add(id);
	
	const fragments = slide.querySelectorAll('.fragment');
	let remaining = fragments.length;
	
	const markAsFullyRevealed = () => {
	    if (remaining === 0) {
		window.slideState.fragmentFullyRevealed.add(id);
		Reveal.off('fragmentshown', onFragmentShown);
	    }
	};
	
	const onFragmentShown = e => {
	    if (slide.contains(e.fragment)) {
		remaining--;
		markAsFullyRevealed();
	    }
	};
	
	if (remaining === 0) {
	    window.slideState.fragmentFullyRevealed.add(id);
	} else {
	    Reveal.on('fragmentshown', onFragmentShown);
	}
    }
});


