const fs = require('fs');
const filePath = 'c:\\Users\\jcama\\Downloads\\PAGINA GPS\\index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Add CSS for mobile centered cards, backdrop, and gallery arrows
const originalStyleEnd = `    .ref-empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--brand-navy-primary);
      font-family: var(--font-mono);
      font-size: .9rem;
    }
  </style>`;

const newStyleEnd = `    .ref-empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--brand-navy-primary);
      font-family: var(--font-mono);
      font-size: .9rem;
    }

    /* Mobile Map Gallery Styles */
    @media (max-width: 768px) {
      .map-card {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        bottom: auto !important;
        right: auto !important;
        width: 90% !important;
        max-width: 290px !important;
        transform: translate(-50%, -30%) scale(0.9) !important;
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s !important;
        z-index: 1000 !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
      }

      .map-card.is-open {
        transform: translate(-50%, -50%) scale(1) !important;
        opacity: 1;
        pointer-events: auto;
      }

      .map-gallery-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(8, 21, 33, 0.7);
        backdrop-filter: blur(5px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        z-index: 999;
      }

      .map-gallery-backdrop.is-active {
        opacity: 1;
        pointer-events: auto;
      }

      .map-gallery-arrow {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 78, 115, 0.15);
        color: var(--brand-navy-primary);
        font-size: 24px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1001;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s, transform 0.2s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .map-gallery-arrow.is-active {
        opacity: 1;
        pointer-events: auto;
      }

      .map-gallery-arrow:active {
        transform: translateY(-50%) scale(0.9);
      }

      .map-gallery-arrow.prev {
        left: 10px;
      }

      .map-gallery-arrow.next {
        right: 10px;
      }
    }
  </style>`;

if (!content.includes(originalStyleEnd)) {
  console.error("Could not find style close tag block");
  process.exit(1);
}
content = content.replace(originalStyleEnd, newStyleEnd);

// 2. Modify map pins and cards logic in JavaScript
const originalMapJS = `    // Map pins + cards
    const mapWrap = document.getElementById('mapWrap');
    const svgEl = document.getElementById('world-map');
    let activePin = null;

    function closeAllCards() {
      document.querySelectorAll('.map-card.is-open').forEach(c => c.classList.remove('is-open'));
      document.querySelectorAll('.pin.is-active').forEach(p => p.classList.remove('is-active'));
      activePin = null;
    }

    function openPin(pin) {
      const id = pin.getAttribute('data-id');
      const card = document.getElementById('card-' + id);
      if (!card) return;
      if (activePin === id) { closeAllCards(); return; }
      closeAllCards();
      const x = parseFloat(pin.getAttribute('data-x'));
      const y = parseFloat(pin.getAttribute('data-y'));
      const vb = svgEl.viewBox.baseVal;
      const leftPct = ((x - vb.x) / vb.width) * 100;
      const topPct = ((y - vb.y) / vb.height) * 100;
      card.style.left = leftPct + '%';
      card.style.top = topPct + '%';
      card.classList.add('is-open');
      pin.classList.add('is-active');
      activePin = id;
    }`;

