import React, { useState } from 'react';
import { SHOP_ITEMS, RARITY_COLORS } from '../../../constants';

/**
 * Shop View - Mobile shop interface for buying and equipping items
 */
function ShopView({ game, onBuyItem, onEquipItem }) {
  const [category, setCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'hat', label: 'Hats' },
    { id: 'face', label: 'Face' },
    { id: 'body', label: 'Body' },
    { id: 'special', label: 'Special' }
  ];

  const filteredItems = SHOP_ITEMS.filter(item => 
    category === 'all' || item.cat === category
  );

  return (
    <div className="mobile-view">
      <div className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <div className="shop-points">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>{game?.points || 0}</span>
        </div>
      </div>

      <div className="filter-pills" style={{ marginBottom: 20 }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`filter-pill ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="shop-grid-mobile">
        {filteredItems.map(item => {
          const owned = game?.owned?.includes(item.id);
          const equipped = game?.equipped?.[item.cat] === item.id;
          const canBuy = (game?.points || 0) >= item.price;
          const rarityStyle = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

          return (
            <div
              key={item.id}
              className="shop-card-mobile"
              style={{
                borderColor: equipped ? 'var(--accent)' : rarityStyle.border,
                background: equipped 
                  ? 'linear-gradient(135deg, var(--card) 0%, rgba(99, 102, 241, 0.1) 100%)' 
                  : 'var(--card)'
              }}
            >
              {owned && (
                <div 
                  className="shop-badge-mobile"
                  style={{ background: equipped ? 'var(--accent)' : '#16a34a' }}
                >
                  {equipped ? 'ON' : '✓'}
                </div>
              )}

              <div 
                className="shop-rarity-mobile"
                style={{
                  background: rarityStyle.bg,
                  color: rarityStyle.text,
                  border: `1px solid ${rarityStyle.border}`
                }}
              >
                {item.rarity}
              </div>

              <div className="shop-icon-mobile">{item.emoji}</div>
              <div className="shop-name-mobile">{item.name}</div>
              <div className="shop-cat-mobile">{item.cat}</div>
              <div className="shop-desc-mobile">{item.desc}</div>

              {owned ? (
                <button
                  className={`btn-shop-mobile ${equipped ? 'equipped' : ''}`}
                  onClick={() => onEquipItem(item.id)}
                >
                  {equipped ? '✓ Equipped' : 'Equip'}
                </button>
              ) : (
                <button
                  className="btn-shop-mobile buy"
                  onClick={() => canBuy && onBuyItem(item.id)}
                  disabled={!canBuy}
                  style={{
                    background: canBuy ? 'var(--accent)' : 'var(--bg3)',
                    color: canBuy ? '#fff' : 'var(--text4)',
                    cursor: canBuy ? 'pointer' : 'not-allowed'
                  }}
                >
                  {canBuy ? `Buy — ⭐${item.price}` : `Need ⭐${item.price}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛍️</div>
          <div className="empty-state-title">No items found</div>
          <div className="empty-state-text">Try a different category</div>
        </div>
      )}
    </div>
  );
}

export default ShopView;
