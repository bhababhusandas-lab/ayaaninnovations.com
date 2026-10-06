/* Motion patterns adapted from Animata and Animate UI.
 * See THIRD_PARTY_NOTICES.md for sources and retained license notices.
 * All scrolling uses the browser's native scroll position.
 */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = media.matches;
  let currentScroll = window.scrollY;
  let targetScroll = currentScroll;
  let frame = 0;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const reveals = $$('.reveal');
  const motionButton = $('#motion-toggle');
  const wordElements = [];
  let wordTop = 0;
  let processData = [];
  const flower = $('.approach-flower');

  // Three complete color worlds; selection persists without leaving the page.
  const themeColors = {atelier:'#f3f1e9', nocturne:'#0c0d15', signal:'#e8ffd0'};
  const themeButtons = $$('.theme-dot');
  function setTheme(theme) {
    if (!themeColors[theme]) theme = 'atelier';
    document.documentElement.dataset.theme = theme;
    $('#browser-theme').setAttribute('content', themeColors[theme]);
    themeButtons.forEach(button => {
      const active = button.dataset.theme === theme;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('ayaan-theme', theme); } catch (_) {}
  }
  themeButtons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme)));
  setTheme(document.documentElement.dataset.theme);

  // A restrained pointer response makes the hero object feel physically present.
  const heroVisual = $('.hero-art-v2');
  const prismWrap = $('.prism-wrap');
  if (heroVisual && prismWrap && matchMedia('(pointer:fine)').matches) {
    heroVisual.addEventListener('pointermove', event => {
      if (paused) return;
      const bounds = heroVisual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      prismWrap.style.setProperty('--prism-x', (x * 22).toFixed(1) + 'px');
      prismWrap.style.setProperty('--prism-y', (y * 16).toFixed(1) + 'px');
      prismWrap.style.setProperty('--prism-r', (x * 2.4).toFixed(2) + 'deg');
    });
    heroVisual.addEventListener('pointerleave', () => {
      prismWrap.style.setProperty('--prism-x','0px');
      prismWrap.style.setProperty('--prism-y','0px');
      prismWrap.style.setProperty('--prism-r','0deg');
    });
  }

  // Group intact words, with one accessible copy of the complete sentence.
  $$('.word-reveal').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.replaceChildren();
    text.split(/\s+/).forEach((word, index) => {
      if (index) el.append(' ');
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.setAttribute('aria-hidden', 'true');
      el.append(span);
      wordElements.push(span);
    });
  });

  function measure() {
    const paragraph = $('.word-reveal');
    wordTop = paragraph.getBoundingClientRect().top + window.scrollY;
    processData = $$('.process-card').map(el => ({
      el, top: el.offsetTop, height: el.offsetHeight
    }));
    targetScroll = window.scrollY;
    requestRender();
  }
  function render() {
    frame = 0;
    if (paused || document.hidden) return;
    currentScroll += (targetScroll - currentScroll) * .17;
    const readProgress = clamp((currentScroll + innerHeight * .85 - wordTop) / (innerHeight * .55));
    wordElements.forEach((word, i) => {
      const local = clamp(readProgress * (wordElements.length + 3) - i);
      word.style.opacity = String(.27 + local * .73);
    });
    processData.forEach(({el}, index) => {
      const next = processData[index + 1]?.el;
      if (!next) return;
      const nextTop = next.getBoundingClientRect().top;
      const stickyTop = parseFloat(getComputedStyle(el).top) || 0;
      const progress = clamp((innerHeight * .75 - nextTop) / Math.max(1, innerHeight * .75 - stickyTop));
      el.style.transform = 'scale(' + (1 - progress * .045) + ')';
    });
    flower.style.setProperty('--flower-angle', currentScroll * .035 + 'deg');
    if (Math.abs(targetScroll - currentScroll) > .15) requestRender();
  }
  function requestRender() {
    if (!frame && !paused) frame = requestAnimationFrame(render);
  }
  function updateMotion() {
    document.documentElement.classList.toggle('js-motion', !paused);
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.disabled = media.matches;
    $('.motion-label', motionButton).textContent = media.matches ? 'REDUCED MOTION' : paused ? 'PLAY MOTION' : 'PAUSE MOTION';
    $('.motion-indicator', motionButton).textContent = paused ? '▷' : 'Ⅱ';
    motionButton.title = media.matches ? 'Reduced motion follows your device preference.' : '';
    if (paused) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      wordElements.forEach(word => word.style.opacity = '1');
      processData.forEach(({el}) => el.style.transform = '');
      reveals.forEach(el => el.classList.add('is-visible'));
    } else {
      currentScroll = targetScroll = window.scrollY;
      requestRender();
    }
    window.dispatchEvent(new CustomEvent('ayaan:motion', {detail:{paused}}));
  }
  motionButton.addEventListener('click', () => {paused = !paused; updateMotion();});
  media.addEventListener('change', () => {paused = media.matches; updateMotion();});
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:.08});
  reveals.forEach(el => observer.observe(el));
  window.addEventListener('scroll', () => {targetScroll = window.scrollY; requestRender();}, {passive:true});
  window.addEventListener('resize', measure, {passive:true});
  document.addEventListener('visibilitychange', () => {if (!document.hidden) {measure(); requestRender();}});

  // Height transitions keep adjacent rows in the normal document flow.
  $$('.service-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.service-item');
      const open = !item.classList.contains('is-open');
      $$('.service-item').forEach(service => {
        const active = service === item && open;
        service.classList.toggle('is-open', active);
        $('.service-toggle', service).setAttribute('aria-expanded', String(active));
        $('.service-panel', service).inert = !active;
      });
      // Re-measure after the accordion has changed the page height.
      setTimeout(measure, paused ? 0 : 700);
    });
  });

  // Native dialogs provide focus trapping and Escape support.
  let returnFocus = null;
  function openDialog(dialog, trigger) {
    returnFocus = trigger || document.activeElement;
    if (dialog.open) return;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  function closeDialog(dialog) {dialog.close();}
  $$('dialog').forEach(dialog => {
    $('.close-dialog', dialog).addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      returnFocus?.focus({preventScroll:true});
    });
  });
  const menu = $('#menu-dialog');
  $('.menu-toggle').addEventListener('click', event => openDialog(menu, event.currentTarget));
  $$('a', menu).forEach(link => link.addEventListener('click', () => closeDialog(menu)));

  const enquiry = $('#contact-dialog');
  function enquire(trigger, service) {
    const select = $('select[name="service"]', enquiry);
    select.value = service || "Let's explore together";
    $('#form-status').textContent = '';
    openDialog(enquiry, trigger);
  }
  $$('.contact-trigger').forEach(button => button.addEventListener('click', () => enquire(button, button.dataset.service)));
  $('#enquiry-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = 'A new idea — ' + data.get('service');
    const body = 'Hi Ayaan Innovations,\n\n' + String(data.get('message')).trim() +
      '\n\nInterested in: ' + data.get('service') +
      '\n\n' + String(data.get('name')).trim() + '\n' + data.get('email');
    window.location.href = 'mailto:contact@ayaaninnovations.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    $('#form-status').textContent = 'Your email draft is ready to open. Review and send it in your email app. If an app did not open, use the email address below.';
  });

  const concepts = {
    morrow: {
      title:'Morrow', subtitle:'A softer kind of everyday.',
      tags:'CONCEPT 01 · BRAND / DIGITAL COMMERCE',
      description:'An original concept for a considered daily-care brand. Warm materials, quiet typography, and tactile product presentation turn everyday essentials into small moments of care.',
      details:'The exploration brings brand positioning, packaging direction, and a digital storefront together in one visual language.'
    },
    forma: {
      title:'Forma', subtitle:'Space for a new perspective.',
      tags:'CONCEPT 02 · ART DIRECTION / WEB EXPERIENCE',
      description:'An original concept for an architecture and interiors studio. Sculptural forms, earthy colors, and generous space give the digital experience the same sense of intention as the spaces it celebrates.',
      details:'The exploration pairs art direction with an editorial website, using subtle movement to guide attention through the story.'
    }
  };
  $$('.project[data-project]').forEach(button => {
    button.addEventListener('click', () => {
      const concept = concepts[button.dataset.project];
      const detail = $('#project-detail');
      detail.replaceChildren();
      const grid = document.createElement('div');
      grid.className = 'project-detail-grid';
      const art = $('.project-visual', button).cloneNode(true);
      $('.project-open', art)?.remove();
      art.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('div');
      copy.className = 'project-detail-copy';
      const tag = document.createElement('span');
      tag.className = 'micro'; tag.textContent = concept.tags;
      const heading = document.createElement('h2');
      heading.textContent = concept.title;
      const sub = document.createElement('h3');
      sub.textContent = concept.subtitle;
      const description = document.createElement('p');
      description.textContent = concept.description;
      const details = document.createElement('p');
      details.textContent = concept.details;
      const label = document.createElement('p');
      label.textContent = 'A self-initiated design study, not a commissioned client project.';
      label.className = 'micro';
      const cta = document.createElement('a');
      cta.className = 'pill-button dark'; cta.href = '#contact'; cta.textContent = 'Imagine your next project ↗';
      cta.addEventListener('click', () => closeDialog($('#project-dialog')));
      copy.append(tag, heading, sub, description, details, label, cta);
      grid.append(art, copy); detail.append(grid);
      openDialog($('#project-dialog'), button);
    });
  });
  $('#year').textContent = String(new Date().getFullYear());
  measure();
  updateMotion();
  document.fonts.ready.then(measure);
})();
