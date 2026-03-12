import React from 'react';

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  BUDDY CREATURE                                                              │
// │  BuddyCreature — SVG avatar that changes with streak stage                  │
// └──────────────────────────────────────────────────────────────────────────────┘
export default function BuddyCreature({stage,eq={}}){
  const s=Math.min(stage,5);
  const cfg=[
    {fill:"#FFF0CC",sk:"#D4A850",ec:"#8B6340",mood:"sleep",path:"M100 72 C145 72 165 108 163 148 C161 188 144 218 100 218 C56 218 39 188 37 148 C35 108 55 72 100 72Z"},
    {fill:"#B8EAFF",sk:"#64C8F0",ec:"#0055AA",mood:"happy",path:"M100 84 C138 84 156 112 156 142 C156 172 138 198 100 198 C62 198 44 172 44 142 C44 112 62 84 100 84Z"},
    {fill:"#4ECDE8",sk:"#1AB0D0",ec:"#005A7A",mood:"happy",path:"M100 78 C144 78 165 108 164 142 C163 176 144 204 100 204 C56 204 37 176 36 142 C35 108 56 78 100 78Z"},
    {fill:"#1AACB0",sk:"#0A8A8A",ec:"#004050",mood:"cool",path:"M100 74 C150 74 174 106 173 142 C172 178 150 208 100 208 C50 208 28 178 27 142 C26 106 50 74 100 74Z"},
    {fill:"#C472E8",sk:"#9030C8",ec:"#3D0070",mood:"power",path:"M100 70 C155 70 180 104 180 142 C180 180 155 212 100 212 C45 212 20 180 20 142 C20 104 45 70 100 70Z"},
    {fill:"#FFB840",sk:"#E07800",ec:"#703000",mood:"legend",path:"M76 72 C72 54 90 48 100 58 C110 48 128 54 124 72 C162 74 184 106 184 142 C184 178 162 212 100 212 C38 212 16 178 16 142 C16 106 38 74 76 72Z"},
  ][s];
  const{fill,sk,ec,mood,path}=cfg;
  const ey=139-s*2,elx=78,erx=122,er=8+s*1.2,my=ey+28+s;
  const hatY=parseInt(path.match(/M\d+ (\d+)/)[1])-2;
  return(
    <svg viewBox="0 0 200 240" style={{width:"100%",height:"100%",overflow:"visible",filter:s>=4?"drop-shadow(0 0 16px "+sk+")":"none"}}>
      <defs>
        <radialGradient id={"bg"+s} cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#fff" stopOpacity="0.25"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient>
        <linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%">{["#F00","#F80","#FF0","#0C0","#00F","#90C"].map((c,i)=><stop key={i} offset={i*20+"%"} stopColor={c}/>)}</linearGradient>
      </defs>
      {eq.special==="wings"&&<><ellipse cx="24" cy={ey+14} rx="22" ry="36" fill="#C8F5D8" stroke="#60D898" strokeWidth="2" transform={"rotate(-20 24 "+(ey+14)+")"} opacity="0.9"/><ellipse cx="176" cy={ey+14} rx="22" ry="36" fill="#C8F5D8" stroke="#60D898" strokeWidth="2" transform={"rotate(20 176 "+(ey+14)+")"} opacity="0.9"/></>}
      {eq.special==="rainbow"&&<path d={"M5 "+(my+55)+" Q100 "+(ey-90)+" 195 "+(my+55)} fill="none" stroke="url(#rG)" strokeWidth="10" strokeLinecap="round" opacity="0.55"/>}
      {eq.body==="cape"&&<path d={"M"+(elx+2)+","+(ey-10)+" L"+(elx-22)+","+(my+55)+" Q100,"+(my+72)+" "+(erx+22)+","+(my+55)+" L"+(erx-2)+","+(ey-10)+"Z"} fill="#6820B0" stroke="#4A10A0" strokeWidth="2" opacity="0.9"/>}
      <path d={path} fill={fill} stroke={sk} strokeWidth="3.5"/><path d={path} fill={"url(#bg"+s+")"}/>
      <ellipse cx="107" cy={my+4} rx="19" ry="13" fill="white" opacity="0.16"/>
      {s>=1&&s<=3&&<><ellipse cx={elx-15} cy={ey+20} rx="11" ry="7" fill="#FF7FA8" opacity="0.38"/><ellipse cx={erx+15} cy={ey+20} rx="11" ry="7" fill="#FF7FA8" opacity="0.38"/></>}
      {s===5&&<><text x="16" y="54" fontSize="14" opacity="0.8" fill="#FFD700">✦</text><text x="166" y="48" fontSize="10" opacity="0.7" fill="#FFD700">✦</text><text x="12" y="185" fontSize="10" opacity="0.6" fill="#FFD700">✦</text><text x="168" y="192" fontSize="13" opacity="0.75" fill="#FFD700">✦</text></>}
      {mood==="sleep"?<><path d={"M"+(elx-9)+" "+ey+" Q"+elx+" "+(ey-10)+" "+(elx+9)+" "+ey} fill="none" stroke={ec} strokeWidth="3.5" strokeLinecap="round"/><path d={"M"+(erx-9)+" "+ey+" Q"+erx+" "+(ey-10)+" "+(erx+9)+" "+ey} fill="none" stroke={ec} strokeWidth="3.5" strokeLinecap="round"/><text x="110" y={ey-4} fontSize="10" fill={ec} opacity="0.6">z</text><text x="121" y={ey-12} fontSize="7" fill={ec} opacity="0.4">z</text></>
      :<><circle cx={elx} cy={ey} r={er} fill="white"/><circle cx={elx+1} cy={ey+1} r={er*0.62} fill={ec}/><circle cx={elx-er*0.28} cy={ey-er*0.28} r={er*0.22} fill="white"/><circle cx={erx} cy={ey} r={er} fill="white"/><circle cx={erx+1} cy={ey+1} r={er*0.62} fill={ec}/><circle cx={erx-er*0.28} cy={ey-er*0.28} r={er*0.22} fill="white"/>{(mood==="power"||mood==="legend")&&<><circle cx={elx} cy={ey} r={er+1.5} fill="none" stroke={sk} strokeWidth="2" opacity="0.4"/><circle cx={erx} cy={ey} r={er+1.5} fill="none" stroke={sk} strokeWidth="2" opacity="0.4"/></>}{mood==="cool"&&<><path d={"M"+(elx-er)+" "+(ey-er-4)+" Q"+elx+" "+(ey-er-11)+" "+(elx+er)+" "+(ey-er-4)} fill="none" stroke={ec} strokeWidth="2.5" strokeLinecap="round"/><path d={"M"+(erx-er)+" "+(ey-er-4)+" Q"+erx+" "+(ey-er-11)+" "+(erx+er)+" "+(ey-er-4)} fill="none" stroke={ec} strokeWidth="2.5" strokeLinecap="round"/></>}</>}
      {eq.face==="sunglasses"&&<><rect x={elx-er-3} y={ey-er-2} width={(er+3)*2} height={(er+3)*2} rx={er+3} fill="rgba(0,0,0,0.82)"/><rect x={erx-er-3} y={ey-er-2} width={(er+3)*2} height={(er+3)*2} rx={er+3} fill="rgba(0,0,0,0.82)"/><rect x={elx+er+1} y={ey-1.5} width={erx-elx-er*2-2} height="3" fill="#111"/></>}
      {eq.face==="heart_eyes"&&[elx,erx].map((cx2,ki)=><path key={ki} d={"M"+cx2+" "+(ey-2)+" C"+(cx2-er*1.1)+" "+(ey-er*1.5)+" "+(cx2-er*1.7)+" "+(ey-2)+" "+cx2+" "+(ey+er*0.9)+" C"+(cx2+er*1.7)+" "+(ey-2)+" "+(cx2+er*1.1)+" "+(ey-er*1.5)+" "+cx2+" "+(ey-2)+"Z"} fill="#FF3D7F" opacity="0.9"/>)}
      {eq.face==="monocle"&&<><circle cx={erx} cy={ey} r={er+4} fill="none" stroke="#9B8030" strokeWidth="2.5"/><line x1={erx+er+4} y1={ey+er+4} x2={erx+er+10} y2={ey+er+18} stroke="#9B8030" strokeWidth="2"/></>}
      {mood!=="sleep"&&(mood==="cool"?<path d={"M"+(100-13)+" "+my+" Q100 "+(my+10)+" "+(100+13)+" "+my} fill="none" stroke={ec} strokeWidth="3" strokeLinecap="round"/>:<path d={"M"+(100-16)+" "+my+" Q100 "+(my+16)+" "+(100+16)+" "+my} fill="none" stroke={ec} strokeWidth="3" strokeLinecap="round"/>)}
      {eq.body==="bow_tie"&&<><polygon points={(100-21)+","+(my+16)+" "+(100-6)+","+(my+24)+" "+(100-21)+","+(my+32)} fill="#FF4D8A" stroke="#D0306A" strokeWidth="1.5"/><polygon points={(100+21)+","+(my+16)+" "+(100+6)+","+(my+24)+" "+(100+21)+","+(my+32)} fill="#FF4D8A" stroke="#D0306A" strokeWidth="1.5"/><circle cx="100" cy={my+24} r="5.5" fill="#FF6BA8"/></>}
      {eq.hat==="party_hat"&&<><polygon points={"100,"+(hatY-48)+" "+(100-30)+","+(hatY-2)+" "+(100+30)+","+(hatY-2)} fill="#FF6BA8" stroke="#D0356E" strokeWidth="2"/><rect x={100-32} y={hatY-8} width="64" height="10" rx="5" fill="#FFC0D8" opacity="0.7"/><circle cx="100" cy={hatY-52} r="5.5" fill="#FFD700"/></>}
      {eq.hat==="crown"&&<><path d={"M"+(100-34)+","+hatY+" L"+(100-34)+","+(hatY-32)+" L"+(100-17)+","+(hatY-19)+" L100,"+(hatY-40)+" L"+(100+17)+","+(hatY-19)+" L"+(100+34)+","+(hatY-32)+" L"+(100+34)+","+hatY+"Z"} fill="#FFD700" stroke="#DAA520" strokeWidth="2.5"/><circle cx={100-17} cy={hatY-19} r="3.5" fill="#FF3333"/><circle cx="100" cy={hatY-40} r="3.5" fill="#4488FF"/><circle cx={100+17} cy={hatY-19} r="3.5" fill="#33CC33"/></>}
      {eq.hat==="wizard_hat"&&<><polygon points={"100,"+(hatY-60)+" "+(100-36)+","+(hatY-2)+" "+(100+36)+","+(hatY-2)} fill="#3A0090" stroke="#7030C0" strokeWidth="2.5"/><ellipse cx="100" cy={hatY-2} rx="40" ry="9" fill="#3A0090" stroke="#7030C0" strokeWidth="2.5"/><text x="88" y={hatY-30} fontSize="13" fill="#FFD700" opacity="0.9">✦</text></>}
      {eq.hat==="santa_hat"&&<><polygon points={"100,"+(hatY-56)+" "+(100-34)+","+(hatY-2)+" "+(100+34)+","+(hatY-2)} fill="#CC0000" stroke="#AA0000" strokeWidth="2"/><rect x={100-36} y={hatY-11} width="72" height="14" rx="7" fill="white"/><circle cx="100" cy={hatY-60} r="8" fill="white"/></>}
      {eq.special==="halo"&&<ellipse cx="100" cy={hatY-22} rx="30" ry="9" fill="rgba(255,220,50,0.75)" stroke="#FFD700" strokeWidth="3.5"/>}
    </svg>
  );
}
