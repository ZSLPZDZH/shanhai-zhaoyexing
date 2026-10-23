'use strict';
const assert = require('node:assert/strict');
const E = require('./engine.js');
const clone = value => JSON.parse(JSON.stringify(value));
const act = (state, type, details = {}) => E.act(state, Object.assign({ type }, details));

assert.equal(E.CARDS.length, 24);
assert.ok(E.RELICS.length >= 6);
assert.equal(E.getCard('qinggeng+').effect.damage, 10);
assert.deepEqual(E.newRun('山海'), E.newRun('山海'), 'Seed is reproducible');
let state = E.newRun(42);
assert.equal(state.phase, 'map');
assert.equal(state.deck.length, 10);
act(state, 'chooseNode', { id: state.route[0].id });
assert.equal(state.phase, 'combat');
assert.equal(state.battle.hand.length, 5);
assert.equal(new Set(state.battle.hand.map(card => card.uid)).size, 5);
const noEnergy = clone(state);
noEnergy.battle.energy = 0;
const paidCard = noEnergy.battle.hand.find(instance => E.getCard(instance.id).cost > 0);
const beforeHand = noEnergy.battle.hand.length;
act(noEnergy, 'playCard', { uid: paidCard.uid });
assert.equal(noEnergy.battle.hand.length, beforeHand, 'Cannot play without energy');
const handCard = state.battle.hand.find(instance => E.getCard(instance.id).cost > 0);
act(state, 'playCard', { uid: handCard.uid });
const energyAfter = state.battle.energy;
act(state, 'playCard', { uid: handCard.uid });
assert.equal(state.battle.energy, energyAfter, 'Cannot replay card UID');
act(state, 'endTurn');
assert.equal(state.battle.turn, 2);
assert.equal(state.battle.energy, state.battle.maxEnergy);
assert.equal(state.battle.hand.length, 5);
assert.equal(state.battle.hand.length + state.battle.drawPile.length + state.battle.discardPile.length + state.battle.exhaustPile.length, 10, 'Cards are conserved');
state.battle.enemy.hp = 1;
state.battle.hand = [{ uid: 'test', id: 'qinggeng' }];
state.battle.energy = 3;
act(state, 'playCard', { uid: 'test' });
assert.equal(state.phase, 'reward');
const income = state.ink;
act(state, 'endTurn');
assert.equal(state.ink, income, 'Combat cannot resolve twice');
const chosen = state.reward.cards[0];
act(state, 'chooseReward', { id: chosen });
assert.equal(state.phase, 'map');
assert.equal(state.deck.at(-1), chosen);
assert.equal(state.step, 1);
act(state, 'chooseNode', { id: state.route.find(node => node.type === 'shop').id });
const unaffordable = clone(state);
unaffordable.ink = 0;
const beforeShop = clone(unaffordable.shop);
const beforeDeck = clone(unaffordable.deck);
const beforeRelics = clone(unaffordable.relics);
act(unaffordable, 'buyCard', { id: unaffordable.shop.cards[0].id });
assert.deepEqual(unaffordable.deck, beforeDeck, 'Unaffordable card is not added');
assert.deepEqual(unaffordable.shop, beforeShop, 'Unaffordable stock remains');
act(unaffordable, 'buyRelic', { id: unaffordable.shop.relic.id });
assert.deepEqual(unaffordable.relics, beforeRelics, 'Unaffordable relic is not added');
assert.deepEqual(unaffordable.shop, beforeShop);
assert.equal(unaffordable.ink, 0);
state.ink = 1000;
const offer = state.shop.cards[0];
act(state, 'buyCard', { id: offer.id });
assert.equal(state.ink, 1000 - offer.price);
const deckSize = state.deck.length;
act(state, 'buyCard', { id: offer.id });
assert.equal(state.deck.length, deckSize, 'Purchased offer is removed');
const relicOffer = state.shop.relic;
act(state, 'buyRelic', { id: relicOffer.id });
assert.ok(state.relics.includes(relicOffer.id));
assert.equal(state.shop.relic, null);
act(state, 'leaveShop');
act(state, 'chooseNode', { id: state.route.find(node => node.type === 'rest').id });
const sameRest = clone(state);
act(state, 'rest', { choice: 'upgrade' });
act(sameRest, 'rest', { choice: 'upgrade' });
assert.deepEqual(state.deck, sameRest.deck, 'Random rest upgrade is seed reproducible');
assert.equal(state.deck.filter(id => id.endsWith('+')).length, 1, 'Rest upgrades exactly one card');
assert.ok(state.deck.some(id => id.endsWith('+')));
assert.equal(state.step, 3);

let defeat = E.newRun(1);
act(defeat, 'chooseNode', { id: defeat.route[0].id });
defeat.hp = 1;
defeat.battle.block = 0;
act(defeat, 'endTurn');
assert.equal(defeat.phase, 'defeat');
const lostSnapshot = JSON.stringify(defeat);
act(defeat, 'endTurn');
assert.equal(JSON.stringify(defeat), lostSnapshot);

let phoenix = E.newRun(1);
phoenix.relics.push('ember');
act(phoenix, 'chooseNode', { id: phoenix.route[0].id });
phoenix.hp = 1;
act(phoenix, 'endTurn');
assert.equal(phoenix.hp, 30);
assert.equal(phoenix.flags.emberUsed, true);

