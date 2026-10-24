window.kidsFun = {
  picture(root, good) { const image = document.createElement('img'); image.className = 'feedback-picture'; image.src = good ? 'assets/images/feedback-success-source.png' : 'assets/images/feedback-try-source.png'; image.alt = good ? 'Great job' : 'Try again'; root.append(image); setTimeout(() => image.remove(), 1400); },
  speak(message) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const words = new SpeechSynthesisUtterance(message);
    words.rate = .92; words.pitch = 1.25; words.volume = .8;
    window.speechSynthesis.speak(words);
  },
  celebrate(root, message = 'Good job!') {
    this.speak(message);
    const burst = document.createElement('div'); burst.className = 'confetti-burst';
    burst.innerHTML = Array.from({length: 30}, (_, i) => `<i style="--i:${i};--c:${['#ff7699','#ffd65a','#5ccf8a','#61c8f5','#7657dd'][i % 5]}"></i>`).join('');
    root.append(burst); this.picture(root, true); setTimeout(() => burst.remove(), 1800);
  },
  tryAgain(root) { if(window.activityTracker) window.activityTracker.retry(); this.speak('Try again. You can do it!'); if(root) this.picture(root, false); }
};
