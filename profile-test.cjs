'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('./engine.js');
const P = require('./profile.js');

function terminal(id, options = {}) {
  const run = E.newRun('profile-' + id, { campaign: 'classic' });
  Object.assign(run, {
    phase: 'victory', chapter: 2, runId: id, startedAt: Date.now() - 5000,
    starter: 'keeper', difficulty: 'standard', hp: 30, maxHp: 80,
    stats: { battles: 8, cardsPlayed: 55, damageDealt: 510, bosses: 3, elites: 3 },
    ...options
  });
  return run;
}

function advanceUntil(run, predicate) {
  for (let guard = 0; !predicate(run) && guard < 500; guard++) {
    if (run.phase === 'map') E.act(run, { type: 'chooseNode', id: run.route.find(node => ['battle', 'elite', 'boss'].includes(node.type)).id });
    else if (run.phase === 'combat') {
      run.battle.enemy.hp = 1; run.battle.enemy.status.burn = 1;
      E.act(run, { type: 'endTurn' });
    } else if (run.phase === 'reward') E.act(run, { type: 'skipReward' });
    else assert.fail('Unexpected fixture phase: ' + run.phase);
  }
  assert.ok(predicate(run), 'fixture must reach its requested checkpoint');
  return run;
}

test('legacy metadata retains settings and records while migrating counters', () => {
  const old = { seen: ['b01-01'], runs: 9, wins: 2, history: [{ win: true, chapter: 2, battles: 6, cards: 14, seed: 7 }, { win: false, chapter: 1, battles: 3, cards: 11, seed: 'demo' }], tutorial: true, sound: true, volume: 0.3, motion: false };
  const result = P.normalizeMeta(old);
  assert.equal(result.version, 2);
  assert.equal(result.runs, 9);
  assert.equal(result.wins, 2);
  assert.equal(result.history.length, 2);
  assert.equal(result.history[0].cards, 14);
  assert.equal(result.history[0].seed, 7);
  assert.equal(result.history[1].seed, 'demo');
  assert.equal(result.history[0].campaign, 'classic');
  assert.equal(result.history[0].chapterCount, 3);
  assert.equal(result.history[0].chapter, 2);
  assert.equal(result.history[1].chapter, 1);
  assert.equal(result.totalBattles, 9);
  assert.deepEqual(result.completedStarters, ['keeper']);
  assert.equal(result.sound, true);
  assert.equal(result.volume, 0.3);
  assert.equal(result.motion, false);
  assert.deepEqual(old.seen, ['b01-01']);
  assert.equal(P.normalizeMeta(result).totalBattles, 9);
});

test('normalization removes damaged values and unrecognized fields', () => {
  const result = P.normalizeMeta({ runs: -5, wins: Infinity, history: 'wrong', sound: 'yes', volume: 9, motion: null, achievements: ['evil'], cardsSeen: ['qinggeng', 'qinggeng+', 'evil'], relicsSeen: ['jade', 'evil'], completedStarters: ['fake'], totalBattles: '999', attack: 'payload' });
  assert.equal(result.runs, 0);
  assert.equal(result.wins, 0);
  assert.equal(result.volume, 0.6);
  assert.equal(result.sound, false);
  assert.equal(result.motion, true);
  assert.deepEqual(result.cardsSeen, ['qinggeng']);
  assert.deepEqual(result.relicsSeen, ['jade']);
  assert.deepEqual(result.achievements, []);
  assert.equal(result.attack, undefined);
  assert.equal(result.totalBattles, 0);
  const left = P.defaults(), right = P.defaults();
  left.seen.push('independent');
  assert.deepEqual(right.seen, []);
});

test('browser catalog checks seen identifiers and only encounters create bonds', () => {
  const sandbox = { SHANHAI_ENGINE: E, GAME_DATA: { creatures: [{ id: 'b02-15', name: '讙' }, { id: 'b01-08', name: '九尾狐' }] } };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(require.resolve('./profile.js'), 'utf8'), sandbox);
  const module = sandbox.SHANHAI_PROFILE, meta = module.defaults();
  const run = E.newRun(5);
  module.observe(meta, run);
  assert.equal(meta.seen.length, 0);
  assert.equal(meta.cardsSeen.length, 3);
  E.act(run, { type: 'chooseNode', id: run.route.find(node => node.type === 'battle').id });
  module.observe(meta, run);
  assert.equal(meta.seen.join(','), 'b02-15');
  module.observe(meta, { ...run, battle: null, phase: 'event', event: { creatureId: '九尾狐' } });
  assert.equal(meta.seen.join(','), 'b02-15,b01-08');
  const damaged = vm.runInNewContext('({ seen: ["not-in-catalog", "b02-15", "b02-15"] })', sandbox);
  assert.equal(module.normalizeMeta(damaged).seen.join(','), 'b02-15');
});

