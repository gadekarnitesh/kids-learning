(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl).then(response => response.json());
    const learning = window.activityMode === 'learn';
    const questions = data.questions.slice(0, 3);
    let answered = 0;
    const isColour = ['colour', 'color'].includes(data.presentation) || questions.every(question => /^#[0-9a-f]{6}$/i.test(question.answer));
    const item = value => isColour ? '' : value;
    root.innerHTML = `<h1>${data.title || 'Find the Same Number'}</h1><span class="mode-label ${learning ? 'learn' : 'challenge'}">${learning ? '🌱 Learning time — find each matching answer!' : '🏆 Challenge time — check your answers at the end!'}</span><p class="instruction">${data.instruction || 'Look at the item on the left. Tap the same item on the right.'}</p><div class="number-pick-board ${isColour ? 'colour-pick-board' : ''}">${questions.map(question => `<article class="number-pick-card" data-answer="${question.answer}"><div class="number-to-find"${isColour ? ` style="background-color:${question.answer}"` : ''}>${item(question.answer)}</div><div class="number-choices">${question.choices.map(value => `<button class="number-choice" data-value="${value}"${isColour ? ` style="background-color:${value}"` : ''}>${item(value)}</button>`).join('')}</div></article>`).join('')}</div><p class="feedback"></p><button class="try-again">Start over</button>`;
    const feedback = root.querySelector('.feedback');
    root.querySelectorAll('.number-pick-card').forEach(card => {
      card.querySelectorAll('.number-choice').forEach(choice => choice.addEventListener('click', () => choose(card, choice)));
    });
    function choose(card, choice) {
      if (card.dataset.done === 'true') return;
      const correct = choice.dataset.value === card.dataset.answer;
      if (learning && !correct) {
        choice.classList.add('wrong'); feedback.className = 'feedback error'; feedback.textContent = 'Try again — look for the same answer!'; kidsFun.tryAgain(root);
        setTimeout(() => choice.classList.remove('wrong'), 550); return;
      }
      card.dataset.done = 'true'; card.classList.add('done'); choice.classList.add(correct ? 'correct' : 'wrong');
      card.querySelectorAll('.number-choice').forEach(button => button.disabled = true);
      answered++;
      if (learning) { feedback.className = 'feedback success'; feedback.textContent = 'Yes! You found the same answer!'; }
      if (answered === questions.length) check();
    }
    function check() {
      const wrong = [...root.querySelectorAll('.number-pick-card')].filter(card => !card.querySelector('.number-choice.correct'));
      if (!wrong.length) { feedback.className = 'feedback success'; feedback.textContent = 'Wonderful! You found every matching answer! 🎉'; kidsFun.celebrate(root, 'Great matching!'); return; }
      feedback.className = 'feedback error'; feedback.textContent = 'Some choices are not the same. Try again!'; kidsFun.tryAgain(root);
    }
    root.querySelector('.try-again').addEventListener('click', () => location.reload());
  } catch { root.innerHTML = '<h1>Oops!</h1><p class="instruction">This number activity could not be loaded.</p>'; }
}());
