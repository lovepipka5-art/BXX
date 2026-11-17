(()=>{
'use strict';
const $=id=>document.getElementById(id);let client,user,busy=false;
const message=t=>{$('status').textContent=t;};
const redirectTo=()=>new URL('Bender X Arena.dc.html',location.href).href;
function rememberReturn(){try{sessionStorage.setItem('bx-auth-return',location.pathname);}catch{}}
function steamURL(value){if(!value.trim())return '';const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='steamcommunity.com'||u.username||u.password||u.port||!/^\/(id\/[a-zA-Z0-9_-]+|profiles\/[0-9]{17})\/?$/.test(u.pathname))throw Error('Укажи ссылку https://steamcommunity.com/id/имя или /profiles/SteamID.');return u.origin+u.pathname;}
function preview(){const nick=$('nickname').value.trim()||'Игрок';$('preview-name').textContent=nick;$('preview-bio').textContent=$('bio').value||'Твоя история начинается здесь.';$('preview-main').textContent=$('main-fighter').value;$('preview-avatar').textContent=$('emblem').value==='initials'?Array.from(nick).slice(0,2).join('').toUpperCase():$('emblem').value;$('preview').dataset.banner=$('banner').value;document.querySelectorAll('[name="banner-choice"]').forEach(el=>el.checked=el.value===$('banner').value);document.querySelectorAll('[name="emblem-choice"]').forEach(el=>el.checked=el.value===$('emblem').value);}
function render(next){user=next;$('member').hidden=!user;$('login').hidden=!!user;if(!user){$('set-password-form').reset();$('profile-form').reset();$('steam-form').reset();return;}
const m=user.user_metadata||{},p=m.bx_profile||{};
$('nickname').value=p.nickname||m.display_name||m.full_name||'Игрок';$('bio').value=p.bio||'';$('main-fighter').value=p.main||'';
$('emblem').value=['BX','X','initials'].includes(p.emblem)?p.emblem:'BX';$('banner').value=['crimson','ice','graphite'].includes(p.banner)?p.banner:'crimson';
$('user-email').textContent=user.email||'Вход через провайдера';
const discord=(user.identities||[]).some(i=>i.provider==='discord');$('discord-state').textContent=discord?'Подключён через Discord':'Не подключён';$('link-discord').hidden=discord;
let steam='';try{steam=steamURL(m.bx_steam_profile||'');}catch{}
$('steam-url').value=steam;$('steam-open').hidden=!steam;$('steam-remove').hidden=!steam;if(steam)$('steam-open').href=steam;else $('steam-open').removeAttribute('href');preview();}
async function run(fn){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('.account-main button')];buttons.forEach(b=>b.disabled=true);$('profile-fields').disabled=true;try{await window.BXArenaAuth.deadline(fn());}catch(e){message(e.message||'Не удалось выполнить действие. Повтори попытку.');}finally{busy=false;buttons.forEach(b=>b.disabled=false);$('profile-fields').disabled=false;}}
async function init(){
 $('retry').hidden=true;message('Подключаем профиль…');
 try{client=await window.BXArenaAuth.ready();const session=window.BXArenaAuth.session;
 if(session){const result=await window.BXArenaAuth.deadline(client.auth.getUser());if(result.error)throw result.error;render(result.data.user);}
 else render(null);message('');
 }catch(e){render(null);message(e.message||'Не удалось подключиться. Попробуй ещё раз.');$('retry').hidden=false;}
}
$('retry').onclick=init;
window.addEventListener('bx:auth',event=>{client=window.BXArenaAuth.client||client;const next=event.detail.session?.user||null;if(next?.id!==user?.id||(!next&&user)){render(next);message('');}});
$('profile-form').addEventListener('input',e=>{if(e.target.name==='banner-choice')$('banner').value=e.target.value;if(e.target.name==='emblem-choice')$('emblem').value=e.target.value;preview();});
$('profile-form').addEventListener('submit',e=>{e.preventDefault();if(!$('profile-form').reportValidity())return;run(async()=>{if(!user)throw Error('Сначала войди.');const nickname=$('nickname').value.trim();if(nickname.length<2)throw Error('Ник должен содержать минимум 2 символа.');const {data,error}=await client.auth.updateUser({data:{display_name:nickname,bx_profile:{nickname,bio:$('bio').value.trim(),main:$('main-fighter').value.trim(),emblem:$('emblem').value,banner:$('banner').value}}});if(error)throw error;render(data.user);message('Профиль сохранён в аккаунте.');});});
async function saveSteam(value){if(!user)throw Error('Сначала войди.');const url=steamURL(value);const {data,error}=await client.auth.updateUser({data:{bx_steam_profile:url}});if(error)throw error;render(data.user);message(url?'Ссылка Steam сохранена. Владение профилем не подтверждено.':'Ссылка Steam удалена.');}
$('steam-form').onsubmit=e=>{e.preventDefault();if($('steam-form').reportValidity())run(()=>saveSteam($('steam-url').value));};
$('steam-remove').onclick=()=>run(()=>saveSteam(''));
$('logout').onclick=()=>run(async()=>{const {error}=await client.auth.signOut();if(error)throw error;render(null);message('Ты вышел из аккаунта.');});
$('link-discord').onclick=()=>run(async()=>{if(!user)throw Error('Сначала войди.');rememberReturn();const {error}=await client.auth.linkIdentity({provider:'discord',options:{redirectTo:redirectTo()}});if(error)throw Error('Подключение Discord не завершено: '+error.message);});
$('set-password-form').onsubmit=e=>{e.preventDefault();if(!$('set-password-form').reportValidity())return;const password=$('new-password').value;
if(password!==$('new-password-confirm').value){message('Пароли не совпадают.');return;}
run(async()=>{if(!user)throw Error('Сначала войди в аккаунт.');const {error}=await client.auth.updateUser({password});if(error)throw error;$('set-password-form').reset();message('Пароль сохранён. Для входа используй почту и новый пароль.');});};

const tabs=[...document.querySelectorAll('[data-account-tab]')];
function selectTab(tab){tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.accountTab===tab)));$('profile-form').hidden=tab!=='profile';$('connections').hidden=tab!=='connections';$('password-settings').hidden=tab!=='security';$('session-panel').hidden=tab!=='security';}
tabs.forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.accountTab)));selectTab('profile');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
