import test from 'node:test';
import assert from 'node:assert/strict';
import { operationsRoute, validateOperation, validateWorkflow, allRows } from '../supabase/functions/paf-api/operations-routes.mjs';

const producer='00000000-0000-4000-8000-000000000001';
const request=(path,method='GET',body)=>new Request(`https://paf.test${path}`,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});

test('coordinator reads the organization and follows cases without identity administration', async()=>{
  const store = {overview:()=>({counts:{producers:445}}),land:()=>({id:producer,version:2})};
  for (const [path,method,body,expected] of [
    ['/api/operations/overview','GET',undefined,200],
    [`/api/operations/land/${producer}/workflow`,'POST',{version:1},200],
    ['/api/operations/conflicts','GET',undefined,403],
    ['/api/operations/producer','POST',{},403],
    [`/api/operations/land/${producer}/correct`,'POST',{},403],
    [`/api/operations/land/${producer}/archive`,'POST',{},403],
  ]) {
    const response=await operationsRoute({request:request(path,method,body),path,admin:true,manageRecords:false,store});
    assert.equal(response.status,expected,path);
  }
});

test('creation requires and forwards the retry-safe submission identifier',async()=>{
  const path='/api/operations/producer', values={nome:'Pessoa Teste',cpf:'52998224725',telefone:'91999999999'};
  const missing=await operationsRoute({request:request(path,'POST',values),path,admin:true,store:{}});
  assert.equal(missing.status,400);
  const response=await operationsRoute({request:request(path,'POST',{...values,clientRequestId:producer}),path,admin:true,store:{write(kind,id,_expected,_values,_actor,key){
    assert.equal(kind,'producer');assert.equal(id,null);assert.equal(key,producer);return {id:producer};
  }}});
  assert.equal(response.status,201);
});
test('operations reject unauthenticated access before querying the store',async()=>{
  const response=await operationsRoute({request:request('/api/operations/overview'),path:'/api/operations/overview',store:{overview(){assert.fail('Unauthorized store access');}},admin:false});
  assert.equal(response.status,401);
});
test('producer and property boundaries reject invalid documents and partial coordinates',()=>{
  assert.throws(()=>validateOperation('producer',{nome:'Pessoa Teste',cpf:'11111111111',telefone:'91999999999'}));
  assert.throws(()=>validateOperation('property',{produtor_id:producer,nome:'Área teste',municipio:'Tomé-Açu',area_hectares:4,latitude:-2,longitude:''}));
  assert.equal(validateOperation('producer',{nome:'Pessoa Teste',cpf:'52998224725',telefone:'+5591999999999'}).telefone,'91999999999');
});
test('workflow requires a current version and only admits supported boolean checklist entries',()=>{
  assert.throws(()=>validateWorkflow({version:0}));
  assert.throws(()=>validateWorkflow({version:1,checklist:{identity:'true'}}));
  const values=validateWorkflow({version:2,checklist:{identity:true,secret:true},internal_note:'Só para a equipe'});
  assert.equal(values.checklist.identity,true);assert.equal(Object.hasOwn(values.checklist,'secret'),false);
});
test('editing accepts PostgreSQL microseconds and reports concurrency conflicts',async()=>{
  let called=false;
  const body={nome:'Pessoa Teste',cpf:'52998224725',telefone:'91999999999',updated_at:'2026-09-29T12:30:00.123456+00:00'};
  const path=`/api/operations/producer/${producer}`;
  const response=await operationsRoute({request:request(path,'PATCH',body),path,admin:true,actor:'Teste',store:{write(_kind,_id,expected){called=true;assert.equal(expected,body.updated_at);return null;}}});
  assert.equal(called,true);assert.equal(response.status,409);
});
test('directory pagination preserves more than one thousand records',async()=>{
  const records=Array.from({length:1201},(_,id)=>({id}));
  const result=await allRows(()=>({range:async(start,end)=>({data:records.slice(start,end+1),error:null})}));
  assert.equal(result.length,1201);assert.equal(result[1200].id,1200);
});
test('visit and task lists use the canonical store with bounded search and pagination', async()=>{
  for (const [endpoint,kind] of [['visits','visit'],['tasks','task']]) {
    const path=`/api/operations/${endpoint}`;
    const response=await operationsRoute({request:request(`${path}?search=Pessoa&page=2&status=pendente`),path,admin:true,store:{activity(actual,filters){
      assert.equal(actual,kind);assert.equal(filters.search,'Pessoa');assert.equal(filters.page,2);
      return {records:[],total:0,page:2,pageSize:25};
    }}});
    assert.equal(response.status,200);
    assert.equal((await response.json()).page,2);
  }
});
