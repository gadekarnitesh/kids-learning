(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl).then(r => r.json());
    const learning = window.activityMode !== 'challenge';
    const choices = shuffleChoices(data.choices);
    // Keep this first introduction gentle: one concrete problem per activity page.
    const problems = data.problems.slice(0, 1);
    const group = side => `<div class="counting-glass"><span class="glass-label">${side.label}</span><span class="glass-treats">${side.emoji.repeat(side.count)}</span></div>`;
    root.innerHTML = `<h1>${data.title}</h1><p class="instruction">${data.instruction || 'Count the pictures, then drag the answer into the dotted box.'}</p><div class="math-board">${problems.map(problem => `<article class="math-card"><div class="counting-glasses">${group({ ...problem.left, label: problem.operator === '+' ? 'First glass' : 'Start with' })}<b class="math-action">${problem.operator === '+' ? 'Add' : 'Take away'} ${problem.right.count}</b>${group({ ...problem.right, label: problem.operator === '+' ? 'Second glass' : 'Take away' })}</div><div class="math-equation"><span>${problem.left.count}</span><b>${problem.operator}</b><span>${problem.right.count}</span><b>=</b><div class="math-answer" data-answer="${problem.answer}">?</div></div></article>`).join('')}</div><div class="number-bank">${choices.map((value, index) => `<button class="number-tile" data-value="${value}" id="math-number-${index}">${value}</button>`).join('')}</div><p class="feedback"></p><button class="try-again">Try again</button>`;
    const slots = [...root.querySelectorAll('.math-answer')]; let locked = false;
    const tiles = [...root.querySelectorAll('.number-tile')];
    const resetSelection = bindDragChoices({ choices: tiles, slots, blocked: () => locked, place });
    function place(slot, tile) { if (locked || slot.textContent !== '?') return; const right = tile.dataset.value === slot.dataset.answer; slot.textContent = tile.dataset.value; tile.classList.add('used'); if (learning && !right) { locked = true; slot.classList.add('wrong'); show('Oops — count the pictures once more!', false); setTimeout(() => restore(slot, tile), 700); return; } if (slots.every(item => item.textContent !== '?')) check(); }
    function restore(slot, tile) { slot.textContent = '?'; slot.className = 'math-answer'; tile.classList.remove('used'); tile.classList.add('returning'); setTimeout(() => tile.classList.remove('returning'), 500); locked = false; }
    function check() { locked = true; const bad = []; slots.forEach(slot => { const right = slot.textContent === slot.dataset.answer; slot.classList.add(right ? 'correct' : 'wrong'); if (!right) bad.push(slot); }); if (!bad.length) { show('Correct! You solved every equation! 🎉', true); kidsFun.celebrate(root, 'Wonderful maths!'); return; } show('Some answers are wrong. They will go back — try again!', false); setTimeout(() => bad.forEach(slot => { const tile = root.querySelector(`.number-tile.used[data-value="${slot.textContent}"]`); if (tile) restore(slot, tile); }), 1000); }
    function show(message, good) { const feedback = root.querySelector('.feedback'); feedback.textContent = message; feedback.className = `feedback ${good ? 'success' : 'error'}`; if (!good) kidsFun.tryAgain(root); }
    root.querySelector('.try-again').addEventListener('click', () => { locked = false; resetSelection(); slots.forEach(slot => { slot.textContent = '?'; slot.className = 'math-answer'; }); tiles.forEach(tile => tile.classList.remove('used')); root.querySelector('.feedback').textContent = ''; });
  } catch { root.innerHTML = '<h1>Oops!</h1><p class="instruction">This maths activity could not be loaded.</p>'; }
}());
