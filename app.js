import {installPdf} from './pdf.js';
import {installSeating} from './stage2.js';
import {roomSize,numbered,pasted,csv,validateRoster} from './core.js';
const $=id=>document.getElementById(id);let rows=6,cols=6,disabled=new Set,teacher=false,draft=[],students=[],serial=0,csvJob=0;
let stage = null;
const id=(r,c)=>`R${r}C${c}`;const capacity=()=>rows*cols-disabled.size;const message=t=>{$('message').textContent=t;};const action=f=>{try{f();}catch(e){message(e.message);}};
function update(){ $('total').textContent=rows*cols;$('available').textContent=capacity();$('count').textContent=students.length;const errors=validateRoster(students,capacity());$('status').textContent=errors.length?errors.join(' / '):`준비되었습니다. 학생 ${students.length}명, 빈자리 ${capacity()-students.length}석입니다.`;$('roster').textContent=students.map((s,i)=>`${s.number?`${s.number} · `:''}${s.name}${!s.number?` [구분 ${i+1}]`:''}`).join(' / ');}
function draw(){const focused=document.activeElement?.dataset?.seat;const grid=$('grid');grid.replaceChildren();grid.style.gridTemplateColumns=`repeat(${cols}, minmax(57px, 1fr))`;$('direction').textContent=teacher?'교사 기준 · 화면 위가 교실 뒤쪽, 화면 아래가 칠판입니다.':'학생 기준 · 화면 위가 칠판, 화면 왼쪽이 1열입니다.';$('view').textContent=teacher?'학생 기준으로 보기':'교사 기준으로 보기';$('front').style.order=teacher?'2':'';const wrap=$('grid').parentElement;wrap.parentElement.insertBefore($('front'),teacher?wrap.nextSibling:wrap);for(let vr=1;vr<=rows;vr++)for(let vc=1;vc<=cols;vc++){const r=teacher?rows-vr+1:vr,c=teacher?cols-vc+1:vc,key=id(r,c);const b=document.createElement('button');b.type='button';b.className=`seat${disabled.has(key)?' off':''}`;b.dataset.seat=key;b.setAttribute('aria-label',`${r}행 ${c}열 ${disabled.has(key)?'제외':'사용'}`);b.setAttribute('aria-pressed',String(disabled.has(key)));b.textContent=disabled.has(key)?'× 제외':`${r}행 ${c}열`;const small=document.createElement('small');small.textContent=key;b.append(small);b.onclick=()=>{message('');stage?.invalidate();disabled.has(key)?disabled.delete(key):disabled.add(key);draw();};grid.append(b);}update();stage?.decorate();if(focused)document.querySelector(`[data-seat="${focused}"]`)?.focus({preventScroll:true});}
$('roomForm').onsubmit=e=>{e.preventDefault();action(()=>{const r=Number($('rows').value),c=Number($('cols').value);roomSize(r,c);const valid=new Set(Array.from({length:r*c},(_,i)=>id(Math.floor(i/c)+1,i%c+1)));stage?.invalidate();rows=r;cols=c;disabled=new Set([...disabled].filter(k=>valid.has(k)));message('교실을 적용했습니다.');draw();});};
$('view').onclick=()=>{teacher=!teacher;draw();};
function preview(data){if(data.length>120)throw Error('명단은 최대 120명입니다.');draft=data.map(s=>({...s}));$('draftRows').replaceChildren();draft.forEach((s,i)=>{const tr=document.createElement('tr');const cell=document.createElement('td');cell.textContent=i+1;tr.append(cell);for(const field of ['number','name']){const td=document.createElement('td'),input=document.createElement('input');input.value=s[field];input.setAttribute('aria-label',`${i+1}번째 ${field==='number'?'학번':'이름'}`);input.oninput=()=>{draft[i][field]=input.value.trim();};td.append(input);tr.append(td);}$('draftRows').append(tr);});$('draft').hidden=false;$('draftCount').textContent=`${draft.length}명`;message('미리보기입니다. 확인·수정한 뒤 명단을 확정하세요.');}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{for(const tab of document.querySelectorAll('[data-tab]')){const active=tab===b;tab.setAttribute('aria-pressed',String(active));$(tab.dataset.tab+'Panel').hidden=!active;}csvJob++;};
$('generate').onclick=()=>action(()=>preview(numbered($('start').value.trim(),$('end').value.trim(),$('exclusions').value)));$('parseText').onclick=()=>action(()=>preview(pasted($('names').value)));
$('readCsv').onclick=async()=>{const job=++csvJob;try{const f=$('csvFile').files[0];if(!f)throw Error('CSV 파일을 선택하세요.');if(f.size>1024*1024)throw Error('CSV 파일은 1MB 이하여야 합니다.');const enc=$('encoding').value;const buffer=await f.arrayBuffer();if(job!==csvJob)return;const text=new TextDecoder(enc,{fatal:true}).decode(buffer);preview(csv(text));}catch(e){message(e instanceof TypeError?'문자 인코딩 오류입니다. 인코딩을 바꾸고 다시 읽으세요.':e.message);}};
$('confirm').onclick=()=>{const errors=validateRoster(draft,capacity());if(errors.length){message(errors.join('\n'));return;}stage?.invalidate();students=draft.map(s=>({...s,id:`student-${++serial}`}));draw();message('학생 명단을 확정했습니다.');};$('validate').onclick=()=>{const errors=validateRoster(students,capacity());message(errors.length?errors.join('\n'):'기본 검증을 통과했습니다. 자리 배치 시작 버튼을 누르세요.');};draw();
stage = installSeating({students:()=>students, draw, message, cancelCsv:()=>csvJob++, room:()=>({rows,cols,teacher,disabled:[...disabled]})});

installPdf({snapshot:stage.snapshot, refresh:stage.refresh, message});

// Navigate according to the visual order, including the teacher's rotated view.
$('grid').addEventListener('keydown', event => {
  const current = event.target.closest('.seat');
  if (!current) return;
  const buttons = [...$('grid').querySelectorAll('.seat')];
  const index = buttons.indexOf(current);
  let next = index, step = 1;
  if (event.key === 'ArrowRight') { next++; step = 1; }
  else if (event.key === 'ArrowLeft') { next--; step = -1; }
  else if (event.key === 'ArrowDown') { next += cols; step = cols; }
  else if (event.key === 'ArrowUp') { next -= cols; step = -cols; }
  else if (event.key === 'Home') next = event.ctrlKey ? 0 : Math.floor(index / cols) * cols;
  else if (event.key === 'End') { next = event.ctrlKey ? buttons.length - 1 : Math.min(buttons.length - 1, Math.floor(index / cols) * cols + cols - 1); step = -1; }
  else return;
  event.preventDefault();
  while (next >= 0 && next < buttons.length && buttons[next].disabled) next += step;
  if (buttons[next]) { buttons[next].focus(); buttons[next].scrollIntoView({block:'nearest', inline:'nearest'}); }
});
