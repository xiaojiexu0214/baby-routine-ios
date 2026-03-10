const colors = {
  feed:  { bg: 'rgba(238, 211, 183, 0.32)', border: '#AB7543', text: '#F7EAD6' },
  sleep: { bg: 'rgba(168, 199, 214, 0.28)', border: '#4B7A90', text: '#DFF1FA' },
  play:  { bg: 'rgba(189, 210, 153, 0.30)', border: '#5E7F19', text: '#E8F7CB' },
  urine: { bg: 'rgba(166, 224, 221, 0.26)', border: '#5AA9A0', text: '#DDFCF7' },
  poop:  { bg: 'rgba(212, 168, 214, 0.30)', border: '#8F4B90', text: '#F4DDF5' }
};

const HOUR_HEIGHT = 70;
const DAY_HEIGHT = HOUR_HEIGHT * 24;
const AGE_DAYS = 96;

let events = [
  { type: 'feed', start: '2026-03-10T11:55', end: '2026-03-10T12:15', amount: 150 },
  { type: 'sleep', start: '2026-03-10T12:55', end: '2026-03-10T13:55' },
  { type: 'sleep', start: '2026-03-10T14:10', end: '2026-03-10T15:20' }
];
let pointLogs = [
  { type: 'urine', at: '2026-03-10T12:55', note: '尿尿' },
  { type: 'poop', at: '2026-03-10T15:00', note: '臭臭' }
];
let sootheLogs = [];

const tabs = document.querySelectorAll('.tabs button');
const panes = { today: q('tab-today'), add: q('tab-add'), history: q('tab-history'), soothe: q('tab-soothe'), settings: q('tab-settings') };

tabs.forEach(b => b.onclick = () => {
  const tab = b.dataset.tab;
  tabs.forEach(x => x.classList.toggle('active', x === b));
  Object.entries(panes).forEach(([k,v]) => v.classList.toggle('active', k===tab));
});

