# 10 WOW-демо как из реального продукта (RU, коротко)

Каждый блок автономный: копируй целиком в отдельный `.html`.

## 1) Экран релиза с живым прогрессом
```html
<div class="ship"><h3>Релиз 2.4.1 <span></span></h3><p id="st">Подготовка артефактов...</p><div class="bar"><i id="p"></i></div><small id="v">0%</small></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#070b16;color:#e6eeff;font:500 15px/1.4 Inter,sans-serif}
.ship{width:340px;padding:20px;border-radius:16px;background:linear-gradient(150deg,#111a2d,#0a1020);box-shadow:0 20px 60px #0008}
h3{margin:0 0 8px;font-size:20px}span{display:inline-block;width:9px;height:9px;border-radius:50%;background:#22d3ee;box-shadow:0 0 0 #22d3ee;animation:p 1.4s infinite}
.bar{height:8px;background:#ffffff15;border-radius:99px;overflow:hidden;margin-top:12px}i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22d3ee,#3b82f6)}small{opacity:.8}
@keyframes p{70%{box-shadow:0 0 0 12px #22d3ee00}}
</style>
<script>
let n=0,txt=['Сборка ассетов...','Прогон тестов...','Деплой в production...','Проверка здоровья...'];const p=document.getElementById('p'),v=document.getElementById('v'),st=document.getElementById('st');
const t=setInterval(()=>{n=Math.min(100,n+8+Math.random()*15);p.style.width=n+'%';v.textContent=(n|0)+'%';st.textContent=txt[(n/30)|0]||'Релиз завершен';if(n>=100)clearInterval(t)},520);
</script>
```

## 2) Тарифный блок с переключателем периода
```html
<div class="price"><label><input id="t" type="checkbox"><b></b> Оплата за год (−20%)</label><h2 id="sum">1 290 ₽</h2><p id="sub">за пользователя / месяц</p><button>Перейти на Pro</button></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#f3f6ff;font:500 15px Inter,sans-serif}
.price{width:330px;padding:22px;border-radius:18px;background:#fff;box-shadow:0 16px 50px #1f3a8a1f}label{display:flex;gap:10px;align-items:center}
input{appearance:none;width:42px;height:24px;border-radius:99px;background:#c7d2fe;position:relative;cursor:pointer}input:before{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.25s}
input:checked{background:#4f46e5}input:checked:before{left:21px}h2{font-size:44px;margin:12px 0 2px}p{margin:0 0 14px;color:#475569}
button{border:0;border-radius:12px;padding:12px 16px;background:#111827;color:#fff;font-weight:700;cursor:pointer}
</style>
<script>
const t=document.getElementById('t'),sum=document.getElementById('sum'),sub=document.getElementById('sub');t.onchange=()=>{sum.textContent=t.checked?'990 ₽':'1 290 ₽';sub.textContent=t.checked?'за пользователя / месяц, при оплате за год':'за пользователя / месяц'};
</script>
```

## 3) Command Palette (Ctrl+K) как в SaaS
```html
<button id="open">Открыть поиск (Ctrl+K)</button><div class="ov" hidden><div class="pal"><input id="q" placeholder="Поиск по проекту..."><ul id="list"><li>Создать задачу</li><li>Перейти в аналитику</li><li>Открыть биллинг</li><li>Настройки команды</li></ul></div></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#0b1020;font:500 15px Inter,sans-serif;color:#dbe7ff}
button{padding:12px 16px;border:0;border-radius:12px;background:#1d4ed8;color:#fff;font-weight:700}
.ov{position:fixed;inset:0;display:grid;place-items:start center;padding-top:12vh;background:#020617b3;backdrop-filter:blur(4px)}
.pal{width:min(560px,92vw);background:#0f172a;border:1px solid #334155;border-radius:14px;overflow:hidden}input{width:100%;padding:14px 16px;border:0;border-bottom:1px solid #334155;background:transparent;color:#fff;outline:0}
ul{margin:0;padding:8px;list-style:none}li{padding:10px 12px;border-radius:10px}li:hover{background:#1e293b}
</style>
<script>
const ov=document.querySelector('.ov'),q=document.getElementById('q'),l=[...document.querySelectorAll('#list li')],openBtn=document.getElementById('open'),show=()=>{ov.hidden=0;q.focus()},hide=()=>ov.hidden=1;
openBtn.onclick=show;addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='k'){e.preventDefault();show()}if(e.key=='Escape')hide()});
q.oninput=()=>l.forEach(i=>i.hidden=!i.textContent.toLowerCase().includes(q.value.toLowerCase()));ov.onclick=e=>e.target===ov&&hide();
</script>
```