// End-to-end routes use actual player actions; high HP isolates progression from strategy.
let victory = E.newRun('complete-path', { campaign: 'classic' });
victory.hp = victory.maxHp = 5000;
let guard = 0;
const bossNames = [];
while (!['victory', 'defeat'].includes(victory.phase) && guard++ < 1500) {
  if (victory.phase === 'map') {
    const preferred = victory.route.find(node => node.type === 'boss') || victory.route.find(node => node.type === 'elite') || victory.route.find(node => node.type === 'battle') || victory.route[0];
    act(victory, 'chooseNode', { id: preferred.id });
    if (preferred.type === 'boss') bossNames.push(victory.battle.enemy.name);
  } else if (victory.phase === 'combat') {
    const usable = victory.battle.hand.filter(instance => E.getCard(instance.id).cost <= victory.battle.energy);
    const card = usable.find(instance => E.getCard(instance.id).effect.damage) || usable[0];
    if (card) act(victory, 'playCard', { uid: card.uid });
    else act(victory, 'endTurn');
  } else if (victory.phase === 'reward') act(victory, 'chooseReward', { id: victory.reward.cards[0] });
  else if (victory.phase === 'event') act(victory, 'chooseEvent', { id: victory.event.choices[0].id });
  else if (victory.phase === 'shop') act(victory, 'leaveShop');
  else if (victory.phase === 'rest') act(victory, 'rest', { choice: 'heal' });
}
assert.equal(victory.phase, 'victory');
assert.deepEqual(bossNames, ['穷奇', '饕餮', '烛龙']);
assert.equal(victory.stats.bosses, 3);
assert.equal(victory.stats.battles, 12);
assert.ok(guard < 1500);
assert.doesNotThrow(() => JSON.stringify(victory));

// Event and burn resolve through normal phase transitions.
let event = E.newRun(10);
act(event, 'chooseNode', { id: event.route.find(node => node.type === 'event').id });
assert.equal(event.phase, 'event');
act(event, 'chooseEvent', { id: event.event.choices[0].id });
assert.equal(event.phase, 'map');
assert.equal(event.step, 1);
let fox;
for (let seed = 0; seed < 20; seed++) {
  const candidate = E.newRun(seed);
  act(candidate, 'chooseNode', { id: candidate.route.find(node => node.type === 'event').id });
  if (candidate.event.choices.some(choice => choice.id === 'fox_card')) { fox = candidate; break; }
}
assert.ok(fox);
fox.hp = 7;
const beforeFoxDeck = clone(fox.deck);
act(fox, 'chooseEvent', { id: 'fox_card' });
assert.equal(fox.phase, 'event', 'Unpayable event cost does not advance route');
assert.equal(fox.hp, 7);
assert.deepEqual(fox.deck, beforeFoxDeck, 'Unpayable event cost does not grant reward');
fox.hp = 8;
act(fox, 'chooseEvent', { id: 'fox_card' });
assert.equal(fox.phase, 'map');
assert.equal(fox.hp, 1);
assert.equal(fox.deck.at(-1), 'jiuwei');
let burn = E.newRun(9);
act(burn, 'chooseNode', { id: burn.route[0].id });
burn.battle.enemy.hp = 3;
burn.battle.enemy.status.burn = 3;
burn.hp = 1;
act(burn, 'endTurn');
assert.equal(burn.phase, 'reward', 'Burn kills before enemy action');
assert.equal(burn.hp, 6);
console.log('Engine checks passed: deterministic seeds, cards, turns, rewards, shop, rest, events, burn, revive, defeat, three bosses, complete victory.');

// The expanded campaign keeps the original API and adds meaningful run choices.
assert.deepEqual(E.STARTERS.map(item => item.id), ['keeper', 'ember', 'tide']);
assert.deepEqual(E.DIFFICULTIES.map(item => item.id), ['story', 'standard', 'ordeal']);
assert.equal(new Set(E.STARTERS.map(item => item.deck.join('|'))).size, 3);
for (const starter of E.STARTERS) {
  const candidate = E.newRun('starter', { starter: starter.id });
  assert.equal(candidate.deck.length, 10);
  assert.ok(candidate.deck.every(id => E.getCard(id)));
  assert.ok(starter.creatureId.startsWith('b'));
  assert.deepEqual(candidate.relics, starter.relics);
  assert.equal(candidate.maxHp, starter.maxHp);
  assert.equal(candidate.hp, starter.maxHp);
  assert.deepEqual(candidate, E.newRun('starter', { starter: starter.id }));
}
assert.deepEqual(E.newRun(42), E.newRun(42, { starter: 'keeper', difficulty: 'standard' }));
assert.equal(E.getCard('toString'), null, 'Prototype keys are not card identifiers');
assert.equal(E.getRelic('constructor'), null);
assert.deepEqual(E.newRun(42, { starter: 'constructor', difficulty: 'toString' }), E.newRun(42));
const modes = E.DIFFICULTIES.map(item => {
  const candidate = E.newRun('same-enemy', { difficulty: item.id });
  candidate.hp = 1;
  act(candidate, 'chooseNode', { id: candidate.route[0].id });
  return candidate;
});
assert.ok(modes[0].battle.enemy.maxHp < modes[1].battle.enemy.maxHp);
assert.ok(modes[1].battle.enemy.maxHp < modes[2].battle.enemy.maxHp);
assert.ok(modes[0].battle.enemy.intent.value < modes[1].battle.enemy.intent.value);
assert.ok(modes[1].battle.enemy.intent.value < modes[2].battle.enemy.intent.value);
assert.deepEqual(modes.map(E.getRestHeal), [30, 24, 20]);
const routeVariants = new Set(Array.from({ length: 30 }, (_, seed) => JSON.stringify(E.newRun(seed).route)));
assert.ok(routeVariants.size > 3, 'Different seeds vary the encounters and route prose');

