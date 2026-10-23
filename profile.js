(function (root) {
  'use strict';

  const FORMAT = 'shanhai-nightwalk-save';
  const MAX_SAVE_BYTES = 2 * 1024 * 1024;
  const MAX_JOURNEY_ENTRIES = 5000;
  const STARTERS = ['keeper', 'ember', 'tide'];
  const DIFFICULTIES = ['story', 'standard', 'ordeal'];
  const MAX_COUNT = 1000000000;
  const ACHIEVEMENTS = Object.freeze([
    { id: 'first_battle', name: '初结灵契', description: '赢得第一场战斗。', icon: '契', target: 1 },
    { id: 'first_boss', name: '破境', description: '击败任意一位镇境首领。', icon: '境', target: 1 },
    { id: 'first_victory', name: '照破长夜', description: '完成一次远行，抵达所选旅程的终点。', icon: '灯', target: 1 },
    { id: 'keeper_victory', name: '执灯归藏', description: '使用「执灯」流派完成一次远行。', icon: '卷', target: 1 },
    { id: 'ember_victory', name: '逐焰成昼', description: '使用「逐焰」流派完成一次远行。', icon: '焰', target: 1 },
    { id: 'tide_victory', name: '听潮渡夜', description: '使用听潮流派完成一次远行。', icon: '潮', target: 1 },
    { id: 'ordeal_victory', name: '问道照夜', description: '在最高难度「问道」中完成一次远行。', icon: '道', target: 1 },
    { id: 'three_elites', name: '踏遍险境', description: '在同一次远行中击败 3 位精英。', icon: '刃', target: 3 },
    { id: 'card_collector', name: '十二灵契', description: '累计收入过 12 种不同契牌；觉醒版本不重复计数。', icon: '册', target: 12 },
    { id: 'relic_collector', name: '七珍归匣', description: '累计获得过全部 7 件遗珍。', icon: '珍', target: 7 },
    { id: 'spirit_collector', name: '山海故人', description: '在战斗或奇遇中与 10 位不同生灵结缘。', icon: '缘', target: 10 },
    { id: 'battle_veteran', name: '百战前路', description: '累计赢得 30 场战斗。', icon: '征', target: 30 },
    { id: 'card_master', name: '运契如神', description: '累计施放 100 张契牌。', icon: '术', target: 100 },
    { id: 'damage_master', name: '千钧破晓', description: '累计造成 1,000 点有效伤害。', icon: '曜', target: 1000 },
    { id: 'all_starters', name: '三途同归', description: '分别使用三种流派完成远行。', icon: '道', target: 3 },
    { id: 'new_frontier', name: '卷外山海', description: '在长于三境的远行中抵达第四境。', icon: '拓', target: 4 },
    { id: 'six_realms', name: '六境远征', description: '通关一次至少六境的远行；须完成所选旅程。', icon: '远', target: 6 },
    { id: 'nine_realms', name: '山海归一', description: '通关一次至少九境的远行；须完成所选旅程。', icon: '天', target: 9 },
    { id: 'twelve_realms', name: '风雷问春', description: '通关一次至少十二境的远行；须完成所选旅程。', icon: '春', target: 12 },
    { id: 'fifteen_realms', name: '大荒行遍', description: '通关一次至少十五境的远行；须完成所选旅程。', icon: '荒', target: 15 },
    { id: 'eighteen_realms', name: '玉山归卷', description: '通关一次完整十八境远行；须完成所选旅程。', icon: '瑶', target: 18 }
  ].map(item => Object.freeze(item)));
  const achievementIds = new Set(ACHIEVEMENTS.map(item => item.id));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const count = (value, maximum = MAX_COUNT, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(maximum, Math.floor(value))) : fallback;
  const text = (value, maximum = 160) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maximum) : '';
  const safeId = value => typeof value === 'string' && /^[A-Za-z0-9_:.-]{1,160}$/.test(value) ? value : '';

  function engine() {
    if (root.SHANHAI_ENGINE) return root.SHANHAI_ENGINE;
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') return require('./engine.js');
    return null;
  }
  function campaigns() {
    return engine()?.CAMPAIGNS || [
      { id: 'classic', chapters: 3 }, { id: 'expanded', chapters: 6 }, { id: 'odyssey', chapters: 9 },
      { id: 'expedition12', chapters: 12 }, { id: 'saga15', chapters: 15 }, { id: 'legend18', chapters: 18 }
    ];
  }
  function validCampaign(raw) {
    const hasCampaign = own(raw, 'campaign'), hasCount = own(raw, 'chapterCount');
    if (!hasCampaign && !hasCount) return true;
    return hasCampaign && hasCount && campaigns().some(item => item.id === raw.campaign && item.chapters === raw.chapterCount);
  }
  function campaignInfo(raw) {
    return campaigns().find(item => item.id === raw?.campaign && item.chapters === raw?.chapterCount) || campaigns().find(item => item.id === 'classic');
  }
  function creatureRows() {
    const data = root.GAME_DATA || {};
    const source = data.creatures || data.beasts || data.catalog;
    return source ? (Array.isArray(source) ? source : Object.values(source)) : null;
  }
  function uniqueIds(raw, valid, maximum = 5000) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.filter(id => typeof id === 'string' && id.length <= 160 && (!valid || valid.has(id))))].slice(0, maximum);
  }
  function cardIds(raw) {
    const available = new Set((engine()?.CARDS || []).map(card => card.id));
    return uniqueIds(Array.isArray(raw) ? raw.map(id => typeof id === 'string' ? id.replace(/\+$/, '') : null) : [], available.size ? available : null, 1000);
  }
  function relicIds(raw) {
    const available = new Set((engine()?.RELICS || []).map(relic => relic.id));
    return uniqueIds(raw, available.size ? available : null, 1000);
  }
  function seenIds(raw) {
    const rows = creatureRows();
    return uniqueIds(raw, rows ? new Set(rows.map(row => row.id)) : null);
  }
  function defaults() {
    return {
      version: 2, seen: [], runs: 0, wins: 0, history: [], tutorial: false,
      sound: false, volume: 0.22, motion: true, achievements: [], cardsSeen: [],
      relicsSeen: [], completedStarters: [], totalBattles: 0, totalCardsPlayed: 0, totalDamage: 0
    };
  }
  function normalizeJourney(raw, chapterCount) {
    if (!Array.isArray(raw)) return [];
    return raw.slice(-MAX_JOURNEY_ENTRIES).filter(plain).map(item => ({
      chapter: count(item.chapter, chapterCount - 1), step: count(item.step, 3),
      type: text(item.type, 32), text: text(item.text, 500)
    }));
  }
  function normalizeHistory(raw) {
    if (!Array.isArray(raw)) return [];
    const entries = raw.filter(item => plain(item) && typeof item.win === 'boolean' && validCampaign(item)).slice(-20).map(item => {
      const campaign = campaignInfo(item);
      const result = {
        id: safeId(item.id), win: item.win, chapter: count(item.chapter, campaign.chapters - 1),
        campaign: campaign.id, chapterCount: campaign.chapters,
        battles: count(item.battles, 100000), cards: count(item.cards, 1000),
        seed: typeof item.seed === 'number' && Number.isFinite(item.seed) ? item.seed : text(item.seed, 160),
        starter: STARTERS.includes(item.starter) ? item.starter : 'keeper',
        difficulty: DIFFICULTIES.includes(item.difficulty) ? item.difficulty : 'standard',
        score: count(item.score), damage: count(item.damage), cardsPlayed: count(item.cardsPlayed),
        bosses: own(item, 'bosses') ? count(item.bosses, campaign.chapters) : item.win ? campaign.chapters : count(item.chapter, campaign.chapters - 1),
        elites: count(item.elites, campaign.chapters), hp: count(item.hp, 100000), maxHp: count(item.maxHp, 100000),
        ink: count(item.ink), startedAt: count(item.startedAt, Number.MAX_SAFE_INTEGER),
        endedAt: count(item.endedAt, Number.MAX_SAFE_INTEGER), duration: count(item.duration, 31536000000),
        relics: relicIds(item.relics), deck: Array.isArray(item.deck) ? item.deck.filter(id => typeof id === 'string' && engine()?.getCard(id)).slice(0, 1000) : [],
        journey: normalizeJourney(item.journey, campaign.chapters)
      };
      result.stats = {
        battles: result.battles, cardsPlayed: result.cardsPlayed, damageDealt: result.damage,
        bosses: result.bosses, elites: result.elites, cardsRemoved: count(item.stats?.cardsRemoved, 1000)
      };
      return result;
    });
    const ids = new Set();
    return entries.filter(entry => !entry.id || (!ids.has(entry.id) && ids.add(entry.id)));
  }
  function normalizeMeta(raw) {
    const result = defaults();
    if (!plain(raw)) return result;
    result.seen = seenIds(raw.seen);
    result.runs = count(raw.runs, 1000000);
    result.wins = count(raw.wins, 1000000);
    result.history = normalizeHistory(raw.history);
    ['tutorial', 'sound', 'motion'].forEach(key => { if (typeof raw[key] === 'boolean') result[key] = raw[key]; });
    if (typeof raw.volume === 'number' && Number.isFinite(raw.volume)) result.volume = Math.max(0, Math.min(0.6, raw.volume));
    result.achievements = uniqueIds(raw.achievements, achievementIds, ACHIEVEMENTS.length);
    result.cardsSeen = cardIds([...(Array.isArray(raw.cardsSeen) ? raw.cardsSeen : []), ...result.history.flatMap(item => item.deck)]);
    result.relicsSeen = relicIds([...(Array.isArray(raw.relicsSeen) ? raw.relicsSeen : []), ...result.history.flatMap(item => item.relics)]);
    result.completedStarters = uniqueIds([
      ...(Array.isArray(raw.completedStarters) ? raw.completedStarters : []),
      ...result.history.filter(item => item.win).map(item => item.starter),
      ...STARTERS.filter(id => result.achievements.includes(id + '_victory'))
    ], new Set(STARTERS), 3);
    result.totalBattles = Math.max(count(raw.totalBattles), Math.min(MAX_COUNT, result.history.reduce((sum, item) => sum + item.battles, 0)));
    result.totalCardsPlayed = Math.max(count(raw.totalCardsPlayed), Math.min(MAX_COUNT, result.history.reduce((sum, item) => sum + item.cardsPlayed, 0)));
    result.totalDamage = Math.max(count(raw.totalDamage), Math.min(MAX_COUNT, result.history.reduce((sum, item) => sum + item.damage, 0)));
    result.wins = Math.max(result.wins, result.history.filter(item => item.win).length);
    result.runs = Math.max(result.runs, result.wins, result.history.length);
    // The original game had a single starter. Retain this proven legacy win
    // without inventing battle totals when its short history is unavailable.
    if (raw.version !== 2 && result.wins > 0 && !result.completedStarters.length) result.completedStarters.push('keeper');
    return result;
  }
  function mutateMeta(meta) {
    const normalized = normalizeMeta(meta);
    Object.keys(meta).forEach(key => { delete meta[key]; });
    Object.assign(meta, normalized);
    return meta;
  }
  function runStats(run) {
    const stats = plain(run?.stats) ? run.stats : {};
    const chapterCount = campaignInfo(run).chapters;
    return {
      battles: count(stats.battles, 100000), cardsPlayed: count(stats.cardsPlayed),
      damageDealt: count(stats.damageDealt), bosses: count(stats.bosses, chapterCount),
      elites: count(stats.elites, chapterCount), cardsRemoved: count(stats.cardsRemoved, 1000)
    };
  }
  function alreadyRecorded(meta, run) {
    return !!run?.recorded || !!(safeId(run?.runId) && meta.history.some(item => item.id === run.runId));
  }
  function getAchievements(raw, run) {
    const meta = normalizeMeta(raw);
    const stats = runStats(run);
    const active = run && !alreadyRecorded(meta, run) ? stats : runStats(null);
    const winning = run?.phase === 'victory';
    const starters = new Set(meta.completedStarters);
    if (winning) starters.add(STARTERS.includes(run.starter) ? run.starter : 'keeper');
    const wins = Math.max(meta.wins, winning ? 1 : 0);
    const runCampaign = campaignInfo(run);
    const longProgress = target => Math.max(0,
      runCampaign.chapters >= target ? (winning && run.chapter === runCampaign.chapters - 1 && stats.bosses === runCampaign.chapters ? target : Math.min(target - 1, stats.bosses)) : 0,
      ...meta.history.filter(item => item.chapterCount >= target).map(item => item.win && item.chapter === item.chapterCount - 1 && item.bosses === item.chapterCount ? target : Math.min(target - 1, item.bosses))
    );
    const progress = {
      first_battle: Math.max(meta.totalBattles + active.battles, stats.battles, Number(wins > 0)),
      first_boss: Math.max(Number(wins > 0), stats.bosses, ...meta.history.map(item => item.bosses)),
      first_victory: wins,
      keeper_victory: Number(starters.has('keeper')),
      ember_victory: Number(starters.has('ember')),
      tide_victory: Number(starters.has('tide')),
      ordeal_victory: Number(meta.history.some(item => item.win && item.difficulty === 'ordeal') || (winning && run.difficulty === 'ordeal')),
      three_elites: Math.max(0, stats.elites, ...meta.history.map(item => item.elites)),
      card_collector: cardIds(meta.cardsSeen.concat(Array.isArray(run?.deck) ? run.deck : [])).length,
      relic_collector: relicIds(meta.relicsSeen.concat(Array.isArray(run?.relics) ? run.relics : [])).length,
      spirit_collector: meta.seen.length,
      battle_veteran: Math.max(meta.totalBattles + active.battles, stats.battles),
      card_master: Math.max(meta.totalCardsPlayed + active.cardsPlayed, stats.cardsPlayed),
      damage_master: Math.max(meta.totalDamage + active.damageDealt, stats.damageDealt),
      all_starters: starters.size,
      new_frontier: Math.max(0, runCampaign.chapters > 3 ? count(run?.chapter, runCampaign.chapters - 1) + 1 : 0, ...meta.history.filter(item => item.chapterCount > 3).map(item => item.chapter + 1)),
      six_realms: longProgress(6),
      nine_realms: longProgress(9),
      twelve_realms: longProgress(12),
      fifteen_realms: longProgress(15),
      eighteen_realms: longProgress(18)
    };
    return ACHIEVEMENTS.map(item => {
      const unlocked = meta.achievements.includes(item.id) || progress[item.id] >= item.target;
      return Object.assign({}, item, { unlocked, progress: unlocked ? item.target : Math.min(item.target, progress[item.id] || 0) });
    });
  }
  function observe(meta, run) {
    mutateMeta(meta);
    if (run) {
      meta.cardsSeen = cardIds(meta.cardsSeen.concat(Array.isArray(run.deck) ? run.deck : []));
      meta.relicsSeen = relicIds(meta.relicsSeen.concat(Array.isArray(run.relics) ? run.relics : []));
      if (run.phase === 'victory') meta.completedStarters = uniqueIds(meta.completedStarters.concat(STARTERS.includes(run.starter) ? run.starter : 'keeper'), new Set(STARTERS), 3);
      const candidates = [];
      if (run.battle?.enemy) candidates.push(run.battle.enemy.creatureId || run.battle.enemy.id);
      if (run.phase === 'event' && run.event?.creatureId) candidates.push(run.event.creatureId);
      const rows = creatureRows();
      candidates.forEach(id => {
        const creature = engine()?.getCreature(id);
        const exact = rows ? rows.find(row => row.id === id || row.name === id) || rows.find(row => row.id === creature?.id) : creature;
        if (exact?.id) meta.seen.push(exact.id);
      });
      meta.seen = seenIds(meta.seen);
    }
    const newlyUnlocked = getAchievements(meta, run).filter(item => item.unlocked && !meta.achievements.includes(item.id)).map(item => item.id);
    meta.achievements.push(...newlyUnlocked);
    return newlyUnlocked;
  }
  function finish(meta, run) {
    if (!run || !['victory', 'defeat'].includes(run.phase)) return observe(meta, run);
    const unlocked = observe(meta, run);
    if (alreadyRecorded(meta, run)) { run.recorded = true; return unlocked; }
    if (!safeId(run.runId)) run.runId = root.crypto?.randomUUID?.() || 'run-' + Date.now() + '-' + Math.random().toString(36).slice(2, 12);
    const stats = runStats(run), endedAt = Date.now(), win = run.phase === 'victory', campaign = campaignInfo(run);
    const entry = {
      id: run.runId, win, chapter: count(run.chapter, campaign.chapters - 1), battles: stats.battles,
      campaign: campaign.id, chapterCount: campaign.chapters,
      cards: Array.isArray(run.deck) ? run.deck.length : 0, seed: run.seed,
      starter: STARTERS.includes(run.starter) ? run.starter : 'keeper',
      difficulty: DIFFICULTIES.includes(run.difficulty) ? run.difficulty : 'standard',
      score: count(engine()?.getScore?.(run)), damage: stats.damageDealt, cardsPlayed: stats.cardsPlayed,
      bosses: stats.bosses, elites: stats.elites, hp: run.hp, maxHp: run.maxHp, ink: run.ink,
      relics: run.relics, deck: run.deck, journey: run.history, stats,
      startedAt: count(run.startedAt, Number.MAX_SAFE_INTEGER), endedAt,
      duration: run.startedAt > 0 ? Math.max(0, endedAt - run.startedAt) : 0
    };
    meta.history = normalizeHistory(meta.history.concat(entry));
    meta.wins = Math.min(1000000, meta.wins + Number(win));
    meta.runs = Math.max(meta.runs, meta.wins, meta.history.length);
    meta.totalBattles = Math.min(MAX_COUNT, meta.totalBattles + stats.battles);
    meta.totalCardsPlayed = Math.min(MAX_COUNT, meta.totalCardsPlayed + stats.cardsPlayed);
    meta.totalDamage = Math.min(MAX_COUNT, meta.totalDamage + stats.damageDealt);
    if (win) meta.completedStarters = uniqueIds(meta.completedStarters.concat(entry.starter), new Set(STARTERS), 3);
    run.recorded = true;
    return [...new Set(unlocked.concat(observe(meta, run)))];
  }
  function byteLength(value) {
    return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(value).byteLength : unescape(encodeURIComponent(value)).length;
  }
  function restore(raw) {
    if (raw === null) return null;
    if (!plain(raw)) throw new Error('旅程数据格式无效，请选择游戏导出的存档。');
    const restoreRun = engine()?.restoreRun;
    if (typeof restoreRun !== 'function') throw new Error('旅程校验器尚未就绪，请重新打开游戏后重试。');
    let result;
    try { result = restoreRun(raw); } catch { throw new Error('旅程数据已损坏，无法导入。'); }
    if (!result || !plain(result)) throw new Error('旅程数据已损坏，无法导入。');
    return result;
  }
  function exportSave(meta, run) {
    try {
      const result = JSON.stringify({ format: FORMAT, version: 2, exportedAt: new Date().toISOString(), meta: normalizeMeta(meta), run: run ? restore(run) : null }, null, 2);
      if (byteLength(result) > MAX_SAVE_BYTES) throw new Error('存档超过 2 MB，无法导出。');
      return result;
    } catch (error) {
      throw new Error(error?.message || '存档导出失败，请重试。');
    }
  }
  function parseSave(serialized) {
    if (typeof serialized !== 'string' || !serialized.trim()) throw new Error('存档文件为空或格式无效。');
    if (serialized.length > MAX_SAVE_BYTES || byteLength(serialized) > MAX_SAVE_BYTES) throw new Error('存档文件超过 2 MB，请选择游戏导出的存档。');
    let data;
    try { data = JSON.parse(serialized); } catch { throw new Error('存档不是有效的 JSON 文件。'); }
    if (!plain(data) || data.format !== FORMAT || ![1, 2].includes(data.version)) throw new Error('这不是受支持的《山海·照夜行》存档。');
    if (!plain(data.meta)) throw new Error('存档中的行旅档案无效。');
    const raw = data.meta;
    const numeric = ['runs', 'wins', 'totalBattles', 'totalCardsPlayed', 'totalDamage'];
    if (numeric.some(key => own(raw, key) && (typeof raw[key] !== 'number' || !Number.isSafeInteger(raw[key]) || raw[key] < 0 || raw[key] > (['runs', 'wins'].includes(key) ? 1000000 : MAX_COUNT)))) throw new Error('存档中的累计统计无效。');
    if (['seen', 'achievements', 'cardsSeen', 'relicsSeen', 'completedStarters'].some(key => own(raw, key) && (!Array.isArray(raw[key]) || raw[key].length > 5000 || raw[key].some(value => typeof value !== 'string' || value.length > 160)))) throw new Error('存档中的收集记录无效。');
    if (own(raw, 'history') && (!Array.isArray(raw.history) || raw.history.length > 20 || raw.history.some(item => !plain(item) || typeof item.win !== 'boolean'))) throw new Error('存档中的远行记录无效。');
    if (Array.isArray(raw.history) && raw.history.some(item => {
      const campaign = campaignInfo(item);
      const limits = { chapter: campaign.chapters - 1, battles: 100000, cards: 1000, score: MAX_COUNT, damage: MAX_COUNT, cardsPlayed: MAX_COUNT, bosses: campaign.chapters, elites: campaign.chapters, hp: 100000, maxHp: 100000, ink: MAX_COUNT, startedAt: Number.MAX_SAFE_INTEGER, endedAt: Number.MAX_SAFE_INTEGER, duration: 31536000000 };
      return !validCampaign(item) || Object.keys(limits).some(key => own(item, key) && (!Number.isSafeInteger(item[key]) || item[key] < 0 || item[key] > limits[key])) ||
        (campaign.chapters > 3 && item.win && (item.chapter !== campaign.chapters - 1 || (own(item, 'bosses') && item.bosses !== campaign.chapters))) ||
        (own(item, 'seed') && !(typeof item.seed === 'string' && item.seed.length <= 160) && !(typeof item.seed === 'number' && Number.isFinite(item.seed))) ||
        (own(item, 'starter') && !STARTERS.includes(item.starter)) || (own(item, 'difficulty') && !DIFFICULTIES.includes(item.difficulty)) ||
        ['deck', 'relics', 'journey'].some(key => own(item, key) && !Array.isArray(item[key])) ||
        (Array.isArray(item.journey) && (item.journey.length > MAX_JOURNEY_ENTRIES || item.journey.some(entry => !plain(entry) || ['chapter', 'step'].some(key => own(entry, key) && (!Number.isSafeInteger(entry[key]) || entry[key] < 0 || entry[key] > (key === 'chapter' ? campaign.chapters - 1 : 3))))));
    })) throw new Error('存档中的远行明细已损坏。');
    if (['tutorial', 'sound', 'motion'].some(key => own(raw, key) && typeof raw[key] !== 'boolean')) throw new Error('存档中的设置无效。');
    if (own(raw, 'volume') && (typeof raw.volume !== 'number' || !Number.isFinite(raw.volume) || raw.volume < 0 || raw.volume > 0.6)) throw new Error('存档中的音量设置无效。');
    if (!own(data, 'run')) throw new Error('存档缺少旅程字段。');
    return { meta: normalizeMeta(raw), run: restore(data.run) };
  }

  root.SHANHAI_PROFILE = Object.freeze({ defaults, normalizeMeta, ACHIEVEMENTS, getAchievements, observe, finish, exportSave, parseSave });
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SHANHAI_PROFILE;
})(typeof window !== 'undefined' ? window : globalThis);
