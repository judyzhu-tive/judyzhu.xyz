/* judy's bakery — refined vanilla flow */

(() => {
  const $dialog = document.getElementById('dialog-text');
  const $cursor = document.getElementById('dialog-cursor');
  const $choices = document.getElementById('choices');
  const $progress = document.querySelectorAll('.progress .dot');
  const $speakerName = document.getElementById('speaker-name');
  const $speakerTag = document.getElementById('speaker-tag');
  const $musicBtn = document.getElementById('music-btn');
  const $sfxBtn = document.getElementById('sfx-btn');

  const state = {
    texture: 50,
    flavors: new Set(),
    size: null,
    restrictions: new Set(),
  };

  const SPEAKERS = {
    anpan: {
      jp: '',
      en: 'loaf-kun',
      tag: 'host',
    },
    cat: {
      jp: '',
      en: 'cat pal',
      tag: 'recipe ready',
    },
  };

  const FLAVORS = [
    { id: 'savory', icon: 'salt', label: 'savory', hint: 'miso, cheese, onion, tomato' },
    { id: 'bitter', icon: 'tea', label: 'toasty bitter', hint: 'matcha, cocoa, sesame, kinako' },
    { id: 'sweet', icon: 'jam', label: 'sweet', hint: 'anko, custard, fruit, honey' },
    { id: 'sour', icon: 'citrus', label: 'bright sour', hint: 'yuzu, lemon, raspberry, ume' },
  ];

  const SIZES = [
    { id: 'bite', icon: 'small', label: 'bite size', hint: 'tiny buns for a shared plate' },
    { id: 'handful', icon: 'hand', label: 'handful', hint: 'one proper bakery serving' },
    { id: 'arm', icon: 'long', label: 'long loaf', hint: 'tear-and-share bread' },
  ];

  const RESTRICTIONS = [
    { id: 'gluten', icon: 'wheat', label: 'gluten-free', hint: 'avoid wheat, rye, barley' },
    { id: 'dairy', icon: 'milk', label: 'dairy-free', hint: 'avoid milk, butter, cream' },
    { id: 'egg', icon: 'egg', label: 'egg-free', hint: 'avoid yolk, white, and wash' },
    { id: 'meat', icon: 'leaf', label: 'meat-free', hint: 'vegetarian-friendly fillings' },
    { id: 'caffeine', icon: 'moon', label: 'caffeine-free', hint: 'avoid matcha, cocoa, coffee' },
    { id: 'nut', icon: 'seed', label: 'nut-free', hint: 'avoid walnut, almond, cashew' },
  ];

  const TEXTURES = [
    { value: 8, label: 'fuwafuwa', jp: 'ふわふわ', note: 'cloud-soft milk bread' },
    { value: 32, label: 'soft', jp: 'やわらか', note: 'tender buns and choux' },
    { value: 54, label: 'middle', jp: 'まんなか', note: 'buttery, balanced crumb' },
    { value: 78, label: 'chewy', jp: 'もちもち', note: 'country loaf, slow proof' },
    { value: 96, label: 'stodgy', jp: 'がっしり', note: 'sturdy baguette bite' },
  ];

  const BASES = {
    cloud: [
      {
        name: 'Hokkaido Milk Bread',
        jp: 'ほっかいどうミルクパン',
        contains: ['gluten', 'dairy'],
        dough: 'Yudane shokupan: flour scalded with boiling water, rested, then folded into a milk dough for a paper-tearing crumb.',
        ingredients: [
          'bread flour 300g, with 60g reserved for yudane',
          'boiling water 60g, milk 130g, cream 30g',
          'sugar 30g, yeast 5g, butter 30g, salt 4g',
        ],
        method: [
          'Whisk 60g flour with 60g boiling water. Chill the yudane until cool.',
          'Mix remaining flour, yudane, milk, cream, sugar, yeast, butter, and salt. Knead 12 to 14 minutes.',
          'Bulk proof 60 minutes. Divide into 3 coils, proof in a pullman tin, then bake at 200 C for 30 minutes.',
        ],
      },
      {
        name: 'Vanilla Choux Puffs',
        jp: 'バニラシュー',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'Pate a choux: a cooked panade loosened with whole eggs until glossy and pipeable.',
        ingredients: [
          'milk 80g, water 80g, butter 70g, sugar 5g, salt 2g',
          'flour 95g',
          'whole eggs 160g, about 3 eggs, using both yolks and whites',
        ],
        method: [
          'Boil milk, water, butter, sugar, and salt. Add flour off heat, then cook 2 minutes to dry the panade.',
          'Cool 5 minutes. Beat in whole eggs gradually, using yolks and whites together, until the dough ribbons.',
          'Pipe rounds. Bake 200 C for 25 minutes, then 170 C for 15 minutes without opening the door.',
        ],
      },
    ],
    fuwafuwa: [
      {
        name: 'Toasted Milk Buns',
        jp: 'トーストミルクパン',
        contains: ['gluten', 'dairy'],
        dough: 'Tangzhong milk bread: a small cooked flour paste keeps the crumb soft for days.',
        ingredients: [
          'bread flour 280g, with 20g reserved for tangzhong',
          'milk 220g total, cream 30g, sugar 28g',
          'yeast 4g, butter 28g, salt 4g',
        ],
        method: [
          'Cook 20g flour with 90g milk into a paste. Cool.',
          'Mix paste with remaining ingredients and knead until elastic.',
          'Proof 60 minutes, shape as buns, proof 50 minutes, bake at 175 C for 22 minutes.',
        ],
      },
    ],
    pillowy: [
      {
        name: 'Brioche',
        jp: 'ブリオッシュ',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'Enriched brioche: slow cold proof, butter worked in late for a plush crumb.',
        ingredients: [
          'bread flour 250g, milk 80g, sugar 30g, yeast 5g, salt 5g',
          'whole eggs 2, using both yolks and whites in the dough',
          'butter 80g',
          'egg wash: 1 egg yolk plus 1 tbsp cream for a deeper amber top',
        ],
        method: [
          'Mix flour, whole eggs, milk, sugar, yeast, and salt. Knead 10 minutes.',
          'Add butter gradually. Cold proof overnight.',
          'Shape, proof 90 minutes, brush with egg-yolk wash, and bake at 180 C for 16 minutes.',
        ],
      },
      {
        name: 'Kissaten Melon Pan',
        jp: 'きっさてんメロンパン',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'Soft milk bread under a tender cookie cap.',
        ingredients: [
          'bun: bread flour 240g, milk 130g, sugar 25g, yeast 4g, butter 25g, salt 3g',
          'cookie cap: flour 80g, butter 40g, sugar 50g',
          'whole egg 1 for the cookie cap, using yolk and white together',
        ],
        method: [
          'Mix and proof bun dough 60 minutes. Divide into 6.',
          'Cream butter and sugar. Beat in whole egg, then fold in flour.',
          'Wrap each bun with cookie dough, score, proof 50 minutes, and bake at 170 C for 14 minutes.',
        ],
      },
    ],
    laminated: [
      {
        name: 'Croissant',
        jp: 'クロワッサン',
        contains: ['gluten', 'dairy', 'egg'],
        dough: 'Classic lamination: detrempe wrapped around a butter block and folded into fine layers.',
        ingredients: [
          'bread flour 250g, water 110g, milk 50g, sugar 25g, yeast 6g, salt 5g',
          'butter 20g in dough, butter block 140g',
          'egg wash: 1 egg yolk plus 1 tbsp cream; reserve the egg white for meringue or financiers',
        ],
        method: [
          'Mix detrempe and chill 1 hour. Enclose butter block.',
          'Roll and single-fold 3 times, chilling 30 minutes between folds.',
          'Roll to 3mm, cut triangles, proof 2 hours, brush twice with yolk wash, and bake 220 C then 190 C.',
        ],
      },
      {
        name: 'Butter Tartine',
        jp: 'バターのパイタルティーヌ',
        contains: ['gluten', 'dairy'],
        dough: 'Puff pastry-style layers: lean dough folded around butter, crisp and clean without egg in the dough.',
        ingredients: [
          'flour 250g, water 125g, salt 5g',
          'butter block 200g',
          'optional shine: milk brushed lightly on the top; no egg yolk or white required',
        ],
        method: [
          'Mix flour, water, and salt. Rest 30 minutes.',
          'Enclose butter and single-fold 5 to 6 times, chilling between folds.',
          'Roll to 3mm, cut rectangles, dock, and bake under a second tray at 200 C for 18 minutes.',
        ],
      },
    ],
    tender: [
      {
        name: 'Olive Oil Focaccia',
        jp: 'オリーブフォカッチャ',
        contains: ['gluten'],
        dough: 'High-hydration olive oil dough with dimples that hold salt and warm oil.',
        ingredients: [
          'bread flour 400g, water 320g, yeast 3g',
          'olive oil 30g plus more for the tray',
          'salt 8g, flaky salt to finish',
        ],
        method: [
          'Mix and fold every 30 minutes for 2 hours.',
          'Cold proof 12 to 24 hours. Press into an oiled tray.',
          'Dimple, drizzle with oil, salt generously, and bake at 240 C for 18 minutes.',
        ],
      },
    ],
    rustic: [
      {
        name: 'Campagne',
        jp: 'カンパーニュ',
        contains: ['gluten'],
        dough: 'Country loaf: long ferment, deep crust, gentle acidity.',
        ingredients: [
          'bread flour 360g, whole wheat 30g, rye 10g',
          'water 300g, levain 80g, salt 8g',
        ],
        method: [
          'Autolyse flour and water 40 minutes. Add levain and salt.',
          'Fold 4 times over 3 hours. Shape into a banneton.',
          'Cold proof overnight. Bake in a covered pot at 250 C, then uncovered at 230 C.',
        ],
      },
    ],
    stodgy: [
      {
        name: 'Baguette',
        jp: 'バゲット',
        contains: ['gluten'],
        dough: 'Lean baguette: flour, water, salt, yeast, and time.',
        ingredients: [
          'T65 or bread flour 400g',
          'water 280g, yeast 1g, salt 8g',
        ],
        method: [
          'Mix and rest 30 minutes. Add salt, then fold 3 times.',
          'Cold bulk ferment 18 hours. Divide and shape.',
          'Proof on a couche 50 minutes. Score and bake at 250 C with heavy steam for 20 minutes.',
        ],
      },
    ],
  };

  const FLAVOR_ADDINS = {
    savory: [
      { text: 'white miso 1 tsp plus softened butter', tags: ['dairy'] },
      { text: 'caramelized onion 45g plus thyme', tags: [] },
      { text: 'sun-dried tomato 30g plus olive oil', tags: [] },
      { text: 'smoky mushroom duxelles 55g', tags: [] },
      { text: 'ham 60g and gouda 45g', tags: ['meat', 'dairy'] },
    ],
    bitter: [
      { text: 'matcha powder 6g', tags: ['caffeine'] },
      { text: 'cocoa powder 12g and dark chocolate 40g', tags: ['caffeine', 'dairy'] },
      { text: 'black sesame paste 25g', tags: [] },
      { text: 'kinako 20g and brown sugar 15g', tags: [] },
      { text: 'toasted walnut 35g', tags: ['nut'] },
    ],
    sweet: [
      { text: 'anko 90g', tags: [] },
      { text: 'apple compote 80g', tags: [] },
      { text: 'custard 90g made with egg yolks only; save whites for macarons', tags: ['dairy', 'egg'] },
      { text: 'roasted strawberry 60g', tags: [] },
    ],
    sour: [
      { text: 'yuzu marmalade 30g', tags: [] },
      { text: 'lemon zest and sugar', tags: [] },
      { text: 'raspberry 50g + lychee jam 30g + rose water 1/2 tsp', tags: [] },
      { text: 'umeboshi paste 1 tsp and shiso', tags: [] },
    ],
  };

  const SUB_NOTES = {
    gluten: 'Gluten-free: use a bread-friendly 1:1 gluten-free blend with 1 tsp xanthan gum per 250g flour. Lower hydration about 10%. Focaccia and choux adapt best; croissants are the hardest.',
    dairy: 'Dairy-free: use soy or oat milk, vegan butter, and plant cream. For shine, use soy milk with a little maple syrup instead of dairy-based wash.',
    egg: 'Egg-free: replace whole egg with 1 tbsp ground flax plus 3 tbsp water, or 60g applesauce. Replace egg yolk with 1 tbsp cornstarch, 2 tbsp plant milk, and a pinch of turmeric. Replace egg white with 3 tbsp reduced aquafaba.',
    meat: 'Meat-free: swap ham, sausage, or bacon for smoky mushroom duxelles, tempeh, or roasted miso eggplant.',
    caffeine: 'Caffeine-free: skip matcha, cocoa, hojicha, coffee, and chocolate. Use black sesame, kinako, mugicha, molasses, or cinnamon for depth.',
    nut: 'Nut-free: swap walnut or almond for pumpkin seeds, sunflower seeds, oats, or extra sesame.',
  };

  const ICONS = {
    salt: '◇', tea: '◐', jam: '●', citrus: '◌',
    small: '•', hand: '◡', long: '━',
    wheat: '∿', milk: '◯', egg: '◎', leaf: '⌒', moon: '◒', seed: '✶',
    dice: '✦', bake: '→',
  };

  let typingTimer = null;

  function setSpeaker(key) {
    const speaker = SPEAKERS[key];
    $speakerName.textContent = speaker.en;
    $speakerTag.textContent = speaker.tag;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderDialogue(raw) {
    let html = '';
    let highlightOpen = false;
    let glossOpen = false;

    for (let i = 0; i < raw.length; i += 1) {
      if (raw.slice(i, i + 2) === '**') {
        html += highlightOpen ? '</span>' : '<span class="em">';
        highlightOpen = !highlightOpen;
        i += 1;
        continue;
      }
      if (raw[i] === '/') {
        html += glossOpen ? '</span>' : '<span class="jp-gloss">';
        glossOpen = !glossOpen;
        continue;
      }
      html += escapeHtml(raw[i]);
    }

    if (highlightOpen) html += '</span>';
    if (glossOpen) html += '</span>';
    $dialog.innerHTML = html;
  }

  function typeText(text, onDone) {
    if (typingTimer) clearTimeout(typingTimer);
    renderDialogue('');
    $cursor.classList.remove('visible');

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderDialogue(text);
      $cursor.classList.add('visible');
      if (onDone) onDone();
      return;
    }

    let i = 0;
    const tick = () => {
      renderDialogue(text.slice(0, ++i));
      if (i < text.length) {
        typingTimer = setTimeout(tick, /[、。,.!?]/.test(text[i - 1]) ? 95 : 18);
      } else {
        $cursor.classList.add('visible');
        if (onDone) onDone();
      }
    };
    tick();
  }

  function setProgress(step) {
    $progress.forEach((dot, index) => {
      dot.classList.toggle('active', index === step);
      dot.classList.toggle('done', index < step);
    });
  }

  function clearChoices(layout = '') {
    $choices.innerHTML = '';
    $choices.className = `choices${layout ? ` ${layout}` : ''}`;
  }

  function makeChoice({ icon, label, hint, selected, onClick, full }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `choice-btn${selected ? ' selected' : ''}${full ? ' full-row' : ''}`;
    if (icon) button.dataset.icon = icon;
    button.innerHTML = `
      <span class="choice-icon">${ICONS[icon] || icon || '·'}</span>
      <span>
        <span class="choice-label">${label}</span>
        ${hint ? `<span class="choice-hint">${hint}</span>` : ''}
      </span>
    `;
    button.addEventListener('click', () => onClick(button));
    return button;
  }

  function makePill(label, kind, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `pill-btn ${kind || ''}`.trim();
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function surpriseButton(label, onClick) {
    return makeChoice({
      icon: 'dice',
      label,
      hint: 'our counter pick for you',
      full: true,
      onClick: () => {
        Audio.swoosh();
        Audio.accent('surprise');
        onClick();
      },
    });
  }

  function stepIntro() {
    setProgress(0);
    setSpeaker('anpan');
    Audio.setScene('intro');
    clearChoices();
    typeText("Welcome to the **bakery of your imagination**. /いらっしゃい/\nTell me what you're craving, and I'll make a daily special.");
    $choices.appendChild(makeChoice({
      icon: 'bake',
      label: 'Create my daily special',
      hint: 'a few quick choices, one polished recipe',
      full: true,
      onClick: () => {
        Audio.blip();
        stepTexture();
      },
    }));
    $choices.appendChild(surpriseButton('Surprise me with everything', () => {
      randomizeAll();
      stepRecipe(true);
    }));
  }

  function stepTexture() {
    setProgress(0);
    setSpeaker('anpan');
    Audio.setScene('texture');
    clearChoices();
    typeText("First — how should it **feel** in your hands?\nFrom **fuwafuwa** /ふわふわ/ to **stodgy** /がっしり/.");

    const wrap = document.createElement('div');
    wrap.className = 'slider-wrap';
    wrap.innerHTML = `
      <div class="texture-steps">
        ${TEXTURES.map((texture, index) => `
          <button class="texture-step-btn${nearestTexture().value === texture.value ? ' selected' : ''}" type="button" data-texture="${texture.value}">
            <span class="mini-bread" data-level="${index}"></span>
            <span>
              <span class="texture-step-label">${texture.label}</span>
              <span class="texture-step-jp">${texture.jp}</span>
            </span>
          </button>
        `).join('')}
      </div>
      <div class="slider-readout">
        <span id="texture-name" class="big">${textureLabel(state.texture).name}</span>
        <span id="texture-note">${textureLabel(state.texture).note}</span>
      </div>
    `;
    $choices.appendChild(wrap);

    const name = wrap.querySelector('#texture-name');
    const note = wrap.querySelector('#texture-note');
    wrap.querySelectorAll('.texture-step-btn').forEach((button) => {
      button.addEventListener('click', () => {
        state.texture = Number(button.dataset.texture);
        wrap.querySelectorAll('.texture-step-btn').forEach((item) => item.classList.toggle('selected', item === button));
        const label = textureLabel(state.texture);
        name.textContent = label.name;
        note.textContent = label.note;
        Audio.tick();
      });
    });

    $choices.appendChild(surpriseButton('Surprise me with texture', () => {
      state.texture = pick(TEXTURES).value;
      stepFlavor();
    }));

    const row = utilityRow();
    row.append(makePill('next', 'primary', () => {
      Audio.blip();
      stepFlavor();
    }));
    $choices.appendChild(row);
  }

  function stepFlavor() {
    setProgress(1);
    Audio.setScene('flavor');
    clearChoices('grid-2');
    typeText("Next — what **flavor world** are we in today? /味の世界/\nChoose one, or make a small blend.");

    FLAVORS.forEach((flavor) => {
      $choices.appendChild(makeChoice({
        icon: flavor.icon,
        label: flavor.label,
        hint: flavor.hint,
        selected: state.flavors.has(flavor.id),
        onClick: (button) => {
          const added = !state.flavors.has(flavor.id);
          if (added) state.flavors.add(flavor.id);
          else state.flavors.delete(flavor.id);
          button.classList.toggle('selected');
          Audio.chime(added);
          updateFlavorNext();
        },
      }));
    });

    $choices.appendChild(surpriseButton('Surprise me with flavors', () => {
      state.flavors = new Set(shuffled(FLAVORS).slice(0, randomInt(1, 3)).map((f) => f.id));
      stepSize();
    }));

    const row = utilityRow();
    row.append(
      makePill('back', '', () => {
        Audio.blip();
        stepTexture();
      }),
      makePill('pick at least one', 'primary', () => {
        if (!state.flavors.size) return;
        Audio.blip();
        stepSize();
      })
    );
    row.lastChild.id = 'flavor-next';
    $choices.appendChild(row);
    updateFlavorNext();
  }

  function updateFlavorNext() {
    const button = document.getElementById('flavor-next');
    if (!button) return;
    button.disabled = state.flavors.size === 0;
    button.textContent = state.flavors.size ? `next (${state.flavors.size})` : 'pick at least one';
  }

  function stepSize() {
    setProgress(2);
    Audio.setScene('size');
    clearChoices('grid-3');
    typeText("Hmm — and how big are we thinking? /大きさは？/\nA bite, a handful, or something to share.");

    SIZES.forEach((size) => {
      $choices.appendChild(makeChoice({
        icon: size.icon,
        label: size.label,
        hint: size.hint,
        selected: state.size === size.id,
        onClick: () => {
          state.size = size.id;
          Audio.chime(true);
          stepRestrictions();
        },
      }));
    });

    $choices.appendChild(surpriseButton('Surprise me with size', () => {
      state.size = pick(SIZES).id;
      stepRestrictions();
    }));

    const row = utilityRow();
    row.append(makePill('back', '', () => {
      Audio.blip();
      stepFlavor();
    }));
    $choices.appendChild(row);
  }

  function stepRestrictions() {
    setProgress(3);
    Audio.setScene('restrictions');
    clearChoices('grid-2');
    typeText("Last check — anything to avoid? /だいじょうぶ？/\nI'll keep the **daily special** on-brief.");

    RESTRICTIONS.forEach((restriction) => {
      $choices.appendChild(makeChoice({
        icon: restriction.icon,
        label: restriction.label,
        hint: restriction.hint,
        selected: state.restrictions.has(restriction.id),
        onClick: (button) => {
          const added = !state.restrictions.has(restriction.id);
          if (added) state.restrictions.add(restriction.id);
          else state.restrictions.delete(restriction.id);
          button.classList.toggle('selected');
          Audio.chime(added);
          updateRestrictionNext();
        },
      }));
    });

    $choices.appendChild(surpriseButton('Surprise me with restrictions', () => {
      state.restrictions = new Set();
      if (Math.random() > 0.58) {
        shuffled(RESTRICTIONS).slice(0, randomInt(1, 2)).forEach((r) => state.restrictions.add(r.id));
      }
      stepRecipe(true);
    }));

    const row = utilityRow();
    row.append(
      makePill('back', '', () => {
        Audio.blip();
        stepSize();
      }),
      makePill('create special', 'primary', () => {
        Audio.blip();
        stepRecipe(false);
      })
    );
    row.lastChild.id = 'restriction-next';
    $choices.appendChild(row);
    updateRestrictionNext();
  }

  function updateRestrictionNext() {
    const button = document.getElementById('restriction-next');
    if (!button) return;
    button.textContent = state.restrictions.size ? `create careful special (${state.restrictions.size})` : 'create daily special';
  }

  function stepRecipe(wasSurprise) {
    setProgress(4);
    setSpeaker('cat');
    Audio.setScene('reveal');
    clearChoices();
    const recipe = generateRecipe();
    typeText(wasSurprise ? "Here we go — pulled this from the **back shelf**.\nFresh out of the oven for you." : "Here we go — your **daily special** is ready.\nShaped around exactly what you chose.");
    Audio.fanfare();

    const card = document.createElement('article');
    card.className = 'recipe';
    card.innerHTML = `
      <div class="recipe-stamp">${wasSurprise ? 'おまかせ daily special' : 'daily special'}</div>
      <h2>${recipe.name}</h2>
      <p class="recipe-jp">${recipe.jp}</p>
      <p class="recipe-desc">${recipe.desc}</p>
      <p class="recipe-note">${recipe.dough}</p>
      <div class="recipe-grid">
        <section>
          <h3>ingredients</h3>
          <ul>${recipe.ingredients.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <h3>method</h3>
          <ol>${recipe.method.map((item) => `<li>${item}</li>`).join('')}</ol>
        </section>
        <section>
          <h3>egg yolk and white</h3>
          <ul>${recipe.eggs.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <h3>restriction swaps</h3>
          <ul>${recipe.subs.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
      </div>
      <div class="recipe-meta">
        <span class="tag">${textureLabel(state.texture).name}</span>
        ${[...state.flavors].map((id) => `<span class="tag">${labelFrom(FLAVORS, id)}</span>`).join('')}
        <span class="tag">${labelFrom(SIZES, state.size)}</span>
        ${[...state.restrictions].map((id) => `<span class="tag">${labelFrom(RESTRICTIONS, id)}</span>`).join('')}
        <span class="tag">${recipe.yield}</span>
      </div>
    `;
    $choices.appendChild(card);

    const row = utilityRow();
    row.append(
      makePill('tweak restrictions', '', () => {
        Audio.blip();
        stepRestrictions();
      }),
      makePill('curate another special', 'primary', () => {
        Audio.swoosh();
        Audio.accent('surprise');
        randomizeAll();
        stepRecipe(true);
      }),
      makePill('start over', '', () => {
        Audio.blip();
        resetState();
        stepIntro();
      })
    );
    $choices.appendChild(row);
  }

  function generateRecipe() {
    if (!state.size) state.size = 'handful';
    if (!state.flavors.size) state.flavors.add('sweet');
    const bucket = bucketFor(state.texture);
    const base = pickBase(bucket);
    const addIns = [...state.flavors].map((flavor) => safeAddIn(flavor, state.restrictions, base)).filter(Boolean);
    const size = sizeData()[state.size];
    const name = buildName(base, addIns);
    const subs = buildSubs(base, addIns);

    return {
      name: name.en,
      jp: name.jp,
      desc: name.desc,
      dough: base.dough,
      ingredients: [
        ...base.ingredients,
        ...addIns.map((addIn) => `add-in: ${addIn.text}`),
        `yield: ${size.yield}`,
      ],
      method: [
        ...base.method,
        addIns.length ? `Fold or fill with ${addIns.map((a) => a.text).join('; ')} after the first proof.` : 'Keep the dough plain and let the crumb be the point.',
        `${size.shape}. ${size.bakeNote}`,
        'Cool at least 20 minutes before tearing or filling.',
      ],
      eggs: eggNotes(base, addIns),
      subs,
      yield: size.yield,
    };
  }

  function safeAddIn(flavor, restrictions = state.restrictions, base = null) {
    let options = FLAVOR_ADDINS[flavor].filter((item) => !item.tags.some((tag) => restrictions.has(tag)));
    const leanBases = ['Olive Oil Focaccia', 'Campagne', 'Baguette'];
    const baseName = base && base.name;

    if (leanBases.includes(baseName)) {
      if (flavor === 'sweet') {
        options = options.filter((item) => /fig|apple/.test(item.text));
      }
      if (flavor === 'sour') {
        options = options.filter((item) => !/raspberry|lychee|rose/.test(item.text));
      }
      if (flavor === 'bitter') {
        options = options.filter((item) => !/matcha|cocoa|chocolate|hojicha|espresso/.test(item.text));
      }
    }

    return options.length ? pick(options) : null;
  }

  function pickBase(bucket) {
    const candidates = BASES[bucket];
    const hardRestrictions = [...state.restrictions].filter((tag) => tag !== 'gluten');
    const safeInBucket = candidates.filter((base) => !hardRestrictions.some((tag) => base.contains.includes(tag)));
    if (safeInBucket.length) return pick(safeInBucket);

    const allBases = Object.values(BASES).flat();
    const safeAnywhere = allBases.filter((base) => !hardRestrictions.some((tag) => base.contains.includes(tag)));
    return pick(safeAnywhere.length ? safeAnywhere : candidates);
  }

  function buildSubs(base, addIns) {
    const notes = [];
    const tags = new Set([...(base.contains || []), ...addIns.flatMap((item) => item.tags)]);
    state.restrictions.forEach((restriction) => {
      if (SUB_NOTES[restriction] && (tags.has(restriction) || ['gluten', 'caffeine', 'meat', 'nut'].includes(restriction))) {
        notes.push(SUB_NOTES[restriction]);
      }
    });
    return notes.length ? notes : ['No active restriction swaps needed for this bake.'];
  }

  function eggNotes(base, addIns) {
    if (state.restrictions.has('egg')) {
      return [
        'This recipe is marked egg-free in your restrictions: use the egg-free swaps below instead of yolk, white, whole egg, or egg wash.',
        SUB_NOTES.egg,
      ];
    }
    const text = [...base.ingredients, ...base.method, ...addIns.map((item) => item.text)].join(' ').toLowerCase();
    const notes = [];
    if (text.includes('whole egg')) notes.push('Whole egg means yolk and white are used together for structure, tenderness, and color.');
    if (text.includes('egg yolk') || text.includes('yolk')) notes.push('Egg yolk is used for richness, custard body, or a deeper golden wash.');
    if (text.includes('white')) notes.push('Egg white is either included with whole egg or reserved separately when the recipe asks for yolk only.');
    if (!notes.length) notes.push('No egg yolk or egg white is required in the base dough.');
    return notes;
  }

  function buildName(base, addIns) {
    const addInText = addIns.map((item) => item.text).join(' ').toLowerCase();
    const baseName = base.name;
    const baseJp = base.jp;

    const options = [
      {
        test: () => addInText.includes('raspberry') && (addInText.includes('lychee') || addInText.includes('rose')),
        en: `Ispahan ${shortBaseName(baseName)}`,
        jp: `イスパハン${baseJp}`,
        desc: `Ispahan means the rose-lychee-raspberry trio in patisserie shorthand; this keeps that floral fruit note inside a soft bakery shape.`,
      },
      {
        test: () => addInText.includes('kinako'),
        en: `Kinako ${shortBaseName(baseName)}`,
        jp: `きなこ${baseJp}`,
        desc: `Kinako is roasted soybean flour, nutty and golden; it gives this bake a quiet toasted sweetness.`,
      },
      {
        test: () => addInText.includes('yuzu'),
        en: `Yuzu ${shortBaseName(baseName)}`,
        jp: `ゆず${baseJp}`,
        desc: `Yuzu is a Japanese citrus with floral lemon-mandarin brightness; here it lifts the butter and crumb without shouting.`,
      },
      {
        test: () => addInText.includes('anko'),
        en: `Anko ${shortBaseName(baseName)}`,
        jp: `あんこ${baseJp}`,
        desc: `Anko is sweet red bean paste; it brings a gentle, old-school Japanese bakery sweetness.`,
      },
      {
        test: () => addInText.includes('miso'),
        en: `Miso Butter ${shortBaseName(baseName)}`,
        jp: `みそバター${baseJp}`,
        desc: `Miso is fermented soybean paste, savory and deep; with butter it turns the bake warm, rounded, and quietly addictive.`,
      },
      {
        test: () => addInText.includes('matcha'),
        en: `Matcha ${shortBaseName(baseName)}`,
        jp: `まっちゃ${baseJp}`,
        desc: `Matcha is finely milled green tea; its bitterness makes the sweetness feel more deliberate.`,
      },
      {
        test: () => addInText.includes('umeboshi'),
        en: `Ume Shiso ${shortBaseName(baseName)}`,
        jp: `うめしそ${baseJp}`,
        desc: `Ume is salted Japanese plum and shiso is a bright herb; together they make a sharp, aromatic finish.`,
      },
      {
        test: () => addInText.includes('black sesame'),
        en: `Black Sesame ${shortBaseName(baseName)}`,
        jp: `くろごま${baseJp}`,
        desc: `Black sesame gives a dark, roasted nuttiness; the flavor feels simple at first, then keeps opening.`,
      },
      {
        test: () => addInText.includes('custard'),
        en: `Custard ${shortBaseName(baseName)}`,
        jp: `カスタード${baseJp}`,
        desc: `A bakery classic: soft dough, vanilla custard, and just enough richness to feel finished.`,
      },
      {
        test: () => addInText.includes('banana'),
        en: `Caramel Banana ${shortBaseName(baseName)}`,
        jp: `バナナキャラメル${baseJp}`,
        desc: `Banana and brown sugar give it a gentle caramel note, sweet but still bakery-counter simple.`,
      },
      {
        test: () => addInText.includes('apple'),
        en: `Apple Butter ${shortBaseName(baseName)}`,
        jp: `りんごバター${baseJp}`,
        desc: `Apple and butter make this feel familiar, but the dough keeps it polished rather than rustic.`,
      },
      {
        test: () => addInText.includes('blueberries'),
        en: `Blueberry Honey ${shortBaseName(baseName)}`,
        jp: `ブルーベリーハニー${baseJp}`,
        desc: `Blueberry and honey keep the sweetness clean, more morning bakery than dessert.`,
      },
      {
        test: () => addInText.includes('kabocha'),
        en: `Kabocha Cream ${shortBaseName(baseName)}`,
        jp: `かぼちゃクリーム${baseJp}`,
        desc: `Kabocha is Japanese pumpkin; it makes the filling mellow, earthy, and naturally sweet.`,
      },
      {
        test: () => addInText.includes('fig'),
        en: `Fig Sea Salt ${shortBaseName(baseName)}`,
        jp: `いちじくソルト${baseJp}`,
        desc: `Fig and sea salt make the bake feel quietly grown-up, sweet with a clean finish.`,
      },
      {
        test: () => addInText.includes('caramelized onion'),
        en: `Onion Butter ${shortBaseName(baseName)}`,
        jp: `オニオンバター${baseJp}`,
        desc: `Slow onion sweetness folds into the bake like a savory jam.`,
      },
      {
        test: () => addInText.includes('mushroom'),
        en: `Mushroom Duxelles ${shortBaseName(baseName)}`,
        jp: `マッシュルーム${baseJp}`,
        desc: `Duxelles means finely cooked mushrooms; here it gives the bread a deep savory center.`,
      },
      {
        test: () => addInText.includes('ham') || addInText.includes('gouda'),
        en: `Ham Gouda ${shortBaseName(baseName)}`,
        jp: `ハムゴーダ${baseJp}`,
        desc: `Ham and gouda keep it direct, salty, and easy to imagine warm from the tray.`,
      },
      {
        test: () => addInText.includes('sun-dried tomato'),
        en: `Tomato Olive ${shortBaseName(baseName)}`,
        jp: `トマトオリーブ${baseJp}`,
        desc: `Tomato and olive oil give it a small aperitivo feeling, salty and warm around the edges.`,
      },
      {
        test: () => addInText.includes('lemon'),
        en: `Lemon Sugar ${shortBaseName(baseName)}`,
        jp: `レモンシュガー${baseJp}`,
        desc: `Lemon sugar keeps the flavor bright and polished without turning the name into a sentence.`,
      },
      {
        test: () => addInText.includes('walnut'),
        en: `Walnut Maple ${shortBaseName(baseName)}`,
        jp: `くるみメープル${baseJp}`,
        desc: `Walnut and maple make the flavor warm, toasty, and quietly luxurious.`,
      },
      {
        test: () => addInText.includes('cocoa') || addInText.includes('chocolate'),
        en: `Cacao ${shortBaseName(baseName)}`,
        jp: `カカオ${baseJp}`,
        desc: `Cacao keeps the chocolate note darker and more grown-up than sweet.`,
      },
    ];

    const selected = options.find((option) => option.test());
    if (selected) return { en: selected.en, jp: selected.jp, desc: selected.desc };

    const fallbackDesc = {
      'Hokkaido Milk Bread': 'A clean milk bread name with enough softness implied, no extra poetry required.',
      'Vanilla Choux Puffs': 'Classic choux with a vanilla finish, simple enough to trust and pretty enough to serve.',
      'Toasted Milk Buns': 'Soft milk buns with a toasted edge, the kind of name that belongs on a bakery tag.',
      'Brioche': 'Butter-rich and restrained, with the flavor doing more work than the title.',
      'Kissaten Melon Pan': 'Kissaten means old-style Japanese cafe; this is a cafe-counter melon pan with a tender cookie cap.',
      'Croissant': 'A clean laminated pastry title: crisp layers, butter, and no unnecessary mood words.',
      'Butter Tartine': 'A crisp butter-layer base that leaves room for the topping to speak.',
      'Olive Oil Focaccia': 'Olive oil, salt, and a soft open crumb keep this direct and desirable.',
      'Campagne': 'Campagne means country bread in French; this is the kind of loaf that wants a good knife and quiet butter.',
      'Baguette': 'A familiar name with a clear promise: thin crust, open crumb, and a firm bite.',
    };
    const en = baseName;
    const jp = baseJp;
    const desc = fallbackDesc[baseName] || 'A clean bakery-counter name with just enough room for imagination.';
    return { en, jp, desc };
  }

  function shortBaseName(name) {
    const names = {
      'Hokkaido Milk Bread': 'Milk Bread',
      'Vanilla Choux Puffs': 'Choux',
      'Toasted Milk Buns': 'Milk Buns',
      'Kissaten Melon Pan': 'Melon Pan',
      'Olive Oil Focaccia': 'Focaccia',
    };
    return names[name] || name;
  }

  function textureLabel(value) {
    if (value <= 15) return { name: 'fuwafuwa', note: 'cloud-soft shokupan and steam-soft crumb' };
    if (value <= 38) return { name: 'soft', note: 'tangzhong, choux, tender buns' };
    if (value <= 64) return { name: 'middle', note: 'buttery layers and balanced bite' };
    if (value <= 86) return { name: 'chewy', note: 'country loaf, focaccia, slow proof' };
    return { name: 'stodgy', note: 'baguette, lean dough, sturdy crust' };
  }

  function bucketFor(value) {
    if (value <= 15) return 'cloud';
    if (value <= 30) return 'fuwafuwa';
    if (value <= 45) return 'pillowy';
    if (value <= 60) return 'laminated';
    if (value <= 72) return 'tender';
    if (value <= 85) return 'rustic';
    return 'stodgy';
  }

  function sizeData() {
    return {
      bite: { yield: '12 small pieces', shape: 'Shape as walnut-sized rounds', bakeNote: 'Bake 2 minutes shorter and watch the bottoms.' },
      handful: { yield: '6 bakery servings', shape: 'Divide into 6 even pieces', bakeNote: 'Bake as written.' },
      arm: { yield: '1 long loaf', shape: 'Shape as one long loaf', bakeNote: 'Add 6 to 8 minutes to the bake.' },
    };
  }

  function randomizeAll() {
    state.texture = randomInt(0, 100);
    state.flavors = new Set(shuffled(FLAVORS).slice(0, randomInt(1, 3)).map((f) => f.id));
    state.size = pick(SIZES).id;
    state.restrictions = new Set();
    if (Math.random() > 0.62) shuffled(RESTRICTIONS).slice(0, randomInt(1, 2)).forEach((r) => state.restrictions.add(r.id));
  }

  function resetState() {
    state.texture = 50;
    state.flavors = new Set();
    state.size = null;
    state.restrictions = new Set();
  }

  function utilityRow() {
    const row = document.createElement('div');
    row.className = 'utility-row';
    return row;
  }

  function labelFrom(list, id) {
    const item = list.find((entry) => entry.id === id);
    return item ? item.label : id;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function nearestTexture() {
    return TEXTURES.reduce((nearest, texture) => (
      Math.abs(texture.value - state.texture) < Math.abs(nearest.value - state.texture) ? texture : nearest
    ), TEXTURES[0]);
  }

  function shuffled(list) {
    return [...list].sort(() => Math.random() - 0.5);
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function titleCase(text) {
    return text ? text[0].toUpperCase() + text.slice(1) : text;
  }

  const Audio = (() => {
    let ctx = null;
    let master = null;
    let musicBus = null;
    let stringBus = null;
    let sfxBus = null;
    let musicOn = false;
    let sfxOn = true;
    let timer = null;
    let lastHover = 0;
    let lastMove = 0;
    let phraseIndex = 0;
    let musicRun = 0;
    let scene = 'intro';

    const phrases = {
      intro: [
        [392, 0.18, 0.2, 'triangle', 0.018],
        [523.25, 0.22, 0.26, 'triangle', 0.019],
        [659.25, 0.2, 0.24, 'sine', 0.016],
        [587.33, 0.18, 0.22, 'sine', 0.014],
        [523.25, 0.34, 0.48, 'triangle', 0.018],
      ],
      texture: [
        [329.63, 0.18, 0.2, 'triangle', 0.017],
        [392, 0.2, 0.24, 'triangle', 0.018],
        [493.88, 0.16, 0.2, 'sine', 0.014],
        [392, 0.28, 0.4, 'triangle', 0.016],
        [[261.63, 392], 0.38, 0.52, 'sine', 0.013],
      ],
      flavor: [
        [440, 0.14, 0.18, 'triangle', 0.018],
        [554.37, 0.15, 0.18, 'sine', 0.015],
        [659.25, 0.18, 0.23, 'triangle', 0.018],
        [739.99, 0.15, 0.2, 'sine', 0.014],
        [659.25, 0.3, 0.48, 'triangle', 0.017],
      ],
      size: [
        [293.66, 0.2, 0.24, 'triangle', 0.016],
        [369.99, 0.2, 0.24, 'triangle', 0.016],
        [440, 0.22, 0.28, 'sine', 0.015],
        [[329.63, 493.88], 0.36, 0.5, 'sine', 0.012],
      ],
      restrictions: [
        [349.23, 0.16, 0.22, 'sine', 0.014],
        [392, 0.16, 0.22, 'triangle', 0.014],
        [523.25, 0.24, 0.32, 'sine', 0.015],
        [466.16, 0.18, 0.26, 'triangle', 0.013],
        [[349.23, 523.25], 0.34, 0.5, 'sine', 0.012],
      ],
      reveal: [
        [523.25, 0.2, 0.24, 'triangle', 0.018],
        [659.25, 0.2, 0.24, 'triangle', 0.018],
        [783.99, 0.24, 0.3, 'sine', 0.017],
        [[659.25, 880], 0.42, 0.58, 'sine', 0.014],
      ],
    };

    const accents = {
      open: [523.25, 659.25, 783.99],
      surprise: [659.25, 880, 1174.66, 987.77],
      reveal: [523.25, 659.25, 783.99, 1046.5],
    };

    const stringChords = {
      intro: [
        [261.63, 329.63, 392],
        [293.66, 349.23, 440],
        [329.63, 392, 493.88],
      ],
      texture: [
        [261.63, 329.63, 392],
        [246.94, 293.66, 392],
        [220, 329.63, 440],
      ],
      flavor: [
        [293.66, 369.99, 440],
        [329.63, 415.3, 493.88],
        [261.63, 329.63, 440],
      ],
      size: [
        [220, 293.66, 369.99],
        [246.94, 329.63, 392],
        [293.66, 369.99, 440],
      ],
      restrictions: [
        [233.08, 349.23, 466.16],
        [261.63, 349.23, 523.25],
        [196, 293.66, 392],
      ],
      reveal: [
        [261.63, 329.63, 392, 523.25],
        [293.66, 369.99, 440, 587.33],
        [329.63, 392, 493.88, 659.25],
      ],
    };

    function init() {
      if (ctx) return;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.82;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0;
      musicBus.connect(master);
      stringBus = ctx.createGain();
      stringBus.gain.value = 0.62;
      stringBus.connect(musicBus);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(master);
    }

    function ready() {
      init();
      if (ctx.state === 'suspended') ctx.resume();
    }

    function setButton(button, on) {
      button.classList.toggle('playing', on);
      button.setAttribute('aria-pressed', String(on));
    }

    function tone(freq, duration = 0.08, volume = 0.04, type = 'sine', bus = sfxBus) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(bus);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    function stringPad(notes, duration = 1.6, volume = 0.008) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const filter = ctx.createBiquadFilter();
      const chordGain = ctx.createGain();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1160, now);
      filter.Q.value = 0.7;
      chordGain.gain.setValueAtTime(0, now);
      chordGain.gain.linearRampToValueAtTime(volume, now + 0.22);
      chordGain.gain.setTargetAtTime(0.0001, now + duration * 0.72, 0.22);
      chordGain.connect(filter).connect(stringBus);

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        osc.type = index % 2 ? 'triangle' : 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value = index % 2 ? 5 : -4;
        osc.connect(chordGain);
        osc.start(now + index * 0.018);
        osc.stop(now + duration + 0.16);
      });
    }

    function stringPluck(freq, volume = 0.012) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      filter.type = 'bandpass';
      filter.frequency.value = freq * 2;
      filter.Q.value = 3.2;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc.connect(filter).connect(gain).connect(stringBus);
      osc.start(now);
      osc.stop(now + 0.45);
    }

    function effect(freq, duration = 0.08, volume = 0.04, type = 'sine') {
      if (!sfxOn) return;
      ready();
      tone(freq, duration, volume, type, sfxBus);
    }

    function schedulePhrase(immediate = false) {
      clearTimeout(timer);
      if (!musicOn || !ctx) return;
      const token = musicRun;
      const phrase = phrases[scene] || phrases.intro;
      const chords = stringChords[scene] || stringChords.intro;
      const chord = chords[phraseIndex % chords.length];
      let offset = immediate ? 0.04 : 0.18;

      setTimeout(() => {
        if (musicOn && token === musicRun) stringPad(chord, scene === 'reveal' ? 2.25 : 1.55, scene === 'reveal' ? 0.01 : 0.007);
      }, Math.max(0, offset - 0.02) * 1000);

      phrase.forEach(([freq, duration, gap, type, volume]) => {
        const delay = offset * 1000;
        setTimeout(() => {
          if (!musicOn || token !== musicRun) return;
          if (Array.isArray(freq)) {
            freq.forEach((item, index) => tone(item, duration, volume * (index ? 0.5 : 1), type, musicBus));
          } else {
            tone(freq, duration, volume, type, musicBus);
          }
        }, delay);
        if (phraseIndex % 2 === 0 && !Array.isArray(freq) && gap > 0.22) {
          setTimeout(() => {
            if (musicOn && token === musicRun) stringPluck(freq * 2, 0.006);
          }, (offset + gap * 0.48) * 1000);
        }
        offset += gap;
      });

      if (phraseIndex % 3 === 2) {
        setTimeout(() => {
          if (musicOn && token === musicRun) tone(1046.5, 0.08, 0.008, 'sine', musicBus);
        }, Math.max(0, offset - 0.12) * 1000);
      }

      phraseIndex += 1;
      const rest = scene === 'reveal' ? 1.15 : 0.62 + (phraseIndex % 2) * 0.24;
      timer = setTimeout(() => schedulePhrase(false), (offset + rest) * 1000);
    }

    function toggleMusic() {
      ready();
      musicOn = !musicOn;
      setButton($musicBtn, musicOn);
      musicRun += 1;

      if (musicOn) {
        phraseIndex = 0;
        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.setTargetAtTime(1, ctx.currentTime, 0.06);
        schedulePhrase(true);
        accent('open');
      } else {
        clearTimeout(timer);
        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      }
    }

    function toggleSfx() {
      sfxOn = !sfxOn;
      setButton($sfxBtn, sfxOn);
      if (sfxOn) effect(880, 0.08, 0.045, 'triangle');
    }

    function blip(freq = 760) {
      effect(freq, 0.07, 0.06, 'triangle');
    }

    function chime(up) {
      effect(up ? 659.25 : 392, 0.11, 0.055, 'sine');
      setTimeout(() => effect(up ? 880 : 293.66, 0.14, 0.045, 'sine'), 55);
    }

    function swoosh() {
      [440, 660, 990].forEach((freq, index) => setTimeout(() => effect(freq, 0.12, 0.045, 'triangle'), index * 45));
    }

    function tick() {
      effect(1400, 0.025, 0.015, 'square');
    }

    function hover() {
      if (!ctx || !sfxOn) return;
      const now = ctx.currentTime;
      if (now - lastHover < 0.09) return;
      lastHover = now;
      tone(1800, 0.035, 0.012, 'sine', sfxBus);
    }

    function move(clientX, clientY) {
      if (!ctx || !sfxOn) return;
      const now = ctx.currentTime;
      if (now - lastMove < 0.18) return;
      lastMove = now;
      const xRatio = Math.max(0, Math.min(1, clientX / window.innerWidth));
      const yRatio = Math.max(0, Math.min(1, clientY / window.innerHeight));
      tone(520 + xRatio * 360 + (1 - yRatio) * 120, 0.04, 0.008, 'sine', sfxBus);
    }

    function fanfare() {
      accent('reveal');
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
        setTimeout(() => effect(freq, 0.22, 0.07, 'sine'), index * 80);
      });
    }

    function accent(kind) {
      if (!musicOn) return;
      ready();
      const token = musicRun;
      const notes = accents[kind] || accents.open;
      notes.forEach((freq, index) => {
        setTimeout(() => {
          if (musicOn && token === musicRun) tone(freq, 0.16, 0.015, 'triangle', musicBus);
        }, index * 52);
      });
    }

    function setScene(nextScene) {
      scene = nextScene;
      if (!musicOn || !ctx) return;
      musicRun += 1;
      schedulePhrase(true);
    }

    function sync() {
      setButton($musicBtn, musicOn);
      setButton($sfxBtn, sfxOn);
    }

    sync();

    return { toggleMusic, toggleSfx, setScene, accent, blip, chime, swoosh, tick, hover, move, fanfare };
  })();

  document.body.addEventListener('pointerover', (event) => {
    if (event.target.closest('button, a')) Audio.hover();
  });

  document.body.addEventListener('pointermove', (event) => {
    Audio.move(event.clientX, event.clientY);
  });

  $musicBtn.addEventListener('click', Audio.toggleMusic);
  $sfxBtn.addEventListener('click', Audio.toggleSfx);

  stepIntro();
})();
