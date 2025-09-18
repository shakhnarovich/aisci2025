Reveal.on('slidechanged', event => {
  const previous = event.previousSlide;

  // Pause and unload videos
  const videos = previous.querySelectorAll('video');
  videos.forEach(v => {
    v.pause();
    v.removeAttribute('src');  // detaches source
    v.load();                  // resets the element
  });

  // Optionally unload images
  const imgs = previous.querySelectorAll('img');
  imgs.forEach(img => {
    img.src = '';
  });
});
