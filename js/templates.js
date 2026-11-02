// js/templates.js
// 편집기 "틀 넣기" 버튼으로 삽입하는 인물 정보 틀(HTML).
// - 마크다운 안의 HTML 블록은 빈 줄이 나오면 끝나므로 틀 안에 빈 줄을 넣지 않는다.
// - 색은 style 의 --ib-main(배경) / --ib-accent(금색 글자·띠) 를 바꿔서 조절한다.
// - 이미지: 🖼 버튼으로 올린 뒤 나온 URL을 src="" 안에 붙여넣는다. 비어 있으면 회색 칸으로 보인다.
// - 펼치기(스포일러 ▼)는 <details><summary> 를 쓴다.

const flag = (code) => `<img class="ib-flag" src="https://flagcdn.com/w40/${code}.png" alt="${code}">`;

export const INFOBOX_TEMPLATE = `<div class="infobox" style="--ib-main:#1a1d23; --ib-accent:#b19872;">
<table>
<tr><th colspan="2" class="ib-title"><strong>사이퍼</strong><span>Cipher</span></th></tr>
<tr><td colspan="2" class="ib-image"><img src="" alt="사이퍼"></td></tr>
<tr><th>이름</th><td>사이퍼</td></tr>
<tr><th>본명</th><td>사이퍼라<details><summary> 스포일러 ▼</summary><div>스포일러 내용을 여기에 작성하세요.</div></details></td></tr>
<tr><th>이명</th><td><b>발 빠른 방랑객</b><br><b>변화의 동전</b><br>발 빠른 사이퍼라<br>고양이 괴도<br><ruby>셀레립스<rt>빠른 발</rt></ruby> 경</td></tr>
<tr><th>성별</th><td>여성</td></tr>
<tr><th>소속</th><td><a href="#/w/앰포리어스">앰포리어스</a><small>(<a href="#/w/도로스">도로스</a> → <a href="#/w/오크마">오크마</a>)</small></td></tr>
<tr><th>신권 이행</th><td><a href="#/w/변화의 동전"><b>변화의 동전</b></a></td></tr>
<tr><th>속성</th><td>양자</td></tr>
<tr><th>운명의 길</th><td>공허</td></tr>
<tr><th rowspan="2">언어별 표기</th><td>${flag('kr')} 사이퍼<br>${flag('us')} Cipher<br>${flag('cn')} <ruby>赛飞儿<rt>sàifēiér</rt></ruby><br>${flag('jp')} サフェル</td></tr>
<tr><td><details><summary> 본명 ▼</summary><div>본명 표기를 여기에 작성하세요.</div></details></td></tr>
<tr><th>성우</th><td>${flag('kr')} <a href="#/w/미소(성우)">미소</a><br>${flag('us')} <a href="#/w/셰이 페러데이">셰이 페러데이</a><br>${flag('cn')} <a href="#/w/왕야신">왕야신</a><br>${flag('jp')} <a href="#/w/이토 아야사">이토 아야사</a></td></tr>
</table>
</div>
`;
