import {test} from 'node:test';import assert from 'node:assert/strict';import {assignNumbers,numbered,pasted,csv,roomSize,validateRoster} from '../core.js';
test('번호의 0 보존, 제외와 범위 검사',()=>{assert.deepEqual(numbered('001','004','2').map(s=>s.number),['001','003','004']);assert.throws(()=>numbered('10','1',''));assert.throws(()=>numbered('1','1000000',''));assert.throws(()=>numbered('1','30','31'));});
test('이름, 학번과 탭 입력',()=>{assert.deepEqual(pasted('김하늘\n001 이바다\n002\t박 나무'),[{number:'',name:'김하늘'},{number:'001',name:'이바다'},{number:'002',name:'박 나무'}]);});
test('CSV BOM, 따옴표, 쉼표와 개행',()=>{assert.deepEqual(csv('\ufeff학번,이름\r\n001,"김,하늘"\r\n002,"박\n나무"'),[{number:'001',name:'김,하늘'},{number:'002',name:'박\n나무'}]);assert.throws(()=>csv('001,이름'));assert.throws(()=>csv('학번,이름\n1,"안닫힘'));});
test('동명이인 허용, 학번 중복과 좌석 부족 차단',()=>{assert.deepEqual(validateRoster(pasted('김하늘\n김하늘'),4),[]);assert.match(validateRoster(pasted('001 가\n001 나'),1).join(),/중복 번호/);assert.equal(validateRoster(numbered('1','40',''),40).length,0);});
test('교실 입력 상한',()=>{roomSize(6,6);assert.throws(()=>roomSize(12,12));assert.throws(()=>roomSize(0,5));});

test('번호 없는 이름에 자동 부여하고 기존 번호와 충돌하지 않는다',()=>{const source=[{number:'',name:'가'},{number:'2',name:'나'},{number:'',name:'가'},{number:'001',name:'다'}];assert.deepEqual(assignNumbers(source).map(s=>s.number),['1','2','3','001']);assert.equal(source[0].number,'');});
