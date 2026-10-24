(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl).then(r => r.json());
    const learning = window.activityMode !== 'challenge';
    const numbers = shuffleChoices(data.numbers || data.tasks.map(task => task.count));
    root.innerHTML = `<h1>${data.title || 'Count & Drag'}</h1><p class="instruction">${data.instruction || 'Count the pictures, then drag the matching number.'}</p><div class="count-board">${data.tasks.map((task, index) => `<article class="count-card"><div class="count-objects" aria-label="${task.count} ${task.label}">${task.emoji.repeat(task.count)}</div><p class="count-prompt">How many ${task.label}?</p><div class="count-slot" data-answer="${task.count}" data-index="${index}">?</div></article>`).join('')}</div><p class="instruction">Drag a number to every dotted box.</p><div class="number-bank">${numbers.map((number, index) => `<button class="number-tile" draggable="true" data-value="${number}" id="number-${index}" aria-label="Number ${number}">${number}</button>`).join('')}</div><p class="feedback"></p><button class="try-again">Try again</button>`;
    let dragged = null, locked = false;
    const slots = [...root.querySelectorAll('.count-slot')];
    root.querySelectorAll('.number-tile').forEach(tile => {
      tile.addEventListener('dragstart', event => { dragged = tile; event.dataTransfer.setData('text/plain', tile.dataset.value); });
      tile.addEventListener('pointerdown', () => { dragged = tile; });
    });
    slots.forEach(slot => {
      slot.addEventListener('dragover', event => event.preventDefault());
      slot.addEventListener('drop', event => { event.preventDefault(); place(slot); });
      slot.addEventListener('click', () => place(slot));
    });
    function place(slot) {
      if (!dragged || locked || slot.textContent !== '?') return;
      const tile = dragged, right = tile.dataset.value === slot.dataset.answer;
      slot.textContent = tile.dataset.value;
      tile.classList.add('used');
      dragged = null;
      if (learning && !right) {
        locked = true; slot.classList.add('wrong'); root.querySelector('.feedback').className = 'feedback error'; root.querySelector('.feedback').textContent = 'Oops — count once more!'; kidsFun.tryAgain(root);
        setTimeout(() => returnTile(slot, tile), 750);
        return;
      }
      if (slots.every(item => item.textContent !== '?')) check();
    }
    function returnTile(slot, tile) {
      slot.textContent = '?'; slot.className = 'count-slot'; tile.classList.remove('used'); tile.classList.add('returning'); setTimeout(() => tile.classList.remove('returning'), 500); locked = false;
    }
    function check() {
      locked = true;
      const wrong = [];
      slots.forEach(slot => { const ok = slot.textContent === slot.dataset.answer; slot.classList.add(ok ? 'correct' : 'wrong'); if (!ok) wrong.push(slot); });
      const feedback = root.querySelector('.feedback');
      if (!wrong.length) { feedback.className = 'feedback success'; feedback.textContent = 'Right! You counted every group! 🎉'; kidsFun.celebrate(root, 'Wonderful counting!'); return; }
      feedback.className = 'feedback error'; feedback.textContent = learning ? 'Let’s try the pink boxes again.' : 'Almost! The pink boxes will go back — try again.'; kidsFun.tryAgain(root);
      setTimeout(() => wrong.forEach(slot => { const tile = root.querySelector(`.number-tile.used[data-value="${slot.textContent}"]`); if (tile) returnTile(slot, tile); }), 1100);
    }
    root.querySelector('.try-again').addEventListener('click', () => {
      locked = false; dragged = null; slots.forEach(slot => { slot.textContent = '?'; slot.className = 'count-slot'; }); root.querySelectorAll('.number-tile').forEach(tile => tile.classList.remove('used')); const feedback = root.querySelector('.feedback'); feedback.textContent = ''; feedback.className = 'feedback';
    });
  } catch { root.innerHTML = '<h1>Oops!</h1><p class="instruction">This counting activity could not be loaded.</p>'; }
}());
