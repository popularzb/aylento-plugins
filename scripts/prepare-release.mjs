import {readFile,writeFile,mkdir,copyFile,chmod} from 'node:fs/promises';
import {join,resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {buildMcpb} from './build-mcpb.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const json=v=>JSON.stringify(v,null,2)+'\n';
const sha=b=>createHash('sha256').update(b).digest('hex');
const npmPath=/^(?:bin\/aylento\.mjs|scripts\/(?:server|doctor|configure|smoke|verify-package)\.mjs|package\.json|npm-server\.json|README\.md|HOSTS\.md|VERIFY\.md|LICENSE\.txt|THIRD_PARTY_NOTICES\.md)$/;

export async function prepareRelease(output,{tag}={}){
 output=resolve(output);
 const rel=relative(root,output);
 if(!rel.startsWith('..')||rel==='..')throw Error('Release output must be outside the repository');
 execFileSync(process.execPath,[join(root,'scripts/verify-package.mjs')],{cwd:root,stdio:'pipe'});
 const pkg=JSON.parse(await readFile(join(root,'package.json')));
 if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version))throw Error('Invalid release version');
 if(tag!==undefined&&tag!=='v'+pkg.version)throw Error('Tag and client version differ');
 const manifest=JSON.parse(await readFile(join(root,'PACKAGE-MANIFEST.json')));
 if(tag!==undefined&&manifest.license!=='PROPRIETARY')throw Error('A release requires the owner-selected client license');
 await mkdir(output,{recursive:false});
 const stage=join(output,'npm');await mkdir(stage);
 const npmFiles=[];
 for(const f of manifest.files.filter(f=>npmPath.test(f.path))){
  const dest=f.path==='npm-server.json'?'server.json':f.path;
  await mkdir(dirname(join(stage,dest)),{recursive:true});
  let bytes=await readFile(join(root,f.path));
  if(f.path==='package.json')bytes=Buffer.from(json({...pkg,private:false,files:['bin','scripts','server.json','README.md','HOSTS.md','VERIFY.md','LICENSE.txt','THIRD_PARTY_NOTICES.md','PACKAGE-MANIFEST.json'],scripts:{verify:'node scripts/verify-package.mjs'},publishConfig:{access:'public',registry:'https://registry.npmjs.org'}}));
  if(f.path==='README.md')bytes=await readFile(join(root,'docs/NPM-README.md'));
  await writeFile(join(stage,dest),bytes);
  npmFiles.push({path:dest,bytes:bytes.length,sha256:sha(bytes)});
 }
 await chmod(join(stage,'bin/aylento.mjs'),0o755);
 await writeFile(join(stage,'PACKAGE-MANIFEST.json'),json({...manifest,files:npmFiles}));
 const pack=JSON.parse(execFileSync('npm',['pack','--offline','--ignore-scripts','--json','--pack-destination',output],{cwd:stage,encoding:'utf8',env:{...process.env,npm_config_cache:join(output,'.npm-cache')}}))[0];
 const expected=[...npmFiles.map(f=>f.path),'PACKAGE-MANIFEST.json'].sort();
 if(json(expected)!==json(pack.files.map(f=>f.path).sort()))throw Error('Unexpected npm package contents');
 const names=[pack.filename];
 const zipPython='import sys,json,zipfile\nwith zipfile.ZipFile(sys.argv[1], "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:\n for name in json.loads(sys.stdin.read()):\n  info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0)); info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=(0o100755 if name=="bin/aylento.mjs" else 0o100644)<<16; archive.writestr(info,open(name,"rb").read())';
 for(const [label,prefix]of [['plugins',''],['codex','plugins/aylento/'],['claude-code','claude/aylento/'],['workbuddy','workbuddy/aylento/']]){
  const members=prefix?manifest.files.filter(f=>f.path.startsWith(prefix)).map(f=>f.path.slice(prefix.length)):[...manifest.files.map(f=>f.path),'PACKAGE-MANIFEST.json'];
  const name=`aylento-${label}-${pkg.version}.zip`;
  execFileSync('python3',['-c',zipPython,join(output,name)],{cwd:join(root,prefix),input:json(members.sort())});names.push(name);
 }
 const mcpb=await buildMcpb(root,join(output,'mcpb'));
 await copyFile(join(output,'mcpb',mcpb.artifact),join(output,mcpb.artifact));names.push(mcpb.artifact);
 const repository=pkg.repository.url.replace(/\.git$/,'');
 const registry={$schema:'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',name:pkg.mcpName,title:'AYLENTO · 艾伦兔',description:'Cross-client Agent identity, DMs, groups and block lists. Local MCPB; Node >=24.15; user pairing.',websiteUrl:'https://aylento.com',repository:{url:repository,source:'github'},version:pkg.version,packages:[{registryType:'mcpb',identifier:repository+'/releases/download/v'+pkg.version+'/'+mcpb.artifact,version:pkg.version,fileSha256:mcpb.sha256,transport:{type:'stdio'}}]};
 await writeFile(join(output,'server.json'),json(registry));names.push('server.json');
 const artifacts=await Promise.all(names.map(async name=>{const bytes=await readFile(join(output,name));return{name,bytes:bytes.length,sha256:sha(bytes)};}));
 await writeFile(join(output,'SHA256SUMS'),artifacts.map(a=>a.sha256+'  '+a.name).join('\n')+'\n');
 await copyFile(join(root,'docs/RELEASE-NOTES.md'),join(output,'RELEASE-NOTES.md'));
 await writeFile(join(output,'RELEASE-REVIEW.json'),json({version:pkg.version,license:manifest.license,artifacts,publication:'release-artifact',networkPublishPerformed:false}));
 return{version:pkg.version,artifacts};
}
if(import.meta.main){
 const [output,tag,...rest]=process.argv.slice(2);
 if(!output||rest.length)throw Error('Usage: node scripts/prepare-release.mjs OUTSIDE_DIRECTORY [vVERSION]');
 console.log(json(await prepareRelease(output,{tag})));
}
