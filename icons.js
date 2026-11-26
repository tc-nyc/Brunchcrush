/* Custom illustrated SVG breakfast pieces — crisp & identical on iOS and Android.
   Shared <defs> live in one persistent hidden SVG so iOS Safari never drops gradients when tiles pop. */
window.BRUNCH_ICONS = (() => {
  const TYPES = ['coffee', 'bacon', 'egg', 'avocado', 'chicken'];

  const META = {
    coffee: { label: 'Coffee', color: '#6B381B' },
    bacon: { label: 'Bacon', color: '#D9433B' },
    egg: { label: 'Egg', color: '#F5B700' },
    avocado: { label: 'Avocado', color: '#47A843' },
    chicken: { label: 'Chicken', color: '#E07A22' },
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
        </defs>
      </svg>
    `;
    document.body.appendChild(holder);
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

    switch (type) {
      case 'coffee':
        return `
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <g transform="rotate(-28 32 32)">
              <ellipse cx="32" cy="32" rx="19" ry="25" fill="url(#bc-beanG)" stroke="#2A1106" stroke-width="2.6"/>
              <path d="M20 22 C22 15, 28 12, 34 12" fill="none" stroke="#D99B72" stroke-width="3.2" stroke-linecap="round" opacity="0.65"/>
              <path d="M32 9 C26 19, 38 30, 32 42 C29 48, 30 53, 32 55" fill="none" stroke="#240E05" stroke-width="4.2" stroke-linecap="round"/>
              <path d="M33.5 11 C28.5 20, 39.5 30.5, 33.5 42" fill="none" stroke="#C5855A" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>
            </g>
          </svg>
        `;

      case 'bacon':
        return `
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <g transform="rotate(-22 32 32)">
              <path d="M8 22 C16 14, 26 28, 35 20 C44 12, 52 24, 57 18 L57 42 C50 48, 42 36, 33 44 C24 52, 16 38, 8 46 Z"
                    fill="url(#bc-baconG)" stroke="#6B1310" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M10 29 C18 22, 26 35, 35 27 C44 20, 50 30, 55 25"
                    fill="none" stroke="#FFE7C7" stroke-width="4.6" stroke-linecap="round"/>
              <path d="M10 38 C18 31, 26 44, 35 36 C44 29, 50 39, 55 34"
                    fill="none" stroke="#FFD0B5" stroke-width="3.4" stroke-linecap="round"/>
              <path d="M13 24 C19 20, 25 25, 31 24" fill="none" stroke="#FF8B80" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
            </g>
          </svg>
        `;

      case 'egg':
        return `
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 7 C43 7, 50 13, 54 22 C58 31, 56 44, 48 51 C41 57, 29 58, 19 54 C10 50, 7 39, 9 29 C11 19, 17 14, 22 10 C26 8, 29 7, 32 7 Z"
                  fill="url(#bc-eggWhite)" stroke="#C7B293" stroke-width="2.5"/>
            <circle cx="33" cy="33" r="13.5" fill="url(#bc-eggYolk)" stroke="#C96B00" stroke-width="2"/>
            <ellipse cx="28.5" cy="28" rx="4.2" ry="2.5" transform="rotate(-32 28.5 28)" fill="#FFFDF0" opacity="0.9"/>
            <circle cx="35.5" cy="26.5" r="1.5" fill="#FFFDF0" opacity="0.75"/>
          </svg>
        `;

      case 'avocado':
        return `
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 6 C41 6, 46 17, 50 28 C54 40, 48 56, 32 58 C16 56, 10 40, 14 28 C18 17, 23 6, 32 6 Z"
                  fill="#2C6E2F" stroke="#19451B" stroke-width="2.5"/>
            <path d="M32 10.5 C39 10.5, 43 20, 46.5 29.5 C49.5 39, 45 52.5, 32 54 C19 52.5, 14.5 39, 17.5 29.5 C21 20, 25 10.5, 32 10.5 Z"
                  fill="url(#bc-avoFlesh)"/>
            <ellipse cx="32" cy="39" rx="10.5" ry="11.5" fill="url(#bc-avoPit)" stroke="#3D1B09" stroke-width="1.8"/>
            <ellipse cx="28.5" cy="35" rx="3" ry="4.5" transform="rotate(-22 28.5 35)" fill="#E3B389" opacity="0.72"/>
          </svg>
        `;

      case 'chicken':
        return `
          <svg viewBox="0 0 64 64" aria-hidden="true">
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
          </svg>
        `;

      default:
        return '';
    }
  }

  return {
    TYPES,
    META,
    getPieceSvg,
  };
})();