function shopRun(seed = 'shop-services') {
  const candidate = E.newRun(seed);
  act(candidate, 'chooseNode', { id: candidate.route.find(node => node.type === 'event').id });
  act(candidate, 'chooseEvent', { id: candidate.event.choices[0].id });
  act(candidate, 'chooseNode', { id: candidate.route.find(node => node.type === 'shop').id });
  return candidate;
}
function restRun(seed) {
  const candidate = shopRun(seed);
  act(candidate, 'leaveShop');
  act(candidate, 'chooseNode', { id: candidate.route.find(node => node.type === 'rest').id });
  return candidate;
}
const exactUpgrade = restRun('specific-upgrade');
const upgradeBefore = exactUpgrade.deck.slice();
for (const index of [-1, 999, 0.5, '0', null]) {
  const snapshot = JSON.stringify(exactUpgrade);
  act(exactUpgrade, 'rest', { choice: 'upgrade', index });
  assert.equal(JSON.stringify(exactUpgrade), snapshot, 'Invalid upgrade index does not consume the spring');
}
act(exactUpgrade, 'rest', { choice: 'upgrade', index: 2 });
assert.deepEqual(exactUpgrade.deck, upgradeBefore.map((id, index) => index === 2 ? id + '+' : id));
assert.equal(exactUpgrade.step, 3);
const alreadyUpgraded = restRun('already-upgraded');
alreadyUpgraded.deck[0] += '+';
const upgradedSnapshot = JSON.stringify(alreadyUpgraded);
act(alreadyUpgraded, 'rest', { choice: 'upgrade', index: 0 });
assert.equal(JSON.stringify(alreadyUpgraded), upgradedSnapshot);
const allAwake = restRun('all-awake');
allAwake.deck = allAwake.deck.map(id => id.endsWith('+') ? id : id + '+');
allAwake.hp = 10;
act(allAwake, 'rest', { choice: 'upgrade' });
assert.equal(allAwake.hp, 22, 'The legacy all-awake fallback remains a heal');

const removal = shopRun();
assert.equal(removal.shop.removeCost, 50);
assert.equal(removal.shop.removeUsed, false);
removal.ink = 1000;
for (const index of [-1, 999, 1.2, '1', null]) {
  const snapshot = JSON.stringify(removal);
  act(removal, 'removeCard', { index });
  assert.equal(JSON.stringify(removal), snapshot);
}
const originalRemovalDeck = removal.deck.slice();
act(removal, 'removeCard', { index: 1 });
assert.deepEqual(removal.deck, originalRemovalDeck.filter((_, index) => index !== 1));
assert.equal(removal.ink, 950);
assert.equal(removal.stats.cardsRemoved, 1);
assert.equal(removal.shop.removeUsed, true);
assert.equal(removal.history.at(-1).type, 'remove');
const usedRemoval = JSON.stringify(removal);
act(removal, 'removeCard', { index: 0 });
assert.equal(JSON.stringify(removal), usedRemoval, 'Each shop can remove only one card');
assert.ok(E.restoreRun(removal), 'A save made after card removal can be restored');
const poorRemoval = shopRun();
poorRemoval.ink = 49;
const poorDeck = poorRemoval.deck.slice();
act(poorRemoval, 'removeCard', { index: 0 });
assert.deepEqual(poorRemoval.deck, poorDeck);
assert.equal(poorRemoval.ink, 49);
assert.equal(poorRemoval.shop.removeUsed, false);
const minimumDeck = shopRun();
minimumDeck.deck = minimumDeck.deck.slice(0, 5);
minimumDeck.ink = 1000;
const minimumSnapshot = JSON.stringify(minimumDeck);
act(minimumDeck, 'removeCard', { index: 0 });
assert.equal(JSON.stringify(minimumDeck), minimumSnapshot, 'At least five cards must remain');
const escalatingRemoval = shopRun();
escalatingRemoval.stats.cardsRemoved = 2;
act(escalatingRemoval, 'leaveShop');
// A later chapter shop computes the next service price from the campaign count.
escalatingRemoval.phase = 'map'; escalatingRemoval.step = 1;
escalatingRemoval.route = [{ id: 'later-shop', type: 'shop', name: 'test', creatureId: '狪狪' }];
act(escalatingRemoval, 'chooseNode', { id: 'later-shop' });
assert.equal(escalatingRemoval.shop.removeCost, 80);

const events = new Map();
for (let seed = 0; seed < 200 && events.size < 6; seed++) {
  const candidate = E.newRun(seed);
  act(candidate, 'chooseNode', { id: candidate.route.find(node => node.type === 'event').id });
  events.set(candidate.event.title, candidate);
}
assert.equal(events.size, 6);
for (const candidate of events.values()) {
  assert.ok(E.restoreRun(candidate), 'Every generated event can be restored');
  assert.equal(candidate.eventsSeen.at(-1), candidate.event.title);
  for (const choice of candidate.event.choices) {
    const branch = clone(candidate);
    branch.hp = 50; branch.ink = 100;
    act(branch, 'chooseEvent', { id: choice.id, ...(choice.id === 'bird_upgrade' ? { index: 1 } : {}) });
    assert.equal(branch.phase, 'map', 'Every event branch resolves normally');
    assert.equal(branch.step, 1);
  }
}
for (const [title, id, hp, ink] of [
  ['青丘夜语', 'fox_card', 7, 100], ['旋龟渡川', 'river_ink', 10, 100],
  ['乘黄赠角', 'light_gift', 50, 17], ['巴蛇守夜', 'serpent_card', 50, 19]
]) {
  const candidate = clone(events.get(title)); candidate.hp = hp; candidate.ink = ink;
  const before = { hp, ink, deck: candidate.deck.slice(), maxHp: candidate.maxHp };
  act(candidate, 'chooseEvent', { id });
  assert.equal(candidate.phase, 'event');
  assert.deepEqual({ hp: candidate.hp, ink: candidate.ink, deck: candidate.deck, maxHp: candidate.maxHp }, before, 'Unpayable event costs are atomic');
}
const bird = clone(events.get('精卫填海'));
const birdSnapshot = JSON.stringify(bird);
act(bird, 'chooseEvent', { id: 'bird_upgrade', index: -1 });
assert.equal(JSON.stringify(bird), birdSnapshot);
act(bird, 'chooseEvent', { id: 'bird_upgrade', index: 3 });
assert.ok(bird.deck[3].endsWith('+'));