test('achievement thresholds are visible, attainable and persist once unlocked', () => {
  const meta = P.defaults();
  const run = terminal('achievements', { difficulty: 'ordeal', deck: E.CARDS.slice(0, 12).map(card => card.id), relics: E.RELICS.map(relic => relic.id) });
  meta.seen = Array.from({ length: 10 }, (_, i) => 'creature-' + i);
  meta.totalBattles = 22; meta.totalCardsPlayed = 45; meta.totalDamage = 490;
  const unlocked = P.observe(meta, run);
  ['first_battle', 'first_boss', 'first_victory', 'keeper_victory', 'ordeal_victory', 'three_elites', 'card_collector', 'relic_collector', 'spirit_collector', 'battle_veteran', 'card_master', 'damage_master'].forEach(id => assert.ok(unlocked.includes(id), id));
  assert.deepEqual(P.observe(meta, run), []);
  assert.ok(P.ACHIEVEMENTS.length >= 10);
  assert.ok(P.getAchievements(meta).every(item => Number.isFinite(item.progress) && item.target > 0 && item.progress <= item.target));
  assert.equal(P.getAchievements(meta).find(item => item.id === 'three_elites').unlocked, true);
  assert.equal(P.getAchievements(meta).find(item => item.id === 'all_starters').progress, 1);
});

test('finish records detailed history once and preserves launch counts', () => {
  const meta = P.defaults(); meta.runs = 1;
  const run = terminal('finish-once');
  run.history = [{ chapter: 0, step: 0, type: 'win', text: '收服讙。' }];
  P.finish(meta, run);
  assert.equal(run.recorded, true);
  assert.equal(meta.runs, 1);
  assert.equal(meta.wins, 1);
  assert.equal(meta.totalBattles, 8);
  assert.equal(meta.totalCardsPlayed, 55);
  assert.equal(meta.totalDamage, 510);
  const entry = meta.history[0];
  assert.equal(entry.id, 'finish-once');
  assert.equal(entry.starter, 'keeper');
  assert.equal(entry.difficulty, 'standard');
  assert.equal(entry.hp, 30);
  assert.equal(entry.maxHp, 80);
  assert.equal(entry.journey[0].text, '收服讙。');
  assert.equal(entry.stats.elites, 3);
  assert.ok(entry.duration >= 5000);
  assert.deepEqual(entry.deck, run.deck);
  assert.deepEqual(entry.relics, run.relics);
  P.finish(meta, run);
  P.finish(meta, { ...run, recorded: false });
  assert.equal(meta.history.length, 1);
  assert.equal(meta.totalBattles, 8);
  assert.equal(meta.wins, 1);
});

test('previously recorded legacy terminals are never counted a second time', () => {
  const meta = P.normalizeMeta({ runs: 4, wins: 1, history: [{ win: true, chapter: 2, battles: 6, cards: 12, seed: 1 }] });
  const run = terminal('old-recorded', { recorded: true });
  P.finish(meta, run);
  assert.equal(meta.history.length, 1);
  assert.equal(meta.totalBattles, 6);
  assert.equal(meta.wins, 1);
});