## 4) Toast об успешном сохранении с таймером
```html
<button id="save">Сохранить изменения</button><div id="t"></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#f8fafc;font:500 15px Inter,sans-serif}
#save{padding:12px 16px;border:0;border-radius:12px;background:#0f172a;color:#fff;font-weight:700}
#t{position:fixed;right:18px;bottom:18px;display:grid;gap:10px}
.toast{width:300px;padding:12px 14px;border-radius:12px;background:#111827;color:#fff;position:relative;overflow:hidden;box-shadow:0 14px 30px #0003}
.toast i{position:absolute;left:0;bottom:0;height:3px;width:100%;background:#22d3ee;animation:x 4s linear forwards}@keyframes x{to{width:0}}
</style>
<script>
const saveBtn=document.getElementById('save'),toastRoot=document.getElementById('t');
saveBtn.onclick=()=>{const n=document.createElement('div');n.className='toast';n.innerHTML='Изменения опубликованы <i></i>';toastRoot.append(n);setTimeout(()=>n.remove(),4000)};
</script>
```

## 5) Онбординг по шагам (продуктовый)
```html
<div class="on"><h3 id="h"></h3><p id="d"></p><div id="dots"></div><button id="n">Далее</button></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:radial-gradient(1200px at 20% 10%,#0ea5e933,#0b1020);color:#e2e8f0;font:500 15px Inter,sans-serif}
.on{width:360px;padding:22px;border-radius:18px;background:#0f172a;border:1px solid #334155}h3{margin:0 0 6px;font-size:23px}p{margin:0 0 14px;color:#94a3b8;min-height:42px}
#dots{display:flex;gap:8px;margin-bottom:14px}#dots b{width:9px;height:9px;border-radius:50%;background:#334155}#dots b.a{background:#22d3ee}
button{border:0;border-radius:10px;padding:10px 14px;background:#22d3ee;color:#042f2e;font-weight:800}
</style>
<script>
const s=[['Подключите команду','Пригласите коллег и назначьте роли за 30 секунд.'],['Импортируйте данные','CSV, Notion и Google Sheets поддерживаются из коробки.'],['Готово к работе','Дашборд собран, алерты включены.']],h=document.getElementById('h'),d=document.getElementById('d'),dots=document.getElementById('dots');let i=0;
const nextBtn=document.getElementById('n'),r=()=>{h.textContent=s[i][0];d.textContent=s[i][1];dots.innerHTML=s.map((_,k)=>`<b class="${k==i?'a':''}"></b>`).join('')};r();nextBtn.onclick=()=>{i=(i+1)%s.length;r()};
</script>
```

## 6) Генерация AI-отчета (стрим текста)
```html
<div class="ai"><h3>AI-отчет по продажам</h3><pre id="o"></pre><button id="run">Сгенерировать</button></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#030712;color:#dbeafe;font:500 15px/1.5 Inter,sans-serif}
.ai{width:420px;padding:18px;border-radius:16px;background:#0f172a;border:1px solid #334155}h3{margin:0 0 10px}pre{height:120px;padding:12px;border-radius:10px;background:#020617;white-space:pre-wrap}
button{margin-top:10px;border:0;border-radius:10px;padding:10px 14px;background:#38bdf8;color:#082f49;font-weight:800}
</style>
<script>
const runBtn=document.getElementById('run'),out=document.getElementById('o');
runBtn.onclick=()=>{const text='• Выручка +18% к прошлому месяцу\n• Лидирует канал: органический поиск\n• Рекомендуем увеличить бюджет ретаргета на 12%';out.textContent='';let i=0;const t=setInterval(()=>{out.textContent+=text[i++]||'';if(i>text.length)clearInterval(t)},18)};
</script>
```

## 7) KPI-карточка с живым sparkline
```html
<div class="k"><p>Активные пользователи</p><h2 id="n">12 480</h2><canvas id="c" width="300" height="80"></canvas></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#f1f5f9;font:500 15px Inter,sans-serif}
.k{width:340px;padding:18px;border-radius:16px;background:#fff;box-shadow:0 18px 40px #0f172a1a}p{margin:0;color:#64748b}h2{margin:6px 0 10px;font:800 42px/1 Inter,sans-serif}
</style>
<script>
const canvas=document.getElementById('c'),num=document.getElementById('n'),x=canvas.getContext('2d');let a=[22,27,24,31,29,35,33,39,36,42,40,46],v=12480;
setInterval(()=>{a.push(Math.max(18,Math.min(52,a.at(-1)+(Math.random()-.45)*7)));a.shift();v+=Math.round((Math.random()-.46)*120);num.textContent=v.toLocaleString('ru-RU');
x.clearRect(0,0,300,80);x.beginPath();x.moveTo(0,78-a[0]);a.forEach((y,i)=>x.lineTo(i*27,78-y));x.strokeStyle='#2563eb';x.lineWidth=3;x.stroke()},900);
</script>
```