const newMapJS = `    // Map pins + cards
    const mapWrap = document.getElementById('mapWrap');
    const svgEl = document.getElementById('world-map');
    let activePin = null;
    let sortedPins = [];

    function initMapGallery() {
      const pins = Array.from(document.querySelectorAll('.pin'));
      // Sort pins by data-x (West to East) for geographic gallery flow
      sortedPins = pins.sort((a, b) => {
        return parseFloat(a.getAttribute('data-x')) - parseFloat(b.getAttribute('data-x'));
      });

      const backdrop = document.createElement('div');
      backdrop.id = 'map-gallery-backdrop';
      backdrop.className = 'map-gallery-backdrop';

      const prevBtn = document.createElement('button');
      prevBtn.id = 'map-gallery-prev';
      prevBtn.className = 'map-gallery-arrow prev';
      prevBtn.innerHTML = '‹';
      prevBtn.setAttribute('aria-label', 'Anterior');

      const nextBtn = document.createElement('button');
      nextBtn.id = 'map-gallery-next';
      nextBtn.className = 'map-gallery-arrow next';
      nextBtn.innerHTML = '›';
      nextBtn.setAttribute('aria-label', 'Siguiente');

      document.body.appendChild(backdrop);
      document.body.appendChild(prevBtn);
      document.body.appendChild(nextBtn);

      backdrop.addEventListener('click', closeAllCards);
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateMapGallery(-1);
      });
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateMapGallery(1);
      });
    }

    function navigateMapGallery(direction) {
      if (!activePin) return;
      const currentIndex = sortedPins.findIndex(p => p.getAttribute('data-id') === activePin);
      if (currentIndex === -1) return;

      const newIndex = (currentIndex + direction + sortedPins.length) % sortedPins.length;
      const targetPin = sortedPins[newIndex];
      openPin(targetPin);
    }

    function closeAllCards() {
      document.querySelectorAll('.map-card.is-open').forEach(c => c.classList.remove('is-open'));
      document.querySelectorAll('.pin.is-active').forEach(p => p.classList.remove('is-active'));
      activePin = null;

      const backdrop = document.getElementById('map-gallery-backdrop');
      const prevBtn = document.getElementById('map-gallery-prev');
      const nextBtn = document.getElementById('map-gallery-next');
      if (backdrop) backdrop.classList.remove('is-active');
      if (prevBtn) prevBtn.classList.remove('is-active');
      if (nextBtn) nextBtn.classList.remove('is-active');
    }

    function openPin(pin) {
      const id = pin.getAttribute('data-id');
      const card = document.getElementById('card-' + id);
      if (!card) return;
      if (activePin === id) { closeAllCards(); return; }
      closeAllCards();

      pin.classList.add('is-active');
      activePin = id;

      if (window.innerWidth <= 768) {
        card.classList.add('is-open');
        const backdrop = document.getElementById('map-gallery-backdrop');
        const prevBtn = document.getElementById('map-gallery-prev');
        const nextBtn = document.getElementById('map-gallery-next');
        if (backdrop) backdrop.classList.add('is-active');
        if (prevBtn) prevBtn.classList.add('is-active');
        if (nextBtn) nextBtn.classList.add('is-active');
      } else {
        const x = parseFloat(pin.getAttribute('data-x'));
        const y = parseFloat(pin.getAttribute('data-y'));
        const vb = svgEl.viewBox.baseVal;
        const leftPct = ((x - vb.x) / vb.width) * 100;
        const topPct = ((y - vb.y) / vb.height) * 100;
        card.style.left = leftPct + '%';
        card.style.top = topPct + '%';
        card.classList.add('is-open');
      }
    }`;

if (!content.includes(originalMapJS)) {
  console.error("Could not find originalMapJS");
  process.exit(1);
}
content = content.replace(originalMapJS, newMapJS);

// 3. Update pin and country mouseenter behavior to only run on desktop, and call initMapGallery()
const originalPinEvents = `    document.querySelectorAll('.pin').forEach(pin => {
      pin.addEventListener('click', (e) => { e.stopPropagation(); openPin(pin); });
      pin.addEventListener('mouseenter', () => openPin(pin));
      pin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPin(pin); }
      });
    });

    // Activar países dinámicamente y mapear clicks/hovers a sus pines
    Object.keys(countryToPinMap).forEach(countryId => {
      const countryPath = document.getElementById(countryId);
      if (countryPath) {
        countryPath.classList.add('active-country');
        const pinId = countryToPinMap[countryId];
        const pin = document.querySelector(\`.pin[data-id="\${pinId}"]\`);
        if (pin) {
          countryPath.addEventListener('click', (e) => {
            e.stopPropagation();
            openPin(pin);
          });
          countryPath.addEventListener('mouseenter', () => {
            openPin(pin);
          });
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.pin') && !e.target.closest('.map-card') && !e.target.closest('.country')) closeAllCards();
    });`;

const newPinEvents = `    document.querySelectorAll('.pin').forEach(pin => {
      pin.addEventListener('click', (e) => { e.stopPropagation(); openPin(pin); });
      pin.addEventListener('mouseenter', () => {
        if (window.innerWidth > 768) openPin(pin);
      });
      pin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPin(pin); }
      });
    });

    // Activar países dinámicamente y mapear clicks/hovers a sus pines
    Object.keys(countryToPinMap).forEach(countryId => {
      const countryPath = document.getElementById(countryId);
      if (countryPath) {
        countryPath.classList.add('active-country');
        const pinId = countryToPinMap[countryId];
        const pin = document.querySelector(\`.pin[data-id="\${pinId}"]\`);
        if (pin) {
          countryPath.addEventListener('click', (e) => {
            e.stopPropagation();
            openPin(pin);
          });
          countryPath.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) openPin(pin);
          });
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.pin') && !e.target.closest('.map-card') && !e.target.closest('.country')) closeAllCards();
    });

    // Initialize Map Gallery on mobile
    initMapGallery();`;

if (!content.includes(originalPinEvents)) {
  console.error("Could not find originalPinEvents");
  process.exit(1);
}
content = content.replace(originalPinEvents, newPinEvents);

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Map gallery patch applied successfully!");