test('legacy wins and recorded terminals recover earned achievements without recounting totals', () => {
  const meta = P.normalizeMeta({ runs: 4, wins: 1, history: [], seen: ['original-bond'] });
  const run = terminal('legacy-proof', { recorded: true });
  const unlocked = P.observe(meta, run);
  ['first_battle', 'first_boss', 'first_victory', 'keeper_victory'].forEach(id => assert.ok(unlocked.includes(id), id));
  assert.deepEqual(meta.completedStarters, ['keeper']);
  assert.equal(meta.runs, 4);
  assert.equal(meta.wins, 1);
  assert.equal(meta.totalBattles, 0);
  assert.equal(meta.totalDamage, 0);
  assert.equal(meta.history.length, 0);
  const progress = P.getAchievements(meta, run);
  assert.equal(progress.find(item => item.id === 'battle_veteran').progress, 8);
  assert.equal(progress.find(item => item.id === 'card_master').progress, 55);
  assert.equal(progress.find(item => item.id === 'damage_master').progress, 510);
  assert.deepEqual(P.observe(meta, run), []);
  assert.deepEqual(meta.seen, ['original-bond']);
  const recorded = P.normalizeMeta({ version: 2, runs: 1, wins: 1, totalBattles: 8, totalCardsPlayed: 55, totalDamage: 510 });
  const stableProgress = P.getAchievements(recorded, run);
  assert.equal(stableProgress.find(item => item.id === 'battle_veteran').progress, 8);
  assert.equal(stableProgress.find(item => item.id === 'card_master').progress, 55);
  assert.equal(stableProgress.find(item => item.id === 'damage_master').progress, 510);
});

test('normalization, achievement views and repeated imports do not increase wins or bonds', () => {
  let meta = P.normalizeMeta({ runs: 7, wins: 2, seen: ['known'], history: [{ win: true, chapter: 2, battles: 8, cards: 11, seed: 52 }] });
  const expected = JSON.stringify(meta);
  for (let repeat = 0; repeat < 4; repeat++) {
    P.getAchievements(meta);
    assert.equal(JSON.stringify(meta), expected, 'achievement views must be read-only');
    meta = P.parseSave(P.exportSave(meta, null)).meta;
    assert.equal(JSON.stringify(meta), expected);
  }
  assert.equal(meta.wins, 2);
  assert.equal(meta.totalBattles, 8);
  assert.deepEqual(meta.seen, ['known']);
});

test('achievement language agrees with actual engine starter and difficulty names', () => {
  E.STARTERS.forEach(starter => {
    assert.ok(P.ACHIEVEMENTS.find(item => item.id === starter.id + '_victory').description.includes(starter.name));
  });
  assert.ok(P.ACHIEVEMENTS.find(item => item.id === 'ordeal_victory').description.includes(E.DIFFICULTIES.find(item => item.id === 'ordeal').name));
});

test('three winning starter records unlock all paths and survive history trimming', () => {
  const meta = P.defaults();
  ['keeper', 'ember', 'tide'].forEach(starter => P.finish(meta, terminal('win-' + starter, { starter })));
  assert.ok(meta.achievements.includes('all_starters'));
  assert.equal(meta.wins, 3);
  for (let i = 0; i < 25; i++) P.finish(meta, terminal('loss-' + i, { phase: 'defeat' }));
  assert.equal(meta.history.length, 20);
  assert.deepEqual(meta.completedStarters.sort(), ['ember', 'keeper', 'tide']);
  assert.equal(P.getAchievements(meta).find(item => item.id === 'all_starters').progress, 3);
});

test('defeats contribute cumulative play without winning unlocks', () => {
  const meta = P.defaults();
  P.finish(meta, terminal('defeat', { phase: 'defeat', chapter: 0, stats: { battles: 1, cardsPlayed: 7, damageDealt: 40, bosses: 0, elites: 0 } }));
  assert.equal(meta.wins, 0);
  assert.equal(meta.totalBattles, 1);
  assert.equal(meta.totalCardsPlayed, 7);
  assert.equal(meta.totalDamage, 40);
  assert.equal(meta.history[0].win, false);
  assert.ok(!meta.achievements.includes('first_victory'));
});

test('export/import round trip preserves metadata and an active combat exactly', () => {
  assert.equal(typeof E.restoreRun, 'function', 'engine.restoreRun must be implemented for save validation');
  const run = E.newRun(82342);
  E.act(run, { type: 'chooseNode', id: run.route.find(node => node.type === 'battle').id });
  run.startedAt = Date.now(); run.runId = 'round-trip';
  const meta = P.defaults(); meta.runs = 1; P.observe(meta, run);
  const before = JSON.stringify(run);
  const serialized = P.exportSave(meta, run);
  const decoded = JSON.parse(serialized);
  assert.equal(decoded.format, 'shanhai-nightwalk-save');
  assert.equal(decoded.version, 2);
  const loaded = P.parseSave(serialized);
  assert.deepEqual(loaded.meta, P.normalizeMeta(meta));
  assert.deepEqual(loaded.run, E.restoreRun(run));
  assert.equal(loaded.run.rng, run.rng);
  assert.deepEqual(loaded.run.battle.hand, run.battle.hand);
  assert.equal(JSON.stringify(run), before, 'export must not mutate the live run');
  const nullRun = P.parseSave(P.exportSave(meta, null));
  assert.equal(nullRun.run, null);
  assert.equal(P.parseSave(JSON.stringify({ format: 'shanhai-nightwalk-save', version: 1, meta: { runs: 3, wins: 1, history: [] }, run: null })).meta.runs, 3);
});

