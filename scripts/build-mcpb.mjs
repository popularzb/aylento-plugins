import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Consume only an already exported public client. Never archive this private repo.
export async function buildMcpb(sourceArg,outputArg){
const source=resolve(sourceArg),output=resolve(outputArg);
const json=v=>JSON.stringify(v,null,2)+'\n';
const sha=b=>createHash('sha256').update(b).digest('hex');
execFileSync(process.execPath,[join(source,'scripts/verify-package.mjs')],{cwd:source,stdio:'pipe'});
const pkg=JSON.parse(await readFile(join(source,'package.json'),'utf8'));
const sourceManifest=JSON.parse(await readFile(join(source,'PACKAGE-MANIFEST.json'),'utf8'));
if(pkg.name!=='aylento-client'||sourceManifest.license!=='PROPRIETARY')throw Error('Expected the approved public client with retained copyright');
await mkdir(output,{recursive:false});
const stage=join(output,'bundle');await mkdir(stage);
const members=[];
async function put(name,bytes){
 await mkdir(dirname(join(stage,name)),{recursive:true});await writeFile(join(stage,name),bytes,{flag:'wx'});members.push(name);
}
for(const [from,to]of [
 ['bin/aylento.mjs','bin/aylento.mjs'],['scripts/server.mjs','scripts/server.mjs'],
 ['scripts/configure.mjs','scripts/configure.mjs'],['scripts/doctor.mjs','scripts/doctor.mjs'],
 ['LICENSE.txt','LICENSE.txt'],['THIRD_PARTY_NOTICES.md','THIRD_PARTY_NOTICES.md'],
 ['plugins/aylento/icon.png','icon.png'],['plugins/aylento/skills/aylento/SKILL.md','skills/aylento/SKILL.md'],
 ['claude/aylento/PRIVACY.md','PRIVACY.md'],
]){
 const record=sourceManifest.files.find(f=>f.path===from),bytes=await readFile(join(source,from));
 if(!record||record.sha256!==sha(bytes)||(await lstat(join(source,from))).isSymbolicLink())throw Error('Unverified public source: '+from);
 await put(to,bytes);
}
const template=await readFile(join(source,'docs/MCPB-README.md'),'utf8');
const readme=template.replaceAll('{{VERSION}}',pkg.version).replaceAll('{{RUNTIME}}',pkg.aylentoRuntimeVersion);
await put('README.md',readme);
const probe=JSON.parse(execFileSync(process.execPath,[join(source,'scripts/smoke.mjs'),'--inventory'],{cwd:source,encoding:'utf8',timeout:30000}));
const inventory=probe.inventory,info=probe.serverInfo;
if(!probe.ok||probe.authorization!=='disconnected'||inventory.tools.length!==36||info.version!==pkg.aylentoRuntimeVersion)throw Error('Isolated MCP inventory mismatch');
const repo=pkg.repository.url.replace(/\.git$/,'');
const manifest={
 manifest_version:'0.3',name:'aylento',display_name:'AYLENTO · 艾伦兔',version:pkg.version,
 description:'Cross-client Agent identity, private messages, groups and block lists. 艾伦兔跨 AI 客户端通信，需用户配对授权。',
 long_description:readme,author:{name:'AYLENTO',url:'https://aylento.com'},
 repository:{type:'git',url:repo+'.git'},homepage:'https://aylento.com',documentation:repo+'/blob/v'+pkg.version+'/README.md',support:repo+'/issues',icon:'icon.png',
 server:{type:'node',entry_point:'bin/aylento.mjs',mcp_config:{command:'node',args:['${__dirname}/bin/aylento.mjs'],env:{AYLENTO_BASE_URL:'https://aylento.com',AYLENTO_PROFILE:'${user_config.profile}'}}},
 compatibility:{runtimes:{node:'>=24.15.0'}},
 user_config:{profile:{type:'string',title:'Local profile / 本地配置名称',description:'Use a distinct profile AND a separate Agent Chat for each host. Keep this value when upgrading. 每个客户端使用独立名称和 Agent Chat，升级时保留。',default:'smithery-local',required:true,sensitive:false}},
 tools:inventory.tools.map(({name,description})=>({name,description})),tools_generated:false,
 keywords:['aylento','艾伦兔','agent','messaging','communication','chat','mcp'],
 license:'LicenseRef-AYLENTO-Client-Use-1.0',privacy_policies:[repo+'/blob/v'+pkg.version+'/claude/aylento/PRIVACY.md'],
};
await put('manifest.json',json(manifest));
// MCPB uses display-only tool fields; Smithery's server card requires inputSchema.
// Submit these through the supported API payload, rather than invalidating MCPB.
const profile=manifest.user_config.profile;
await writeFile(join(output,'publish-payload.json'),json({type:'stdio',runtime:'node',configSchema:{type:'object',properties:{profile:{type:'string',title:profile.title,description:profile.description,default:profile.default}},required:['profile']},serverCard:{serverInfo:{name:'AYLENTO',title:manifest.display_name,version:pkg.version,websiteUrl:manifest.homepage,description:manifest.description},tools:inventory.tools}}));
await put('CONTENTS.json',json({version:pkg.version,files:await Promise.all([...members].sort().map(async path=>({path,sha256:sha(await readFile(join(stage,path)))})))}));
const name='aylento-'+pkg.version+'.mcpb';
const zip='import sys,json,zipfile\nwith zipfile.ZipFile(sys.argv[1], "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:\n for name in json.loads(sys.stdin.read()):\n  info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0)); info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644<<16; z.writestr(info,open(name,"rb").read())';
execFileSync('python3',['-c',zip,join(output,name)],{cwd:stage,input:json([...members].sort())});
const bytes=await readFile(join(output,name));
const record={artifact:name,bytes:bytes.length,sha256:sha(bytes),version:pkg.version,runtimeVersion:info.version,toolCount:inventory.tools.length,node:process.version,os:process.platform,isolatedDisconnectedStartup:true,realModelMessaging:'not tested',publication:'prepared; not yet uploaded',license:manifest.license};
await writeFile(join(output,'构建验证.json'),json(record));
await writeFile(join(output,'SHA256SUMS'),record.sha256+'  '+name+'\n');
return record;
}
if(import.meta.main){
 const [source,output,...extra]=process.argv.slice(2);
 if(!source||!output||extra.length)throw Error('Usage: node scripts/build-mcpb.mjs PUBLIC_CLIENT NEW_OUTPUT');
 console.log(JSON.stringify(await buildMcpb(source,output),null,2));
}
