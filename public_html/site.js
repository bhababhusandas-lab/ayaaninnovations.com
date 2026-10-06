(() => {
  document.documentElement.classList.add('js');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const smoothstep = value => value * value * (3 - 2 * value);

  const menu = document.querySelector('.menu-btn');
  const links = document.querySelector('.links');
  menu?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '×' : '☰';
  });
  document.querySelectorAll('.links a').forEach(link => link.addEventListener('click', () => {
    links?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    if (menu) menu.textContent = '☰';
  }));

  const contactLetter = document.querySelector('.mobile-contact-letter');
  const contactLetterAction = contactLetter?.querySelector('.letter-action');
  contactLetter?.addEventListener('click', () => {
    const open = contactLetter.classList.toggle('is-open');
    contactLetter.setAttribute('aria-expanded', String(open));
    contactLetter.setAttribute('aria-label', open ? 'Close the Ayaan contact letter' : 'Open the Ayaan contact letter');
    if (contactLetterAction) contactLetterAction.textContent = open ? 'Tap to close' : 'Tap to open';
  });

  // A shared editorial rhythm connects every page without changing its content.
  const chapterAnchor = document.querySelector('.page-hero') || document.querySelector('.book-scroll');
  if (chapterAnchor && !document.querySelector('.capability-marquee')) {
    const marquee = document.createElement('div');
    marquee.className = 'capability-marquee';
    marquee.setAttribute('aria-hidden', 'true');
    const phrase = 'STRATEGY · BRAND · PERFORMANCE · DIGITAL · TECHNOLOGY · TALENT · ';
    marquee.innerHTML = `<div><span>${phrase}</span><span>${phrase}</span><span>${phrase}</span><span>${phrase}</span></div>`;
    chapterAnchor.insertAdjacentElement('afterend', marquee);
  }
  const siteRail = document.createElement('div');
  siteRail.className = 'site-rail';
  siteRail.setAttribute('aria-hidden', 'true');
  siteRail.innerHTML = '<span>AYAAN / FIELD SYSTEM</span><i><b></b></i><em>00</em>';
  document.body.appendChild(siteRail);
  let railFrame = 0;
  const renderSiteRail = () => {
    const travel = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = clamp(scrollY / travel);
    siteRail.style.setProperty('--site-progress', `${progress * 100}%`);
    const number = siteRail.querySelector('em');
    if (number) number.textContent = String(Math.round(progress * 100)).padStart(2, '0');
    railFrame = 0;
  };
  const requestSiteRail = () => {
    if (!railFrame) railFrame = requestAnimationFrame(renderSiteRail);
  };
  addEventListener('scroll', requestSiteRail, {passive:true});
  addEventListener('resize', requestSiteRail, {passive:true});
  renderSiteRail();

  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }), {threshold: .14});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

  const header = document.querySelector('.header');
  const bookScroll = document.querySelector('.book-scroll');
  const book = document.querySelector('.book');
  const bookPages = [...document.querySelectorAll('.book-page')];
  const bookStatus = document.querySelector('.book-status');
  const bookProgress = document.querySelector('.book-progress i');
  const bookProgressNumber = document.querySelector('.book-progress span');
  const mark = document.querySelector('.mark-frame');
  const markImage = mark?.querySelector('img');
  const statusLabels = ['00 / INTRODUCTION', '01 / CAPABILITIES', '02 / COMMITMENT', '03 / OUR BELIEF', '04 / BEGIN'];

  // A physical sheet needs two faces. Keep the authored page on the front and
  // generate a restrained reverse so completed turns remain visible at left.
  bookPages.forEach((page, index) => {
    if (page.querySelector(':scope > .page-face')) return;
    const front = document.createElement('div');
    front.className = 'page-face page-front';
    while (page.firstChild) front.appendChild(page.firstChild);
    const back = document.createElement('div');
    back.className = 'page-face page-back';
    const number = String(index + 1).padStart(2, '0');
    back.innerHTML = `<div class="folio">AYAAN / FIELD BOOK</div><div class="page-back-mark"><span>TURNED PAGE</span><strong>${number}</strong></div><div class="page-back-rule"><span>IDEAS IN MOTION</span><b>${number}</b></div>`;
    page.append(front, back);
  });

  let target = 0;
  let current = 0;
  let frame = 0;
  let bookFrameTime = 0;

  const readScroll = () => {
    header?.classList.toggle('scrolled', scrollY > 35);
    if (!bookScroll || reduceMotion) return;
    const rect = bookScroll.getBoundingClientRect();
    const travel = Math.max(1, bookScroll.offsetHeight - innerHeight);
    target = clamp(-rect.top / travel);
    if (!frame) frame = requestAnimationFrame(renderBook);
  };

  const renderBook = time => {
    // Time-based damping feels the same on 60 Hz Windows displays and 120 Hz
    // MacBook Pro displays. The previous fixed lerp changed speed with refresh
    // rate and made wheel-scroll updates feel uneven.
    const now = Number.isFinite(time) ? time : performance.now();
    const delta = bookFrameTime ? Math.min(48, now - bookFrameTime) : 16.667;
    bookFrameTime = now;
    const damping = 1 - Math.exp(-delta / 125);
    current = lerp(current, target, damping);
    if (Math.abs(target - current) < .00018) current = target;
    const smootherstep = value => value * value * value * (value * (value * 6 - 15) + 10);
    // Keep the cover fully closed through the initial scroll gesture. This
    // prevents an accidental half-open pose from reading as a load glitch.
    const openPhase = smoothstep(clamp((current - .075) / .095));
    const closePhase = smoothstep(clamp((current - .88) / .12));
    const openness = openPhase * (1 - closePhase);
    // During the final cover movement the turned sheets used to remain fully
    // visible on the left, leaving page 04 beside the already-closed cover.
    // Retire the complete interior stack while the cover crosses it so the
    // book reads as one physical object all the way to the closed state.
    const interiorOpacity = closePhase > 0
      ? 1 - smoothstep(clamp((closePhase - .24) / .48))
      : clamp(openPhase * 1.7);
    const readingProgress = clamp((current - .17) / .71);
    const position = readingProgress * Math.max(1, bookPages.length - 1);
    const active = Math.min(bookPages.length - 1, Math.floor(position + .5));
    bookPages.forEach((page, index) => {
      const turn = clamp(position - index);
      const eased = smootherstep(turn);
      const curl = Math.sin(turn * Math.PI);
      const flutter = Math.sin(turn * Math.PI * 2) * curl;
      const settled = smoothstep(clamp((turn - .9) / .1));
      const finished = turn > .999;
      const zIndex = finished ? 10 + index : turn > .002 ? 100 + index : 30 + bookPages.length - index;
      page.style.setProperty('--turn', `${eased * -180}deg`);
      page.style.setProperty('--shade', String(curl * .92));
      page.style.setProperty('--curl', `${curl * -5.2 + flutter * .7}deg`);
      page.style.setProperty('--corner', `${curl * 42}px`);
      page.style.setProperty('--lift', `${curl * 34 + settled * index * .65}px`);
      page.style.setProperty('--page-scale', String(1 - curl * .105));
      page.style.setProperty('--page-bow', `${flutter * 2.2}deg`);
      page.style.setProperty('--stack-x', `${settled * index * -1.5}px`);
      page.style.setProperty('--stack-y', `${settled * index * .8}px`);
      page.style.setProperty('--page-z', String(zIndex));
      page.classList.toggle('is-turned', finished);
      page.classList.toggle('is-turning', turn > .005 && turn < .995);
      page.setAttribute('aria-hidden', String(index !== active));
    });
    if (book) {
      const shift = innerWidth <= 680 ? 0 : -25 * (1 - openness);
      book.style.setProperty('--cover-turn', `${openness * -179.6}deg`);
      book.style.setProperty('--open-opacity', String(interiorOpacity));
      book.style.setProperty('--interior-visibility', String(interiorOpacity));
      book.style.setProperty('--book-shift', `${shift}%`);
      book.style.setProperty('--book-scale', String(.84 + openness * .16));
      book.style.setProperty('--book-stage-rx', `${(1 - openness) * 7}deg`);
    }
    document.body.classList.toggle('is-closed', openness < .08);
    if (bookStatus) bookStatus.textContent = current < .17 ? 'COVER / OPEN THE BOOK' : current > .88 ? 'COVER / CLOSE THE BOOK' : statusLabels[active];
    if (bookProgressNumber) bookProgressNumber.textContent = current < .17 ? '00' : current > .88 ? '06' : String(active + 1).padStart(2, '0');
    if (bookProgress) bookProgress.style.setProperty('--book-progress', `${current * 100}%`);
    if (Math.abs(target - current) > .00018) {
      frame = requestAnimationFrame(renderBook);
    } else {
      frame = 0;
      bookFrameTime = 0;
    }
  };

  addEventListener('scroll', readScroll, {passive: true});
  addEventListener('resize', readScroll, {passive: true});
  readScroll();
  if (bookPages.length) renderBook();

  if (mark && markImage && matchMedia('(pointer:fine)').matches && !reduceMotion) {
    mark.addEventListener('pointermove', event => {
      const rect = mark.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      markImage.style.setProperty('--mark-x', `${x * 15}px`);
      markImage.style.setProperty('--mark-y', `${y * 15}px`);
      markImage.style.setProperty('--mark-r', `${x * 3}deg`);
      mark.style.transform = `rotate(${2.5 + x * 1.4}deg) rotateX(${y * -2}deg) rotateY(${x * 2}deg)`;
    });
    mark.addEventListener('pointerleave', () => {
      markImage.style.setProperty('--mark-x', '0px');
      markImage.style.setProperty('--mark-y', '0px');
      markImage.style.setProperty('--mark-r', '0deg');
      mark.style.transform = 'rotate(2.5deg)';
    });
  }

  const cursor = document.querySelector('.cursor-orbit');
  if (cursor && matchMedia('(pointer:fine)').matches && !reduceMotion) {
    let pointerX = -80;
    let pointerY = -80;
    let cursorX = -80;
    let cursorY = -80;
    const moveCursor = () => {
      cursorX = lerp(cursorX, pointerX - 17, .2);
      cursorY = lerp(cursorY, pointerY - 17, .2);
      cursor.style.setProperty('--cx', `${cursorX}px`);
      cursor.style.setProperty('--cy', `${cursorY}px`);
      requestAnimationFrame(moveCursor);
    };
    addEventListener('pointermove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.classList.add('on');
    }, {passive: true});
    document.querySelectorAll('a,button,input,select,textarea').forEach(item => {
      item.addEventListener('pointerenter', () => cursor.classList.add('hover'));
      item.addEventListener('pointerleave', () => cursor.classList.remove('hover'));
    });
    moveCursor();
  }

  if (book && matchMedia('(pointer:fine)').matches && !reduceMotion) {
    book.addEventListener('pointermove', event => {
      const rect = book.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      book.style.setProperty('--book-rx', `${y * -2.2}deg`);
      book.style.setProperty('--book-ry', `${x * 2.2}deg`);
    });
    book.addEventListener('pointerleave', () => {
      book.style.setProperty('--book-rx', '0deg');
      book.style.setProperty('--book-ry', '0deg');
    });
  }

  document.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', event => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank' || event.metaKey || event.ctrlKey) return;
    const next = new URL(href, location.href);
    if (next.origin !== location.origin) return;
    event.preventDefault();
    document.querySelector('.page-transition')?.classList.add('is-leaving');
    setTimeout(() => { location.href = next.href; }, reduceMotion ? 0 : 620);
  }));

  if (!reduceMotion) {
    const depthItems = [...document.querySelectorAll('.world-visual, .about-mark, .hero-orbit, .contact-signal')];
    let depthFrame = 0;
    const renderDepth = () => {
      depthItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
        item.style.setProperty('--depth', `${offset * (24 + index * 4)}px`);
        item.style.translate = `0 var(--depth)`;
      });
      depthFrame = 0;
    };
    addEventListener('scroll', () => {
      if (!depthFrame) depthFrame = requestAnimationFrame(renderDepth);
    }, {passive: true});
    renderDepth();
  }

  const serviceDeck = document.querySelector('.services-page .service-list');
  const serviceCards = serviceDeck ? [...serviceDeck.querySelectorAll('.service-row')] : [];
  let serviceSection = null;
  if (serviceDeck) {
    serviceSection = serviceDeck.closest('.deck-scroll');
    if (!serviceSection) {
      serviceSection = document.createElement('div');
      serviceSection.className = 'deck-scroll';
      serviceDeck.parentNode.insertBefore(serviceSection, serviceDeck);
      serviceSection.appendChild(serviceDeck);
    }
  }
  if (serviceCards.length && !reduceMotion) {
    serviceCards.forEach((card, index) => {
      card.classList.add('deck-card');
      card.style.setProperty('--deck-index', String(index));
      card.dataset.deckLabel = card.querySelector('h2')?.textContent || `Service ${index + 1}`;
    });
    let deckFrame = 0;
    const renderDeck = () => {
      if (innerWidth <= 900) {
        const sectionRect = serviceSection.getBoundingClientRect();
        const travel = Math.max(1, serviceSection.offsetHeight - innerHeight);
        const progress = clamp((72 - sectionRect.top) / Math.max(1, travel - 72));
        const count = serviceCards.length;
        serviceDeck.style.setProperty('--mobile-deck-progress', `${progress * 100}%`);
        serviceDeck.style.setProperty('--mobile-deal-number', `"${String(Math.min(count, Math.floor(progress * count) + 1)).padStart(2, '0')} / ${String(count).padStart(2, '0')}"`);
        serviceCards.forEach((card, index) => {
          ['--card-x','--card-y','--card-z','--card-flip','--card-scale','--deck-opacity','--card-width'].forEach(property => card.style.removeProperty(property));
          const phase = progress * count - index;
          const deal = smoothstep(clamp(phase / .56));
          const reveal = smoothstep(clamp((phase - .42) / .3));
          const stageHeight = serviceDeck.clientHeight;
          const cardHeight = card.offsetHeight || stageHeight * .56;
          const baseTop = 32;
          const stairGap = clamp((stageHeight - baseTop - cardHeight - 24) / Math.max(1, count - 1), 25, 43);
          const deckY = stageHeight - Math.min(112, cardHeight * .24) + Math.min(5, index) * 4;
          const stopY = baseTop + index * stairGap;
          const y = lerp(deckY, stopY, deal);
          const angle = reveal < .5 ? reveal * -180 : 90 - (reveal - .5) * 180;
          const restRotation = index % 2 ? 4.5 : -4.5;
          card.style.setProperty('--mobile-flip', `${angle}deg`);
          card.style.setProperty('--back-opacity', reveal < .5 ? '1' : '0');
          card.style.setProperty('--back-peel', String(reveal));
          card.style.setProperty('--mobile-x', '0px');
          card.style.setProperty('--mobile-y', `${y}px`);
          card.style.setProperty('--mobile-z', `${restRotation * (1 - deal)}deg`);
          card.style.setProperty('--mobile-scale', String(.82 + deal * .18));
          card.style.setProperty('--mobile-opacity', '1');
          card.style.zIndex = String(100 + index);
          card.classList.toggle('deck-active', deal > .97 && phase < 1.05);
        });
        deckFrame = 0;
        return;
      }
      const sectionRect = serviceSection.getBoundingClientRect();
      const travel = Math.max(1, serviceSection.offsetHeight - innerHeight);
      const progress = clamp(-sectionRect.top / travel);
      const spread = smoothstep(clamp((progress - .08) / .24));
      const arrive = smoothstep(clamp((progress - .025) / .15));
      const available = Math.min(1700, innerWidth - 76);
      const gap = innerWidth < 1250 ? 10 : 18;
      const cardWidth = clamp((available - gap * (serviceCards.length - 1)) / serviceCards.length, 155, 260);
      const center = (serviceCards.length - 1) / 2;
      serviceDeck.style.setProperty('--title-opacity', String(1 - smoothstep(clamp((progress - .16) / .18))));
      serviceDeck.style.setProperty('--title-y', `${progress * -70}px`);
      serviceDeck.style.setProperty('--deck-progress', `${progress * 100}%`);
      serviceCards.forEach((card, index) => {
        const offset = index - center;
        const finalX = offset * (cardWidth + gap);
        const stackedX = offset * 3.2;
        const stackedY = offset * 2.2;
        const flipStart = .33 + index * .085;
        const flip = smoothstep(clamp((progress - flipStart) / .13));
        const x = lerp(stackedX, finalX, spread);
        const y = (1 - arrive) * 80 + stackedY * (1 - spread);
        card.style.setProperty('--card-width', `${cardWidth}px`);
        card.style.setProperty('--card-x', `${x}px`);
        card.style.setProperty('--card-y', `${y}px`);
        card.style.setProperty('--card-z', '0deg');
        const angle = flip < .5 ? flip * 180 : -90 + (flip - .5) * 180;
        card.style.setProperty('--card-flip', `${angle}deg`);
        card.style.setProperty('--back-opacity', flip < .5 ? '1' : '0');
        card.style.setProperty('--card-scale', String(.82 + arrive * .18));
        card.style.setProperty('--deck-opacity', String(arrive));
        card.style.zIndex = String(30 + index);
        card.classList.toggle('deck-active', flip > .98);
      });
      deckFrame = 0;
    };
    const requestDeck = () => {
      if (!deckFrame) deckFrame = requestAnimationFrame(renderDeck);
    };
    addEventListener('scroll', requestDeck, {passive: true});
    addEventListener('resize', requestDeck, {passive: true});
    renderDeck();
  }

  const kineticBelief = document.querySelector('.kinetic-belief');
  const beliefStage = kineticBelief?.querySelector('.belief-stage');
  const beliefSentence = kineticBelief?.querySelector('.belief-sentence');
  const beliefWords = beliefSentence ? [...beliefSentence.querySelectorAll('[data-kinetic-word]')] : [];
  const beliefNumber = kineticBelief?.querySelector('.belief-guide strong');
  let beliefFrame = 0;
  let beliefTarget = 0;
  let beliefCurrent = 0;
  let beliefMetrics = [];
  const measureBelief = () => {
    if (!beliefStage || !beliefSentence) return;
    beliefMetrics = beliefWords.map(word => ({
      x: beliefSentence.offsetLeft + word.offsetLeft + word.offsetWidth / 2,
      y: beliefSentence.offsetTop + word.offsetTop + word.offsetHeight / 2
    }));
  };
  const renderKineticBelief = () => {
    if (!kineticBelief || !beliefStage || !beliefWords.length || reduceMotion) return;
    if (!beliefMetrics.length) measureBelief();
    beliefCurrent = lerp(beliefCurrent, beliefTarget, .085);
    if (Math.abs(beliefTarget - beliefCurrent) < .00025) beliefCurrent = beliefTarget;
    const progress = beliefCurrent;
    const scatter = smoothstep(clamp((progress - .1) / .48));
    const fade = smoothstep(clamp((progress - .42) / .28));
    const settle = smoothstep(clamp((progress - .58) / .24));
    const stageWidth = beliefStage.clientWidth;
    const stageHeight = beliefStage.clientHeight;
    const focusTargets = {
      connect: [stageWidth * .33, stageHeight * .54],
      grow: [stageWidth * .5, stageHeight * .44],
      build: [stageWidth * .67, stageHeight * .55]
    };
    beliefWords.forEach((word, index) => {
      const metric = beliefMetrics[index];
      const normalized = beliefWords.length > 1 ? index / (beliefWords.length - 1) : .5;
      const angle = -2.75 + normalized * 5.5 + scatter * .85;
      const radius = (55 + Math.abs(normalized - .5) * stageWidth * .62) * scatter;
      const arcX = Math.cos(angle) * radius + (normalized - .5) * stageWidth * .34 * scatter;
      const arcY = Math.sin(angle) * stageHeight * .23 * scatter + (normalized - .5) * stageHeight * .34 * scatter;
      const focus = word.dataset.focus;
      let x = arcX;
      let y = arcY;
      let rotation = (normalized - .5) * 76 * scatter;
      let scale = 1;
      if (focus && focusTargets[focus]) {
        const [targetX, targetY] = focusTargets[focus];
        x = lerp(arcX, targetX - metric.x, settle);
        y = lerp(arcY, targetY - metric.y, settle);
        rotation = lerp(rotation, 0, settle);
        const resolvedScale = innerWidth <= 680 ? 1.08 : innerWidth <= 900 ? 1.48 : 2.15;
        scale = lerp(1, resolvedScale, settle);
        word.style.opacity = '1';
      } else {
        word.style.opacity = String(1 - fade);
      }
      word.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rotation}deg) scale(${scale})`;
    });
    kineticBelief.style.setProperty('--belief-progress', String(progress));
    kineticBelief.style.setProperty('--belief-field-opacity', String(scatter * .18 + settle * .82));
    kineticBelief.classList.toggle('is-resolved', progress > .82);
    if (beliefNumber) beliefNumber.textContent = String(Math.round(progress * 100)).padStart(3, '0');
    beliefFrame = Math.abs(beliefTarget - beliefCurrent) > .00025 ? requestAnimationFrame(renderKineticBelief) : 0;
  };
  const readKineticBelief = (immediate = false) => {
    if (!kineticBelief) return;
    const rect = kineticBelief.getBoundingClientRect();
    const travel = Math.max(1, kineticBelief.offsetHeight - innerHeight);
    beliefTarget = clamp(-rect.top / travel);
    if (immediate) beliefCurrent = beliefTarget;
    if (!beliefFrame) beliefFrame = requestAnimationFrame(renderKineticBelief);
  };
  if (kineticBelief && !reduceMotion) {
    measureBelief();
    // Windows Chrome often completes the first layout with the fallback font
    // and swaps in the web fonts a moment later. The old measurements then
    // send the three focus words to the wrong coordinates, making them collide.
    // Re-measure after every font-loading cycle so transforms always use the
    // metrics of the font that is actually visible.
    if (document.fonts) {
      document.fonts.ready.then(() => {
        beliefMetrics = [];
        measureBelief();
        readKineticBelief(true);
      });
      document.fonts.addEventListener?.('loadingdone', () => {
        beliefMetrics = [];
        measureBelief();
        readKineticBelief(true);
      });
    }
    addEventListener('scroll', () => readKineticBelief(), {passive:true});
    addEventListener('resize', () => {
      beliefMetrics = [];
      readKineticBelief(true);
    }, {passive:true});
    readKineticBelief(true);
  }

  const aboutAxis = document.querySelector('.about-axis');
  const axisChapters = aboutAxis ? [...aboutAxis.querySelectorAll('.axis-chapter')] : [];
  const axisNumber = aboutAxis?.querySelector('.axis-progress span');
  let axisFrame = 0;
  const renderAboutAxis = () => {
    if (!aboutAxis || !axisChapters.length) return;
    if (innerWidth <= 900 || reduceMotion) {
      aboutAxis.style.setProperty('--axis-progress', '1');
      aboutAxis.style.setProperty('--axis-turn', '28deg');
      aboutAxis.style.setProperty('--axis-counter-turn', '-28deg');
      axisChapters.forEach(chapter => chapter.removeAttribute('aria-hidden'));
      axisFrame = 0;
      return;
    }
    const rect = aboutAxis.getBoundingClientRect();
    const travel = Math.max(1, aboutAxis.offsetHeight - innerHeight);
    const progress = clamp(-rect.top / travel);
    const active = Math.min(axisChapters.length - 1, Math.floor(progress * axisChapters.length));
    const turn = progress * 270;
    aboutAxis.style.setProperty('--axis-progress', String(progress));
    aboutAxis.style.setProperty('--axis-turn', `${turn}deg`);
    aboutAxis.style.setProperty('--axis-counter-turn', `${turn * -1}deg`);
    axisChapters.forEach((chapter, index) => {
      const selected = index === active;
      chapter.classList.toggle('is-active', selected);
      chapter.setAttribute('aria-hidden', String(!selected));
    });
    if (axisNumber) axisNumber.textContent = String(active).padStart(2, '0');
    axisFrame = 0;
  };
  const requestAboutAxis = () => {
    if (!axisFrame) axisFrame = requestAnimationFrame(renderAboutAxis);
  };
  if (aboutAxis) {
    addEventListener('scroll', requestAboutAxis, {passive:true});
    addEventListener('resize', requestAboutAxis, {passive:true});
    renderAboutAxis();
  }

  document.querySelectorAll('.mailto-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = 'Website enquiry — ' + data.get('service');
    const body = 'Hello Ayaan Innovations,\n\n' + data.get('message') + '\n\nName: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\nService: ' + data.get('service');
    location.href = 'mailto:contact@ayaaninnovations.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }));
  document.querySelectorAll('[data-year]').forEach(element => element.textContent = new Date().getFullYear());
})();