test('recorded terminal round trip cannot duplicate wins or cumulative damage', () => {
  const meta = P.defaults(), run = E.newRun('saved-terminal', { campaign: 'classic' });
  run.startedAt = Date.now() - 5000; run.runId = 'saved-terminal';
  // Use real engine transitions so the save fixture has a coherent final boss,
  // card piles and reward. A one-point burn shortens combat for this save test.
  for (let guard = 0; run.phase !== 'victory' && guard < 100; guard++) {
    if (run.phase === 'map') E.act(run, { type: 'chooseNode', id: run.route.find(node => ['battle', 'elite', 'boss'].includes(node.type)).id });
    else if (run.phase === 'combat') {
      run.battle.enemy.hp = 1; run.battle.enemy.status.burn = 1;
      E.act(run, { type: 'endTurn' });
    } else if (run.phase === 'reward') E.act(run, { type: 'skipReward' });
    else assert.fail('Unexpected fixture phase: ' + run.phase);
  }
  assert.equal(run.phase, 'victory');
  const battles = run.stats.battles, damage = run.stats.damageDealt;
  P.finish(meta, run);
  const loaded = P.parseSave(P.exportSave(meta, run));
  assert.equal(loaded.run.recorded, true);
  assert.equal(loaded.run.runId, 'saved-terminal');
  assert.equal(loaded.run.startedAt, run.startedAt);
  P.finish(loaded.meta, loaded.run);
  assert.equal(loaded.meta.wins, 1);
  assert.equal(loaded.meta.totalBattles, battles);
  assert.equal(loaded.meta.totalDamage, damage);
  assert.equal(loaded.meta.history.length, 1);
});

test('legacy three-chapter wins never grant extended-campaign achievements', () => {
  const meta = P.normalizeMeta({ wins: 4, history: [{ win: true, chapter: 2, bosses: 3, battles: 9, journey: [{ chapter: 2, step: 3, text: '旧卷终点' }] }] });
  const run = terminal('classic-proof');
  P.finish(meta, run);
  const achievements = P.getAchievements(meta, run);
  ['new_frontier', 'six_realms', 'nine_realms'].forEach(id => assert.equal(achievements.find(item => item.id === id).unlocked, false, id));
  assert.equal(P.ACHIEVEMENTS.length, 21);
  const loaded = P.parseSave(P.exportSave(meta, null));
  assert.equal(loaded.meta.history[0].chapter, 2);
  assert.equal(loaded.meta.history[0].journey[0].chapter, 2);
  assert.equal(loaded.meta.history[0].campaign, 'classic');
});

test('active six- and nine-chapter saves retain frontier, chapter and endpoint', () => {
  for (const [campaign, chapterCount] of [['expanded', 6], ['odyssey', 9]]) {
    const run = E.newRun('active-' + campaign, { campaign });
    advanceUntil(run, state => state.phase === 'map' && state.chapter === chapterCount - 1);
    E.act(run, { type: 'chooseNode', id: run.route.find(node => node.type === 'battle').id });
    const meta = P.defaults(); meta.runs = 1;
    const unlocked = P.observe(meta, run);
    assert.ok(unlocked.includes('new_frontier'));
    const before = JSON.stringify(run);
    const loaded = P.parseSave(P.exportSave(meta, run));
    assert.equal(loaded.run.campaign, campaign);
    assert.equal(loaded.run.chapterCount, chapterCount);
    assert.equal(E.getChapterCount(loaded.run), chapterCount);
    assert.equal(loaded.run.chapter, chapterCount - 1);
    assert.equal(loaded.run.history.at(-1).chapter, chapterCount - 1);
    assert.equal(JSON.stringify(run), before);
    assert.equal(P.getAchievements(meta, run).find(item => item.id === 'six_realms').unlocked, false);
    assert.equal(P.getAchievements(meta, run).find(item => item.id === 'six_realms').progress, 5);
    assert.equal(P.getAchievements(meta, run).find(item => item.id === 'nine_realms').unlocked, false);
    if (chapterCount === 9) assert.equal(P.getAchievements(meta, run).find(item => item.id === 'nine_realms').progress, 8);
    assert.equal(meta.totalBattles, 0, 'active achievement views must not record totals');
  }
});