// A pre-expansion v1 battle resumes without shuffling or consuming randomness.
const originalSave = E.newRun('legacy-combat', { campaign: 'classic' });
act(originalSave, 'chooseNode', { id: originalSave.route[0].id });
const legacy = clone(originalSave);
delete legacy.starter; delete legacy.difficulty; delete legacy.eventsSeen;
delete legacy.campaign; delete legacy.chapterCount;
delete legacy.stats.cardsRemoved; delete legacy.flags;
legacy.runId = 'preserved-run'; legacy.startedAt = 1790000000000; legacy.recorded = false;
const restored = E.restoreRun(legacy);
assert.ok(restored);
assert.equal(restored.starter, 'keeper'); assert.equal(restored.difficulty, 'standard');
assert.equal(restored.campaign, 'classic'); assert.equal(restored.chapterCount, 3);
assert.equal(restored.runId, legacy.runId); assert.equal(restored.startedAt, legacy.startedAt);
assert.equal(restored.recorded, false);
assert.deepEqual(restored.battle, originalSave.battle);
assert.equal(restored.rng, legacy.rng);
assert.deepEqual(restored.route, legacy.route);
assert.notEqual(restored, legacy);
assert.notEqual(restored.deck, legacy.deck);
const continued = clone(originalSave);
act(restored, 'endTurn'); act(continued, 'endTurn');
assert.deepEqual(restored.battle, continued.battle, 'Old and restored battles continue identically');
assert.equal(restored.rng, continued.rng);
const oldShop = shopRun('legacy-shop');
delete oldShop.shop.removeUsed; delete oldShop.shop.removeCost; delete oldShop.stats.cardsRemoved;
assert.equal(E.restoreRun(oldShop).shop.removeCost, 50);

const corruptionCases = [
  value => { value.version = 2; }, value => { value.phase = 'unknown'; },
  value => { value.hp = NaN; }, value => { value.extra = Infinity; },
  value => { value.deck[0] = 'not-a-card'; }, value => { value.deck = []; },
  value => { value.deck[0] = 'toString'; }, value => { value.relics.push('constructor'); },
  value => { value.deck = Array(201).fill('qinggeng'); }, value => { value.chapter = 3; },
  value => { value.step = -1; }, value => { value.hp = value.maxHp + 1; },
  value => { value.rng = 0; }, value => { value.battle = null; },
  value => { value.battle.enemy.id = 'fake'; }, value => { value.battle.enemy.pattern[0].value++; },
  value => { value.battle.enemy.intent.value = -1; }, value => { value.battle.enemy.status.weak = '2'; },
  value => { value.battle.drawPile[0].uid = value.battle.hand[0].uid; },
  value => { value.battle.hand[0].id = 'fake'; }, value => { value.battle.hand.pop(); },
  value => { value.route[0].id = 'wrong-node'; }, value => { value.stats.cardsRemoved = 4; },
  value => { value.flags.emberUsed = 'yes'; }, value => { value.recorded = 'yes'; },
  value => { value.starter = 'unknown'; }, value => { value.difficulty = 'unknown'; },
  value => { value.runId = '<unsafe>'; }, value => { value.startedAt = 'yesterday'; }
];
for (const corrupt of corruptionCases) {
  const candidate = clone(originalSave); corrupt(candidate);
  assert.doesNotThrow(() => E.restoreRun(candidate));
  assert.equal(E.restoreRun(candidate), null, 'Invalid saves are rejected without crashing');
}
for (const input of [null, undefined, false, [], {}, 'not JSON']) assert.equal(E.restoreRun(input), null);
const circular = {}; circular.self = circular;
assert.equal(E.restoreRun(circular), null);
const staleIntent = clone(originalSave);
staleIntent.battle.enemy.status.weak = 1;
const beforeIntentRng = staleIntent.rng;
const recomputed = E.restoreRun(staleIntent);
assert.equal(recomputed.rng, beforeIntentRng);
assert.equal(recomputed.battle.enemy.intent.value, Math.floor(originalSave.battle.enemy.intent.value * .75));

