import {readFile,readdir,lstat,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(join(root,'PACKAGE-MANIFEST.json'),'utf8'));
const expected=new Map(manifest.files.map(f=>[f.path,f]));
if(expected.size!==manifest.files.length)throw Error('Duplicate manifest paths');
const actual=[];
async function walk(dir,prefix=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const name=prefix+entry.name;
  if(!prefix && entry.name==='.git')continue;
  const p=join(dir,entry.name),st=await lstat(p);
  if(st.isSymbolicLink()||(!st.isFile()&&!st.isDirectory()))throw Error('Unsupported file type: '+name);
  if(st.isDirectory())await walk(p,name+'/');else if(name!=='PACKAGE-MANIFEST.json')actual.push(name);
 }
}
await walk(root);
if(JSON.stringify(actual.sort())!==JSON.stringify([...expected.keys()].sort()))throw Error('Unexpected or missing package files');
for(const [name,record] of expected){
 if(name.startsWith('/')||name.includes('\\')||name.split('/').includes('..')||resolve(root,name)!==await realpath(join(root,name)))throw Error('Unsafe manifest path');
 const bytes=await readFile(join(root,name));
 if(bytes.length!==record.bytes||createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Checksum mismatch: '+name);
}
console.log(JSON.stringify({ok:true,version:manifest.version,files:actual.length,scope:'package-integrity-only'}));
