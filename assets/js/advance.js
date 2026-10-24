(async function () {
  const root = document.getElementById('activity-root');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  try {
    const data = await fetch(window.activityDataUrl, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('Activity unavailable');
      return response.json();
    });
    const questions = data.questions.map((q,index) => ({ ...q, choices: shuffleChoices(q.choices, `question-${index}`) }));
    if (!questions || !questions.length) throw new Error('No questions');
    const separator = data.presentation === 'equation' ? '' : '<span class="advance-comma">,</span>';
    const pageSize = 2, solved = new Map();
    const vertical = data.presentation === 'equation' && data.layout === 'vertical';
    function token(item) {
      return item === '?' ? '<button class="count-slot advance-drop" type="button" aria-label="Drop answer here">?</button>' : `<span class="advance-fixed">${escape(item)}</span>`;
    }
    function prompt(question) {
      if (!vertical) return `<div class="advance-sequence">${question.sequence.map(token).join(separator)}</div>`;
      const [first, operator, second, , result] = question.sequence;
      return `<div class="vertical-sum" aria-label="${escape(question.sequence.join(' '))}"><div class="sum-first">${token(first)}</div><div class="sum-second"><span class="sum-operator">${escape(operator)}</span>${token(second)}</div><div class="sum-result">${token(result)}</div></div>`;
    }
    let page = 0;
    function render() {
      const visible = questions.slice(page * pageSize, (page + 1) * pageSize);
      root.innerHTML = `<h1>${escape(data.title)}</h1><p class="instruction">${escape(data.instruction)} Drop your answer in the dotted box.</p><div class="advance-questions ${vertical ? 'vertical-questions' : ''}">${visible.map((question, index) => `<article class="advance-question" data-index="${page * pageSize + index}"><div class="advance-line">${prompt(question)}<div class="advance-answer-bank"><span class="advance-options-label">Options</span><div class="advance-options" role="group" aria-label="Answer choices">${question.choices.map(value => `<button class="connect-number advance-option" type="button" draggable="false" data-value="${escape(value)}">${escape(value)}</button>`).join('')}</div></div></div><p class="feedback" aria-live="polite"></p></article>`).join('')}</div><div class="advance-pagination"><button class="try-again" data-page="previous" ${page === 0 ? 'disabled' : ''}>← Previous</button><span>Page ${page + 1} of ${Math.ceil(questions.length / pageSize)}</span><button class="try-again" data-page="next" ${(page + 1) * pageSize >= questions.length ? 'disabled' : ''}>Next →</button></div>`;
      root.querySelectorAll('.advance-question').forEach(card => {
        const index = Number(card.dataset.index), question = questions[index];
        const slot = card.querySelector('.count-slot'), feedback = card.querySelector('.feedback');
        const choices = [...card.querySelectorAll('.advance-option')];
        let locked = false;
        function accept(choice) {
          slot.textContent = choice.dataset.value;
          slot.classList.add('correct');
          choice.classList.add('used');
          choices.forEach(item => { item.disabled = true; });
        }
        if (solved.has(index)) accept(choices[solved.get(index)]);
        function place(choice) {
          if (locked || solved.has(index)) return;
          choice.classList.remove('selected');
          slot.textContent = choice.dataset.value;
          choice.classList.add('used');
          if (choice.dataset.value === String(question.answer)) {
            solved.set(index, choices.indexOf(choice));
            accept(choice);
            feedback.className = 'feedback success';
            feedback.textContent = 'Correct!';
          } else {
            locked = true;
            slot.classList.add('wrong');
            feedback.className = 'feedback error';
            feedback.textContent = 'Try another answer.';
            window.activityTracker?.retry();
            setTimeout(() => {
              slot.textContent = '?';
              slot.classList.remove('wrong');
              choice.classList.remove('used');
              choice.classList.add('returning');
              setTimeout(() => choice.classList.remove('returning'), 500);
              locked = false;
            }, 700);
          }
        }
        bindDragChoices({ choices, slots: [slot], place: (_, choice) => place(choice), blocked: () => locked || solved.has(index) });
      });
      root.querySelector('[data-page="previous"]').addEventListener('click', () => { page--; render(); });
      root.querySelector('[data-page="next"]').addEventListener('click', () => { page++; render(); });
    }
    render();
  } catch {
    root.innerHTML = '<h1>Oops!</h1><p class="instruction">This activity could not be loaded.</p>';
  }
}());