test('six-chapter victories unlock six realms and retain complete history', () => {
  const run = advanceUntil(E.newRun('six-terminal', { campaign: 'expanded' }), state => state.phase === 'victory');
  const meta = P.defaults();
  P.finish(meta, run);
  assert.ok(meta.achievements.includes('new_frontier'));
  assert.ok(meta.achievements.includes('six_realms'));
  assert.ok(!meta.achievements.includes('nine_realms'));
  assert.equal(meta.history[0].campaign, 'expanded');
  assert.equal(meta.history[0].chapterCount, 6);
  assert.equal(meta.history[0].chapter, 5);
  assert.equal(meta.history[0].bosses, 6);
  const loaded = P.parseSave(P.exportSave(meta, run));
  assert.equal(loaded.run.chapter, 5);
  assert.equal(loaded.run.chapterCount, 6);
  assert.equal(loaded.meta.history[0].journey.at(-1).chapter, 5);
  P.finish(loaded.meta, loaded.run);
  assert.equal(loaded.meta.wins, 1);
});

test('nine-chapter history round trips without truncation or double counting and unlocks persist after trimming', () => {
  const run = advanceUntil(E.newRun('nine-terminal', { campaign: 'odyssey' }), state => state.phase === 'victory');
  const meta = P.defaults();
  P.finish(meta, run);
  const totals = [meta.wins, meta.totalBattles, meta.totalCardsPlayed, meta.totalDamage];
  ['new_frontier', 'six_realms', 'nine_realms'].forEach(id => assert.ok(meta.achievements.includes(id), id));
  const entry = meta.history[0];
  assert.equal(entry.chapter, 8);
  assert.equal(entry.chapterCount, 9);
  assert.equal(entry.campaign, 'odyssey');
  assert.equal(entry.bosses, 9);
  assert.equal(entry.stats.bosses, 9);
  assert.equal(entry.journey.at(-1).chapter, 8);
  for (let repeat = 0; repeat < 3; repeat++) {
    const loaded = P.parseSave(P.exportSave(meta, run));
    assert.equal(loaded.run.chapter, 8);
    assert.equal(loaded.meta.history[0].journey.at(-1).chapter, 8);
    assert.equal(loaded.meta.history[0].bosses, 9);
    assert.deepEqual(loaded.meta.history[0].journey, entry.journey);
    P.finish(loaded.meta, loaded.run);
    P.getAchievements(loaded.meta, loaded.run);
    assert.deepEqual([loaded.meta.wins, loaded.meta.totalBattles, loaded.meta.totalCardsPlayed, loaded.meta.totalDamage], totals);
    assert.equal(loaded.meta.history.length, 1);
  }
  for (let i = 0; i < 22; i++) P.finish(meta, terminal('trim-long-' + i, { phase: 'defeat' }));
  assert.equal(meta.history.length, 20);
  assert.ok(meta.history.every(item => item.campaign === 'classic'));
  const imported = P.parseSave(P.exportSave(meta, null));
  ['new_frontier', 'six_realms', 'nine_realms'].forEach(id => assert.equal(P.getAchievements(imported.meta).find(item => item.id === id).unlocked, true, id));
});

test('unknown or inconsistent campaign fields are rejected in history and active saves', () => {
  const base = { format: 'shanhai-nightwalk-save', version: 2, meta: P.defaults(), run: null };
  const history = { win: false, chapter: 8, bosses: 8, elites: 8, campaign: 'odyssey', chapterCount: 9, journey: [{ chapter: 8, step: 1, text: '远行' }] };
  assert.equal(P.parseSave(JSON.stringify({ ...base, meta: { history: [history] } })).meta.history[0].chapter, 8);
  for (const bad of [{ campaign: 'unknown' }, { chapterCount: 6 }, { chapterCount: 3 }, { chapter: 9 }, { bosses: 10 }, { elites: 10 }, { journey: [{ chapter: 9 }] }, { win: true }, { campaign: null }]) {
    assert.throws(() => P.parseSave(JSON.stringify({ ...base, meta: { history: [{ ...history, ...bad }] } })), /[\u4e00-\u9fff]/);
  }
  for (const field of ['campaign', 'chapterCount']) {
    const partial = { ...history }; delete partial[field];
    assert.throws(() => P.parseSave(JSON.stringify({ ...base, meta: { history: [partial] } })), /[\u4e00-\u9fff]/);
  }
  const run = E.newRun('bad-campaign', { campaign: 'odyssey' });
  for (const bad of [{ campaign: 'unknown' }, { chapterCount: 6 }, { chapterCount: 2 }, { campaign: null }]) {
    assert.throws(() => P.parseSave(JSON.stringify({ ...base, run: { ...run, ...bad } })), /[\u4e00-\u9fff]/);
  }
});

