import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';

interface CartItem {
  id: number;
  type: 'snake' | 'gear';
  name: string;
  price_cents: number;
  qty: number;
  image_url: string;
  specs: string; // species for snakes, brand for gear
}

const GEAR_PRODUCTS = [
  {
    id: 1001,
    name: "Incubator Box (Professional)",
    price_cents: 12900,
    image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60",
    description: "Premium double-walled incubator box for python egg clutches. Maintains temperature within 0.1°C.",
    brand: "HerpLogic"
  },
  {
    id: 1002,
    name: "Hatchling Breeding Rack Set (8 Tubs)",
    price_cents: 24900,
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60",
    description: "Compact breeding rack system with built-in heat tapes. Perfect for starting neonates.",
    brand: "KaijuRacks"
  },
  {
    id: 1003,
    name: "Premium Coconut Husk Substrate (10kg)",
    price_cents: 1950,
    image_url: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&auto=format&fit=crop&q=60",
    description: "100% organic, triple-washed coconut bedding. Ideal for moisture retention and odor control.",
    brand: "HerpLogic"
  },
  {
    id: 1004,
    name: "Reptile Feeding Hook (Lightweight Aluminum)",
    price_cents: 2900,
    image_url: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=500&auto=format&fit=crop&q=60",
    description: "40-inch heavy-duty snake hook. Safe handling tools for adult pythons and colubrids.",
    brand: "KaijuRacks"
  }
];

