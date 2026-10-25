(() => {
  'use strict';
  const root = document.getElementById('olympiad-root');
  const {render: picture, escape: esc} = window.OlympiadVisuals;
  const LEVELS = {2:'Easy Practice', 3:'More Practice', 4:'Think'};
  const iconFor = id => {
    const objects = {comparison:'butterfly', size:'bear', height:'tree', weight:'feather', fill:'jar', state:'door', posture:'child', same:'butterfly', counting:'apple', quantity:'ball', neighbours:'car'};
    if (id === 'shapes') return picture({kind:'shape', shape:'triangle', color:'#e6a62e', context:'plain'});
    if (['numbers','numerals','compare'].includes(id)) return picture({kind:'number', value:12, style:'card'});
    if (id === 'names') return '<span class="letter-icon">Aa</span>';
    return picture({kind:'object', object:objects[id] || 'ball', color:'#58aa92', ...(id === 'posture' ? {posture:'sit'} : {}), ...(id === 'state' ? {state:'open'} : {}), ...(id === 'fill' ? {fill:1} : {})});
  };
  let catalog, questions = [], storage, storageKey, progress, storageAvailable = true;
  let currentSession = null, practiceSettings = {concept:'size', level:2, pattern:'all'};
  let learner;
  try { learner = JSON.parse(sessionStorage.getItem('kidsLearningProfile') || 'null'); } catch { /* Guest practice works. */ }
  const learnerName = typeof learner?.name === 'string' ? learner.name.trim() : '';
  document.getElementById('olympiad-learner').textContent = learnerName ? `Hi, ${learnerName}!` : 'Let’s explore!';
  const empty = () => ({version:1, solved:{}, learned:[], recent:[], started:{}});
  try {
    storage = learnerName ? localStorage : sessionStorage;
    storageKey = `kids-olympiad-progress:v1:${learnerName ? encodeURIComponent(learnerName.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')) : 'guest'}`;
    const saved = JSON.parse(storage.getItem(storageKey) || 'null');
    progress = saved?.version === 1 && saved.solved && typeof saved.solved === 'object' && !Array.isArray(saved.solved) && Array.isArray(saved.learned) && Array.isArray(saved.recent) ? saved : empty();
    // Keep existing v1 answers and recover previously opened questions as started.
    if (!progress.started || typeof progress.started !== 'object' || Array.isArray(progress.started)) {
      progress.started = Object.fromEntries(progress.recent.filter(id=>typeof id === 'string').map(id=>[id, 1]));
    }
  } catch { progress = empty(); storageAvailable = false; }
  function save() {
    progress.updatedAt = Date.now();
    try { storage.setItem(storageKey, JSON.stringify(progress)); storageAvailable = true; }
    catch { storageAvailable = false; }
    root.querySelectorAll('[data-save-message]').forEach(el=>{el.textContent=saveMessage();});
  }
  function shuffle(items) {
    const values = [...items];
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }
  const conceptById = id => catalog.concepts.find(c => c.id === id);
  const topicById = id => catalog.topics.find(t => t.id === id);
  const patternsFor = id => catalog.patterns.filter(p => p.concept === id);
  const questionCount = id => questions.filter(q => q.concept === id).length;
  const solvedCount = list => list.filter(q => Boolean(progress.solved[q.id])).length;
  function saveMessage() {
    if (!storageAvailable) return 'Progress cannot be saved in this browser right now.';
    return learnerName ? `Saved in this browser for ${learnerName}. Use the same name next time.` : 'Guest progress lasts for this tab. Add your name to save it for next time.';
  }
  function statusMarkup(list, label, compact = false) {
    const completed = solvedCount(list), total = list.length;
    const started = completed > 0 || list.some(q=>progress.started[q.id]);
    const state = total > 0 && completed === total ? 'completed' : started ? 'in-progress' : 'not-started';
    const status = {'completed':'✓ Completed', 'in-progress':'In progress', 'not-started':'Not started'}[state];
    return `<span class="progress-summary ${compact ? 'progress-compact' : ''}" data-status="${state}" aria-label="${esc(label)}: ${esc(status)}, ${completed} of ${total} complete"><span class="progress-summary-line"><span class="status-badge status-${state}">${status}</span><span class="progress-count">${completed} / ${total} complete</span></span>${compact ? '' : `<progress class="completion-bar" value="${completed}" max="${total || 1}" aria-label="${esc(label)}">${completed} of ${total}</progress>`}</span>`;
  }
  function practicePool(settings) {
    return questions.filter(q=>q.concept === settings.concept && q.difficulty === settings.level && (settings.pattern === 'all' || q.pattern === settings.pattern));
  }
  function updatePatternProgress() {
    root.querySelectorAll('[data-pattern] .pattern-progress').forEach(el=>{
      const pattern = el.closest('[data-pattern]').dataset.pattern;
      el.innerHTML = statusMarkup(practicePool({...practiceSettings, pattern}), 'Practice progress');
    });
  }
  function updatePracticeProgress() {
    const el = root.querySelector('#practice-progress');
    if (el && currentSession) el.innerHTML = `<span class="practice-progress-label">Your progress in this practice</span>${statusMarkup(practicePool(currentSession.settings), 'Your progress in this practice')}`;
  }
  function route(values) {
    const hash = new URLSearchParams(values).toString();
    if (location.hash.slice(1) === hash) showRoute();
    else location.hash = hash;
  }
  function focusHeading() {
    root.setAttribute('aria-busy', 'false');
    root.querySelector('h1')?.setAttribute('tabindex', '-1');
    root.querySelector('h1')?.focus({preventScroll:true});
    window.scrollTo({top:0, behavior:'instant'});
  }
  function shell(title, label = 'Olympiad') {
    return `<nav class="olympiad-breadcrumb" aria-label="Learning navigation"><button class="text-button" data-back type="button">← ${esc(label)}</button><span>${esc(title)}</span></nav>`;
  }
  function backTo(values) { root.querySelector('[data-back]')?.addEventListener('click', () => route(values)); }
  function wireConcepts() {
    root.querySelectorAll('[data-concept]').forEach(button => button.addEventListener('click', () => route({view:button.dataset.view || 'learn', concept:button.dataset.concept})));
  }
  function home() {
    currentSession = null;
    const solved = solvedCount(questions);
    root.innerHTML = `<section class="olympiad-hero"><div class="hero-copy"><p class="eyebrow">LOOK · LEARN · TRY · DISCOVER</p><h1>Little steps.<br><span>Bright discoveries.</span></h1><p class="hero-description">Your Olympiad adventure starts with understanding.</p><div class="journey-steps" aria-label="Learning journey"><span>◉ See it</span><span aria-hidden="true">→</span><span>✦ Learn it</span><span aria-hidden="true">→</span><span>★ Try it</span></div></div><div class="hero-pictures" aria-hidden="true"><span class="hero-orbit orbit-one">${picture({kind:'shape',shape:'star',color:'#efbc43',context:'plain'})}</span><span class="hero-orbit orbit-two">${picture({kind:'number',value:12,style:'card'})}</span><span class="hero-orbit orbit-three">${picture({kind:'object',object:'tree',color:'#51b68e',height:116})}</span><span class="hero-spark">✦</span></div></section>
      <div class="learning-overview"><p><strong>${questions.length.toLocaleString()}</strong> ways to practise <span>·</span> <strong>${catalog.concepts.length}</strong> little lessons</p><p class="saved-progress">✿ ${solved ? `${solved} discoveries so far` : 'Every try helps you grow'}</p></div>
      <section class="learner-progress" aria-label="Your saved progress"><div class="progress-title-row"><h2>${learnerName ? `${esc(learnerName)}’s progress` : 'Your progress'}</h2><span>${progress.learned.length} / ${catalog.concepts.length} lessons explored</span></div>${statusMarkup(questions, 'Overall practice progress')}<p class="progress-save-note" data-save-message>${esc(saveMessage())}</p>${learnerName ? '' : '<a class="text-button" href="profile.html?class=olympiad">Add your name →</a>'}</section>
      <section aria-labelledby="topic-heading"><h2 id="topic-heading" class="section-heading">What shall we explore?</h2><div class="olympiad-topics">${catalog.topics.map(topic => {const subset=questions.filter(q=>q.topic===topic.id); return `<button type="button" class="topic-card topic-${topic.id}" data-topic="${topic.id}"><span class="topic-card-icon" aria-hidden="true">${iconFor(topic.id)}</span><span class="topic-card-copy"><strong>${esc(topic.label)}</strong><span>${esc(topic.description)}</span>${statusMarkup(subset, `${topic.label} practice progress`)}</span><span class="topic-arrow" aria-hidden="true">↗</span></button>`;}).join('')}</div></section>
      <p class="gentle-note">No rush. Learn a little, try a little, and come back for more.</p>${storageAvailable ? '' : '<p class="storage-note" role="status">You can keep practising. Progress cannot be saved in this browser right now.</p>'}`;
    root.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => route({view:'topic', topic:button.dataset.topic})));
    focusHeading();
  }
  function topicPage(id) {
    const topic = topicById(id);
    if (!topic) return home();
    currentSession = null;
    root.innerHTML = `${shell(topic.label)}<div class="page-heading"><span class="heading-icon" aria-hidden="true">${iconFor(topic.id)}</span><div><p class="eyebrow">YOUR NEXT LITTLE DISCOVERY</p><h1>${esc(topic.label)}</h1><p>See how it works. Then explore it your way.</p></div></div><div class="concept-grid">${catalog.concepts.filter(c=>c.topic===id).map(c=>{
      const subset = questions.filter(q=>q.concept===c.id);
      return `<article class="concept-card" data-concept-status="${c.id}"><span class="concept-icon" aria-hidden="true">${iconFor(c.id)}</span><h2>${esc(c.label)}</h2><p>${patternsFor(c.id).length} ways to explore · ${questionCount(c.id)} activities</p><div class="concept-progress">${progress.learned.includes(c.id) ? '<span class="learned-badge">✓ Lesson explored</span>' : '<span>Start with a little lesson</span>'}</div>${statusMarkup(subset, `${c.label} practice progress`)}<div class="concept-actions"><button type="button" class="primary-button" data-concept="${c.id}">Let’s learn →</button><button type="button" class="soft-button" data-view="choose" data-concept="${c.id}">Practice</button></div></article>`;
    }).join('')}</div>`;
    backTo({view:'home'}); wireConcepts(); focusHeading();
  }
  function learn(conceptId, requestedStep = 0) {
    const c = conceptById(conceptId);
    if (!c) return home();
    currentSession = null;
    const step = Math.max(0, Math.min(c.lessons.length - 1, Number(requestedStep) || 0));
    const l = c.lessons[step];
    root.innerHTML = `${shell(c.label, topicById(c.topic).label)}<div class="lesson-topline"><span class="stage-pill">✦ Level 1 · Learn</span><span>Little lesson ${step + 1} of ${c.lessons.length}</span></div><section class="lesson-card"><p class="eyebrow">${esc(c.label)}</p><h1>${esc(l.title)}</h1><p class="lesson-text">${esc(l.text)}</p><div class="lesson-pictures ${l.visuals.length > 3 ? 'many-pictures' : ''}">${l.visuals.map((v, i)=>`<figure>${picture(v)}<figcaption>${esc(l.labels[i] || '')}</figcaption></figure>`).join('')}</div><p class="lesson-tip">✦ ${esc(l.tip)}</p><div class="lesson-controls">${step ? '<button type="button" class="soft-button" id="lesson-previous">← See again</button>' : ''}<button type="button" class="primary-button" id="lesson-next">${step < c.lessons.length - 1 ? 'Show me more →' : 'Let’s try together →'}</button></div></section>`;
    backTo({view:'topic', topic:c.topic});
    root.querySelector('#lesson-previous')?.addEventListener('click', () => route({view:'learn', concept:c.id, step:step - 1}));
    root.querySelector('#lesson-next').addEventListener('click', () => {
      if (step < c.lessons.length - 1) route({view:'learn', concept:c.id, step:step + 1});
      else {
        if (!progress.learned.includes(c.id)) progress.learned.push(c.id);
        save(); route({view:'choose', concept:c.id});
      }
    });
    focusHeading();
  }
  function choose(conceptId, level = 2) {
    const c = conceptById(conceptId);
    if (!c) return home();
    currentSession = null;
    practiceSettings = {concept:c.id, level:LEVELS[level] ? Number(level) : 2, pattern:'all'};
    root.innerHTML = `${shell(c.label, topicById(c.topic).label)}<div class="page-heading"><span class="heading-icon" aria-hidden="true">${iconFor(c.id)}</span><div><p class="eyebrow">A LITTLE PRACTICE AT A TIME</p><h1>${esc(c.label)}</h1><p>Choose a way to explore. We’ll try ${catalog.sessionLength} activities together.</p></div></div><div class="concept-total-progress">${statusMarkup(questions.filter(q=>q.concept === c.id), `${c.label} practice progress`)}</div><div class="practice-levels" role="group" aria-label="Practice level">${Object.entries(LEVELS).map(([n,label])=>`<button type="button" data-level="${n}" aria-pressed="${n === String(practiceSettings.level)}"><small>Level ${n}</small><strong>${label}</strong>${statusMarkup(practicePool({concept:c.id, level:Number(n), pattern:'all'}), `${label} progress`, true)}</button>`).join('')}</div><div class="practice-picker"><div class="practice-picker-heading"><h2>How would you like to try?</h2><button type="button" class="text-button" id="learn-again">✦ See the lesson</button></div><div class="pattern-grid"><button type="button" class="pattern-button mix-pattern" data-pattern="all"><span aria-hidden="true">✦</span><strong>A little of everything</strong><small>Mix these ideas</small><span class="pattern-progress"></span></button>${patternsFor(c.id).map(p=>`<button type="button" class="pattern-button" data-pattern="${p.id}"><strong>${esc(p.label)}</strong><span class="pattern-progress"></span></button>`).join('')}</div></div><p class="progress-save-note" data-save-message>${esc(saveMessage())}</p>`;
    backTo({view:'topic', topic:c.topic});
    root.querySelector('#learn-again').onclick = () => route({view:'learn', concept:c.id});
    root.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => {
      practiceSettings.level = Number(button.dataset.level);
      root.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      updatePatternProgress();
    }));
    root.querySelectorAll('[data-pattern]').forEach(button => button.addEventListener('click', () => startSession({...practiceSettings, pattern:button.dataset.pattern})));
    updatePatternProgress(); focusHeading();
  }
  function startSession(settings) {
    practiceSettings = settings;
    const pool = practicePool(settings);
    if (!pool.length) return choose(settings.concept);
    const recent = new Set(progress.recent), unseen = pool.filter(q=>!progress.solved[q.id]);
    const ordered = [...shuffle(unseen.filter(q=>!recent.has(q.id))), ...shuffle(unseen.filter(q=>recent.has(q.id))), ...shuffle(pool.filter(q=>progress.solved[q.id] && !recent.has(q.id))), ...shuffle(pool.filter(q=>progress.solved[q.id] && recent.has(q.id)))];
    currentSession = {settings, questions:ordered.slice(0, catalog.sessionLength), index:0, completed:0, finished:new Set(), retries:0};
    const newHash = new URLSearchParams({view:'practice', concept:settings.concept, level:settings.level, pattern:settings.pattern}).toString();
    if (location.hash.slice(1) === newHash) practice();
    else location.hash = newHash;
  }
  function feedback(message, success = false) {
    const el = root.querySelector('#answer-feedback');
    el.className = `answer-feedback ${success ? 'feedback-correct' : 'feedback-hint'}`;
    el.textContent = message;
  }
  function finishQuestion(q) {
    if (currentSession.finished.has(q.id)) return;
    currentSession.finished.add(q.id); currentSession.completed++;
    progress.solved[q.id] = Date.now(); save();
    updatePracticeProgress();
    feedback(`✓ ${q.explanation}`, true);
    root.querySelector('#next-question').hidden = false;
    root.querySelector('#hint-panel').hidden = true;
    root.querySelectorAll('.practice-dots span')[currentSession.index].classList.add('dot-solved');
  }
  function tryAgain(q) {
    currentSession.retries++;
    feedback(`Let’s look together. ${q.hint}`);
    root.querySelector('#hint-panel').hidden = false;
    root.querySelector('#show-hint').setAttribute('aria-expanded', 'true');
  }
  function practice() {
    if (!currentSession) return choose(practiceSettings.concept, practiceSettings.level);
    if (currentSession.completed === currentSession.questions.length) return recap();
    const session = currentSession, q = session.questions[session.index], c = conceptById(q.concept);
    progress.started[q.id] ||= Date.now();
    progress.recent = [...progress.recent.filter(id=>id !== q.id), q.id].slice(-80); save();
    root.innerHTML = `${shell(c.label, "Choose practice")}<div class="practice-topline"><span class="stage-pill">${session.settings.level === 4 ? '★' : '✿'} Level ${session.settings.level} · ${LEVELS[session.settings.level]}</span><span class="practice-position">${session.index + 1} / ${session.questions.length}</span></div><div class="practice-progress" id="practice-progress" role="status" aria-live="polite"></div><div class="practice-dots" aria-label="${session.completed} activities explored">${session.questions.map((item,i)=>`<span class="${i === session.index ? 'dot-current' : ''} ${session.finished.has(item.id) ? 'dot-solved' : ''}"></span>`).join('')}</div>
      <section class="question-card" data-question-id="${q.id}" data-pattern="${q.pattern}" data-activity="${q.activity}"><div class="question-heading"><h1>${esc(q.question)}</h1><button type="button" class="listen-button" id="listen-question" aria-label="Read the question aloud" hidden>♫</button></div><div class="question-visuals">${q.visuals.map(v=>picture(v,{countable:q.rule === 'count'})).join('')}</div><div id="activity-board"></div><div class="help-row"><button class="text-button" id="show-hint" type="button" aria-expanded="false" aria-controls="hint-panel">✦ A little help</button><button class="text-button" id="question-lesson" type="button">See the lesson</button></div><div class="hint-panel" id="hint-panel" hidden><p>${esc(q.hint)}</p>${q.helper ? picture(q.helper) : ''}</div><p id="answer-feedback" class="answer-feedback" role="status" aria-live="polite" aria-atomic="true"></p><button type="button" id="next-question" class="primary-button next-question" hidden>${session.index + 1 < session.questions.length ? 'Next discovery →' : 'Look what you learned →'}</button></section>`;
    backTo({view:'choose', concept:c.id});
    root.querySelector('#question-lesson').onclick = () => route({view:'learn', concept:c.id});
    root.querySelector('#show-hint').onclick = () => {
      const panel = root.querySelector('#hint-panel');
      panel.hidden = !panel.hidden;
      root.querySelector('#show-hint').setAttribute('aria-expanded', String(!panel.hidden));
    };
    root.querySelector('#next-question').onclick = () => {
      if (session.index + 1 < session.questions.length) { session.index++; practice(); }
      else route({view:'recap', concept:c.id});
    };
    const speaker = root.querySelector('#listen-question');
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      speaker.hidden = false;
      speaker.onclick = () => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(q.question + (q.visuals[0]?.kind === 'word' ? ` ${q.visuals[0].value}` : ''));
        utterance.lang = 'en-IN'; utterance.rate = .8; speechSynthesis.speak(utterance);
      };
    }
    if (q.activity === 'choice') renderChoice(q);
    else if (q.activity === 'pairs') renderPairs(q);
    else renderBuilder(q);
    root.insertAdjacentHTML('beforeend', `<p class="progress-save-note" data-save-message>${esc(saveMessage())}</p>`);
    updatePracticeProgress(); wireCounters(); focusHeading();
  }
  function renderChoice(q) {
    const board = root.querySelector('#activity-board');
    board.innerHTML = `<div class="answer-choices ${q.options.some(o=>o.visual.kind === 'quantity') ? 'quantity-choices' : ''}" role="group" aria-label="Choose a picture">${shuffle(q.options).map(o=>`<button type="button" class="answer-choice" data-option="${o.id}" aria-pressed="false">${picture(o.visual)}<span class="answer-mark" aria-hidden="true"></span></button>`).join('')}</div>`;
    board.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click', () => {
      if (currentSession.finished.has(q.id)) return;
      if (button.dataset.option === q.answer) {
        button.classList.add('choice-correct'); button.setAttribute('aria-pressed', 'true');
        button.querySelector('.answer-mark').textContent = '✓';
        board.querySelectorAll('button').forEach(b=>{b.disabled = true; b.classList.remove('choice-retry');});
        finishQuestion(q);
      } else {
        board.querySelectorAll('button').forEach(b=>b.classList.remove('choice-retry'));
        button.classList.add('choice-retry'); tryAgain(q);
      }
    }));
  }
  function renderPairs(q) {
    const board = root.querySelector('#activity-board');
    board.innerHTML = `<div class="pair-board">${['left','right'].map(side=>`<div class="pair-column" role="group" aria-label="${side === 'left' ? 'Choose one first' : 'Choose its partner'}">${shuffle(q.pairs).map(p=>`<button type="button" class="pair-choice" data-pair="${p.id}" data-side="${side}" aria-pressed="false" aria-label="${esc(window.OlympiadVisuals.describe(p[side]))}">${picture(p[side])}<span class="pair-tick" aria-hidden="true"></span></button>`).join('')}</div>`).join('')}</div><p class="pair-helper" id="pair-helper">Choose one on the left.</p>`;
    let selected = null;
    const matched = new Set();
    board.querySelectorAll('button').forEach(button=>button.addEventListener('click', () => {
      if (button.disabled) return;
      if (button.dataset.side === 'left') {
        board.querySelectorAll('[data-side="left"]').forEach(b=>{b.classList.remove('pair-selected'); b.setAttribute('aria-pressed', 'false');});
        selected = button; button.classList.add('pair-selected'); button.setAttribute('aria-pressed', 'true');
        root.querySelector('#pair-helper').textContent = 'Now find its partner on the right.';
      } else if (!selected) feedback('Choose one on the left first. Then find its partner.');
      else if (selected.dataset.pair === button.dataset.pair) {
        matched.add(button.dataset.pair);
        [selected,button].forEach(b=>{b.disabled=true; b.classList.remove('pair-selected'); b.classList.add('pair-correct'); b.querySelector('.pair-tick').textContent='✓';});
        selected = null;
        root.querySelector('#pair-helper').textContent = matched.size === q.pairs.length ? 'All the partners found!' : 'A match! Choose another on the left.';
        feedback('✓ These belong together.', true);
        if (matched.size === q.pairs.length) finishQuestion(q);
      } else tryAgain(q);
    }));
  }
  function renderBuilder(q) {
    const board = root.querySelector('#activity-board');
    board.innerHTML = '<div class="build-board"><div class="build-basket" id="build-basket"></div><p class="build-count" id="build-count" role="status" aria-live="polite">Start adding pictures</p><div class="build-controls"><button type="button" class="build-minus" id="build-minus" aria-label="Take one picture away" disabled>−</button><button type="button" class="build-plus" id="build-plus" aria-label="Add one picture">+ Add one</button></div><button type="button" class="primary-button" id="build-check" disabled>Check my group ✓</button></div>';
    let count = 0;
    const update = () => {
      root.querySelector('#build-basket').innerHTML = count ? picture({kind:'quantity', count, item:q.item, color:q.color, layout:'rows'}) : '<svg class="olympiad-svg empty-basket" viewBox="0 0 160 160" aria-label="Empty basket" role="img"><path d="M25 65H135L119 131H41Z" fill="#f4d89e" stroke="#b18c54" stroke-width="4"/><path d="M44 65C44 6 116 6 116 65M49 82L56 119M80 82V119M111 82L104 119M37 98H126" fill="none" stroke="#b18c54" stroke-width="5"/></svg>';
      root.querySelector('#build-count').textContent = count ? `${count} in your group` : 'Start adding pictures';
      root.querySelector('#build-minus').disabled = count === 0;
      root.querySelector('#build-plus').disabled = count >= 20;
      root.querySelector('#build-check').disabled = count === 0;
    };
    root.querySelector('#build-minus').onclick=()=>{count--; update();};
    root.querySelector('#build-plus').onclick=()=>{count++; update();};
    root.querySelector('#build-check').onclick=()=>{
      if (count === q.target) {
        board.querySelectorAll('button').forEach(b=>b.disabled=true);
        root.querySelector('#build-basket').classList.add('build-correct'); finishQuestion(q);
      } else tryAgain(q);
    };
    update();
  }
  function wireCounters() {
    root.querySelectorAll('[data-count-index]').forEach(piece=>{
      const toggle = () => {
        const marked = piece.getAttribute('aria-pressed') !== 'true';
        piece.setAttribute('aria-pressed', String(marked));
        piece.setAttribute('aria-label', `Picture ${Number(piece.dataset.countIndex) + 1}, ${marked ? 'counted' : 'not counted'}`);
        piece.classList.toggle('piece-counted', marked);
        piece.querySelector('.count-marker').textContent=marked ? '✓' : '';
      };
      piece.onclick=toggle;
      piece.onkeydown=event=>{if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); toggle();}};
    });
  }
  function recap() {
    if (!currentSession || currentSession.completed !== currentSession.questions.length) return choose(practiceSettings.concept, practiceSettings.level);
    const c = conceptById(currentSession.settings.concept);
    const settings = {...currentSession.settings};
    root.innerHTML = `${shell(c.label, "Choose practice")}<section class="recap-card"><div class="recap-stars" aria-hidden="true">✦ ★ ✦</div><p class="eyebrow">LOOK WHAT YOU LEARNED</p><h1>Six little discoveries!</h1><p>You explored ${esc(c.label.toLowerCase())}.<br>Every try helped you understand a little more.</p><div class="recap-pictures">${shuffle(currentSession.questions).slice(0,3).map(q=>{const v=q.visuals[0] || q.options?.find(o=>o.id===q.answer)?.visual || q.pairs?.[0].right; return `<span>${picture(v)}</span>`;}).join('')}</div><p class="saved-progress">✿ ${solvedCount(questions.filter(q=>q.concept===c.id))} of ${questionCount(c.id)} activities explored</p><div class="recap-actions"><button class="primary-button" id="practice-more" type="button">Try six more →</button><button class="soft-button" id="choose-practice" type="button">Choose a different way</button><button class="text-button" id="take-break" type="button">Back to my adventure</button></div></section>`;
    backTo({view:'choose', concept:c.id});
    root.querySelector('#practice-more').onclick=()=>startSession(settings);
    root.querySelector('#choose-practice').onclick=()=>route({view:'choose',concept:c.id,level:settings.level});
    root.querySelector('#take-break').onclick=()=>route({view:'home'});
    focusHeading();
  }
  function showRoute() {
    window.speechSynthesis?.cancel();
    const params = new URLSearchParams(location.hash.slice(1));
    const view = params.get('view'), concept = params.get('concept');
    if (view === 'topic') topicPage(params.get('topic'));
    else if (view === 'learn') learn(concept, params.get('step'));
    else if (view === 'choose') choose(concept, params.get('level') || 2);
    else if (view === 'practice') {
      if (currentSession && currentSession.settings.concept === concept && String(currentSession.settings.level) === params.get('level') && currentSession.settings.pattern === params.get('pattern')) practice();
      else if (conceptById(concept)) choose(concept, params.get('level') || 2);
      else home();
    } else if (view === 'recap') recap();
    else home();
  }
  async function load() {
    root.setAttribute('aria-busy','true');
    try {
      const read = async path => {const response=await fetch(path); if (!response.ok) throw Error(`Could not load ${path}`); return response.json();};
      catalog = await read('data/olympiad/catalog.json');
      const banks = await Promise.all(catalog.topics.map(t=>read(`data/olympiad/${t.id}.json`)));
      questions = banks.flatMap(bank=>bank.questions);
      const validIds = new Set(questions.map(q=>q.id));
      progress.solved = Object.fromEntries(Object.entries(progress.solved).filter(([id])=>validIds.has(id)));
      progress.started = Object.fromEntries(Object.entries(progress.started).filter(([id])=>validIds.has(id)));
      progress.learned = [...new Set(progress.learned)].filter(id=>conceptById(id));
      progress.recent = [...new Set(progress.recent)].filter(id=>validIds.has(id)).slice(-80);
      window.addEventListener('hashchange', showRoute);
      showRoute();
    } catch {
      root.setAttribute('aria-busy','false');
      root.innerHTML='<section class="lesson-card"><h1>Let’s try opening this again</h1><p>The activities could not load.</p><button class="primary-button" id="retry-loading" type="button">Try again</button><p><a href="index.html">Back to Kids Learning</a></p></section>';
      root.querySelector('#retry-loading').onclick=load;
    }
  }
  load();
})();
