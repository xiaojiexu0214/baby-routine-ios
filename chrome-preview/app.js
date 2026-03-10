const colors = {
  // 莫兰迪 + 透明度（可叠加看层次）
  feed: 'rgba(196, 146, 118, 0.62)',
  sleep: 'rgba(106, 124, 147, 0.64)',
  awake: 'rgba(76, 108, 98, 0.78)',
  soothe: 'rgba(146, 128, 156, 0.62)'
};
const titles = { feed: '吃奶', sleep: '睡眠', awake: '清醒', soothe: '哄睡' };

let events = [
  { type: 'feed', start: '2026-03-10T01:20', end: '2026-03-10T01:40', amount: 120 },
  { type: 'sleep', start: '2026-03-10T01:45', end: '2026-03-10T04:20' },
  { type: 'awake', start: '2026-03-10T04:20', end: '2026-03-10T05:10' },
  { type: 'soothe', start: '2026-03-10T05:10', end: '2026-03-10T05:30' },
  { type: 'feed', start: '2026-03-10T05:30', end: '2026-03-10T05:55', amount: 100 },
  { type: 'sleep', start: '2026-03-10T06:00', end: '2026-03-10T08:10' }
];

const HOUR_HEIGHT = 90;
const DAY_HEIGHT = HOUR_HEIGHT * 24;

const tabs = document.querySelectorAll('.tabs button');
const panes = {
  today: document.getElementById('tab-today'),
  add: document.getElementById('tab-add'),
  history: document.getElementById('tab-history'),
  settings: document.getElementById('tab-settings')
};
const titleEl = document.getElementById('title');

function switchTab(tab) {
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  Object.entries(panes).forEach(([k,v]) => v.classList.toggle('active', k === tab));
  titleEl.textContent = ({today:'今天',add:'记录',history:'历史',settings:'设置'})[tab];
}

tabs.forEach(b => b.onclick = () => switchTab(b.dataset.tab));

function mins(dateStr){
  const d = new Date(dateStr);
  return d.getHours()*60 + d.getMinutes();
}

function fmtDur(min){
  const h = Math.floor(min/60), m = min%60;
  return `${h}小时${m}分钟`;
}

function calcStats(){
  let feedML = 0, sleep = 0, awake = 0, soothe = 0, feedCount = 0, sleepCount = 0;
  for(const e of events){
    const dur = Math.max(0, mins(e.end)-mins(e.start));
    if(e.type==='feed'){ feedML += Number(e.amount||0); feedCount++; }
    if(e.type==='sleep'){ sleep += dur; sleepCount++; }
    if(e.type==='awake') awake += dur;
    if(e.type==='soothe') soothe += dur;
  }
  return { feedML, sleep, awake, feedCount, sleepCount, avgSoothe: events.filter(e=>e.type==='soothe').length ? Math.round(soothe/events.filter(e=>e.type==='soothe').length) : 0 };
}

function fmtTime(dateStr){
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function renderTimeline(){
  const root = document.getElementById('timeline');
  root.innerHTML = '';

  root.style.height = `${DAY_HEIGHT}px`;

  // 小时刻度
  for(let h = 0; h < 24; h++){
    const mark = document.createElement('div');
    mark.className = 'hour-mark';
    mark.style.top = `${h * HOUR_HEIGHT}px`;
    mark.textContent = `${String(h).padStart(2,'0')}:00`;
    root.appendChild(mark);
  }

  const zBase = { awake: 1, sleep: 2, soothe: 3, feed: 4 };
  const typeOffset = { awake: 0, sleep: 8, soothe: 16, feed: 24 };

  const items = events
    .map(e => ({ ...e, startMin: mins(e.start), endMin: Math.max(mins(e.end), mins(e.start) + 5) }))
    .sort((a,b) => a.startMin - b.startMin || a.endMin - b.endMin);

  items.forEach((e, i) => {
    const top = e.startMin / (24*60) * DAY_HEIGHT;
    const height = Math.max(20, (e.endMin - e.startMin)/(24*60)*DAY_HEIGHT);
    const left = 54 + typeOffset[e.type];
    const width = Math.max(120, root.clientWidth - left - 10);

    const div = document.createElement('div');
    div.className = 'event';
    div.style.top = `${top}px`;
    div.style.left = `${left}px`;
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.zIndex = String((zBase[e.type] || 1) * 100 + i);
    div.style.background = colors[e.type];
    div.textContent = `${fmtTime(e.start)}-${fmtTime(e.end)}  ${titles[e.type]}${e.type==='feed'&&e.amount?` ${e.amount}ml`:''}`;
    root.appendChild(div);
  });
}

function renderStats(){
  const s = calcStats();
  document.getElementById('stats').innerHTML = `
    <li>总奶量：${s.feedML} ml</li>
    <li>总睡眠：${fmtDur(s.sleep)}</li>
    <li>总清醒：${fmtDur(s.awake)}</li>
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
    return `<li><b>${d.toLocaleDateString('zh-CN')}</b><br/>奶量 ${Math.max(0,s.feedML - i*20)}ml · 睡眠 ${Math.max(0,Math.round(s.sleep/60)-i)}h</li>`;
  }).join('');
}

function rerender(){
  renderTimeline();
  renderStats();
  renderHistory();
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
  events.push({
    type: typeEl.value,
    start: document.getElementById('start').value,
    end: document.getElementById('end').value,
    amount: document.getElementById('amount').value,
    note: document.getElementById('note').value
  });
  rerender();
  switchTab('today');
};

document.querySelectorAll('.quick button').forEach(btn => {
  btn.onclick = () => {
    const t = btn.dataset.type;
    const end = new Date();
    const st = new Date(end.getTime()-30*60000);
    events.push({ type: t, start: st.toISOString().slice(0,16), end: end.toISOString().slice(0,16), amount: t==='feed'?100:undefined });
    rerender();
  };
});

document.getElementById('mockBtn').onclick = () => {
  const end = new Date();
  const st = new Date(end.getTime()-40*60000);
  events.push({ type: 'sleep', start: st.toISOString().slice(0,16), end: end.toISOString().slice(0,16) });
  rerender();
};

document.getElementById('feedLead').oninput = e => document.getElementById('feedLeadText').textContent = e.target.value;
document.getElementById('awakeLead').oninput = e => document.getElementById('awakeLeadText').textContent = e.target.value;
window.addEventListener('resize', renderTimeline);

rerender();
