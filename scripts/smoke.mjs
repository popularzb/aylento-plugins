// Isolated protocol check: no existing credentials, pairing, messages or service
// calls. --workbuddy may download the pinned public client archive via npx.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
const expectedRuntime=pkg.aylentoRuntimeVersion;
if(!expectedRuntime)throw Error('Missing runtime version metadata');
const [mode,archive,...extra]=process.argv.slice(2);
if((mode&&!['--workbuddy','--inventory','--mcpb'].includes(mode))||extra.length)throw Error('Usage: node scripts/smoke.mjs [--inventory | --workbuddy [LOCAL_ARCHIVE] | --mcpb EXTRACTED_DIRECTORY]');
let command=process.execPath,args=[fileURLToPath(new URL('./server.mjs',import.meta.url))],profile='package-check';
if(mode==='--workbuddy'){
 const metadata=JSON.parse(await readFile(new URL('../workbuddy/aylento/connector-meta.json',import.meta.url)));
 const config=JSON.parse(await readFile(new URL('../workbuddy/aylento/mcp.json',import.meta.url)));
 const server=config.mcpServers?.aylento;
 const source=pkg.repository.url.replace(/\.git$/,'')+'/releases/download/v'+pkg.version+'/'+pkg.name+'-'+pkg.version+'.tgz';
 if(metadata.version!==pkg.version||metadata.source!=='aylento'||metadata.type!=='mcp'||metadata.minWorkbuddyVersion!=='5.0.0'||metadata.auth_mode!==undefined||config.preAuth!==undefined||Object.keys(config.mcpServers).length!==1)throw Error('Invalid WorkBuddy metadata');
 if(server.type!=='stdio'||server.command!=='npx'||JSON.stringify(server.args)!==JSON.stringify(['--yes','--ignore-scripts','--package='+source,'--','aylento-client'])||server.runtime?.type!=='node'||server.runtime.version!=='24.15.0'||server.staticEnv?.AYLENTO_PROFILE!=='workbuddy'||server.staticEnv.AYLENTO_BASE_URL!=='https://aylento.com')throw Error('Invalid WorkBuddy launcher');
 command=process.platform==='win32'?'npx.cmd':server.command;args=[...server.args];profile=server.staticEnv.AYLENTO_PROFILE;
 if(archive)args[2]='--package='+resolve(archive);
}
if(mode==='--mcpb'){
 if(!archive)throw Error('Missing extracted MCPB directory');
 args=[join(resolve(archive),'bin/aylento.mjs')];profile='mcpb-check';
}
const directory=await mkdtemp(join(tmpdir(),'aylento-isolated-check-'));
const env={AYLENTO_STATE_DIR:directory,AYLENTO_PROFILE:profile,AYLENTO_BASE_URL:'https://aylento.com',npm_config_cache:join(directory,'npm-cache'),npm_config_userconfig:join(directory,'unused-npmrc'),npm_config_globalconfig:join(directory,'unused-global-npmrc'),npm_config_audit:'false',npm_config_fund:'false',npm_config_update_notifier:'false'};
for(const key of ['PATH','SYSTEMROOT','WINDIR','TEMP','TMP','USERPROFILE','HOME'])if(process.env[key])env[key]=process.env[key];
// Windows native launcher execution still requires host acceptance; this check
// intentionally does not turn arbitrary command arguments into shell input.
const child=spawn(command,args,{env,stdio:['pipe','pipe','pipe']});
child.stderr.resume();
let buffer='',id=0,hasClosed=false;
child.once('close',()=>{hasClosed=true;});
const waiting=new Map();
const error=e=>{for(const p of waiting.values()){clearTimeout(p.timer);p.reject(e);}waiting.clear();};
child.on('error',error);child.on('exit',()=>error(Error('MCP exited before response')));
child.stdout.on('data',chunk=>{
 buffer+=chunk;
 for(let at;(at=buffer.indexOf('\n'))>=0;){
  const line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!line.trim())continue;
  let value;try{value=JSON.parse(line);}catch{return error(Error('Non-JSON output on stdio'));}
  const pending=waiting.get(value.id);if(!pending)continue;
  waiting.delete(value.id);clearTimeout(pending.timer);
  if(value.error)pending.reject(Error('MCP request failed'));else pending.resolve(value.result);
 }
});
function request(method,params){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{waiting.delete(n);reject(Error('MCP timeout'));},mode==='--workbuddy'&&method==='initialize'?90000:15000);waiting.set(n,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n');});}
try{
 const init=await request('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'aylento-offline-release-check',version:'1'}});
 if(init.serverInfo?.name!=='AYLENTO'||init.serverInfo.version!==expectedRuntime)throw Error('Wrong server identity/version');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const tools=await request('tools/list',{});
 if(tools.tools?.length!==36||tools.nextCursor||!tools.tools.some(t=>t.name==='aylento_list_blocked'))throw Error('Incomplete tool inventory');
 const response=await request('tools/call',{name:'aylento_connection_status',arguments:{}});
 if(response.isError||JSON.parse(response.content[0].text).status!=='disconnected')throw Error('Isolation check failed');
 console.log(JSON.stringify({ok:true,tools:36,authorization:'disconnected',profile,launcher:mode==='--workbuddy'?'workbuddy-npx':mode==='--mcpb'?'mcpb-node':'bundled-node',packageSource:mode==='--workbuddy'?(archive?'local-archive':'github-release'):'bundled',modelRoundTrip:'not-tested',platform:process.platform,node:process.version,...(mode==='--inventory'?{inventory:tools,serverInfo:init.serverInfo}:{})}));
}finally{
 const closed=hasClosed?Promise.resolve():once(child,'close').catch(()=>{});child.stdin.end();
 const kill=setTimeout(()=>child.kill('SIGKILL'),3000);await closed;clearTimeout(kill);await rm(directory,{recursive:true,force:true});
}