// Win with unmodified starting HP, real actions, all three starters and modes.
const quality = id => {
  const c = E.getCard(id), e = c.effect;
  return ((e.damage || 0) * (e.hits || 1) + (e.burn || 0) * 2.5 + (e.heal || 0) * 1.4 + (e.block || 0) * .65 + (e.strength || 0) * 9 + (e.thorns || 0) * 5 + (e.energy || 0) * 5 + (e.draw || 0) * 3 + (e.maxEnergy || 0) * 12) / (c.cost + .6);
};
function normalJourney(starter, difficulty, preferEvents = false, campaign = 'classic', seed = 1, engine = E, observe) {
  const act = (state, type, details = {}) => engine.act(state, Object.assign({ type }, details));
  const candidate = engine.newRun(seed, { starter, difficulty, campaign });
  let guard = 0;
  while (!['victory', 'defeat'].includes(candidate.phase) && guard++ < 2000) {
    if (observe) observe(candidate);
    assert.ok(engine.restoreRun(candidate), 'Every live campaign phase has a restorable save');
    if (candidate.phase === 'map') {
      const node = candidate.route.find(n => n.type === 'boss') || candidate.route.find(n => n.type === 'rest') || (preferEvents && candidate.route.find(n => n.type === 'event')) || (candidate.chapter >= 9 && candidate.relics.length === engine.RELICS.length && candidate.route.find(n => n.type === 'shop')) || candidate.route.find(n => n.type === 'elite' && candidate.hp > candidate.maxHp * .55) || candidate.route.find(n => n.type === 'battle') || candidate.route[0];
      act(candidate, 'chooseNode', { id: node.id });
    } else if (candidate.phase === 'combat') {
      const b = candidate.battle, threat = b.enemy.intent.type === 'attack' ? b.enemy.intent.value * (b.enemy.intent.hits || 1) : 0;
      const score = instance => {
        const c = engine.getCard(instance.id), e = c.effect, damage = (e.damage || 0) * (e.hits || 1) + (e.burn || 0) * 1.3;
        return (damage + (e.strength || 0) * 9 + (e.energy || 0) * 5 + (e.draw || 0) * 3 + (e.maxEnergy || 0) * 10 + (e.thorns || 0) * 4 + Math.min(e.heal || 0, candidate.maxHp - candidate.hp) * 1.6 + Math.min(e.block || 0, Math.max(0, threat - b.block)) * 1.5 + (e.weak || 0) * 2) / (c.cost + .5) + (damage >= b.enemy.hp ? 100 : 0);
      };
      const usable = b.hand.filter(instance => engine.getCard(instance.id).cost <= b.energy).sort((a, z) => score(z) - score(a));
      if (usable[0]) act(candidate, 'playCard', { uid: usable[0].uid }); else act(candidate, 'endTurn');
    } else if (candidate.phase === 'reward') {
      const id = candidate.reward.cards.slice().sort((a, z) => quality(z) - quality(a))[0];
      act(candidate, candidate.deck.length < 18 ? 'chooseReward' : 'skipReward', { id });
    } else if (candidate.phase === 'rest') {
      if (candidate.hp < candidate.maxHp * .8) act(candidate, 'rest', { choice: 'heal' });
      else {
        const best = candidate.deck.map((id, index) => ({ id, index })).filter(item => !item.id.endsWith('+')).sort((a, z) => quality(z.id) - quality(a.id))[0];
        act(candidate, 'rest', { choice: 'upgrade', ...(best ? { index: best.index } : {}) });
      }
    } else if (candidate.phase === 'event') {
      const choices = candidate.event.choices;
      let choice = choices.find(item => ['fox_card', 'bird_card', 'stone_card', 'river_ink', 'light_gift', 'serpent_card'].includes(item.id)) || choices[0];
      if (choice.id === 'river_ink' && candidate.hp <= 20) choice = choices[0];
      if (choice.id === 'light_gift' && candidate.ink < 18) choice = choices[1];
      if (choice.id === 'serpent_card' && candidate.ink < 20) choice = choices[1];
      if (choice.id === 'fox_card' && candidate.hp <= 7) choice = choices[0];
      act(candidate, 'chooseEvent', { id: choice.id });
    } else if (candidate.phase === 'shop') act(candidate, 'leaveShop');
  }
  assert.equal(candidate.phase, 'victory', starter + '/' + difficulty + ' completes at natural HP; chapter=' + candidate.chapter + ', enemy=' + (candidate.battle && candidate.battle.enemy.name) + ', turn=' + (candidate.battle && candidate.battle.turn));
  assert.equal(candidate.stats.bosses, engine.getChapterCount(candidate));
  assert.ok(engine.restoreRun(candidate), 'The completed run remains restorable');
  assert.equal(engine.getScore(candidate), Math.round((candidate.stats.battles * 100 + candidate.stats.elites * 80 + candidate.stats.bosses * 300 + candidate.hp * 2 + 1000) * engine.DIFFICULTIES.find(item => item.id === difficulty).scoreMultiplier));
  return candidate;
}
for (const starter of E.STARTERS) for (const difficulty of E.DIFFICULTIES) normalJourney(starter.id, difficulty.id);
const eventJourney = normalJourney('keeper', 'story', true);
const eventTitles = eventJourney.history.filter(item => item.type === 'event').map(item => item.text);
assert.equal(eventTitles.length, 3);
assert.equal(new Set(eventTitles).size, 3, 'A campaign does not repeat its previous events');
assert.ok(E.restoreRun(defeat), 'A real defeat is also a valid saved state');
console.log('Expansion checks passed: three starters and modes, varied routes, six events, targeted upgrades, deck removal, legacy migration, hostile saves, score, and ten natural-HP victories.');

