"""Build a standalone offline game ZIP from an explicit public-file allowlist."""
from pathlib import Path
import argparse,hashlib,json,zipfile

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser()
ap.add_argument('--version',default='v1.0.0')
args=ap.parse_args()
version=args.version
assert version.startswith('v') and all(c.isalnum() or c in '.-' for c in version)
out=ROOT/'release-artifacts';out.mkdir(exist_ok=True)
archive=out/f'shanhai-zhaoyexing-{version}-offline.zip'
prefix='shanhai-zhaoyexing/'
files=[ROOT/n for n in ['index.html','app.js','style.css','engine.js','profile.js','data.js']]
files+=sorted(p for p in (ROOT/'assets').rglob('*') if p.is_file())
readme='''# 山海·照夜行 · 离线版

完整解压后，用 Chrome 或 Edge 打开同目录 index.html，即可开始十八境远游。
无需安装、账号或联网。请保留 assets 文件夹与所有 JavaScript/CSS 文件。

- 18 境，72 程；六种篇幅与三种流派可选。
- 键盘 1–9 / 0 出牌，E 结束回合，Esc 暂停，? 查看规则。
- 进度保存在当前浏览器；更换电脑、浏览器或入口时，可在设置中导出/导入存档。
- 完整规则见 [游玩指南](docs/GAME_GUIDE.md)。
- 在线试玩：https://zslpzdzh.github.io/shanhai-zhaoyexing/
- GitHub：https://github.com/ZSLPZDZH/shanhai-zhaoyexing

游戏以项目原画、资料与游戏演绎组成；浏览副本与来源稿随包提供。
'''
guide=(ROOT/'docs/GAME_GUIDE.md').read_text(encoding='utf8').replace('(DEVELOPMENT.md)','(https://github.com/ZSLPZDZH/shanhai-zhaoyexing/blob/main/docs/DEVELOPMENT.md)')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for file in files:z.write(file,prefix+file.relative_to(ROOT).as_posix())
    z.writestr(prefix+'README.md',readme)
    z.writestr(prefix+'docs/GAME_GUIDE.md',guide)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    members=z.namelist()
    for file in files:assert hashlib.sha256(z.read(prefix+file.relative_to(ROOT).as_posix())).digest()==hashlib.sha256(file.read_bytes()).digest()
    assert not any('/.git/' in n or '/.workbuddy/' in n or '..' in n.split('/') for n in members)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n',encoding='ascii')
report={'file':archive.name,'sha256':digest,'bytes':archive.stat().st_size,'members':len(members),'gameFilesVerified':len(files),'zipCRC':'passed','fileHashes':'passed','rootFolder':prefix}
(out/'release-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report))