test('invalid files fail with understandable Chinese errors and cannot pollute objects', () => {
  const valid = { format: 'shanhai-nightwalk-save', version: 2, meta: P.defaults(), run: null };
  ['', '{', '{}', '[]', JSON.stringify({ ...valid, version: 999 }), JSON.stringify({ ...valid, meta: [] }), JSON.stringify({ ...valid, meta: { runs: -1 } }), JSON.stringify({ ...valid, meta: { wins: '3' } }), JSON.stringify({ ...valid, meta: { history: [{}] } }), JSON.stringify({ ...valid, meta: { history: [{ win: true, battles: '6' }] } }), JSON.stringify({ ...valid, meta: { seen: [12] } }), JSON.stringify({ ...valid, meta: { motion: 'true' } }), JSON.stringify({ ...valid, run: { version: 1, phase: 'combat', deck: [] } }), 'x'.repeat(2 * 1024 * 1024 + 1), JSON.stringify({ ...valid, meta: { seen: ['山'.repeat(800000)] } })].forEach(value => assert.throws(() => P.parseSave(value), /[\u4e00-\u9fff]/));
  const malicious = JSON.stringify(valid).replace('"meta":{', '"meta":{"__proto__":{"polluted":true},"unknown":"evil",');
  const loaded = P.parseSave(malicious);
  assert.equal(loaded.meta.unknown, undefined);
  assert.equal(loaded.meta.polluted, undefined);
  assert.equal({}.polluted, undefined);
});

test('new long-campaign achievements keep the original eighteen identities and use complete-run goals', () => {
  const originalIds = ['first_battle', 'first_boss', 'first_victory', 'keeper_victory', 'ember_victory', 'tide_victory', 'ordeal_victory', 'three_elites', 'card_collector', 'relic_collector', 'spirit_collector', 'battle_veteran', 'card_master', 'damage_master', 'all_starters', 'new_frontier', 'six_realms', 'nine_realms'];
  assert.deepEqual(P.ACHIEVEMENTS.slice(0, 18).map(item => item.id), originalIds);
  for (const [id, target] of [['twelve_realms', 12], ['fifteen_realms', 15], ['eighteen_realms', 18]]) {
    const achievement = P.ACHIEVEMENTS.find(item => item.id === id);
    assert.ok(achievement, id);
    assert.equal(achievement.target, target);
    assert.ok(achievement.description.includes('完成所选旅程'), id);
  }
  const legacy = P.normalizeMeta({ version: 2, wins: 7, runs: 11, achievements: originalIds });
  assert.deepEqual(legacy.achievements, originalIds);
  const imported = P.parseSave(P.exportSave(legacy, null));
  assert.deepEqual(imported.meta.achievements, originalIds);
  assert.equal(imported.meta.wins, 7);
});

test('twelve-, fifteen- and eighteen-chapter active saves retain the final map and combat', () => {
  for (const [campaign, chapterCount] of [['expedition12', 12], ['saga15', 15], ['legend18', 18]]) {
    const run = E.newRun('active-final-' + campaign, { campaign });
    advanceUntil(run, state => state.phase === 'map' && state.chapter === chapterCount - 1);
    const meta = P.defaults();
    P.observe(meta, run);
    for (const phase of ['map', 'combat']) {
      if (phase === 'combat') E.act(run, { type: 'chooseNode', id: run.route.find(node => node.type === 'battle').id });
      const imported = P.parseSave(P.exportSave(meta, run));
      assert.deepEqual(imported.run, E.restoreRun(run));
      assert.equal(imported.run.campaign, campaign);
      assert.equal(imported.run.chapterCount, chapterCount);
      assert.equal(imported.run.chapter, chapterCount - 1);
      assert.equal(imported.run.phase, phase);
      for (const achievement of P.getAchievements(meta, run).filter(item => ['six_realms', 'nine_realms', 'twelve_realms', 'fifteen_realms', 'eighteen_realms'].includes(item.id))) {
        assert.equal(achievement.unlocked, false, campaign + ': ' + achievement.id);
        assert.equal(achievement.progress, achievement.target <= chapterCount ? achievement.target - 1 : 0);
      }
    }
    assert.equal(meta.totalBattles, 0);
    assert.equal(meta.wins, 0);
  }
});

