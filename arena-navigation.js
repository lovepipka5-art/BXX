/* Canonical menu from the homepage. All pages load this one template. */
(()=>{
'use strict';
if(document.getElementById('bx-navigation'))return;
const fragment=document.createElement('template');
fragment.innerHTML="<aside class=\"sidebar bx-navigation\" id=\"bx-navigation\" aria-label=\"Меню арены\"><button class=\"sidebar-close\" id=\"bx-nav-close\" aria-label=\"Закрыть навигацию\">×</button>\n<a class=\"brand\" href=\"Bender%20X%20Arena.dc.html\" aria-label=\"Bender X Arena — главная\"><img src=\"uploads/1784499586717-019f7c76-1764-77c6-9c60-732c8958b10c.png\" alt=\"\" width=\"48\" height=\"48\"><div><strong>BENDER X ARENA</strong><small>ТЕРРИТОРИЯ БОЯ</small></div></a>\n<p class=\"nav-label\">НАВИГАЦИЯ</p>\n<nav class=\"nav\" aria-label=\"Главная навигация\">\n<a href=\"Bender%20X%20Arena.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m3 10 9-7 9 7v10H3zM9 20v-7h6v7\"/></svg>Главная</a>\n<a href=\"Бойцы арены.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m4 3 6 2 10 13-2 2L5 10zM20 3l-6 2-3 4M8 14l-4 4 2 2 4-3M3 15l6 6M15 21l6-6\"/></svg>Бойцы арены</a>\n<a href=\"Расписание стримов.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"m10 9 5 3-5 3z\"/></svg>Стримы</a>\n<a href=\"Турнирная сетка.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 3h5v5H3zM3 16h5v5H3zM16 9h5v6h-5zM8 5h4v13H8m4-6h4\"/></svg>Турнирная сетка</a>\n<a href=\"Топ игроков.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 3h8v6a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v7m-5 1h10\"/></svg>Топ игроков</a>\n<a href=\"Новости арены.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"2\"/><path d=\"M8 7h8M8 11h8M8 15h4M8 18h8\"/></svg>Новости</a>\n<a href=\"О арене.dc.html\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6m0-10v1\"/></svg>Об арене</a>\n</nav>\n<div class=\"sidebar-bottom\"><div class=\"side-mark\" aria-hidden=\"true\">BX / ARENA</div><a href=\"https://discord.com/invite/qqctMjCTeg\" target=\"_blank\" rel=\"noopener noreferrer\"><svg class=\"icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 4 4 6 2 17l5 3 2-3m7-13 4 2 2 11-5 3-2-3M7 6a14 14 0 0 1 10 0M6 16a14 14 0 0 0 12 0\"/><circle cx=\"8\" cy=\"12\" r=\"1\"/><circle cx=\"16\" cy=\"12\" r=\"1\"/></svg>Наш Discord <svg class=\"icon diagonal\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 12h14m-5-5 5 5-5 5\"/></svg></a><p>Игра объединяет.<br>Арена выбирает сильнейших.</p></div>\n</aside>";
const sidebar=fragment.content.firstElementChild;
const veil=document.createElement('div');veil.id='bx-nav-veil';veil.hidden=true;veil.setAttribute('aria-hidden','true');
document.body.prepend(sidebar,veil);
let current;try{current=decodeURIComponent(location.pathname.split('/').pop()||'index.html');}catch{current='index.html';}
if(current==='index.html')current='Bender X Arena.dc.html';
sidebar.querySelectorAll('.nav a').forEach(a=>{let file;try{file=decodeURIComponent(new URL(a.href).pathname.split('/').pop());}catch{}if(file===current)a.setAttribute('aria-current','page');});
const mobile=matchMedia('(max-width:760px)');let lastTrigger=null,opened=false;
function triggers(){return document.querySelectorAll('[data-arena-menu],#menu-toggle');}
function setOpen(value,restore=false){
opened=!!value&&mobile.matches;sidebar.classList.toggle('open',opened);sidebar.inert=mobile.matches&&!opened;veil.hidden=!opened;
document.body.classList.toggle('bx-menu-open',opened);
triggers().forEach(b=>{b.setAttribute('aria-expanded',String(opened));b.setAttribute('aria-controls','bx-navigation');b.setAttribute('aria-label',opened?'Закрыть меню':'Открыть меню');});
if(opened){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.querySelector('a').focus();}
else{sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(restore&&lastTrigger?.isConnected)lastTrigger.focus();}
}
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-arena-menu],#menu-toggle');if(trigger){lastTrigger=trigger;setOpen(!opened);return;}
if(e.target===veil||e.target.closest('#bx-nav-close'))setOpen(false,true);
else if(e.target.closest('#bx-navigation a')&&opened)setOpen(false);});
document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();setOpen(false,true);return;}
if(e.key==='Tab'){const controls=[...sidebar.querySelectorAll('a,button')].filter(el=>!el.hidden&&!el.disabled);const first=controls[0],last=controls.at(-1);
if(!sidebar.contains(document.activeElement)){e.preventDefault();first.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
mobile.addEventListener('change',()=>setOpen(false));window.addEventListener('pageshow',()=>setOpen(false));
window.BXArenaNavigation={setOpen};
setOpen(false);
})();