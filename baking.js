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
    // single-action buttons get a blip; multi-select sites handle their own chime
    b.addEventListener('click', () => onClick(b));
    return b;
  }

  function makeSurpriseBtn(label, onClick) {
    const b = document.createElement('button');
    b.className = 'btn-surprise';
    b.type = 'button';
    b.innerHTML = `<span class="die">🎲</span><span>${label}</span>`;
    b.addEventListener('click', () => { Audio.swoosh(); onClick(); });
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
        onClick: () => { Audio.blip(); stepTexture(); },
      }));
      $choices.appendChild(makeSurpriseBtn('surprise me with everything!', () => {
        // randomize everything
        state.texture = Math.floor(Math.random() * 101);
        state.flavors = new Set();
        const fn = 1 + Math.floor(Math.random() * 3);
        shuffled(FLAVORS.map(f => f.id)).slice(0, fn).forEach(id => state.flavors.add(id));
        state.size = pick(['bite', 'handful', 'arm']);
        state.restrictions = new Set();
        if (Math.random() > 0.65) {
          const rn = 1 + Math.floor(Math.random() * 2);
          shuffled(RESTRICTIONS.map(r => r.id)).slice(0, rn).forEach(id => state.restrictions.add(id));
        }
        setTimeout(() => stepRecipe(), 500);
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
      Audio.tick();
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
          const isAdding = !state.flavors.has(f.id);
          if (isAdding) state.flavors.add(f.id);
          else state.flavors.delete(f.id);
          btn.classList.toggle('selected');
          Audio.chime(isAdding);
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
          Audio.chime(true);
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
          const isAdding = !state.restrictions.has(r.id);
          if (isAdding) state.restrictions.add(r.id);
          else state.restrictions.delete(r.id);
          btn.classList.toggle('selected');
          Audio.chime(isAdding);
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
      ${r.dough ? `<p class="recipe-dough">${r.dough}</p>` : ''}
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
        dough: 'pâte à choux — cooked panade of milk, butter, flour, then beaten with whole eggs until glossy. pipe and bake to a hollow shell that begs for cream.',
        ingredients: 'milk 80g · water 80g · butter 70g · sugar 5g · salt 2g · flour 95g · whole eggs ~3 (160g, weighed)',
        method: 'boil milk + water + butter + sugar + salt. off heat, add flour, return to medium heat 2 min to dry. cool 5 min. beat in whole eggs one at a time until ribbon-glossy. pipe rounds on lined tray. bake 200°C 25 min, drop to 170°C 15 min — do not open the door. fill cooled.' },
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
        ingredients: 'bread flour 250g · whole eggs 2 · milk 80g · sugar 30g · yeast 5g · butter 80g · salt 5g · egg wash (1 whole egg + 1 tsp milk, beaten)',
        method: 'mix flour, whole eggs, milk, sugar, yeast. knead 10 min, gradually add butter. cold proof overnight. shape, proof 90 min, brush with egg wash, bake 180°C 16 min.' },
      { name: 'melon pan', jp: 'メロンパン',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'soft milk bun crowned with crackled cookie dough — japanese kissaten classic.',
        ingredients: 'bun: bread flour 240g · milk 130g · sugar 25g · yeast 4g · butter 25g · salt 3g. crust: flour 80g · butter 40g · sugar 50g · whole egg 1 · vanilla',
        method: 'mix & proof bun dough 60 min. divide 6. cream crust butter + sugar, beat in whole egg + vanilla, fold in flour. roll crust dough thin, drape over each bun, score crosshatch, sugar dust. proof 50 min, bake 170°C 14 min.' },
    ],
    laminated: [
      { name: 'croissant', jp: 'クロワッサン',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'laminated dough — détrempe wrapped around a butter block, three single folds for ~27 layers.',
        ingredients: 'bread flour 250g · water 110g · milk 50g · sugar 25g · yeast 6g · salt 5g · butter (in dough) 20g · butter block 140g · egg wash (1 egg yolk + 1 tbsp cream, for that deep amber color)',
        method: 'mix détrempe, chill 1 hr. shape butter block. enclose & roll long. fold single × 3, chill 30 min between folds. final roll 3mm, cut triangles, roll up. proof 22°C 2 hr, brush with yolk wash twice. bake 220°C 8 min then 190°C 10 min.' },
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
      { t: 'custard cream 80g (made with egg yolks)', c: ['dairy', 'egg'] },
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

  // ─── surprise variants (Japanese chōri-pan tradition) ─────────────
  const SURPRISES = [
    { id: 'anpan_classic', label: 'classic anpan', tag: 'チョリパン',
      buckets: ['pillowy', 'fuwafuwa'], prefers: ['sweet'],
      contains: ['gluten', 'dairy', 'egg'],
      name: 'classic anpan', jp: 'あんパン',
      desc: 'soft milk dough wrapped around chunky red bean paste, finished with a single black sesame seed. the bun that started japan\'s filled-bread obsession.',
      ingredients: [
        'bread flour 280g · milk 130g · sugar 28g · yeast 4g · butter 25g · salt 4g',
        'tsubu-an (chunky red bean paste) 180g',
        'egg wash (1 whole egg, lightly beaten with 1 tsp milk) · one black sesame seed per bun',
      ],
      method: [
        'whisk tangzhong (20g flour + 90g milk paste). combine all dough, knead 12 min.',
        'proof 60 min, divide 8, bench 10 min.',
        'flatten each, wrap 22g anko, seal seam-down. proof 45 min.',
        'brush with whole-egg wash, press one black sesame on top, bake 180°C 14 min.',
      ] },
    { id: 'cream_pan', label: 'cream pan', tag: '喫茶',
      buckets: ['pillowy', 'fuwafuwa'], prefers: ['sweet'],
      contains: ['gluten', 'dairy', 'egg'],
      name: 'cream pan', jp: 'クリームパン',
      desc: 'shell-shaped milk bun filled with house-made vanilla custard. a shōwa-era kissaten classic — soft as a sigh.',
      ingredients: [
        'bread flour 260g · milk 130g · sugar 30g · yeast 4g · butter 30g · salt 4g',
        'custard filling: milk 250g · egg yolks 3 (whites reserved for another use) · sugar 60g · flour 20g · vanilla bean ½',
        'egg wash (1 whole egg, lightly beaten)',
      ],
      method: [
        'make custard: heat milk + vanilla. whisk egg yolks + sugar + flour. temper, return to heat until thick. chill.',
        'mix dough, knead 10 min. proof 60 min. divide 6.',
        'flatten each into oval, place 40g custard, fold like a hand pie. seal edges with fork.',
        'proof 50 min. brush with whole-egg wash. bake 180°C 12 min — pull as soon as the top is just golden.',
      ] },
    { id: 'mushi_pan', label: 'steamed cloud bun', tag: '蒸し',
      buckets: ['cloud', 'fuwafuwa'], prefers: ['sweet'],
      contains: ['gluten', 'dairy', 'egg'],
      name: 'mushi pan', jp: '蒸しパン',
      desc: 'steamed (not baked!) cloud bun. pillowy and faintly sweet — a stovetop snack for snowy afternoons. eat with hojicha.',
      ingredients: [
        'cake flour 150g · sugar 60g · baking powder 6g · whole egg 1 · milk 90g · neutral oil 20g',
        'optional: candied chestnut, kuromame, or sweet potato cubes — 60g',
      ],
      method: [
        'whisk whole egg + sugar + milk + oil. sift in flour + baking powder, fold until just smooth.',
        'line small cups with paper, fill ⅔. press in chestnut/sweet potato if using.',
        'steam over rolling boil 12 min, lid wrapped in cloth so condensation doesn\'t drip.',
        'pull immediately, cool on rack — the tops will dome and split if your fire was hot enough.',
      ] },
    { id: 'shio_pan', label: 'salt butter roll', tag: '塩パン',
      buckets: ['pillowy', 'tender'], prefers: ['savory'],
      contains: ['gluten', 'dairy'],
      name: 'shio pan', jp: '塩パン',
      desc: 'a soft roll with a cold butter log rolled inside that melts as it bakes, leaving a buttery cavity. flaky salt on top. a small bakery in ehime made this famous.',
      ingredients: [
        'bread flour 280g · water 170g · sugar 12g · yeast 4g · butter (in dough) 15g · salt 5g',
        'cold butter sticks 10g × 8 (one per roll, kept frozen until rolling)',
        'flaky salt to finish',
      ],
      method: [
        'mix, knead 9 min. proof 60 min. divide 8.',
        'roll each into a long teardrop. place a frozen butter stick at the wide end, roll up tight from wide to point.',
        'proof 45 min. scatter flaky salt across the tops.',
        'bake 220°C 11 min until the butter has fully melted into a glossy cavity. eat warm — the cavity is the point.',
      ] },
    { id: 'karee_pan', label: 'curry bread', tag: 'カレー',
      buckets: ['fuwafuwa', 'pillowy'], prefers: ['savory'],
      contains: ['gluten', 'dairy', 'egg', 'meat'],
      name: 'karē pan', jp: 'カレーパン',
      desc: 'soft bread wrapped around japanese curry, panko-coated and deep-fried. crisp shell, fragrant inside. a showa-era picnic icon from shimokitazawa.',
      ingredients: [
        'bread flour 260g · milk 130g · sugar 18g · yeast 4g · butter 20g · salt 4g',
        'japanese curry (thick, well-reduced) 200g — beef or chicken, cooled overnight',
        'panko 100g · egg wash (1 whole egg, lightly beaten with 1 tbsp water) · neutral oil for frying',
      ],
      method: [
        'mix dough, knead 10 min. proof 60 min. divide 8.',
        'flatten each, place 25g cold curry, seal seam-down.',
        'proof 30 min. brush each with whole-egg wash, roll in panko.',
        'fry at 170°C 4 min, turning once, until deep golden. drain on rack.',
      ] },
    { id: 'sakura_pan', label: 'sakura bloom bun', tag: '桜',
      buckets: ['pillowy', 'fuwafuwa'], prefers: ['sweet'],
      contains: ['gluten', 'dairy'],
      name: 'sakura pan', jp: '桜パン',
      desc: 'milk bun tinted faint pink with sakura paste, a salt-pickled cherry blossom pressed on top. brief and beautiful — bakeries in tokyo make these for two weeks in march.',
      ingredients: [
        'bread flour 260g · milk 130g · sugar 25g · yeast 4g · butter 25g · salt 3g',
        'sakura paste (anko + sakura petals) 120g',
        'salt-pickled sakura blossoms 6, rinsed and patted dry',
      ],
      method: [
        'mix dough, knead 10 min. proof 60 min. divide 6.',
        'flatten each, wrap 20g sakura paste, seal seam-down. proof 45 min.',
        'press one rinsed blossom into the center of each bun.',
        'bake 170°C 13 min — the blossom should still hold its color. eat outside under a tree if you can.',
      ] },
    { id: 'kokutou_pan', label: 'okinawan brown sugar bread', tag: '黒糖',
      buckets: ['fuwafuwa', 'pillowy'], prefers: ['sweet'],
      contains: ['gluten', 'dairy'],
      name: 'kokutō pan', jp: '黒糖パン',
      desc: 'okinawan brown sugar bread — rich molasses notes, faintly chewy, deeply warm. caffeine-free comfort, the color of toasted caramel.',
      ingredients: [
        'bread flour 280g · milk 140g · kokutō (okinawan brown sugar) 50g · yeast 4g · butter 25g · salt 4g',
        'optional: walnut 30g (skip for nut-free)',
        'kokutō glaze: brown sugar 20g + water 10g warmed',
      ],
      method: [
        'dissolve kokutō into warm milk first. combine all dough, knead 12 min.',
        'proof 70 min, divide 6, bench 10 min. shape as round buns or one loaf.',
        'final proof 50 min. bake 180°C 16 min for buns / 28 min for a loaf.',
        'brush warm with kokutō glaze for shine.',
      ] },
  ];

  // ─── substitution notes ───────────────────────────────────────────
  const SUB_NOTES = {
    gluten:   '🌾 GF: swap wheat with a 1:1 GF flour blend + 1 tsp xanthan gum per 250g flour. lower hydration ~10%. crumb will be denser — choux and focaccia adapt best; laminated doughs are trickiest.',
    dairy:    '🥛 DF: swap milk → oat or soy milk, butter → vegan butter (or 80% weight in coconut oil), cream → cashew cream. egg wash if used → soy milk + maple syrup.',
    egg:      '🥚 EF: whole egg → 1 tbsp ground flax + 3 tbsp water (rested 10 min) or 60g unsweetened applesauce. egg yolk → 1 tbsp cornstarch + 2 tbsp plant milk + ¼ tsp turmeric (for color). egg white → 3 tbsp aquafaba (chickpea liquid, well-reduced). egg wash → soy milk + maple syrup, brushed on. for choux, try aquafaba choux instead.',
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
      desc: namePicks.desc,
      dough: base.dough,                       // shown separately on the card
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
      'anpan_classic': `traces to kimuraya in ginza, 1874 — the bun that started japan's filled-bread tradition.`,
      'cream_pan':     `shōwa-era kissaten staple. order it with a tiny coffee at a cafe with wood-paneled walls.`,
      'mushi_pan':     `stovetop snack for cold afternoons — no oven, no kneading, just a steamer and a window.`,
      'shio_pan':      `a small bakery in ehime put this on the map in the late 2010s. eat warm, before the butter cavity sets.`,
      'karee_pan':     `showa-era picnic icon born in tokyo's shimokitazawa — crisp shell, soft heart.`,
      'sakura_pan':    `tokyo bakeries make these for two weeks each march. take one to a park bench.`,
      'kokutou_pan':   `okinawan brown sugar lends the loaf its caramel depth — sweet without coffee or chocolate.`,
    }[v.id] || `from somewhere in the japanese bread tradition — enjoy ♡`;

    const subs = buildSubs(v, s.restrictions);

    return {
      surprise: v.tag,
      opening: `oh! ✦ the oven gods sent you a surprise — a ${v.label}!`,
      name: v.name,
      jpName: v.jp,
      desc: v.desc,
      dough: '',
      inspired: inspiredSurprise,
      ingredients: [...v.ingredients, `(yield: ${sz.yield})`],
      method: [...v.method, `sizing note for your pick: ${sz.note}.`],
      subs,
      textureTag: textureLabel(s.texture).en.replace(/[☁♡🥖 ]/g, '').trim() || 'soft',
      sizeTag: sz.tag,
      yield: sz.yield,
    };
  }

  // poetic prefixes for recipe names — paired EN ↔ JP
  const NAME_PREFIXES = [
    { en: 'morning',        jp: '朝の' },
    { en: 'quiet',          jp: '静かな' },
    { en: 'rainy day',      jp: '雨の日の' },
    { en: 'moonlit',        jp: '月夜の' },
    { en: 'sunday',         jp: '日曜の' },
    { en: 'first frost',    jp: '初霜の' },
    { en: 'afternoon',      jp: '午後の' },
    { en: 'attic',          jp: '屋根裏の' },
    { en: 'porchside',      jp: '縁側の' },
    { en: 'sleepy',         jp: 'うとうとの' },
    { en: 'lamplit',        jp: '灯りの' },
    { en: 'seaside',        jp: '海辺の' },
    { en: 'kissaten',       jp: '喫茶店の' },
    { en: 'garden',         jp: '庭の' },
    { en: 'wandering',      jp: '旅の' },
    { en: 'rooftop',        jp: '屋根の上の' },
    { en: 'paperback',      jp: '文庫本の' },
    { en: 'second floor',   jp: '二階の' },
    { en: 'late train',     jp: '終電前の' },
    { en: 'old kitchen',    jp: '台所の' },
  ];

  // short flavor accents (single word) for names — paired EN ↔ JP
  const NAME_ACCENTS = {
    savory: { en: ['cheese', 'miso', 'sausage', 'sesame', 'olive', 'onion', 'tomato'],
              jp: ['チーズ', '味噌',  'ソーセージ', '胡麻', 'オリーブ', '玉ねぎ', 'トマト'] },
    bitter: { en: ['matcha', 'cocoa', 'hojicha', 'walnut', 'sesame', 'kinako'],
              jp: ['抹茶',   'ココア', 'ほうじ茶', 'くるみ', '黒胡麻', 'きなこ'] },
    sweet:  { en: ['anko', 'banana', 'apple', 'blueberry', 'custard', 'kabocha', 'fig'],
              jp: ['あんこ', 'バナナ', 'りんご', 'ブルーベリー', 'カスタード', 'かぼちゃ', 'いちじく'] },
    sour:   { en: ['yuzu', 'lemon', 'tomato', 'raspberry', 'umeboshi'],
              jp: ['柚子',  'レモン', 'トマト', 'ラズベリー', '梅'] },
  };

  function buildName(base, flavors) {
    const idx = Math.floor(Math.random() * NAME_PREFIXES.length);
    const prefix = NAME_PREFIXES[idx];

    let accentEn = '', accentJp = '';
    if (flavors.length && Math.random() > 0.35) {
      const f = pick(flavors);
      const ai = Math.floor(Math.random() * NAME_ACCENTS[f].en.length);
      accentEn = NAME_ACCENTS[f].en[ai] + ' ';
      accentJp = NAME_ACCENTS[f].jp[ai];
    }

    const en = `${prefix.en} ${accentEn}${base.name}`;
    const jp = `${prefix.jp}${accentJp}${base.jp}`;

    const descs = [
      `tuck this in your pocket for a ${prefix.en} walk.`,
      `the kind of bread you'd unwrap by a window in the ${prefix.en} hours.`,
      `for the quiet between two cups of tea.`,
      `feels like ${prefix.en} air — and somehow exactly the right size.`,
      `small enough for a notebook bag, generous enough to share with one friend.`,
      `bake this when you want the kitchen to smell like ${prefix.en}.`,
    ];
    const desc = pick(descs);

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

    // hover tick — extremely quiet, throttled
    let lastHover = 0;
    function hover() {
      if (!ctx) return;
      const t = ctx.currentTime;
      if (t - lastHover < 0.08) return;
      lastHover = t;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 2400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.018, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.06);
    }

    // selection chime — up (add) or down (remove)
    function chime(up = true) {
      if (!ctx) return;
      const t = ctx.currentTime;
      const freqs = up ? [N.G5, N.C6] : [N.C6, N.G5];
      freqs.forEach((f, i) => bell(f, t + i * 0.055, 0.28, 0.085));
    }

    // surprise swoosh — a rising airy sweep
    function swoosh() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(1400, t + 0.22);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = 900; bp.Q.value = 2.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(bp).connect(g).connect(master);
      o.start(t); o.stop(t + 0.32);
      // sparkle bells on top
      [N.E5, N.A5, N.D6].forEach((f, i) => bell(f, t + 0.08 + i * 0.05, 0.35, 0.1));
    }

    // slider tick — softer than blip, throttled separately
    let lastTick = 0;
    function tick() {
      if (!ctx) return;
      const t = ctx.currentTime;
      if (t - lastTick < 0.06) return;
      lastTick = t;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.012, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.04);
    }

    function fanfare() {
      if (!ctx) return;
      const t = ctx.currentTime;
      [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => bell(f, t + i * 0.09, 0.5, 0.18));
    }

    return { start, stop, toggle, blip, hover, chime, swoosh, tick, fanfare };
  })();

  // hover delegation — only fires once ctx exists (after user toggled music once)
  document.body.addEventListener('pointerover', (e) => {
    if (!e.target.closest('.choice-btn, .btn-primary, .btn-ghost, .btn-surprise, .music-btn, .back-home')) return;
    Audio.hover();
  });

  $musicBtn.addEventListener('click', () => Audio.toggle());

  // ─── kickoff ──────────────────────────────────────────────────────
  stepIntro();
})();
