import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir=resolve(process.argv[2]||'');
if(process.argv.length!==3)throw Error('Usage: node scripts/publish-npm.mjs RELEASE_DIRECTORY');
const pkg=JSON.parse(await readFile(join(dir,'npm/package.json')));
const review=JSON.parse(await readFile(join(dir,'RELEASE-REVIEW.json')));
if(review.license!=='PROPRIETARY')throw Error('Publication requires the owner-selected client license');
const tar=review.artifacts.find(a=>a.name.endsWith('.tgz'));
const bytes=await readFile(join(dir,tar.name));
if(createHash('sha256').update(bytes).digest('hex')!==tar.sha256)throw Error('Archive changed after validation');
const identity=`${pkg.name}@${pkg.version}`;
const lookup=spawnSync('npm',['view',identity,'dist.integrity','--json','--registry=https://registry.npmjs.org'],{encoding:'utf8'});
if(lookup.status===0){
 const actual=JSON.parse(lookup.stdout),expected='sha512-'+createHash('sha512').update(bytes).digest('base64');
 if(actual!==expected)throw Error('An immutable npm version exists with different contents; choose a new version');
 console.log(identity+' already published with identical contents');
}else{
 let detail;try{detail=JSON.parse(lookup.stdout);}catch{throw Error('Could not check npm version availability');}
 if(detail.error?.code!=='E404')throw Error('npm availability check failed');
 const args=['publish',join(dir,tar.name),'--ignore-scripts','--access','public','--tag',pkg.version.includes('-')?'beta':'latest'];
 if(process.env.GITHUB_ACTIONS==='true')args.push('--provenance');
 const result=spawnSync('npm',args,{stdio:'inherit'});
 if(result.status!==0)throw Error('npm publication did not complete');
}