function q(id){ return document.getElementById(id); }
function fmtTime(dateStr){ const d = new Date(dateStr); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function mins(dateStr){ const d = new Date(dateStr); return d.getHours()*60 + d.getMinutes(); }
function fmtDur(min){ const h=Math.floor(min/60), m=min%60; return `${h}小时${m}分钟`; }

function updateTitle(){
  const d = new Date();
  const w = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
  q('title').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${w} · 出生第${AGE_DAYS}天`;
}

function derivedTodayTimeline(){
  const day = new Date(); day.setHours(0,0,0,0);
  const dayKey = day.toISOString().slice(0,10);
  const base = events.filter(e => ['feed','sleep'].includes(e.type) && e.start.startsWith(dayKey))
    .map(e => ({ ...e, startMin: mins(e.start), endMin: Math.max(mins(e.end), mins(e.start)+5) }))
    .sort((a,b)=>a.startMin-b.startMin);

  const merged = [];
  base.forEach(e => {
    if (!merged.length || e.startMin > merged[merged.length-1].endMin) merged.push({...e});
    else merged[merged.length-1].endMin = Math.max(merged[merged.length-1].endMin, e.endMin);
  });

  const play = [];
  let cursor = 0;
  merged.forEach(m => { if (m.startMin > cursor) play.push({ type:'play', startMin: cursor, endMin: m.startMin }); cursor = Math.max(cursor,m.endMin); });
  if (cursor < 1440) play.push({ type:'play', startMin: cursor, endMin: 1440 });

  const toAt = min => new Date(day.getTime() + min*60000).toISOString().slice(0,16);
  const baseN = base.map(e => ({...e, start: toAt(e.startMin), end: toAt(e.endMin)}));
  const playN = play.filter(p => p.endMin-p.startMin >= 10).map(p => ({...p, start: toAt(p.startMin), end: toAt(p.endMin)}));
  return [...baseN, ...playN].sort((a,b)=>a.startMin-b.startMin);
}

function buildRows(){
  const rows = [];
  const timeline = derivedTodayTimeline();
  timeline.forEach(e => {
    if (e.type==='feed') {
      const src = events.find(x=>x.start===e.start && x.type==='feed');
      rows.push({type:'feed', time:e.start, icon:'🍼', text:`${src?.amount||''}ml`.trim() || '吃奶'});
    }
    if (e.type==='sleep') rows.push({type:'sleep', time:e.start, icon:'💤', text:'开始睡觉'});
    if (e.type==='play') rows.push({type:'play', time:e.start, icon:'🥳', text:'起床玩耍'});
  });
  pointLogs.forEach(p => rows.push({type:p.type, time:p.at, icon:p.type==='urine'?'💧':'💩', text:p.note || (p.type==='urine'?'尿尿':'臭臭')}));
  return rows.sort((a,b)=>new Date(a.time)-new Date(b.time));
}

function renderTimeline(){
  const root = q('timeline');
  root.innerHTML = '';
  root.style.height = `${DAY_HEIGHT}px`;

  for(let h=0; h<24; h++){
    const mark = document.createElement('div');
    mark.className = 'hour-mark';
    mark.style.top = `${h*HOUR_HEIGHT}px`;
    mark.textContent = `${String(h).padStart(2,'0')}`;
    root.appendChild(mark);
  }

  buildRows().forEach((r, i) => {
    const y = mins(r.time) / 1440 * DAY_HEIGHT;
    const row = document.createElement('div');
    const tone = colors[r.type] || {bg:'rgba(255,255,255,.12)', border:'#888', text:'#fff'};
    row.className = 'timeline-row';
    row.style.top = `${y}px`;
    row.style.background = tone.bg;
    row.style.borderColor = tone.border;
    row.style.zIndex = String(110+i);
    row.innerHTML = `<span class="tm">${fmtTime(r.time)}</span><span class="ic">${r.icon}</span><span class="tx">${r.text}</span>`;
    root.appendChild(row);
  });
}

function calcStats(){
  const tl = derivedTodayTimeline();
  let feedCount=0, feedML=0, sleepCount=0, sleep=0, play=0;
  tl.forEach(e => {
    const dur = e.endMin - e.startMin;
    if (e.type==='feed') { feedCount++; const src = events.find(x=>x.start===e.start&&x.type==='feed'); feedML += Number(src?.amount||0); }
    if (e.type==='sleep') { sleepCount++; sleep += dur; }
    if (e.type==='play') play += dur;
  });
  const urine = pointLogs.filter(x=>x.type==='urine').length;
  const poop = pointLogs.filter(x=>x.type==='poop').length;
  return { feedCount, feedML, sleepCount, sleep, play, urine, poop };
}

function renderStats(){
  const s = calcStats();
  q('statsBar').innerHTML = `
    <div class="stats-item">🍼${s.feedCount}顿 ${s.feedML}ml</div>
    <div class="stats-item">💤${s.sleepCount}次 ${fmtDur(s.sleep)}</div>
    <div class="stats-item">🥳${fmtDur(s.play)}</div>
    <div class="stats-item">💧${s.urine}次</div>
    <div class="stats-item">💩${s.poop}次</div>`;
}

function rerender(){
  updateTitle();
  renderStats();
  renderTimeline();
}

// quick dialog
const quickDialog = q('quickDialog');
const quickType = q('quickType');
const quickAt = q('quickAt');
const quickDuration = q('quickDuration');
const quickAmount = q('quickAmount');
const quickDurationWrap = q('quickDurationWrap');
const quickAmountWrap = q('quickAmountWrap');

function openQuick(type){
  const mapTitle = {feed:'记录吃奶',sleep:'记录睡觉',awake:'记录起床玩耍',urine:'记录尿尿',poop:'记录臭臭'};
  q('quickTitle').textContent = mapTitle[type] || '记录';
  quickType.value = type;
  quickAt.value = new Date().toISOString().slice(0,16);
  quickDurationWrap.style.display = ['feed','sleep'].includes(type) ? 'grid' : 'none';
  quickAmountWrap.style.display = type === 'feed' ? 'grid' : 'none';
  quickDuration.value = type === 'sleep' ? 60 : 20;
  quickDialog.showModal();
}

document.querySelectorAll('.quick button').forEach(btn => {
  btn.onclick = () => openQuick(btn.dataset.type);
});

q('quickForm').addEventListener('submit', () => {
  const t = quickType.value;
  const at = quickAt.value;
  const dur = Number(quickDuration.value || 20);
  if (t === 'feed' || t === 'sleep') {
    const st = new Date(at);
    const ed = new Date(st.getTime() + dur*60000);
    events.push({ type: t, start: st.toISOString().slice(0,16), end: ed.toISOString().slice(0,16), amount: t==='feed' ? Number(quickAmount.value||0) : undefined });
  } else if (t === 'awake') {
    pointLogs.push({ type: 'play', at, note: '起床玩耍' });
  } else if (t === 'urine' || t === 'poop') {
    pointLogs.push({ type: t, at, note: t==='urine' ? '尿尿' : '臭臭' });
  }
  rerender();
});

window.addEventListener('resize', renderTimeline);
rerender();