// Nine-region content is source-mapped and every campaign keeps its own finish line.
global.window = globalThis;
require('./data.js');
assert.equal(E.REGIONS.length, 18);
assert.equal(Object.keys(E.ENEMIES).length, 54);
assert.equal(new Set(E.REGIONS.map(region => region.boss)).size, 18);
assert.deepEqual(E.REGIONS.slice(0, 3).map(region => [region.id, region.boss]), [['south', '穷奇'], ['west', '饕餮'], ['north', '烛龙']]);
assert.deepEqual(E.CAMPAIGNS.map(campaign => [campaign.id, campaign.chapters]), [['classic', 3], ['expanded', 6], ['odyssey', 9], ['expedition12', 12], ['saga15', 15], ['legend18', 18]]);
assert.equal(E.getChapterCount(E.newRun('default')), 18);
assert.ok(Object.isFrozen(E.ENEMIES) && Object.values(E.ENEMIES).every(Object.isFrozen));
for (const region of E.REGIONS) {
  assert.ok(GAME_DATA.creatures.some(row => row.id === region.artId), 'Every region uses an exact source artwork');
  assert.equal(region.foes.length, 2);
  assert.ok(region.foes.every(key => E.ENEMIES[key]));
}
for (const enemy of Object.values(E.ENEMIES)) {
  assert.ok(GAME_DATA.creatures.some(row => row.id === enemy.artId), 'Every enemy uses an exact source artwork');
}
assert.ok(E.REGIONS.slice(3).every(region => E.ENEMIES[region.boss].pattern.length === 5));
for (const campaign of E.CAMPAIGNS) {
  const candidate = E.newRun('campaign-boundary', { campaign: campaign.id });
  assert.equal(candidate.chapterCount, campaign.chapters);
  assert.equal(E.getChapterCount(candidate), campaign.chapters);
  assert.ok(E.restoreRun(candidate));
  const swapped = clone(candidate); swapped.chapterCount = campaign.chapters === 9 ? 3 : 9;
  assert.equal(E.restoreRun(swapped), null, 'Campaign and finish line must agree');
  const partial = clone(candidate); delete partial.campaign;
  assert.equal(E.restoreRun(partial), null, 'A partial campaign identity is rejected');
  const missingCount = clone(candidate); delete missingCount.chapterCount;
  assert.equal(E.restoreRun(missingCount), null);
  const unknown = clone(candidate); unknown.campaign = 'constructor';
  assert.equal(E.restoreRun(unknown), null);
}
const oldEnding = clone(victory); delete oldEnding.campaign; delete oldEnding.chapterCount;
const migratedEnding = E.restoreRun(oldEnding);
assert.equal(migratedEnding.phase, 'victory', 'An original completed save stays completed');
assert.equal(migratedEnding.campaign, 'classic');
assert.equal(migratedEnding.chapterCount, 3);
assert.equal(migratedEnding.battle.enemy.name, '烛龙');
assert.deepEqual(migratedEnding.history, victory.history);

for (const starter of E.STARTERS) {
  for (const difficulty of E.DIFFICULTIES) {
    const full = normalJourney(starter.id, difficulty.id, false, 'odyssey');
    assert.equal(full.chapter, 8);
    assert.equal(full.battle.enemy.name, '应龙');
    assert.equal(full.stats.bosses, 9);
    assert.ok(full.history.some(row => row.chapter === 8));
    assert.ok(full.history.some(row => row.type === 'chapterHeal'));
  }
}
const six = normalJourney('keeper', 'standard', false, 'expanded');
assert.equal(six.chapter, 5);
assert.equal(six.battle.enemy.name, '九凤');
for (const starter of E.STARTERS) normalJourney(starter.id, 'standard', false, 'odyssey', 424242);
console.log('Campaign checks passed: 18 regions, 54 source-mapped enemies, 6 finish lines, legacy endings, twelve natural-HP nine-region journeys and a six-region journey.');

function combatAt(chapter, boss = false) {
  const candidate = E.newRun('region-mechanics', { campaign: 'legend18' });
  candidate.chapter = chapter; candidate.step = boss ? 3 : 0;
  const region = E.REGIONS[chapter], type = boss ? 'boss' : 'battle';
  candidate.route = [{ id: 'c' + chapter + 's' + candidate.step + '_' + type, type, name: region.title, creatureId: boss ? region.boss : region.foes[0], description: region.description }];
  if (!boss) candidate.route.push({ id: 'c' + chapter + 's0_event', type: 'event', name: '遗祠', creatureId: '九尾狐', description: '试炼之间，驻足寻灵。' });
  act(candidate, 'chooseNode', { id: candidate.route[0].id });
  return candidate;
}
for (let chapter = 3; chapter < E.REGIONS.length; chapter++) {
  const candidate = combatAt(chapter), rule = E.REGIONS[chapter].rule, b = candidate.battle;
  assert.ok(E.restoreRun(candidate), 'New-region combat is importable with an exact source enemy');
  assert.equal(b.energy, 3 + (rule.openingEnergy || 0));
  assert.equal(b.maxEnergy, 3);
  assert.equal(b.hand.length, 5 + (rule.openingDraw || 0));
  assert.equal(b.block, rule.playerBlock || 0);
  assert.equal(b.status.strength, rule.playerStrength || 0);
  assert.equal(b.enemy.strength, rule.enemyStrength || 0);
  assert.equal(b.enemy.block, rule.enemyBlock || 0);
  assert.ok(b.log.some(row => row.includes(rule.name)), 'The applied region rule is visible in combat');
  act(candidate, 'endTurn');
  assert.equal(b.energy, b.maxEnergy, 'Opening energy expires after the first turn');
  assert.equal(b.hand.length, 5, 'Opening draw expires after the first turn');
  assert.ok(E.restoreRun(candidate));
}
const multi = combatAt(5, true);
multi.battle.block = 5; multi.battle.status.thorns = 2;
const multiHp = multi.hp, enemyHp = multi.battle.enemy.hp;
const perHit = multi.battle.enemy.intent.value;
assert.equal(multi.battle.enemy.intent.hits, 3);
assert.ok(E.getIntentDescription(multi).includes('× 3 次'));
assert.ok(E.getIntentDescription(multi).includes('合计 ' + perHit * 3));
const resumedMulti = E.restoreRun(clone(multi));
assert.deepEqual(resumedMulti.battle, multi.battle, 'Multi-hit intent restores exactly');
act(multi, 'endTurn'); act(resumedMulti, 'endTurn');
assert.deepEqual(resumedMulti, multi, 'Imported multi-hit battles continue identically');
assert.equal(multi.hp, multiHp - (perHit * 3 - 5), 'Multi-hit damage shares and consumes the player shield');
assert.equal(multi.battle.enemy.hp, enemyHp - 6, 'Thorns triggers once for every resolved hit');
for (const mutate of [value => { value.battle.enemy.pattern[0].hits = 9; }, value => { value.battle.enemy.intent.hits = -1; }, value => { value.battle.enemy.intent.hits = 2; }]) {
  const candidate = combatAt(5, true); mutate(candidate);
  assert.equal(E.restoreRun(candidate), null, 'Malformed hit counts are rejected');
}

