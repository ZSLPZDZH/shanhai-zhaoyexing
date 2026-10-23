'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
const D=context.window.GAME_DATA;
const E=require('../engine.js');
const P=require('../profile.js');

function local(target,from=root){
  assert.ok(typeof target==='string'&&target,'Empty local reference');
  const resolved=path.resolve(from,decodeURIComponent(target.split(/[?#]/)[0]));
  assert.ok(resolved===root||resolved.startsWith(root+path.sep),'Reference escapes repository: '+target);
  assert.ok(fs.existsSync(resolved),'Missing local reference: '+target);
  return resolved;
}

assert.equal(D.creatures.length,282);
assert.equal(D.styles.length,6);
assert.equal(E.REGIONS.length,18);
assert.equal(Object.keys(E.ENEMIES).length,54);
assert.equal(E.CARDS.length,24);
assert.equal(E.RELICS.length,7);
assert.equal(P.ACHIEVEMENTS.length,21);
assert.deepEqual(E.CAMPAIGNS.map(c=>c.chapters),[3,6,9,12,15,18]);
const images=new Set();
for(const c of D.creatures){
  assert.equal(c.images.length,6,c.id);
  for(const image of c.images){
    const file=local(image);
    assert.ok(fs.statSync(file).size>100,'Empty image: '+image);
    const b=fs.readFileSync(file);
    assert.equal(b.toString('ascii',0,4),'RIFF',image);
    assert.equal(b.toString('ascii',8,12),'WEBP',image);
    images.add(image);
  }
}
assert.equal(images.size,1692);
for(const b of D.batches){
  local(b.sourceFile);local(b.manifestFile);
  assert.equal(b.source,b.sourceFile,'Batch source must point to bundled document');
}
for(const name of ['b03','b05','b06']){
  const file=local('assets/sources/'+name+'-manifest.json');
  const value=JSON.parse(fs.readFileSync(file,'utf8'));
  const source=value[name==='b06'?'source_document':'source'];
  local(source,path.dirname(file));
  assert.ok(!/^[a-z]:[\\/]/i.test(source),'Local drive path in public source metadata');
}

let references=0;
for(const name of ['README.md','docs/GAME_GUIDE.md','docs/DEVELOPMENT.md','docs/ASSETS.md','index.html','trailer/index.html']){
  const file=local(name),text=fs.readFileSync(file,'utf8');
  const targets=[...text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)|(?:src|href)="([^"]+)"/g)].map(m=>m[1]||m[2]);
  for(const target of targets){
    if(/^(?:https?:|data:|mailto:|#)/i.test(target))continue;
    local(target,path.dirname(file));references++;
  }
}
for(const name of ['banner.png','social-preview.png','gameplay.gif','battle.webp','atlas.webp','gallery.webp','mobile.webp','trailer-cover.jpg'])local('docs/media/'+name);
const social=fs.readFileSync(local('docs/media/social-preview.png'));
assert.equal(social.readUInt32BE(16),1280);
assert.equal(social.readUInt32BE(20),640);
for(const name of ['landscape-60s.mp4','portrait-30s.mp4'])assert.ok(fs.statSync(local('trailer/'+name)).size>1000000);
const index=fs.readFileSync(local('index.html'),'utf8');
assert.ok(index.includes('https://zslpzdzh.github.io/shanhai-zhaoyexing/docs/media/social-preview.png'));
console.log(`Publication verified: 18 realms, 1692 unique bundled WebP images, ${references} local references, 6 portable source records, showcase media, and trailer files.`);
