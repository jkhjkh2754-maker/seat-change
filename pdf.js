// Local, vector PDF export. No roster is sent to a remote PDF service.
export function installPdf(api) {
  const $ = id => document.getElementById(id);
  let busy = false;
  $('downloadPdf').onclick = async () => {
    if (busy) return;
    const snapshot = api.snapshot();
    if (!snapshot) { api.message('유효한 자리 배치 결과가 필요합니다.'); return; }
    busy = true; $('downloadPdf').disabled = true;
    try {
      const {PDFDocument, rgb} = window.PDFLib;
      const response = await fetch(new URL('./fonts/NanumGothic-Regular.ttf', import.meta.url));
      if (!response.ok) throw Error('한글 글꼴을 불러오지 못했습니다.');
      const doc = await PDFDocument.create(); doc.registerFontkit(window.fontkit);
      const font = await doc.embedFont(await response.arrayBuffer(), {subset:false});
      const charset = new Set(font.getCharacterSet());
      const clean = text => String(text).replace(/[\r\n\t]/g, ' ').replace(/[\x00-\x1f\x7f]/g, '');
      const title = clean($('pdfTitle').value.trim() || '우리 반 자리 배치도');
      const landscape = $('pdfOrientation').value === 'landscape';
      const [width,height] = landscape ? [841.89,595.28] : [595.28,841.89];
      const {rows, cols, rowGaps, colGaps, teacher, disabled, students, result} = snapshot;
      const byId = new Map(students.map((s,i)=>[s.id,{...s,display:s.number?`${s.number} · ${s.name}`:`${s.name} [구분 ${i+1}]`} ]));
      const safeText = text => {
        const value = clean(text);
        for (const ch of value) if (!charset.has(ch.codePointAt(0))) throw Error(`글꼴이 지원하지 않는 문자 '${ch}'가 있습니다. 제목·이름을 수정한 뒤 다시 다운로드하세요.`);
        return value;
      };
      const green = rgb(.18,.36,.30), border=rgb(.65,.73,.68);
      function lines(text,size,maxWidth) {
        const out=[]; let line='';
        for(const ch of safeText(text)) {if(font.widthOfTextAtSize(line+ch,size)>maxWidth && line){out.push(line);line='';}line+=ch;}
        if(line)out.push(line);return out.length?out:[''];
      }
      function fit(text,w,h,max=12,min=8) {
        for(let size=max;size>=min;size-=.5){const parts=lines(text,size,w);if(parts.every(p=>font.widthOfTextAtSize(p,size)<=w)&&parts.length*size*1.3<=h)return {parts,size};}
        throw Error('이름 또는 제목이 너무 길어 읽기 좋게 배치할 수 없습니다. A4 방향을 바꾸거나 페이지 분할을 선택하세요. 긴 입력은 줄여 주세요.');
      }
      const gap=12, margin=30;
      const cellW=(width-margin*2-colGaps.length*gap)/cols;
      const split=$('pdfSplit').checked;
      const perPage=split?Math.min(rows,Math.max(1,Math.floor((height-180)/(65+gap)))):rows;
      const order=Array.from({length:rows},(_,i)=>teacher?rows-i:i+1);
      const chunks=[];for(let i=0;i<rows;i+=perPage)chunks.push(order.slice(i,i+perPage));
      for(let pi=0;pi<chunks.length;pi++){
        const page=doc.addPage([width,height]);
        const write=(text,x,y,size=10,color=green)=>page.drawText(safeText(text),{x,y,size,font,color});
        const centered=(text,x,y,w,h,max=12,min=8)=>{const f=fit(text,w,h,max,min);let top=y+h/2+(f.parts.length-1)*f.size*.65;for(const line of f.parts){write(line,x+(w-font.widthOfTextAtSize(line,f.size))/2,top-f.size*.35,f.size);top-=f.size*1.3;}};
        centered(title,margin,height-65,width-margin*2,36,20,12);
        write(`${teacher?'교사 기준 · 아래쪽이 칠판':'학생 기준 · 위쪽이 칠판'} / ${pi+1}쪽 · 전체 ${chunks.length}쪽`,margin,height-82,10);
        const rr=chunks[pi];const horizontalGaps=rr.slice(0,-1).filter(r=>rowGaps.includes(teacher?r-1:r)).length;
        const cellH=(height-210-horizontalGaps*gap)/rr.length;
        if(cellW<30 || cellH<32)throw Error('좌석이 너무 작아집니다. A4 방향을 바꾸거나 페이지 분할을 선택하세요.');
        const boardY=teacher?48:height-126;
        page.drawRectangle({x:width*.25,y:boardY,width:width*.5,height:23,color:green});
        page.drawText('칠판 · 앞쪽',{x:(width-font.widthOfTextAtSize('칠판 · 앞쪽',11))/2,y:boardY+7,font,size:11,color:rgb(1,1,1)});
        const deskY=teacher?boardY+26:boardY-19;
        page.drawRectangle({x:width/2-30,y:deskY,width:60,height:16,color:rgb(.9,.88,.82)});centered('교탁',width/2-30,deskY,60,16,9);
        let y=teacher?height-108:height-159;
        for(const r of rr){let x=margin;
          for(let ci=0;ci<cols;ci++){
            const c=teacher?cols-ci:ci+1,key=`R${r}C${c}`,off=disabled.includes(key);
            page.drawRectangle({x,y:y-cellH,width:cellW,height:cellH,borderColor:border,borderWidth:.7,color:off?rgb(.94,.94,.93):rgb(.97,.985,.97)});
            const student=byId.get(result[key]);const text=off?'제외 좌석':student?student.display:'빈자리';
            centered(text,x+4,y-cellH+17,cellW-8,cellH-23,12);
            centered(key,x+2,y-cellH+2,cellW-4,12,8);
            x+=cellW;if(colGaps.includes(teacher?c-1:c))x+=gap;
          }
          y-=cellH;if(rowGaps.includes(teacher?r-1:r))y-=gap;
        }
        write('통로는 좌석 사이의 넓은 간격으로 표시합니다.',margin,25,8);
      }
      const bytes=await doc.save();
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
      const a=document.createElement('a');a.href=url;a.download=`${title.replace(/[\\/:*?"<>|]/g,'_').slice(0,80)}.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      api.message('PDF 파일을 생성했습니다. 다운로드 목록을 확인하세요.');
    } catch(e) { api.message(`PDF 생성 실패: ${e.message}`); }
    finally { busy=false;api.refresh(); }
  };
}
