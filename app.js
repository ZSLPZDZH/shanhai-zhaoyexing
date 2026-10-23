/* 山海·照夜行 | Local, dependency-free presentation and interaction. */
(() => {
  'use strict';
  const D = window.GAME_DATA;
  const E = window.SHANHAI_ENGINE;
  const P = window.SHANHAI_PROFILE;
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const RUN_KEY = 'shanhai-nightwalk:run:v1';
  const META_KEY = 'shanhai-nightwalk:meta:v1';

  let storageAvailable = true, damagedSaveText = null, originalRunText = null;
  function read(key, fallback) {
    try {
      const text = localStorage.getItem(key);
      if(key===RUN_KEY) originalRunText=text;
      if(!text) return fallback;
      try { return JSON.parse(text) ?? fallback; }
      catch {if(key===RUN_KEY)damagedSaveText=text; return fallback;}
    } catch {storageAvailable=false;return fallback;}
  }
  let meta = P.normalizeMeta(read(META_KEY, {}));
  const rawRun=read(RUN_KEY,null);
  let run=rawRun ? E.restoreRun(rawRun) : null;
  let unresolvedSave=Boolean(damagedSaveText || (rawRun&&!run));
  let pendingSetup={starter:'keeper',difficulty:'standard',campaign:'legend18',seed:''},pendingImport=null;
  let view = 'home', archiveStyle = 0, archivePage = 0, archiveQuery = '', archiveCategory = '', archiveSeen = false;
  let toastTimer, lastFocus, modalName = '', audioContext, audioGain, ambientTimer, deckChoiceMode='upgrade';
  const categories = [...new Set((D?.creatures || []).map(c => c.category))];
  const elementNames = {wood:'木',fire:'火',water:'水',metal:'金',earth:'土',void:'玄'};
  const rarityNames = {common:'凡品',rare:'珍品',legendary:'传说',uncommon:'珍品'};
  const typeNames = {attack:'攻伐',skill:'术法',power:'灵佑'};
  const nodeNames = {battle:'异兽踪迹',elite:'险境',boss:'镇境之灵',event:'山海奇遇',rest:'山间歇脚',shop:'云游行商'};
  const chapterNames = E.REGIONS.map(r=>r.name);
  const chapterArt = E.REGIONS.map(r=>r.artId);
  function esc(v='') {return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function creature(ref) {
    const list = D?.creatures || [];
    if (typeof ref === 'object' && ref) ref = ref.id || ref.name;
    if (!ref) return list.find(c => c.id === 'b01-08') || list[0];
    const alias = {'饕餮':'b03-04','玄武':'b01-03','烛龙':'b05-02','凤凰':'b01-19','凤皇':'b01-19','青耕':'b03-09','穷奇':'b05-16'};
    return list.find(c => c.id === ref) || list.find(c => c.id === alias[ref]) || list.find(c => c.name === ref) || list.find(c => c.name.includes(ref)) || list.find(c => ref.includes(c.name)) || list.find(c => c.id === 'b01-08') || list[0];
  }
  function art(ref, style=0) { const c = creature(ref); if(c?.id==='b01-08' && style===2) return 'assets/hero.webp'; return c?.images?.[style] || c?.images?.[0] || 'assets/works/b01-08-s1.webp'; }
  function adjustedRecovery(description) {
    if(view!=='game'||!run)return description;
    const factor=difficultyInfo().healMultiplier;
    return description.replace(/恢复 (\d+) 点生命/g,(_,n)=>`恢复 ${Math.ceil(Number(n)*factor)} 点命火`);
  }
  function card(id) { const info=E?.getCard(id) || {id,name:id,cost:1,type:'skill',description:'灵契',rarity:'common'};return {...info,description:adjustedRecovery(info.description)}; }
  function relic(id) { const info=E?.RELICS?.find(r=>r.id===id)||{name:id,description:'山海途中所得之物'};return {...info,description:info.id==='ember'?info.description:adjustedRecovery(info.description)}; }
  function region() { return E?.REGIONS?.[run?.chapter || 0] || {}; }
  function chapterLabel() {return region().name || chapterNames[run?.chapter || 0] || chapterNames.at(-1);}

  function save() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
      if(!unresolvedSave) {
        if(run) localStorage.setItem(RUN_KEY, JSON.stringify(run));
        else localStorage.removeItem(RUN_KEY);
      }
      storageAvailable=true;
    } catch {
      if(storageAvailable)toast('当前浏览器无法保存进度，可在设置中导出存档。');
      storageAvailable=false;
    }
  }
  function starterInfo(id=run?.starter){return E.STARTERS.find(s=>s.id===id)||E.STARTERS[0];}
  function difficultyInfo(id=run?.difficulty){return E.DIFFICULTIES.find(s=>s.id===id)||E.DIFFICULTIES.find(s=>s.id==='standard');}
  function campaignInfo(id=run?.campaign||pendingSetup.campaign){return E.CAMPAIGNS.find(c=>c.id===id)||E.CAMPAIGNS[0];}
  function chapterCount(state=run){return state?E.getChapterCount(state):campaignInfo(pendingSetup.campaign).chapters;}
  function realmRule(ref=run?.chapter){return E.REGIONS[ref]?.rule;}
  function milestone(ids) {
    if(!ids?.length)return;
    const holder=document.getElementById('milestones');
    const entries=ids.map(id=>P.ACHIEVEMENTS.find(a=>a.id===id)).filter(Boolean);
    entries.slice(0,3).forEach((a,i)=>{
      const button=document.createElement('button');button.className='milestone';button.dataset.action='achievements';
      button.innerHTML=`<span>◇</span><span><small>新成就 · 山海留名</small><strong>${esc(a.name)}</strong></span>`;
      setTimeout(()=>{holder.append(button);setTimeout(()=>button.remove(),5500);},i*400);
    });
  }
  function toast(message) {const box = document.getElementById('toast');box.textContent=message;box.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('visible'),3000);}
  const soundIcon = () => meta.sound ? '<path d="M3 7h3l4-4v14l-4-4H3Z"/><path d="M13 6q5 4 0 8M15 3q8 7 0 14"/>' : '<path d="M3 7h3l4-4v14l-4-4H3Z"/><path d="m14 7 5 6m0-6-5 6"/>';
  const svg = x => `<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${x}</svg>`;
  function header(inGame=false) {
    return `<header class="site-header ${inGame?'game-header':''}">
      <button class="brand" data-action="home" aria-label="返回首页"><span class="brand-symbol">山</span><span><span class="brand-title">山海·照夜行</span><span class="brand-sub">A WALK THROUGH SHANHAI</span></span></button>
      ${inGame?`<div class="run-status"><span class="hp-inline">♥ <strong>${Math.max(0,run.hp)}</strong> / ${run.maxHp}</span><span>灵玉 <strong>${run.ink}</strong></span><button class="pile-button" data-action="deck"><span class="deck-count-label">契牌 </span><strong>${run.deck.length}</strong></button></div>`:`<nav class="nav" aria-label="主要导航"><button data-action="home" class="${view==='home'?'active':''}">启程</button><button data-action="archive" class="${view==='archive'?'active':''}">万灵卷</button><button data-action="journal" class="${view==='journal'?'active':''}">行旅札记</button></nav>`}
      <div class="header-tools">${!inGame?'<span class="header-note">山海有灵 · 万象有声</span>':''}<button class="icon-button" data-action="sound" aria-label="${meta.sound?'关闭':'开启'}声音" title="${meta.sound?'关闭':'开启'}声音">${svg(soundIcon())}</button><button class="icon-button settings-button" data-action="${inGame?'pause':'settings'}" aria-label="${inGame?'暂停与设置':'设置'}">${svg(inGame?'<path d="M7 5v12M15 5v12"/>':'<path d="M4 6h14M4 11h14M4 16h14"/><circle cx="8" cy="6" r="2" fill="#142326"/><circle cx="14" cy="11" r="2" fill="#142326"/><circle cx="9" cy="16" r="2" fill="#142326"/>')}</button>${!inGame&&run&& !['victory','defeat'].includes(run.phase)?'<button class="outline-button" data-action="continue">继续旅程 ↗</button>':''}</div>
    </header>`;
  }
  function render() {
    if (!D || !E || !P) { app.innerHTML='<div class="loading">山海画卷正在展开……<br><small>如未能进入，请确认 data.js 与 engine.js 和本文件位于同一文件夹。</small></div>'; return; }
    let body = '';
    if(view==='home') body = homeView();
    else if(view==='archive') body = archiveView();
    else if(view==='journal') body = journalView();
    else if(run) body = gameView();
    else {view='home'; body=homeView();}
    app.innerHTML = header(view==='game' && !!run) + body;
    if(view==='game'&&run?.phase==='map'){
      const trail=app.querySelector('.realm-trail'),current=trail?.querySelector('.current');
      if(trail&&current)trail.scrollLeft=Math.max(0,current.offsetLeft-trail.offsetLeft-(trail.clientWidth-current.clientWidth)/2);
    }
  }
  function homeView() {
    const active = run && !['victory','defeat'].includes(run.phase);
    return `<main class="home fade-enter"><div class="hero-art" style="background-image:url('${art('b01-08',2)}')" role="img" aria-label="月夜青丘，九尾白狐立于山崖"></div><span class="hero-index">THE CLASSIC OF MOUNTAINS AND SEAS · CHAPTER I</span><div class="home-content"><div class="home-kicker">一盏灯，照见山海万灵</div><h1 class="home-title">山海<br><span class="title-small">照夜行</span></h1><p class="home-copy">古卷散落，长夜将临。<br>与异兽结契，循星火远游。<br>在山海尽头，寻回世界的名字。</p><div class="home-actions"><button class="primary-button" data-action="${active?'continue':'start'}">${active?'续写旅程':'执灯入山'}<span>↗</span></button><button class="text-button" data-action="help">如何游玩</button></div><div class="journey-stats"><span><strong>282</strong>卷山海异闻</span><span><strong>6</strong>重丹青画境</span><span><strong>${E.REGIONS.length}</strong>章 · ${E.REGIONS.length*4}程远游</span></div></div><div class="hero-caption">青丘有兽，其状如狐而九尾<small>《南山经》· 青丘之山</small></div><footer class="home-bottom"><div class="feature"><span class="feature-num">01</span><div><h3>与灵结契</h3><p>万象入牌，自成一派</p></div></div><div class="feature"><span class="feature-num">02</span><div><h3>步步有择</h3><p>奇遇与险境，皆在一念</p></div></div><div class="feature"><span class="feature-num">03</span><div><h3>六境观山</h3><p>一部古卷，六种丹青</p></div></div><p class="home-colophon"><b>SHANHAI · NIGHTWALK</b><br>源自山海，游于想象</p></footer></main>`;
  }
  function gameView() {
    const screens={map:mapView,combat:battleView,reward:rewardView,event:eventView,rest:restView,shop:shopView,victory:resultView,defeat:resultView};
    return (screens[run.phase] || mapView)();
  }
  function relicList() {return run.relics.length?run.relics.map(id=>`<button class="relic-token" data-action="relic-info" data-id="${esc(id)}" title="${esc(relic(id).description)}" aria-label="查看${esc(relic(id).name)}的效果">◇ ${esc(relic(id).name)}</button>`).join(''):'<span class="empty-note">尚未获得行旅遗珍</span>';}
  function mapView() {
    const nodes=run.route || [];
    const chapter=run.chapter || 0;
    return `<main class="game-shell fade-enter"><div class="scene-background" style="background-image:url('${art(chapterArt[chapter],2)}')"></div><div class="scene-content"><div class="section-title"><div><div class="eyebrow">THE JOURNEY / CHAPTER ${String(chapter+1).padStart(2,'0')} OF ${String(chapterCount()).padStart(2,'0')}</div><h1>${esc(chapterLabel())}</h1><p>${esc(region().description || '山中有故人，前路有新章。择一条路，继续你的远游。')}</p></div><span class="chapter-mark">${String(chapter+1).padStart(2,'0')}</span></div><div class="realm-trail" aria-label="远游章节进度">${E.REGIONS.slice(0,chapterCount()).map((r,i)=>`<button class="realm-stop ${i===chapter?'current':i<chapter?'done':''}" data-action="journey-map" aria-label="${esc(r.name)}，${i<chapter?'已踏过':i===chapter?'当前章节':'前路'}" title="${esc(r.name)}"><i>${i<chapter?'✓':String(i+1).padStart(2,'0')}</i><span>${esc(r.title)}</span></button>`).join('')}</div><div class="chapter-progress">${['入山','岔路','歇脚','镇境'].map((s,i)=>`<div class="progress-step ${i===run.step?'current':i<run.step?'done':''}"><i><span>${i<run.step?'✓':i+1}</span></i>${s}</div>`).join('')}</div><div class="run-context"><span>◇ ${esc(starterInfo().name)}</span><span>${esc(difficultyInfo().name)}</span><button data-action="journey-map">${chapterCount()}境舆图 ↗</button><button data-action="run-summary">本次行迹 ↗</button></div>${realmRule()?`<button class="realm-rule-banner" data-action="realm-rule"><span class="rule-sigil">◇</span><span><strong>此境法则 · ${esc(realmRule().name)}</strong><small>${esc(realmRule().description)}</small></span><span class="rule-arrow">↗</span></button>`:''}<div class="route-heading">${run.step===3?'与镇境之灵相见':'前路将去何处'}</div><div class="route-grid" ${nodes.length<3?`style="grid-template-columns:repeat(${Math.max(1,nodes.length)},minmax(0,1fr));max-width:${nodes.length===1?'460':'850'}px"`:''}>${nodes.map((n,i)=>`<button class="route-card ${n.type}" data-action="node" data-id="${esc(n.id)}"><img class="route-art" src="${art(n.creatureId || (n.type==='rest'?'b03-08':n.type==='shop'?'b05-04':chapterArt[chapter]))}" alt="${esc(n.name)}"><div class="route-info"><span class="node-type">${nodeNames[n.type] || n.type} · ${String(i+1).padStart(2,'0')}</span><h3>${esc(n.name)}</h3><p>${esc(n.description || {battle:'灵气在山间凝结。战胜异兽，获得灵玉与新的契牌。',elite:'强大的异兽守候于此，胜利亦有更丰厚的馈赠。',event:'风中传来古老的故事，也许会改变此行的命运。',shop:'以旅途中所得，换一份向前的底气。',rest:'停下脚步，修整伤势，或磨砺手中的契牌。',boss:'山海的守望者在此，唯有经过考验，才能向前。'}[n.type] || '')}</p><span class="route-enter">${n.type==='boss'?'接受试炼':'循此而行'} <span aria-hidden="true">⟶</span></span></div></button>`).join('')}</div><div class="map-footer"><div class="relic-list">${relicList()}</div><span>每一步只可选择一条路 · 进度自动保存 <button class="text-button" data-action="help">旅途须知</button></span></div></div></main>`;
  }
  function cardView(id, opts={}) {
    const c=card(id), action=opts.action || 'inspect-card', ref=c.artId || c.creatureId || c.creatureName || c.name;
    return `<button class="spirit-card ${esc(c.rarity)} ${opts.className || ''}" ${action?`data-action="${action}" data-id="${esc(opts.uid || id)}"`:''} ${opts.disabled?'disabled':''} aria-label="${esc(`${c.name}，${c.cost}灵力，${c.description}`)}" title="${esc(`${c.name} · ${c.description}`)}"><img class="card-art" src="${art(ref,opts.style || 0)}" alt="" loading="lazy"><span class="card-cost">${c.cost}</span>${c.rarity==='legendary'?'<span class="card-rarity">传说</span>':''}<span class="card-content"><span class="card-name">${esc(c.name)}</span><span class="card-type">${typeNames[c.type] || '术法'} · ${elementNames[c.element] || '玄'} · ${rarityNames[c.rarity] || '凡品'}</span><span class="card-description">${esc(c.description)}</span></span>${opts.shortcut?`<span class="card-shortcut">${opts.shortcut===10?'0':opts.shortcut}</span>`:''}</button>`;
  }

  function statusList(status={}, block=0) {
    const names={strength:'力量',thorns:'反伤',vulnerable:'易伤',weak:'虚弱',burn:'灼烧',regen:'回春',dexterity:'灵护'};
    return `${block?`<button data-action="status-info" data-id="block">◇ 护盾 ${block}</button>`:''}${Object.entries(names).filter(([k])=>status[k]>0).map(([k,n])=>`<button data-action="status-info" data-id="${k}">${n} ${status[k]}</button>`).join('')}`;
  }
  function battleView() {
    const b=run.battle, enemy=b.enemy, intent=enemy.intent || {label:'静候',value:0};
    return `<main class="battle-scene fade-enter" id="battle-scene"><div class="scene-background" style="background-image:url('${art(enemy.creatureId,2)}')"></div><div class="battle-topline"><span>${esc(chapterLabel())} <span style="opacity:.4">/</span> 第 ${run.step+1} 程 · ${esc(enemy.name)}</span><span>第 ${b.turn} 回合 <span style="opacity:.4">|</span> 你的回合</span><button class="text-button" data-action="help">规则 <span class="key">?</span></button></div><div class="battle-arena"><section class="player-panel" aria-label="行者状态"><div class="player-sigil">灯</div><span class="small-label">THE LANTERN KEEPER</span><h2>执灯人</h2><div class="health-row"><span>命火</span><strong>${Math.max(0,run.hp)} <span style="font-size:10px;opacity:.5">/ ${run.maxHp}</span></strong></div><div class="health-track"><span style="width:${Math.max(0,run.hp/run.maxHp*100)}%"></span></div><div class="status-list">${statusList(b.status,b.block)}</div><div class="relic-list" style="margin-top:20px">${relicList()}</div></section><section class="enemy-stage" aria-label="${esc(enemy.name)}状态"><div class="enemy-ring" aria-hidden="true"></div><div class="intent ${intent.type==='defend'?'defend':''}"><span aria-hidden="true">${intent.type==='attack'?'⚔':intent.type==='defend'?'◇':'✧'}</span><span>${esc(E.getIntentDescription(run))}</span></div><img class="enemy-portrait" src="${art(enemy.creatureId)}" alt="${esc(creature(enemy.creatureId)?.name || enemy.name)}"><h1 class="enemy-name">${esc(enemy.name)}</h1><div class="enemy-health"><div class="health-row"><span>灵息</span><strong>${Math.max(0,enemy.hp)} <span style="font-size:10px;opacity:.5">/ ${enemy.maxHp}</span></strong></div><div class="health-track"><span style="width:${Math.max(0,enemy.hp/enemy.maxHp*100)}%"></span></div><div class="status-list enemy-status">${statusList({...enemy.status,strength:enemy.strength},enemy.block)}</div></div></section><aside class="battle-log" aria-label="战斗记录"><h3>山中回响</h3>${(b.log || []).slice(-7).map(l=>`<p>${esc(l)}</p>`).join('')}</aside></div><div class="battle-utilities"><button data-action="relics">◇ 行旅遗珍 ${run.relics.length}</button><button data-action="combat-log">山中回响 ↗</button>${realmRule()?`<button class="battle-realm-rule" data-action="realm-rule">${esc(realmRule().name)} ↗</button>`:`<span>${esc(starterInfo().name)} · ${esc(difficultyInfo().name)}</span>`}</div><div class="turn-panel"><div class="energy-display"><span class="energy-orb" aria-label="剩余灵力${b.energy}">${b.energy}</span><span class="small-label">灵力<br>${b.energy} / ${b.maxEnergy || 3}</span></div><div class="pile-group"><button class="pile-button" data-action="draw-pile">抽牌<strong>${b.drawPile.length}</strong></button><button class="pile-button" data-action="discard-pile">弃牌<strong>${b.discardPile.length}</strong></button><button class="pile-button" data-action="exhaust-pile">消耗<strong>${b.exhaustPile.length}</strong></button></div><button class="turn-end" data-action="end-turn">结束回合 <small>E / 空格</small><span aria-hidden="true"> ⟶</span></button></div><div class="hand-area" aria-label="你的手牌">${b.hand.map((c,i)=>cardView(c.id,{action:'play',uid:c.uid,shortcut:i+1,disabled:card(c.id).cost>b.energy})).join('') || '<p class="small-label" style="padding:60px 0">手中已无契牌，结束回合后重新抽牌。</p>'}</div><p class="combat-instruction">点击契牌出牌 · 数字 1–9 / 0 快捷出牌 · 结束回合前留意对手意图 · 护盾于下回合开始时消散</p></main>`;
  }
  function rewardView() {
    const r=run.reward || {cards:[]};
    return `<main class="choice-screen fade-enter"><div class="scene-background" style="background-image:url('${art(chapterArt[run.chapter],2)}')"></div><div class="eyebrow">A GIFT FROM THE MOUNTAINS</div><h1>万灵相赠</h1><p class="intro">一场试炼，一段新的羁绊。<br>选择一张契牌，加入你的行囊。</p><div class="reward-gains">${r.ink?`<span>灵玉 +${r.ink}</span>`:''}${r.heal?`<span>命火 +${r.heal}${r.chapterHeal?` · 其中归境疗愈 ${r.chapterHeal}`:''}</span>`:''}${r.relic?`<span title="${esc(relic(r.relic).description)}">遗珍 · ${esc(relic(r.relic).name)}</span>`:''}</div><div class="reward-cards">${r.cards.map(id=>cardView(id,{action:'reward'})).join('')}</div><button class="text-button" data-action="skip-reward">不取新契，继续前行 ⟶</button></main>`;
  }
  function eventView() {
    const ev=run.event;
    return `<main class="choice-screen fade-enter"><div class="eyebrow">AN UNEXPECTED ENCOUNTER</div><div class="event-layout"><img class="event-image" src="${art(ev.creatureId || 'b03-08',2)}" alt="山海奇遇"><section class="event-story"><span class="small-label">山海奇遇 · 命运的岔路</span><h1>${esc(ev.title)}</h1><p>${esc(ev.text)}</p><div class="event-choices">${ev.choices.map(c=>`<button class="event-choice" data-action="event-choice" data-id="${esc(c.id)}" ${c.disabled?'disabled':''}><strong>${esc(c.label)} <span aria-hidden="true">⟶</span></strong><small>${esc(c.description)}</small></button>`).join('')}</div></section></div></main>`;
  }

  function restView() {
    const amount=Math.min(run.maxHp-run.hp,E.getRestHeal(run));
    const canUpgrade=run.deck.some(id=>!id.endsWith('+'));
    return `<main class="choice-screen fade-enter"><div class="eyebrow">A MOMENT OF STILLNESS</div><div class="event-layout"><img class="event-image" src="${art('b01-19',2)}" alt="山间月色"><section class="event-story"><span class="small-label">山间歇脚 · 风止于林</span><h1>借一夜山月</h1><p>炉火尚温，远处有鸟啼。让命火重新明亮，或选择一张契牌，悟出它更深的力量。</p><div class="event-choices"><button class="event-choice" data-action="rest-heal"><strong>围炉小憩 ⟶</strong><small>恢复 ${amount} 点命火（最多 ${E.getRestHeal(run)} 点）。当前 ${run.hp} / ${run.maxHp}</small></button><button class="event-choice" data-action="rest-upgrade"><strong>${canUpgrade?'静心悟契':'万契俱明'} ⟶</strong><small>${canUpgrade?'亲自选择一张尚未觉醒的契牌，预览其提升后再决定。':`所有契牌均已觉醒，改为恢复最多 ${Math.ceil(12*difficultyInfo().healMultiplier)} 点命火。`}</small></button></div></section></div></main>`;
  }
  function shopView() {
    const shop=run.shop || {cards:[]};
    return `<main class="choice-screen fade-enter"><div class="scene-background" style="background-image:url('${art('b05-04',2)}')"></div><div class="eyebrow">THE WANDERING MERCHANT</div><h1>山中有市</h1><p class="intro">行商展开旧卷，远山停在杯沿。<br>以灵玉换取一份同行的力量。</p><div class="reward-gains"><span>现有灵玉 ${run.ink}</span></div><div class="reward-cards">${shop.cards.map(c=>`<div class="shop-item">${cardView(c.id)}<button class="shop-price" data-action="buy-card" data-id="${esc(c.id)}" ${run.ink<c.price?'disabled':''}>结契 · ${c.price} 灵玉</button></div>`).join('') || '<p class="small-label">好物已与你结缘</p>'}</div>${!shop.removeUsed?`<div class="shop-service"><div><h3>澄心 · 遗忘一契</h3><p>移除一张契牌，凝练此行的牌组。每处行商限一次，至少保留 5 张。</p></div><button class="shop-price" data-action="remove-card" ${run.ink<shop.removeCost||run.deck.length<=5?'disabled':''}>选择契牌 · ${shop.removeCost} 灵玉</button></div>`:'<p class="service-used">此处行商已为你澄去一契。</p>'}${shop.relic?`<div style="margin:0 auto 25px;max-width:500px;border:1px solid var(--line);padding:18px"><h3 style="color:var(--gold);font-size:20px">◇ ${esc(relic(shop.relic.id).name)}</h3><p style="font-size:11px;color:var(--muted);margin:8px 0 15px">${esc(relic(shop.relic.id).description)}</p><button class="shop-price" data-action="buy-relic" data-id="${esc(shop.relic.id)}" ${run.ink<shop.relic.price?'disabled':''}>收下遗珍 · ${shop.relic.price} 灵玉</button></div>`:''}<button class="text-button" data-action="leave-shop">谢过行商，继续前行 ⟶</button></main>`;
  }

  function resultView() {
    const win=run.phase==='victory';
    return `<main class="choice-screen fade-enter"><div class="scene-background" style="background-image:url('${art(win?'b05-01':'b01-08',2)}')"></div><div class="eyebrow">${win?'DAWN RETURNS TO SHANHAI':'EVERY END IS A NEW BEGINNING'}</div><div class="result-seal">${win?'明':'归'}</div><h1>${win?'长夜终有明':'且待灯再明'}</h1><p class="intro">${win?'古卷有名，万灵有归。你已抵达所选卷册的终点，下一段山海仍有新的可能。':'命火暂熄，山海仍在。每一场试炼，都会成为下次远游的底气。'}</p><div class="run-context centered"><span>${esc(campaignInfo().name)} · ${chapterCount()} 境 / ${chapterCount()*4} 程</span><span>${esc(starterInfo().name)}</span><span>${esc(difficultyInfo().name)}</span><span>旅程种子 ${esc(run.seed)}</span></div><div class="result-stats"><div><strong>${E.getScore(run)}</strong>山海行分</div><div><strong>${run.stats.battles}</strong>场试炼</div><div><strong>${run.stats.damageDealt}</strong>累计伤害</div><div><strong>${run.deck.length}</strong>张契牌</div></div><p class="score-note">${esc(E.SCORE_DESCRIPTION || '战胜异兽、击败首领与保留命火计入行分，随难度修正。')}</p><div class="result-actions"><button class="primary-button" data-action="new-run">再入山海 <span>↗</span></button><button class="outline-button" data-action="run-summary">重看这段旅程</button><button class="text-button" data-action="replay-seed">重走同一山海</button><button class="text-button" data-action="achievements">山海留名</button></div><p style="margin-top:24px"><button class="text-button" data-action="home">归去来兮 ⟶</button></p></main>`;
  }
  function filteredCreatures() {
    const q=archiveQuery.trim().toLowerCase();
    return D.creatures.filter(c=>(!archiveCategory || c.category===archiveCategory) && (!archiveSeen || meta.seen.includes(c.id)) && (!q || [c.name,c.heading,c.excerpt,c.reference,c.notes,...(c.annotation||[])].join(' ').toLowerCase().includes(q)));
  }
  function archiveView() {
    const all=filteredCreatures(), size=24, pages=Math.max(1,Math.ceil(all.length/size));
    archivePage=Math.min(archivePage,pages-1);
    const rows=all.slice(archivePage*size,(archivePage+1)*size);
    return `<main class="archive fade-enter"><div class="archive-head"><div><div class="eyebrow">THE LIVING ATLAS</div><h1>万灵卷</h1><p>古书里的名字，丹青中的山海。所有画境，皆可细看。</p></div><div class="archive-count">${D.stats.items || D.creatures.length}<small>创作条目 · ${D.stats.images} 幅作品</small></div></div><div class="archive-controls"><div class="search-box"><input id="archive-search" type="search" value="${esc(archiveQuery)}" placeholder="寻一位山海故人…" aria-label="搜索山海条目"></div><select id="archive-category" aria-label="按题材筛选"><option value="">万象 · 全部</option>${categories.map(c=>`<option ${c===archiveCategory?'selected':''}>${esc(c)}</option>`).join('')}</select><button class="outline-button" data-action="seen-filter" style="font-size:10px;padding:10px" aria-pressed="${archiveSeen}">${archiveSeen?'✓ ':' ' }途中已遇 ${meta.seen.length}</button><div class="style-tabs" role="group" aria-label="画境">${D.styles.map((s,i)=>`<button class="style-tab ${archiveStyle===i?'active':''}" data-action="archive-style" data-id="${i}" aria-pressed="${archiveStyle===i}">${esc(s.name)}</button>`).join('')}</div></div>${rows.length?`<div class="creature-grid">${rows.map(c=>`<button class="creature-tile" data-action="detail" data-id="${esc(c.id)}"><div class="image-wrap"><img src="${art(c.id,archiveStyle)}" alt="${esc(c.name)} · ${esc(D.styles[archiveStyle].name)}" loading="lazy">${meta.seen.includes(c.id)?'<span class="seen-mark">已结缘</span>':''}</div><h3>${esc(c.name)}</h3><p>${esc(c.category)} / ${esc(c.sequence)} · ${esc(c.batchId.toUpperCase())}</p></button>`).join('')}</div>`:'<div class="empty-state">此间尚无踪迹，试着换一个名字。</div>'}<div class="archive-pagination"><button data-action="archive-prev" ${archivePage===0?'disabled':''}>← 前页</button><span>第 ${archivePage+1} / ${pages} 页 · ${all.length} 条</span><button data-action="archive-next" ${archivePage>=pages-1?'disabled':''}>后页 →</button></div><p class="source-note" style="text-align:center;margin-top:35px">条目保留各批次原始顺序与同名版本。五行、契牌能力与冒险情节为本游戏创作；文献原文与考据另见条目详情。</p></main>`;
  }

  function achievementGrid(compact=false) {
    const all=P.getAchievements(meta,run);
    return `<div class="achievement-grid ${compact?'compact':''}">${all.map(a=>`<div class="achievement ${a.unlocked?'unlocked':''}"><span class="achievement-sigil">${a.unlocked?'◇':'·'}</span><div><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p><div class="achievement-progress"><span style="width:${Math.min(100,(a.progress||0)/(a.target||1)*100)}%"></span></div><small>${a.unlocked?'已留名':`${Math.min(a.progress||0,a.target||1)} / ${a.target||1}`}</small></div></div>`).join('')}</div>`;
  }
  function journalView() {
    const achievements=P.getAchievements(meta,run),unlocked=achievements.filter(a=>a.unlocked).length;
    return `<main class="archive fade-enter"><div class="section-title"><div><div class="eyebrow">NOTES ALONG THE WAY</div><h1>行旅札记</h1><p>山川记得来路，旧卷留下回声。</p></div><button class="outline-button" data-action="settings">存档与设置 ↗</button></div><div class="journal-layout"><section class="journal-panel"><h2>此间行迹</h2><div class="journal-stat-row"><div><strong>${meta.runs}</strong><span>次远游</span></div><div><strong>${meta.wins}</strong><span>次通关</span></div><div><strong>${meta.cardsSeen.length}/24</strong><span>种已得契牌</span></div><div><strong>${meta.relicsSeen.length}/7</strong><span>件已得遗珍</span></div></div>${run&&!['victory','defeat'].includes(run.phase)?`<div class="active-journey"><span class="small-label">正在进行 · ${esc(chapterLabel())}</span><p>${esc(campaignInfo().name)} · ${chapterCount()} 境 · ${esc(starterInfo().name)} · ${esc(difficultyInfo().name)} · 命火 ${run.hp}/${run.maxHp}</p><button class="text-button" data-action="continue">续写这段旅程 ⟶</button></div>`:''}<div class="journey-records">${meta.history.length?meta.history.slice().reverse().map((h,i)=>`<button class="record" data-action="history-detail" data-id="${meta.history.length-i-1}"><span><b>${h.win?'照破长夜':'归途再会'}</b><small>${esc(campaignInfo(h.campaign||'classic').name)} · ${h.chapterCount||3} 境 · ${esc(starterInfo(h.starter).name)} · ${esc(difficultyInfo(h.difficulty).name)}</small></span><strong>${h.score??'—'} 分 <span>↗</span></strong></button>`).join(''):'<p>尚无远游的记录。执灯入山，故事便从这里开始。</p>'}</div><div class="save-actions"><button class="outline-button" data-action="export-save">导出存档</button><button class="text-button" data-action="import-save">导入存档</button></div></section><section class="journal-panel"><div class="panel-title-row"><h2>山海留名</h2><span>${unlocked} / ${achievements.length}</span></div><p>初胜、破境、集契与不同流派的远游，皆能留下名字。成就只记录行迹，无需重复刷取数值。</p>${achievementGrid(true)}<button class="text-button" data-action="achievements">展开全部行迹 ↗</button></section></div><section class="source-colophon"><h3>源自山海，游于想象</h3><p>六批次创作稿 · 282 个创作条目 · 1,692 幅六境作品。游戏情节与能力属于演绎，原文、考据与创作边界均可在万灵卷查阅。</p><button class="text-button" data-action="archive">翻阅万灵卷 ⟶</button></section></main>`;
  }

  function openModal(name, html, className='') {
    const existing=modalRoot.querySelector('.modal');
    if(!existing)lastFocus=document.activeElement;
    modalName=name;
    modalRoot.innerHTML=`<div class="modal-backdrop" data-backdrop="true"><section class="modal ${className}" role="dialog" aria-modal="true" aria-label="${esc(name)}"><button class="modal-close" data-action="close-modal" aria-label="关闭">×</button>${html}</section></div>`;
    document.body.style.overflow='hidden';app.inert=true;
    requestAnimationFrame(()=>modalRoot.querySelector('button,input')?.focus());
  }
  function closeModal(){modalRoot.innerHTML='';document.body.style.overflow='';modalName='';app.inert=false;if(lastFocus?.isConnected)lastFocus.focus();}
  function helpModal(isStart=false) {
    openModal('旅途须知',`<div class="eyebrow">BEFORE THE JOURNEY</div><h2 style="margin-top:10px">执灯人的第一课</h2><p>可选三、六、九、十二、十五或十八境远游，与各境之灵相见。命火归零时，本次远游结束；途中相逢会留在万灵卷。</p><div class="help-steps"><div class="help-step"><b>01</b><h3>观势</h3><p>先看异兽下回合的意图。要进攻，还是先积攒护盾，皆由你定。</p></div><div class="help-step"><b>02</b><h3>结契</h3><p>每回合通常有 3 点灵力。点击契牌施放，护盾抵挡伤害；灵力下回合重置。</p></div><div class="help-step"><b>03</b><h3>远游</h3><p>战后选牌，岔路择行。山亭可疗伤或悟契，行商可购牌与遗珍。</p></div></div><p><span class="key">1–9 / 0</span> 出牌　<span class="key">E</span> / <span class="key">空格</span> 结束回合（焦点在按钮上时空格操作该按钮）　<span class="key">Esc</span> 暂停　<span class="key">?</span> 规则</p><p style="margin-top:14px">护盾于下回合开始时消散；灼烧在异兽行动前造成伤害；易伤增加受到的攻击伤害，虚弱降低攻击伤害。抽牌堆用完会重洗弃牌堆；标有“消耗”的契牌只在本场移出循环，下一战仍可使用。点击状态标记与遗珍可查看效果。后续境域各有开局规则，可在舆图或战斗中查看；多段攻击逐段抵扣护盾并触发反伤。</p><div class="modal-actions"><button class="primary-button" data-action="${isStart?'begin-run':'close-modal'}">${isStart?'灯已点亮，启程':'知晓了'} <span>↗</span></button></div>`);
  }

  function settingsModal(pause=false) {
    openModal(pause?'旅途暂歇':'山海设置',`<div class="eyebrow">A QUIET MOMENT</div><h2 style="margin-top:10px">${pause?'旅途暂歇':'山海设置'}</h2><div class="setting-row"><label for="setting-sound">山海音律 <small>· 合成古调与结契音效</small></label><input id="setting-sound" type="checkbox" ${meta.sound?'checked':''}></div><div class="setting-row"><label for="setting-volume">音量</label><input id="setting-volume" type="range" min="0" max="60" value="${Math.round(meta.volume*100)}" aria-label="音量"></div><div class="setting-row"><label for="setting-motion">微光与流萤</label><input id="setting-motion" type="checkbox" ${meta.motion?'checked':''}></div><div class="save-manager"><h3>行囊备份</h3><p>${unresolvedSave?'有一份旧旅程未能读取。原始内容仍然保留，可以先导出，再开始新的远游。':storageAvailable?'进度自动保存在当前浏览器。导出可把旅程、札记与成就一同带走，在另一入口继续。':'当前浏览器无法自动保存。请导出存档后再离开窗口。'}</p><div class="save-actions"><button class="outline-button" data-action="export-save">${unresolvedSave?'导出原始存档':'导出存档'}</button><button class="outline-button" data-action="import-save">导入存档</button></div></div><div class="modal-actions"><button class="primary-button" data-action="close-modal">${pause?'继续前行':'完成'} <span>↗</span></button>${pause?'<button class="outline-button" data-action="return-home">回到卷首</button><button class="text-button" data-action="new-run">另启远游</button>':''}</div>`);
  }
  function detailModal(id,style=archiveStyle) {
    const c=creature(id);if(!c)return;
    const annotations=(c.annotation || []).filter(Boolean);
    openModal('山海条目',`<div class="detail-layout"><img class="detail-art" src="${art(id,style)}" alt="${esc(c.name)} · ${esc(D.styles[style].name)}"><div class="detail-copy"><div class="eyebrow">${esc(c.batchId.toUpperCase())} / ${esc(c.sequence)} / ${esc(c.category)}</div><h2>${esc(c.name)}</h2><div class="reference">${esc(c.heading || '')}</div><div class="style-tabs" role="group" aria-label="详情画境">${D.styles.map((s,i)=>`<button class="style-tab ${style===i?'active':''}" data-action="detail-style" data-id="${esc(c.id)}" data-style="${i}" aria-pressed="${style===i}">${esc(s.name)}</button>`).join('')}</div>${c.excerpt?`<blockquote>${esc(c.excerpt).replace(/\n/g,'<br>')}</blockquote>`:''}<p class="reference">${esc(c.reference || '原文与考据见本批次来源稿').replace(/\n/g,'<br>')}</p>${c.interpretation?`<p style="margin-top:15px">${esc(c.interpretation)}</p>`:''}${annotations.length?`<p style="color:var(--gold);font-size:10px;margin-top:15px">原稿标注 · ${esc(annotations.join(' / '))}</p>`:''}${c.notes?`<p class="source-note">${esc(c.notes).replace(/\n/g,'<br>')}</p>`:''}<div class="source-links"><a href="assets/sources/${esc(c.batchId)}.md" target="_blank" rel="noopener">完整考据稿 ↗</a><a href="${art(c.id,style)}" target="_blank" rel="noopener">查看此幅作品 ↗</a></div><p class="source-note">五行、稀有度及契牌能力为游戏创作，文献边界以本条原文与考据为准。</p></div></div>`,'detail-modal');
  }

  function deckModal(pile) {
    let cards=run.deck,title='行囊中的契牌',text=`共 ${cards.length} 张契牌。点击查看释义与觉醒效果。`;
    if(pile==='draw'){cards=run.battle.drawPile;title='抽牌堆';text='按牌名展示，不泄露抽取顺序。弃牌堆会在此堆用尽后洗入。';}
    if(pile==='discard'){cards=run.battle.discardPile;title='弃牌堆';text='施放过与回合结束时未用的契牌会来到这里。';}
    if(pile==='exhaust'){cards=run.battle.exhaustPile;title='消耗堆';text='这些契牌已在本场战斗中消耗，不会重洗。下一场战斗会重新加入牌组。';}
    cards=cards.map(c=>typeof c==='string'?c:c.id);
    if(pile==='draw')cards.sort((a,b)=>card(a).name.localeCompare(card(b).name,'zh-CN'));
    openModal(title,`<div class="eyebrow">YOUR SPIRIT PACTS</div><h2 style="margin-top:10px">${title}</h2><p>${text}</p><div class="deck-grid">${cards.map(id=>cardView(id)).join('') || '<p style="padding:30px 0">此处暂时没有契牌。</p>'}</div>`);
  }

  function journeyMapModal(setup=false) {
    const count=setup?campaignInfo(pendingSetup.campaign).chapters:chapterCount();
    const campaign=campaignInfo(setup?pendingSetup.campaign:run.campaign);
    const completed=!setup&&run.phase==='victory';
    openModal('山海舆图',`<div class="eyebrow">ATLAS OF THE JOURNEY</div><h2 style="margin-top:10px">${count}境舆图</h2><p>${esc(campaign.name)} · ${count*4} 程 · ${count} 位镇境之灵。点击任意一境，先看山川与法则。</p><div class="atlas-jumpbar" aria-label="卷册分段"><button class="outline-button" data-action="atlas-jump" data-id="0">前卷 · 第 1–${Math.min(9,count)} 境</button>${count>9?`<button class="outline-button" data-action="atlas-jump" data-id="9">新境 · 第 10–${count} 境 ↓</button>`:''}</div><div class="realm-atlas">${E.REGIONS.slice(0,count).map((r,i)=>`<button class="realm-atlas-card ${!setup&&i===run.chapter?'current':''} ${!setup&&(i<run.chapter||completed)?'done':''}" data-action="realm-preview" data-id="${i}" data-realm-index="${i}" data-setup="${setup}"><img src="${art(r.artId,2)}" alt="${esc(r.name)}" loading="lazy"><span class="atlas-order">${String(i+1).padStart(2,'0')}</span><span class="atlas-copy"><small>${setup?'前路山川':i<run.chapter||completed?'已踏过':i===run.chapter?'身在此境':'尚待远行'}</small><strong>${esc(r.name)}</strong><span>镇境 · ${esc(r.boss)}</span>${r.rule?`<em>${esc(r.rule.name)}</em>`:'<em>初境试炼</em>'}</span></button>`).join('')}</div><div class="modal-actions">${setup?'<button class="outline-button" data-action="setup-run">返回启程准备</button>':'<button class="outline-button" data-action="close-modal">继续此行</button>'}</div>`,'wide-modal atlas-modal');
  }
  function realmPreviewModal(index,setup=false) {
    const r=E.REGIONS[index];if(!r)return;
    const enemy=E.ENEMIES[r.boss];
    openModal('境域预览',`<div class="realm-preview-layout"><img src="${art(r.artId,2)}" alt="${esc(r.name)}"><section><div class="eyebrow">REALM ${String(index+1).padStart(2,'0')}</div><h2>${esc(r.name)}</h2><p class="realm-subtitle">${esc(r.subtitle)}</p><p>${esc(r.description)}</p><h3>镇境之灵 · ${esc(r.boss)}</h3><p>${enemy?.pattern.some(p=>p.hits>1)?'此境首领包含多段攻击，每一段都会独立结算护盾与反伤。':'观察进攻、守御与蓄势的轮转，选择合适的出牌时机。'}</p><h3>${r.rule?esc(r.rule.name):'初境试炼'}</h3><p>${r.rule?esc(r.rule.description):'此境没有额外开局法则，遵循标准灵力、抽牌与护盾规则。'}</p><p class="source-note">境域与试炼情节为游戏演绎；形象与文献原型见万灵卷。</p><div class="modal-actions"><button class="outline-button" data-action="${setup?'campaign-map':'journey-map'}">返回舆图</button></div></section></div>`,'wide-modal realm-preview-modal');
  }
  function realmRuleModal(){realmPreviewModal(run.chapter,false);}
  function setupRunModal(preset) {
    if(preset)pendingSetup={...pendingSetup,...preset};
    openModal('启程准备',`<div class="eyebrow">CHOOSE YOUR PATH</div><h2 style="margin-top:10px">此行，如何入山</h2><p>三种灵契，自成一派。选择卷册，决定这一回走多远。</p><h3>远游卷册</h3><div class="campaign-grid">${E.CAMPAIGNS.map(c=>`<button class="campaign-option ${pendingSetup.campaign===c.id?'selected':''}" data-action="select-campaign" data-id="${c.id}" aria-pressed="${pendingSetup.campaign===c.id}"><span class="campaign-number">${String(c.chapters).padStart(2,'0')}</span><strong>${esc(c.name)} · ${c.chapters} 境</strong><small>${c.chapters*4} 程 / ${c.chapters} 位首领</small><p>${esc(c.description)}</p></button>`).join('')}</div><button class="text-button campaign-preview" data-action="campaign-map">查看所选卷册的山海舆图 ↗</button><h3>本命灵契</h3><div class="starter-grid">${E.STARTERS.map(s=>`<button class="starter-option ${pendingSetup.starter===s.id?'selected':''}" data-action="select-starter" data-id="${s.id}" aria-pressed="${pendingSetup.starter===s.id}"><img src="${art(s.creatureId,2)}" alt=""><span class="starter-copy"><small>${esc(s.title)}</small><strong>${esc(s.name)}</strong><span>${esc(s.description)}</span><em>命火 ${s.maxHp} · ${s.deck.length} 张契牌 · ${esc(s.relics.map(id=>relic(id).name).join('、'))}</em></span></button>`).join('')}</div><h3>远游试炼</h3><div class="difficulty-grid">${E.DIFFICULTIES.map(d=>`<button class="difficulty-option ${pendingSetup.difficulty===d.id?'selected':''}" data-action="select-difficulty" data-id="${d.id}" aria-pressed="${pendingSetup.difficulty===d.id}"><strong>${esc(d.name)}</strong><span>${esc(d.description)}</span></button>`).join('')}</div><div class="seed-setting"><label for="journey-seed">山海种子 <small>· 留空开启新旅程，同一种子与选择可重现同一局</small></label><input id="journey-seed" type="text" maxlength="40" value="${esc(pendingSetup.seed)}" placeholder="交给山风决定"></div><div class="setup-foot"><button class="text-button" data-action="starter-deck">查看初始契牌 ↗</button><button class="primary-button" data-action="confirm-start">执灯入山 <span>↗</span></button></div>`,'setup-modal');
  }
  function newRun() {
    closeModal();
    const params=new URLSearchParams(location.search);
    const seed=pendingSetup.seed.trim()||params.get('seed')||Date.now();
    run=E.newRun(seed,{starter:pendingSetup.starter,difficulty:pendingSetup.difficulty,campaign:pendingSetup.campaign});
    run.startedAt=Date.now();run.runId=`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
    if(unresolvedSave){try{localStorage.setItem('shanhai-nightwalk:recovery:v1',originalRunText||damagedSaveText||'');}catch{}}
    unresolvedSave=false;meta.runs++;view='game';
    const unlocked=P.observe(meta,run);save();render();window.scrollTo(0,0);tone('start');milestone(unlocked);
  }
  function requestNewRun() {
    if(run&&!['victory','defeat'].includes(run.phase))openModal('另启旅程','<h2>另点一盏灯</h2><p>当前旅程将被新旅程替换。可以先导出存档；万灵卷、成就与札记会保留。</p><div class="modal-actions"><button class="primary-button" data-action="setup-run">准备新旅程 ↗</button><button class="text-button" data-action="export-save">先导出存档</button><button class="text-button" data-action="close-modal">继续当前旅程</button></div>');
    else setupRunModal();
  }
  function chooseDeckModal(mode) {
    deckChoiceMode=mode;
    const isUpgrade=mode!=='remove';
    const entries=run.deck.map((id,index)=>({id,index})).filter(c=>mode==='remove'||!c.id.endsWith('+'));
    if(!entries.length&&isUpgrade){perform(mode==='event-upgrade'?{type:'chooseEvent',id:'bird_upgrade'}:{type:'rest',choice:'upgrade'});return;}
    openModal(isUpgrade?'选择觉醒契牌':'选择移除契牌',`<div class="eyebrow">REFINE YOUR PACTS</div><h2 style="margin-top:10px">${isUpgrade?'静心悟契':'澄心忘契'}</h2><p>${isUpgrade?'选择一张契牌，觉醒效果列于下方；只有选定后才会消耗这次歇脚。':`移除这一局牌组中的一张契牌，花费 ${run.shop.removeCost} 灵玉。每位行商限一次。`}</p><div class="deck-selection-grid">${entries.map(({id,index})=>`<div class="deck-selection">${cardView(id)}${isUpgrade?`<p class="upgrade-preview"><b>觉醒后</b>${esc(card(id+'+').description)}</p>`:''}<button class="outline-button" data-action="commit-deck-choice" data-id="${index}">${isUpgrade?'觉醒此契':'移除此契'}</button></div>`).join('')}</div>`,'wide-modal');
  }
  function inspectCard(id) {
    const c=card(id),upgraded=id.endsWith('+');
    openModal('契牌释义',`<div class="eyebrow">A PACT WITH THE SPIRIT</div><div class="inspect-card-layout"><div>${cardView(id,{action:'noop'})}</div><div><h2>${esc(c.name)}</h2><p class="reference">${c.cost} 灵力 · ${typeNames[c.type]} · ${rarityNames[c.rarity]}</p><p style="margin-top:15px;color:var(--ink)">${esc(c.description)}</p>${upgraded?'<p class="upgrade-preview">此契已觉醒。</p>':`<div class="upgrade-preview"><b>觉醒 · ${esc(card(id+'+').name)}</b><p>${esc(card(id+'+').description)}</p></div>`}<p>消耗：本场使用后移出循环，下场恢复。力量加成只作用于攻击伤害；多段攻击逐段计算。</p><button class="text-button" data-action="detail" data-id="${esc(c.artId)}">查看山海原型 ↗</button></div></div>`);
  }
  function relicModal(id) {
    const list=id?[relic(id)]:run.relics.map(relic);
    openModal('行旅遗珍',`<div class="eyebrow">KEEPSAKES ALONG THE WAY</div><h2 style="margin-top:10px">行旅遗珍</h2><p>效果在本次远游中持续生效。点击任意时刻的遗珍标记，皆可重看。</p><div class="relic-details">${list.map(r=>`<article><span>${esc(r.icon||'◇')}</span><div><h3>${esc(r.name)}</h3><p>${esc(r.description)}</p>${r.id==='ember'&&run.flags?.emberUsed?'<small>本次远游已触发</small>':''}</div></article>`).join('')||'<p>尚未获得遗珍。</p>'}</div>`);
  }
  function statusModal(id) {
    const text={block:['护盾','抵挡等量的攻击伤害。你的护盾在下回合开始时消散；异兽护盾在它下一次行动前消散。灼烧与反伤不受护盾阻挡。'],strength:['力量','每点力量为每一段攻击增加 1 点伤害，持续本场战斗。'],thorns:['反伤','异兽攻击后，受到等于反伤数值的伤害。反伤不受护盾阻挡。'],vulnerable:['易伤','受到的攻击伤害增加 50%，向下取整。每次异兽行动后减少 1 回合。'],weak:['虚弱','异兽攻击伤害降低 25%，向下取整。意图数值会即时反映此效果。'],burn:['灼烧','在异兽行动前造成等于层数的伤害，无视护盾，然后层数减少 1。灼烧致命时，异兽不再行动。']};
    const info=text[id]||['山海灵息','本场战斗中生效的灵契效果。'];
    openModal('状态释义',`<div class="eyebrow">KNOW THE FLOW</div><h2 style="margin-top:10px">${info[0]}</h2><p>${info[1]}</p><div class="modal-actions"><button class="outline-button" data-action="close-modal">知晓了</button></div>`);
  }
  function achievementsModal(){openModal('山海留名',`<div class="eyebrow">NAMES THAT REMAIN</div><h2 style="margin-top:10px">山海留名</h2><p>以不同的方式走入山海，留下属于你的行迹。</p>${achievementGrid()}`,'wide-modal');}
  function journeyModal(record) {
    const r=record||run;if(!r)return;
    const stats=r.stats||{battles:r.battles,cardsPlayed:r.cardsPlayed,damageDealt:r.damage};
    const events=r.journey||r.history||[],deck=Array.isArray(r.deck)?r.deck:[],relics=Array.isArray(r.relics)?r.relics:[];
    openModal('远游回顾',`<div class="eyebrow">YOUR STORY IN SHANHAI</div><h2 style="margin-top:10px">${r.win||r.phase==='victory'?'长夜终有明':'山海行迹'}</h2><div class="run-context"><span>${esc(campaignInfo(r.campaign||'classic').name)} · ${r.chapterCount||3} 境</span><span>${esc(starterInfo(r.starter).name)}</span><span>${esc(difficultyInfo(r.difficulty).name)}</span></div><p>种子 ${esc(r.seed??'旧旅程')} · ${stats.battles||0} 场试炼 · ${stats.cardsPlayed||0} 次出牌 · ${stats.damageDealt||0} 伤害</p>${r.hp!==undefined?`<p>命火 ${r.hp} / ${r.maxHp} · 行分 ${r.score??E.getScore(r)}</p>`:''}${events.length?`<div class="journey-timeline">${events.map(e=>`<div><span>${esc(chapterNames[e.chapter]||'山海')} · ${Number(e.step||0)+1}</span><p>${esc(e.text)}</p></div>`).join('')}</div>`:'<p class="source-note">这份旧札记仅记录了简要结果。新的远游会保留完整路线、牌组与遗珍。</p>'}${relics.length?`<h3>同行遗珍</h3><p>${esc(relics.map(id=>relic(id).name).join(' · '))}</p>`:''}${deck.length?`<h3>此行契牌 · ${deck.length}</h3><div class="deck-grid">${deck.map(id=>cardView(id)).join('')}</div>`:''}`,'wide-modal');
  }
  function downloadText(text,name) {
    const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportSave() {
    const text=unresolvedSave?(originalRunText||damagedSaveText):P.exportSave(meta,run);
    downloadText(text,unresolvedSave?'山海-待恢复原始存档.json':'山海-照夜行-存档.json');
    toast('存档已导出，请保留下载的 JSON 文件。');
  }
  async function previewImport(file) {
    if(!file)return;
    try {
      if(file.size>2*1024*1024)throw new Error('存档文件不能超过 2 MB。');
      pendingImport=P.parseSave(await file.text());
      const r=pendingImport.run;
      openModal('导入存档',`<div class="eyebrow">BRING YOUR JOURNEY HOME</div><h2 style="margin-top:10px">接回这段旅程</h2><p>备份中包含 ${pendingImport.meta.runs} 次远游、${pendingImport.meta.wins} 次通关，以及 ${pendingImport.meta.achievements.length} 项成就。</p><p style="margin-top:15px">${r?`${esc(campaignInfo(r.campaign||'classic').name)} · ${r.chapterCount||3} 境<br>${esc(starterInfo(r.starter).name)} · ${esc(difficultyInfo(r.difficulty).name)}<br>${esc(chapterNames[r.chapter])} · 命火 ${r.hp} / ${r.maxHp}`:'没有正在进行的旅程，札记与成就可恢复。'}</p><p class="source-note">导入会替换当前旅程与札记。确认前可以先导出当前存档。</p><div class="modal-actions"><button class="primary-button" data-action="confirm-import">导入此存档 ↗</button><button class="outline-button" data-action="export-save">先导出当前存档</button></div>`);
    }catch(error){pendingImport=null;toast(error.message||'无法读取这份存档。');}
    finally{document.getElementById('save-file').value='';}
  }

  function perform(action) {
    if(!run)return;
    const beforePhase=run.phase,oldEnemy=run.battle?.enemy?.hp,oldHp=run.hp;
    const focused=document.activeElement?.closest('[data-action]');
    const handIndex=action.type==='playCard'?run.battle?.hand.findIndex(c=>c.uid===action.uid):-1;
    try {E.act(run,action);}catch(error){console.error(error);toast('这一步未能完成，请重新选择。');return;}
    if(beforePhase!==run.phase)document.querySelectorAll('.floating-number').forEach(e=>e.remove());
    const unlocked=P.observe(meta,run);
    if(['victory','defeat'].includes(run.phase)&&!run.recorded){unlocked.push(...P.finish(meta,run));tone(run.phase==='victory'?'victory':'defeat');}
    save();render();milestone([...new Set(unlocked)]);
    if(action.type==='playCard'){
      const damage=oldEnemy-(run.battle?.enemy?.hp??oldEnemy);
      if(damage>0){document.getElementById('battle-scene')?.classList.add('hit');floating(damage);tone('attack');}else tone('card');
      if(run.phase==='combat') {
        const cards=[...document.querySelectorAll('.hand-area [data-action="play"]')];
        const position=Math.min(Math.max(handIndex,0),cards.length-1);
        const target=cards.slice(position).find(c=>!c.disabled)||cards.slice(0,position).reverse().find(c=>!c.disabled)||document.querySelector('[data-action="end-turn"]');
        target?.focus({preventScroll:true});
      }
    }else if(action.type==='endTurn'){
      if(run.hp<oldHp){document.getElementById('battle-scene')?.classList.add('player-hit');tone('hurt');}else tone('turn');
      if(run.phase==='combat')document.querySelector('[data-action="end-turn"]')?.focus({preventScroll:true});
    }else if(action.type==='chooseReward')tone('reward');else tone('click');
    if(beforePhase!==run.phase)window.scrollTo(0,0);
    if(run.message&&run.message!==lastMessage){
      if(action.type!=='playCard'&&action.type!=='endTurn'||run.message.includes('不足'))toast(run.message);
      lastMessage=run.message;
    }
  }
  let lastMessage='';
  function floating(n){const el=document.querySelector('.enemy-portrait');if(!el)return;const r=el.getBoundingClientRect(),f=document.createElement('span');f.className='floating-number';f.textContent='−'+n;f.style.left=(r.left+r.width/2-20)+'px';f.style.top=(r.top+r.height/3)+'px';document.body.append(f);setTimeout(()=>f.remove(),1100);}
  function changeView(next){closeModal();view=next;render();window.scrollTo(0,0);}
  document.addEventListener('click', event=>{
    const b=event.target.closest('[data-action]');
    if(!b){if(event.target.matches('[data-backdrop]'))closeModal();return;}
    if(b.disabled)return;
    const action=b.dataset.action,id=b.dataset.id;
    if(action==='home'||action==='return-home')changeView('home');
    else if(action==='archive')changeView('archive');
    else if(action==='journal')changeView('journal');
    else if(action==='start'||action==='new-run')requestNewRun();
    else if(action==='setup-run')setupRunModal();
    else if(action==='select-campaign'){pendingSetup.campaign=id;setupRunModal();modalRoot.querySelector(`[data-action="select-campaign"][data-id="${id}"]`)?.focus({preventScroll:true});}
    else if(action==='journey-map')journeyMapModal();
    else if(action==='campaign-map')journeyMapModal(true);
    else if(action==='atlas-jump'){
      const panel=modalRoot.querySelector('.modal'),target=panel?.querySelector(`[data-realm-index="${id}"]`);
      if(panel&&target){const top=Number(id)===0?0:target.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop-72;panel.scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
    }
    else if(action==='realm-preview')realmPreviewModal(Number(id),b.dataset.setup==='true');
    else if(action==='realm-rule')realmRuleModal();
    else if(action==='select-starter'){pendingSetup.starter=id;setupRunModal();}
    else if(action==='select-difficulty'){pendingSetup.difficulty=id;setupRunModal();}
    else if(action==='confirm-start'){if(!meta.tutorial)helpModal(true);else newRun();}
    else if(action==='replay-seed'){pendingSetup={starter:run.starter,difficulty:run.difficulty,campaign:run.campaign||'classic',seed:String(run.seed)};setupRunModal();}
    else if(action==='starter-deck'){const s=starterInfo(pendingSetup.starter);openModal('初始契牌',`<h2>${esc(s.name)}</h2><p>${esc(s.description)}</p><div class="deck-grid">${s.deck.map(id=>cardView(id)).join('')}</div><div class="modal-actions"><button class="outline-button" data-action="setup-run">返回启程准备</button></div>`);}
    else if(action==='begin-run'){meta.tutorial=true;newRun();}
    else if(action==='continue'){changeView('game');}
    else if(action==='help')helpModal();
    else if(action==='close-modal')closeModal();
    else if(action==='settings')settingsModal();
    else if(action==='pause')settingsModal(true);
    else if(action==='sound'){meta.sound=!meta.sound;save();setupAudio();render();toast(meta.sound?'山海音律已开启':'山海音律已静音');}
    else if(action==='node')perform({type:'chooseNode',id});
    else if(action==='play')perform({type:'playCard',uid:id});
    else if(action==='end-turn')perform({type:'endTurn'});
    else if(action==='reward')perform({type:'chooseReward',id});
    else if(action==='skip-reward')perform({type:'skipReward'});
    else if(action==='event-choice'){if(id==='bird_upgrade')chooseDeckModal('event-upgrade');else perform({type:'chooseEvent',id});}
    else if(action==='rest-heal')perform({type:'rest',choice:'heal'});
    else if(action==='rest-upgrade')chooseDeckModal('upgrade');
    else if(action==='buy-card')perform({type:'buyCard',id});
    else if(action==='buy-relic')perform({type:'buyRelic',id});
    else if(action==='leave-shop')perform({type:'leaveShop'});
    else if(action==='deck')deckModal();
    else if(action==='inspect-card')inspectCard(id);
    else if(action==='status-info')statusModal(id);
    else if(action==='relic-info')relicModal(id);
    else if(action==='relics')relicModal();
    else if(action==='exhaust-pile')deckModal('exhaust');
    else if(action==='remove-card')chooseDeckModal('remove');
    else if(action==='commit-deck-choice'){const request=deckChoiceMode==='remove'?{type:'removeCard',index:Number(id)}:deckChoiceMode==='event-upgrade'?{type:'chooseEvent',id:'bird_upgrade',index:Number(id)}:{type:'rest',choice:'upgrade',index:Number(id)};closeModal();perform(request);}
    else if(action==='achievements'){closeModal();achievementsModal();}
    else if(action==='run-summary')journeyModal();
    else if(action==='history-detail')journeyModal(meta.history[Number(id)]);
    else if(action==='combat-log')openModal('山中回响',`<h2>山中回响</h2><p>${esc(E.getIntentDescription(run))}</p><div class="full-combat-log">${run.battle.log.map(l=>`<p>${esc(l)}</p>`).join('')}</div>`);
    else if(action==='export-save')exportSave();
    else if(action==='import-save')document.getElementById('save-file').click();
    else if(action==='confirm-import'&&pendingImport){meta=pendingImport.meta;run=pendingImport.run;pendingImport=null;unresolvedSave=false;closeModal();view=run&&!['victory','defeat'].includes(run.phase)?'game':'journal';const unlocked=run?P.observe(meta,run):[];if(run&&['victory','defeat'].includes(run.phase)&&!run.recorded)unlocked.push(...P.finish(meta,run));save();render();setupAudio();milestone([...new Set(unlocked)]);toast('存档已接回，山海仍在。');}
    else if(action==='draw-pile')deckModal('draw');
    else if(action==='discard-pile')deckModal('discard');
    else if(action==='detail')detailModal(id);
    else if(action==='detail-style')detailModal(id,Number(b.dataset.style));
    else if(action==='archive-style'){archiveStyle=Number(id);render();}
    else if(action==='seen-filter'){archiveSeen=!archiveSeen;archivePage=0;render();}
    else if(action==='archive-prev'||action==='archive-next'){archivePage+=action==='archive-prev'?-1:1;render();window.scrollTo(0,0);}
  });
  let searchTimer;
  document.addEventListener('input',event=>{
    const t=event.target;
    if(t.id==='journey-seed')pendingSetup.seed=t.value;
    if(t.id==='archive-search'){archiveQuery=t.value;archivePage=0;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const cursor=t.selectionStart;render();const field=document.getElementById('archive-search');field.focus();try{field.setSelectionRange(cursor,cursor);}catch{}},200);}
    if(t.id==='setting-volume'){meta.volume=Number(t.value)/100;if(audioGain)audioGain.gain.setTargetAtTime(meta.volume,audioContext.currentTime,.1);save();}
  });
  document.addEventListener('change',event=>{
    const t=event.target;
    if(t.id==='save-file')previewImport(t.files?.[0]);
    if(t.id==='archive-category'){archiveCategory=t.value;archivePage=0;render();}
    if(t.id==='setting-sound'){meta.sound=t.checked;save();setupAudio();render();}
    if(t.id==='setting-motion'){meta.motion=t.checked;save();document.getElementById('motes').style.display=meta.motion?'':'none';}
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Tab'&&modalName){
      const items=[...modalRoot.querySelectorAll('button:not(:disabled),a,input,select')].filter(e=>e.offsetParent!==null);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;
    }
    if(/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.repeat){if(view==='game'&&run?.phase==='combat'&&/^[0-9eE ]$/.test(event.key))event.preventDefault();return;}
    if(event.key==='Escape'){event.preventDefault();if(modalName)closeModal();else if(view==='game')settingsModal(true);return;}
    if(modalName)return;
    if(event.key==='?'){helpModal();return;}
    if(view==='game'&&run?.phase==='combat'){
      if(event.key===' '&&event.target.closest('button,a'))return;
      if(event.key===' '||event.key.toLowerCase()==='e'){event.preventDefault();perform({type:'endTurn'});}
      else if(/^[0-9]$/.test(event.key)){event.preventDefault();const index=event.key==='0'?9:Number(event.key)-1,c=run.battle.hand[index];if(c)perform({type:'playCard',uid:c.uid});}
    }
  });
  function setupAudio(){
    if(!meta.sound){if(audioContext?.state==='running')audioContext.suspend();clearInterval(ambientTimer);ambientTimer=null;return;}
    try{
      if(!audioContext){audioContext=new(window.AudioContext||window.webkitAudioContext)();audioGain=audioContext.createGain();audioGain.gain.value=meta.volume;audioGain.connect(audioContext.destination);}
      audioContext.resume();if(!ambientTimer){ambient();ambientTimer=setInterval(ambient,6000);}
    }catch{meta.sound=false;toast('此浏览器暂不支持山海音律。');}
  }
  function note(frequency,delay=0,duration=.8,gain=.2,type='sine'){
    if(!meta.sound||!audioContext||audioContext.state!=='running')return;
    const osc=audioContext.createOscillator(),env=audioContext.createGain(),now=audioContext.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(frequency,now);env.gain.setValueAtTime(0,now);env.gain.linearRampToValueAtTime(gain,now+.025);env.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(env);env.connect(audioGain);osc.start(now);osc.stop(now+duration+.05);
    osc.onended=()=>{osc.disconnect();env.disconnect();};
  }
  function ambient(){[146.83,220,293.66,329.63,440].forEach((f,i)=>note(f,i*.65,3,.045));}
  function tone(kind){if(meta.sound&&!audioContext)setupAudio();const tones={click:[440],card:[440,659],attack:[196,294,392],hurt:[110,103],turn:[294,440],reward:[330,440,659],start:[220,294,440,587],victory:[294,440,587,659,880],defeat:[220,196,147]};(tones[kind]||tones.click).forEach((f,i)=>note(f,i*.07,kind==='attack'?.3:.75,kind==='hurt'?.16:.13));}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audioContext?.suspend();}else if(meta.sound&&audioContext)audioContext.resume();});
  function motes(){
    const canvas=document.getElementById('motes'),ctx=canvas.getContext('2d');if(!ctx)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w=innerWidth,h=innerHeight,particles=[];
    function resize(){w=innerWidth;h=innerHeight;canvas.width=w;canvas.height=h;particles=Array.from({length:Math.min(45,Math.floor(w/30))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.2+.3,s:Math.random()*.18+.08,a:Math.random()*.4+.1,p:Math.random()*6}));}
    resize();addEventListener('resize',resize);
    let last=0;
    function draw(t){requestAnimationFrame(draw);if(t-last<40||document.hidden||!meta.motion||reduced)return;last=t;ctx.clearRect(0,0,w,h);particles.forEach(p=>{p.y-=p.s;p.x+=Math.sin(t*.0003+p.p)*.15;if(p.y<0)p.y=h;ctx.fillStyle=`rgba(224,204,146,${p.a*(.7+.3*Math.sin(t*.001+p.p))})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});}
    if(!meta.motion)canvas.style.display='none';if(!reduced)requestAnimationFrame(draw);
  }
  if(run){P.observe(meta,run);if(['victory','defeat'].includes(run.phase)&&!run.recorded)P.finish(meta,run);}
  render();motes();
  if(unresolvedSave)setTimeout(()=>toast('有一份旧旅程未能读取，原始存档已保留。请在设置中导出或导入备份。'),800);
})();
