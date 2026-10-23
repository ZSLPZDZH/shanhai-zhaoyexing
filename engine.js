(function (root) {
  'use strict';

  const CARDS = [
    { id: 'qinggeng', name: '青耕啄玉', cost: 1, type: 'attack', rarity: 'common', element: 'wood', creatureName: '青耕', description: '造成 7 点伤害。', effect: { damage: 7 }, upgrade: { damage: 10 }, upgradedDescription: '造成 10 点伤害。' },
    { id: 'xuanwu', name: '玄武负山', cost: 1, type: 'skill', rarity: 'common', element: 'water', creatureName: '玄武', description: '获得 7 点护盾。', effect: { block: 7 }, upgrade: { block: 10 }, upgradedDescription: '获得 10 点护盾。' },
    { id: 'baiye', name: '白泽观象', cost: 0, type: 'skill', rarity: 'common', element: 'void', creatureName: '白泽', description: '抽 2 张牌。', effect: { draw: 2 }, upgrade: { draw: 3 }, upgradedDescription: '抽 3 张牌。' },
    { id: 'tianma', name: '天马踏云', cost: 1, type: 'attack', rarity: 'common', element: 'wood', creatureName: '天马', description: '造成 6 点伤害，抽 1 张牌。', effect: { damage: 6, draw: 1 }, upgrade: { damage: 9 }, upgradedDescription: '造成 9 点伤害，抽 1 张牌。' },
    { id: 'bifang', name: '毕方焚羽', cost: 1, type: 'attack', rarity: 'common', element: 'fire', creatureName: '毕方', description: '造成 8 点伤害，施加 3 层灼烧。', effect: { damage: 8, burn: 3 }, upgrade: { damage: 10, burn: 5 }, upgradedDescription: '造成 10 点伤害，施加 5 层灼烧。' },
    { id: 'qiongqi', name: '穷奇裂阵', cost: 2, type: 'attack', rarity: 'rare', element: 'metal', creatureName: '穷奇', description: '造成 13 点伤害，施加 2 回合易伤。', effect: { damage: 13, vulnerable: 2 }, upgrade: { damage: 18, vulnerable: 3 }, upgradedDescription: '造成 18 点伤害，施加 3 回合易伤。' },
    { id: 'jingwei', name: '精卫衔春', cost: 1, type: 'skill', rarity: 'common', element: 'wood', creatureName: '精卫', description: '获得 5 点护盾，恢复 3 点生命。', effect: { block: 5, heal: 3 }, upgrade: { block: 8, heal: 4 }, upgradedDescription: '获得 8 点护盾，恢复 4 点生命。' },
    { id: 'zheng', name: '狰鸣五刃', cost: 1, type: 'attack', rarity: 'rare', element: 'metal', creatureName: '狰', description: '造成 5 点伤害，重复 2 次。力量对每次生效。', effect: { damage: 5, hits: 2 }, upgrade: { damage: 7 }, upgradedDescription: '造成 7 点伤害，重复 2 次。力量对每次生效。' },
    { id: 'huandou', name: '讙兜振翼', cost: 1, type: 'power', rarity: 'rare', element: 'fire', creatureName: '讙头', description: '本场战斗获得 2 点力量。消耗。', effect: { strength: 2, exhaust: true }, upgrade: { strength: 3 }, upgradedDescription: '本场战斗获得 3 点力量。消耗。' },
    { id: 'xiezhi', name: '獬豸断邪', cost: 1, type: 'attack', rarity: 'rare', element: 'earth', creatureName: '獬豸', description: '造成 9 点伤害，施加 2 回合虚弱。', effect: { damage: 9, weak: 2 }, upgrade: { damage: 12, weak: 3 }, upgradedDescription: '造成 12 点伤害，施加 3 回合虚弱。' },
    { id: 'feiyi', name: '肥遗旱火', cost: 1, type: 'skill', rarity: 'common', element: 'fire', creatureName: '肥遗', description: '施加 6 层灼烧。灼烧在敌人行动前触发并减少 1。', effect: { burn: 6 }, upgrade: { burn: 9 }, upgradedDescription: '施加 9 层灼烧。灼烧在敌人行动前触发并减少 1。' },
    { id: 'baize', name: '白泽知万物', cost: 1, type: 'skill', rarity: 'rare', element: 'void', creatureName: '白泽', description: '抽 3 张牌，获得 3 点护盾。', effect: { draw: 3, block: 3 }, upgrade: { draw: 4, block: 5 }, upgradedDescription: '抽 4 张牌，获得 5 点护盾。' },
    { id: 'luwu', name: '陆吾镇九门', cost: 2, type: 'skill', rarity: 'rare', element: 'earth', creatureName: '陆吾', description: '获得 15 点护盾，抽 1 张牌。', effect: { block: 15, draw: 1 }, upgrade: { block: 21 }, upgradedDescription: '获得 21 点护盾，抽 1 张牌。' },
    { id: 'yingzhao', name: '英招巡岳', cost: 2, type: 'attack', rarity: 'rare', element: 'wood', creatureName: '英招', description: '造成 13 点伤害，获得 8 点护盾。', effect: { damage: 13, block: 8 }, upgrade: { damage: 17, block: 11 }, upgradedDescription: '造成 17 点伤害，获得 11 点护盾。' },
    { id: 'fuzhu', name: '夫诸引潮', cost: 1, type: 'skill', rarity: 'common', element: 'water', creatureName: '夫诸', description: '获得 9 点护盾，施加 1 回合虚弱。', effect: { block: 9, weak: 1 }, upgrade: { block: 12, weak: 2 }, upgradedDescription: '获得 12 点护盾，施加 2 回合虚弱。' },
    { id: 'jiuwei', name: '九尾借灵', cost: 0, type: 'skill', rarity: 'rare', element: 'void', creatureName: '九尾狐', description: '获得 2 点灵力，抽 1 张牌。消耗。', effect: { energy: 2, draw: 1, exhaust: true }, upgrade: { energy: 3 }, upgradedDescription: '获得 3 点灵力，抽 1 张牌。消耗。' },
    { id: 'zhulong', name: '烛龙开昼', cost: 3, type: 'attack', rarity: 'legendary', element: 'fire', creatureName: '烛龙', description: '造成 27 点伤害，施加 3 层灼烧。', effect: { damage: 27, burn: 3 }, upgrade: { damage: 36, burn: 5 }, upgradedDescription: '造成 36 点伤害，施加 5 层灼烧。' },
    { id: 'yinglong', name: '应龙唤雨', cost: 2, type: 'attack', rarity: 'legendary', element: 'water', creatureName: '应龙', description: '造成 18 点伤害，施加 4 层灼烧。', effect: { damage: 18, burn: 4 }, upgrade: { damage: 24, burn: 6 }, upgradedDescription: '造成 24 点伤害，施加 6 层灼烧。' },
    { id: 'fenghuang', name: '凤凰涅槃', cost: 2, type: 'skill', rarity: 'legendary', element: 'fire', creatureName: '凤凰', description: '恢复 12 点生命，获得 6 点护盾。消耗。', effect: { heal: 12, block: 6, exhaust: true }, upgrade: { heal: 17, block: 10 }, upgradedDescription: '恢复 17 点生命，获得 10 点护盾。消耗。' },
    { id: 'taotie', name: '饕餮噬元', cost: 2, type: 'attack', rarity: 'rare', element: 'earth', creatureName: '饕餮', description: '造成 14 点伤害，恢复 5 点生命。', effect: { damage: 14, heal: 5 }, upgrade: { damage: 19, heal: 7 }, upgradedDescription: '造成 19 点伤害，恢复 7 点生命。' },
    { id: 'guche', name: '九凤齐啸', cost: 2, type: 'attack', rarity: 'rare', element: 'metal', creatureName: '九凤', description: '造成 5 点伤害，重复 3 次。力量对每次生效。', effect: { damage: 5, hits: 3 }, upgrade: { damage: 7 }, upgradedDescription: '造成 7 点伤害，重复 3 次。力量对每次生效。' },
    { id: 'tengshe', name: '腾蛇护主', cost: 1, type: 'power', rarity: 'rare', element: 'earth', creatureName: '腾蛇', description: '获得 5 点护盾。本场战斗获得 3 点反伤。消耗。', effect: { block: 5, thorns: 3, exhaust: true }, upgrade: { block: 8, thorns: 5 }, upgradedDescription: '获得 8 点护盾。本场战斗获得 5 点反伤。消耗。' },
    { id: 'pixiu', name: '貔貅衔玉', cost: 1, type: 'skill', rarity: 'rare', element: 'metal', creatureName: '貔貅', description: '获得 8 枚灵玉与 6 点护盾。消耗。', effect: { ink: 8, block: 6, exhaust: true }, upgrade: { ink: 12, block: 9 }, upgradedDescription: '获得 12 枚灵玉与 9 点护盾。消耗。' },
    { id: 'kunpeng', name: '鲲鹏扶摇', cost: 2, type: 'power', rarity: 'legendary', element: 'water', creatureName: '鲲鹏', description: '本场战斗每回合灵力上限 +1。消耗。', effect: { maxEnergy: 1, exhaust: true }, upgrade: { cost: 1 }, upgradedDescription: '本场战斗每回合灵力上限 +1。消耗。' }
  ];
  const RELICS = [
    { id: 'jade', name: '青玉残简', description: '每场战斗胜利后恢复 5 点生命。', icon: '◈', rarity: 'common' },
    { id: 'feather', name: '赤羽', description: '每场战斗开始时获得 2 点力量。', icon: '羽', rarity: 'rare' },
    { id: 'shell', name: '玄甲', description: '每回合开始时获得 3 点护盾。', icon: '甲', rarity: 'rare' },
    { id: 'horn', name: '白泽角', description: '每回合多抽 1 张牌。', icon: '角', rarity: 'rare' },
    { id: 'pearl', name: '沧海遗珠', description: '每回合灵力上限 +1。', icon: '珠', rarity: 'legendary' },
    { id: 'coin', name: '九尾灵契', description: '每场战斗额外获得 12 枚灵玉。', icon: '契', rarity: 'rare' },
    { id: 'ember', name: '不灭凤心', description: '每次远行中，首次受到致命伤害时恢复 30 点生命。', icon: '心', rarity: 'legendary' }
  ];
  const REGIONS = [
    { id: 'south', name: '南山 · 青丘月', title: '青丘寻踪', subtitle: '山泽初醒，灵迹未歇', boss: '穷奇', color: '#76b89a', artId: 'b01-08', foes: ['讙', '狰'], description: '自青丘月色中启程，循三目之声与五尾之影寻找最初的灵契。', rule: null },
    { id: 'west', name: '西山 · 昆仑雪', title: '昆仑问道', subtitle: '金石长鸣，九门将启', boss: '饕餮', color: '#d1ab65', artId: 'b03-08', foes: ['蛊雕', '肥遗'], description: '越过雪线与断崖，在蛊雕和肥遗的试炼中磨砺灵契。', rule: null },
    { id: 'north', name: '大荒 · 长夜明', title: '烛照归墟', subtitle: '长夜尽处，万象归藏', boss: '烛龙', color: '#97b7dc', artId: 'b05-01', foes: ['朱厌', '相柳'], description: '走入大荒长夜，直面朱厌与相柳，向烛龙借一线天光。', rule: null },
    { id: 'east', name: '东山 · 扶桑晓', title: '扶桑逐日', subtitle: '赤羽映晓，东风渡林', boss: '毕方', color: '#e7a06f', artId: 'b02-08', foes: ['鹿蜀', '虎蛟'], description: '晓色越过扶桑，鹿蜀穿林、虎蛟跃水，毕方的赤羽照亮新的山径。', rule: { id: 'dawn', name: '扶桑晨光', description: '每场战斗首回合灵力 +1、额外抽 1 张牌；敌人初始护盾 +5。', openingEnergy: 1, openingDraw: 1, enemyBlock: 5 } },
    { id: 'sea', name: '北海 · 玄潮涌', title: '玄潮问海', subtitle: '四蛇绕浪，潮生月落', boss: '禺强', color: '#77bad3', artId: 'b05-23', foes: ['蠃鱼', '文鳐鱼'], description: '沿蠃鱼与文鳐鱼的水迹驶入北海，在禺强守望的玄潮中听见旧日回声。', rule: { id: 'tide', name: '玄潮护舟', description: '每场战斗开始时，你获得 10 点护盾，敌人获得 8 点护盾。', playerBlock: 10, enemyBlock: 8 } },
    { id: 'red', name: '赤水 · 九凤鸣', title: '赤水听凤', subtitle: '九声相和，赤水长歌', boss: '九凤', color: '#d58b9b', artId: 'b05-06', foes: ['酸与', '鵸鵌'], description: '沿赤水追寻异鸟长鸣，酸与与鵸鵌穿过雾岸，九凤在水天之间设下合鸣之试。', rule: { id: 'echo', name: '赤水回响', description: '每场战斗开始时，你获得 1 点力量；敌人获得 1 点力量。', playerStrength: 1, enemyStrength: 1 } },
    { id: 'kunlun', name: '昆仑 · 九门开', title: '九门镇岳', subtitle: '金玉成阶，虎神守阙', boss: '陆吾', color: '#d8c18c', artId: 'b02-19', foes: ['英招', '驳'], description: '攀登昆仑金玉石阶，与英招、驳切磋灵契，接受陆吾的九门试炼。', rule: { id: 'gate', name: '九门金垒', description: '每场战斗开始时，你获得 12 点护盾，敌人获得 10 点护盾；首回合额外抽 1 张牌。', playerBlock: 12, enemyBlock: 10, openingDraw: 1 } },
    { id: 'heaven', name: '天山 · 太古音', title: '太古闻韶', subtitle: '六足踏云，四翼和音', boss: '帝江', color: '#b79acb', artId: 'b02-26', foes: ['孟极', '诸怀'], description: '孟极隐入云影，诸怀踏响山谷；越过天山，聆听帝江无言的远古乐章。', rule: { id: 'music', name: '天山和音', description: '每场战斗首回合灵力 +1、额外抽 2 张牌；敌人初始力量 +1。', openingEnergy: 1, openingDraw: 2, enemyStrength: 1 } },
    { id: 'abyss', name: '归墟 · 应龙归', title: '应龙归海', subtitle: '风雨归藏，万里同明', boss: '应龙', color: '#8cb8bb', artId: 'b05-01', foes: ['天狗', '蜚'], description: '穿过天狗与蜚的关隘，在归墟雨幕中与应龙相会。九境卷在此圆满，更长的旅途将循雷光前行。', rule: { id: 'rain', name: '归墟甘霖', description: '每场战斗开始时，你获得 8 点护盾与 1 点力量；首回合额外抽 1 张牌，敌人初始护盾 +12。', playerBlock: 8, playerStrength: 1, openingDraw: 1, enemyBlock: 12 } },
    // Beyond the nine realms, these are game trials inspired by the supplied atlas,
    // rather than a claim that their order or encounters form an original-text route.
    { id: 'thunder', name: '雷泽 · 双蛇雷', title: '雷泽听震', subtitle: '双蛇衔电，虎首临渊', boss: '强良', color: '#a3afe6', artId: 'b05-07', foes: ['夔', '鸣蛇'], description: '本游戏的雷泽试炼：循夔鼓与鸣蛇的声迹前行，在强良衔蛇的雷光下磨砺出牌节奏。', rule: { id: 'thunder', name: '雷泽先声', description: '首回合灵力 +1；你初始获得 1 点力量，敌人初始获得 14 点护盾。', openingEnergy: 1, playerStrength: 1, enemyBlock: 14 } },
    { id: 'winds', name: '朝阳 · 八风起', title: '八风渡海', subtitle: '八面听潮，风从海起', boss: '天吴', color: '#83cbd1', artId: 'b05-08', foes: ['化蛇', '计蒙'], description: '本游戏的八风试炼：化蛇与计蒙带来风雨，天吴立于浪峰，让执卷人辨清每一阵风的来意。', rule: { id: 'winds', name: '八风借势', description: '首回合额外抽 2 张牌；你初始获得 14 点护盾，敌人初始获得 1 点力量。', openingDraw: 2, playerBlock: 14, enemyStrength: 1 } },
    { id: 'spring', name: '东方 · 春木生', title: '春木问生', subtitle: '鸟身乘龙，春枝向明', boss: '句芒', color: '#9bc995', artId: 'b05-30', foes: ['类', '灌灌'], description: '本游戏的春木试炼：类与灌灌穿行新枝，向句芒问一程生长之道，以周转与守御迎接春雷。', rule: { id: 'spring', name: '春木舒枝', description: '首回合灵力 +1、额外抽 1 张牌；你初始获得 6 点护盾，敌人初始获得 12 点护盾。', openingEnergy: 1, openingDraw: 1, playerBlock: 6, enemyBlock: 12 } },
    { id: 'autumn', name: '西极 · 秋金肃', title: '秋金试锋', subtitle: '白虎衔金，秋声满谷', boss: '蓐收', color: '#d5b778', artId: 'b05-32', foes: ['狡', '孟槐'], description: '本游戏的秋金试炼：越过狡与孟槐守望的金石山谷，在蓐收的锋芒中把握防守和反击的时机。', rule: { id: 'autumn', name: '秋金砺契', description: '你初始获得 2 点力量与 10 点护盾；敌人初始获得 16 点护盾。', playerStrength: 2, playerBlock: 10, enemyBlock: 16 } },
    { id: 'flame', name: '南陆 · 炎海燃', title: '炎海照心', subtitle: '兽身乘龙，赤火照夜', boss: '祝融', color: '#e19578', artId: 'b05-31', foes: ['山膏', '猾褢'], description: '本游戏的炎海试炼：山膏与猾褢踏过丹色石径，祝融以赤火为灯，试问旅人能否在攻势中留住命火。', rule: { id: 'flame', name: '炎海引火', description: '首回合灵力 +1；你初始获得 2 点力量，敌人初始获得 1 点力量与 10 点护盾。', openingEnergy: 1, playerStrength: 2, enemyStrength: 1, enemyBlock: 10 } },
    { id: 'changyang', name: '常羊 · 干戚舞', title: '常羊不屈', subtitle: '干戚犹舞，山川有声', boss: '刑天', color: '#c2a194', artId: 'b05-28', foes: ['诸犍', '猲狙'], description: '本游戏的常羊试炼：诸犍与猲狙的足音传过深谷，刑天以干戚起舞，向不曾放下灵卷的人致意。', rule: { id: 'resolve', name: '常羊守志', description: '你初始获得 20 点护盾；首回合额外抽 1 张牌，敌人初始获得 2 点力量。', playerBlock: 20, openingDraw: 1, enemyStrength: 2 } },
    { id: 'sunroad', name: '成都 · 逐日途', title: '逐日饮河', subtitle: '杖林相望，长路逐光', boss: '夸父', color: '#d7af6f', artId: 'b05-29', foes: ['从从', '狌狌'], description: '本游戏的逐日试炼：从从疾行，狌狌知往；循杖林之影追上夸父的步伐，在漫长日光中寻找自己的节奏。', rule: { id: 'sunroad', name: '逐日长息', description: '首回合灵力 +2、额外抽 1 张牌；敌人初始获得 20 点护盾。', openingEnergy: 2, openingDraw: 1, enemyBlock: 20 } },
    { id: 'danxue', name: '丹穴 · 五采鸣', title: '丹穴和鸣', subtitle: '五采成文，德音入卷', boss: '凤凰', color: '#d6a5b0', artId: 'b01-19', foes: ['钦原', '鬿雀'], description: '本游戏的丹穴试炼：越过钦原与鬿雀的飞影，聆听凤凰五采和鸣，让一路所得在此合为一声长歌。', rule: { id: 'fivecolors', name: '丹穴五采', description: '你初始获得 1 点力量与 12 点护盾；首回合额外抽 2 张牌，敌人初始获得 16 点护盾。', playerStrength: 1, playerBlock: 12, openingDraw: 2, enemyBlock: 16 } },
    { id: 'jadepeak', name: '玉山 · 瑶池阙', title: '玉山归卷', subtitle: '豹尾虎齿，万象归真', boss: '西王母', color: '#bdb4db', artId: 'b05-24', foes: ['开明兽', '乘黄'], description: '本游戏的山海终试：开明兽与乘黄守望玉阶，西王母在玉山之上检阅长卷，十八境的灯火终于照见来路。', rule: { id: 'jadepeak', name: '玉山归真', description: '你初始获得 2 点力量与 16 点护盾；首回合额外抽 1 张牌，敌人初始获得 1 点力量与 18 点护盾。', playerStrength: 2, playerBlock: 16, openingDraw: 1, enemyStrength: 1, enemyBlock: 18 } }
  ];
  const CAMPAIGNS = [
    { id: 'classic', name: '初卷', chapters: 3, description: '青丘至长夜的三境初行，共 12 程，以烛龙试炼为终章。' },
    { id: 'expanded', name: '远卷', chapters: 6, description: '越过长夜，向扶桑、北海与赤水前行，共 24 程，以九凤试炼为终章。' },
    { id: 'odyssey', name: '九境卷', chapters: 9, description: '踏遍九境，共 36 程，越九门、闻太古音，最终与应龙相会。' },
    { id: 'expedition12', name: '远征卷', chapters: 12, description: '雷泽听震、八风渡海、春木问生，共 48 程，以句芒试炼收卷。' },
    { id: 'saga15', name: '大荒卷', chapters: 15, description: '问春木、试秋金、照炎海，直到常羊干戚之舞，共 60 程，以刑天试炼收卷。' },
    { id: 'legend18', name: '山海全卷', chapters: 18, description: '踏遍十八境、逐日而行，听五采和鸣，最终在玉山归卷，共 72 程。' }
  ];
  const STARTERS = [
    { id: 'keeper', name: '执灯', title: '均衡行者', description: '80 命火。青耕攻伐、旋龟守御，以白鵺观夜周转灵契；青玉残简在战后疗愈。', creatureId: 'b01-08', deck: ['qinggeng', 'qinggeng', 'qinggeng', 'qinggeng', 'qinggeng', 'xuanwu', 'xuanwu', 'xuanwu', 'xuanwu', 'baiye'], relics: ['jade'], maxHp: 80 },
    { id: 'ember', name: '逐焰', title: '灼烧行者', description: '74 命火。毕方与肥遗积累灼烧，精卫维持命火；赤羽使每场战斗获得 2 点力量。', creatureId: 'b02-08', deck: ['qinggeng', 'qinggeng', 'qinggeng', 'xuanwu', 'xuanwu', 'baiye', 'bifang', 'bifang', 'feiyi', 'jingwei'], relics: ['feather'], maxHp: 74 },
    { id: 'tide', name: '听潮', title: '守御行者', description: '86 命火。赤鱬与旋龟守御，精卫疗伤、天马周转；玄甲在每回合开始时提供 3 点护盾。', creatureId: 'b01-10', deck: ['qinggeng', 'qinggeng', 'qinggeng', 'xuanwu', 'xuanwu', 'xuanwu', 'baiye', 'fuzhu', 'jingwei', 'tianma'], relics: ['shell'], maxHp: 86 }
  ];
  const DIFFICULTIES = [
    { id: 'story', name: '寻幽', description: '敌人生命 ×80%，攻击 ×75%，普通恢复 ×125%，评分 ×80%。护盾与蓄势力量保持原值。', enemyHpMultiplier: 0.8, enemyAttackMultiplier: 0.75, healMultiplier: 1.25, scoreMultiplier: 0.8 },
    { id: 'standard', name: '远行', description: '敌人生命、攻击、普通恢复与评分均为标准值。', enemyHpMultiplier: 1, enemyAttackMultiplier: 1, healMultiplier: 1, scoreMultiplier: 1 },
    { id: 'ordeal', name: '问道', description: '敌人生命 ×118%，攻击 ×120%，普通恢复 ×80%，评分 ×135%。护盾与蓄势力量保持原值。', enemyHpMultiplier: 1.18, enemyAttackMultiplier: 1.2, healMultiplier: 0.8, scoreMultiplier: 1.35 }
  ];
  const ENEMIES = {
    '讙': { name: '讙', hp: 28, pattern: [{ type: 'attack', value: 6, label: '三目窥袭' }, { type: 'defend', value: 7, label: '伏身藏影' }, { type: 'attack', value: 9, label: '啸声惊林' }] },
    '狰': { name: '狰', hp: 32, pattern: [{ type: 'attack', value: 7, label: '赤豹扑击' }, { type: 'charge', value: 5, label: '五尾蓄势' }, { type: 'attack', value: 11, label: '碎石长鸣' }] },
    '蛊雕': { name: '蛊雕', hp: 38, pattern: [{ type: 'attack', value: 8, label: '利爪掠空' }, { type: 'attack', value: 10, label: '尖啸震岳' }, { type: 'defend', value: 9, label: '敛翼守势' }] },
    '肥遗': { name: '肥遗', hp: 35, pattern: [{ type: 'charge', value: 6, label: '旱气凝聚' }, { type: 'attack', value: 12, label: '六足疾袭' }, { type: 'attack', value: 7, label: '双翼卷沙' }] },
    '朱厌': { name: '朱厌', hp: 42, pattern: [{ type: 'attack', value: 10, label: '白首怒击' }, { type: 'defend', value: 10, label: '踞石为阵' }, { type: 'attack', value: 14, label: '战意奔腾' }] },
    '相柳': { name: '相柳', hp: 49, pattern: [{ type: 'attack', value: 11, label: '九首突袭' }, { type: 'charge', value: 8, label: '盘踞大泽' }, { type: 'attack', value: 15, label: '浊浪滔天' }] },
    '穷奇': { name: '穷奇', hp: 66, pattern: [{ type: 'attack', value: 10, label: '穷奇·裂风' }, { type: 'charge', value: 8, label: '穷奇·振翼蓄势' }, { type: 'attack', value: 17, label: '穷奇·吞山' }, { type: 'defend', value: 12, label: '穷奇·铁羽' }] },
    '饕餮': { name: '饕餮', hp: 91, pattern: [{ type: 'defend', value: 13, label: '饕餮·聚甲' }, { type: 'attack', value: 13, label: '饕餮·噬玉' }, { type: 'attack', value: 16, label: '饕餮·吞元' }, { type: 'charge', value: 9, label: '饕餮·无尽饥渴' }] },
    '烛龙': { name: '烛龙', hp: 122, pattern: [{ type: 'charge', value: 10, label: '烛龙·闭目成夜' }, { type: 'attack', value: 18, label: '烛龙·睁眼为昼' }, { type: 'defend', value: 15, label: '烛龙·寒鳞' }, { type: 'attack', value: 22, label: '烛龙·四海长明' }] },
    '鹿蜀': { name: '鹿蜀', hp: 52, pattern: [{ type: 'defend', value: 9, label: '鹿蜀·林影' }, { type: 'attack', value: 12, label: '鹿蜀·踏芳' }, { type: 'attack', value: 7, hits: 2, label: '鹿蜀·长歌' }] },
    '虎蛟': { name: '虎蛟', hp: 55, pattern: [{ type: 'attack', value: 13, label: '虎蛟·出水' }, { type: 'charge', value: 7, label: '虎蛟·潜流' }, { type: 'attack', value: 16, label: '虎蛟·裂浪' }] },
    '蠃鱼': { name: '蠃鱼', hp: 58, pattern: [{ type: 'defend', value: 11, label: '蠃鱼·敛翼' }, { type: 'attack', value: 8, hits: 2, label: '蠃鱼·双翼凌波' }, { type: 'attack', value: 15, label: '蠃鱼·掠潮' }] },
    '文鳐鱼': { name: '文鳐鱼', hp: 59, pattern: [{ type: 'attack', value: 12, label: '文鳐·跃海' }, { type: 'defend', value: 13, label: '文鳐·夜游' }, { type: 'attack', value: 17, label: '文鳐·乘风' }] },
    '酸与': { name: '酸与', hp: 62, pattern: [{ type: 'charge', value: 9, label: '酸与·六目观空' }, { type: 'attack', value: 6, hits: 3, label: '酸与·三足凌风' }, { type: 'defend', value: 12, label: '酸与·羽屏' }] },
    '鵸鵌': { name: '鵸鵌', hp: 65, pattern: [{ type: 'attack', value: 16, label: '鵸鵌·啼山' }, { type: 'defend', value: 14, label: '鵸鵌·藏林' }, { type: 'attack', value: 9, hits: 2, label: '鵸鵌·回声' }] },
    '英招': { name: '英招', hp: 72, pattern: [{ type: 'defend', value: 15, label: '英招·巡苑' }, { type: 'attack', value: 17, label: '英招·振翼' }, { type: 'charge', value: 10, label: '英招·守岳' }, { type: 'attack', value: 19, label: '英招·踏云' }] },
    '驳': { name: '驳', hp: 70, pattern: [{ type: 'attack', value: 17, label: '驳·独角突阵' }, { type: 'defend', value: 14, label: '驳·白身黑尾' }, { type: 'attack', value: 10, hits: 2, label: '驳·虎爪逐影' }] },
    '孟极': { name: '孟极', hp: 75, pattern: [{ type: 'defend', value: 17, label: '孟极·伏隐' }, { type: 'attack', value: 20, label: '孟极·白身跃涧' }, { type: 'attack', value: 9, hits: 2, label: '孟极·文首回锋' }] },
    '诸怀': { name: '诸怀', hp: 78, pattern: [{ type: 'charge', value: 12, label: '诸怀·四角蓄势' }, { type: 'attack', value: 21, label: '诸怀·人目凝视' }, { type: 'defend', value: 15, label: '诸怀·踞石' }, { type: 'attack', value: 17, label: '诸怀·踏岭' }] },
    '天狗': { name: '天狗', hp: 80, pattern: [{ type: 'attack', value: 19, label: '天狗·白首夜行' }, { type: 'defend', value: 16, label: '天狗·伏岩' }, { type: 'attack', value: 11, hits: 2, label: '天狗·榴声裂石' }] },
    '蜚': { name: '蜚', hp: 84, pattern: [{ type: 'defend', value: 16, label: '蜚·蛇尾环山' }, { type: 'attack', value: 20, label: '蜚·独目照夜' }, { type: 'charge', value: 12, label: '蜚·白首凝势' }, { type: 'attack', value: 23, label: '蜚·踏破长风' }] },
    '毕方': { name: '毕方', hp: 124, pattern: [{ type: 'defend', value: 12, label: '毕方·丹羽屏风' }, { type: 'attack', value: 7, hits: 2, label: '毕方·双翼焚霞' }, { type: 'charge', value: 9, label: '毕方·青羽聚光' }, { type: 'attack', value: 20, label: '毕方·独足凌日' }, { type: 'defend', value: 14, label: '毕方·扶桑归巢' }] },
    '禺强': { name: '禺强', hp: 140, pattern: [{ type: 'defend', value: 18, label: '禺强·玄潮为垒' }, { type: 'attack', value: 18, label: '禺强·海风卷云' }, { type: 'attack', value: 5, hits: 3, label: '禺强·青蛇逐浪' }, { type: 'charge', value: 10, label: '禺强·北海凝势' }, { type: 'attack', value: 22, label: '禺强·长潮破月' }] },
    '九凤': { name: '九凤', hp: 152, pattern: [{ type: 'attack', value: 5, hits: 3, label: '九凤·三声和鸣' }, { type: 'defend', value: 14, label: '九凤·羽幕' }, { type: 'charge', value: 10, label: '九凤·聚九音' }, { type: 'attack', value: 24, label: '九凤·赤水长歌' }, { type: 'attack', value: 8, hits: 2, label: '九凤·回响双声' }] },
    '陆吾': { name: '陆吾', hp: 166, pattern: [{ type: 'defend', value: 24, label: '陆吾·九门金阙' }, { type: 'attack', value: 21, label: '陆吾·虎爪镇岳' }, { type: 'charge', value: 16, label: '陆吾·九尾蓄势' }, { type: 'attack', value: 10, hits: 2, label: '陆吾·双阙相击' }, { type: 'attack', value: 25, label: '陆吾·昆仑开门' }] },
    '帝江': { name: '帝江', hp: 178, pattern: [{ type: 'charge', value: 12, label: '帝江·太古起音' }, { type: 'attack', value: 6, hits: 3, label: '帝江·六足踏歌' }, { type: 'defend', value: 17, label: '帝江·四翼和风' }, { type: 'attack', value: 25, label: '帝江·天山长韵' }, { type: 'attack', value: 11, hits: 2, label: '帝江·双声入梦' }] },
    '应龙': { name: '应龙', hp: 202, pattern: [{ type: 'defend', value: 20, label: '应龙·归海云幕' }, { type: 'attack', value: 10, hits: 2, label: '应龙·双翼唤雨' }, { type: 'charge', value: 13, label: '应龙·蓄水成泽' }, { type: 'attack', value: 27, label: '应龙·万里风雷' }, { type: 'attack', value: 7, hits: 3, label: '应龙·甘霖三叠' }] },
    '夔': { name: '夔', hp: 81, pattern: [{ type: 'charge', value: 11, label: '夔·苍身凝雷' }, { type: 'attack', value: 18, label: '夔·独足震海' }, { type: 'defend', value: 15, label: '夔·风雨相护' }, { type: 'attack', value: 9, hits: 2, label: '夔·雷声再起' }] },
    '鸣蛇': { name: '鸣蛇', hp: 79, pattern: [{ type: 'attack', value: 6, hits: 3, label: '鸣蛇·四翼鸣风' }, { type: 'defend', value: 16, label: '鸣蛇·盘岩' }, { type: 'attack', value: 19, label: '鸣蛇·磬声裂谷' }] },
    '化蛇': { name: '化蛇', hp: 83, pattern: [{ type: 'defend', value: 18, label: '化蛇·水幕' }, { type: 'attack', value: 10, hits: 2, label: '化蛇·双翼卷波' }, { type: 'charge', value: 11, label: '化蛇·涌泉' }, { type: 'attack', value: 20, label: '化蛇·洪声过涧' }] },
    '计蒙': { name: '计蒙', hp: 86, pattern: [{ type: 'attack', value: 17, label: '计蒙·漳渊起雨' }, { type: 'defend', value: 15, label: '计蒙·云幕遮峰' }, { type: 'attack', value: 6, hits: 3, label: '计蒙·风雨三叠' }, { type: 'charge', value: 11, label: '计蒙·龙首望云' }] },
    '类': { name: '类', hp: 85, pattern: [{ type: 'defend', value: 17, label: '类·藏形落叶' }, { type: 'attack', value: 10, hits: 2, label: '类·逐枝双跃' }, { type: 'attack', value: 19, label: '类·林隙扑影' }] },
    '灌灌': { name: '灌灌', hp: 88, pattern: [{ type: 'charge', value: 13, label: '灌灌·佩声凝神' }, { type: 'attack', value: 18, label: '灌灌·林间长鸣' }, { type: 'defend', value: 17, label: '灌灌·羽影护心' }, { type: 'attack', value: 6, hits: 3, label: '灌灌·鸣声连缀' }] },
    '狡': { name: '狡', hp: 90, pattern: [{ type: 'attack', value: 20, label: '狡·犬形疾突' }, { type: 'defend', value: 19, label: '狡·角影横山' }, { type: 'attack', value: 10, hits: 2, label: '狡·逐石回锋' }] },
    '孟槐': { name: '孟槐', hp: 92, pattern: [{ type: 'defend', value: 20, label: '孟槐·赤豪成垒' }, { type: 'attack', value: 7, hits: 3, label: '孟槐·豪刺纷落' }, { type: 'charge', value: 11, label: '孟槐·伏岩蓄势' }, { type: 'attack', value: 20, label: '孟槐·彘声惊山' }] },
    '山膏': { name: '山膏', hp: 94, pattern: [{ type: 'charge', value: 13, label: '山膏·丹色聚焰' }, { type: 'attack', value: 21, label: '山膏·踏火冲山' }, { type: 'defend', value: 17, label: '山膏·黄棘护身' }, { type: 'attack', value: 10, hits: 2, label: '山膏·赤影回踏' }] },
    '猾褢': { name: '猾褢', hp: 96, pattern: [{ type: 'attack', value: 7, hits: 3, label: '猾褢·奔石连影' }, { type: 'defend', value: 20, label: '猾褢·披毛守势' }, { type: 'attack', value: 22, label: '猾褢·雷声惊谷' }] },
    '诸犍': { name: '诸犍', hp: 99, pattern: [{ type: 'attack', value: 21, label: '诸犍·独目寻踪' }, { type: 'charge', value: 14, label: '诸犍·长尾盘山' }, { type: 'defend', value: 19, label: '诸犍·衔尾伏岩' }, { type: 'attack', value: 11, hits: 2, label: '诸犍·回身破风' }] },
    '猲狙': { name: '猲狙', hp: 98, pattern: [{ type: 'defend', value: 20, label: '猲狙·白尾藏踪' }, { type: 'attack', value: 11, hits: 2, label: '猲狙·赤目连扑' }, { type: 'attack', value: 22, label: '猲狙·疾声裂石' }] },
    '从从': { name: '从从', hp: 101, pattern: [{ type: 'attack', value: 6, hits: 4, label: '从从·六足奔风' }, { type: 'defend', value: 19, label: '从从·疾影回环' }, { type: 'charge', value: 13, label: '从从·伏地听路' }, { type: 'attack', value: 22, label: '从从·跃入日光' }] },
    '狌狌': { name: '狌狌', hp: 99, pattern: [{ type: 'charge', value: 14, label: '狌狌·知往凝神' }, { type: 'attack', value: 22, label: '狌狌·白耳踏枝' }, { type: 'attack', value: 8, hits: 3, label: '狌狌·林间三跃' }, { type: 'defend', value: 20, label: '狌狌·回望旧途' }] },
    '钦原': { name: '钦原', hp: 103, pattern: [{ type: 'attack', value: 12, hits: 2, label: '钦原·蜂尾双刺' }, { type: 'defend', value: 21, label: '钦原·羽屏掩迹' }, { type: 'charge', value: 14, label: '钦原·凌空凝势' }, { type: 'attack', value: 23, label: '钦原·掠过玉阶' }] },
    '鬿雀': { name: '鬿雀', hp: 107, pattern: [{ type: 'defend', value: 22, label: '鬿雀·白首敛翼' }, { type: 'attack', value: 8, hits: 3, label: '鬿雀·虎爪逐风' }, { type: 'attack', value: 24, label: '鬿雀·长空破云' }] },
    '开明兽': { name: '开明兽', hp: 110, pattern: [{ type: 'defend', value: 24, label: '开明兽·九首守阙' }, { type: 'attack', value: 9, hits: 3, label: '开明兽·九门回望' }, { type: 'charge', value: 14, label: '开明兽·虎身镇玉' }, { type: 'attack', value: 24, label: '开明兽·玉关长啸' }] },
    '乘黄': { name: '乘黄', hp: 109, pattern: [{ type: 'charge', value: 16, label: '乘黄·背角映霞' }, { type: 'defend', value: 21, label: '乘黄·白影守阶' }, { type: 'attack', value: 13, hits: 2, label: '乘黄·踏云双跃' }, { type: 'attack', value: 23, label: '乘黄·玉山长行' }] },
    '强良': { name: '强良', hp: 188, pattern: [{ type: 'attack', value: 9, hits: 2, label: '强良·双蛇衔雷' }, { type: 'charge', value: 14, label: '强良·虎首凝电' }, { type: 'defend', value: 20, label: '强良·雷云护臂' }, { type: 'attack', value: 23, label: '强良·四极震响' }, { type: 'attack', value: 6, hits: 3, label: '强良·电光三叠' }] },
    '天吴': { name: '天吴', hp: 195, pattern: [{ type: 'defend', value: 21, label: '天吴·八面听潮' }, { type: 'attack', value: 6, hits: 4, label: '天吴·四风卷海' }, { type: 'charge', value: 15, label: '天吴·朝阳聚浪' }, { type: 'attack', value: 24, label: '天吴·八风齐起' }, { type: 'defend', value: 24, label: '天吴·海色归平' }] },
    '句芒': { name: '句芒', hp: 197, pattern: [{ type: 'charge', value: 20, label: '句芒·春木舒枝' }, { type: 'defend', value: 23, label: '句芒·新叶成荫' }, { type: 'attack', value: 11, hits: 2, label: '句芒·双龙踏青' }, { type: 'attack', value: 25, label: '句芒·东风启蛰' }, { type: 'attack', value: 7, hits: 3, label: '句芒·春雷三声' }] },
    '蓐收': { name: '蓐收', hp: 202, pattern: [{ type: 'attack', value: 23, label: '蓐收·秋金试锋' }, { type: 'defend', value: 26, label: '蓐收·白虎守西' }, { type: 'attack', value: 6, hits: 4, label: '蓐收·金风四斩' }, { type: 'charge', value: 16, label: '蓐收·钺影凝霜' }, { type: 'attack', value: 26, label: '蓐收·肃气过山' }] },
    '祝融': { name: '祝融', hp: 206, pattern: [{ type: 'charge', value: 16, label: '祝融·赤龙衔焰' }, { type: 'attack', value: 9, hits: 3, label: '祝融·三焰照海' }, { type: 'defend', value: 22, label: '祝融·火幕连天' }, { type: 'attack', value: 27, label: '祝融·南陆长明' }, { type: 'attack', value: 12, hits: 2, label: '祝融·双龙回火' }] },
    '刑天': { name: '刑天', hp: 212, pattern: [{ type: 'defend', value: 27, label: '刑天·干盾立山' }, { type: 'attack', value: 13, hits: 2, label: '刑天·干戚齐舞' }, { type: 'attack', value: 28, label: '刑天·不屈长鸣' }, { type: 'charge', value: 18, label: '刑天·常羊凝志' }, { type: 'attack', value: 6, hits: 4, label: '刑天·戚锋四转' }] },
    '夸父': { name: '夸父', hp: 215, pattern: [{ type: 'attack', value: 8, hits: 3, label: '夸父·逐日三步' }, { type: 'charge', value: 20, label: '夸父·饮河蓄息' }, { type: 'attack', value: 28, label: '夸父·长杖开途' }, { type: 'defend', value: 26, label: '夸父·杖林成荫' }, { type: 'attack', value: 14, hits: 2, label: '夸父·双岳追光' }] },
    '凤凰': { name: '凤凰', hp: 217, pattern: [{ type: 'defend', value: 26, label: '凤凰·五采成文' }, { type: 'charge', value: 22, label: '凤凰·德音入卷' }, { type: 'attack', value: 6, hits: 5, label: '凤凰·五声和鸣' }, { type: 'defend', value: 29, label: '凤凰·丹穴栖梧' }, { type: 'attack', value: 30, label: '凤凰·朝阳长歌' }] },
    '西王母': { name: '西王母', hp: 228, pattern: [{ type: 'charge', value: 22, label: '西王母·玉山开阙' }, { type: 'attack', value: 14, hits: 2, label: '西王母·虎齿双啸' }, { type: 'defend', value: 29, label: '西王母·豹尾守真' }, { type: 'attack', value: 7, hits: 4, label: '西王母·四野回声' }, { type: 'attack', value: 31, label: '西王母·山海归卷' }] }
  };
  // Every illustration points to an exact source entry, including variant names.
  const artEntries = {
    qinggeng: ['b04-03', '青耕'], xuanwu: ['b01-03', '旋龟', '旋龟负山'],
    baiye: ['b01-24', '白鵺', '白鵺观夜'], tianma: ['b06-20', '天马'],
    bifang: ['b02-08', '毕方'], qiongqi: ['b05-16', '穷奇·翼虎版'],
    jingwei: ['b03-08', '精卫'], zheng: ['b02-07', '狰'],
    huandou: ['b02-30', '朱厌', '朱厌战意'], xiezhi: ['b02-14', '驳（駮）', '驳影逐凶'],
    feiyi: ['b02-02', '肥遗（蛇）'], baize: ['b02-26', '帝江', '帝江启窍'],
    luwu: ['b02-19', '陆吾'], yingzhao: ['b02-24', '英招'],
    fuzhu: ['b01-10', '赤鱬', '赤鱬引潮'], jiuwei: ['b01-08', '九尾狐'],
    zhulong: ['b05-02', '烛龙／烛阴'], yinglong: ['b05-01', '应龙'],
    fenghuang: ['b01-19', '凤凰'], taotie: ['b03-04', '狍鸮', '狍鸮噬元'],
    guche: ['b05-06', '九凤'], tengshe: ['b05-05', '巴蛇', '巴蛇护主'],
    pixiu: ['b06-15', '狪狪', '狪狪衔珠'], kunpeng: ['b02-28', '文鳐鱼', '文鳐扶摇']
  };
  CARDS.forEach(card => {
    const entry = artEntries[card.id];
    card.artId = entry[0]; card.creatureName = entry[1];
    if (entry[2]) card.name = entry[2];
  });
  RELICS.find(relic => relic.id === 'horn').name = '乘黄角';
  const creatureAliases = {
    '饕餮': 'b03-04', '狍鸮': 'b03-04', '烛龙': 'b05-02', '穷奇': 'b05-16',
    '肥遗': 'b02-02', '讙': 'b02-15', '狰': 'b02-07', '蛊雕': 'b01-18',
    '朱厌': 'b02-30', '相柳': 'b05-04', '鹿蜀': 'b01-02', '虎蛟': 'b01-16',
    '蠃鱼': 'b02-11', '文鳐鱼': 'b02-28', '酸与': 'b03-11', '鵸鵌': 'b01-20',
    '英招': 'b02-24', '驳': 'b02-14', '孟极': 'b02-32', '诸怀': 'b02-42',
    '天狗': 'b02-38', '蜚': 'b06-09', '毕方': 'b02-08', '禺强': 'b05-23',
    '九凤': 'b05-06', '陆吾': 'b02-19', '帝江': 'b02-26', '应龙': 'b05-01',
    '夔': 'b05-03', '鸣蛇': 'b02-31', '化蛇': 'b04-05', '计蒙': 'b04-15',
    '类': 'b01-05', '灌灌': 'b01-09', '狡': 'b02-06', '孟槐': 'b03-06',
    '山膏': 'b04-18', '猾褢': 'b01-14', '诸犍': 'b03-03', '猲狙': 'b03-22',
    '从从': 'b06-03', '狌狌': 'b01-01', '钦原': 'b02-21', '鬿雀': 'b06-13',
    '开明兽': 'b05-09', '乘黄': 'b05-14', '强良': 'b05-07', '天吴': 'b05-08',
    '句芒': 'b05-30', '蓐收': 'b05-32', '祝融': 'b05-31', '刑天': 'b05-28',
    '夸父': 'b05-29', '凤凰': 'b01-19', '西王母': 'b05-24'
  };
  Object.entries(ENEMIES).forEach(([id, enemy]) => {
    enemy.artId = creatureAliases[id];
    enemy.pattern.forEach(Object.freeze); Object.freeze(enemy.pattern); Object.freeze(enemy);
  });
  Object.freeze(ENEMIES);
  const idMap = rows => Object.assign(Object.create(null), Object.fromEntries(rows.map(item => [item.id, item])));
  const cardById = idMap(CARDS);
  const relicById = idMap(RELICS);
  const difficultyById = idMap(DIFFICULTIES);
  const starterById = idMap(STARTERS);
  const campaignById = idMap(CAMPAIGNS);
  const difficultyOf = state => difficultyById[state.difficulty] || difficultyById.standard;
  function getChapterCount(state) { return (state && campaignById[state.campaign] || campaignById.classic).chapters; }

  function getCard(id) {
    const upgraded = String(id).endsWith('+');
    const base = cardById[upgraded ? String(id).slice(0, -1) : id];
    if (!base) return null;
    const card = Object.assign({}, base, { effect: Object.assign({}, base.effect) });
    if (upgraded) {
      Object.assign(card.effect, base.upgrade || {});
      card.id = id;
      card.name += '·觉醒';
      card.description = base.upgradedDescription || base.description;
      card.upgraded = true;
      if (base.upgrade && base.upgrade.cost !== undefined) card.cost = base.upgrade.cost;
    }
    return card;
  }
  function getRelic(id) { return relicById[id] || null; }
  function getCreature(id) {
    const source = root.GAME_DATA || {};
    const creatures = source.creatures || source.beasts || source.catalog || [];
    const rows = Array.isArray(creatures) ? creatures : Object.values(creatures);
    const card = getCard(id);
    const exact = card ? card.artId : creatureAliases[id] || id;
    const name = card ? card.creatureName : id;
    return rows.find(row => row.id === exact) || rows.find(row => row.id === id || row.name === id || row.name === name || row.id === name) || rows.find(row => row.name.includes(name)) || { id: exact, name: name, description: '山海有灵，万物有踪。', image: null };
  }
  function random(state) {
    let value = state.rng >>> 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    state.rng = value >>> 0;
    return state.rng / 4294967296;
  }
  function shuffle(state, items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random(state) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function seedNumber(seed) {
    let value = 2166136261;
    for (const letter of String(seed)) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
    return (value >>> 0) || 1;
  }
  function log(state, text) {
    if (state.battle) state.battle.log = state.battle.log.concat(text).slice(-12);
    state.message = text;
  }
  function heal(state, amount, adjusted) {
    const scaled = adjusted ? amount : Math.ceil(amount * difficultyOf(state).healMultiplier);
    const actual = Math.max(0, Math.min(scaled, state.maxHp - state.hp));
    state.hp += actual;
    return actual;
  }
  function getRestHeal(state) { return Math.ceil(state.maxHp * 0.3 * difficultyOf(state).healMultiplier); }
  function getScore(state) {
    const stats = state.stats || {};
    const base = (stats.battles || 0) * 100 + (stats.elites || 0) * 80 + (stats.bosses || 0) * 300 + Math.max(0, state.hp || 0) * 2 + (state.phase === 'victory' ? 1000 : 0);
    return Math.round(base * difficultyOf(state).scoreMultiplier);
  }
  function addHistory(state, text, type) {
    state.history.push({ chapter: state.chapter, step: state.step, type: type || 'journey', text: text });
  }
  function makeRoute(state) {
    const c = state.chapter;
    const beasts = REGIONS[c].foes;
    const encounter = beasts[Math.floor(random(state) * beasts.length)];
    const trails = [
      [['山径灵兽', '雾中古祠', '竹影深处，灵兽留下了新的踪迹。'], ['溪桥寻踪', '月下遗祠', '溪水漫过旧石桥，远处传来山海之音。'], ['松间古道', '无名石庙', '风过松梢，古道两端各有一线灵光。']],
      [['凶兽出没', '行商歇脚', '山风骤起，险径与行商的灯火分列两侧。'], ['断崖试锋', '雪中商铃', '断崖下战意未歇，驼铃声从雪线传来。'], ['古垒险关', '星夜集市', '一边是古垒凶影，一边是星夜亮起的货摊。']],
      [['山间灵泉', '渡口试炼', '泉声渐近，渡口仍有强大的灵息。'], ['月照温泉', '云台试炼', '水面映月，云台上的守望者正在等候。'], ['石窟清泉', '林尽试炼', '石隙涌出清泉，林尽处隐约有兽声。']]
    ];
    const trail = state.step < 3 ? trails[state.step][Math.floor(random(state) * trails[state.step].length)] : null;
    const make = (type, name, creatureId, description, suffix) => ({ id: 'c' + c + 's' + state.step + '_' + type + (suffix || ''), type, name, creatureId: creatureId || null, description });
    if (state.step === 0) state.route = [make('battle', trail[0], encounter, trail[2] + '交锋可得灵契与灵玉。'), make('event', trail[1], '九尾狐', '云雾深处的机缘，亦可能藏着代价。')];
    else if (state.step === 1) state.route = [make('elite', trail[0], encounter, trail[2] + '险境胜利可得一件遗珍。'), make('shop', trail[1], '狪狪', '花费灵玉换取灵契、遗珍，或精简一张灵契。')];
    else if (state.step === 2) state.route = [make('rest', trail[0], '赤鱬', '恢复 ' + getRestHeal(state) + ' 点命火，或选择一张灵契觉醒。'), make('battle', trail[1], encounter, trail[2] + '在首领前争取最后的馈赠。')];
    else state.route = [make('boss', REGIONS[c].boss + '之境', REGIONS[c].boss, '镇守此境的山海之灵。通过它的试炼，续写山海。')];
    state.phase = 'map';
  }
  function newRun(seed, options) {
    if (seed === undefined) seed = Date.now();
    options = options && typeof options === 'object' ? options : {};
    const starter = starterById[options.starter] || starterById.keeper;
    const difficulty = difficultyById[options.difficulty] || difficultyById.standard;
    const campaign = campaignById[options.campaign] || campaignById.legend18;
    const state = {
      version: 1, seed, rng: seedNumber(seed), phase: 'map', chapter: 0, step: 0,
      starter: starter.id, difficulty: difficulty.id, campaign: campaign.id, chapterCount: campaign.chapters,
      hp: starter.maxHp, maxHp: starter.maxHp, ink: 48,
      deck: starter.deck.slice(),
      relics: starter.relics.slice(), route: [], history: [], battle: null, reward: null, event: null, shop: null,
      stats: { battles: 0, cardsPlayed: 0, damageDealt: 0, elites: 0, bosses: 0, cardsRemoved: 0 },
      message: '执笔入山海。选择一条山径，启程寻灵。', uid: 0, flags: { emberUsed: false }, eventsSeen: []
    };
    makeRoute(state);
    return state;
  }
  function nextStep(state) {
    state.battle = null; state.reward = null; state.event = null; state.shop = null;
    if (state.step === 3) { state.chapter++; state.step = 0; }
    else state.step++;
    if (state.chapter >= getChapterCount(state)) { state.phase = 'victory'; state.chapter = getChapterCount(state) - 1; return; }
    makeRoute(state);
  }
  function draw(state, amount) {
    const b = state.battle;
    for (let i = 0; i < amount && b.hand.length < 10; i++) {
      if (!b.drawPile.length && b.discardPile.length) {
        b.drawPile = shuffle(state, b.discardPile); b.discardPile = [];
      }
      if (!b.drawPile.length) break;
      b.hand.push(b.drawPile.pop());
    }
  }
  function setIntent(state) {
    const b = state.battle;
    const base = b.enemy.pattern[(b.turn - 1) % b.enemy.pattern.length];
    b.enemy.intent = Object.assign({}, base);
    if (base.type === 'attack') {
      const raw = Math.ceil((base.value + (b.enemy.strength || 0)) * difficultyOf(state).enemyAttackMultiplier);
      b.enemy.intent.value = b.enemy.status.weak > 0 ? Math.floor(raw * 0.75) : raw;
    }
    if (base.type === 'charge') b.enemy.intent.strength = 2;
  }
  function getIntentDescription(state) {
    const intent = state.battle && state.battle.enemy.intent;
    if (!intent) return '静候';
    if (intent.type === 'attack') return intent.label + '：造成 ' + intent.value + ' 点伤害' + (intent.hits > 1 ? ' × ' + intent.hits + ' 次（合计 ' + intent.value * intent.hits + ' 点）' : '');
    if (intent.type === 'defend') return intent.label + '：获得 ' + intent.value + ' 点护盾';
    return intent.label + '：获得 ' + intent.value + ' 点护盾与 ' + (intent.strength || 2) + ' 点力量';
  }
  function startCombat(state, node) {
    const template = ENEMIES[node.creatureId] || ENEMIES['讙'];
    const elite = node.type === 'elite';
    const boss = node.type === 'boss';
    const hp = Math.ceil((template.hp + (!boss ? Math.min(state.chapter, 2) * 5 + (elite ? 15 : 0) : 0)) * difficultyOf(state).enemyHpMultiplier);
    const bonus = elite ? 2 : 0;
    const pattern = template.pattern.map(intent => Object.assign({}, intent, { value: intent.value + bonus }));
    const rule = REGIONS[state.chapter].rule || {};
    state.phase = 'combat';
    state.reward = null;
    state.battle = {
      nodeType: node.type, nodeId: node.id,
      enemy: { id: node.creatureId, name: template.name, creatureId: creatureAliases[node.creatureId] || node.creatureId, hp, maxHp: hp, block: rule.enemyBlock || 0, intent: null, strength: rule.enemyStrength || 0, status: { vulnerable: 0, weak: 0, burn: 0 }, pattern },
      hand: [], drawPile: shuffle(state, state.deck.map(id => ({ uid: 'card_' + (++state.uid), id }))), discardPile: [], exhaustPile: [],
      energy: 3 + Number(state.relics.includes('pearl')) + (rule.openingEnergy || 0), maxEnergy: 3 + Number(state.relics.includes('pearl')),
      block: (state.relics.includes('shell') ? 3 : 0) + (rule.playerBlock || 0), turn: 1, playedThisTurn: 0,
      status: { strength: (state.relics.includes('feather') ? 2 : 0) + (rule.playerStrength || 0), thorns: 0 },
      log: ['遭遇' + template.name + '。观其意图，择契而行。'].concat(rule.name ? ['境域「' + rule.name + '」：' + rule.description] : [])
    };
    draw(state, 5 + Number(state.relics.includes('horn')) + (rule.openingDraw || 0));
    setIntent(state);
    state.message = '遭遇' + template.name + '。';
    addHistory(state, node.name + ' · ' + template.name, node.type);
  }
  function damageEnemy(state, amount, bypass) {
    const enemy = state.battle.enemy;
    let value = Math.max(0, Math.floor(amount));
    if (!bypass && enemy.status.vulnerable > 0) value = Math.floor(value * 1.5);
    if (!bypass) {
      const absorbed = Math.min(enemy.block, value);
      enemy.block -= absorbed; value -= absorbed;
    }
    const actual = Math.min(enemy.hp, value);
    enemy.hp -= actual;
    state.stats.damageDealt += actual;
    return actual;
  }
  function randomRelic(state) {
    const pool = RELICS.filter(relic => !state.relics.includes(relic.id));
    return pool.length ? pool[Math.floor(random(state) * pool.length)].id : null;
  }
  function winCombat(state) {
    if (state.phase !== 'combat') return;
    const b = state.battle;
    state.stats.battles++;
    if (b.nodeType === 'elite') state.stats.elites++;
    if (b.nodeType === 'boss') state.stats.bosses++;
    const income = (b.nodeType === 'boss' ? 42 : b.nodeType === 'elite' ? 35 : 22) + state.chapter * 5 + (state.relics.includes('coin') ? 12 : 0);
    state.ink += income;
    let restored = state.relics.includes('jade') ? heal(state, 5) : 0;
    const chapterHeal = b.nodeType === 'boss' && getChapterCount(state) > 3 ? heal(state, Math.ceil(state.maxHp * .3) + 8) : 0;
    restored += chapterHeal;
    addHistory(state, '收服' + b.enemy.name + '，获得 ' + income + ' 枚灵玉。', 'win');
    if (b.nodeType === 'boss' && getChapterCount(state) > 3) addHistory(state, '此境试炼已成，灯火重明，恢复 ' + chapterHeal + ' 点命火。', 'chapterHeal');
    const starters = ['qinggeng', 'xuanwu', 'baiye'];
    const pool = CARDS.filter(card => !starters.includes(card.id));
    const cards = shuffle(state, pool).slice(0, 3).map(card => card.id);
    const relic = b.nodeType === 'elite' || b.nodeType === 'boss' ? randomRelic(state) : null;
    if (relic) state.relics.push(relic);
    state.reward = { cards, ink: income, heal: restored, chapterHeal, relic, enemyName: b.enemy.name, boss: b.nodeType === 'boss' };
    log(state, '灵契已成。获得 ' + income + ' 枚灵玉' + (relic ? '与遗物「' + getRelic(relic).name + '」' : '') + '。');
    if (b.nodeType === 'boss' && state.chapter === getChapterCount(state) - 1) {
      state.phase = 'victory';
      const ending = { classic: '三境俱明，山海归藏。你已将烛龙之光收入灵卷。', expanded: '六境相和，赤水长明。九凤的回声为远卷落下终音。', odyssey: '九境同明，风雨归藏。应龙与你共收万里山海，九境之卷终于圆满。', expedition12: '十二境春生，雷声已远。句芒送来新枝，为远征之卷写下生生不息的尾声。', saga15: '十五境不息，干戚犹舞。你带着刑天的不屈之志，让大荒长卷在灯火中收拢。', legend18: '十八境俱明，山海皆入卷。逐日的足音与五采的和鸣汇入玉山，西王母与你共阅来路，照夜长卷至此圆满。' };
      state.message = ending[state.campaign] || ending.classic;
      addHistory(state, state.message, 'victory');
    } else state.phase = 'reward';
  }
  function applyCard(state, uid) {
    const b = state.battle;
    const index = b.hand.findIndex(card => card.uid === uid);
    if (index < 0) return;
    const instance = b.hand[index];
    const card = getCard(instance.id);
    if (!card || card.cost > b.energy) { state.message = '灵力不足。'; return; }
    b.hand.splice(index, 1);
    b.energy -= card.cost;
    b.playedThisTurn++;
    state.stats.cardsPlayed++;
    const effect = card.effect;
    let damage = 0;
    if (effect.damage) for (let i = 0; i < (effect.hits || 1); i++) damage += damageEnemy(state, effect.damage + b.status.strength, false);
    if (effect.block) b.block += effect.block;
    if (effect.heal) heal(state, effect.heal);
    if (effect.energy) b.energy += effect.energy;
    if (effect.strength) b.status.strength += effect.strength;
    if (effect.thorns) b.status.thorns += effect.thorns;
    if (effect.maxEnergy) { b.maxEnergy += effect.maxEnergy; b.energy += effect.maxEnergy; }
    if (effect.ink) state.ink += effect.ink;
    ['vulnerable', 'weak', 'burn'].forEach(status => { if (effect[status]) b.enemy.status[status] += effect[status]; });
    if (effect.draw) draw(state, effect.draw);
    (effect.exhaust ? b.exhaustPile : b.discardPile).push(instance);
    log(state, '施展「' + card.name + '」' + (damage ? '，造成 ' + damage + ' 点伤害' : '') + '。');
    setIntent(state);
    if (b.enemy.hp <= 0) winCombat(state);
  }
  function hurtPlayer(state, damage) {
    const b = state.battle;
    const blocked = Math.min(b.block, damage);
    b.block -= blocked;
    const suffered = damage - blocked;
    state.hp = Math.max(0, state.hp - suffered);
    if (state.hp === 0 && state.relics.includes('ember') && !state.flags.emberUsed) {
      state.flags.emberUsed = true; state.hp = Math.min(30, state.maxHp);
      log(state, '不灭凤心燃起，你恢复了 ' + state.hp + ' 点生命。');
    }
    return suffered;
  }
  function endTurn(state) {
    const b = state.battle;
    b.discardPile.push.apply(b.discardPile, b.hand); b.hand = [];
    b.enemy.block = 0;
    if (b.enemy.status.burn > 0) {
      const damage = damageEnemy(state, b.enemy.status.burn, true);
      b.enemy.status.burn--;
      log(state, '灼烧造成 ' + damage + ' 点伤害。');
      if (b.enemy.hp <= 0) { winCombat(state); return; }
    }
    const intent = b.enemy.intent;
    if (intent.type === 'attack') {
      let suffered = 0, hits = 0;
      for (; hits < (intent.hits || 1); hits++) {
        suffered += hurtPlayer(state, intent.value);
        if (b.status.thorns > 0) damageEnemy(state, b.status.thorns, true);
        if (state.hp <= 0 || b.enemy.hp <= 0) { hits++; break; }
      }
      log(state, b.enemy.name + '施展「' + intent.label + '」，你受到 ' + suffered + ' 点伤害。');
      if (b.status.thorns > 0) {
        log(state, '反伤回应了 ' + hits + ' 次攻击，每次反弹 ' + b.status.thorns + ' 点伤害。');
      }
    } else if (intent.type === 'defend') {
      b.enemy.block = intent.value;
      log(state, b.enemy.name + '获得 ' + intent.value + ' 点护盾。');
    } else {
      b.enemy.block = intent.value; b.enemy.strength += intent.strength || 2;
      log(state, b.enemy.name + '蓄势：获得 ' + intent.value + ' 点护盾与 ' + (intent.strength || 2) + ' 点力量。');
    }
    if (state.hp <= 0) {
      state.phase = 'defeat'; state.message = '灵卷暂歇。山海仍在，愿君再来。';
      addHistory(state, '止步于' + b.enemy.name + '之境。', 'defeat');
      return;
    }
    if (b.enemy.hp <= 0) { winCombat(state); return; }
    b.enemy.status.vulnerable = Math.max(0, b.enemy.status.vulnerable - 1);
    b.enemy.status.weak = Math.max(0, b.enemy.status.weak - 1);
    b.turn++; b.playedThisTurn = 0;
    b.energy = b.maxEnergy;
    b.block = state.relics.includes('shell') ? 3 : 0;
    draw(state, 5 + Number(state.relics.includes('horn')));
    setIntent(state);
  }
  function openEvent(state) {
    const events = [
      { title: '青丘夜语', creatureId: '九尾狐', text: '月色落在古树间。九尾狐衔来一枚暖玉：“世间之得，皆有所换。执卷人，你愿换取什么？”', choices: [
        { id: 'fox_heal', label: '收下暖玉', description: '恢复 ' + Math.ceil(18 * difficultyOf(state).healMultiplier) + ' 点命火。' },
        { id: 'fox_card', label: '缔结灵契', description: '失去 7 点生命，获得「九尾借灵」（至少需 8 点生命）。' }
      ] },
      { title: '精卫填海', creatureId: '精卫', text: '小小的精卫在浪间往返。你俯身拾起一枚石子，海潮仿佛也静了片刻。它将衔来的枝木轻轻放在你手中。', choices: [
        { id: 'bird_card', label: '助它一程', description: '获得「精卫衔春」与 12 枚灵玉。' },
        { id: 'bird_upgrade', label: '以石磨契', description: '选择一张灵契觉醒；若已全部觉醒，恢复 ' + Math.ceil(12 * difficultyOf(state).healMultiplier) + ' 点命火。' }
      ] },
      { title: '帝江遗梦', creatureId: '帝江', text: '残碑上刻着失传的山海之名。帝江的幻影伴着远古乐音缓缓起舞。碑前有两道微光，等待你的选择。', choices: [
        { id: 'stone_card', label: '聆听远古之乐', description: '获得「帝江启窍」。' },
        { id: 'stone_gold', label: '拾遗落灵玉', description: '获得 30 枚灵玉。' }
      ] },
      { title: '旋龟渡川', creatureId: '旋龟', text: '旋龟背着浸在水中的行囊浮上岸来。你可以在它守护的浅滩休息，也可涉过急流取回失落的玉囊。', choices: [
        { id: 'river_heal', label: '倚甲听水', description: '恢复 ' + Math.ceil(14 * difficultyOf(state).healMultiplier) + ' 点命火。' },
        { id: 'river_ink', label: '涉流拾玉', description: '失去 10 点命火，获得 42 枚灵玉；至少需要 11 点命火。' }
      ] },
      { title: '乘黄赠角', creatureId: '乘黄', text: '白兽踏过石阶，在你面前停下。它以角轻触灯盏，灯芯迸出一颗不散的火星。', choices: [
        { id: 'light_gift', label: '温养灯芯', description: '支付 18 枚灵玉，最大命火 +8，并恢复 ' + Math.ceil(8 * difficultyOf(state).healMultiplier) + ' 点命火。' },
        { id: 'light_ink', label: '守住此刻', description: '收下 15 枚灵玉，继续前行。' }
      ] },
      { title: '巴蛇守夜', creatureId: '巴蛇', text: '巨蛇盘在废弃驿站外，替风雨中的旅人守住一处安宁。灯下的旧卷上留着它的灵契。', choices: [
        { id: 'serpent_card', label: '为它添灯', description: '支付 20 枚灵玉，获得「巴蛇护主」。' },
        { id: 'serpent_heal', label: '借宿一夜', description: '恢复 ' + Math.ceil(10 * difficultyOf(state).healMultiplier) + ' 点命火。' }
      ] }
    ];
    if (!Array.isArray(state.eventsSeen)) state.eventsSeen = [];
    let available = events.filter(event => !state.eventsSeen.includes(event.title));
    if (!available.length) { state.eventsSeen = []; available = events; }
    const event = available[Math.floor(random(state) * available.length)];
    state.eventsSeen.push(event.title);
    state.event = event; state.phase = 'event';
    addHistory(state, event.title, 'event');
  }
  function upgradeRandom(state) {
    const indices = state.deck.map((id, index) => !id.endsWith('+') ? index : -1).filter(index => index >= 0);
    if (!indices.length) { const actual = heal(state, 12); return '灵契皆已觉醒，恢复 ' + actual + ' 点生命。'; }
    const index = indices[Math.floor(random(state) * indices.length)];
    state.deck[index] += '+';
    return '「' + getCard(state.deck[index]).name + '」觉醒。';
  }
  function upgradeSelected(state, index) {
    if (index === undefined) return upgradeRandom(state);
    if (!Number.isInteger(index) || index < 0 || index >= state.deck.length || state.deck[index].endsWith('+')) return null;
    state.deck[index] += '+';
    return '「' + getCard(state.deck[index]).name + '」觉醒。';
  }
  function chooseEvent(state, id, index) {
    if (!state.event.choices.some(choice => choice.id === id)) return;
    let message = '';
    if (id === 'fox_heal') message = '暖玉入怀，恢复 ' + heal(state, 18) + ' 点生命。';
    if (id === 'fox_card') {
      if (state.hp <= 7) { state.message = '至少需要 8 点生命才能缔结灵契，请选择另一份馈赠。'; return; }
      state.hp -= 7; state.deck.push('jiuwei'); message = '付出 7 点生命，九尾借灵已收入灵卷。';
    }
    if (id === 'bird_card') { state.deck.push('jingwei'); state.ink += 12; message = '获得精卫衔春与 12 枚灵玉。'; }
    if (id === 'bird_upgrade') { message = upgradeSelected(state, index); if (message === null) return; }
    if (id === 'stone_card') { state.deck.push('baize'); message = '帝江启窍已收入灵卷。'; }
    if (id === 'stone_gold') { state.ink += 30; message = '获得 30 枚灵玉。'; }
    if (id === 'river_heal') message = '旋龟相护，恢复 ' + heal(state, 14) + ' 点命火。';
    if (id === 'river_ink') {
      if (state.hp <= 10) { state.message = '至少需要 11 点命火才能涉流，请选择另一份馈赠。'; return; }
      state.hp -= 10; state.ink += 42; message = '涉流取玉，失去 10 点命火，获得 42 枚灵玉。';
    }
    if (id === 'light_gift') {
      if (state.ink < 18) { state.message = '至少需要 18 枚灵玉才能温养灯芯。'; return; }
      state.ink -= 18; state.maxHp += 8; message = '最大命火增加 8 点，恢复 ' + heal(state, 8) + ' 点命火。';
    }
    if (id === 'light_ink') { state.ink += 15; message = '获得 15 枚灵玉。'; }
    if (id === 'serpent_card') {
      if (state.ink < 20) { state.message = '至少需要 20 枚灵玉才能为它添灯。'; return; }
      state.ink -= 20; state.deck.push('tengshe'); message = '支付 20 枚灵玉，巴蛇护主已收入灵卷。';
    }
    if (id === 'serpent_heal') message = '借宿驿站，恢复 ' + heal(state, 10) + ' 点命火。';
    addHistory(state, message, 'eventReward'); nextStep(state); state.message = message;
  }
  function openShop(state) {
    const cards = shuffle(state, CARDS.filter(card => !['qinggeng', 'xuanwu', 'baiye'].includes(card.id))).slice(0, 4);
    const relic = randomRelic(state);
    state.shop = { cards: cards.map(card => ({ id: card.id, price: card.rarity === 'legendary' ? 62 : card.rarity === 'rare' ? 42 : 28 })), relic: relic ? { id: relic, price: 85 } : null, removeCost: 50 + (state.stats.cardsRemoved || 0) * 15, removeUsed: false };
    state.phase = 'shop'; addHistory(state, '行商歇脚', 'shop');
  }
  function act(state, action) {
    if (!state || state.version !== 1 || !action || typeof action.type !== 'string') return state;
    if (action.type === 'chooseNode' && state.phase === 'map') {
      const node = state.route.find(item => item.id === action.id);
      if (!node) return state;
      if (['battle', 'elite', 'boss'].includes(node.type)) startCombat(state, node);
      else if (node.type === 'event') openEvent(state);
      else if (node.type === 'shop') openShop(state);
      else if (node.type === 'rest') { state.phase = 'rest'; state.message = '恢复 ' + getRestHeal(state) + ' 点命火，或选择一张灵契觉醒；若已全部觉醒，则恢复 ' + Math.ceil(12 * difficultyOf(state).healMultiplier) + ' 点命火。'; }
    } else if (action.type === 'playCard' && state.phase === 'combat') applyCard(state, action.uid);
    else if (action.type === 'endTurn' && state.phase === 'combat') endTurn(state);
    else if (action.type === 'chooseReward' && state.phase === 'reward') {
      if (!state.reward.cards.includes(action.id)) return state;
      state.deck.push(action.id); const name = getCard(action.id).name;
      addHistory(state, '收入灵契「' + name + '」。', 'card'); nextStep(state); state.message = '「' + name + '」已收入灵卷。';
    } else if (action.type === 'skipReward' && state.phase === 'reward') {
      nextStep(state); state.message = '心无旁骛，继续前行。';
    } else if (action.type === 'chooseEvent' && state.phase === 'event') chooseEvent(state, action.id, action.index);
    else if (action.type === 'buyCard' && state.phase === 'shop') {
      const index = state.shop.cards.findIndex(card => card.id === action.id);
      if (index < 0) return state;
      const offer = state.shop.cards[index];
      if (state.ink < offer.price) { state.message = '灵玉不足。'; return state; }
      state.ink -= offer.price; state.deck.push(offer.id); state.shop.cards.splice(index, 1);
      state.message = '购得「' + getCard(offer.id).name + '」。';
    } else if (action.type === 'buyRelic' && state.phase === 'shop') {
      const offer = state.shop.relic;
      if (!offer || (action.id && action.id !== offer.id)) return state;
      if (state.ink < offer.price) { state.message = '灵玉不足。'; return state; }
      state.ink -= offer.price; state.relics.push(offer.id); state.shop.relic = null;
      state.message = '获得遗物「' + getRelic(offer.id).name + '」。';
    } else if (action.type === 'removeCard' && state.phase === 'shop') {
      const index = action.index;
      if (!Number.isInteger(index) || index < 0 || index >= state.deck.length || state.shop.removeUsed || state.deck.length <= 5) return state;
      const cost = state.shop.removeCost === undefined ? 50 + (state.stats.cardsRemoved || 0) * 15 : state.shop.removeCost;
      if (state.ink < cost) { state.message = '灵玉不足，精简灵契需要 ' + cost + ' 枚灵玉。'; return state; }
      const removed = state.deck[index];
      state.ink -= cost; state.deck.splice(index, 1); state.shop.removeUsed = true;
      state.stats.cardsRemoved = (state.stats.cardsRemoved || 0) + 1;
      state.message = '以 ' + cost + ' 枚灵玉解契「' + getCard(removed).name + '」，心灯愈明。';
      addHistory(state, state.message, 'remove');
    } else if (action.type === 'leaveShop' && state.phase === 'shop') {
      nextStep(state); state.message = '辞别行商，继续前行。';
    } else if (action.type === 'rest' && state.phase === 'rest') {
      if (!['heal', 'upgrade'].includes(action.choice)) return state;
      const message = action.choice === 'heal' ? '灵泉疗愈，恢复 ' + heal(state, getRestHeal(state), true) + ' 点生命。' : upgradeSelected(state, action.index);
      if (message === null) return state;
      addHistory(state, message, 'rest'); nextStep(state); state.message = message;
    }
    return state;
  }
  function restoreRun(raw) {
    // Validate before cloning: JSON.stringify would otherwise turn NaN/Infinity into null.
    try {
      let visited = 0;
      const safeData = (value, depth) => {
        if (++visited > 30000 || depth > 18) return false;
        if (value === null || typeof value === 'boolean') return true;
        if (typeof value === 'number') return Number.isFinite(value);
        if (typeof value === 'string') return value.length <= 12000;
        if (!value || typeof value !== 'object') return false;
        if (Array.isArray(value)) return value.length <= 5000 && value.every(item => safeData(item, depth + 1));
        if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
        return Object.keys(value).every(key => !['__proto__', 'prototype', 'constructor'].includes(key) && safeData(value[key], depth + 1));
      };
      const object = value => value && typeof value === 'object' && !Array.isArray(value);
      const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
      const string = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;
      const knownCard = id => typeof id === 'string' && !!getCard(id);
      const validCards = (rows, min, max) => Array.isArray(rows) && rows.length >= min && rows.length <= max && rows.every(knownCard);
      if (!object(raw) || !safeData(raw, 0)) return null;
      const encoded = JSON.stringify(raw);
      if (encoded.length > 1000000) return null;
      const state = JSON.parse(encoded);
      if (state.version !== 1 || !['map', 'combat', 'reward', 'event', 'rest', 'shop', 'victory', 'defeat'].includes(state.phase)) return null;
      if (!(string(state.seed, 200) || (typeof state.seed === 'number' && Number.isFinite(state.seed)))) return null;
      // A missing pair identifies an original three-chapter save. Never extend its finish line.
      if (state.campaign === undefined && state.chapterCount === undefined) { state.campaign = 'classic'; state.chapterCount = 3; }
      if (!campaignById[state.campaign] || state.chapterCount !== campaignById[state.campaign].chapters) return null;
      const chapterCount = getChapterCount(state);
      if (!integer(state.rng, 1, 4294967295) || !integer(state.chapter, 0, chapterCount - 1) || !integer(state.step, 0, 3)) return null;
      if (!integer(state.maxHp, 1, 10000) || !integer(state.hp, 0, state.maxHp) || !integer(state.ink, 0, 10000000)) return null;
      if (!validCards(state.deck, 5, 200) || !Array.isArray(state.relics) || state.relics.length > RELICS.length || new Set(state.relics).size !== state.relics.length || state.relics.some(id => !relicById[id])) return null;
      if (state.starter === undefined) state.starter = 'keeper';
      if (state.difficulty === undefined) state.difficulty = 'standard';
      if (!starterById[state.starter] || !difficultyById[state.difficulty]) return null;
      if (!integer(state.uid, 0, 1000000000)) return null;
      if (!string(state.message, 2000)) return null;
      if (state.recorded !== undefined && typeof state.recorded !== 'boolean') return null;
      if (state.runId !== undefined && (typeof state.runId !== 'string' || !/^[A-Za-z0-9._:-]{1,160}$/.test(state.runId))) return null;
      if (state.startedAt !== undefined && !integer(state.startedAt, 0, 9007199254740991)) return null;
      if (state.flags === undefined) state.flags = {};
      if (!object(state.flags)) return null;
      if (state.flags.emberUsed === undefined) state.flags.emberUsed = false;
      if (typeof state.flags.emberUsed !== 'boolean') return null;
      if (state.stats === undefined) state.stats = {};
      if (!object(state.stats)) return null;
      for (const key of ['battles', 'cardsPlayed', 'damageDealt', 'elites', 'bosses', 'cardsRemoved']) {
        if (state.stats[key] === undefined) state.stats[key] = 0;
        if (!integer(state.stats[key], 0, 1000000000)) return null;
      }
      if (state.stats.battles > chapterCount * 4 || state.stats.elites > chapterCount || state.stats.elites > state.stats.battles || state.stats.bosses > chapterCount || state.stats.bosses > state.stats.battles || state.stats.cardsRemoved > chapterCount) return null;
      if (!Array.isArray(state.history) || state.history.length > 5000 || state.history.some(row => !object(row) || !integer(row.chapter, 0, chapterCount - 1) || !integer(row.step, 0, 3) || !string(row.type, 50) || !string(row.text, 2000))) return null;
      const eventChoices = Object.assign(Object.create(null), {
        '青丘夜语': ['fox_heal', 'fox_card'], '精卫填海': ['bird_card', 'bird_upgrade'], '帝江遗梦': ['stone_card', 'stone_gold'],
        '旋龟渡川': ['river_heal', 'river_ink'], '乘黄赠角': ['light_gift', 'light_ink'], '巴蛇守夜': ['serpent_card', 'serpent_heal']
      });
      if (state.eventsSeen === undefined) state.eventsSeen = [...new Set(state.history.filter(row => row.type === 'event' && eventChoices[row.text]).map(row => row.text))];
      if (!Array.isArray(state.eventsSeen) || state.eventsSeen.length > 6 || new Set(state.eventsSeen).size !== state.eventsSeen.length || state.eventsSeen.some(title => !eventChoices[title])) return null;
      const routeTypes = [['battle', 'event'], ['elite', 'shop'], ['rest', 'battle'], ['boss']][state.step];
      if (!Array.isArray(state.route) || state.route.length !== routeTypes.length) return null;
      for (let index = 0; index < state.route.length; index++) {
        const node = state.route[index];
        if (!object(node) || node.type !== routeTypes[index] || node.id !== 'c' + state.chapter + 's' + state.step + '_' + node.type || !string(node.name, 200) || !string(node.description, 2000) || !string(node.creatureId, 100)) return null;
        if (['battle', 'elite', 'boss'].includes(node.type) && !Object.prototype.hasOwnProperty.call(ENEMIES, node.creatureId)) return null;
        if (['battle', 'elite'].includes(node.type) && !REGIONS[state.chapter].foes.includes(node.creatureId)) return null;
        if (node.type === 'boss' && node.creatureId !== REGIONS[state.chapter].boss) return null;
      }
      for (const key of ['battle', 'reward', 'event', 'shop']) if (state[key] === undefined) state[key] = null;
      const battlePhase = ['combat', 'reward', 'victory', 'defeat'].includes(state.phase);
      if (battlePhase) {
        const b = state.battle;
        if (!object(b) || !['battle', 'elite', 'boss'].includes(b.nodeType) || !integer(b.turn, 1, 1000000) || !integer(b.energy, 0, 100000) || !integer(b.maxEnergy, 3, 100000) || !integer(b.block, 0, 10000000) || !integer(b.playedThisTurn, 0, 1000000000)) return null;
        const node = state.route.find(row => row.id === b.nodeId && row.type === b.nodeType);
        const enemy = b.enemy;
        if (!node || !object(enemy) || enemy.id !== node.creatureId || !ENEMIES[enemy.id]) return null;
        const template = ENEMIES[enemy.id];
        const expectedHp = Math.ceil((template.hp + (b.nodeType !== 'boss' ? Math.min(state.chapter, 2) * 5 + (b.nodeType === 'elite' ? 15 : 0) : 0)) * difficultyOf(state).enemyHpMultiplier);
        if (enemy.name !== template.name || enemy.creatureId !== (creatureAliases[enemy.id] || enemy.id) || enemy.maxHp !== expectedHp || !integer(enemy.hp, 0, enemy.maxHp) || !integer(enemy.block, 0, 10000000) || !integer(enemy.strength, 0, 1000000)) return null;
        if (!object(enemy.status) || ['vulnerable', 'weak', 'burn'].some(key => !integer(enemy.status[key], 0, 1000000))) return null;
        if (!object(b.status) || ['strength', 'thorns'].some(key => !integer(b.status[key], 0, 1000000))) return null;
        if (!Array.isArray(enemy.pattern) || enemy.pattern.length !== template.pattern.length) return null;
        for (let index = 0; index < enemy.pattern.length; index++) {
          const item = enemy.pattern[index], base = template.pattern[index];
          if (!object(item) || item.type !== base.type || item.label !== base.label || item.value !== base.value + (b.nodeType === 'elite' ? 2 : 0) || item.hits !== base.hits) return null;
        }
        if (!object(enemy.intent) || !['attack', 'defend', 'charge'].includes(enemy.intent.type) || !integer(enemy.intent.value, 0, 10000000) || !string(enemy.intent.label, 200)) return null;
        if (enemy.intent.hits !== undefined && !integer(enemy.intent.hits, 1, 8)) return null;
        if (enemy.intent.hits !== template.pattern[(b.turn - 1) % template.pattern.length].hits) return null;
        const instances = [];
        for (const key of ['hand', 'drawPile', 'discardPile', 'exhaustPile']) {
          if (!Array.isArray(b[key]) || b[key].length > (key === 'hand' ? 10 : 200)) return null;
          for (const item of b[key]) {
            if (!object(item) || !knownCard(item.id) || typeof item.uid !== 'string' || !/^card_[1-9]\d*$/.test(item.uid) || !integer(Number(item.uid.slice(5)), 1, state.uid)) return null;
            instances.push(item);
          }
        }
        if (instances.length !== state.deck.length || new Set(instances.map(item => item.uid)).size !== instances.length) return null;
        if (instances.map(item => item.id).sort().join('|') !== state.deck.slice().sort().join('|')) return null;
        if (!Array.isArray(b.log) || b.log.length > 12 || b.log.some(line => !string(line, 2000))) return null;
        if (state.phase === 'combat' && (enemy.hp <= 0 || state.hp <= 0)) return null;
        if (['reward', 'victory'].includes(state.phase) && (enemy.hp !== 0 || state.hp <= 0)) return null;
        if (state.phase === 'defeat' && state.hp !== 0) return null;
        if (state.phase === 'victory' && (state.chapter !== chapterCount - 1 || state.step !== 3 || b.nodeType !== 'boss')) return null;
        // Derived only from saved values. This does not draw cards or advance RNG.
        setIntent(state);
      } else if (state.battle !== null || state.hp <= 0) return null;
      if (['reward', 'victory'].includes(state.phase)) {
        const reward = state.reward;
        if (!object(reward) || !validCards(reward.cards, 3, 3) || new Set(reward.cards).size !== 3 || !integer(reward.ink, 0, 10000) || !integer(reward.heal, 0, state.maxHp) || (reward.relic !== null && (!relicById[reward.relic] || !state.relics.includes(reward.relic))) || reward.enemyName !== state.battle.enemy.name || reward.boss !== (state.battle.nodeType === 'boss')) return null;
        if (reward.chapterHeal !== undefined && (!integer(reward.chapterHeal, 0, reward.heal) || (reward.chapterHeal > 0 && (!reward.boss || chapterCount === 3)))) return null;
      } else if (state.reward !== null) return null;
      if (state.phase === 'event') {
        const event = state.event, choices = event && eventChoices[event.title];
        if (!object(event) || !choices || !string(event.creatureId, 100) || !string(event.text, 4000) || !Array.isArray(event.choices) || event.choices.length !== 2 || event.choices.some((choice, index) => !object(choice) || choice.id !== choices[index] || !string(choice.label, 200) || !string(choice.description, 2000))) return null;
        if (!state.eventsSeen.includes(event.title)) state.eventsSeen.push(event.title);
      } else if (state.event !== null) return null;
      if (state.phase === 'shop') {
        const shop = state.shop;
        if (!object(shop) || !Array.isArray(shop.cards) || shop.cards.length > 4 || new Set(shop.cards.map(row => row && row.id)).size !== shop.cards.length) return null;
        if (shop.cards.some(row => !object(row) || !cardById[row.id] || row.price !== (cardById[row.id].rarity === 'legendary' ? 62 : cardById[row.id].rarity === 'rare' ? 42 : 28))) return null;
        if (shop.relic !== null && (!object(shop.relic) || !relicById[shop.relic.id] || state.relics.includes(shop.relic.id) || shop.relic.price !== 85)) return null;
        if (shop.removeUsed === undefined) shop.removeUsed = false;
        if (typeof shop.removeUsed !== 'boolean' || (shop.removeUsed && state.stats.cardsRemoved < 1)) return null;
        const expectedCost = 50 + (state.stats.cardsRemoved - Number(shop.removeUsed)) * 15;
        if (shop.removeCost === undefined) shop.removeCost = expectedCost;
        if (shop.removeCost !== expectedCost) return null;
      } else if (state.shop !== null) return null;
      return state;
    } catch { return null; }
  }
  root.SHANHAI_ENGINE = { CARDS, RELICS, REGIONS, CAMPAIGNS, ENEMIES, STARTERS, DIFFICULTIES, newRun, act, getCard, getRelic, getCreature, getRestHeal, getScore, getChapterCount, getIntentDescription, restoreRun };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SHANHAI_ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
