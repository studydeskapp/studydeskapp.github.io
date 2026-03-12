import React from 'react';
import { SHOP_ITEMS, RARITY_COLORS } from '../../constants';

function ShopTab({ game, shopCat, setShopCat, equipItem, buyItem }) {
  return (
    <div>
      <div className="sec-hd">
        <div className="sec-t">Shop</div>
        <div className="pts-pill">⭐ {game.points}</div>
      </div>
      
      {/* Filter buttons */}
      <div className="shop-filter">
        {[["all","All"],["hat","Hats"],["face","Face"],["body","Body"],["special","Special"]].map(([cat,lbl])=>(
          <button key={cat} className="sfbtn" onClick={()=>setShopCat(cat)} 
            style={shopCat===cat?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}>
            {lbl}
          </button>
        ))}
      </div>
      
      {/* Shop grid */}
      <div className="shop-grid">
        {SHOP_ITEMS.filter(i=>shopCat==="all"||i.cat===shopCat).map(item=>{
          const owned=game.owned.includes(item.id);
          const equipped=game.equipped[item.cat]===item.id;
          const ok=game.points>=item.price;
          const rarityStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
          
          return(
            <div key={item.id} 
              className={"shop-card"+(owned?" owned":"")+(equipped?" equipped":"")+(item.animated?" animated-item":"")}
              style={{
                borderColor: equipped ? "var(--accent)" : rarityStyle.border,
                background: equipped ? "linear-gradient(135deg, var(--card) 0%, rgba(99, 102, 241, 0.1) 100%)" : "var(--card)"
              }}>
              
              {/* Badges */}
              {owned&&<div className="shop-badge" style={{background:equipped?"var(--accent)":"#16a34a"}}>{equipped?"ON":"✓"}</div>}
              
              {/* Rarity badge */}
              <div className="shop-rarity" style={{
                background: rarityStyle.bg,
                color: rarityStyle.text,
                border: `1px solid ${rarityStyle.border}`
              }}>
                {item.rarity}
              </div>
              
              {/* Icon with animation */}
              <div className="shop-icon-wrapper">
                <span className={"shop-icon"+(item.animated?" shop-icon-animated":"")}>{item.emoji}</span>
                {item.animated && equipped && (
                  <div className="shop-particles">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="particle" style={{
                        '--angle': `${i * 45}deg`,
                        '--delay': `${i * 0.1}s`
                      }}></div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="shop-name">{item.name}</div>
              <div className="shop-cat">{item.cat}</div>
              <div className="shop-desc">{item.desc}</div>
              
              {owned?(
                <button className={"btn btn-sm"+(equipped?" btn-p":" btn-g")} 
                  style={{width:"100%",justifyContent:"center"}} 
                  onClick={()=>equipItem(item.id)}>
                  {equipped?"✓ Equipped":"Equip"}
                </button>
              ):(
                <button className="btn btn-sm btn-p" 
                  style={{
                    width:"100%",
                    justifyContent:"center",
                    background:ok?"var(--accent)":"var(--bg3)",
                    color:ok?"#fff":"var(--text4)",
                    cursor:ok?"pointer":"not-allowed"
                  }} 
                  onClick={()=>buyItem(item.id)} 
                  disabled={!ok}>
                  {ok?"Buy — ⭐"+item.price:"Need ⭐"+item.price}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ShopTab;