test('all new campaign endpoints award only completed eligible goals and retain full journey histories', () => {
  for (const [campaign, chapterCount] of [['expedition12', 12], ['saga15', 15], ['legend18', 18]]) {
    const run = advanceUntil(E.newRun('endpoint-' + campaign, { campaign }), state => state.phase === 'victory');
    run.runId = 'endpoint-' + campaign;
    const meta = P.defaults();
    P.finish(meta, run);
    const entry = meta.history[0];
    assert.equal(entry.campaign, campaign);
    assert.equal(entry.chapterCount, chapterCount);
    assert.equal(entry.chapter, chapterCount - 1);
    assert.equal(entry.bosses, chapterCount);
    assert.equal(entry.elites, chapterCount);
    assert.equal(entry.stats.bosses, chapterCount);
    assert.equal(entry.stats.elites, chapterCount);
    assert.deepEqual(entry.journey, run.history, 'the complete journey must survive profile recording');
    assert.equal(entry.journey[0].chapter, 0);
    assert.equal(entry.journey.at(-1).chapter, chapterCount - 1);
    for (const achievement of P.getAchievements(meta).filter(item => ['six_realms', 'nine_realms', 'twelve_realms', 'fifteen_realms', 'eighteen_realms'].includes(item.id))) {
      assert.equal(achievement.unlocked, chapterCount >= achievement.target, campaign + ': ' + achievement.id);
      assert.equal(achievement.progress, chapterCount >= achievement.target ? achievement.target : 0);
    }
    const expected = JSON.stringify(meta);
    for (let repeat = 0; repeat < 3; repeat++) {
      const imported = P.parseSave(P.exportSave(meta, run));
      assert.equal(imported.run.chapter, chapterCount - 1);
      assert.equal(imported.run.stats.bosses, chapterCount);
      assert.equal(imported.run.stats.elites, chapterCount);
      assert.deepEqual(imported.meta.history[0].journey, run.history);
      P.finish(imported.meta, imported.run);
      P.finish(imported.meta, { ...imported.run, recorded: false });
      assert.equal(JSON.stringify(imported.meta), expected, 'repeated import/finish must be idempotent');
    }
  }
});

test('passing the twelfth and fifteenth realms during eighteen chapters never awards a completed campaign', () => {
  const run = E.newRun('midway-eighteen', { campaign: 'legend18' });
  const meta = P.defaults();
  for (const completed of [12, 15]) {
    advanceUntil(run, state => state.phase === 'map' && state.chapter === completed);
    P.observe(meta, run);
    const achievements = P.getAchievements(meta, run);
    ['six_realms', 'nine_realms', 'twelve_realms', 'fifteen_realms', 'eighteen_realms'].forEach(id => assert.equal(achievements.find(item => item.id === id).unlocked, false, id));
    assert.equal(achievements.find(item => item.id === 'twelve_realms').progress, 11);
    assert.equal(achievements.find(item => item.id === 'fifteen_realms').progress, Math.min(14, completed));
    assert.equal(achievements.find(item => item.id === 'eighteen_realms').progress, completed);
  }
  P.finish(meta, { ...run, phase: 'defeat' });
  assert.equal(meta.wins, 0);
  assert.ok(!meta.achievements.includes('twelve_realms'));
  assert.ok(!meta.achievements.includes('fifteen_realms'));
});

