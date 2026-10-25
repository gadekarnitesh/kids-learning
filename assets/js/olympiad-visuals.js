/* Native vector pictures keep comparison sizes and shape outlines exact. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  let serial = 0;
  const colorNames = {'#ed6688':'pink', '#587cdb':'blue', '#e6a62e':'gold', '#39a98a':'green', '#9764ce':'purple', '#e98241':'orange'};
  const stroke = 'stroke="#334664" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  function describe(v) {
    if (v.kind === 'object') return [v.size ? `${v.size} unit` : '', v.height ? `${v.height} unit tall` : '', v.fill !== undefined ? v.fill === 0 ? 'empty' : v.fill === 1 ? 'full' : 'partly filled' : '', v.state, v.posture === 'sit' ? 'sitting' : v.posture === 'stand' ? 'standing' : '', colorNames[v.color], v.object, v.decoration ? `with ${v.decoration}` : ''].filter(Boolean).join(' ');
    if (v.kind === 'number' || v.kind === 'word') return String(v.value);
    if (v.kind === 'shape') return `${v.shape}${v.context !== 'plain' ? ` ${v.context}` : ''}`;
    if (v.kind === 'quantity') return `${v.count} ${v.item} pictures`;
    if (v.kind === 'sequence') return `${v.layout === 'tower' ? 'Count from bottom to top: ' : 'Count from left to right: '}${v.values.join(', ')}`;
    if (v.kind === 'balance') return `Balance: ${describe(v.left)} on the left, ${describe(v.right)} on the right. The ${v.left.mass > v.right.mass ? 'left' : 'right'} pan is lower and heavier.`;
    if (v.kind === 'opening') return `A ${v.width} by ${v.height} unit opening`;
    return 'A group of pictures';
  }
  function svg(content, label, className = '') {
    return `<svg class="olympiad-svg ${className}" viewBox="0 0 160 160" role="img" aria-label="${escape(label)}" xmlns="http://www.w3.org/2000/svg"><title>${escape(label)}</title>${content}</svg>`;
  }
  function figure(v) {
    const c = escape(v.color || '#ed6688'), name = v.object;
    const outlines = {
      ball: `<circle cx="60" cy="62" r="50" fill="${c}" ${stroke}/><path d="M15 43Q60 68 105 43M35 18Q68 62 35 106M86 20Q57 62 86 104" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`,
      apple: `<path d="M59 30C18 4 4 49 20 88C32 122 52 113 61 107C77 119 98 105 106 78C119 32 92 9 59 30Z" fill="${c}" ${stroke}/><path d="M60 31Q53 10 65 4" fill="none" ${stroke}/><path d="M67 18Q78 0 95 13Q88 29 67 18" fill="#48b383"/><path d="M30 42Q22 53 25 64" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
      tree: `<path d="M52 120V55H69V120" fill="#aa7952" ${stroke}/><path d="M60 2L17 53H37L9 89H111L83 53H103Z" fill="${c}" ${stroke}/><path d="M60 31V87" stroke="#fff" opacity=".35" stroke-width="4"/>`,
      building: `<rect x="20" y="7" width="80" height="113" rx="5" fill="${c}" ${stroke}/>${[24,48,72].map(y=>[34,70].map(x=>`<rect x="${x}" y="${y}" width="16" height="13" rx="2" fill="#fff8c4"/>`).join('')).join('')}<path d="M52 120V99H70V120" fill="#fff8c4" ${stroke}/>`,
      pencil: `<path d="M40 94V24H80V94L60 119Z" fill="${c}" ${stroke}/><path d="M40 94L60 119L80 94" fill="#f3dab1" ${stroke}/><path d="M53 110L60 120L67 110" fill="#334664"/><rect x="40" y="4" width="40" height="20" rx="5" fill="#f29eac" ${stroke}/><path d="M53 32V84M68 32V84" stroke="white" stroke-width="3" opacity=".7"/>`,
      flower: `<path d="M60 120V59" stroke="#329e72" stroke-width="9"/><path d="M59 100Q18 99 27 79Q58 76 59 100M62 111Q102 111 97 86Q66 85 62 111" fill="#65c49a"/>${[0,60,120,180,240,300].map(a=>`<ellipse cx="60" cy="24" rx="16" ry="23" fill="${c}" transform="rotate(${a} 60 45)"/>`).join('')}<circle cx="60" cy="45" r="17" fill="#ffd360" ${stroke}/>`,
      fish: `<path d="M86 55L116 27V96L86 76" fill="${c}" ${stroke}/><ellipse cx="49" cy="64" rx="44" ry="34" fill="${c}" ${stroke}/><path d="M49 31L70 14L77 40M44 94L64 107L71 87" fill="${c}" ${stroke}/><circle cx="27" cy="57" r="6" fill="#334664"/><path d="M20 75Q29 81 37 75" fill="none" ${stroke}/>`,
      car: `<path d="M8 68L22 60L38 31H79L99 61L114 69V94H8Z" fill="${c}" ${stroke}/><path d="M43 39H59V60H31ZM65 39H75L91 60H65Z" fill="#d9f6ff"/><circle cx="31" cy="95" r="15" fill="#334664"/><circle cx="91" cy="95" r="15" fill="#334664"/><circle cx="31" cy="95" r="7" fill="white"/><circle cx="91" cy="95" r="7" fill="white"/>`,
      gift: `<rect x="16" y="37" width="88" height="76" rx="7" fill="${c}" ${stroke}/><rect x="10" y="29" width="100" height="23" rx="5" fill="${c}" ${stroke}/><path d="M51 31V113H70V31" fill="#ffdb73"/><path d="M60 29Q18 28 31 10Q45 -3 60 29Q75 -3 90 10Q104 28 60 29" fill="#ffdb73" ${stroke}/>`,
      kite: `<path d="M60 4L105 50L60 94L15 50Z" fill="${c}" ${stroke}/><path d="M60 4V94M15 50H105" stroke="white" stroke-width="3"/><path d="M60 94Q88 107 61 119" fill="none" ${stroke}/>`,
      butterfly: `<path d="M56 61C-4 -10 -7 91 46 83C12 115 58 132 60 73C62 132 108 115 74 83C127 91 124 -10 64 61" fill="${c}" ${stroke}/><path d="M60 44V101M57 46L46 30M63 46L74 30" fill="none" stroke="#334664" stroke-width="6" stroke-linecap="round"/>`,
      candle: `<rect x="34" y="40" width="52" height="80" rx="5" fill="${c}" ${stroke}/><path d="M60 1Q29 30 60 37Q87 33 60 1" fill="#ffbb47" ${stroke}/><path d="M60 45V34" ${stroke}/>`,
      star: `<path d="M60 6L76 41L115 46L87 74L94 113L60 95L26 113L33 74L5 46L44 41Z" fill="${c}" ${stroke}/>`
    };
    Object.assign(outlines, {
      elephant: `<ellipse cx="59" cy="68" rx="43" ry="33" fill="${c}" ${stroke}/><path d="M26 80V114H42V86M68 87V114H84V79" fill="${c}" ${stroke}/><ellipse cx="85" cy="53" rx="27" ry="31" fill="${c}" ${stroke}/><ellipse cx="69" cy="54" rx="20" ry="26" fill="#d5cbea" ${stroke}/><path d="M103 60Q120 112 95 110" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/><circle cx="95" cy="44" r="4" fill="#334664"/><path d="M17 65L7 86" fill="none" ${stroke}/>`,
      feather: `<path d="M20 104C-1 50 37 6 105 7C108 65 79 102 20 104Z" fill="#e6e5f7" ${stroke}/><path d="M11 115L87 27M28 94L25 65M44 78L44 45M57 62L76 58M70 46L88 42" fill="none" stroke="#9495b3" stroke-width="3"/>`,
      rock: `<path d="M8 95L20 49L52 23L85 29L109 67L100 105L43 113Z" fill="${c}" ${stroke}/><path d="M20 49L52 71L85 29M52 71L43 113M52 71L109 67" fill="none" stroke="#fff" opacity=".35" stroke-width="4"/>`,
      brick: `<path d="M6 43L81 20L116 43V95L42 117L6 94Z" fill="${c}" ${stroke}/><path d="M6 43L42 66L116 43M42 66V117" fill="none" ${stroke}/><path d="M26 45L83 29M46 56L104 39" stroke="#fff" opacity=".45" stroke-width="4"/>`,
      balloon: `<ellipse cx="60" cy="45" rx="38" ry="42" fill="${c}" ${stroke}/><path d="M60 86L53 96H68Z" fill="${c}" ${stroke}/><path d="M60 96Q80 107 61 120" fill="none" ${stroke}/><path d="M37 29Q40 16 53 14" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/>`,
      leaf: `<path d="M17 102Q-1 16 108 8Q114 114 17 102Z" fill="${c}" ${stroke}/><path d="M6 116L88 30M31 89L26 55M47 72L75 75M63 56L60 31" fill="none" stroke="#fff" stroke-width="3"/>`,
      pumpkin: `<ellipse cx="60" cy="70" rx="52" ry="41" fill="${c}" ${stroke}/><ellipse cx="60" cy="70" rx="29" ry="41" fill="none" ${stroke}/><path d="M57 28L62 8L77 13L66 31" fill="#5f9b65" ${stroke}/><path d="M60 32V108" fill="none" ${stroke}/>`,
      cotton: `<path d="M21 95C-6 90 5 52 27 55C24 24 63 17 73 43C102 21 130 65 104 83C116 105 76 116 63 100C44 114 25 109 21 95Z" fill="#f7fbff" ${stroke}/><path d="M29 66Q45 52 49 69M69 81Q77 65 91 75" fill="none" stroke="#c4d5df" stroke-width="3"/>`,
      watermelon: `<path d="M8 36H112Q112 115 60 115Q8 115 8 36" fill="#5db78c" ${stroke}/><path d="M16 40H104Q104 103 60 103Q16 103 16 40" fill="#ed6d80" stroke="#eaf8bf" stroke-width="5"/>${[35,59,84].map(x=>`<ellipse cx="${x}" cy="61" rx="3" ry="5" fill="#334664"/>`).join('')}<ellipse cx="60" cy="85" rx="3" ry="5" fill="#334664"/>`,
      pear: `<path d="M42 32C44 9 76 9 79 32C77 54 110 66 105 91C98 124 18 123 14 91C10 66 43 53 42 32Z" fill="${c}" ${stroke}/><path d="M61 19L67 3M65 13Q86 -1 95 15Q77 25 65 13" fill="#71b98a" ${stroke}/><path d="M31 79L26 92" stroke="white" stroke-width="6" stroke-linecap="round"/>`,
      strawberry: `<path d="M12 46C4 4 115 4 108 46C102 77 80 103 60 117C39 103 17 76 12 46Z" fill="${c}" ${stroke}/><path d="M22 18L48 22L60 1L71 22L98 18L80 38L60 29L42 38Z" fill="#5bb782" ${stroke}/>${[48,68,88].map((y,j)=>`<path d="M${38+j*6} ${y}L${40+j*6} ${y+5}M${78-j*6} ${y}L${76-j*6} ${y+5}" stroke="#fff4ad" stroke-width="4" stroke-linecap="round"/>`).join('')}`,
      duck: `<path d="M20 66Q3 41 7 83Q9 111 59 111Q109 111 108 83Q106 60 82 58" fill="${c}" ${stroke}/><circle cx="76" cy="38" r="29" fill="${c}" ${stroke}/><path d="M99 36L119 45L100 53" fill="#f3ab52" ${stroke}/><circle cx="83" cy="31" r="4" fill="#334664"/><path d="M31 78Q60 62 72 81Q68 97 47 96" fill="none" ${stroke}/>`,
      bee: `<ellipse cx="46" cy="30" rx="24" ry="22" fill="#d6f0ff" ${stroke}/><ellipse cx="81" cy="30" rx="24" ry="22" fill="#d6f0ff" ${stroke}/><ellipse cx="62" cy="70" rx="46" ry="31" fill="#ffd260" ${stroke}/><path d="M45 43V97M65 40V101" stroke="#334664" stroke-width="12"/><circle cx="90" cy="61" r="4" fill="#334664"/><path d="M15 67L2 77L17 82" fill="#334664"/>`,
      cookie: `<circle cx="60" cy="62" r="51" fill="${c}" ${stroke}/>${[[38,38],[78,34],[61,66],[30,78],[83,85]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="#72513d"/>`).join('')}`,
      boat: `<path d="M6 86H115L95 113H28Z" fill="${c}" ${stroke}/><path d="M60 5V87M55 14L12 75H55ZM66 32L103 75H66Z" fill="#fff4ce" ${stroke}/><path d="M3 119H118" stroke="#7bb9de" stroke-width="3"/>`,
      cat: `<path d="M19 48L16 9L48 26H73L103 9L101 48C121 122 0 122 19 48Z" fill="${c}" ${stroke}/><circle cx="41" cy="58" r="5" fill="#334664"/><circle cx="79" cy="58" r="5" fill="#334664"/><path d="M53 75L60 82L67 75ZM59 84Q46 97 38 85M61 84Q74 97 82 85" fill="none" ${stroke}/><path d="M29 73L3 66M29 83L2 87M92 73L118 66M91 83L119 87" ${stroke}/>`,
      rocket: `<path d="M36 65L15 90V112L43 94M84 65L105 90V112L77 94" fill="${c}" ${stroke}/><path d="M60 3Q22 36 34 94H86Q98 36 60 3Z" fill="${c}" ${stroke}/><circle cx="60" cy="49" r="15" fill="#d1f2ff" ${stroke}/><path d="M45 99L60 120L75 99" fill="#ffc850" ${stroke}/>`
    });
    if (name === 'book' && !v.state) return figure({...v, state:'closed'});
    if (v.posture) {
      const sitting = v.posture === 'sit';
      const head = name === 'robot' ? `<rect x="38" y="8" width="44" height="36" rx="8" fill="#b6d0e5" ${stroke}/><path d="M60 8V1M47 27H50M70 27H73" ${stroke}/>` : `<circle cx="60" cy="26" r="21" fill="${name === 'child' ? '#f7c69d' : '#cfa173'}" ${stroke}/>${name !== 'child' ? '<circle cx="43" cy="8" r="9" fill="#cfa173"/><circle cx="77" cy="8" r="9" fill="#cfa173"/>' : '<path d="M40 20Q46 -2 77 15" fill="#66504a"/>'}<circle cx="52" cy="25" r="2.5" fill="#334664"/><circle cx="68" cy="25" r="2.5" fill="#334664"/><path d="M55 35Q60 39 65 35" fill="none" ${stroke}/>`;
      return `${sitting ? `<path d="M28 57V85H80M34 85V120M76 85V120" fill="none" stroke="#9b795b" stroke-width="8"/>` : ''}${head}<path d="M44 49H76L79 80H41Z" fill="${c}" ${stroke}/><path d="M43 54L30 77M76 54L89 76" fill="none" stroke="#f7c69d" stroke-width="9" stroke-linecap="round"/><path d="${sitting ? 'M50 83H88V113H102M66 83H76V110H89' : 'M49 82V115H39M71 82V115H82'}" fill="none" stroke="#334664" stroke-width="9" stroke-linecap="round"/>`;
    }
    if (v.fill !== undefined || ['jar', 'glass', 'cup', 'bottle'].includes(name)) {
      const id = `olympiad-fill-${serial++}`;
      const path = name === 'bottle' ? 'M47 12H73V32L92 48V115H28V48L47 32Z' : name === 'glass' ? 'M18 22H102L90 116H30Z' : 'M25 27H95V116H25Z';
      const fillHeight = name === 'bottle' ? 99 : name === 'glass' ? 88 : 83;
      return `<defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs>${name === 'cup' ? `<path d="M96 45Q133 44 107 84H95" fill="none" stroke="#334664" stroke-width="7"/>` : ''}<path d="${path}" fill="#f1fbff" ${stroke}/><g clip-path="url(#${id})"><rect x="16" y="${116 - (v.fill || 0) * fillHeight}" width="90" height="${(v.fill || 0) * fillHeight}" fill="${c}" opacity=".88"/>${v.fill ? `<path d="M20 ${116 - v.fill * fillHeight}H101" stroke="#fff" stroke-width="4" opacity=".65"/>` : ''}</g><path d="${path}" fill="none" ${stroke}/><path d="M35 45V96" stroke="white" stroke-width="5" opacity=".8"/>${name === 'jar' ? `<rect x="22" y="17" width="76" height="12" rx="4" fill="#bad8e1" ${stroke}/>` : ''}`;
    }
    if (v.state) {
      const open = v.state === 'open';
      if (name === 'book') return open ? `<path d="M59 28Q32 12 5 27V103Q33 88 59 108Q86 88 115 103V27Q88 12 59 28" fill="#fff6cf" ${stroke}/><path d="M59 28V108M14 43L46 42M14 59L46 58M74 42L104 43M74 58L104 59" fill="none" ${stroke}/>` : `<rect x="22" y="17" width="76" height="94" rx="8" fill="${c}" ${stroke}/><path d="M33 19V109M49 42H81M49 57H78" stroke="white" stroke-width="4"/>`;
      if (name === 'box') return `<rect x="16" y="52" width="88" height="60" fill="${c}" ${stroke}/>${open ? `<path d="M16 52L1 28L48 32L60 52L75 29L119 34L104 52" fill="#f8d999" ${stroke}/><path d="M16 52L59 38L104 52" fill="#5c5262" ${stroke}/>` : `<rect x="11" y="36" width="98" height="20" rx="4" fill="${c}" ${stroke}/><path d="M60 37V113" stroke="#ffdb73" stroke-width="13"/>`}`;
      if (name === 'window') return `<rect x="15" y="15" width="90" height="90" fill="#bceaff" ${stroke}/><path d="M60 17V105M17 60H104" ${stroke}/>${open ? `<path d="M15 15L39 29V93L15 105ZM105 15L81 29V93L105 105Z" fill="${c}" ${stroke}/>` : `<path d="M17 18H103V103H17Z" fill="${c}" opacity=".8"/><path d="M60 17V105M17 60H104" stroke="white" stroke-width="5"/>`}`;
      return `<rect x="20" y="5" width="80" height="115" fill="${open ? '#4c617c' : c}" ${stroke}/>${open ? `<path d="M23 7L76 25V104L23 120Z" fill="${c}" ${stroke}/><circle cx="66" cy="67" r="4" fill="#ffdc73"/><path d="M82 35H92V110H82" fill="#fff4c8"/>` : `<path d="M31 19H89V55H31ZM31 69H89V107H31Z" fill="none" stroke="#fff" opacity=".6" stroke-width="3"/><circle cx="85" cy="62" r="4" fill="#ffdc73"/>`}`;
    }
    if (name === 'bear') return `<circle cx="30" cy="26" r="18" fill="${c}" ${stroke}/><circle cx="90" cy="26" r="18" fill="${c}" ${stroke}/><ellipse cx="60" cy="78" rx="39" ry="39" fill="${c}" ${stroke}/><circle cx="60" cy="44" r="34" fill="${c}" ${stroke}/><ellipse cx="60" cy="56" rx="19" ry="13" fill="#ffe7c5"/><circle cx="48" cy="37" r="4" fill="#334664"/><circle cx="72" cy="37" r="4" fill="#334664"/><circle cx="60" cy="51" r="5" fill="#334664"/>`;
    return outlines[name] || outlines.star;
  }
  function object(v) {
    const w = v.size || (v.height ? 82 : 112), h = v.height || v.size || 112;
    const decoration = v.decoration === 'dots' ? '<circle cx="53" cy="49" r="6" fill="white"/><circle cx="72" cy="61" r="6" fill="white"/><circle cx="52" cy="76" r="6" fill="white"/>' : v.decoration === 'stripe' ? '<path d="M40 66H79" stroke="white" stroke-width="10" stroke-linecap="round"/>' : '';
    return svg(`<path d="M13 149H147" stroke="#c6ddd7" stroke-width="3" stroke-linecap="round"/><g transform="translate(${(160 - w) / 2} ${148 - h}) scale(${w / 120} ${h / 120})">${figure(v)}${decoration}</g>`, describe(v));
  }
  function outline(name, fill, extra = '') {
    const attrs = `fill="${fill}" ${stroke} ${extra}`;
    const forms = {
      circle: `<circle cx="80" cy="69" r="47" ${attrs}/>`,
      oval: `<ellipse cx="80" cy="69" rx="57" ry="35" ${attrs}/>`,
      square: `<rect x="37" y="26" width="86" height="86" ${attrs}/>`,
      rectangle: `<rect x="23" y="38" width="114" height="62" ${attrs}/>`,
      triangle: `<path d="M80 16L138 116H22Z" ${attrs}/>`,
      heart: `<path d="M80 119C65 104 19 77 24 47C29 13 65 13 80 39C95 13 131 13 136 47C141 77 95 104 80 119Z" ${attrs}/>`,
      star: `<path d="M80 12L96 47L135 52L107 79L114 119L80 100L46 119L53 79L25 52L64 47Z" ${attrs}/>`
    };
    return forms[name] || forms.circle;
  }
  function shape(v) {
    const context = v.context || 'plain', color = escape(v.color || '#ed6688');
    let content = outline(v.shape, context === 'cookie' ? '#e7b973' : color);
    if (context === 'frame') content += `<g transform="translate(80 69) scale(.73) translate(-80 -69)">${outline(v.shape, '#fff8e5')}</g>`;
    if (context === 'cookie') content += '<circle cx="70" cy="65" r="4" fill="#8c6443"/><circle cx="87" cy="75" r="4" fill="#8c6443"/><circle cx="85" cy="56" r="3" fill="#8c6443"/>';
    if (context === 'button') content += '<circle cx="73" cy="64" r="4" fill="#fff"/><circle cx="87" cy="64" r="4" fill="#fff"/><circle cx="73" cy="78" r="4" fill="#fff"/><circle cx="87" cy="78" r="4" fill="#fff"/>';
    if (context === 'balloon') content += '<path d="M80 120Q69 130 84 138Q94 145 80 157" fill="none" stroke="#536784" stroke-width="2"/>';
    if (context === 'tile') content += '<path d="M68 56L84 48" stroke="white" stroke-width="5" opacity=".6" stroke-linecap="round"/>';
    return svg(content, describe(v), 'shape-svg');
  }
  function quantity(v, {countable = false} = {}) {
    const label = escape(describe(v));
    return `<div class="quantity-board layout-${escape(v.layout)}" style="--pieces:${v.count}" ${countable ? `role="group" aria-label="${label}. Tap pictures to mark them."` : `role="img" aria-label="${label}"`}>${Array.from({length:v.count}, (_, i) => `<span class="count-piece" ${countable ? `role="button" tabindex="0" aria-label="Picture ${i + 1}, not counted" aria-pressed="false" data-count-index="${i}"` : 'aria-hidden="true"'} style="--piece-index:${i};--tilt:${[0,-12,9,-5,13][i % 5]}deg">${object(objForCount(v))}<span class="count-marker" aria-hidden="true"></span></span>`).join('')}</div>`;
  }
  function objForCount(v) { return {kind:'object', object:v.item, color:v.color}; }
  function sequence(v) {
    return `<div class="sequence-board sequence-${escape(v.layout)}" role="img" aria-label="${escape(describe(v))}"><span class="sequence-direction">${v.layout === 'tower' ? 'Count up ↑' : 'Follow →'}</span><div class="sequence-tiles">${v.values.map((n, i) => `<span class="sequence-tile ${n === '?' ? 'missing-tile' : ''}" style="--tile-color:${['#e1ecff','#fde5b0','#dcf4df','#f5dce9'][i % 4]}">${escape(n)}</span>`).join('')}</div>${v.layout === 'train' ? '<span class="train-track" aria-hidden="true">● ━━━ ● ━━━ ●</span>' : ''}</div>`;
  }
  function balance(v) {
    const heavyLeft = v.left.mass > v.right.mass, leftY = heavyLeft ? 62 : 25, rightY = heavyLeft ? 25 : 62;
    const pan = (x, y, o) => `<path d="M${x - 29} ${y + 64}Q${x} ${y + 91} ${x + 29} ${y + 64}" fill="#f5d583" ${stroke}/><path d="M${x} ${y - 4}L${x - 29} ${y + 64}M${x} ${y - 4}L${x + 29} ${y + 64}" stroke="#8192a6" stroke-width="2" fill="none"/><g transform="translate(${x - 22} ${y + 14}) scale(.37)">${figure(o)}</g>`;
    return svg(`<path d="M80 44V143M48 146H112" stroke="#677e9e" stroke-width="9" stroke-linecap="round"/><path d="M30 ${leftY}L130 ${rightY}" stroke="#536784" stroke-width="6" stroke-linecap="round"/>${pan(30,leftY,v.left)}${pan(130,rightY,v.right)}<circle cx="80" cy="44" r="7" fill="#7657dd"/>`, describe(v), 'balance-svg');
  }
  function render(v, settings = {}) {
    if (!v) return '';
    if (v.kind === 'object') return object(v);
    if (v.kind === 'shape') return shape(v);
    if (v.kind === 'number') return `<span class="number-picture number-${escape(v.style)}" role="img" aria-label="${escape(v.value)}">${escape(v.value)}</span>`;
    if (v.kind === 'word') return `<span class="word-picture">${escape(v.value)}</span>`;
    if (v.kind === 'quantity') return quantity(v, settings);
    if (v.kind === 'sequence') return sequence(v);
    if (v.kind === 'collection') return `<div class="picture-collection" role="group" aria-label="Group to look at">${v.items.map(item => `<span class="collection-item">${render(item)}</span>`).join('')}</div>`;
    if (v.kind === 'balance') return balance(v);
    if (v.kind === 'opening') return svg(`<rect x="20" y="20" width="120" height="120" rx="10" fill="#f2dbb1" ${stroke}/><rect x="${80-v.width/2}" y="${80-v.height/2}" width="${v.width}" height="${v.height}" fill="#fffaf0" ${stroke}/><path d="M53 151H107" stroke="#8c9db3" stroke-width="2"/>`, describe(v));
    return '';
  }
  window.OlympiadVisuals = {render, describe, escape};
})();
