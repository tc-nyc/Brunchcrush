/* Custom illustrated SVG breakfast pieces — crisp & identical on iOS and Android.
   Includes Candy Crush-style Striped & Wrapped bonus pieces + full-screen themed line clear SVGs.
   Shared <defs> live in one persistent hidden SVG so iOS Safari never drops gradients when tiles pop. */
window.BRUNCH_ICONS = (() => {
  const TYPES = ['coffee', 'bacon', 'egg', 'avocado', 'chicken'];

  const META = {
    coffee: { label: 'Coffee', color: '#6B381B', wrapBg: '#9B5B34', wrapBorder: '#FFD6A5' },
    bacon: { label: 'Bacon', color: '#D9433B', wrapBg: '#E34E44', wrapBorder: '#FFD1CC' },
    egg: { label: 'Egg', color: '#F5B700', wrapBg: '#F6BE26', wrapBorder: '#FFF4B8' },
    avocado: { label: 'Avocado', color: '#47A843', wrapBg: '#58B647', wrapBorder: '#DDF7B5' },
    chicken: { label: 'Chicken', color: '#E07A22', wrapBg: '#EA862A', wrapBorder: '#FFE0B5' },
  };

  function injectSharedDefs() {
    if (document.getElementById('brunch-shared-svg-defs')) return;
    const holder = document.createElement('div');
    holder.id = 'brunch-shared-svg-defs';
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    holder.innerHTML = `
      <svg width="0" height="0" focusable="false">
        <defs>
          <radialGradient id="bc-cbCore" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFF2B2"/>
            <stop offset="45%" stop-color="#C86D28"/>
            <stop offset="100%" stop-color="#3E1B0C"/>
          </radialGradient>
          <radialGradient id="bc-beanG" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stop-color="#A6633B"/>
            <stop offset="52%" stop-color="#6B371B"/>
            <stop offset="100%" stop-color="#3A1A0B"/>
          </radialGradient>
          <linearGradient id="bc-baconG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#E85143"/>
            <stop offset="55%" stop-color="#C82D26"/>
            <stop offset="100%" stop-color="#8C1A16"/>
          </linearGradient>
          <radialGradient id="bc-eggWhite" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="80%" stop-color="#FFF7E6"/>
            <stop offset="100%" stop-color="#E7D8BE"/>
          </radialGradient>
          <radialGradient id="bc-eggYolk" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#FFE45E"/>
            <stop offset="55%" stop-color="#FFB703"/>
            <stop offset="100%" stop-color="#E07A00"/>
          </radialGradient>
          <linearGradient id="bc-avoFlesh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#D9F28C"/>
            <stop offset="100%" stop-color="#9BD651"/>
          </linearGradient>
          <radialGradient id="bc-avoPit" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#BA7A48"/>
            <stop offset="55%" stop-color="#7B431E"/>
            <stop offset="100%" stop-color="#4A240E"/>
          </radialGradient>
          <radialGradient id="bc-chickG" cx="34%" cy="30%" r="72%">
            <stop offset="0%" stop-color="#FFB347"/>
            <stop offset="55%" stop-color="#DE751E"/>
            <stop offset="100%" stop-color="#9C430B"/>
          </radialGradient>

          <!-- Candy Crush-style bold glossy white stripe patterns -->
          <pattern id="bc-stripe-h" width="12" height="11" patternUnits="userSpaceOnUse">
            <rect width="12" height="5.5" fill="rgba(255,255,255,0.88)"/>
            <rect y="5.5" width="12" height="1.2" fill="rgba(255,232,163,0.45)"/>
          </pattern>
          <pattern id="bc-stripe-v" width="11" height="12" patternUnits="userSpaceOnUse">
            <rect width="5.5" height="12" fill="rgba(255,255,255,0.88)"/>
            <rect x="5.5" width="1.2" height="12" fill="rgba(255,232,163,0.45)"/>
          </pattern>

          <!-- Piece silhouette clip paths so stripes paint directly onto each piece -->
          <clipPath id="bc-clip-coffee">
            <ellipse cx="32" cy="32" rx="18.5" ry="24.5" transform="rotate(-28 32 32)"/>
          </clipPath>
          <clipPath id="bc-clip-bacon">
            <path transform="rotate(-22 32 32)" d="M8 22 C16 14, 26 28, 35 20 C44 12, 52 24, 57 18 L57 42 C50 48, 42 36, 33 44 C24 52, 16 38, 8 46 Z"/>
          </clipPath>
          <clipPath id="bc-clip-egg">
            <path d="M32 7 C43 7, 50 13, 54 22 C58 31, 56 44, 48 51 C41 57, 29 58, 19 54 C10 50, 7 39, 9 29 C11 19, 17 14, 22 10 C26 8, 29 7, 32 7 Z"/>
          </clipPath>
          <clipPath id="bc-clip-avocado">
            <path d="M32 6 C41 6, 46 17, 50 28 C54 40, 48 56, 32 58 C16 56, 10 40, 14 28 C18 17, 23 6, 32 6 Z"/>
          </clipPath>
          <clipPath id="bc-clip-chicken">
            <path transform="rotate(-12 32 32)" d="M14 14 C23 7, 38 10, 44 20 C48 28, 46 37, 42 42 C37 46, 28 48, 20 43 C10 37, 6 22, 14 14 Z"/>
          </clipPath>

          <!-- Cellophane gloss gradient for Candy Crush-style wrapped pieces -->
          <linearGradient id="bc-wrapGloss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.72"/>
            <stop offset="32%" stop-color="#FFFFFF" stop-opacity="0.16"/>
            <stop offset="68%" stop-color="#FFF5D6" stop-opacity="0.06"/>
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.48"/>
          </linearGradient>

          <!-- Line blast gradients -->
          <linearGradient id="bc-coffeeJetG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C88B59"/>
            <stop offset="22%" stop-color="#7B401E"/>
            <stop offset="55%" stop-color="#4A210C"/>
            <stop offset="85%" stop-color="#6F3819"/>
            <stop offset="100%" stop-color="#351506"/>
          </linearGradient>
          <linearGradient id="bc-yolkStreamG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFE66D"/>
            <stop offset="50%" stop-color="#FFB703"/>
            <stop offset="100%" stop-color="#E87A00"/>
          </linearGradient>
          <linearGradient id="bc-guacG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#D4F27B"/>
            <stop offset="55%" stop-color="#88C946"/>
            <stop offset="100%" stop-color="#4D8B2A"/>
          </linearGradient>
          <linearGradient id="bc-chickBlastG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFE082"/>
            <stop offset="50%" stop-color="#F58220"/>
            <stop offset="100%" stop-color="#B84B0A"/>
          </linearGradient>
        </defs>
      </svg>
    `;
    document.body.appendChild(holder);
  }

  function getBasePieceMarkup(type) {
    switch (type) {
      case 'coffee':
        return `
          <g transform="rotate(-28 32 32)">
            <ellipse cx="32" cy="32" rx="19" ry="25" fill="url(#bc-beanG)" stroke="#2A1106" stroke-width="2.6"/>
            <path d="M20 22 C22 15, 28 12, 34 12" fill="none" stroke="#D99B72" stroke-width="3.2" stroke-linecap="round" opacity="0.65"/>
            <path d="M32 9 C26 19, 38 30, 32 42 C29 48, 30 53, 32 55" fill="none" stroke="#240E05" stroke-width="4.2" stroke-linecap="round"/>
            <path d="M33.5 11 C28.5 20, 39.5 30.5, 33.5 42" fill="none" stroke="#C5855A" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>
          </g>
        `;

      case 'bacon':
        return `
          <g transform="rotate(-22 32 32)">
            <path d="M8 22 C16 14, 26 28, 35 20 C44 12, 52 24, 57 18 L57 42 C50 48, 42 36, 33 44 C24 52, 16 38, 8 46 Z"
                  fill="url(#bc-baconG)" stroke="#6B1310" stroke-width="2.5" stroke-linejoin="round"/>
            <path d="M10 29 C18 22, 26 35, 35 27 C44 20, 50 30, 55 25"
                  fill="none" stroke="#FFE7C7" stroke-width="4.6" stroke-linecap="round"/>
            <path d="M10 38 C18 31, 26 44, 35 36 C44 29, 50 39, 55 34"
                  fill="none" stroke="#FFD0B5" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M13 24 C19 20, 25 25, 31 24" fill="none" stroke="#FF8B80" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
          </g>
        `;

      case 'egg':
        return `
          <path d="M32 7 C43 7, 50 13, 54 22 C58 31, 56 44, 48 51 C41 57, 29 58, 19 54 C10 50, 7 39, 9 29 C11 19, 17 14, 22 10 C26 8, 29 7, 32 7 Z"
                fill="url(#bc-eggWhite)" stroke="#C7B293" stroke-width="2.5"/>
          <circle cx="33" cy="33" r="13.5" fill="url(#bc-eggYolk)" stroke="#C96B00" stroke-width="2"/>
          <ellipse cx="28.5" cy="28" rx="4.2" ry="2.5" transform="rotate(-32 28.5 28)" fill="#FFFDF0" opacity="0.9"/>
          <circle cx="35.5" cy="26.5" r="1.5" fill="#FFFDF0" opacity="0.75"/>
        `;

      case 'avocado':
        return `
          <path d="M32 6 C41 6, 46 17, 50 28 C54 40, 48 56, 32 58 C16 56, 10 40, 14 28 C18 17, 23 6, 32 6 Z"
                fill="#2C6E2F" stroke="#19451B" stroke-width="2.5"/>
          <path d="M32 10.5 C39 10.5, 43 20, 46.5 29.5 C49.5 39, 45 52.5, 32 54 C19 52.5, 14.5 39, 17.5 29.5 C21 20, 25 10.5, 32 10.5 Z"
                fill="url(#bc-avoFlesh)"/>
          <ellipse cx="32" cy="39" rx="10.5" ry="11.5" fill="url(#bc-avoPit)" stroke="#3D1B09" stroke-width="1.8"/>
          <ellipse cx="28.5" cy="35" rx="3" ry="4.5" transform="rotate(-22 28.5 35)" fill="#E3B389" opacity="0.72"/>
        `;

      case 'chicken':
        return `
          <g transform="rotate(-12 32 32)">
            <path d="M40 39 L51 49" stroke="#C7B299" stroke-width="9.5" stroke-linecap="round" opacity="0.4"/>
            <circle cx="54" cy="47.5" r="5" fill="#FFF7EA" stroke="#B69F83" stroke-width="2"/>
            <circle cx="49" cy="53" r="5" fill="#FFF7EA" stroke="#B69F83" stroke-width="2"/>
            <path d="M39 38 L50 48" stroke="#FFF7EA" stroke-width="6.5" stroke-linecap="round"/>
            <path d="M14 14 C23 7, 38 10, 44 20 C48 28, 46 37, 42 42 C37 46, 28 48, 20 43 C10 37, 6 22, 14 14 Z"
                  fill="url(#bc-chickG)" stroke="#753008" stroke-width="2.5"/>
            <path d="M18 19 C22 15, 29 14, 34 17" fill="none" stroke="#FFE09E" stroke-width="3.2" stroke-linecap="round" opacity="0.8"/>
            <circle cx="24" cy="27" r="2.2" fill="#B55010" opacity="0.55"/>
            <circle cx="33" cy="25" r="2" fill="#B55010" opacity="0.55"/>
            <circle cx="29" cy="35" r="2.4" fill="#B55010" opacity="0.5"/>
          </g>
        `;

      default:
        return '';
    }
  }

  function getPieceSvg(type, special) {
    injectSharedDefs();

    if (special === 'color-bomb') {
      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="url(#bc-cbCore)" stroke="#FFE599" stroke-width="3"/>
          <circle cx="32" cy="32" r="19" fill="none" stroke="#FFCC66" stroke-width="2" stroke-dasharray="4 4"/>
          <circle cx="21" cy="21" r="4" fill="#FF595E"/>
          <circle cx="43" cy="21" r="4" fill="#8AC926"/>
          <circle cx="20" cy="41" r="4" fill="#FFCA3A"/>
          <circle cx="44" cy="41" r="4" fill="#FFF8E7"/>
          <circle cx="32" cy="14" r="3.5" fill="#FF924C"/>
          <circle cx="32" cy="50" r="3.5" fill="#52B788"/>
          <ellipse cx="32" cy="32" rx="9" ry="12" transform="rotate(-24 32 32)" fill="#4B2412" stroke="#FFE599" stroke-width="2"/>
          <path d="M29 22 C33 27, 30 35, 35 42" fill="none" stroke="#FFE599" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      `;
    }

    const base = getBasePieceMarkup(type);
    const meta = META[type] || META.coffee;

    // Candy Crush-style Striped Piece: bold glossy stripes painted right across the piece + directional arrows
    if (special === 'striped-h' || special === 'striped-v') {
      const patternId = special === 'striped-h' ? 'bc-stripe-h' : 'bc-stripe-v';
      const arrows =
        special === 'striped-h'
          ? `
            <polygon points="2,32 10,25 10,39" fill="#FFF9DB" stroke="#5A2A0C" stroke-width="1.8" stroke-linejoin="round"/>
            <polygon points="62,32 54,25 54,39" fill="#FFF9DB" stroke="#5A2A0C" stroke-width="1.8" stroke-linejoin="round"/>
          `
          : `
            <polygon points="32,2 25,10 39,10" fill="#FFF9DB" stroke="#5A2A0C" stroke-width="1.8" stroke-linejoin="round"/>
            <polygon points="32,62 25,54 39,54" fill="#FFF9DB" stroke="#5A2A0C" stroke-width="1.8" stroke-linejoin="round"/>
          `;

      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <g transform="translate(32 32) scale(0.92) translate(-32 -32)">
            ${base}
            <rect x="0" y="0" width="64" height="64" fill="url(#${patternId})" clip-path="url(#bc-clip-${type})" opacity="0.88"/>
            ${type === 'egg' ? `<circle cx="33" cy="33" r="11" fill="url(#bc-eggYolk)" opacity="0.45"/>` : ''}
          </g>
          ${arrows}
        </svg>
      `;
    }

    // Candy Crush-style Wrapped Piece: translucent crinkled cellophane candy wrapper with twisted ends!
    if (special === 'wrapped') {
      return `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <!-- Back crinkled twisted wrapper wings -->
          <path d="M12 24 L2 16 L6 32 L2 48 L12 40 Z" fill="${meta.wrapBg}" fill-opacity="0.72" stroke="${meta.wrapBorder}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M52 24 L62 16 L58 32 L62 48 L52 40 Z" fill="${meta.wrapBg}" fill-opacity="0.72" stroke="${meta.wrapBorder}" stroke-width="2" stroke-linejoin="round"/>
          <!-- Back translucent wrapper pouch -->
          <rect x="11" y="10" width="42" height="44" rx="12" fill="${meta.wrapBg}" fill-opacity="0.42" stroke="${meta.wrapBorder}" stroke-width="2.2"/>
          <!-- Breakfast piece tucked inside wrapper -->
          <g transform="translate(32 32) scale(0.76) translate(-32 -32)">
            ${base}
          </g>
          <!-- Front glossy cellophane sheen & twist pinch creases -->
          <rect x="11" y="10" width="42" height="44" rx="12" fill="url(#bc-wrapGloss)" stroke="#FFFDF5" stroke-opacity="0.85" stroke-width="1.8"/>
          <path d="M16 15 C24 12, 34 12, 46 15" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.82"/>
          <path d="M15 26 L11 32 L15 38" fill="none" stroke="#FFF8E1" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
          <path d="M49 26 L53 32 L49 38" fill="none" stroke="#FFF8E1" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
          <circle cx="19" cy="18" r="2.2" fill="#FFFFFF" opacity="0.9"/>
        </svg>
      `;
    }

    return `<svg viewBox="0 0 64 64" aria-hidden="true">${base}</svg>`;
  }

  // Full-screen themed line-clear SVG animations! (Horizontal viewBox 600x110; rotated 90deg for vertical columns)
  function getLineBlastSvg(type) {
    injectSharedDefs();

    switch (type) {
      case 'bacon':
        // Giant sizzling wavy strip of bacon flashing across the screen!
        return `
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 34 C48 12, 96 50, 150 28 C204 8, 252 46, 306 24 C360 6, 412 46, 468 24 C518 6, 560 38, 600 22
                     L600 84 C554 98, 512 68, 462 88 C406 106, 354 68, 300 88 C246 108, 198 68, 144 88 C90 108, 44 70, 0 88 Z"
                  fill="url(#bc-baconG)" stroke="#5E100D" stroke-width="4" stroke-linejoin="round"/>
            <path d="M0 48 C48 26, 96 64, 150 42 C204 22, 252 60, 306 38 C360 20, 412 60, 468 38 C518 20, 560 52, 600 36"
                  fill="none" stroke="#FFEBD0" stroke-width="11" stroke-linecap="round"/>
            <path d="M0 68 C48 46, 96 84, 150 62 C204 42, 252 80, 306 58 C360 40, 412 80, 468 58 C518 40, 560 72, 600 56"
                  fill="none" stroke="#FFD2B8" stroke-width="8" stroke-linecap="round"/>
            <!-- Sizzle sparks -->
            <g fill="#FFF3B0">
              <circle cx="85" cy="18" r="5"/>
              <circle cx="195" cy="96" r="4.5"/>
              <circle cx="320" cy="14" r="5.5"/>
              <circle cx="430" cy="95" r="5"/>
              <circle cx="535" cy="16" r="4"/>
            </g>
          </svg>
        `;

      case 'coffee':
        // Big rich brown jet of coffee surging across the screen with crema & splashes!
        return `
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 44 C70 28, 140 34, 210 24 C290 14, 370 30, 450 20 C515 12, 560 24, 600 16
                     L600 94 C540 84, 480 98, 410 88 C330 78, 250 96, 170 84 C100 74, 45 84, 0 70 Z"
                  fill="url(#bc-coffeeJetG)"/>
            <!-- Frothy crema foam ribbons -->
            <path d="M12 48 C95 36, 185 48, 285 38 C385 28, 485 44, 588 32"
                  fill="none" stroke="#E5B78A" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
            <path d="M35 66 C135 58, 240 72, 345 60 C445 50, 520 66, 590 56"
                  fill="none" stroke="#F7DEC1" stroke-width="4.5" stroke-linecap="round" opacity="0.72"/>
            <!-- Flying coffee droplets -->
            <g fill="#5A2910" stroke="#C88B59" stroke-width="1.5">
              <ellipse cx="90" cy="16" rx="10" ry="5" transform="rotate(-12 90 16)"/>
              <ellipse cx="220" cy="98" rx="12" ry="5" transform="rotate(8 220 98)"/>
              <ellipse cx="355" cy="12" rx="14" ry="5.5" transform="rotate(-8 355 12)"/>
              <ellipse cx="475" cy="98" rx="11" ry="5" transform="rotate(10 475 98)"/>
              <circle cx="150" cy="14" r="4"/>
              <circle cx="420" cy="16" r="4.5"/>
              <circle cx="540" cy="96" r="4"/>
            </g>
          </svg>
        `;

      case 'egg':
        // Runny fried egg splatter & oozing golden yolk streaking across the screen!
        return `
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
            <!-- Flowing runny egg white ribbon -->
            <path d="M0 36 C55 14, 115 40, 175 20 C240 4, 300 34, 365 16 C430 4, 495 32, 555 18 C578 13, 592 22, 600 28
                     L600 84 C550 100, 495 76, 435 94 C370 108, 305 78, 240 96 C175 108, 115 78, 55 92 C28 98, 10 88, 0 78 Z"
                  fill="url(#bc-eggWhite)" stroke="#D9C5A3" stroke-width="3.5"/>
            <!-- Oozing runny golden yolk stream -->
            <path d="M8 52 C70 36, 130 64, 200 48 C270 32, 335 66, 410 46 C480 28, 540 58, 594 44
                     L594 68 C535 84, 470 58, 400 76 C330 92, 265 62, 195 76 C125 90, 65 66, 8 72 Z"
                  fill="url(#bc-yolkStreamG)"/>
            <!-- Glossy yolk puddles & runny drips -->
            <ellipse cx="145" cy="56" rx="28" ry="18" fill="url(#bc-eggYolk)" stroke="#D97800" stroke-width="2"/>
            <ellipse cx="345" cy="54" rx="34" ry="20" fill="url(#bc-eggYolk)" stroke="#D97800" stroke-width="2"/>
            <ellipse cx="515" cy="55" rx="24" ry="16" fill="url(#bc-eggYolk)" stroke="#D97800" stroke-width="2"/>
            <!-- Specular glossy egg highlights -->
            <ellipse cx="136" cy="48" rx="9" ry="4" fill="#FFFDF2" opacity="0.9"/>
            <ellipse cx="332" cy="45" rx="11" ry="4.5" fill="#FFFDF2" opacity="0.9"/>
            <ellipse cx="507" cy="48" rx="7" ry="3.5" fill="#FFFDF2" opacity="0.9"/>
            <circle cx="245" cy="96" r="6" fill="#FFB703"/>
            <circle cx="440" cy="98" r="5" fill="#FFB703"/>
            <circle cx="80" cy="16" r="5" fill="#FFFDF5" stroke="#D9C5A3" stroke-width="1.5"/>
          </svg>
        `;

      case 'avocado':
        // Bunch of mushed-up chunky avocado / guacamole splattered across the screen!
        return `
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
            <!-- Main mashed guacamole smear -->
            <path d="M0 40 C42 16, 92 38, 142 18 C195 4, 245 34, 302 16 C358 4, 414 36, 472 18 C525 6, 565 28, 600 20
                     L600 88 C555 102, 505 78, 450 94 C392 108, 336 78, 280 96 C222 108, 168 80, 112 94 C62 106, 26 84, 0 80 Z"
                  fill="url(#bc-guacG)" stroke="#2E6B24" stroke-width="3.5"/>
            <!-- Chunky mushed avocado lumps (lighter lime & deep green chunks) -->
            <g fill="#DDF68E" stroke="#5B9E32" stroke-width="1.5">
              <ellipse cx="75" cy="52" rx="22" ry="13" transform="rotate(-10 75 52)"/>
              <ellipse cx="185" cy="46" rx="26" ry="14" transform="rotate(8 185 46)"/>
              <ellipse cx="295" cy="60" rx="24" ry="15" transform="rotate(-6 295 60)"/>
              <ellipse cx="410" cy="48" rx="28" ry="14" transform="rotate(10 410 48)"/>
              <ellipse cx="525" cy="58" rx="24" ry="13" transform="rotate(-8 525 58)"/>
            </g>
            <!-- Fresh mashed avocado chunks & tomato/lime flecks -->
            <g fill="#3E7C27">
              <rect x="115" y="42" width="12" height="10" rx="4" transform="rotate(18 115 42)"/>
              <rect x="242" y="38" width="14" height="11" rx="4" transform="rotate(-14 242 38)"/>
              <rect x="352" y="56" width="13" height="10" rx="4" transform="rotate(12 352 56)"/>
              <rect x="468" y="40" width="14" height="11" rx="4" transform="rotate(-18 468 40)"/>
            </g>
            <!-- Flying guac splats -->
            <g fill="#92D14F" stroke="#2E6B24" stroke-width="1.8">
              <circle cx="52" cy="15" r="7"/>
              <circle cx="165" cy="96" r="8"/>
              <circle cx="275" cy="14" r="6.5"/>
              <circle cx="385" cy="98" r="7.5"/>
              <circle cx="498" cy="14" r="7"/>
              <circle cx="565" cy="96" r="6"/>
            </g>
          </svg>
        `;

      case 'chicken':
      default:
        // Golden crispy sizzle streak
        return `
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 44 C85 24, 175 42, 265 24 C360 10, 455 38, 600 22
                     L600 88 C465 76, 365 98, 270 84 C175 72, 85 92, 0 70 Z"
                  fill="url(#bc-chickBlastG)" stroke="#7A3107" stroke-width="3.5"/>
            <path d="M10 54 C140 40, 290 64, 440 46 C500 40, 550 52, 592 48"
                  fill="none" stroke="#FFF4C2" stroke-width="9" stroke-linecap="round" opacity="0.88"/>
            <g fill="#FFE082">
              <circle cx="110" cy="20" r="5"/>
              <circle cx="240" cy="94" r="5.5"/>
              <circle cx="390" cy="18" r="6"/>
              <circle cx="520" cy="92" r="5"/>
            </g>
          </svg>
        `;
    }
  }

  return {
    TYPES,
    META,
    getPieceSvg,
    getLineBlastSvg,
  };
})();
