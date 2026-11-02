// js/templates.js
// 편집기 "틀 넣기" 버튼으로 삽입하는 인물 정보 틀(HTML).
// - 마크다운 안의 HTML 블록은 빈 줄이 나오면 끝나므로 틀 안에 빈 줄을 넣지 않는다.
// - 색은 style 의 --ib-main(제목 띠·항목 칸 배경) / --ib-dark(대사 줄·항목 이름표·테두리) 를 바꿔서 조절한다.
// - 이미지: 🖼 버튼으로 올린 뒤 나온 URL을 src="" 안에 붙여넣는다. 비어 있으면 회색 칸으로 보인다.
// - 표는 3칸: 항목 이름(th) | 국기 칸 | 내용. 국기 칸이 없는 줄은 내용 칸에 colspan="2" 를 쓴다.
// - 펼치기(스포일러 ▼)는 <details><summary> 를 쓴다.

const flag = (code) => `<img class="ib-flag" src="https://flagcdn.com/w40/${code}.png" alt="${code}">`;
const NAMU_IMG = 'https://i.namu.wiki/i/';

export const INFOBOX_TEMPLATE = `<div class="infobox" style="--ib-main:#30af9e; --ib-dark:#222;">
<table>
<tr><td colspan="3" class="ib-title"><strong>록시·이프리타·프라이스</strong><span>ROXY IFRITA PRYCE</span></td></tr>
<tr><td colspan="3" class="ib-quote"><strong>"아가씨, 모든 것이 계획대로라고 하셨는데… 그 안에 『길 잃어버리기』라는 항목도 분명 포함되어 있겠군요"</strong></td></tr>
<tr><td colspan="3" class="ib-image"><img src="${NAMU_IMG}C1E5yDVicOrzMUd6VnofkT3-c0I6N-oRFpN9wsNS9qP6hGmLNGRz12Zz9A2ie9PRXMNo5yXZ2x-zRq9ev385IOuWagMrUf5O2SK0GCaJUbQCLsTuCO8sjeXyFJjaG91iiM3oowdtdEF5wEo0H0z6Fg.webp" alt="록시"></td></tr>
<tr><th><span>본명</span></th><td colspan="2">록시·이프리타·프라이스</td></tr>
<tr><th><span>성별</span></th><td colspan="2">여성</td></tr>
<tr><th><span>키</span></th><td colspan="2">144cm</td></tr>
<tr><th><span>생일</span></th><td colspan="2"><a href="#/w/12월 29일">12월 29일</a></td></tr>
<tr><th><span>진영</span></th><td colspan="2"><img class="ib-icon" src="${NAMU_IMG}HiWHhfeKC21r4o_sU6dRRcRKFaZ0L_qhtXsBJ4qs4Gbedp-u6TLNZpWzl2sAWZ4gBMk4Wu_vY-hXTDBdpFgBU9X8acPzEJEEmMZfpg7zTIbI-BA5082VYKY_lSkJQVRl6L36vDB9oIYVdnZ3x32Gyw.webp" alt="플린트 공방"> <a class="ib-plain" href="#/w/로스캘리퍼·플린트 공방">로스캘리퍼·플린트 공방</a></td></tr>
<tr><th><span>속성</span></th><td colspan="2"><img class="ib-icon ib-icon-dark" src="${NAMU_IMG}ZH6ApRPnfhUzYzoEoB-vWzoefUF0xoqtVG8Fu0Qyz1eL6JapPUwaVgzOBPJ_LReaTAOYytpUjaUGoG_i_K8YEw.webp" alt="바람"> 바람</td></tr>
<tr><th><span>특성</span></th><td colspan="2"><img class="ib-icon ib-icon-dark" src="${NAMU_IMG}Bx8b3xw0bt6RpJ7YoH-hpBp3fNrHL0DzfEBcc0O-fGoTVDAF64_fxjYB8tekh603PZvoqad3XW0KCOwQPtrpKQ.webp" alt="격파"> 격파</td></tr>
<tr><th><span>언어별 표기</span></th><td colspan="2">${flag('us')} Roxy Ifrita Pryce<br>${flag('cn')} <ruby>洛克茜<rt>luòkèxī</rt></ruby>·<ruby>伊芙莉塔<rt>yīfúlìtǎ</rt></ruby>·<ruby>普莱斯<rt>pǔláisī</rt></ruby><br>${flag('jp')} ロクシー・イフリータ・プライス</td></tr>
<tr><th rowspan="4"><span>성우</span></th><td class="ib-flagcell" style="text-align:center">${flag('kr')}</td><td><a href="#/w/이보용">이보용</a></td></tr>
<tr><td class="ib-flagcell">${flag('us')}</td><td><a href="#/w/브린 애프릴">브린 애프릴</a></td></tr>
<tr><td class="ib-flagcell">${flag('cn')}</td><td>류이레이</td></tr>
<tr><td class="ib-flagcell">${flag('jp')}</td><td><a href="#/w/아카사키 치나츠">아카사키 치나츠</a></td></tr>
</table>
</div>
`;
