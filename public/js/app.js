document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('.hero-slider');
  if (slider) {
    const slides = slider.querySelectorAll('.slide');
    let current = 0;
    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });
    };
    if (slides.length) {
      showSlide(0);
      setInterval(() => {
        current = (current + 1) % slides.length;
        showSlide(current);
      }, 4000);
    }
  }
});
