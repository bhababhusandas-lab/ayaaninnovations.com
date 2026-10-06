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

  const readScroll = () => {
    header?.classList.toggle('scrolled', scrollY > 35);
    if (!bookScroll || reduceMotion) return;
    const rect = bookScroll.getBoundingClientRect();
    const travel = Math.max(1, bookScroll.offsetHeight - innerHeight);
    target = clamp(-rect.top / travel);
    if (!frame) frame = requestAnimationFrame(renderBook);
  };

  const renderBook = () => {
    current = lerp(current, target, .085);
    const smootherstep = value => value * value * value * (value * (value * 6 - 15) + 10);
    // Keep the cover fully closed through the initial scroll gesture. This
    // prevents an accidental half-open pose from reading as a load glitch.
    const openPhase = smoothstep(clamp((current - .075) / .095));
    const closePhase = smoothstep(clamp((current - .88) / .12));
    const openness = openPhase * (1 - closePhase);
    const readingProgress = clamp((current - .17) / .71);
    const position = readingProgress * Math.max(1, bookPages.length - 1);
    const active = Math.min(bookPages.length - 1, Math.floor(position + .5));
    bookPages.forEach((page, index) => {
      const turn = clamp(position - index);
      const eased = smootherstep(turn);
      const curl = Math.sin(turn * Math.PI);
      const flutter = Math.sin(turn * Math.PI * 2) * curl;
      const finished = turn > .995;
      const zIndex = finished ? index + 1 : turn > .02 ? 100 : 30 + bookPages.length - index;
      page.style.setProperty('--turn', `${eased * -180}deg`);
      page.style.setProperty('--shade', String(curl * .92));
      page.style.setProperty('--curl', `${curl * -5.2 + flutter * .7}deg`);
      page.style.setProperty('--corner', `${curl * 42}px`);
      page.style.setProperty('--lift', `${curl * 34 + (finished ? index * .65 : 0)}px`);
      page.style.setProperty('--page-scale', String(1 - curl * .105));
      page.style.setProperty('--page-bow', `${flutter * 2.2}deg`);
      page.style.setProperty('--stack-x', `${finished ? index * -1.5 : 0}px`);
      page.style.setProperty('--stack-y', `${finished ? index * .8 : 0}px`);
      page.style.setProperty('--page-z', String(zIndex));
      page.classList.toggle('is-turned', finished);
      page.classList.toggle('is-turning', turn > .005 && turn < .995);
      page.setAttribute('aria-hidden', String(index !== active));
    });
    if (book) {
      const shift = innerWidth <= 680 ? 0 : -25 * (1 - openness);
      book.style.setProperty('--cover-turn', `${openness * -179.6}deg`);
      book.style.setProperty('--open-opacity', String(clamp(openness * 1.7)));
      book.style.setProperty('--book-shift', `${shift}%`);
      book.style.setProperty('--book-scale', String(.84 + openness * .16));
      book.style.setProperty('--book-stage-rx', `${(1 - openness) * 7}deg`);
    }
    document.body.classList.toggle('is-closed', openness < .08);
    if (bookStatus) bookStatus.textContent = current < .17 ? 'COVER / OPEN THE BOOK' : current > .88 ? 'COVER / CLOSE THE BOOK' : statusLabels[active];
    if (bookProgressNumber) bookProgressNumber.textContent = current < .17 ? '00' : current > .88 ? '06' : String(active + 1).padStart(2, '0');
    if (bookProgress) bookProgress.style.setProperty('--book-progress', `${current * 100}%`);
    frame = Math.abs(target - current) > .0003 ? requestAnimationFrame(renderBook) : 0;
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
  const serviceSection = serviceDeck?.closest('.section');
  if (serviceCards.length && !reduceMotion) {
    serviceCards.forEach((card, index) => {
      card.classList.add('deck-card');
      card.style.setProperty('--deck-index', String(index));
      card.dataset.deckLabel = card.querySelector('h2')?.textContent || `Service ${index + 1}`;
    });
    let deckFrame = 0;
    const renderDeck = () => {
      if (innerWidth <= 900) {
        serviceCards.forEach(card => {
          ['--card-x','--card-y','--card-z','--card-flip','--card-scale','--deck-opacity','--card-width'].forEach(property => card.style.removeProperty(property));
          const rect = card.getBoundingClientRect();
          const flip = smoothstep(clamp((innerHeight * .9 - rect.top) / (innerHeight * .42)));
          const angle = flip < .5 ? flip * 180 : -90 + (flip - .5) * 180;
          card.style.setProperty('--mobile-flip', `${angle}deg`);
          card.style.setProperty('--back-opacity', flip < .5 ? '1' : '0');
          card.classList.toggle('deck-active', flip > .96);
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

  document.querySelectorAll('.mailto-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = 'Website enquiry — ' + data.get('service');
    const body = 'Hello Ayaan Innovations,\n\n' + data.get('message') + '\n\nName: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\nService: ' + data.get('service');
    location.href = 'mailto:contact@ayaaninnovations.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }));
  document.querySelectorAll('[data-year]').forEach(element => element.textContent = new Date().getFullYear());
})();
