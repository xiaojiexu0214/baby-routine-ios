const colors = {
  feed:  { bg: 'rgba(238, 211, 183, 0.72)', border: '#AB7543', text: '#5A4232' },
  sleep: { bg: 'rgba(168, 199, 214, 0.72)', border: '#4B7A90', text: '#1F3945' },
  play:  { bg: 'rgba(189, 210, 153, 0.78)', border: '#5E7F19', text: '#2E4410' },
  soothe:{ bg: 'rgba(212, 168, 214, 0.72)', border: '#8F4B90', text: '#4C2A4C' }
};

const HOUR_HEIGHT = 90;
const DAY_HEIGHT = HOUR_HEIGHT * 24;

let events = [
  { type: 'feed', start: '2026-03-10T01:20', end: '2026-03-10T01:40', amount: 120 },
  { type: 'sleep', start: '2026-03-10T01:45', end: '2026-03-10T04:20' },
  { type: 'feed', start: '2026-03-10T05:30', end: '2026-03-10T05:55', amount: 100 },
  { type: 'sleep', start: '2026-03-10T06:00', end: '2026-03-10T08:10' }
];

let sootheLogs = [
  { at: new Date().toISOString().slice(0,16), duration: 18, note: '轻拍入睡' }
];

const tabs = document.querySelectorAll('.tabs button');
const panes = {
  today: document.getElementById('tab-today'),
  add: document.getElementById('tab-add'),
  history: document.getElementById('tab-history'),
  soothe: document.getElementById('tab-soothe'),
  settings: document.getElementById('tab-settings')
};
const titleEl = document.getElementById('title');

function switchTab(tab) {
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  Object.entries(panes).forEach(([k,v]) => v.classList.toggle('active', k === tab));
  titleEl.textContent = ({today:'今天',add:'记录',history:'历史',soothe:'哄睡',settings:'设置'})[tab] || '今天';
}
tabs.forEach(b => b.onclick = () => switchTab(b.dataset.tab));

function mins(dateStr){ const d = new Date(dateStr); return d.getHours()*60 + d.getMinutes(); }
function fmtDur(min){ const h=Math.floor(min/60),m=min%60; return `${h}小时${m}分钟`; }
function fmtTime(dateStr){ const d = new Date(dateStr); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

function sameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function dayBounds(date = new Date()){
  const start = new Date(date); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate()+1);
  return { start, end };
}

function overlaps(a,b){ return a.startMin < b.endMin && b.startMin < a.endMin; }

// 自动补齐“玩耍”：当天中，除了吃奶/睡眠的空白段都视为玩耍
function derivedTodayTimeline(){
  const { start } = dayBounds(new Date());
  const dayKey = start.toISOString().slice(0,10);

  const base = events
    .filter(e => ['feed','sleep'].includes(e.type) && e.start.startsWith(dayKey))
    .map(e => ({ ...e, startMin: mins(e.start), endMin: Math.max(mins(e.end), mins(e.start)+5) }))
    .sort((a,b)=>a.startMin-b.startMin);

  const merged = [];
  base.forEach(e => {
    if (!merged.length || e.startMin > merged[merged.length-1].endMin) merged.push({ ...e });
    else merged[merged.length-1].endMin = Math.max(merged[merged.length-1].endMin, e.endMin);
  });

  const play = [];
  let cursor = 0;
  merged.forEach(m => {
    if (m.startMin > cursor) play.push({ type:'play', startMin: cursor, endMin: m.startMin });
    cursor = Math.max(cursor, m.endMin);
  });
  if (cursor < 24*60) play.push({ type:'play', startMin: cursor, endMin: 24*60 });

  const toDateStr = (min) => {
    const d = new Date(start.getTime() + min * 60000);
    return d.toISOString().slice(0,16);
  };

  const normalizedBase = base.map(e => ({ ...e, end: toDateStr(e.endMin) }));
  const normalizedPlay = play.filter(p => (p.endMin-p.startMin)>=10).map(p => ({
    ...p,
    start: toDateStr(p.startMin),
    end: toDateStr(p.endMin)
  }));

  return [...normalizedPlay, ...normalizedBase].sort((a,b)=>a.startMin-b.startMin);
}

function calcStats(){
  const timeline = derivedTodayTimeline();
  let feedML = 0, sleep = 0, play = 0, feedCount = 0, sleepCount = 0;

  for(const e of timeline){
    const dur = Math.max(0, e.endMin - e.startMin);
    if(e.type==='feed'){
      const src = events.find(x => x.start === e.start && x.type==='feed');
      feedML += Number(src?.amount || 0);
      feedCount++;
    }
    if(e.type==='sleep'){ sleep += dur; sleepCount++; }
    if(e.type==='play'){ play += dur; }
  }

  const avgSoothe = sootheLogs.length
    ? Math.round(sootheLogs.reduce((a,b)=>a+(Number(b.duration)||0),0)/sootheLogs.length)
    : 0;

  return { feedML, sleep, play, feedCount, sleepCount, avgSoothe };
}