// Isolate navigation by resolving each boss with a valid, existing attacking card.
// Every selected node and reward advances through the public action API.
function publicNavigation(campaign) {
const allSteps = E.newRun('public-route-steps', { campaign });
const visitedSteps = new Set(), visitedBosses = [];
while (!['victory', 'defeat'].includes(allSteps.phase)) {
  if (allSteps.phase === 'map') {
    const node = allSteps.route.find(row => ['event', 'shop', 'rest', 'boss'].includes(row.type));
    visitedSteps.add(allSteps.chapter + ':' + allSteps.step);
    act(allSteps, 'chooseNode', { id: node.id });
  } else if (allSteps.phase === 'event') {
    const safe = allSteps.event.choices.find(row => ['fox_heal', 'bird_card', 'stone_gold', 'river_heal', 'light_ink', 'serpent_heal'].includes(row.id));
    act(allSteps, 'chooseEvent', { id: safe.id });
  } else if (allSteps.phase === 'shop') act(allSteps, 'leaveShop');
  else if (allSteps.phase === 'rest') act(allSteps, 'rest', { choice: 'heal' });
  else if (allSteps.phase === 'combat') {
    const b = allSteps.battle;
    visitedBosses.push(b.enemy.name);
    // Moving a card between piles preserves the instance and the saved deck multiset.
    let attack = b.hand.find(row => E.getCard(row.id).effect.damage);
    if (!attack) {
      const index = b.drawPile.findIndex(row => E.getCard(row.id).effect.damage);
      attack = b.drawPile.splice(index, 1)[0]; b.hand.push(attack);
    }
    b.enemy.hp = 1; b.enemy.block = 0;
    allSteps.hp = Math.min(allSteps.hp, 20);
    const beforeHeal = allSteps.hp, relicHealing = allSteps.relics.includes('jade') ? Math.ceil(5 * E.DIFFICULTIES.find(row => row.id === allSteps.difficulty).healMultiplier) : 0;
    act(allSteps, 'playCard', { uid: attack.uid });
    assert.equal(allSteps.reward.heal, allSteps.hp - beforeHeal, 'Reward shows the complete actual restored amount');
    assert.equal(allSteps.reward.chapterHeal, allSteps.hp - beforeHeal - Math.min(relicHealing, allSteps.maxHp - beforeHeal));
    assert.ok(E.restoreRun(allSteps));
  } else if (allSteps.phase === 'reward') act(allSteps, 'skipReward');
  assert.ok(E.restoreRun(allSteps));
}
assert.equal(allSteps.phase, 'victory');
assert.equal(visitedSteps.size, E.getChapterCount(allSteps) * 4);
assert.deepEqual(visitedBosses, E.REGIONS.slice(0, E.getChapterCount(allSteps)).map(region => region.boss));
if (E.getChapterCount(allSteps) >= 6) assert.equal(allSteps.relics.length, 7, 'The exhausted relic pool does not stop a long campaign');
if (E.getChapterCount(allSteps) >= 9) assert.ok(allSteps.reward.relic === null, 'A boss still completes after all relics have been collected');
assert.equal(allSteps.history.filter(row => row.type === 'chapterHeal').length, E.getChapterCount(allSteps) > 3 ? E.getChapterCount(allSteps) : 0);
return allSteps;
}
const navigatedCampaigns = E.CAMPAIGNS.map(campaign => publicNavigation(campaign.id));
assert.deepEqual(navigatedCampaigns.map(run => [run.campaign, run.chapter, run.battle.enemy.name]), [
  ['classic', 2, '烛龙'], ['expanded', 5, '九凤'], ['odyssey', 8, '应龙'],
  ['expedition12', 11, '句芒'], ['saga15', 14, '刑天'], ['legend18', 17, '西王母']
]);
const longestRoute = navigatedCampaigns.at(-1);
assert.equal(longestRoute.chapter, 17);
assert.equal(longestRoute.stats.bosses, 18);
assert.ok(longestRoute.history.some(row => row.chapter === 17));
console.log('Mechanics checks passed: all fifteen region rules, opening-turn expiry, restored multi-hit combat, shield and thorns, all six public-action campaign routes (12/24/36/48/60/72 steps), chapter healing totals, and relic pool exhaustion.');

