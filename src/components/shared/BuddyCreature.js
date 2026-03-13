import React from 'react';
import { SHOP_ITEMS } from '../../constants';

// ┌──────────────────────────────────────────────────────────────────────────────┐
// │  BUDDY CREATURE                                                              │
// │  BuddyCreature — SVG avatar that changes with streak stage + equipped items │
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
  
  // Get equipped item details
  const getItem = (cat) => eq[cat] ? SHOP_ITEMS.find(i => i.id === eq[cat]) : null;
  const specialItem = getItem('special');
  const bodyItem = getItem('body');
  const faceItem = getItem('face');
  const hatItem = getItem('hat');
  
  return(
    <svg viewBox="0 0 200 240" style={{width:"100%",height:"100%",overflow:"visible",filter:s>=4?"drop-shadow(0 0 16px "+sk+")":"none"}} className="buddy-svg">
      <defs>
        <radialGradient id={"bg"+s} cx="40%" cy="35%" r="65%"><stop offset="0%" stopColor="#fff" stopOpacity="0.25"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient>
        <linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="0%">{["#F00","#F80","#FF0","#0C0","#00F","#90C"].map((c,i)=><stop key={i} offset={i*20+"%"} stopColor={c}/>)}</linearGradient>
        <radialGradient id="fireG"><stop offset="0%" stopColor="#FFD700"/><stop offset="50%" stopColor="#FF6B00"/><stop offset="100%" stopColor="#FF0000"/></radialGradient>
        <radialGradient id="galaxyG"><stop offset="0%" stopColor="#9333EA"/><stop offset="50%" stopColor="#4F46E5"/><stop offset="100%" stopColor="#1E40AF"/></radialGradient>
      </defs>
      
      {/* SPECIAL EFFECTS - Behind buddy */}
      {specialItem && (
        <>
          {/* Rainbow Aura */}
          {specialItem.id === 'rainbow' && (
            <g className="buddy-rainbow">
              <path d={"M20 "+(my+40)+" Q100 "+(ey-20)+" 180 "+(my+40)} fill="none" stroke="url(#rG)" strokeWidth="8" strokeLinecap="round" opacity="0.55"/>
              {/* Rainbow sparkle particles floating from bottom to top */}
              {[...Array(10)].map((_, i) => (
                <text key={i} x={45 + (i % 5) * 22} y={230} fontSize="16" fill="url(#rG)" opacity="0.8" className="buddy-particle-rise" style={{'--delay': `${i * 0.35}s`, '--drift': `${(Math.random() - 0.5) * 30}px`}}>✨</text>
              ))}
            </g>
          )}
          
          {/* Fire Aura */}
          {specialItem.id === 'fire' && (
            <g className="buddy-fire-aura">
              <circle cx="100" cy={ey+5} r="70" fill="url(#fireG)" opacity="0.3" className="buddy-pulse"/>
              {/* Fire particles floating from bottom to top */}
              {[...Array(10)].map((_, i) => (
                <text key={i} x={45 + (i % 5) * 22} y={230} fontSize="16" fill="#FF6B00" opacity="0.8" className="buddy-particle-rise" style={{'--delay': `${i * 0.35}s`, '--drift': `${(Math.random() - 0.5) * 30}px`}}>🔥</text>
              ))}
            </g>
          )}
          
          {/* Lightning Aura */}
          {specialItem.id === 'lightning' && (
            <g className="buddy-lightning">
              <path d="M100 70 L95 105 L105 105 L100 140" stroke="#FFD700" strokeWidth="4" fill="none" opacity="0.7" className="buddy-flicker"/>
              <path d="M65 95 L60 125 L70 125 L65 155" stroke="#FFD700" strokeWidth="3" fill="none" opacity="0.5" className="buddy-flicker"/>
              <path d="M135 95 L130 125 L140 125 L135 155" stroke="#FFD700" strokeWidth="3" fill="none" opacity="0.5" className="buddy-flicker"/>
            </g>
          )}
          
          {/* Galaxy Aura */}
          {specialItem.id === 'galaxy' && (
            <g className="buddy-galaxy">
              <circle cx="100" cy={ey+5} r="75" fill="url(#galaxyG)" opacity="0.4" className="buddy-pulse"/>
              {/* Stars */}
              {[...Array(12)].map((_, i) => (
                <circle key={`s${i}`} cx={100 + Math.cos(i * 30 * Math.PI / 180) * 60} cy={ey+5 + Math.sin(i * 30 * Math.PI / 180) * 60} 
                  r="2" fill="#FFF" opacity="0.8" className="buddy-twinkle"/>
              ))}
              {/* Star particles floating from bottom to top */}
              {[...Array(10)].map((_, i) => (
                <text key={i} x={45 + (i % 5) * 22} y={230} fontSize="14" fill="#9333EA" opacity="0.8" className="buddy-particle-rise" style={{'--delay': `${i * 0.4}s`, '--drift': `${(Math.random() - 0.5) * 30}px`}}>⭐</text>
              ))}
            </g>
          )}
          
          {/* Sparkles */}
          {specialItem.id === 'sparkles' && (
            <g className="buddy-sparkles">
              {[...Array(8)].map((_, i) => (
                <text key={i} x={40 + (i % 4) * 40} y={90 + Math.floor(i / 4) * 70} fontSize="16" fill="#FFD700" opacity="0.8" className="buddy-twinkle" style={{'--delay': `${i * 0.2}s`}}>✨</text>
              ))}
            </g>
          )}
          
          {/* Hearts */}
          {specialItem.id === 'hearts' && (
            <g className="buddy-hearts">
              {[...Array(6)].map((_, i) => (
                <text key={i} x={45 + (i % 3) * 35} y={85 + Math.floor(i / 3) * 75} fontSize="18" fill="#FF69B4" opacity="0.7" className="buddy-float" style={{'--delay': `${i * 0.3}s`}}>💕</text>
              ))}
            </g>
          )}
          
          {/* Stars */}
          {specialItem.id === 'stars' && (
            <g className="buddy-stars">
              {[...Array(8)].map((_, i) => (
                <text key={i} x={35 + (i % 4) * 40} y={75 + Math.floor(i / 4) * 80} fontSize="14" fill="#FFD700" opacity="0.8" className="buddy-twinkle" style={{'--delay': `${i * 0.25}s`}}>⭐</text>
              ))}
            </g>
          )}
          
          {/* Snow Aura */}
          {specialItem.id === 'snow' && (
            <g className="buddy-snow">
              {[...Array(12)].map((_, i) => (
                <text key={i} x={25 + (i % 4) * 45} y={70 + Math.floor(i / 4) * 50} fontSize="14" fill="#E0F2FE" opacity="0.7" className="buddy-float" style={{'--delay': `${i * 0.15}s`}}>❄️</text>
              ))}
            </g>
          )}
          
          {/* Leaf Swirl */}
          {specialItem.id === 'leaves' && (
            <g className="buddy-leaves">
              {[...Array(10)].map((_, i) => (
                <text key={i} x={35 + (i % 5) * 30} y={80 + Math.floor(i / 5) * 70} fontSize="16" fill="#86EFAC" opacity="0.8" className="buddy-rotate" style={{'--delay': `${i * 0.2}s`}}>🍃</text>
              ))}
            </g>
          )}
          
          {/* Bubbles */}
          {specialItem.id === 'bubbles' && (
            <g className="buddy-bubbles">
              {[...Array(10)].map((_, i) => (
                <circle key={i} cx={40 + (i % 5) * 35} cy={70 + Math.floor(i / 5) * 70} r={4 + (i % 3) * 2} fill="#BAE6FD" opacity="0.6" className="buddy-float" style={{'--delay': `${i * 0.25}s`}}/>
              ))}
            </g>
          )}
          
          {/* Music Notes */}
          {specialItem.id === 'music' && (
            <g className="buddy-music">
              {[...Array(8)].map((_, i) => (
                <text key={i} x={35 + (i % 4) * 40} y={65 + Math.floor(i / 4) * 85} fontSize="18" fill="#C084FC" opacity="0.8" className="buddy-float" style={{'--delay': `${i * 0.3}s`}}>🎵</text>
              ))}
            </g>
          )}
          
          {/* Aurora Borealis */}
          {specialItem.id === 'aurora' && (
            <g className="buddy-aurora">
              <path d="M20 100 Q60 80 100 100 T180 100" fill="none" stroke="#A78BFA" strokeWidth="8" opacity="0.4" className="buddy-pulse"/>
              <path d="M20 120 Q60 100 100 120 T180 120" fill="none" stroke="#60A5FA" strokeWidth="8" opacity="0.4" className="buddy-pulse" style={{'--delay': '0.3s'}}/>
              <path d="M20 140 Q60 120 100 140 T180 140" fill="none" stroke="#34D399" strokeWidth="8" opacity="0.4" className="buddy-pulse" style={{'--delay': '0.6s'}}/>
            </g>
          )}
          
          {/* Crown Glow */}
          {specialItem.id === 'crown_glow' && (
            <g className="buddy-crown-glow">
              <circle cx="100" cy={ey-40} r="50" fill="url(#fireG)" opacity="0.2" className="buddy-pulse"/>
              <text x="85" y={ey-35} fontSize="20" fill="#FFD700" opacity="0.9" className="buddy-shine">👑</text>
            </g>
          )}
          
          {/* Angel Glow */}
          {specialItem.id === 'angel_glow' && (
            <g className="buddy-angel-glow">
              <circle cx="100" cy={ey+20} r="90" fill="#FFF" opacity="0.15" className="buddy-glow"/>
              <circle cx="100" cy={ey+20} r="70" fill="#FFF" opacity="0.2" className="buddy-glow" style={{'--delay': '0.5s'}}/>
              <text x="85" y={ey-35} fontSize="20" fill="#FFD700" opacity="0.9" className="buddy-glow">😇</text>
            </g>
          )}
          
          {/* Demon Flames */}
          {specialItem.id === 'demon_flames' && (
            <g className="buddy-demon-flames">
              <circle cx="100" cy={ey+30} r="85" fill="url(#fireG)" opacity="0.35" className="buddy-flicker"/>
              <text x="85" y={ey-35} fontSize="20" fill="#DC2626" opacity="0.9" className="buddy-flicker">😈</text>
            </g>
          )}
          
          {/* Sakura Petals */}
          {specialItem.id === 'sakura' && (
            <g className="buddy-sakura">
              {[...Array(12)].map((_, i) => (
                <text key={i} x={25 + (i % 4) * 45} y={55 + Math.floor(i / 4) * 55} fontSize="14" fill="#FCA5A5" opacity="0.8" className="buddy-float" style={{'--delay': `${i * 0.2}s`}}>🌸</text>
              ))}
            </g>
          )}
          
          {/* Confetti Burst */}
          {specialItem.id === 'confetti' && (
            <g className="buddy-confetti">
              {[...Array(16)].map((_, i) => (
                <rect key={i} x={30 + (i % 4) * 40} y={60 + Math.floor(i / 4) * 40} width="6" height="6" 
                  fill={['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F'][i % 4]} opacity="0.8" 
                  className="buddy-rotate" style={{'--delay': `${i * 0.1}s`}}/>
              ))}
            </g>
          )}
          
          {/* Magic Circle */}
          {specialItem.id === 'magic_circle' && (
            <g className="buddy-magic-circle">
              <circle cx="100" cy={ey+30} r="75" fill="none" stroke="#A855F7" strokeWidth="3" opacity="0.6" className="buddy-rotate"/>
              <circle cx="100" cy={ey+30} r="60" fill="none" stroke="#C084FC" strokeWidth="2" opacity="0.5" className="buddy-rotate" style={{animationDirection: 'reverse'}}/>
              {[...Array(8)].map((_, i) => (
                <circle key={i} cx={100 + Math.cos(i * 45 * Math.PI / 180) * 75} cy={ey+30 + Math.sin(i * 45 * Math.PI / 180) * 75} 
                  r="4" fill="#A855F7" opacity="0.8" className="buddy-pulse" style={{'--delay': `${i * 0.15}s`}}/>
              ))}
            </g>
          )}
          
          {/* Time Warp */}
          {specialItem.id === 'time_warp' && (
            <g className="buddy-time-warp">
              <circle cx="100" cy={ey+30} r="80" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.5" className="buddy-pulse"/>
              <circle cx="100" cy={ey+30} r="65" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.4" className="buddy-pulse" style={{'--delay': '0.3s'}}/>
              <circle cx="100" cy={ey+30} r="50" fill="none" stroke="#93C5FD" strokeWidth="2" opacity="0.3" className="buddy-pulse" style={{'--delay': '0.6s'}}/>
              <text x="88" y={ey+38} fontSize="18" fill="#3B82F6" opacity="0.9" className="buddy-rotate">⏰</text>
            </g>
          )}
          
          {/* Infinity Aura */}
          {specialItem.id === 'infinity' && (
            <g className="buddy-infinity">
              <circle cx="100" cy={ey+5} r="65" fill="url(#rG)" opacity="0.2" className="buddy-pulse"/>
              {/* Infinity symbol particles floating from bottom to top */}
              {[...Array(10)].map((_, i) => (
                <text key={i} x={45 + (i % 5) * 22} y={230} fontSize="16" fill="url(#rG)" opacity="0.8" className="buddy-particle-rise" style={{'--delay': `${i * 0.35}s`, '--drift': `${(Math.random() - 0.5) * 30}px`}}>♾️</text>
              ))}
            </g>
          )}
        </>
      )}
      
      {/* BODY ITEMS - Behind buddy */}
      {bodyItem && (bodyItem.id === 'cape' || bodyItem.id === 'jetpack' || bodyItem.id === 'wings_small' || bodyItem.id === 'dragon_wings' || bodyItem.id === 'phoenix_wings' || bodyItem.id === 'backpack') && (
        <g className="buddy-body-back">
          {/* Wings */}
          {(bodyItem.id === 'wings_small' || bodyItem.id === 'dragon_wings' || bodyItem.id === 'phoenix_wings') && (
            <g className="buddy-wings">
              <ellipse cx="15" cy={ey+10} rx="28" ry="45" fill={bodyItem.id === 'phoenix_wings' ? '#FF6B00' : bodyItem.id === 'dragon_wings' ? '#9333EA' : '#C8F5D8'} 
                stroke={bodyItem.id === 'phoenix_wings' ? '#FF0000' : bodyItem.id === 'dragon_wings' ? '#6B21A8' : '#60D898'} 
                strokeWidth="2.5" transform={"rotate(-25 15 "+(ey+10)+")"} opacity="0.9"/>
              <ellipse cx="185" cy={ey+10} rx="28" ry="45" fill={bodyItem.id === 'phoenix_wings' ? '#FF6B00' : bodyItem.id === 'dragon_wings' ? '#9333EA' : '#C8F5D8'} 
                stroke={bodyItem.id === 'phoenix_wings' ? '#FF0000' : bodyItem.id === 'dragon_wings' ? '#6B21A8' : '#60D898'} 
                strokeWidth="2.5" transform={"rotate(25 185 "+(ey+10)+")"} opacity="0.9"/>
              {/* Wing details */}
              <ellipse cx="18" cy={ey+15} rx="15" ry="25" fill={bodyItem.id === 'phoenix_wings' ? '#FFD700' : bodyItem.id === 'dragon_wings' ? '#C084FC' : '#A7F3D0'} 
                transform={"rotate(-25 18 "+(ey+15)+")"} opacity="0.6"/>
              <ellipse cx="182" cy={ey+15} rx="15" ry="25" fill={bodyItem.id === 'phoenix_wings' ? '#FFD700' : bodyItem.id === 'dragon_wings' ? '#C084FC' : '#A7F3D0'} 
                transform={"rotate(25 182 "+(ey+15)+")"} opacity="0.6"/>
            </g>
          )}
          
          {/* Cape */}
          {bodyItem.id === 'cape' && (
            <path d={"M"+(elx+5)+","+(ey-15)+" L"+(elx-35)+","+(my+65)+" Q100,"+(my+85)+" "+(erx+35)+","+(my+65)+" L"+(erx-5)+","+(ey-15)+"Z"} 
              fill="#6820B0" stroke="#4A10A0" strokeWidth="2.5" opacity="0.9" className="buddy-cape-flutter"/>
          )}
          
          {/* Jetpack */}
          {bodyItem.id === 'jetpack' && (
            <>
              <rect x="60" y={ey-5} width="80" height="50" rx="10" fill="#4B5563" stroke="#1F2937" strokeWidth="2.5"/>
              <circle cx="80" cy={ey+50} r="8" fill="#FF6B00" opacity="0.8" className="buddy-pulse"/>
              <circle cx="120" cy={ey+50} r="8" fill="#FF6B00" opacity="0.8" className="buddy-pulse"/>
              <rect x="75" y={ey+5} width="15" height="20" rx="3" fill="#6B7280"/>
              <rect x="110" y={ey+5} width="15" height="20" rx="3" fill="#6B7280"/>
            </>
          )}
          
          {/* Backpack */}
          {bodyItem.id === 'backpack' && (
            <>
              <rect x="65" y={ey+5} width="70" height="55" rx="8" fill="#DC2626" stroke="#991B1B" strokeWidth="2.5"/>
              <rect x="75" y={ey+15} width="50" height="35" rx="5" fill="#EF4444"/>
              <line x1="80" y1={ey} x2="80" y2={ey+10} stroke="#991B1B" strokeWidth="3"/>
              <line x1="120" y1={ey} x2="120" y2={ey+10} stroke="#991B1B" strokeWidth="3"/>
            </>
          )}
        </g>
      )}
      
      {/* MAIN BODY */}
      <path d={path} fill={fill} stroke={sk} strokeWidth="3.5"/><path d={path} fill={"url(#bg"+s+")"}/>
      <ellipse cx="107" cy={my+4} rx="19" ry="13" fill="white" opacity="0.16"/>
      {s>=1&&s<=3&&<><ellipse cx={elx-15} cy={ey+20} rx="11" ry="7" fill="#FF7FA8" opacity="0.38"/><ellipse cx={erx+15} cy={ey+20} rx="11" ry="7" fill="#FF7FA8" opacity="0.38"/></>}
      {s===5&&<><text x="16" y="54" fontSize="14" opacity="0.8" fill="#FFD700">✦</text><text x="166" y="48" fontSize="10" opacity="0.7" fill="#FFD700">✦</text><text x="12" y="185" fontSize="10" opacity="0.6" fill="#FFD700">✦</text><text x="168" y="192" fontSize="13" opacity="0.75" fill="#FFD700">✦</text></>}
      
      {/* EYES */}
      {mood==="sleep"?<><path d={"M"+(elx-9)+" "+ey+" Q"+elx+" "+(ey-10)+" "+(elx+9)+" "+ey} fill="none" stroke={ec} strokeWidth="3.5" strokeLinecap="round"/><path d={"M"+(erx-9)+" "+ey+" Q"+erx+" "+(ey-10)+" "+(erx+9)+" "+ey} fill="none" stroke={ec} strokeWidth="3.5" strokeLinecap="round"/><text x="110" y={ey-4} fontSize="10" fill={ec} opacity="0.6">z</text><text x="121" y={ey-12} fontSize="7" fill={ec} opacity="0.4">z</text></>
      :<><circle cx={elx} cy={ey} r={er} fill="white"/><circle cx={elx+1} cy={ey+1} r={er*0.62} fill={ec}/><circle cx={elx-er*0.28} cy={ey-er*0.28} r={er*0.22} fill="white"/><circle cx={erx} cy={ey} r={er} fill="white"/><circle cx={erx+1} cy={ey+1} r={er*0.62} fill={ec}/><circle cx={erx-er*0.28} cy={ey-er*0.28} r={er*0.22} fill="white"/>{(mood==="power"||mood==="legend")&&<><circle cx={elx} cy={ey} r={er+1.5} fill="none" stroke={sk} strokeWidth="2" opacity="0.4"/><circle cx={erx} cy={ey} r={er+1.5} fill="none" stroke={sk} strokeWidth="2" opacity="0.4"/></>}{mood==="cool"&&<><path d={"M"+(elx-er)+" "+(ey-er-4)+" Q"+elx+" "+(ey-er-11)+" "+(elx+er)+" "+(ey-er-4)} fill="none" stroke={ec} strokeWidth="2.5" strokeLinecap="round"/><path d={"M"+(erx-er)+" "+(ey-er-4)+" Q"+erx+" "+(ey-er-11)+" "+(erx+er)+" "+(ey-er-4)} fill="none" stroke={ec} strokeWidth="2.5" strokeLinecap="round"/></>}</>}
      
      {/* FACE ITEMS */}
      {faceItem && (
        <>
          {faceItem.id === 'sunglasses' && <><rect x={elx-er-3} y={ey-er-2} width={(er+3)*2} height={(er+3)*2} rx={er+3} fill="rgba(0,0,0,0.82)"/><rect x={erx-er-3} y={ey-er-2} width={(er+3)*2} height={(er+3)*2} rx={er+3} fill="rgba(0,0,0,0.82)"/><rect x={elx+er+1} y={ey-1.5} width={erx-elx-er*2-2} height="3" fill="#111"/></>}
          {faceItem.id === 'heart_eyes' && [elx,erx].map((cx2,ki)=><path key={ki} d={"M"+cx2+" "+(ey-2)+" C"+(cx2-er*1.1)+" "+(ey-er*1.5)+" "+(cx2-er*1.7)+" "+(ey-2)+" "+cx2+" "+(ey+er*0.9)+" C"+(cx2+er*1.7)+" "+(ey-2)+" "+(cx2+er*1.1)+" "+(ey-er*1.5)+" "+cx2+" "+(ey-2)+"Z"} fill="#FF3D7F" opacity="0.9"/>)}
          {faceItem.id === 'monocle' && <><circle cx={erx} cy={ey} r={er+4} fill="none" stroke="#9B8030" strokeWidth="2.5"/><line x1={erx+er+4} y1={ey+er+4} x2={erx+er+10} y2={ey+er+18} stroke="#9B8030" strokeWidth="2"/></>}
          {faceItem.id === 'nerd_glasses' && <><rect x={elx-er-2} y={ey-er-1} width={(er+2)*2} height={(er+2)*2} rx={er+2} fill="none" stroke="#000" strokeWidth="2.5"/><rect x={erx-er-2} y={ey-er-1} width={(er+2)*2} height={(er+2)*2} rx={er+2} fill="none" stroke="#000" strokeWidth="2.5"/><rect x={elx+er} y={ey-1} width={erx-elx-er*2} height="2" fill="#000"/></>}
          {faceItem.id === 'star_eyes' && [elx,erx].map((cx2,ki)=><text key={ki} x={cx2-8} y={ey+6} fontSize="16" fill="#FFD700">⭐</text>)}
          {faceItem.id === '3d_glasses' && <><rect x={elx-er-2} y={ey-er-1} width={(er+2)*2} height={(er+2)*2} rx={er+2} fill="rgba(255,0,0,0.5)"/><rect x={erx-er-2} y={ey-er-1} width={(er+2)*2} height={(er+2)*2} rx={er+2} fill="rgba(0,255,255,0.5)"/><rect x={elx+er} y={ey-1} width={erx-elx-er*2} height="2" fill="#000"/></>}
          {faceItem.id === 'ski_goggles' && <><rect x={elx-er-2} y={ey-er-1} width={(er+2)*2} height={(er+2)*2} rx={er+2} fill="rgba(100,200,255,0.4)" stroke="#0EA5E9" strokeWidth="2"/><rect x={erx-er-2} y={ey-er-1} width={(er+2)*2} height={(er+2)*2} rx={er+2} fill="rgba(100,200,255,0.4)" stroke="#0EA5E9" strokeWidth="2"/><rect x={elx+er} y={ey-1} width={erx-elx-er*2} height="2" fill="#0EA5E9"/></>}
          {faceItem.id === 'eye_patch' && <><circle cx={erx} cy={ey} r={er+3} fill="#1F2937" stroke="#000" strokeWidth="2"/><line x1={erx-er-5} y1={ey-er-3} x2={erx+er+5} y2={ey-er-3} stroke="#1F2937" strokeWidth="2.5"/></>}
          {faceItem.id === 'clown_nose' && <><circle cx="100" cy={ey+er+3} r="5" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5"/></>}
          {faceItem.id === 'mustache' && <><ellipse cx={elx+5} cy={ey+er+8} rx="10" ry="4" fill="#1F2937" transform={"rotate(-15 "+(elx+5)+" "+(ey+er+8)+")"}/><ellipse cx={erx-5} cy={ey+er+8} rx="10" ry="4" fill="#1F2937" transform={"rotate(15 "+(erx-5)+" "+(ey+er+8)+")"}/></>}
          {faceItem.id === 'mask' && <><ellipse cx="100" cy={ey+5} rx="25" ry="18" fill="#A855F7" stroke="#7E22CE" strokeWidth="2" opacity="0.9"/><ellipse cx={elx} cy={ey} rx={er+2} ry={er+3} fill="#1F2937"/><ellipse cx={erx} cy={ey} rx={er+2} ry={er+3} fill="#1F2937"/></>}
          {faceItem.id === 'vr_headset' && <><rect x={elx-er-4} y={ey-er-3} width={(er+4)*2} height={(er+4)*2.2} rx="6" fill="#1F2937" stroke="#4B5563" strokeWidth="2"/><rect x={erx-er-4} y={ey-er-3} width={(er+4)*2} height={(er+4)*2.2} rx="6" fill="#1F2937" stroke="#4B5563" strokeWidth="2"/><rect x={elx+er+2} y={ey-2} width={erx-elx-er*2-4} height="4" fill="#4B5563"/><circle cx={elx} cy={ey} r={er-2} fill="#3B82F6" opacity="0.6"/><circle cx={erx} cy={ey} r={er-2} fill="#3B82F6" opacity="0.6"/></>}
          {faceItem.id === 'laser_eyes' && [elx,erx].map((cx2,ki)=><g key={ki}><circle cx={cx2} cy={ey} r={er} fill="#DC2626" opacity="0.8"/><circle cx={cx2} cy={ey} r={er*0.6} fill="#FF0000" opacity="0.9" className="buddy-pulse"/><line x1={cx2} y1={ey} x2={cx2+(ki===0?-30:30)} y2={ey} stroke="#FF0000" strokeWidth="3" opacity="0.7" className="buddy-flicker"/></g>)}
          {faceItem.id === 'rainbow_eyes' && [elx,erx].map((cx2,ki)=><g key={ki}><circle cx={cx2} cy={ey} r={er+1} fill="url(#rG)" opacity="0.9" className="buddy-rainbow"/><circle cx={cx2} cy={ey} r={er*0.5} fill="#FFF" opacity="0.8"/></g>)}
          {faceItem.id === 'galaxy_eyes' && [elx,erx].map((cx2,ki)=><g key={ki}><circle cx={cx2} cy={ey} r={er+1} fill="url(#galaxyG)" opacity="0.9"/><circle cx={cx2-2} cy={ey-2} r="1.5" fill="#FFF" opacity="0.9"/><circle cx={cx2+1} cy={ey+1} r="1" fill="#FFF" opacity="0.7"/><circle cx={cx2} cy={ey+3} r="0.8" fill="#FFF" opacity="0.6"/></g>)}
        </>
      )}
      
      {/* MOUTH */}
      {mood!=="sleep"&&(mood==="cool"?<path d={"M"+(100-13)+" "+my+" Q100 "+(my+10)+" "+(100+13)+" "+my} fill="none" stroke={ec} strokeWidth="3" strokeLinecap="round"/>:<path d={"M"+(100-16)+" "+my+" Q100 "+(my+16)+" "+(100+16)+" "+my} fill="none" stroke={ec} strokeWidth="3" strokeLinecap="round"/>)}
      
      {/* BODY ITEMS - Front */}
      {bodyItem && (
        <>
          {bodyItem.id === 'bow_tie' && <><polygon points={(100-21)+","+(my+16)+" "+(100-6)+","+(my+24)+" "+(100-21)+","+(my+32)} fill="#FF4D8A" stroke="#D0306A" strokeWidth="1.5"/><polygon points={(100+21)+","+(my+16)+" "+(100+6)+","+(my+24)+" "+(100+21)+","+(my+32)} fill="#FF4D8A" stroke="#D0306A" strokeWidth="1.5"/><circle cx="100" cy={my+24} r="5.5" fill="#FF6BA8"/></>}
          {bodyItem.id === 'scarf' && <><path d={"M70 "+(my+20)+" Q100 "+(my+28)+" 130 "+(my+20)} fill="#FF6B6B" stroke="#CC0000" strokeWidth="2"/><rect x="130" y={my+20} width="8" height="30" fill="#FF6B6B" stroke="#CC0000" strokeWidth="1.5"/></>}
          {bodyItem.id === 'tie' && <><path d={"M100 "+(my+15)+" L95 "+(my+45)+" L100 "+(my+50)+" L105 "+(my+45)+"Z"} fill="#1E40AF" stroke="#1E3A8A" strokeWidth="1.5"/><polygon points={"95,"+(my+15)+" 105,"+(my+15)+" 108,"+(my+20)+" 92,"+(my+20)} fill="#1E40AF"/></>}
          {bodyItem.id === 'lab_coat' && <><rect x="70" y={my+15} width="60" height="50" rx="5" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2"/><rect x="98" y={my+15} width="4" height="50" fill="#E5E7EB"/><circle cx="80" cy={my+25} r="3" fill="#3B82F6"/><circle cx="80" cy={my+40} r="3" fill="#3B82F6"/><circle cx="120" cy={my+25} r="3" fill="#3B82F6"/><circle cx="120" cy={my+40} r="3" fill="#3B82F6"/></>}
          {bodyItem.id === 'armor' && <><rect x="75" y={my+15} width="50" height="45" rx="8" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2.5"/><circle cx="100" cy={my+30} r="8" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2"/><path d={"M85 "+(my+15)+" L85 "+(my+60)} stroke="#6B7280" strokeWidth="2"/><path d={"M100 "+(my+15)+" L100 "+(my+60)} stroke="#6B7280" strokeWidth="2"/><path d={"M115 "+(my+15)+" L115 "+(my+60)} stroke="#6B7280" strokeWidth="2"/></>}
          {bodyItem.id === 'hoodie' && <><path d={"M75 "+(my+10)+" Q100 "+(my+5)+" 125 "+(my+10)+" L125 "+(my+55)+" L75 "+(my+55)+"Z"} fill="#6366F1" stroke="#4F46E5" strokeWidth="2"/><circle cx="95" cy={my+30} r="2.5" fill="#E5E7EB"/><circle cx="95" cy={my+40} r="2.5" fill="#E5E7EB"/><circle cx="105" cy={my+30} r="2.5" fill="#E5E7EB"/><circle cx="105" cy={my+40} r="2.5" fill="#E5E7EB"/></>}
          {bodyItem.id === 'vest' && <><path d={"M80 "+(my+15)+" L80 "+(my+55)+" L95 "+(my+55)+" L95 "+(my+15)+"Z"} fill="#92400E" stroke="#78350F" strokeWidth="1.5"/><path d={"M105 "+(my+15)+" L105 "+(my+55)+" L120 "+(my+55)+" L120 "+(my+15)+"Z"} fill="#92400E" stroke="#78350F" strokeWidth="1.5"/><circle cx="85" cy={my+25} r="2" fill="#FCD34D"/><circle cx="85" cy={my+40} r="2" fill="#FCD34D"/><circle cx="115" cy={my+25} r="2" fill="#FCD34D"/><circle cx="115" cy={my+40} r="2" fill="#FCD34D"/></>}
          {bodyItem.id === 'medal' && <><circle cx="100" cy={my+35} r="12" fill="#FFD700" stroke="#DAA520" strokeWidth="2"/><text x="95" y={my+40} fontSize="12" fill="#FFF">🥇</text><path d={"M100 "+(my+15)+" L95 "+(my+23)+" L100 "+(my+23)+"Z"} fill="#DC2626"/><path d={"M100 "+(my+15)+" L105 "+(my+23)+" L100 "+(my+23)+"Z"} fill="#DC2626"/></>}
          {bodyItem.id === 'sash' && <><path d={"M120 "+(my+10)+" L80 "+(my+55)+" L85 "+(my+58)+" L125 "+(my+13)+"Z"} fill="#FCD34D" stroke="#F59E0B" strokeWidth="2"/><text x="95" y={my+38} fontSize="10" fill="#92400E" fontWeight="700">★</text></>}
        </>
      )}
      
      {/* HATS */}
      {hatItem && (
        <>
          {hatItem.id === 'party_hat' && <><polygon points={"100,"+(hatY-48)+" "+(100-30)+","+(hatY-2)+" "+(100+30)+","+(hatY-2)} fill="#FF6BA8" stroke="#D0356E" strokeWidth="2"/><rect x={100-32} y={hatY-8} width="64" height="10" rx="5" fill="#FFC0D8" opacity="0.7"/><circle cx="100" cy={hatY-52} r="5.5" fill="#FFD700"/></>}
          {hatItem.id === 'crown' && <><path d={"M"+(100-34)+","+hatY+" L"+(100-34)+","+(hatY-32)+" L"+(100-17)+","+(hatY-19)+" L100,"+(hatY-40)+" L"+(100+17)+","+(hatY-19)+" L"+(100+34)+","+(hatY-32)+" L"+(100+34)+","+hatY+"Z"} fill="#FFD700" stroke="#DAA520" strokeWidth="2.5" className="buddy-shine"/><circle cx={100-17} cy={hatY-19} r="3.5" fill="#FF3333"/><circle cx="100" cy={hatY-40} r="3.5" fill="#4488FF"/><circle cx={100+17} cy={hatY-19} r="3.5" fill="#33CC33"/></>}
          {hatItem.id === 'wizard_hat' && <><polygon points={"100,"+(hatY-60)+" "+(100-36)+","+(hatY-2)+" "+(100+36)+","+(hatY-2)} fill="#3A0090" stroke="#7030C0" strokeWidth="2.5"/><ellipse cx="100" cy={hatY-2} rx="40" ry="9" fill="#3A0090" stroke="#7030C0" strokeWidth="2.5"/><text x="88" y={hatY-30} fontSize="13" fill="#FFD700" opacity="0.9">✦</text></>}
          {hatItem.id === 'santa_hat' && <><polygon points={"100,"+(hatY-56)+" "+(100-34)+","+(hatY-2)+" "+(100+34)+","+(hatY-2)} fill="#CC0000" stroke="#AA0000" strokeWidth="2"/><rect x={100-36} y={hatY-11} width="72" height="14" rx="7" fill="white"/><circle cx="100" cy={hatY-60} r="8" fill="white"/></>}
          {hatItem.id === 'top_hat' && <><rect x="70" y={hatY-40} width="60" height="40" rx="4" fill="#1F2937" stroke="#000" strokeWidth="2"/><ellipse cx="100" cy={hatY} rx="35" ry="8" fill="#1F2937" stroke="#000" strokeWidth="2"/><rect x="85" y={hatY-30} width="30" height="6" fill="#DC2626"/></>}
          {hatItem.id === 'cowboy_hat' && <><ellipse cx="100" cy={hatY-5} rx="45" ry="12" fill="#8B4513" stroke="#654321" strokeWidth="2"/><path d={"M70 "+(hatY-5)+" Q100 "+(hatY-35)+" 130 "+(hatY-5)} fill="#8B4513" stroke="#654321" strokeWidth="2"/></>}
          {hatItem.id === 'pirate_hat' && <><path d={"M"+(100-38)+","+(hatY-2)+" L"+(100-30)+","+(hatY-35)+" L100,"+(hatY-30)+" L"+(100+30)+","+(hatY-35)+" L"+(100+38)+","+(hatY-2)+"Z"} fill="#1F2937" stroke="#000" strokeWidth="2"/><circle cx="100" cy={hatY-20} r="8" fill="#FFF"/><path d={"M95 "+(hatY-23)+" L105 "+(hatY-17)} stroke="#000" strokeWidth="2"/><path d={"M95 "+(hatY-17)+" L105 "+(hatY-23)} stroke="#000" strokeWidth="2"/></>}
          {hatItem.id === 'chef_hat' && <><ellipse cx="100" cy={hatY-25} rx="32" ry="28" fill="#FFF" stroke="#E5E7EB" strokeWidth="2"/><rect x="70" y={hatY-8} width="60" height="10" rx="3" fill="#FFF" stroke="#E5E7EB" strokeWidth="2"/></>}
          {hatItem.id === 'graduation_cap' && <><rect x="60" y={hatY-8} width="80" height="8" fill="#1F2937" stroke="#000" strokeWidth="2"/><polygon points={"100,"+(hatY-8)+" 70,"+(hatY-8)+" 70,"+(hatY-25)+" 130,"+(hatY-25)+" 130,"+(hatY-8)} fill="#1F2937" stroke="#000" strokeWidth="2"/><circle cx="100" cy={hatY-25} r="3" fill="#FFD700"/><line x1="100" y1={hatY-25} x2="110" y2={hatY-35} stroke="#FFD700" strokeWidth="1.5"/></>}
          {hatItem.id === 'halo_hat' && <><ellipse cx="100" cy={hatY-22} rx="30" ry="9" fill="rgba(255,220,50,0.75)" stroke="#FFD700" strokeWidth="3.5" className="buddy-glow"/></>}
          {hatItem.id === 'devil_horns' && <><path d={"M"+(100-25)+","+hatY+" Q"+(100-28)+","+(hatY-20)+" "+(100-20)+","+(hatY-25)+" Q"+(100-22)+","+(hatY-15)+" "+(100-20)+","+hatY+"Z"} fill="#DC2626" stroke="#991B1B" strokeWidth="2"/><path d={"M"+(100+25)+","+hatY+" Q"+(100+28)+","+(hatY-20)+" "+(100+20)+","+(hatY-25)+" Q"+(100+22)+","+(hatY-15)+" "+(100+20)+","+hatY+"Z"} fill="#DC2626" stroke="#991B1B" strokeWidth="2"/></>}
          {hatItem.id === 'flower_crown' && <><circle cx={100-20} cy={hatY-5} r="6" fill="#FCA5A5"/><circle cx={100-10} cy={hatY-10} r="6" fill="#FBCFE8"/><circle cx="100" cy={hatY-13} r="6" fill="#FDE68A"/><circle cx={100+10} cy={hatY-10} r="6" fill="#BBF7D0"/><circle cx={100+20} cy={hatY-5} r="6" fill="#BFDBFE"/><path d={"M"+(100-25)+","+hatY+" Q100,"+(hatY-3)+" "+(100+25)+","+hatY} fill="none" stroke="#86EFAC" strokeWidth="3"/></>}
          {hatItem.id === 'viking_helmet' && <><ellipse cx="100" cy={hatY-15} rx="35" ry="20" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2.5"/><rect x="92" y={hatY-25} width="16" height="12" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2"/><ellipse cx={100-40} cy={hatY-15} rx="8" ry="12" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2"/><ellipse cx={100+40} cy={hatY-15} rx="8" ry="12" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2"/></>}
          {hatItem.id === 'space_helmet' && <><ellipse cx="100" cy={ey+5} rx="58" ry="55" fill="rgba(200,230,255,0.25)" stroke="#60A5FA" strokeWidth="3.5"/><rect x="55" y={ey-15} width="90" height="45" rx="22" fill="rgba(200,230,255,0.15)" stroke="#60A5FA" strokeWidth="2.5"/><circle cx="75" cy={ey} r="2" fill="#FFF" opacity="0.8"/><circle cx="125" cy={ey-5} r="1.5" fill="#FFF" opacity="0.6"/><circle cx="90" cy={ey-10} r="1.2" fill="#FFF" opacity="0.5"/></>}
          {hatItem.id === 'unicorn_horn' && <><path d={"M100,"+(hatY-45)+" L"+(100-7)+","+hatY+" L"+(100+7)+","+hatY+"Z"} fill="url(#rG)" stroke="#A855F7" strokeWidth="2" className="buddy-shine"/><ellipse cx={100-3} cy={hatY-30} rx="2" ry="8" fill="#FFF" opacity="0.6" transform={"rotate(-20 "+(100-3)+" "+(hatY-30)+")"}/><ellipse cx={100+2} cy={hatY-20} rx="2" ry="8" fill="#FFF" opacity="0.6" transform={"rotate(-20 "+(100+2)+" "+(hatY-20)+")"}/></>}
        </>
      )}
      
      {/* SPECIAL EFFECTS - Front (halo moved to hats section) */}
    </svg>
  );
}
