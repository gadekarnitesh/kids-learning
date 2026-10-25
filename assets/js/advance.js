(async function () {
  const root = document.getElementById('activity-root');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const params = new URLSearchParams(location.search), isMaths = params.get('class') === 'maths';
  const progress = isMaths ? window.mathsProgress : null, file = params.get('file');
  try {
    const data = await fetch(window.activityDataUrl, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('Activity unavailable');
      return response.json();
    });
    if (!Array.isArray(data.questions) || !data.questions.length) throw new Error('No questions');
    let questions, previouslyCompleted = new Set();
    function prepareQuestions() {
      const saved = progress?.openLevel(file, data.questions);
      previouslyCompleted = new Set(saved?.completed || []);
      const remaining = progress ? data.questions.filter(question => !previouslyCompleted.has(progress.questionId(question))) : data.questions;
      const questionOrder = data.shuffleQuestions ? shuffleChoices(remaining, 'question-order') : [...remaining];
      if (saved?.currentQuestion) {
        const current = questionOrder.findIndex(question => progress.questionId(question) === saved.currentQuestion);
        if (current > 0) questionOrder.unshift(questionOrder.splice(current, 1)[0]);
      }
      questions = questionOrder.map((q,index) => ({ ...q, choices: shuffleChoices(q.choices, `question-${index}`) }));
    }
    prepareQuestions();
    const separator = data.presentation === 'equation' ? '' : '<span class="advance-comma">,</span>';
    const pageSize = Math.max(1, Math.min(2, Number(data.questionsPerPage) || 2)), solved = new Map();
    if (isMaths) {
      root.classList.add('maths-activity');
      document.documentElement.style.setProperty('--purple', data.levelColor || '#7657dd');
      if (data.remainders) root.classList.add('maths-remainders');
    }
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
    function publishProgress(completed) {
      if (isMaths && typeof parent.setMathsLevelProgress === 'function') {
        parent.setMathsLevelProgress(completed, data.questions.length, location.href);
      }
    }
    function updateProgressText() {
      const label = root.querySelector('.maths-question-progress');
      const completed = previouslyCompleted.size + solved.size;
      publishProgress(completed);
      if (label) {
        label.textContent = `(${completed}/${data.questions.length})`;
        label.setAttribute('aria-label', `${completed} of ${data.questions.length} questions complete`);
      }
      if (progress?.learner && !progress.available && !root.querySelector('.maths-storage-note')) {
        const note = document.createElement('p'); note.className = 'maths-storage-note';
        note.textContent = 'Progress cannot be saved in this browser right now.';
        root.querySelector('.instruction')?.after(note);
      }
    }
    function rememberCurrentQuestion() {
      if (!progress) return;
      const start = page * pageSize;
      const index = questions.findIndex((question, index) => index >= start && !solved.has(index));
      progress.rememberQuestion(file, index >= 0 ? questions[index] : questions.find((question, index) => !solved.has(index)));
    }
    function renderCompleted() {
      publishProgress(data.questions.length);
      root.innerHTML = `<h1>${escape(data.title)}</h1><section class="maths-level-finished"><span class="maths-complete-mark" aria-hidden="true">✓</span><h2>Level complete!</h2><p>All ${data.questions.length} questions answered. Great work!</p>${progress?.learner && progress.available ? '<p>Your progress is saved for next time.</p>' : ''}<div class="maths-completion-actions"><button class="try-again" id="maths-choose-level" type="button">Choose another level</button><button class="try-again" id="maths-practice-again" type="button">Practice this level again</button></div></section>`;
      root.querySelector('#maths-choose-level').addEventListener('click', () => {
        if (typeof parent.openMathsTopics === 'function') parent.openMathsTopics();
        else location.assign('activities.html?class=maths');
      });
      root.querySelector('#maths-practice-again').addEventListener('click', () => {
        progress?.resetLevel(file);
        solved.clear(); page = 0; prepareQuestions(); render();
      });
    }
    function render() {
      if (isMaths && (!questions.length || solved.size === questions.length)) { renderCompleted(); return; }
      const visible = questions.slice(page * pageSize, (page + 1) * pageSize);
      root.innerHTML = `<h1>${escape(data.title)}</h1><p class="instruction">${escape(data.instruction)} Drop your answer in the dotted box.</p><div class="advance-questions ${vertical ? 'vertical-questions' : ''} ${pageSize === 1 ? 'single-question' : ''}">${visible.map((question, index) => `<article class="advance-question" data-index="${page * pageSize + index}"><div class="advance-line">${prompt(question)}<div class="advance-answer-bank"><span class="advance-options-label">Options</span><div class="advance-options" role="group" aria-label="Answer choices">${question.choices.map(value => `<button class="connect-number advance-option" type="button" draggable="false" data-value="${escape(value)}">${escape(value)}</button>`).join('')}</div></div></div><p class="feedback" aria-live="polite"></p></article>`).join('')}</div><div class="advance-pagination"><button class="try-again" data-page="previous" ${page === 0 ? 'disabled' : ''}>← Previous</button><span aria-label="${pageSize === 1 ? 'Question' : 'Page'} ${page + 1} of ${Math.ceil(questions.length / pageSize)}">${isMaths ? `(${page + 1}/${Math.ceil(questions.length / pageSize)})` : `${pageSize === 1 ? 'Question' : 'Page'} ${page + 1} of ${Math.ceil(questions.length / pageSize)}`}</span><button class="try-again" data-page="next" ${(page + 1) * pageSize >= questions.length ? 'disabled' : ''}>Next →</button></div>`;
      if (isMaths) {
        if (typeof parent.setMathsLevelProgress !== 'function') {
          const label = document.createElement('p'); label.className = 'maths-question-progress';
          label.setAttribute('role', 'status'); root.querySelector('.instruction').after(label);
        }
        updateProgressText(); rememberCurrentQuestion();
      }
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
            if (progress) progress.completeQuestion(file, question);
            if (isMaths) {
              updateProgressText(); rememberCurrentQuestion();
              if (solved.size === questions.length) renderCompleted();
            }
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