// The second expansion doubles the route without replacing any earlier encounter.
const addedBosses = ['强良', '天吴', '句芒', '蓐收', '祝融', '刑天', '夸父', '凤凰', '西王母'];
assert.deepEqual(E.REGIONS.slice(9).map(region => region.boss), addedBosses);
assert.equal(new Set(Object.values(E.ENEMIES).map(enemy => enemy.artId)).size, 54, 'Every encounter has its own exact illustration');
assert.equal(new Set(E.REGIONS.slice(9).map(region => JSON.stringify(region.rule))).size, 9);
for (const boss of addedBosses) {
  assert.equal(E.ENEMIES[boss].pattern.length, 5);
  assert.ok(E.ENEMIES[boss].pattern.some(intent => intent.hits > 1));
  assert.ok(E.ENEMIES[boss].hp <= 250, 'Long journeys use a bounded health curve');
}
for (const campaign of E.CAMPAIGNS) {
  const first = E.newRun('all-six-lengths', { campaign: campaign.id });
  assert.deepEqual(first, E.newRun('all-six-lengths', { campaign: campaign.id }));
  assert.deepEqual(E.restoreRun(clone(first)), first);
  const invalid = clone(first); invalid.chapter = campaign.chapters;
  assert.equal(E.restoreRun(invalid), null, 'No campaign can cross its own finish line');
}
let lastCombat = null;
const journeyResults = [];
for (const starter of E.STARTERS) for (const difficulty of E.DIFFICULTIES) {
  const full = normalJourney(starter.id, difficulty.id, false, 'legend18', 1, E, candidate => {
  if (!lastCombat && candidate.chapter === 17 && candidate.step === 3 && candidate.phase === 'combat' && candidate.battle.turn === 2) lastCombat = clone(candidate);
  });
  assert.equal(full.chapter, 17);
  assert.equal(full.battle.enemy.name, '西王母');
  assert.equal(full.stats.bosses, 18);
  assert.equal(full.history.filter(row => row.type === 'chapterHeal').length, 18);
  journeyResults.push({ starter: starter.id, difficulty: difficulty.id, hp: full.hp, maxHp: full.maxHp, battles: full.stats.battles, cards: full.deck.length, revived: full.flags.emberUsed });
}
for (const [campaign, boss, chapter] of [['expedition12', '句芒', 11], ['saga15', '刑天', 14]]) {
  const full = normalJourney('keeper', 'standard', false, campaign);
  assert.equal(full.chapter, chapter);
  assert.equal(full.battle.enemy.name, boss);
}
assert.ok(lastCombat, 'A natural long journey reaches an active final-region battle');
const importedFinal = E.restoreRun(clone(lastCombat));
assert.deepEqual(importedFinal, lastCombat, 'An eighteenth-region battle restores every pile, rule, status and RNG');
const originalFinal = clone(lastCombat);
const affordableFinal = originalFinal.battle.hand.find(row => E.getCard(row.id).cost <= originalFinal.battle.energy);
const finalAction = affordableFinal ? { type: 'playCard', uid: affordableFinal.uid } : { type: 'endTurn' };
E.act(originalFinal, finalAction); E.act(importedFinal, finalAction);
assert.deepEqual(importedFinal, originalFinal, 'Imported final-region combat continues identically');

// Saturated progression still resolves after the relic pool and upgrades run out.
const saturated = combatAt(17);
saturated.deck = saturated.deck.map(id => id.endsWith('+') ? id : id + '+');
for (const key of ['hand', 'drawPile', 'discardPile', 'exhaustPile']) saturated.battle[key].forEach(row => { if (!row.id.endsWith('+')) row.id += '+'; });
assert.ok(E.restoreRun(saturated));
const fullUpgradeRest = E.newRun('all-awakened', { campaign: 'legend18' });
fullUpgradeRest.chapter = 17; fullUpgradeRest.step = 2;
fullUpgradeRest.deck = fullUpgradeRest.deck.map(id => id + '+');
fullUpgradeRest.hp = 40;
fullUpgradeRest.route = [
  { id: 'c17s2_rest', type: 'rest', name: '玉山清泉', creatureId: '赤鱬', description: '休息或觉醒。' },
  { id: 'c17s2_battle', type: 'battle', name: '玉阶试炼', creatureId: '开明兽', description: '试炼。' }
];
act(fullUpgradeRest, 'chooseNode', { id: 'c17s2_rest' });
assert.ok(E.restoreRun(fullUpgradeRest));
act(fullUpgradeRest, 'rest', { choice: 'upgrade' });
assert.equal(fullUpgradeRest.hp, 52);
assert.equal(fullUpgradeRest.phase, 'map');
assert.equal(fullUpgradeRest.step, 3);
assert.ok(E.restoreRun(fullUpgradeRest));

// Load the original nine-region engine, extracted unchanged from the pre-expansion archive.
// Avoid deriving a 'legacy' fixture from the newly changed engine.
const vm = require('node:vm');
const path = require('node:path');
const oldSource = require('node:fs').readFileSync(path.join(__dirname, 'tests', 'fixtures', 'nine-realms-engine.cjs'), 'utf8');
const oldContext = { module: { exports: {} } };
vm.runInNewContext(oldSource, oldContext, { filename: 'nine-realms-engine.js' });
const previousEngine = oldContext.module.exports;
assert.equal(previousEngine.REGIONS.length, 9);
assert.equal(Object.keys(previousEngine.ENEMIES).length, 27);
for (const [key, enemy] of Object.entries(previousEngine.ENEMIES)) assert.deepEqual(E.ENEMIES[key], clone(enemy), 'Original encounters remain byte-for-byte compatible in content');
let oldActive = null;
const oldFinished = normalJourney('keeper', 'standard', false, 'odyssey', 1, previousEngine, candidate => {
  if (!oldActive && candidate.chapter === 8 && candidate.step === 3 && candidate.phase === 'combat' && candidate.battle.turn === 2) oldActive = clone(candidate);
});
assert.ok(oldActive);
for (const save of [oldActive, clone(oldFinished)]) {
  const imported = E.restoreRun(save);
  assert.ok(imported, 'An actual nine-region save survives the second expansion');
  assert.equal(imported.campaign, 'odyssey'); assert.equal(imported.chapterCount, 9);
  assert.deepEqual(imported, save);
}
const oldResumed = E.restoreRun(oldActive), oldContinued = clone(oldActive);
previousEngine.act(oldContinued, { type: 'endTurn' }); E.act(oldResumed, { type: 'endTurn' });
assert.deepEqual(oldResumed, clone(oldContinued), 'Old ninth-region battle resumes exactly without an altered finish line');
const oldAtEnd = E.restoreRun(clone(oldFinished));
const oldEndSnapshot = JSON.stringify(oldAtEnd);
act(oldAtEnd, 'endTurn');
assert.equal(JSON.stringify(oldAtEnd), oldEndSnapshot, 'An old victory remains terminal');
console.log('Second-expansion checks passed: 18 regions, 54 unique source-mapped enemies, 9 new five-turn bosses, 6 campaign lengths, 72 public-action steps, 9 natural-HP full victories, 12/15-region endings, final-region exact resume, actual archived-engine compatibility and saturated progression.');
console.log('Natural 18-region results: ' + JSON.stringify(journeyResults));
