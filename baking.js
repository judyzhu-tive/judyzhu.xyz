/* judy's bakery — chatbot flow v0.3
   vanilla js. audio + expanded breads + surprises + dietary restrictions. */

(() => {
  const $dialog = document.getElementById('dialog-text');
  const $cursor = document.getElementById('dialog-cursor');
  const $choices = document.getElementById('choices');
  const $progress = document.querySelectorAll('.progress .dot');
  const $speakerName = document.getElementById('speaker-name');
  const $speakerTag = document.getElementById('speaker-tag');
  const $speakerPortrait = document.getElementById('speaker-portrait');
  const $musicBtn = document.getElementById('music-btn');

  // ─── speakers ─────────────────────────────────────────────────────
  const SPEAKERS = {
    anpan: { jp: 'あんパン',   en: 'anpan',     portrait: '🍞', tag: '★ baker' },
    cat:   { jp: 'ねこシェフ', en: 'chef cat',  portrait: '🐱', tag: '♕ chef'  },
  };

  function setSpeaker(key) {
    const s = SPEAKERS[key];
    if (!s) return;
    $speakerPortrait.style.animation = 'none';
    void $speakerPortrait.offsetWidth;
    $speakerPortrait.style.animation = '';
    $speakerPortrait.textContent = s.portrait;
    $speakerName.innerHTML = `${s.jp} <em>· ${s.en}</em>`;
    $speakerTag.textContent = s.tag;
  }

  // ─── state ─────────────────────────────────────────────────────────
  const state = {
    step: 0,
    texture: 50,
    flavors: new Set(),
    size: null,
    restrictions: new Set(),
  };

  // ─── typing effect ────────────────────────────────────────────────
  let typingTimer = null;
  function typeText(text, onDone) {
    if (typingTimer) clearTimeout(typingTimer);
    $dialog.textContent = '';
    $cursor.classList.remove('visible');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      $dialog.textContent = text;
      $cursor.classList.add('visible');
      onDone && onDone();
      return;
    }
    let i = 0;
    const tick = () => {
      $dialog.textContent = text.slice(0, ++i);
      if (i < text.length) {
        const ch = text[i - 1];
        const delay = /[、。,.!?～]/.test(ch) ? 110 : 22;
        typingTimer = setTimeout(tick, delay);
      } else {
        $cursor.classList.add('visible');
        onDone && onDone();
      }
    };
    tick();
  }

  function setProgress(step) {
    $progress.forEach((d, i) => {
      d.classList.toggle('active', i === step);
      d.classList.toggle('done', i < step);
    });
  }
  function clearChoices() { $choices.innerHTML = ''; }

  function makeBtn({ emoji, label, hint, onClick, selected }) {
    const b = document.createElement('button');
    b.className = 'choice-btn' + (selected ? ' selected' : '');
    b.type = 'button';
    b.innerHTML = `
      ${emoji ? `<span class="emoji">${emoji}</span>` : ''}
      <span class="label">${label}${hint ? `<br><span class="hint">${hint}</span>` : ''}</span>
    `;
    b.addEventListener('click', () => { Audio.blip(); onClick(); });
    return b;
  }

  function makeSurpriseBtn(label, onClick) {
    const b = document.createElement('button');
    b.className = 'btn-surprise';
    b.type = 'button';
    b.innerHTML = `<span class="die">🎲</span><span>${label}</span>`;
    b.addEventListener('click', () => { Audio.blip(1400, 0.07); onClick(); });
    return b;
  }

  function shuffled(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── step 0: intro ────────────────────────────────────────────────
  function stepIntro() {
    state.step = 0;
    setProgress(0);
    setSpeaker('anpan');
    clearChoices();
    typeText(
      "やあ！ welcome to the tiny bakery.\n" +
      "tell me about the bread you're dreaming of today, and i'll bake you a recipe ♡"
    );
    setTimeout(() => {
      $choices.appendChild(makeBtn({
        emoji: '🥐',
        label: "let's bake!",
        hint: 'tap to begin',
        onClick: () => stepTexture(),
      }));
    }, 600);
  }

  // ─── step 1: texture ──────────────────────────────────────────────
  function stepTexture() {
    state.step = 1;
    setProgress(1);
    setSpeaker('anpan');
    clearChoices();
    typeText(
      "first — what texture are you in the mood for?\n" +
      "ふわふわ soft like soufflé, or stodgy like a baguette?"
    );

    const wrap = document.createElement('div');
    wrap.className = 'slider-wrap';
    wrap.innerHTML = `
      <div class="slider-labels">
        <span>fuwafuwa<span class="jp">ふわふわ</span></span>
        <span style="text-align:right">stodgy<span class="jp">ずっしり</span></span>
      </div>
      <div class="slider-track">
        <input id="tex" type="range" min="0" max="100" value="${state.texture}" class="texture-slider" />
      </div>
      <div class="slider-readout">
        <span class="big" id="tex-big">${textureLabel(state.texture).en}</span>
        <span>${textureLabel(state.texture).note}</span>
      </div>
    `;
    $choices.appendChild(wrap);

    const slider = wrap.querySelector('#tex');
    const big = wrap.querySelector('#tex-big');
    const note = wrap.querySelector('.slider-readout span:not(.big)');
    let lastBucket = textureLabel(state.texture).en;
    slider.addEventListener('input', () => {
      state.texture = +slider.value;
      const t = textureLabel(state.texture);
      big.textContent = t.en;
      note.textContent = t.note;
      if (t.en !== lastBucket) { Audio.blip(880, 0.06); lastBucket = t.en; }
    });

    $choices.appendChild(makeSurpriseBtn('surprise me with a texture', () => {
      state.texture = Math.floor(Math.random() * 101);
      slider.value = state.texture;
      const t = textureLabel(state.texture);
      big.textContent = t.en;
      note.textContent = t.note;
      lastBucket = t.en;
      setTimeout(() => stepFlavor(), 480);
    }));

    const row = document.createElement('div');
    row.className = 'confirm-row';
    const next = document.createElement('button');
    next.className = 'btn-primary';
    next.textContent = 'next ▸';
    next.addEventListener('click', () => { Audio.blip(); stepFlavor(); });
    row.appendChild(next);
    $choices.appendChild(row);
  }

  function textureLabel(v) {
    if (v <= 15) return { en: 'cloud-soft ☁',     note: 'hokkaido toast · yudane · soufflé air' };
    if (v <= 30) return { en: 'fuwafuwa',          note: 'milk bread · choux · enriched & airy' };
    if (v <= 45) return { en: 'pillowy ♡',         note: 'brioche · cream pan · melon pan' };
    if (v <= 60) return { en: 'flaky-laminated',   note: 'croissant · pâte feuilletée' };
    if (v <= 72) return { en: 'tender crumb',      note: 'pain de mie · focaccia · pita' };
    if (v <= 85) return { en: 'rustic',            note: 'country loaf · sourdough · ciabatta' };
    return         { en: 'stodgy 🥖',               note: 'baguette · koulouri · firm bite' };
  }

  // ─── step 2: flavors ──────────────────────────────────────────────
  const FLAVORS = [
    { id: 'savory', emoji: '🧀', label: 'savory',  hint: 'ham, sausage, cheese, miso' },
    { id: 'bitter', emoji: '🍫', label: 'bitter',  hint: 'matcha, cocoa, hojicha, walnut' },
    { id: 'sweet',  emoji: '🍑', label: 'sweet',   hint: 'fruits, anko, custard, honey' },
    { id: 'sour',   emoji: '🍋', label: 'sour',    hint: 'yuzu, citrus, tomato, raspberry' },
  ];

  function stepFlavor() {
    state.step = 2;
    setProgress(2);
    setSpeaker('anpan');
    clearChoices();
    typeText(
      "next — what flavors are calling you?\n" +
      "pick one, or mix a few. (i love a sweet × bitter combo, personally)"
    );

    FLAVORS.forEach(f => {
      const selected = state.flavors.has(f.id);
      const btn = makeBtn({
        emoji: f.emoji,
        label: f.label,
        hint: f.hint,
        selected,
        onClick: () => {
          if (state.flavors.has(f.id)) state.flavors.delete(f.id);
          else state.flavors.add(f.id);
          btn.classList.toggle('selected');
          updateFlavorNext();
        },
      });
      $choices.appendChild(btn);
    });

    $choices.appendChild(makeSurpriseBtn('surprise me with a flavor combo', () => {
      state.flavors = new Set();
      const n = 1 + Math.floor(Math.random() * 3);
      shuffled(FLAVORS.map(f => f.id)).slice(0, n).forEach(id => state.flavors.add(id));
      setTimeout(() => stepSize(), 400);
    }));

    const row = document.createElement('div');
    row.className = 'confirm-row';
    row.innerHTML = `
      <button class="btn-ghost" id="flav-back">‹ back</button>
      <button class="btn-primary" id="flav-next" disabled style="opacity:0.5">pick at least one</button>
    `;
    $choices.appendChild(row);

    row.querySelector('#flav-back').addEventListener('click', () => { Audio.blip(); stepTexture(); });
    row.querySelector('#flav-next').addEventListener('click', () => {
      if (state.flavors.size === 0) return;
      Audio.blip();
      stepSize();
    });
    updateFlavorNext();
  }

  function updateFlavorNext() {
    const btn = document.getElementById('flav-next');
    if (!btn) return;
    if (state.flavors.size === 0) {
      btn.disabled = true; btn.style.opacity = 0.5;
      btn.textContent = 'pick at least one';
    } else {
      btn.disabled = false; btn.style.opacity = 1;
      btn.textContent = `next ▸ (${state.flavors.size} chosen)`;
    }
  }

  // ─── step 3: size ─────────────────────────────────────────────────
  const SIZES = [
    { id: 'bite',    emoji: '🐾', label: 'bite size',    hint: '1–2 bites · party tray' },
    { id: 'handful', emoji: '🤲', label: 'handful',      hint: 'one serving · pocket bread' },
    { id: 'arm',     emoji: '🥖', label: 'arm length',   hint: 'shareable loaf or baguette' },
  ];

  function stepSize() {
    state.step = 3;
    setProgress(3);
    setSpeaker('anpan');
    clearChoices();
    typeText("how big should it be?\nlittle pop-in-mouth, or a loaf to tear and share?");

    SIZES.forEach(s => {
      const btn = makeBtn({
        emoji: s.emoji,
        label: s.label,
        hint: s.hint,
        selected: state.size === s.id,
        onClick: () => {
          state.size = s.id;
          setTimeout(() => stepRestrictions(), 280);
        },
      });
      $choices.appendChild(btn);
    });

    $choices.appendChild(makeSurpriseBtn('surprise me with a size', () => {
      state.size = pick(['bite', 'handful', 'arm']);
      setTimeout(() => stepRestrictions(), 350);
    }));

    const row = document.createElement('div');
    row.className = 'confirm-row';
    row.innerHTML = `<button class="btn-ghost" id="size-back">‹ back</button>`;
    $choices.appendChild(row);
    row.querySelector('#size-back').addEventListener('click', () => { Audio.blip(); stepFlavor(); });
  }

  // ─── step 4: restrictions ─────────────────────────────────────────
  const RESTRICTIONS = [
    { id: 'gluten',   emoji: '🌾', label: 'gluten-free',   hint: 'wheat, rye, barley out' },
    { id: 'dairy',    emoji: '🥛', label: 'dairy-free',    hint: 'milk, butter, cream out' },
    { id: 'egg',      emoji: '🥚', label: 'egg-free',      hint: 'no eggs in dough or wash' },
    { id: 'meat',     emoji: '🥩', label: 'meat-free',     hint: 'vegetarian friendly' },
    { id: 'caffeine', emoji: '☕', label: 'caffeine-free', hint: 'no matcha, cocoa, coffee' },
    { id: 'nut',      emoji: '🥜', label: 'nut-free',      hint: 'no walnut, almond' },
  ];

  function stepRestrictions() {
    state.step = 4;
    setProgress(4);
    setSpeaker('anpan');
    clearChoices();
    typeText(
      "one more thing — any allergies or things to skip?\n" +
      "tap any that apply, or just hit bake ♡"
    );

    RESTRICTIONS.forEach(r => {
      const selected = state.restrictions.has(r.id);
      const btn = makeBtn({
        emoji: r.emoji,
        label: r.label,
        hint: r.hint,
        selected,
        onClick: () => {
          if (state.restrictions.has(r.id)) state.restrictions.delete(r.id);
          else state.restrictions.add(r.id);
          btn.classList.toggle('selected');
          updateRestrictionsNext();
        },
      });
      $choices.appendChild(btn);
    });

    $choices.appendChild(makeSurpriseBtn('surprise me — random restrictions', () => {
      state.restrictions = new Set();
      // 55% chance no restrictions; otherwise 1–2 random
      if (Math.random() > 0.55) {
        const n = 1 + Math.floor(Math.random() * 2);
        shuffled(RESTRICTIONS.map(r => r.id)).slice(0, n).forEach(id => state.restrictions.add(id));
      }
      setTimeout(() => stepRecipe(), 400);
    }));

    const row = document.createElement('div');
    row.className = 'confirm-row';
    row.innerHTML = `
      <button class="btn-ghost" id="res-back">‹ back</button>
      <button class="btn-primary" id="res-next">bake ♡</button>
    `;
    $choices.appendChild(row);
    row.querySelector('#res-back').addEventListener('click', () => { Audio.blip(); stepSize(); });
    row.querySelector('#res-next').addEventListener('click', () => { Audio.blip(); stepRecipe(); });
    updateRestrictionsNext();
  }

  function updateRestrictionsNext() {
    const btn = document.getElementById('res-next');
    if (!btn) return;
    btn.textContent = state.restrictions.size === 0
      ? 'bake! ♡ (no restrictions)'
      : `bake with care! ♡ (${state.restrictions.size})`;
  }

  // ─── step 5: recipe ───────────────────────────────────────────────
  function stepRecipe() {
    state.step = 5;
    setProgress(5);
    setSpeaker('cat');
    clearChoices();
    const r = generateRecipe(state);
    typeText(r.opening);
    Audio.fanfare();

    const card = document.createElement('article');
    card.className = 'recipe' + (r.surprise ? ' surprise' : '');
    card.innerHTML = `
      <div class="recipe-stamp">${r.surprise ? '✦ surprise bake' : '★ today\'s bake'}</div>
      <h2 class="recipe-name">
        ${r.name}
        <span class="jp">${r.jpName}</span>
      </h2>
      <p class="recipe-desc">${r.desc}</p>
      <p class="recipe-inspired">${r.inspired}</p>

      <div class="recipe-section">
        <h3>ingredients</h3>
        <ul>${r.ingredients.map(x => `<li>${x}</li>`).join('')}</ul>
      </div>

      <div class="recipe-section">
        <h3>method</h3>
        <ol>${r.method.map(x => `<li>${x}</li>`).join('')}</ol>
      </div>

      ${r.subs.length ? `
      <div class="recipe-section subs">
        <h3>swaps for your diet</h3>
        <ul>${r.subs.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>` : ''}

      <div class="recipe-meta">
        ${r.surprise ? `<span class="tag surprise-tag">${r.surprise}</span>` : ''}
        <span class="tag">${r.textureTag}</span>
        ${[...state.flavors].map(f => `<span class="tag flavor-${f}">${f}</span>`).join('')}
        <span class="tag">${r.sizeTag}</span>
        ${[...state.restrictions].map(rr => `<span class="tag restriction-tag">${labelFor(rr)}</span>`).join('')}
        <span class="tag">bakes ${r.yield}</span>
      </div>
    `;
    $choices.appendChild(card);

    const row = document.createElement('div');
    row.className = 'confirm-row';
    row.innerHTML = `
      <button class="btn-ghost" id="r-tweak">‹ tweak</button>
      <button class="btn-primary" id="r-again">bake another ♡</button>
    `;
    $choices.appendChild(row);
    row.querySelector('#r-tweak').addEventListener('click', () => { Audio.blip(); stepRestrictions(); });
    row.querySelector('#r-again').addEventListener('click', () => {
      Audio.blip();
      state.flavors = new Set();
      state.size = null;
      state.texture = 50;
      state.restrictions = new Set();
      stepIntro();
    });
  }

  function labelFor(id) {
    const r = RESTRICTIONS.find(x => x.id === id);
    return r ? r.label : id;
  }

  // ─── bread bases (texture buckets) ─────────────────────────────────
  // contains tags: gluten · dairy · egg · meat · caffeine · nut
  const BASES = {
    cloud: [
      { name: 'hokkaido milk toast', jp: '北海道食パン',
        contains: ['gluten', 'dairy'],
        dough: 'yudane shokupan — flour scalded with boiling water rests overnight, then folded into an enriched milk dough. silky strands, paper-tearing crumb.',
        ingredients: 'bread flour 300g (60g for yudane + 240g) · boiling water 60g · milk 130g · cream 30g · sugar 30g · yeast 5g · butter 30g · salt 4g',
        method: 'whisk yudane (60g flour + 60g boiling water), chill overnight. next day combine all ingredients, knead 14 min until thin window. bulk 60 min, divide into 3, bench 15 min, shape & coil into a pullman tin. proof to 80% of tin, lid on, bake 200°C 30 min.' },
      { name: 'choux pastry', jp: 'シュー',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'pâte à choux — cooked panade of milk, butter, flour, then beaten with eggs until glossy. pipe and bake to a hollow shell that begs for cream.',
        ingredients: 'milk 80g · water 80g · butter 70g · sugar 5g · salt 2g · flour 95g · eggs ~3 (160g)',
        method: 'boil milk + water + butter + sugar + salt. off heat, add flour, return to medium heat 2 min to dry. cool 5 min. beat in eggs one at a time until ribbon-glossy. pipe rounds on lined tray. bake 200°C 25 min, drop to 170°C 15 min — do not open the door. fill cooled.' },
    ],
    fuwafuwa: [
      { name: 'milk bread bun', jp: 'ミルクパン',
        contains: ['gluten', 'dairy'],
        dough: 'tangzhong milk bread — small portion of flour cooked into a paste, locks in moisture for cloud-soft crumb.',
        ingredients: 'bread flour 280g · milk 130g · cream 30g · sugar 28g · yeast 4g · butter 28g · salt 4g',
        method: 'whisk tangzhong (20g flour + 90g milk into paste). combine all, knead 12 min to window-pane. proof 60 min, shape, final proof 50 min, bake 175°C 22 min.' },
    ],
    pillowy: [
      { name: 'brioche bun', jp: 'ブリオッシュ',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'enriched brioche — slow cold proof for nutty depth, butter folded in late.',
        ingredients: 'bread flour 250g · egg 2 · milk 80g · sugar 30g · yeast 5g · butter 80g · salt 5g',
        method: 'mix flour, egg, milk, sugar, yeast. knead 10 min, gradually add butter. cold proof overnight. shape, proof 90 min, egg wash, bake 180°C 16 min.' },
      { name: 'melon pan', jp: 'メロンパン',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'soft milk bun crowned with crackled cookie dough — japanese kissaten classic.',
        ingredients: 'bun: bread flour 240g · milk 130g · sugar 25g · yeast 4g · butter 25g · salt 3g. crust: flour 80g · butter 40g · sugar 50g · egg 1 · vanilla',
        method: 'mix & proof bun dough 60 min. divide 6. roll crust dough thin, drape over each bun, score crosshatch, sugar dust. proof 50 min, bake 170°C 14 min.' },
    ],
    laminated: [
      { name: 'croissant', jp: 'クロワッサン',
        contains: ['gluten', 'dairy'],
        dough: 'laminated dough — détrempe wrapped around a butter block, three single folds for ~27 layers.',
        ingredients: 'bread flour 250g · water 110g · milk 50g · sugar 25g · yeast 6g · salt 5g · butter (in dough) 20g · butter block 140g',
        method: 'mix détrempe, chill 1 hr. shape butter block. enclose & roll long. fold single × 3, chill 30 min between folds. final roll 3mm, cut triangles, roll up. proof 22°C 2 hr, egg wash. bake 220°C 8 min then 190°C 10 min.' },
      { name: 'pâte feuilletée tartine', jp: 'パイ生地タルティーヌ',
        contains: ['gluten', 'dairy'],
        dough: 'puff pastry base — classic 6 single turns. lean, snap-shatter layers.',
        ingredients: 'flour 250g · water 125g · salt 5g · butter (block) 200g',
        method: 'mix flour, water, salt. rest 30 min. enclose butter, single fold × 6 with 30-min rests. roll 3mm, cut rectangles, dock. bake on parchment + weighted tray 200°C 18 min, then uncovered 6 min until golden.' },
    ],
    tender: [
      { name: 'pain de mie', jp: 'パン・ド・ミ',
        contains: ['gluten', 'dairy'],
        dough: 'open-crumb white pan loaf with a poolish for sweetness.',
        ingredients: 'bread flour 320g · water 200g · poolish 80g · yeast 3g · butter 16g · salt 6g',
        method: 'mix poolish night before. knead all 8 min, bulk 90 min with one fold. shape, proof 60 min, score, bake 220°C with steam then 200°C, total 28 min.' },
      { name: 'focaccia', jp: 'フォカッチャ',
        contains: ['gluten'],
        dough: 'high-hydration olive oil bread with dimples that pool oil and salt.',
        ingredients: 'bread flour 400g · water 320g · yeast 3g · olive oil 30g + more · salt 8g · flaky salt to finish',
        method: 'mix, fold every 30 min × 4. cold proof 12–24 hr. press into oiled tray, dimple, drizzle oil, salt. proof 60 min. bake 240°C 18 min.' },
    ],
    rustic: [
      { name: 'pain de campagne', jp: 'カンパーニュ',
        contains: ['gluten'],
        dough: 'country loaf — wild yeast, mostly white with a kiss of rye, deep crust.',
        ingredients: 'bread flour 360g · whole wheat 30g · rye 10g · water 300g · levain 80g · salt 8g',
        method: 'autolyse 40 min, add levain & salt. four folds over 3 hr. pre-shape, bench rest, shape into banneton. cold proof overnight. bake in dutch oven 250°C 20 min lid on, 230°C 22 min lid off.' },
    ],
    stodgy: [
      { name: 'baguette', jp: 'バゲット',
        contains: ['gluten'],
        dough: 'lean baguette — flour, water, salt, yeast. long cold ferment, crackly crust.',
        ingredients: 'T65 flour 400g · water 280g · yeast 1g · salt 8g',
        method: 'mix, autolyse 30 min, add salt. fold every 30 min × 3. bulk 18 hr fridge. divide, pre-shape, rest 30 min. shape, proof on couche 50 min. score, bake 250°C with heavy steam, 20 min.' },
    ],
  };

  function bucketFor(v) {
    if (v <= 15) return 'cloud';
    if (v <= 30) return 'fuwafuwa';
    if (v <= 45) return 'pillowy';
    if (v <= 60) return 'laminated';
    if (v <= 72) return 'tender';
    if (v <= 85) return 'rustic';
    return 'stodgy';
  }

  // ─── flavor add-ins (tagged) ──────────────────────────────────────
  const FLAVOR_ADDINS = {
    savory: [
      { t: 'cured ham 60g', c: ['meat'] },
      { t: 'milk sausage 2 · grain mustard 1 tbsp', c: ['meat', 'dairy'] },
      { t: 'comté or gouda 50g shredded', c: ['dairy'] },
      { t: 'white miso 1 tsp + butter', c: ['dairy'] },
      { t: 'crisp bacon 40g + black sesame', c: ['meat'] },
      { t: 'corn kernels 40g + black pepper', c: [] },
      { t: 'roasted miso eggplant 50g', c: [] },
      { t: 'caramelized onion 40g + thyme', c: [] },
      { t: 'sun-dried tomato 30g + olive oil + oregano', c: [] },
      { t: 'olive tapenade 30g', c: [] },
    ],
    bitter: [
      { t: 'matcha powder 6g (mixed into dough)', c: ['caffeine'] },
      { t: 'cocoa powder 12g + 60% chocolate chunks 50g', c: ['caffeine', 'dairy'] },
      { t: 'hojicha tea ground 4g', c: ['caffeine'] },
      { t: 'toasted walnut 40g + maple drizzle', c: ['nut'] },
      { t: 'espresso powder 4g + chocolate 30g', c: ['caffeine', 'dairy'] },
      { t: 'roasted black sesame 30g', c: [] },
      { t: 'kinako (roasted soybean flour) 20g + brown sugar', c: [] },
      { t: 'molasses 1 tbsp + cinnamon', c: [] },
      { t: 'roasted barley tea (mugicha) ground 4g', c: [] },
    ],
    sweet: [
      { t: 'anko (sweet red bean paste) 80g', c: [] },
      { t: 'banana, sliced · brown sugar dust', c: [] },
      { t: 'apple compote (apple 1 + sugar 20g + lemon)', c: [] },
      { t: 'blueberries 60g + honey 1 tbsp', c: [] },
      { t: 'custard cream 80g', c: ['dairy', 'egg'] },
      { t: 'kabocha purée 60g + cinnamon', c: [] },
      { t: 'fig jam 40g + sea salt', c: [] },
      { t: 'roasted strawberry 50g + black pepper', c: [] },
    ],
    sour: [
      { t: 'yuzu marmalade 30g', c: [] },
      { t: 'sun-dried tomato 30g + olive oil', c: [] },
      { t: 'lemon zest from 1 lemon + sugar 1 tbsp', c: [] },
      { t: 'cream cheese 40g + raspberry 30g', c: ['dairy'] },
      { t: 'pickled cherry 30g', c: [] },
      { t: 'preserved lemon 1 tsp + olive oil', c: [] },
      { t: 'umeboshi paste 1 tsp + shiso', c: [] },
    ],
  };

  function safeAddIn(flavorId, restrictions) {
    const all = FLAVOR_ADDINS[flavorId];
    const safe = all.filter(a => !a.c.some(tag => restrictions.has(tag)));
    if (safe.length) return pick(safe).t;
    // nothing safe — return null so caller can note omission
    return null;
  }

  // ─── surprise variants (tagged) ───────────────────────────────────
  const SURPRISES = [
    { id: 'boluo', label: 'hong kong surprise', tag: '香港',
      buckets: ['pillowy', 'fuwafuwa'], prefers: ['sweet'],
      contains: ['gluten', 'dairy', 'egg'],
      name: 'bo lo bao 菠萝包', jp: 'パイナップルパン',
      desc: 'a soft milk bun crowned with a sweet crackled cookie crust that looks like pineapple skin — a hong kong cha chaan teng icon.',
      ingredients: [
        'bun: bread flour 240g · milk 130g · sugar 25g · yeast 4g · butter 20g · salt 3g',
        'crust: flour 80g · butter 50g · powdered sugar 50g · egg yolk 1 · custard powder 1 tsp · pinch of baking soda',
        'egg wash · optional cold slab of butter to insert hot (菠萝油 style)',
      ],
      method: [
        'mix & knead bun dough until smooth. proof 60 min, divide 6, bench 10 min.',
        'beat crust ingredients to a soft dough. roll thin between paper, drape over each bun, score crosshatch with a knife.',
        'final proof 40 min, brush crust with egg wash, bake 180°C 14 min until cracks open golden.',
        'split warm and slip in a thick cold pat of butter for full 菠萝油.',
      ] },
    { id: 'congyou', label: 'scallion roll', tag: '葱花',
      buckets: ['pillowy', 'fuwafuwa', 'tender'], prefers: ['savory'],
      contains: ['gluten'],
      name: 'scallion milk roll 葱花面包', jp: 'ねぎパン',
      desc: 'soft milk bread rolls slashed open and stuffed with scallion, sesame oil, and a kiss of salt — a chinese bakery counter staple.',
      ingredients: [
        'bread flour 280g · soy milk 150g · sugar 25g · yeast 4g · neutral oil 25g · salt 4g',
        'filling: chopped scallions 40g · sesame oil 1 tbsp · salt ¼ tsp · white pepper',
        'soy milk wash · sesame seeds to finish',
      ],
      method: [
        'mix, knead 10 min, proof 60 min. divide into 8.',
        'shape each into oval, snip top with scissors 3 times. proof 45 min.',
        'brush with soy milk, spoon scallion mixture into the snips, sesame on top.',
        'bake 180°C 14 min — eat warm, ideally with milk tea.',
      ] },
    { id: 'hongdou', label: 'red bean classic', tag: '红豆',
      buckets: ['fuwafuwa', 'pillowy'], prefers: ['sweet'],
      contains: ['gluten', 'dairy', 'egg'],
      name: 'red bean bun 红豆面包', jp: 'あんぱん',
      desc: 'pillowy milk bun hugging a generous mound of sweet red bean paste — the original 调理面包.',
      ingredients: [
        'bread flour 280g · milk 130g · sugar 28g · yeast 4g · butter 25g · salt 4g',
        'tsubu-an (chunky red bean paste) 180g',
        'egg wash · black sesame to seal',
      ],
      method: [
        'make tangzhong (20g flour + 90g milk paste). combine all, knead 12 min.',
        'proof 60 min, divide 8, bench 10 min.',
        'flatten each, wrap 22g anko, seal seam-down. proof 45 min.',
        'egg-wash, press one black sesame on top, bake 180°C 14 min.',
      ] },
    { id: 'laopo', label: 'flaky sweetheart', tag: '老婆饼',
      buckets: ['laminated'], prefers: ['sweet'],
      contains: ['gluten', 'meat'], // lard is animal fat
      name: 'lao po bing 老婆饼', jp: 'ロウポービン',
      desc: 'crisp-flaky water-and-oil dough wrapping a chewy winter melon and glutinous rice filling — cantonese sweetheart cake.',
      ingredients: [
        'water dough: flour 150g · sugar 15g · lard 40g · water 70g',
        'oil dough: flour 100g · lard 50g',
        'filling: candied winter melon 80g · glutinous rice flour 30g (toasted) · sugar 20g · sesame 10g · water 30g',
      ],
      method: [
        'mix both doughs separately, rest 30 min.',
        'wrap oil dough inside water dough. roll long, fold thirds, rest 15 min. repeat ×2.',
        'divide 8. roll each thin, place filling, pinch closed. flatten gently.',
        'score top twice, brush with egg yolk, sprinkle sesame. bake 180°C 18 min.',
      ] },
    { id: 'koulouri', label: 'thessaloniki', tag: 'koulouri',
      buckets: ['stodgy', 'rustic'], prefers: ['savory'],
      contains: ['gluten'],
      name: 'koulouri thessalonikis', jp: 'クルリ',
      desc: 'crisp sesame-coated bread ring sold from morning carts in northern greece. dipped in petimezi (grape molasses) and water before its sesame coat.',
      ingredients: [
        'bread flour 400g · water 240g · yeast 4g · olive oil 15g · salt 6g',
        'dip: petimezi or grape molasses 30g + water 200g',
        'sesame seeds 100g',
      ],
      method: [
        'mix, knead 8 min. proof 60 min. divide 6.',
        'roll each into a 50cm rope. join ends into a ring. rest 15 min.',
        'dip each ring in petimezi-water, then press into sesame to coat.',
        'bake on hot stone 220°C 14 min. cool on a rack — they crisp as they sit.',
      ] },
    { id: 'pita', label: 'aegean', tag: 'pita',
      buckets: ['tender'], prefers: ['savory', 'sour'],
      contains: ['gluten'],
      name: 'pita ψωμί', jp: 'ピタ',
      desc: 'puffed greek flatbread with a soft interior, bakes in a flash on screaming-hot stone. tear and dip in olive oil and lemon.',
      ingredients: [
        'bread flour 300g · water 190g · olive oil 15g · yeast 3g · salt 5g',
        '(optional: za\'atar or oregano for the top)',
      ],
      method: [
        'mix, knead 8 min, proof 90 min.',
        'divide 6, ball, rest 20 min. roll each to 5mm.',
        'preheat stone/cast iron 260°C. slide on, ~2 min until puffed and freckled.',
        'wrap in a tea towel to keep soft.',
      ] },
    { id: 'tsoureki', label: 'sweet braid', tag: 'tsoureki',
      buckets: ['pillowy', 'fuwafuwa'], prefers: ['sweet'],
      contains: ['gluten', 'dairy', 'egg', 'nut'],
      name: 'tsoureki τσουρέκι', jp: 'ツレキ',
      desc: 'silken greek easter braid scented with mahlepi (cherry pit) and mastiha (mediterranean tree resin) — buttery, faintly floral.',
      ingredients: [
        'bread flour 300g · milk 100g · sugar 70g · eggs 2 · yeast 6g · butter 70g · salt 4g',
        'mahlepi ground ½ tsp · mastiha ground ¼ tsp · orange zest from 1 orange',
        'egg wash · sliced almonds',
      ],
      method: [
        'warm milk, dissolve yeast & sugar. mix in eggs, spices, zest, then flour & salt.',
        'knead 12 min, gradually adding butter. bulk 90 min.',
        'divide 3, roll long, braid. proof 60 min. egg-wash, scatter almonds.',
        'bake 170°C 28 min. cool wrapped in a cloth — the crumb sets soft.',
      ] },
  ];

  // ─── substitution notes ───────────────────────────────────────────
  const SUB_NOTES = {
    gluten:   '🌾 GF: swap wheat with a 1:1 GF flour blend + 1 tsp xanthan gum per 250g flour. lower hydration ~10%. crumb will be denser — choux and focaccia adapt best; laminated doughs are trickiest.',
    dairy:    '🥛 DF: swap milk → oat or soy milk, butter → vegan butter (or 80% weight in coconut oil), cream → cashew cream. egg wash if used → soy milk + maple syrup.',
    egg:      '🥚 EF: per egg use 60g unsweetened applesauce or 1 tbsp ground flax + 3 tbsp water (rested 10 min). egg wash → soy milk + maple. for choux, omit the recipe and try aquafaba choux (well-reduced chickpea liquid).',
    meat:     '🍗 meat-free: any ham/sausage/bacon → smoky tempeh, mushroom duxelles, or roasted miso eggplant. lard → cold vegan butter or coconut oil.',
    caffeine: '☕ caffeine-free: matcha/cocoa/hojicha/coffee → roasted black sesame, kinako, mugicha (roasted barley tea), or molasses + cinnamon for that toasty depth.',
    nut:      '🥜 nut-free: walnut/almond → toasted pumpkin seeds, sunflower seeds, or oats. cashew cream → silken tofu blended with lemon.',
  };

  function buildSubs(base, restrictions) {
    const notes = [];
    restrictions.forEach(r => {
      const inBase = base.contains && base.contains.includes(r);
      if (inBase || r === 'gluten') {
        // always show GF note since most breads have gluten
        notes.push(SUB_NOTES[r]);
      }
    });
    // also include caffeine/meat/nut notes if user picked those, even if base doesn't have them — useful context for add-ins
    ['caffeine', 'meat', 'nut'].forEach(r => {
      if (restrictions.has(r) && !notes.includes(SUB_NOTES[r])) notes.push(SUB_NOTES[r]);
    });
    return notes;
  }

  // ─── recipe generator ─────────────────────────────────────────────
  function generateRecipe(s) {
    const tex = s.texture;
    const flavors = [...s.flavors];
    const bucket = bucketFor(tex);
    const restrictions = s.restrictions;

    // surprises must satisfy ALL active restrictions
    const matchingSurprises = SURPRISES.filter(x =>
      x.buckets.includes(bucket) &&
      (x.prefers.length === 0 || x.prefers.some(p => flavors.includes(p))) &&
      !x.contains.some(c => restrictions.has(c))
    );
    const rollSurprise = matchingSurprises.length && Math.random() < 0.18;

    if (rollSurprise) {
      const v = pick(matchingSurprises);
      return buildSurpriseRecipe(v, s);
    }

    return buildBaseRecipe(bucket, s);
  }

  function buildBaseRecipe(bucket, s) {
    const candidates = BASES[bucket];
    const base = pick(candidates);
    const flavors = [...s.flavors];
    const restrictions = s.restrictions;

    const addIns = [];
    const omitted = [];
    flavors.forEach(f => {
      const safe = safeAddIn(f, restrictions);
      if (safe) addIns.push(safe);
      else omitted.push(f);
    });

    const sizeData = {
      bite:    { tag: 'bite-size',  yield: '12 small pieces',    shape: 'pinch into walnut-sized rounds',          bakeNote: 'bake 2 min shorter, watch closely' },
      handful: { tag: 'handful',    yield: '6 buns',             shape: 'divide into 6, round and tuck seams down', bakeNote: 'standard time as above' },
      arm:     { tag: 'arm-length', yield: '1 loaf or baguette', shape: 'shape as a single loaf / baguette',       bakeNote: 'add 6–8 min to bake time' },
    };
    const sz = sizeData[s.size];

    const namePicks = buildName(base, flavors);

    const ingredients = [base.ingredients];
    addIns.forEach(a => ingredients.push(`+ ${a}`));
    if (omitted.length) ingredients.push(`(${omitted.join(', ')} skipped — no safe add-in under your restrictions)`);
    ingredients.push(`(yield: ${sz.yield})`);

    const method = [
      base.method,
      addIns.length
        ? `gently fold in or place: ${addIns.join('; ')} — typically after the first proof. ${sz.shape}.`
        : `${sz.shape} after the first proof.`,
      `final proof ${s.texture > 70 ? '45–55 min' : '50–60 min'}, then bake. ${sz.bakeNote}.`,
      `cool on a rack at least 20 min before tearing in — the crumb is still setting ♡`,
    ];

    const inspiredOptions = [
      `inspired by pain des philosophes in tokyo — where french fundamentals meet a quiet japanese touch.`,
      `nodding to pain stock in fukuoka — long ferments, wild yeast, a deep crust you can hear.`,
      `somewhere between a tokyo morning bakery and a fukuoka neighborhood oven — humble, generous, a little nerdy.`,
      `the kind of bread you'd find on a small wooden shelf at pain des philosophes, between a kouign-amann and a country loaf.`,
    ];

    const texTag = textureLabel(s.texture).en.replace(/[☁♡🥖 ]/g, '').trim() || 'soft';
    const adjectives = ['warm', 'cozy', 'pillowy', 'a little nerdy', 'soft-hearted', 'crusty in the best way', 'sunny', 'buttery'];

    const subs = buildSubs(base, restrictions);

    return {
      surprise: null,
      opening: `done! i baked you something ${pick(adjectives)} — i think you'll like it ♡`,
      name: namePicks.en,
      jpName: namePicks.jp,
      desc: namePicks.desc + ' ' + (base.dough ? base.dough.charAt(0).toUpperCase() + base.dough.slice(1) + (base.dough.endsWith('.') ? '' : '.') : ''),
      inspired: pick(inspiredOptions),
      ingredients,
      method,
      subs,
      textureTag: texTag,
      sizeTag: sz.tag,
      yield: sz.yield,
    };
  }

  function buildSurpriseRecipe(v, s) {
    const sizeData = {
      bite:    { tag: 'bite-size',  yield: 'a small tray',  note: 'shape smaller, bake 2 min shorter' },
      handful: { tag: 'handful',    yield: '6 servings',    note: 'standard size as written' },
      arm:     { tag: 'arm-length', yield: '1 larger batch', note: 'shape larger, add a few minutes baking' },
    };
    const sz = sizeData[s.size];

    const inspiredSurprise = {
      'boluo':    `from the cha chaan teng counters of central, hong kong — the crackle on top is non-negotiable.`,
      'congyou':  `a chinese bakery classic — every neighborhood has its version. tangshanren bakery in shanghai, paris baguette across asia.`,
      'hongdou':  `traces to kimuraya in ginza (1874) — the bun that started japan's 调理面包 obsession, by way of china's red bean tradition.`,
      'laopo':    `cantonese folklore says a baker invented this for his wife — sweet, flaky, full of feeling.`,
      'koulouri': `street-cart breakfast in thessaloniki, eaten at the trolley stop on the way to work.`,
      'pita':     `mediterranean essential — bakes in 2 minutes on hot stone, puffed and tender.`,
      'tsoureki': `greek easter table — mahlepi from ground cherry pits gives the unmistakable scent.`,
    }[v.id] || 'a surprise from another bread tradition — enjoy ♡';

    const subs = buildSubs(v, s.restrictions);

    return {
      surprise: v.tag,
      opening: `oh! ✦ the oven gods sent you a surprise — a ${v.label}!`,
      name: v.name,
      jpName: v.jp,
      desc: v.desc,
      inspired: inspiredSurprise,
      ingredients: [...v.ingredients, `(yield: ${sz.yield})`],
      method: [...v.method, `sizing note for your pick: ${sz.note}.`],
      subs,
      textureTag: textureLabel(s.texture).en.replace(/[☁♡🥖 ]/g, '').trim() || 'soft',
      sizeTag: sz.tag,
      yield: sz.yield,
    };
  }

  function buildName(base, flavors) {
    const fNouns = {
      savory: ['ham & cheese', 'miso butter', 'sausage', 'corn black pepper', 'bacon sesame', 'caramelized onion', 'miso eggplant', 'olive'],
      bitter: ['matcha', 'cocoa', 'hojicha', 'walnut maple', 'espresso chocolate', 'black sesame', 'kinako', 'molasses cinnamon'],
      sweet:  ['anko', 'banana', 'apple', 'blueberry honey', 'custard cream', 'kabocha cinnamon', 'fig & salt', 'roasted strawberry'],
      sour:   ['yuzu', 'lemon', 'sun-dried tomato', 'raspberry cream cheese', 'pickled cherry', 'preserved lemon', 'umeboshi shiso'],
    };
    const jpNouns = {
      savory: ['ハム＆チーズ', '味噌バター', 'ソーセージ', 'コーン胡椒', 'ベーコン胡麻', 'キャラメル玉ねぎ', '味噌なす', 'オリーブ'],
      bitter: ['抹茶', 'ココア', 'ほうじ茶', 'くるみメープル', 'エスプレッソショコラ', '黒胡麻', 'きなこ', 'モラセスシナモン'],
      sweet:  ['あんこ', 'バナナ', 'りんご', 'ブルーベリー蜂蜜', 'カスタード', 'かぼちゃシナモン', 'いちじく塩', '焼き苺'],
      sour:   ['ゆず', 'レモン', 'ドライトマト', 'ラズベリークリームチーズ', '桜の塩漬け', '塩漬けレモン', '梅紫蘇'],
    };
    const picks = flavors.map(f => pick(fNouns[f]));
    const jpPicks = flavors.map(f => pick(jpNouns[f]));

    const flavorEn = picks.length ? picks.join(' × ') : 'plain';
    const flavorJp = jpPicks.length ? jpPicks.join('×') : 'プレーン';

    const en = `${flavorEn} ${base.name}`.replace(/\s+/g, ' ').toLowerCase();
    const jp = `${flavorJp}${base.jp}`;
    const desc = `a ${flavorEn.toLowerCase()} take on ${base.name}.`;

    return { en, jp, desc };
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ═══════════════════════════════════════════════════════════════════
  // ─── AUDIO: 3/4 · 110 BPM · I–vi–IV–V bakery waltz ────────────────
  // ═══════════════════════════════════════════════════════════════════
  const Audio = (() => {
    let ctx = null, master = null, isPlaying = false;
    let nextNoteTime = 0, current16th = 0;
    let scheduler = null;
    const tempo = 110;
    const stepsPerBar = 6;
    const totalSteps = stepsPerBar * 4;
    const stepDur = 60 / tempo / 2;

    const N = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      C6: 1046.5, D6: 1174.66, E6: 1318.5,
    };

    const melody = [
      N.E5, null, N.G5, null, N.E5, N.D5,
      N.A5, null, N.G5, null, N.E5, null,
      N.F5, null, N.A5, null, N.G5, N.F5,
      N.D5, null, N.G5, null, N.B5, N.A5,
    ];
    const bassPlan = [
      [0, N.C3], [4, N.G3],
      [6, N.A3], [10, N.E3],
      [12, N.F3], [16, N.C4],
      [18, N.G3], [22, N.D4],
    ];
    const chordPlan = [
      [0,  [N.C4, N.E4, N.G4]],
      [6,  [N.A3, N.C4, N.E4]],
      [12, [N.F3, N.A3, N.C4]],
      [18, [N.G3, N.B3, N.D4]],
    ];

    function init() {
      if (ctx) return;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.0;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 18;
      comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
      master.connect(comp).connect(ctx.destination);
    }

    function bell(freq, time, dur = 0.55, vol = 0.16) {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.01;
      const g1 = ctx.createGain(); const g2 = ctx.createGain();
      g1.gain.setValueAtTime(0, time);
      g1.gain.linearRampToValueAtTime(vol, time + 0.005);
      g1.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      g2.gain.setValueAtTime(0, time);
      g2.gain.linearRampToValueAtTime(vol * 0.28, time + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.55);
      o1.connect(g1).connect(master);
      o2.connect(g2).connect(master);
      o1.start(time); o1.stop(time + dur + 0.05);
      o2.start(time); o2.stop(time + dur + 0.05);
    }

    function bass(freq, time, dur = 0.5, vol = 0.18) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g).connect(master);
      o.start(time); o.stop(time + dur + 0.05);
    }

    function pad(freqs, time, dur = 1.2, vol = 0.05) {
      freqs.forEach(f => {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const g = ctx.createGain();
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(vol, time + 0.18);
        g.gain.linearRampToValueAtTime(vol * 0.6, time + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        o.connect(lp).connect(g).connect(master);
        o.start(time); o.stop(time + dur + 0.05);
      });
    }

    function scheduleStep(step, time) {
      const m = melody[step];
      if (m) bell(m, time, 0.58, 0.14);
      bassPlan.forEach(([s, f]) => { if (s === step) bass(f, time, 0.45, 0.18); });
      chordPlan.forEach(([s, fs]) => { if (s === step) pad(fs, time, 1.5, 0.05); });
    }

    function tick() {
      const lookahead = 0.12;
      while (nextNoteTime < ctx.currentTime + lookahead) {
        scheduleStep(current16th, nextNoteTime);
        nextNoteTime += stepDur;
        current16th = (current16th + 1) % totalSteps;
      }
    }

    function start() {
      init();
      if (ctx.state === 'suspended') ctx.resume();
      if (isPlaying) return;
      isPlaying = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.6);
      nextNoteTime = ctx.currentTime + 0.1;
      current16th = 0;
      scheduler = setInterval(tick, 25);
      $musicBtn.classList.add('playing');
      $musicBtn.setAttribute('aria-pressed', 'true');
    }

    function stop() {
      if (!isPlaying) return;
      isPlaying = false;
      clearInterval(scheduler); scheduler = null;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      $musicBtn.classList.remove('playing');
      $musicBtn.setAttribute('aria-pressed', 'false');
    }

    function toggle() { isPlaying ? stop() : start(); }

    function blip(freq = 1200, dur = 0.05) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    }

    function fanfare() {
      if (!ctx) return;
      const t = ctx.currentTime;
      [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => bell(f, t + i * 0.09, 0.5, 0.18));
    }

    return { start, stop, toggle, blip, fanfare };
  })();

  $musicBtn.addEventListener('click', () => Audio.toggle());

  // ─── kickoff ──────────────────────────────────────────────────────
  stepIntro();
})();