export const Market: React.FC = () => {
  const [snakes, setSnakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCatalog, setActiveCatalog] = useState<'snakes' | 'gear'>('snakes');
  
  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerTel, setCustomerTel] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Load available specimens on mount
  useEffect(() => {
    setLoading(true);
    db.getSnakes({ availability: ['available'] })
      .then(res => {
        setSnakes(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading available snakes:', err);
        setLoading(false);
      });
  }, []);

  // Add Item to Cart
  const handleAddToCart = (item: any, type: 'snake' | 'gear') => {
    setCart(prevCart => {
      const existing = prevCart.find(i => i.id === item.id && i.type === type);
      if (existing) {
        if (type === 'snake') {
          // Snakes are unique individual items, quantity is capped at 1
          return prevCart;
        }
        return prevCart.map(i => i.id === item.id && i.type === type ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prevCart, {
        id: item.id,
        type,
        name: item.name,
        price_cents: item.price_cents,
        qty: 1,
        image_url: type === 'snake' ? (item.gallery_image_url || '') : item.image_url,
        specs: type === 'snake' ? `${item.species} • ${item.morph || 'Normal'}` : item.brand
      }];
    });
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (id: number, type: 'snake' | 'gear') => {
    setCart(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  // Update quantity for gear items
  const handleUpdateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.type === 'gear') {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // Cart total calculations
  const cartTotalCents = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
  }, [cart]);

  // Build Invoice Billing Text Message
  const invoiceText = useMemo(() => {
    const header = `📦 ใบสั่งซื้อ KAIJUVILLAGE CO.LTD\n`;
    const divider = `---------------------------------\n`;
    
    let itemsList = '';
    cart.forEach((item, idx) => {
      const typeLabel = item.type === 'snake' ? '🐍 [งูมีชีวิต]' : '🛠️ [อุปกรณ์]';
      const priceStr = item.price_cents === 0 ? 'ติดต่อสอบถาม' : `$${(item.price_cents / 100).toLocaleString()}`;
      itemsList += `${idx + 1}. ${typeLabel} ${item.name} x ${item.qty} - ${priceStr}\n`;
    });

    const totalStr = `💰 ยอดรวมทั้งสิ้น: $${(cartTotalCents / 100).toLocaleString()} USD\n`;
    
    const delivery = `\n📋 ข้อมูลจัดส่ง:\n` +
                     `ชื่อผู้รับ: ${customerName || '-'}\n` +
                     `เบอร์โทร: ${customerTel || '-'}\n` +
                     `ที่อยู่จัดส่ง: ${customerAddress || '-'}\n`;
                     
    return header + divider + itemsList + divider + totalStr + delivery;
  }, [cart, cartTotalCents, customerName, customerTel, customerAddress]);

  // Copy Invoice summary to clipboard
  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoiceText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Redirect to Line Chat with order summary prefilled
  const handleLineRedirect = () => {
    const formattedMessage = encodeURIComponent(invoiceText);
    const lineUrl = `https://line.me/R/msg/text/?${formattedMessage}`;
    window.open(lineUrl, '_blank');
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 mb-20 text-left flex-grow">
      
      {/* Storefront Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant pb-6 gap-4">
        <div>
          <h2 className="font-display text-headline-lg text-primary font-bold mb-2">ตลาดซื้อขาย (Marketplace)</h2>
          <p className="font-body-md text-on-surface-variant max-w-2xl">
            เลือกช้อปปิ้งงูบอลไพธอนเกรดพรีเมียม และอุปกรณ์จัดการการผสมเลี้ยงคุณภาพสูงของ KAIJUVILLAGE CO.LTD
          </p>
        </div>
        
        {/* Toggle between Snakes and Gear */}
        <div className="flex bg-surface-container-low p-1.5 rounded-xl border border-outline-variant">
          <button 
            onClick={() => setActiveCatalog('snakes')}
            className={`px-5 py-2.5 rounded-lg font-label-sm font-bold transition-all ${
              activeCatalog === 'snakes' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            สัตว์เลี้ยงพร้อมขาย
          </button>
          <button 
            onClick={() => setActiveCatalog('gear')}
            className={`px-5 py-2.5 rounded-lg font-label-sm font-bold transition-all ${
              activeCatalog === 'gear' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            อุปกรณ์เพาะเลี้ยง
          </button>
        </div>
      </div>

      {/* Main Grid: Store Left, Cart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Product Grid */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20 min-h-[300px]">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
            </div>
          ) : activeCatalog === 'snakes' ? (
            // Snakes Catalog Grid
            snakes.length === 0 ? (
              <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant italic">
                ขณะนี้ยังไม่มีงูพร้อมจำหน่ายในระบบ กรุณาตรวจสอบอีกครั้งภายหลัง
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {snakes.map((snake) => (
                  <div key={snake.id} className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="aspect-[3/2] overflow-hidden bg-surface-container">
                        <img src={snake.gallery_image_url || ''} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-display font-bold text-body-lg text-primary truncate">{snake.name}</h4>
                          <span className="font-mono text-body-md font-bold text-primary">
                            {snake.price_cents === 0 ? 'Inquire' : `$${(snake.price_cents / 100).toLocaleString()}`}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-2 truncate">{snake.species} • {snake.morph}</p>
                        <p className="text-[11px] text-on-surface-variant line-clamp-2 min-h-[32px]">
                          {snake.detail?.description || 'ยีนส์นิ่ง ลายชัด สมบูรณ์ แข็งแรง ทานอาหารเป็นปกติ'}
                        </p>
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <button 
                        onClick={() => handleAddToCart(snake, 'snake')}
                        disabled={cart.some(item => item.id === snake.id && item.type === 'snake')}
                        className="w-full bg-secondary text-on-secondary hover:bg-secondary/95 py-2.5 rounded-lg font-label-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        {cart.some(item => item.id === snake.id && item.type === 'snake') ? 'ใส่ตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Equipment/Accessories Grid
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
              {GEAR_PRODUCTS.map((gear) => (
                <div key={gear.id} className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="aspect-[2/1] overflow-hidden bg-surface-container">
                      <img src={gear.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-display font-bold text-body-lg text-primary">{gear.name}</h4>
                        <span className="font-mono text-body-md font-bold text-primary">
                          ${(gear.price_cents / 100).toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary uppercase block mb-2">{gear.brand}</span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {gear.description}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <button 
                      onClick={() => handleAddToCart(gear, 'gear')}
                      className="w-full bg-secondary text-on-secondary hover:bg-secondary/95 py-2.5 rounded-lg font-label-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                      เพิ่มลงตะกร้า
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Floating Cart Drawer */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant pb-4">
              <h3 className="font-display text-headline-sm text-primary font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">shopping_basket</span>
                ตะกร้าสินค้า ({cart.reduce((sum, i) => sum + i.qty, 0)})
              </h3>
            </div>

            {/* Cart Items list */}
            {cart.length === 0 ? (
              <div className="py-10 text-center text-on-surface-variant italic text-body-md">
                ไม่มีสินค้าในตะกร้าของคุณ
              </div>
            ) : (
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex gap-3 items-center pb-3 border-b border-outline-variant last:border-b-0">
                    <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
                      <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-grow overflow-hidden text-left">
                      <h5 className="font-display font-bold text-body-md text-primary truncate leading-tight">{item.name}</h5>
                      <span className="text-[10px] text-on-surface-variant block truncate mb-1">{item.specs}</span>
                      <span className="font-mono text-xs font-bold text-primary">
                        {item.price_cents === 0 ? 'Inquire' : `$${(item.price_cents / 100).toLocaleString()}`}
                      </span>
                    </div>

                    {/* Quantity Selector for Gear */}
                    {item.type === 'gear' ? (
                      <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low">
                        <button 
                          className="px-2 py-1 text-xs hover:bg-surface-container-high active:bg-outline-variant"
                          onClick={() => handleUpdateQty(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="px-2 font-mono text-xs font-bold">{item.qty}</span>
                        <button 
                          className="px-2 py-1 text-xs hover:bg-surface-container-high active:bg-outline-variant"
                          onClick={() => handleUpdateQty(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-on-surface-variant px-2 bg-surface-container rounded-lg">x1</span>
                    )}

                    <button 
                      className="p-1 rounded-lg text-error hover:bg-error-container/20 text-sm ml-1"
                      onClick={() => handleRemoveFromCart(item.id, item.type)}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Price Calculations */}
            {cart.length > 0 && (
              <div className="space-y-4 border-t border-outline-variant pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-on-surface-variant font-medium">ยอดรวมสุทธิ</span>
                  <span className="font-display text-xl font-extrabold text-primary font-mono">
                    ${(cartTotalCents / 100).toLocaleString()}
                  </span>
                </div>

                {/* Delivery Information Form */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-display text-label-sm font-bold text-primary uppercase tracking-wider text-[10px]">รายละเอียดการจัดส่ง (Delivery info)</h4>
                  <div>
                    <input 
                      type="text" 
                      placeholder="ชื่อผู้รับ..." 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" 
                      placeholder="เบอร์โทรติดต่อ..." 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                      value={customerTel}
                      onChange={(e) => setCustomerTel(e.target.value)}
                    />
                  </div>
                  <div>
                    <textarea 
                      rows={2}
                      placeholder="ที่อยู่จัดส่ง..." 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action order triggers */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={handleCopyInvoice}
                    className="border border-outline text-on-surface font-label-xs text-[11px] py-3 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    {copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกใบสั่งซื้อ'}
                  </button>
                  <button 
                    onClick={handleLineRedirect}
                    className="bg-green-600 hover:bg-green-700 text-white font-label-xs text-[11px] py-3 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    สั่งซื้อทาง Line
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  );
};
