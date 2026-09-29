import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const [directory,mode='both',...extra]=process.argv.slice(2);
if(!directory||extra.length||!['github','registry','both'].includes(mode))throw Error('Usage: node scripts/verify-publication.mjs RELEASE_DIRECTORY [github|registry|both]');
const root=resolve(directory);
const metadata=JSON.parse(await readFile(join(root,'server.json'),'utf8'));
const review=JSON.parse(await readFile(join(root,'RELEASE-REVIEW.json'),'utf8'));
const repository='https://github.com/popularzb/aylento-plugins';
const releaseBase=repository+'/releases/download/v'+review.version+'/';
if(metadata.name!=='io.github.popularzb/aylento'||metadata.version!==review.version||metadata.repository.url!==repository||metadata.packages.length!==1||metadata.packages[0].registryType!=='mcpb'||!metadata.packages[0].identifier.startsWith(releaseBase))throw Error('Unexpected release target');
async function get(url){
 for(let attempt=0;attempt<4;attempt++){
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(45000)});
   if(r.ok)return Buffer.from(await r.arrayBuffer());
   if(![404,429,500,502,503,504].includes(r.status))throw Object.assign(Error('Public verification HTTP '+r.status),{fatal:true});
   if(attempt===3)throw Error('Public verification HTTP '+r.status+' for '+url);
  }catch(e){if(e.fatal||attempt===3)throw e;}
  await new Promise(r=>setTimeout(r,3000*(attempt+1)));
 }
}
const verified=[];
if(mode!=='registry'){
 for(const artifact of review.artifacts){
  if(!/^[a-zA-Z0-9.-]+$/.test(artifact.name))throw Error('Unsafe asset name');
  const bytes=await get(releaseBase+artifact.name);
  if(bytes.length!==artifact.bytes||createHash('sha256').update(bytes).digest('hex')!==artifact.sha256)throw Error('Published asset differs: '+artifact.name);
  verified.push(artifact.name);
 }
 const sums=await get(releaseBase+'SHA256SUMS');
 if(!sums.equals(await readFile(join(root,'SHA256SUMS'))))throw Error('Published SHA256SUMS differs');
 verified.push('SHA256SUMS');
}
if(mode!=='github'){
 const url='https://registry.modelcontextprotocol.io/v0.1/servers/'+encodeURIComponent(metadata.name)+'/versions/'+encodeURIComponent(metadata.version);
 const result=JSON.parse(await get(url));
 const server=result.server;
 if(server?.name!==metadata.name||server.version!==metadata.version||server.packages?.length!==1||server.packages[0].registryType!=='mcpb'||server.packages[0].identifier!==metadata.packages[0].identifier||server.packages[0].fileSha256!==metadata.packages[0].fileSha256||result._meta?.['io.modelcontextprotocol.registry/official']?.status!=='active')throw Error('Published Registry metadata differs or is inactive');
 verified.push('MCP Registry '+metadata.name+'@'+metadata.version);
}
console.log(JSON.stringify({ok:true,version:metadata.version,anonymous:true,verified}));
