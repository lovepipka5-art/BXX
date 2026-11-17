/* Shared authentication UI. One Supabase client per page, one session across the arena. */
(()=>{
'use strict';
if(window.BXArenaAuth)return;
const $=id=>document.getElementById(id);
const base=new URL('.',location.href),accountURL=new URL('account.html',base).href;
let client=null,initializing=null,sdkPromise=null,session=null,busy=false,mode='login',trigger=null;
const profileIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>';
function deadline(promise,ms=12000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Сервис входа не ответил. Проверь соединение и попробуй ещё раз.')),ms);})]).finally(()=>clearTimeout(timer));}
async function boundedFetch(input,init={}){
 const controller=new AbortController(),abort=()=>controller.abort();
 const timer=setTimeout(abort,12000);
 if(init.signal?.aborted)abort();else init.signal?.addEventListener('abort',abort,{once:true});
 try{return await fetch(input,{...init,signal:controller.signal});}
 finally{clearTimeout(timer);init.signal?.removeEventListener('abort',abort);}
}
function sdk(){
 if(window.supabase)return Promise.resolve();
 if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');let timer;
  function fail(){clearTimeout(timer);script.remove();reject(Error('Не удалось загрузить модуль входа. Проверь соединение и повтори попытку.'));}
  script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  script.onload=()=>{clearTimeout(timer);window.supabase?resolve():fail();};script.onerror=fail;
  timer=setTimeout(fail,12000);document.head.append(script);
 }).catch(error=>{sdkPromise=null;throw error;});
 return sdkPromise;
}
function announce(text){$('bx-auth-message').textContent=text;}
function publish(next){
 session=next||null;
 const user=session?.user,button=$('bx-auth-trigger');
 button.classList.toggle('is-profile',!!user);
 button.replaceChildren();
 if(user){
  const span=document.createElement('span');span.innerHTML=profileIcon;button.append(span);
  const name=user.user_metadata?.display_name||user.user_metadata?.full_name||'Игрок';
  button.setAttribute('aria-label','Открыть профиль: '+name);button.title='Личный кабинет';
 }else{button.textContent='Войти';button.setAttribute('aria-label','Войти или зарегистрироваться');button.title='Вход и регистрация';}
 window.dispatchEvent(new CustomEvent('bx:auth',{detail:{session}}));
}
function ready(){
 if(!initializing)initializing=(async()=>{
  await sdk();
  if(!client){
   client=window.supabase.createClient('https://rospclqxeijwvvrixdza.supabase.co','sb_publishable_V_gUdsAQ8zaiVW7zcwM7pg_3eSFbGoP',{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},global:{fetch:boundedFetch}
   });
   client.auth.onAuthStateChange((_event,next)=>publish(next));
  }
  const {data,error}=await deadline(client.auth.getSession());
  if(error)throw error;publish(data.session);return client;
 })().catch(error=>{initializing=null;throw error;});
 return initializing;
}
function setMode(next){
 mode=next;const signup=mode==='register',emailOnly=mode==='email';
 $('bx-auth-title').textContent=signup?'Создать аккаунт':emailOnly?'Вход по ссылке':'С возвращением';
 $('bx-auth-caption').textContent=signup?'Твой ник, твой стиль, твоя арена.':emailOnly?'Пришлём ссылку на почту твоего аккаунта.':'Войди и продолжай на этой странице.';
 $('bx-auth-name-label').hidden=!signup;$('bx-auth-name').required=signup;$('bx-auth-name').disabled=!signup;
 $('bx-auth-password-wrap').hidden=emailOnly;$('bx-auth-password').disabled=emailOnly;$('bx-auth-password').required=!emailOnly;
 $('bx-auth-password').minLength=signup?8:1;$('bx-auth-password').autocomplete=signup?'new-password':'current-password';
 $('bx-auth-password').value='';$('bx-auth-password').type='password';$('bx-auth-show').textContent='Показать';$('bx-auth-show').setAttribute('aria-pressed','false');
 $('bx-auth-hint').hidden=!signup;
 $('bx-auth-submit').textContent=signup?'Создать аккаунт':emailOnly?'Получить ссылку':'Войти';
 $('bx-auth-login').setAttribute('aria-pressed',String(mode==='login'));$('bx-auth-register').setAttribute('aria-pressed',String(signup));
 $('bx-auth-help').textContent=emailOnly?'Вернуться к паролю':'Не помню пароль';
 announce('');
}
function open(next='login'){
 trigger=document.activeElement;setMode(next);
 if(!$('bx-auth-dialog').open)$('bx-auth-dialog').showModal();
 document.documentElement.classList.add('bx-auth-open');
 (next==='register'?$('bx-auth-name'):$('bx-auth-email')).focus();
}
function close(){$('bx-auth-dialog').close();}
function errorText(error){
 if(error.code==='invalid_credentials')return 'Проверь почту и пароль.';
 if(error.code==='email_not_confirmed')return 'Подтверди почту по ссылке из письма.';
 if(error.status===429)return 'Слишком много попыток. Попробуй немного позже.';
 if(error.name==='AbortError')return 'Сервис входа не ответил. Попробуй ещё раз.';
 return error.message||'Не удалось войти. Повтори попытку.';
}
async function action(fn){
 if(busy)return;busy=true;$('bx-auth-fields').disabled=true;$('bx-auth-form').setAttribute('aria-busy','true');
 try{const c=await ready();await fn(c);}catch(error){announce(errorText(error));}
 finally{busy=false;$('bx-auth-fields').disabled=false;$('bx-auth-form').setAttribute('aria-busy','false');}
}
function rememberPage(){try{sessionStorage.setItem('bx-auth-return',location.pathname);}catch{}}
const redirect=()=>new URL('Bender X Arena.dc.html',base).href;
function mount(){
 const topbar=document.querySelector('.topbar,.arena-page-topbar');
 const button=document.createElement('button');button.type='button';button.id='bx-auth-trigger';button.textContent='Войти';button.className='bx-auth-trigger';button.setAttribute('aria-label','Войти или зарегистрироваться');
 (topbar||document.body).append(button);
 const dialog=document.createElement('dialog');dialog.id='bx-auth-dialog';dialog.setAttribute('aria-labelledby','bx-auth-title');dialog.setAttribute('aria-describedby','bx-auth-caption');
 dialog.innerHTML=`<button type="button" id="bx-auth-close" aria-label="Закрыть окно входа">×</button><span class="bx-auth-brand">BX / ARENA</span>
 <form id="bx-auth-form"><fieldset id="bx-auth-fields">
 <div class="bx-auth-modes" role="group" aria-label="Вход или регистрация"><button type="button" id="bx-auth-login" aria-pressed="true">Вход</button><button type="button" id="bx-auth-register" aria-pressed="false">Регистрация</button></div>
 <h2 id="bx-auth-title">С возвращением</h2><p id="bx-auth-caption">Войди и продолжай на этой странице.</p>
 <label id="bx-auth-name-label" hidden>Никнейм<input id="bx-auth-name" autocomplete="nickname" minlength="2" maxlength="32" disabled></label>
 <label>Почта<input id="bx-auth-email" type="email" autocomplete="username" required maxlength="254" placeholder="you@example.com"></label>
 <div id="bx-auth-password-wrap"><label for="bx-auth-password">Пароль</label><div class="bx-auth-password"><input id="bx-auth-password" type="password" autocomplete="current-password" required maxlength="128"><button type="button" id="bx-auth-show" aria-pressed="false" aria-controls="bx-auth-password">Показать</button></div><p id="bx-auth-hint" hidden>Не менее 8 символов.</p></div>
 <p id="bx-auth-message" role="status" aria-live="polite"></p>
 <button id="bx-auth-submit" type="submit">Войти</button>
 <button id="bx-auth-discord" type="button">Продолжить с Discord</button>
 <button id="bx-auth-help" type="button">Не помню пароль</button>
 </fieldset></form>`;
 document.body.append(dialog);
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('bx-auth-open');$('bx-auth-password').value='';if(trigger?.isConnected)trigger.focus();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
 $('bx-auth-close').onclick=close;
 $('bx-auth-login').onclick=()=>setMode('login');$('bx-auth-register').onclick=()=>setMode('register');
 $('bx-auth-help').onclick=()=>setMode(mode==='email'?'login':'email');
 $('bx-auth-show').onclick=()=>{const show=$('bx-auth-password').type==='password';$('bx-auth-password').type=show?'text':'password';$('bx-auth-show').textContent=show?'Скрыть':'Показать';$('bx-auth-show').setAttribute('aria-pressed',String(show));};
 $('bx-auth-form').onsubmit=event=>{
  event.preventDefault();if(!$('bx-auth-form').reportValidity())return;
  const selected=mode,email=$('bx-auth-email').value.trim(),password=$('bx-auth-password').value,name=$('bx-auth-name').value.trim();
  if(selected==='register'&&name.length<2){announce('Ник должен содержать минимум 2 символа.');return;}
  announce(selected==='email'?'Отправляем ссылку…':'Подключаемся…');
  action(async c=>{
   let result;
   if(selected==='email'){rememberPage();result=await deadline(c.auth.signInWithOtp({email,options:{emailRedirectTo:redirect(),shouldCreateUser:false}}));}
   else if(selected==='register')result=await deadline(c.auth.signUp({email,password,options:{emailRedirectTo:redirect(),data:{display_name:name,bx_profile:{nickname:name,banner:'crimson',emblem:'BX'}}}}));
   else result=await deadline(c.auth.signInWithPassword({email,password}));
   if(result.error)throw result.error;
   $('bx-auth-password').value='';
   if(result.data?.session){publish(result.data.session);close();}
   else announce(selected==='email'?'Если аккаунт с этой почтой существует, мы отправили ссылку для входа.':'Проверь почту и подтверди регистрацию. Если аккаунт уже есть, перейди во вкладку «Вход».');
  });
 };
 $('bx-auth-discord').onclick=()=>{announce('Переходим к Discord…');action(async c=>{rememberPage();const {error}=await deadline(c.auth.signInWithOAuth({provider:'discord',options:{redirectTo:redirect()}}));if(error)throw error;});};
 document.addEventListener('click',event=>{
  const target=event.target.closest('a,button');if(!target)return;
  const isTrigger=target.id==='bx-auth-trigger'||target.hasAttribute('data-auth')||target.hasAttribute('data-bx-auth');
  let accountLink=false;
  if(target.tagName==='A'){try{const u=new URL(target.href);accountLink=u.origin===location.origin&&(u.pathname===new URL(accountURL).pathname||(u.hash==='#register'&&decodeURIComponent(u.pathname).endsWith('Bender X Arena.dc.html')));}catch{}}
  if(!isTrigger&&!accountLink)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(session?.user){location.href=accountURL;}else open(target.dataset.bxAuth==='register'?'register':'login');
 },true);
 ready().then(()=>{
  const callbackError=new URLSearchParams(location.hash.slice(1)).get('error_description');
  if(callbackError){open();announce('Вход не завершён. Попробуй ещё раз.');history.replaceState(null,'',location.pathname+location.search);return;}
  try{const path=sessionStorage.getItem('bx-auth-return');if(session&&path){sessionStorage.removeItem('bx-auth-return');const url=new URL(path,location.origin);if(url.origin===location.origin&&url.pathname.startsWith(base.pathname)&&url.pathname!==location.pathname)location.replace(url.href);}}catch{}
 }).catch(error=>window.dispatchEvent(new CustomEvent('bx:auth-error',{detail:{message:errorText(error)}})));
}
window.BXArenaAuth={ready,open,deadline,get session(){return session;},get client(){return client;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
