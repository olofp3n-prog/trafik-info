(function () {
  'use strict';
  var root = document.getElementById('radioSection'); if (!root) return;
  var audio = document.getElementById('radioAudio'), query = document.getElementById('radioQuery'), country = document.getElementById('radioCountry'), volume = document.getElementById('radioVolume');
  var results = [], favorites = [], current = null, serial = 0, timer, speechTimer, muteTimer, unmuteTimer, retryTimer, retries = 0, wantsPlayback = false, attempt = 0, resumeGesture = null;
  var RETRY_DELAYS = [3000, 6000, 12000, 20000, 30000];
  function secure(url) { try { var u = new URL(url); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password; } catch (e) { return false; } }
  function clean(rows) { return Array.isArray(rows) ? rows.filter(function (s) { return s && typeof s.id === 'string' && typeof s.name === 'string' && secure(s.url); }) : []; }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  try { favorites = clean(JSON.parse(localStorage.getItem('radio_favorites') || '[]')); volume.value = localStorage.getItem('radio_volume') || '0.8'; country.value = localStorage.getItem('radio_country') || 'SE'; } catch (e) {}
  function level() { audio.volume = Math.max(0, Math.min(1, Number(volume.value))); }
  volume.parentElement.hidden = /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  level(); volume.oninput = function () { level(); save('radio_volume', this.value); };
  // Tysta strömmen medan röstvägledningen talar (iOS ignorerar audio.volume), med korta
  // marginaler så inget ord klipps, plus en säkerhetsåterställning om sluthändelsen uteblir.
  window.addEventListener('traffic-speech-start', function () { clearTimeout(unmuteTimer); clearTimeout(muteTimer); clearTimeout(speechTimer); muteTimer = setTimeout(function () { audio.muted = true; }, 300); speechTimer = setTimeout(function () { audio.muted = false; }, 20000); });
  window.addEventListener('traffic-speech-end', function () { clearTimeout(muteTimer); clearTimeout(speechTimer); unmuteTimer = setTimeout(function () { audio.muted = false; }, 300); });
  function status(t) { document.getElementById('radioStatus').textContent = t; document.getElementById('radioMiniStatus').textContent = t; }
  function updatePlay() { ['radioPlay', 'radioMiniPlay'].forEach(function (id) { var b=document.getElementById(id); b.innerHTML = icon(!wantsPlayback ? 'play' : 'pause'); b.setAttribute('aria-label', !wantsPlayback ? 'Spela radio' : 'Pausa radio'); b.title = b.getAttribute('aria-label'); }); }
  function icon(kind) { var paths = { play:'<path d="m8 5 11 7-11 7Z"/>', pause:'<path d="M8 5v14M16 5v14"/>', star:'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>' }; return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">'+paths[kind]+'</svg>'; }
  function setCurrent(s) { current=s; ['radioName','radioMiniName'].forEach(function(id){document.getElementById(id).textContent=s ? s.name : '';}); document.getElementById('radioCurrent').hidden=!s; document.getElementById('radioMini').hidden=!s; }
  function cancelPending() { attempt++; clearTimeout(retryTimer); retryTimer = undefined; if (resumeGesture) window.removeEventListener('pointerdown', resumeGesture); resumeGesture = null; }
  async function play(s, persist) { if (!secure(s.url)) return; cancelPending(); wantsPlayback=true; save('radio_paused','false'); var id=attempt; retries=0; setCurrent(s); status('Ansluter…'); if (persist !== false) save('radio_current', JSON.stringify(s)); audio.src=s.url; audio.load(); fetch('radio.php?action=click&id='+encodeURIComponent(s.id)).catch(function(){}); try { await audio.play(); } catch(e) { if (wantsPlayback && attempt===id) status('Kanalen kan inte spelas. Prova en annan.'); } updatePlay(); }
  // Återanslut automatiskt när strömmen bryts vid svag täckning, med växande pauser.
  function reconnect() {
    var s = current, id = attempt; if (!s || !wantsPlayback || retryTimer !== undefined) return;
    if (retries >= RETRY_DELAYS.length) { status('Kanalen kan inte spelas. Prova en annan.'); updatePlay(); return; }
    var delay = RETRY_DELAYS[retries++]; status('Återansluter…'); clearTimeout(retryTimer);
    retryTimer = setTimeout(function () { retryTimer = undefined; if (current !== s || !wantsPlayback || attempt !== id) return; audio.src = s.url; audio.load(); audio.play().catch(function () { if (attempt === id) reconnect(); }); }, delay);
  }
  function toggle() { if (!current) return; if (wantsPlayback) { wantsPlayback=false; cancelPending(); save('radio_paused','true'); audio.pause(); status('Pausad'); updatePlay(); } else play(current, false); }
  function close() { wantsPlayback=false; cancelPending(); save('radio_paused','true'); audio.pause(); audio.removeAttribute('src'); audio.load(); setCurrent(null); try { localStorage.removeItem('radio_current'); } catch (e) {} }
  ['radioPlay','radioMiniPlay'].forEach(function(id){document.getElementById(id).onclick=toggle;}); ['radioClose','radioMiniClose'].forEach(function(id){document.getElementById(id).onclick=close;});
  audio.onplaying=function(){if (!wantsPlayback) { audio.pause(); return; } clearTimeout(retryTimer); retryTimer=undefined; retries=0;status('Spelar');updatePlay();}; audio.onpause=function(){if (!wantsPlayback) status('Pausad');updatePlay();}; audio.onwaiting=function(){if (wantsPlayback) status('Buffrar…');}; audio.onerror=function(){reconnect();}; audio.onstalled=function(){reconnect();};
  // Återuppta senaste kanalen efter omladdning eller krasch. Autoplay kräver en gest,
  // så om uppspelning blockeras försöker vi igen vid första trycket på sidan.
  (function () {
    var saved = null;
    try { var raw = localStorage.getItem('radio_current'); if (raw) saved = clean([JSON.parse(raw)])[0] || null; } catch (e) {}
    if (!saved) return;
    setCurrent(saved); if (localStorage.getItem('radio_paused') === 'true') { status('Pausad'); updatePlay(); return; } wantsPlayback=true; var id=attempt; status('Ansluter…'); audio.src = saved.url; audio.load();
    audio.play().catch(function () {
      if (!wantsPlayback || attempt !== id) return;
      status('Tryck var som helst för att fortsätta lyssna');
      var resume = function () { window.removeEventListener('pointerdown', resume); resumeGesture=null; if (current === saved && wantsPlayback && attempt === id) audio.play().catch(function () {}); };
      resumeGesture=resume; window.addEventListener('pointerdown', resume);
    });
    updatePlay();
  })();
  function renderList(id, rows) {
    var list=document.getElementById(id); list.replaceChildren();
    rows.forEach(function(s){
      var li=document.createElement('li'), b=document.createElement('button'), text=document.createElement('span'), small=document.createElement('small'), star=document.createElement('button');
      li.className='radio-station'; b.type='button'; b.className='radio-pick'; b.innerHTML=icon('play'); text.textContent=s.name; small.textContent=[s.country,s.codec,s.bitrate?s.bitrate+' kbps':''].filter(Boolean).join(' · '); text.appendChild(small); b.appendChild(text); b.onclick=function(){play(s);};
      var saved=favorites.some(function(f){return f.id===s.id;}); star.type='button'; star.className='radio-icon'+(saved?' radio-favorite':''); star.innerHTML=icon('star'); star.title='Favorit'; star.setAttribute('aria-label',(saved?'Ta bort favorit ':'Spara favorit ')+s.name); star.setAttribute('aria-pressed',String(saved));
      star.onclick=function(){favorites=saved?favorites.filter(function(f){return f.id!==s.id;}):favorites.concat([s]);save('radio_favorites',JSON.stringify(favorites));render();}; li.append(b,star);list.appendChild(li);
    });
  }
  function render(){renderList('radioResults',results);renderList('radioFavorites',favorites);document.getElementById('radioFavoritesHeading').hidden=!favorites.length;}
  async function search(){var id=++serial;document.getElementById('radioError').textContent='Söker kanaler…';try{var r=await fetch('radio.php?q='+encodeURIComponent(query.value.trim())+'&country='+encodeURIComponent(country.value));if(!r.ok)throw Error();var data=await r.json();if(id!==serial)return;results=clean(data.stations);document.getElementById('radioError').textContent=data.error || (results.length?'':'Inga HTTPS-kanaler hittades');render();}catch(e){if(id===serial)document.getElementById('radioError').textContent='Kan inte söka kanaler just nu.';}}
  query.oninput=function(){++serial;clearTimeout(timer);timer=setTimeout(search,400);};country.onchange=function(){save('radio_country',this.value);search();};
  fetch('radio.php?action=countries').then(function(r){return r.json();}).then(function(rows){if(!Array.isArray(rows))return;rows.forEach(function(c){if(c.code==='SE')return;var o=document.createElement('option');o.value=c.code;o.textContent=c.name;country.appendChild(o);});try{country.value=localStorage.getItem('radio_country')||'SE';}catch(e){}}).catch(function(){});
  var expand=document.getElementById('radioExpand'), options=document.getElementById('radioOptions'), started=false;
  expand.onclick=function(){var open=this.getAttribute('aria-expanded')!=='true';this.setAttribute('aria-expanded',String(open));options.hidden=!open;if(open&&!started){started=true;search();}};
  render();updatePlay();
}());
