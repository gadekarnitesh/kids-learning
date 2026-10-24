(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl).then(r => r.json());
    const learning = window.activityMode === 'learn';
    const isAlphabet = data.numbers.every(value => typeof value === 'string');
    const left = [...data.numbers], right = shuffleChoices(data.numbers);
    if (right.length > 1 && right.every((value, i) => value === left[i])) right.push(right.shift());
    const values = [...left, ...right];
    const colors = ['#ff7699', '#61c8f5', '#5ccf8a', '#7657dd', '#ffd65a'];
    const positions = values.map((value, index) => {
      const row = index % left.length;
      return `left:${index < left.length ? 18 : 82}%;top:${(row + 1) / (left.length + 1) * 100}%;`;
    });
    const itemName = isAlphabet ? 'letters' : 'numbers';
    root.innerHTML = `<h1>${data.title || `Connect the Same ${isAlphabet ? 'Letters' : 'Numbers'}`}</h1><span class="mode-label ${learning ? 'learn' : 'challenge'}">${learning ? '🌱 Learning time — feedback appears right away!' : '🏆 Challenge time — check your lines at the end!'}</span><p class="instruction">${data.instruction || `Tap two matching ${itemName} to connect them.`}</p><div class="number-connect-board ${isAlphabet ? 'alphabet-connect-board' : ''}">${values.map((value, index) => `<button id="connect-${index}" class="connect-number" style="${positions[index]}" data-value="${value}">${value}</button>`).join('')}</div><p class="feedback"></p><button class="try-again">Start over</button>`;
    const board = root.querySelector('.number-connect-board');
    const feedback = root.querySelector('.feedback');
    const plumber = window.jsPlumb ? window.jsPlumb.getInstance({ Container: board }) : null;
    const pairs = [];
    let selected = null;
    let nextColor = 0;
    const buttons = [...root.querySelectorAll('.connect-number')];
    const available = button => !pairs.some(pair => pair.first === button || pair.second === button);
    buttons.forEach(button => button.addEventListener('click', () => select(button)));
    function select(button) {
      if (!available(button)) return;
      if (!selected) { selected = button; button.classList.add('selected'); return; }
      if (selected === button) { button.classList.remove('selected'); selected = null; return; }
      const first = selected; first.classList.remove('selected'); selected = null;
      const correct = first.dataset.value === button.dataset.value;
      const color = colors[nextColor++ % colors.length];
      const connection = plumber ? plumber.connect({ source: first, target: button, anchors: ['Continuous', 'Continuous'], connector: ['Bezier', { curviness: 45 }], paintStyle: { stroke: color, strokeWidth: 5 }, endpoint: 'Blank' }) : null;
      const pair = { first, second: button, correct, connection };
      pairs.push(pair);
      if (learning && !correct) {
        feedback.className = 'feedback error'; feedback.textContent = `Oops — those ${itemName} are different. Erasing the line!`; first.classList.add('wrong'); button.classList.add('wrong'); kidsFun.tryAgain(root);
        setTimeout(() => erase(pair), 700);
        return;
      }
      if (correct) { first.classList.add('connected'); button.classList.add('connected'); feedback.className = 'feedback success'; feedback.textContent = `Yes! Those ${itemName} match.`; }
      else { first.classList.add('wrong'); button.classList.add('wrong'); }
      if (pairs.length === data.numbers.length) checkChallenge();
    }
    function erase(pair) {
      pair.first.classList.add('removing'); pair.second.classList.add('removing');
      if (pair.connection && plumber) plumber.deleteConnection(pair.connection);
      const index = pairs.indexOf(pair); if (index > -1) pairs.splice(index, 1);
      setTimeout(() => { pair.first.className = 'connect-number'; pair.second.className = 'connect-number'; }, 500);
    }
    function checkChallenge() {
      const wrong = pairs.filter(pair => !pair.correct);
      if (!wrong.length) { feedback.className = 'feedback success'; feedback.textContent = 'Perfect! Every number has its matching partner! 🎉'; kidsFun.celebrate(root, 'Wonderful number matching!'); return; }
      feedback.className = 'feedback error'; feedback.textContent = 'Some lines are wrong. Watch the eraser, then try those numbers again!'; kidsFun.tryAgain(root);
      wrong.forEach(pair => { pair.first.classList.add('removing'); pair.second.classList.add('removing'); if (pair.connection && pair.connection.setPaintStyle) pair.connection.setPaintStyle({ stroke: '#ff7699', strokeWidth: 6 }); });
      setTimeout(() => wrong.forEach(erase), 750);
    }
    root.querySelector('.try-again').addEventListener('click', () => location.reload());
  } catch { root.innerHTML = '<h1>Oops!</h1><p class="instruction">This number activity could not be loaded.</p>'; }
}());
