// Persistent progress belongs only to the Maths learner in this session.
(() => {
  if (new URLSearchParams(location.search).get('class') !== 'maths') return;
  let profile = null;
  try { profile = JSON.parse(sessionStorage.getItem('kidsLearningProfile') || 'null'); } catch { /* A learner can still practice without storage. */ }
  const name = typeof profile?.name === 'string' ? profile.name.trim() : '';
  const normalizeName = value => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  const learner = profile?.classId === 'maths' && name ? { name } : null;
  const identity = learner ? normalizeName(name) : null;
  const storageKey = identity ? `kids-maths-progress:v2:${encodeURIComponent(identity)}` : null;
  let available = Boolean(storageKey);
  const empty = () => ({ version: 2, lastActivity: '', levels: {} });
  function parseState(raw, version) {
    try {
      const state = JSON.parse(raw || 'null');
      return state?.version === version && state.levels && typeof state.levels === 'object' && !Array.isArray(state.levels) ? state : null;
    } catch { return null; }
  }
  function migrateAgeProfiles() {
    if (!storageKey) return;
    try {
      // Once a name record exists, resets must not restore old age-based answers.
      if (parseState(localStorage.getItem(storageKey), 2)) return;
      const prefix = 'kids-maths-progress:v1:', records = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(prefix)) continue;
        try {
          const legacyIdentity = JSON.parse(decodeURIComponent(key.slice(prefix.length)));
          if (!Array.isArray(legacyIdentity) || typeof legacyIdentity[0] !== 'string' || normalizeName(legacyIdentity[0]) !== identity) continue;
          const state = parseState(localStorage.getItem(key), 1);
          if (state) records.push(state);
        } catch { /* Ignore a malformed legacy record, preserving other progress. */ }
      }
      if (!records.length) return;
      records.sort((a, b) => (Number(a.updatedAt) || 0) - (Number(b.updatedAt) || 0));
      const merged = empty();
      for (const record of records) {
        if (typeof record.lastActivity === 'string' && record.lastActivity) merged.lastActivity = record.lastActivity;
        for (const file of Object.keys(record.levels)) {
          const previous = level(merged, file), incoming = level(record, file);
          merged.levels[file] = {
            total: Math.max(previous.total, incoming.total),
            completed: [...new Set([...previous.completed, ...incoming.completed])],
            currentQuestion: incoming.currentQuestion || previous.currentQuestion,
          };
        }
      }
      for (const saved of Object.values(merged.levels)) {
        if (saved.completed.includes(saved.currentQuestion)) saved.currentQuestion = null;
      }
      merged.updatedAt = Number(records[records.length - 1].updatedAt) || Date.now();
      // Preserve the original records as backups; all future changes use v2.
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch { available = false; }
  }
  function read() {
    if (!storageKey) return empty();
    try {
      return parseState(localStorage.getItem(storageKey), 2) || empty();
    } catch { available = false; return empty(); }
  }
  function notify() {
    window.dispatchEvent(new Event('maths-progress-changed'));
    try { if (parent !== window) parent.dispatchEvent(new Event('maths-progress-changed')); } catch { /* Standalone activity. */ }
  }
  function write(state) {
    if (!storageKey) return false;
    try {
      state.updatedAt = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(state));
      available = true;
      notify();
      return true;
    } catch { available = false; notify(); return false; }
  }
  function level(state, file) {
    const saved = state.levels[file];
    return {
      total: Math.max(0, Number(saved?.total) || 0),
      completed: Array.isArray(saved?.completed) ? saved.completed.filter(id => typeof id === 'string') : [],
      currentQuestion: typeof saved?.currentQuestion === 'string' ? saved.currentQuestion : null,
    };
  }
  function questionId(question) {
    return JSON.stringify([question.sequence.map(String), String(question.answer)]);
  }
  migrateAgeProfiles();
  window.mathsProgress = {
    learner,
    storageKey,
    get available() { return available; },
    questionId,
    getLastActivity() { return read().lastActivity || ''; },
    setLastActivity(file) {
      const state = read();
      if (state.lastActivity !== file) { state.lastActivity = file; write(state); }
    },
    getLevel(file) { return level(read(), file); },
    getStatus(file, total) {
      const saved = level(read(), file);
      total = Math.max(0, Number(total) || saved.total);
      const completed = Math.min(total, new Set(saved.completed).size);
      return { total, completed, remaining: total - completed, complete: total > 0 && completed === total };
    },
    openLevel(file, questions) {
      const state = read(), saved = level(state, file);
      const ids = new Set(questions.map(questionId));
      saved.completed = [...new Set(saved.completed)].filter(id => ids.has(id));
      saved.total = questions.length;
      if (!ids.has(saved.currentQuestion) || saved.completed.includes(saved.currentQuestion)) saved.currentQuestion = null;
      state.levels[file] = saved;
      state.lastActivity = file;
      write(state);
      return saved;
    },
    rememberQuestion(file, question) {
      if (!question) return;
      const state = read(), saved = level(state, file), id = questionId(question);
      if (saved.currentQuestion === id || saved.completed.includes(id)) return;
      saved.currentQuestion = id;
      state.levels[file] = saved;
      write(state);
    },
    completeQuestion(file, question) {
      const state = read(), saved = level(state, file), id = questionId(question);
      saved.completed = [...new Set([...saved.completed, id])];
      if (saved.currentQuestion === id) saved.currentQuestion = null;
      state.levels[file] = saved;
      return write(state);
    },
    resetLevel(file) {
      const state = read(), saved = level(state, file);
      saved.completed = [];
      saved.currentQuestion = null;
      state.levels[file] = saved;
      state.lastActivity = file;
      write(state);
    },
  };
  read();
})();
