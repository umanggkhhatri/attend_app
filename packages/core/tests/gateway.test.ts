import test from 'node:test';
import assert from 'node:assert/strict';
import {createGateway,studentAnalytics} from '../src';
test('local attendance lifecycle matches live demo rules',async()=>{
 const api=createGateway();assert.equal(api.live,false);
 const sid=await api.open('CS3101',{lat:25.535,lon:84.851});
 await assert.rejects(()=>api.open('CS3101',{lat:25.535,lon:84.851}),/existing session/);
 const pos={lat:25.535,lon:84.851,accuracy:10,timestamp:Date.now()};
 const payload=await api.qr(sid);
 await assert.rejects(()=>api.mark('null','2401AI01',pos),/Invalid attendance QR/);
 await assert.rejects(()=>api.mark(payload,'2401AI99',pos),/valid demo student/);
 await assert.rejects(()=>api.mark(payload,'2401AI01',{...pos,timestamp:NaN}),/stale/);
 await assert.rejects(()=>api.mark(payload,'2401AI01',{...pos,lat:25.545}),/within 50m/);
 const first=await api.mark(payload,'2401AI01',pos);assert.equal(first.already,false);
 assert.equal((await api.mark(payload,'2401AI01',pos)).already,true);
 await api.close(sid);
 await assert.rejects(()=>api.qr(sid),/not open/);
 const snapshot=await api.snapshot();const a=studentAnalytics('2401AI01',snapshot)[0];assert.equal(a.total,25);assert.equal(a.attended,15);
 await api.correct(sid,'2401AI01',false,'Reviewed the sample record.');
 const corrected=await api.snapshot();assert.equal(corrected.corrections?.length,1);assert.equal(studentAnalytics('2401AI01',corrected)[0].attended,14);
});
test('cancelled sessions do not change the eligibility denominator',async()=>{
 const api=createGateway();const sid=await api.open('CS3102',{lat:25,lon:84});await api.close(sid,true);
 assert.equal(studentAnalytics('2401AI01',await api.snapshot())[1].total,24);
});
