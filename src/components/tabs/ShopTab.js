import React from 'react';
import { SHOP_ITEMS } from '../../constants';

function ShopTab({ game, shopCat, setShopCat, equipItem, buyItem }) {
  return (
    <div>
      <div className="sec-hd"><div className="sec-t">Shop</div><div className="pts-pill">⭐ {game.points}</div></div>
      <div className="shop-filter">
        {[["all","All"],["hat","Hats"],["face","Face"],["body","Body"],["special","Special"]].map(([cat,lbl])=>(
          <button key={cat} className="sfbtn" onClick={()=>setShopCat(cat)} style={shopCat===cat?{background:"var(--accent)",color:"#fff",borderColor:"var(--accent)"}:{}}>{lbl}</button>
        ))}
      </div>
      <div className="shop-grid">
        {SHOP_ITEMS.filter(i=>shopCat==="all"||i.cat===shopCat).map(item=>{
          const owned=game.owned.includes(item.id);
          const equipped=game.equipped[item.cat]===item.id;
          const ok=game.points>=item.price;
          return(
            <div key={item.id} className={"shop-card"+(owned?" owned":"")+(equipped?" equipped":"")}>
              {owned&&<div className="shop-badge" style={{background:equipped?"var(--accent)":"#16a34a"}}>{equipped?"ON":"✓"}</div>}
              <span className="shop-icon">{item.emoji}</span>
              <div className="shop-name">{item.name}</div>
              <div className="shop-cat">{item.cat}</div>
              <div className="shop-desc">{item.desc}</div>
              {owned?(
                <button className={"btn btn-sm"+(equipped?" btn-p":" btn-g")} style={{width:"100%",justifyContent:"center"}} onClick={()=>equipItem(item.id)}>{equipped?"✓ Equipped":"Equip"}</button>
              ):(
                <button className="btn btn-sm btn-p" style={{width:"100%",justifyContent:"center",background:ok?"var(--accent)":"var(--bg3)",color:ok?"#fff":"var(--text4)",cursor:ok?"pointer":"not-allowed"}} onClick={()=>buyItem(item.id)} disabled={!ok}>{ok?"Buy — ⭐"+item.price:"Need ⭐"+item.price}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ShopTab;