test('the original nine-chapter endpoint and old wins never award twelve-, fifteen- or eighteen-realm goals', () => {
  const run = advanceUntil(E.newRun('old-nine-endpoint', { campaign: 'odyssey' }), state => state.phase === 'victory');
  const meta = P.normalizeMeta({ wins: 9, runs: 12, history: [] });
  P.finish(meta, run);
  const imported = P.parseSave(P.exportSave(meta, run));
  assert.equal(imported.run.campaign, 'odyssey');
  assert.equal(imported.run.chapterCount, 9);
  assert.equal(imported.run.chapter, 8);
  assert.equal(imported.meta.wins, 10);
  assert.ok(imported.meta.achievements.includes('nine_realms'));
  for (const id of ['twelve_realms', 'fifteen_realms', 'eighteen_realms']) {
    const achievement = P.getAchievements(imported.meta, imported.run).find(item => item.id === id);
    assert.equal(achievement.unlocked, false, id);
    assert.equal(achievement.progress, 0);
  }
});

test('long-campaign achievements survive the latest twenty records replacing their winning journey', () => {
  const run = advanceUntil(E.newRun('persistent-eighteen', { campaign: 'legend18' }), state => state.phase === 'victory');
  const meta = P.defaults();
  P.finish(meta, run);
  for (let i = 0; i < 23; i++) P.finish(meta, terminal('new-trim-' + i, { phase: 'defeat' }));
  assert.equal(meta.history.length, 20);
  assert.ok(meta.history.every(item => item.campaign === 'classic'));
  const imported = P.parseSave(P.exportSave(meta, null));
  for (const id of ['six_realms', 'nine_realms', 'twelve_realms', 'fifteen_realms', 'eighteen_realms']) {
    const achievement = P.getAchievements(imported.meta).find(item => item.id === id);
    assert.equal(achievement.unlocked, true, id);
    assert.equal(achievement.progress, achievement.target);
  }
  assert.equal(imported.meta.wins, 1);
});

test('new campaign history accepts precise eighteen-realm bounds and rejects mismatches and overruns', () => {
  const base = { format: 'shanhai-nightwalk-save', version: 2, meta: P.defaults(), run: null };
  const history = { win: true, campaign: 'legend18', chapterCount: 18, chapter: 17, bosses: 18, elites: 18, journey: [{ chapter: 0, step: 0 }, { chapter: 17, step: 3 }] };
  const imported = P.parseSave(JSON.stringify({ ...base, meta: { history: [history] } }));
  assert.equal(imported.meta.history[0].chapter, 17);
  assert.equal(imported.meta.history[0].bosses, 18);
  assert.equal(imported.meta.history[0].elites, 18);
  for (const bad of [{ campaign: 'odyssey' }, { campaign: 'saga15' }, { chapterCount: 9 }, { chapterCount: 19 }, { chapter: 18 }, { bosses: 19 }, { elites: 19 }, { bosses: 17 }, { chapter: 16 }, { journey: [{ chapter: 18, step: 0 }] }, { journey: [{ chapter: 17, step: 4 }] }]) {
    assert.throws(() => P.parseSave(JSON.stringify({ ...base, meta: { history: [{ ...history, ...bad }] } })), /[\u4e00-\u9fff]/);
  }
  const run = E.newRun('invalid-legend', { campaign: 'legend18' });
  for (const bad of [{ campaign: 'saga15' }, { chapterCount: 9 }, { chapterCount: 19 }, { chapter: 18 }, { stats: { ...run.stats, bosses: 19 } }, { stats: { ...run.stats, elites: 19 } }]) {
    assert.throws(() => P.parseSave(JSON.stringify({ ...base, run: { ...run, ...bad } })), /[\u4e00-\u9fff]/);
  }
});

test('long journey import preserves the engine limit and rejects more than five thousand entries', () => {
  const base = { format: 'shanhai-nightwalk-save', version: 2, meta: P.defaults(), run: null };
  const journey = Array.from({ length: 5000 }, (_, i) => ({ chapter: i % 18, step: i % 4, type: 'journey', text: '第' + i + '程' }));
  const history = { win: false, campaign: 'legend18', chapterCount: 18, chapter: 17, bosses: 17, elites: 18, journey };
  const imported = P.parseSave(JSON.stringify({ ...base, meta: { history: [history] } }));
  assert.deepEqual(imported.meta.history[0].journey, journey);
  const reimported = P.parseSave(P.exportSave(imported.meta, null));
  assert.deepEqual(reimported.meta.history[0].journey, journey);
  assert.throws(() => P.parseSave(JSON.stringify({ ...base, meta: { history: [{ ...history, journey: journey.concat(journey[0]) }] } })), /[\u4e00-\u9fff]/);
});
