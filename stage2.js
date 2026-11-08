import {validateRoster} from './core.js';

// Stage 2 stores only the current page's result and edit history.
export function installSeating(api) {
  const $ = id => document.getElementById(id);
  let result = null, past = [], future = [], selected = null;
  let revealed = new Set(), hidden = false, running = false, generation = 0;
  let timer = null, audio = null, gain = null, blockedControls = [];
  const label = student => `${student.number ? student.number + ' · ' : ''}${student.name}${!student.number ? ` [구분 ${api.students().indexOf(student) + 1}]` : ''}`;
  const seats = () => [...document.querySelectorAll('.seat')].filter(b => !b.classList.contains('off')).map(b => b.dataset.seat);
  function stopSound() {
    if (audio) { const old = audio; audio = null; gain = null; old.close().catch(() => {}); }
  }
  function volume() {
    if (gain && audio) gain.gain.setValueAtTime($('mute').checked ? 0 : Number($('volume').value) * .12, audio.currentTime);
  }
  function music() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      audio = new Context();
      const current = audio;
      gain = audio.createGain(); gain.connect(audio.destination); volume();
      audio.resume().then(() => { if (audio === current && current.state !== 'running') api.message('음악을 재생할 수 없어 무음으로 진행합니다.'); }).catch(() => { if (audio === current) { stopSound(); api.message('음악을 재생할 수 없어 무음으로 진행합니다.'); } });
      // An original accelerating arpeggio, synthesized locally with Web Audio.
      let t = audio.currentTime;
      for (let i = 0; i < 26; i++) {
        const step = .26 - i * .0045;
        if (t - audio.currentTime >= 4.9) break;
        const osc = audio.createOscillator(), envelope = audio.createGain();
        osc.type = 'triangle'; osc.frequency.value = [220, 261.63, 329.63, 440][i % 4] * (i > 15 ? 2 : 1);
        envelope.gain.setValueAtTime(0, t); envelope.gain.linearRampToValueAtTime(.4, t + .015); envelope.gain.exponentialRampToValueAtTime(.001, t + step * .85);
        osc.connect(envelope); envelope.connect(gain); osc.start(t); osc.stop(t + step); t += step;
      }
    } catch { stopSound(); api.message('음악을 지원하지 않아 무음으로 진행합니다.'); }
  }
  function lock(value) {
    document.querySelector('aside').inert = value;
    document.body.classList.toggle('seatingRunning', value);
    if (value) {
      blockedControls = [...document.querySelectorAll('aside input, aside button, aside select, aside textarea, #validate, #view, #large, #fullscreen, #revealMode')].map(b => [b, b.disabled]);
      blockedControls.forEach(([b]) => b.disabled = true);
    } else { blockedControls.forEach(([b, old]) => b.disabled = old); blockedControls = []; }
    $('grid').hidden = value;
    $('startSeating').disabled = value; $('cancelSeating').hidden = !value; $('countdown').hidden = !value;
  }
  function controls() {
    for (const key of ['revealAll', 'hideResult', 'editRoom', 'downloadPdf']) $(key).disabled = !result || running;
    $('undo').disabled = !past.length || running; $('redo').disabled = !future.length || running;
    $('hideResult').textContent = hidden ? '결과 다시 보기' : '결과 숨기기';
  }
  function invalidate() {
    if (running) return;
    result = null; past = []; future = []; selected = null; revealed.clear(); hidden = false;
    controls();
  }
  function valid(candidate) {
    const available = new Set(seats()), ids = Object.values(candidate).filter(Boolean);
    return Object.keys(candidate).every(k => available.has(k)) && ids.length === api.students().length && new Set(ids).size === ids.length && api.students().every(s => ids.includes(s.id));
  }
  function exchange(from, to) {
    if (!result || from === to || !seats().includes(from) || !seats().includes(to)) return;
    const next = {...result, [from]: result[to] || null, [to]: result[from] || null};
    if (!valid(next)) { api.message('유효하지 않은 교환입니다.'); return; }
    past.push({...result}); future = []; result = next; selected = null;
    api.message('두 좌석을 교환했습니다.'); api.draw();
  }
  function decorate() {
    if (!result || running) { controls(); return; }
    for (const b of document.querySelectorAll('.seat')) {
      if (b.classList.contains('off')) { b.disabled = true; continue; }
      const key = b.dataset.seat, student = api.students().find(s => s.id === result[key]);
      const visible = !hidden && revealed.has(key);
      b.replaceChildren();
      const name = document.createElement('span'); name.className = 'studentName';
      name.textContent = visible ? (student ? label(student) : '빈자리') : '공개하기';
      const small = document.createElement('small'); small.textContent = key;
      b.append(name, small); b.setAttribute('aria-label', `${key} ${name.textContent}`);
      b.setAttribute('aria-pressed', String(selected === key)); b.classList.toggle('selected', selected === key);
      b.onclick = () => {
        if (hidden) { api.message('결과 다시 보기를 누른 뒤 좌석을 공개하거나 교환하세요.'); return; }
        if (!revealed.has(key)) { revealed.add(key); api.draw(); return; }
        if (selected === key) selected = null;
        else if (selected) { exchange(selected, key); return; }
        else selected = key;
        api.draw();
        document.querySelector(`[data-seat="${key}"]`)?.focus();
      };
      b.draggable = visible && !hidden;
      b.ondragstart = e => { if (!b.draggable) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', key); };
      b.ondragover = e => { if (visible && !hidden) e.preventDefault(); };
      b.ondrop = e => { e.preventDefault(); if (visible && !hidden) exchange(e.dataTransfer.getData('text/plain'), key); };
    }
    controls();
  }
  function cleanup() { clearInterval(timer); timer = null; stopSound(); running = false; lock(false); controls(); }
  function cancel() { if (!running) return; generation++; cleanup(); api.message('배치를 취소했습니다. 이전 결과가 있으면 유지됩니다.'); api.draw(); }
  $('startSeating').onclick = () => {
    if (running) return;
    const errors = validateRoster(api.students(), seats().length);
    if (errors.length) { api.message(errors.join('\n')); return; }
    const job = ++generation; running = true; selected = null; api.cancelCsv(); lock(true); controls();
    api.message(''); const start = performance.now(); $('countdownNumber').textContent = '5'; music();
    let candidate;
    try {
      const keys = seats();
      for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
      candidate = Object.fromEntries(keys.map((key, i) => [key, api.students()[i]?.id || null]));
      if (!valid(candidate)) throw Error('배치 결과 검증에 실패했습니다.');
    } catch (e) { cleanup(); api.message(e.message); api.draw(); return; }
    timer = setInterval(() => {
      if (job !== generation) return;
      const elapsed = performance.now() - start;
      $('countdownNumber').textContent = String(Math.max(1, 5 - Math.floor(elapsed / 1000)));
      if (elapsed < 5000) return;
      cleanup(); result = candidate; past = []; future = []; hidden = false;
      revealed = $('revealMode').value === 'all' ? new Set(Object.keys(result)) : new Set();
      api.message('자리를 배치했습니다. 공개된 두 좌석을 차례로 누르거나 드래그해 교환하세요.'); api.draw();
    }, 50);
  };
  $('cancelSeating').onclick = cancel;
  $('mute').onchange = volume; $('volume').oninput = volume;
  $('revealAll').onclick = () => { hidden = false; revealed = new Set(Object.keys(result || {})); api.draw(); };
  $('hideResult').onclick = () => { hidden = !hidden; selected = null; api.draw(); };
  $('editRoom').onclick = () => { invalidate(); api.message('교실 편집 모드입니다. 기존 배치와 실행 취소 기록을 초기화했습니다.'); api.draw(); };
  $('undo').onclick = () => { if (!past.length) return; future.push({...result}); result = past.pop(); selected = null; api.draw(); };
  $('redo').onclick = () => { if (!future.length) return; past.push({...result}); result = future.pop(); selected = null; api.draw(); };
  $('large').onclick = () => document.querySelector('.classroom').classList.toggle('large');
  $('fullscreen').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.classroom').requestFullscreen(); }
    catch { api.message('이 브라우저는 전체화면을 지원하지 않습니다. 큰 글씨 보기를 이용하세요.'); }
  };
  window.addEventListener('pagehide', () => { generation++; if (running) cleanup(); else stopSound(); });
  controls();
  return {decorate, invalidate, refresh: controls, snapshot: () => (!running && result && valid(result) ? {result: {...result}, students: api.students().map(s=>({...s})), ...api.room()} : null), running: () => running};
}