function renderTimeline(){
  const root = document.getElementById('timeline');
  root.innerHTML = '';
  root.style.height = `${DAY_HEIGHT}px`;

  for(let h=0; h<24; h++){
    const mark = document.createElement('div');
    mark.className = 'hour-mark';
    mark.style.top = `${h * HOUR_HEIGHT}px`;
    mark.textContent = `${String(h).padStart(2,'0')}:00`;
    root.appendChild(mark);
  }

  const timeline = derivedTodayTimeline();
  timeline.forEach((e, i) => {
    const top = e.startMin / (24*60) * DAY_HEIGHT;
    const height = Math.max(20, (e.endMin - e.startMin)/(24*60)*DAY_HEIGHT);
    const left = 54;
    const width = Math.max(120, root.clientWidth - left - 8);

    const div = document.createElement('div');
    div.className = 'event';
    const tone = colors[e.type] || { bg:'rgba(220,220,220,.7)', border:'#999', text:'#222' };
    div.style.top = `${top}px`;
    div.style.left = `${left}px`;
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.zIndex = String(100+i);
    div.style.background = tone.bg;
    div.style.borderColor = tone.border;
    div.style.color = tone.text;

    const extra = e.type==='feed'
      ? (() => {
          const src = events.find(x => x.start === e.start && x.type==='feed');
          return src?.amount ? ` ${src.amount}ml` : '';
        })()
      : '';

    const t = { feed:'吃奶', sleep:'睡眠', play:'玩耍' }[e.type] || e.type;
    div.textContent = `${fmtTime(e.start)}-${fmtTime(e.end)} ${t}${extra}`;
    root.appendChild(div);
  });
}

function renderStats(){
  const s = calcStats();
  document.getElementById('stats').innerHTML = `
    <li>总奶量：${s.feedML} ml</li>
    <li>总睡眠：${fmtDur(s.sleep)}</li>
    <li>总玩耍：${fmtDur(s.play)}</li>
    <li>吃奶次数：${s.feedCount}</li>
    <li>睡眠次数：${s.sleepCount}</li>
    <li>平均哄睡：${fmtDur(s.avgSoothe)}</li>
  `;
}

function renderHistory(){
  const list = document.getElementById('history');
  const s = calcStats();
  list.innerHTML = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    return `<li><b>${d.toLocaleDateString('zh-CN')}</b><br/>奶量 ${Math.max(0,s.feedML - i*20)}ml · 睡眠 ${Math.max(0,Math.round(s.sleep/60)-i)}h · 玩耍 ${Math.max(0,Math.round(s.play/60)-i)}h</li>`;
  }).join('');
}

function renderSoothe(){
  const ul = document.getElementById('sootheList');
  ul.innerHTML = sootheLogs.slice().reverse().map(x => `
    <li><b>${x.at.replace('T',' ')}</b><br/>时长 ${x.duration} 分钟${x.note ? ` · ${x.note}` : ''}</li>
  `).join('') || '<li>还没有哄睡记录</li>';
}

function rerender(){
  renderTimeline();
  renderStats();
  renderHistory();
  renderSoothe();

  const wrap = document.querySelector('.timeline-wrap');
  if (wrap && !wrap.dataset.scrolled) {
    const hour = new Date().getHours();
    wrap.scrollTop = Math.max(0, hour * HOUR_HEIGHT - 120);
    wrap.dataset.scrolled = '1';
  }
}

const now = new Date();
const start = new Date(now.getTime()-30*60000);
document.getElementById('start').value = start.toISOString().slice(0,16);
document.getElementById('end').value = now.toISOString().slice(0,16);

const typeEl = document.getElementById('type');
const amountWrap = document.getElementById('amountWrap');
typeEl.onchange = () => amountWrap.style.display = typeEl.value === 'feed' ? 'grid' : 'none';

document.getElementById('eventForm').onsubmit = (e) => {
  e.preventDefault();
  const typeRaw = typeEl.value;
  const mappedType = typeRaw === 'awake' ? 'play' : typeRaw;

  events.push({
    type: mappedType,
    start: document.getElementById('start').value,
    end: document.getElementById('end').value,
    amount: document.getElementById('amount').value,
    note: document.getElementById('note').value
  });
  rerender();
  switchTab('today');
};

// 记录按钮：一键创建记录
function quickCreate(type){
  const end = new Date();
  const durationMin = type === 'feed' ? 20 : 45;
  const st = new Date(end.getTime() - durationMin * 60000);
  events.push({
    type,
    start: st.toISOString().slice(0,16),
    end: end.toISOString().slice(0,16),
    amount: type==='feed' ? 100 : undefined
  });
  rerender();
}

document.querySelectorAll('.quick button').forEach(btn => {
  btn.onclick = () => {
    const t = btn.dataset.type;
    const mapped = t === 'awake' ? 'play' : t;
    quickCreate(mapped);
  };
});

document.getElementById('mockBtn').onclick = () => {
  sootheLogs.push({ at: new Date().toISOString().slice(0,16), duration: 15, note: '模拟哄睡' });
  rerender();
};

document.getElementById('feedLead').oninput = e => document.getElementById('feedLeadText').textContent = e.target.value;
document.getElementById('awakeLead').oninput = e => document.getElementById('awakeLeadText').textContent = e.target.value;

const sootheForm = document.getElementById('sootheForm');
if (sootheForm) {
  document.getElementById('sootheAt').value = new Date().toISOString().slice(0,16);
  sootheForm.onsubmit = (e) => {
    e.preventDefault();
    sootheLogs.push({
      at: document.getElementById('sootheAt').value,
      duration: Number(document.getElementById('sootheDuration').value || 0),
      note: document.getElementById('sootheNote').value
    });
    rerender();
    switchTab('soothe');
  };
}

window.addEventListener('resize', renderTimeline);
rerender();