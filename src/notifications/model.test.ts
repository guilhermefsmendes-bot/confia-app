import {it} from 'node:test';import assert from 'node:assert/strict';
import {noticeTarget,validTime,DEFAULT_NOTICES} from './model';
it('notification routing rejects external schemes, missing and injected document paths',()=>{
 for(const url of ['https://community?chatId=a&postId=b','javascript:alert(1)','confia://community?chatId=a/b&postId=x','confia://community?postId=x','confia://unknown'])assert.equal(noticeTarget(url),null);
});
it('routes push, check-in, widget and no-habit setup without relying on feed pagination',()=>{
 assert.deepEqual(noticeTarget('confia://community?chatId=thread&postId=older_post&messageId=reply'),{kind:'community',chatId:'thread',postId:'older_post',messageId:'reply'});
 assert.deepEqual(noticeTarget('confia://checkin'),{kind:'checkin'});assert.deepEqual(noticeTarget('confia://habits/log'),{kind:'habit',action:'log'});assert.deepEqual(noticeTarget('confia://habits/setup'),{kind:'habit',action:'setup'});
});
it('default consent is off and reminder time is validated',()=>{assert.equal(DEFAULT_NOTICES.community,false);assert.equal(DEFAULT_NOTICES.reminder,false);assert.equal(DEFAULT_NOTICES.time,'20:30');assert.ok(validTime('00:00'));assert.ok(validTime('23:59'));assert.ok(!validTime('24:00'));assert.ok(!validTime('8:30'));});
