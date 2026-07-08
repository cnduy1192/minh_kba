/* Lightbox phóng to ảnh xe + gallery tự chuyển.
   Nguồn ảnh lấy từ window.KBA (định nghĩa trong app.js). */
(function () {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  const img = document.getElementById("lbImage");
  const title = document.getElementById("lbTitle");
  const dots = document.getElementById("lbDots");
  const btnPrev = document.getElementById("lbPrev");
  const btnNext = document.getElementById("lbNext");
  const btnClose = document.getElementById("lbClose");

  let slides = [];   // [{ src, fb:[], keep }]
  let index = 0;
  let timer = null;

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startTimer() { stopTimer(); if (slides.length > 1) timer = setInterval(next, 3000); }

  function updateNav() {
    const many = slides.length > 1;
    btnPrev.style.display = many ? "" : "none";
    btnNext.style.display = many ? "" : "none";
    dots.style.display = many ? "" : "none";
  }

  function renderDots() {
    dots.innerHTML = slides
      .map((_, i) => `<button data-i="${i}" class="${i === index ? "active" : ""}" aria-label="Ảnh ${i + 1}"></button>`)
      .join("");
  }

  function show(i) {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    const slide = slides[index];
    img.dataset.fb = (slide.fb || []).join("|");
    img.dataset.keep = slide.keep ? "1" : "0";
    img.src = slide.src;
    renderDots();
    updateNav();
  }
  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  // Ảnh lỗi: thử fallback; hết fallback và không "keep" thì bỏ slide.
  img.addEventListener("error", () => {
    const fb = (img.dataset.fb || "").split("|").filter(Boolean);
    if (fb.length) {
      const nextSrc = fb.shift();
      img.dataset.fb = fb.join("|");
      img.src = nextSrc;
      return;
    }
    if (img.dataset.keep !== "1") {
      slides.splice(index, 1);
      if (!slides.length) { close(); return; }
      show(index);
    }
  });

  // Kiểm tra trước các ảnh phụ theo số ({code}-2, -3...) và chỉ thêm ảnh tải được.
  function probe(variants) {
    let k = 0;
    const test = new Image();
    test.onload = () => { slides.push({ src: variants[k], fb: [], keep: true }); renderDots(); updateNav(); };
    test.onerror = () => { k += 1; if (k < variants.length) test.src = variants[k]; };
    test.src = variants[0];
  }

  function open(car) {
    const KBA = window.KBA;
    if (!KBA) return;
    const chain = KBA.mainChain(car) || [];
    slides = [{ src: chain[0], fb: chain.slice(1), keep: true }];
    (KBA.extraImages(car) || []).forEach((u) => { if (u) slides.push({ src: u, fb: [], keep: false }); });
    index = 0;
    title.textContent = car.name || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    show(0);
    (KBA.numberedVariants(car) || []).forEach(probe);
    startTimer();
  }

  function close() {
    stopTimer();
    lb.hidden = true;
    document.body.style.overflow = "";
    slides = [];
  }

  btnNext.addEventListener("click", () => { next(); startTimer(); });
  btnPrev.addEventListener("click", () => { prev(); startTimer(); });
  btnClose.addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  dots.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) { show(Number(b.dataset.i)); startTimer(); }
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") { next(); startTimer(); }
    else if (e.key === "ArrowLeft") { prev(); startTimer(); }
  });

  // Mở lightbox khi bấm vào ảnh xe.
  document.addEventListener("click", (e) => {
    const media = e.target.closest(".vehicle-media[data-car-code]");
    if (!media || !window.KBA) return;
    const car = window.KBA.getCarByCode(media.dataset.carCode);
    if (car) open(car);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = document.activeElement;
    if (el && el.classList && el.classList.contains("vehicle-media") && el.dataset.carCode && window.KBA) {
      const car = window.KBA.getCarByCode(el.dataset.carCode);
      if (car) { e.preventDefault(); open(car); }
    }
  });
})();
