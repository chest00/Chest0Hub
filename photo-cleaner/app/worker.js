import {validateSelection,fingerprint,groupExact} from './core.mjs';
self.onmessage=async ({data})=>{
  try {
    validateSelection(data.files);
    const records=[],errors=[];let lastProgress=0;
    for (let id=0;id<data.files.length;id++) {
      const file=data.files[id];
      try {records.push({id,name:file.webkitRelativePath||file.name,size:file.size,sha256:await fingerprint(file)});}
      catch(error) {errors.push({id,name:file.webkitRelativePath||file.name,error:error.message});}
      if(id===data.files.length-1||performance.now()-lastProgress>=100){self.postMessage({type:'progress',done:id+1,total:data.files.length});lastProgress=performance.now();}
    }
    self.postMessage({type:'done',records,errors,groups:groupExact(records)});
  } catch(error) {self.postMessage({type:'error',error:error.message});}
};
