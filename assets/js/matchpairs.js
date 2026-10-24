(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl, { cache: 'no-store' }).then(r => r.json());
    const right = shuffleChoices(data.group2.map((text, i) => ({ text, key: String.fromCharCode(97 + i) })));
    if (right.length > 1 && right.every((item, i) => data.answers[String(i + 1)] === item.key)) right.push(right.shift());
    const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    function wordLabel(text) {
      const value = String(text);
      if (!data.highlightFirstLetter) return escape(value);
      const index = value.search(/[A-Za-z]/);
      if (index < 0) return escape(value);
      return `${escape(value.slice(0,index))}<strong class="word-initial">${escape(value[index])}</strong>${escape(value.slice(index+1))}`;
    }
    function itemLabel(item, highlight = false) {
      if (typeof item !== 'object' || item === null) return highlight ? wordLabel(item) : escape(item);
      return `${item.image ? `<img class="match-picture" src="${escape(item.image)}" alt="${escape(item.alt || item.text || '')}">` : ''}${item.text ? `<span>${highlight ? wordLabel(item.text) : escape(item.text)}</span>` : ''}`;
    }
    const isLearning = window.activityMode === 'learn';
    root.innerHTML = `<h1>${data.title || 'Match the Pair'}</h1><p class="instruction">${escape(data.instruction || 'Tap one item on each side to make a pair.')}</p><div class="match-board"><div class="match-column left">${data.group1.map((x,i)=>`<button class="match-item" data-side="left" data-key="${i+1}">${itemLabel(x)}</button>`).join('')}</div><div class="match-lines"></div><div class="match-column right">${right.map(x=>`<button class="match-item" data-side="right" data-key="${x.key}">${itemLabel(x.text, true)}</button>`).join('')}</div></div><p class="feedback"></p>`;
    let selected = null, solved = 0; const feedback = root.querySelector('.feedback');
    const plumber = window.jsPlumb ? window.jsPlumb.getInstance({ Container: root.querySelector('.match-board') }) : null;
    root.querySelectorAll('.match-item').forEach(item => item.addEventListener('click', () => {
      if (item.classList.contains('correct') || item.classList.contains('answer')) return;
      if (!selected) { selected=item; item.classList.add('selected'); return; }
      if (selected.dataset.side === item.dataset.side) { selected.classList.remove('selected'); selected=item; item.classList.add('selected'); return; }
      const [left, rightItem] = selected.dataset.side === 'left' ? [selected,item] : [item,selected]; selected.classList.remove('selected'); selected=null;
      if (data.answers[left.dataset.key] === rightItem.dataset.key) { left.classList.add('correct');rightItem.classList.add('correct'); if (plumber) plumber.connect({ source:left, target:rightItem, anchors:['Right','Left'], connector:['Bezier',{curviness:35}], paintStyle:{stroke:'#5ccf8a',strokeWidth:4}, endpoint:'Blank' }); feedback.textContent='Great match! ⭐';feedback.className='feedback success'; solved++; if(solved===data.group1.length) { feedback.textContent='Amazing! You matched every pair! 🎉'; kidsFun.celebrate(root, 'Good job! You matched every pair!'); } }
      else { left.classList.add('wrong');rightItem.classList.add('wrong');feedback.textContent=isLearning ? 'Not quite — the blue card is the correct answer.' : 'That pair is not right. Try again!';feedback.className='feedback error';kidsFun.tryAgain(); if (isLearning) { const answerKey=data.answers[left.dataset.key]; root.querySelector(`.match-item[data-side="right"][data-key="${answerKey}"]`).classList.add('answer'); } setTimeout(()=>{left.classList.remove('wrong');rightItem.classList.remove('wrong');root.querySelectorAll('.answer').forEach(x=>x.classList.remove('answer'));},1500); }
    }));
  } catch { root.innerHTML='<h1>Oops!</h1><p class="instruction">This activity could not be loaded.</p>'; }
}());