## 8) 2FA-проверка с авто-переходом между ячейками
```html
<div class="otp"><h3>Подтвердите вход</h3><div id="b"><input maxlength=1><input maxlength=1><input maxlength=1><input maxlength=1><input maxlength=1><input maxlength=1></div><p id="m">Код из SMS</p></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#0b1020;color:#e2e8f0;font:500 15px Inter,sans-serif}
.otp{padding:22px;border-radius:16px;background:#111827}h3{margin:0 0 10px}#b{display:flex;gap:8px}input{width:42px;height:50px;border:1px solid #334155;border-radius:10px;background:#0f172a;color:#fff;text-align:center;font:800 24px Inter}
.ok{color:#22c55e}.bad{color:#f87171;animation:s .2s 3}@keyframes s{50%{transform:translateX(4px)}}
</style>
<script>
const box=document.getElementById('b'),msg=document.getElementById('m'),i=[...box.querySelectorAll('input')];i.forEach((el,k)=>{el.oninput=()=>{el.value=el.value.replace(/\D/g,'');if(el.value&&i[k+1])i[k+1].focus();if(i.every(x=>x.value)){const code=i.map(x=>x.value).join('');msg.className=code=='493271'?'ok':'bad';msg.textContent=code=='493271'?'Вход подтвержден':'Неверный код'}};el.onkeydown=e=>e.key=='Backspace'&&!el.value&&i[k-1]&&i[k-1].focus()});
</script>
```

## 9) Чат поддержки с имитацией печати
```html
<div class="chat"><div id="log"><p class="u">Как добавить участника в проект?</p></div><button id="ask">Получить ответ</button></div>
<style>
body{min-height:100vh;display:grid;place-items:center;background:#eef2ff;font:500 15px/1.45 Inter,sans-serif}
.chat{width:380px;padding:14px;border-radius:16px;background:#fff;box-shadow:0 16px 40px #1e293b22}#log{height:150px;overflow:auto;display:grid;gap:8px}
p{margin:0;padding:10px 12px;border-radius:12px;max-width:86%}.u{justify-self:end;background:#1d4ed8;color:#fff}.a{background:#e2e8f0}
button{margin-top:10px;border:0;border-radius:10px;padding:10px 12px;background:#0f172a;color:#fff}
</style>
<script>
const askBtn=document.getElementById('ask'),log=document.getElementById('log');
askBtn.onclick=()=>{const p=document.createElement('p');p.className='a';log.append(p);const t='Откройте "Команда" → "Участники" → "Пригласить", затем укажите email.';let i=0,s=setInterval(()=>{p.textContent=t.slice(0,++i);log.scrollTop=9e9;if(i>=t.length)clearInterval(s)},20)};
</script>
```

## 10) Нижний док-бар как в приложении
```html
<nav class="dock"><i class="blob"></i><a>Главная</a><a>Аналитика</a><a>Задачи</a><a>Профиль</a></nav>
<style>
body{min-height:100vh;display:grid;place-items:end center;background:linear-gradient(#0b1020,#04060d);padding:28px;font:600 14px Inter,sans-serif;color:#cbd5e1}
.dock{position:relative;display:flex;gap:10px;padding:10px;border-radius:16px;background:#0f172ab3;backdrop-filter:blur(8px);border:1px solid #334155}
a{position:relative;padding:10px 14px;border-radius:10px;z-index:1}a:hover{color:#fff}.blob{position:absolute;left:10px;top:10px;width:78px;height:36px;border-radius:10px;background:#1d4ed8;transition:.25s}
</style>
<script>
const d=document.querySelector('.dock'),b=document.querySelector('.blob');d.querySelectorAll('a').forEach(a=>a.onpointerenter=()=>{b.style.left=a.offsetLeft+'px';b.style.width=a.offsetWidth+'px'});d.onpointerleave=()=>{b.style.left='10px';b.style.width='78px'};
</script>
```

---

Если нужно, сделаю следующую версию: `10 ultra-premium демо` с еще более кинематографичной подачей (glassmorphism + depth + motion), но все так же коротко.
