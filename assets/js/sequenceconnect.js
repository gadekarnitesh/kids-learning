(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl).then(r => r.json());
    const learning = window.activityMode === 'learn';
    const values = shuffleChoices(data.numbers);
    const colors = ['#ff7699', '#61c8f5', '#5ccf8a', '#7657dd', '#ffd65a'];
    const wanted = new Set(data.numbers.slice(0, -1).map((number, index) => `${number}-${data.numbers[index + 1]}`));
    const positions = values.map((value, index) => {
      const angle = (data.numbers.indexOf(Number(value)) / data.numbers.length) * Math.PI * 2 - Math.PI / 2;
      return `left:${50 + Math.cos(angle) * 34}%;top:${50 + Math.sin(angle) * 34}%;`;
    });
    root.innerHTML = `<h1>${data.title || 'Connect Number Order'}</h1><span class="mode-label ${learning ? 'learn' : 'challenge'}">${learning ? '🌱 Learning time — wrong lines erase right away!' : '🏆 Challenge time — check your lines at the end!'}</span><p class="instruction">${data.instruction}</p><div class="number-connect-board">${values.map((value, index) => `<button id="sequence-${index}" class="connect-number" style="${positions[index]}" data-value="${value}">${value}</button>`).join('')}</div><p class="feedback"></p><button class="try-again">Start over</button>`;
    const board = root.querySelector('.number-connect-board'), feedback = root.querySelector('.feedback');
    const plumber = window.jsPlumb ? window.jsPlumb.getInstance({ Container: board }) : null;
    const buttons = [...root.querySelectorAll('.connect-number')], pairs = [];
    let selected = null, colorIndex = 0;
    const keyFor = (first, second) => [Number(first.dataset.value), Number(second.dataset.value)].sort((a, b) => a - b).join('-');
    buttons.forEach(button => button.addEventListener('click', () => {
      if (!selected) { selected = button; button.classList.add('selected'); return; }
      if (selected === button) { button.classList.remove('selected'); selected = null; return; }
      const first = selected; first.classList.remove('selected'); selected = null; const key = keyFor(first, button);
      const correct = wanted.has(key) && !pairs.some(pair => pair.key === key);
      const connection = plumber ? plumber.connect({ source: first, target: button, anchors: ['Continuous', 'Continuous'], connector: ['Bezier', { curviness: 45 }], paintStyle: { stroke: colors[colorIndex++ % colors.length], strokeWidth: 5 }, endpoint: 'Blank' }) : null;
      const pair = { first, second: button, key, correct, connection }; pairs.push(pair);
      if (learning && !correct) { feedback.className = 'feedback error'; feedback.textContent = 'Oops — follow the number order. Erasing the line!'; first.classList.add('wrong'); button.classList.add('wrong'); kidsFun.tryAgain(root); setTimeout(() => erase(pair), 700); return; }
      if (correct) { first.classList.add('connected'); button.classList.add('connected'); feedback.className = 'feedback success'; feedback.textContent = 'Great! That is the next number.'; selected = button; button.classList.add('selected'); } else { first.classList.add('wrong'); button.classList.add('wrong'); }
      if (pairs.length === wanted.size) check();
    }));
    function erase(pair) { pair.first.classList.add('removing'); pair.second.classList.add('removing'); if (pair.connection && plumber) plumber.deleteConnection(pair.connection); const index = pairs.indexOf(pair); if (index > -1) pairs.splice(index, 1); setTimeout(() => { pair.first.classList.remove('wrong', 'removing'); pair.second.classList.remove('wrong', 'removing'); }, 500); }
    function check() { const wrong = pairs.filter(pair => !pair.correct); if (!wrong.length) { feedback.className = 'feedback success'; feedback.textContent = 'Perfect number order! 1, 2, 3, 4, 5! 🎉'; kidsFun.celebrate(root, 'Wonderful number order!'); return; } feedback.className = 'feedback error'; feedback.textContent = 'Some lines skipped a number. They will erase — try again!'; kidsFun.tryAgain(root); setTimeout(() => wrong.forEach(erase), 750); }
    root.querySelector('.try-again').addEventListener('click', () => location.reload());
  } catch { root.innerHTML = '<h1>Oops!</h1><p class="instruction">This sequencing activity could not be loaded.</p>'; }
}());
