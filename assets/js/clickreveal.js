(async function () {
  const root = document.getElementById('activity-root');
  try {
    const data = await fetch(window.activityDataUrl).then(r => { if (!r.ok) throw Error(); return r.json(); });
    root.innerHTML = `<img class="activity-hero" src="${window.activityImageUrl}" alt="Happy animals learning"><h1>${data.title}</h1><p class="instruction">${data.instruction || 'Tap a picture to discover the answer!'}</p><div class="card-grid">${data.items.map(item => `<button class="reveal-card" aria-label="Reveal ${item.answer}">${item.image ? `<img class="card-image" src="${item.image}" alt="">` : `<span class="cover">${item.icon || '❓'}</span>`}<span class="answer">${item.answer}</span></button>`).join('')}</div><p class="feedback"></p>`;
    let count = 0; root.querySelectorAll('.reveal-card').forEach(card => card.addEventListener('click', () => { if (!card.classList.contains('revealed')) { card.classList.add('revealed'); count++; if (count === data.items.length) { root.querySelector('.feedback').textContent = 'You found them all!'; root.querySelector('.feedback').className = 'feedback success'; kidsFun.celebrate(root, 'Wonderful learning!'); } } }));
  } catch { root.innerHTML = '<h1>Oops!</h1><p class="instruction">This activity could not be loaded.</p>'; }
}());
