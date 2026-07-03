import React from 'react';
import { PageType } from '../types';

interface BentoCollectionsProps {
  onSelectCategory: (categoryId: string) => void;
  onSelectProduct: (productId: string) => void;
  setCurrentPage: (page: PageType) => void;
}

export default function BentoCollections({
  onSelectCategory,
  onSelectProduct,
  setCurrentPage,
}: BentoCollectionsProps) {
  
  const handleBentoClick = (type: 'product' | 'category', target: string) => {
    if (type === 'product') {
      onSelectProduct(target);
      setCurrentPage('product-detail');
    } else {
      onSelectCategory(target);
      setCurrentPage('category');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-[1100px] md:h-[600px]">
      {/* Large Featured Item: Summer Luxe Fashion */}
      <div 
        onClick={() => handleBentoClick('product', 'summer-luxe-lehenga')}
        className="md:col-span-2 md:row-span-2 relative rounded-[32px] overflow-hidden group cursor-pointer shadow-md"
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNYfEXK_7rLU83L70-1o6lkY-fzswn4nVWOSq68iDwQlgizS_-6l2r7xqHojeTiYP9pDAVc6sH_m9TYKlhWOzTzlfKQ9GQmH4SKX0M6ZoYWctx8Oy6PMqi3IDWIcFOi5Q4w0KvCZEWNlJAYt0UnhnxBjiUUEeBkm2ikYZQ-sMxXSnUkIIamqWxwdUTBnoPyVDLRD64sB8MnbXxqUwEPRT6uL9PYmA9S6jiveUiNMFFfG0clM11-RBMOuvSzDsbtazfyF7cm5QTCfM"
          alt="Summer Luxe Fashion"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 md:p-10 flex flex-col justify-end">
          <h3 className="text-white font-display font-bold text-3xl md:text-4xl mb-3 leading-tight">
            Summer Luxe Fashion
          </h3>
          <p className="text-white/80 font-sans text-sm md:text-base mb-6 max-w-sm">
            Redefining elegance with our latest designer couture wear.
          </p>
          <button className="w-fit bg-white text-[#291715] hover:bg-primary hover:text-white px-6 md:px-8 py-3 rounded-full font-semibold text-xs transition-all duration-300 transform group-hover:translate-x-1 shadow-md">
            Explore Trend
          </button>
        </div>
      </div>

      {/* Small Featured 1: Gourmet Sweets */}
      <div 
        onClick={() => handleBentoClick('product', 'caramel-sweets-box')}
        className="md:col-span-2 relative rounded-[32px] overflow-hidden group cursor-pointer shadow-md h-[250px] md:h-auto"
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlJ-VVyeEVY0-1rO_pA2W9mxzfPnLaVyYXv7yJSxhXy2yg1SwgXwdfLMpMSbrk6RtT6AckZXZVvwfAMp3-d6tlXJDWNH1HlVrMch1GKVgH0v7fCqPNO6tL7mSAbM7F0Iun23glZ9x459ao31XU03tQvkPphVilG4MY_mBUhPZRMHmkdWtnaFuQXaoToWYiSOuazPMgIFMaYDpk-YhGfbEpWgjWzBFP84ffM0Kjvwh66CXOHrGUwphcz5mNnrbIC10nt2cKP8gLgbM"
          alt="Gourmet Sweets"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/35 p-6 md:p-8 flex flex-col justify-end">
          <h3 className="text-white font-display font-bold text-2xl">
            Gourmet Sweets
          </h3>
          <p className="text-white/90 text-xs font-medium mt-1">
            Indulgent handcrafted liquid truffles & pralines.
          </p>
          <button className="mt-4 text-white font-bold border-b-2 border-white w-fit pb-0.5 text-xs tracking-wider transition-colors hover:text-primary hover:border-primary">
            Shop Now
          </button>
        </div>
      </div>

      {/* Small Featured 2: Timeless Pieces */}
      <div 
        onClick={() => handleBentoClick('product', 'timeless-watch-set')}
        className="md:col-span-1 relative rounded-[32px] overflow-hidden group cursor-pointer shadow-md h-[200px] md:h-auto"
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAERFGeaAZipt_fLG-VOHdfor_-Z3fYTZI445fQkfirPe9Lvy3EtfPtFGc9y7znjcOygJ2_xR-AthCDtwIj-pQg3Y9oJlubdIxNIgB-2cdv6awg5AHyThPXzkc9eaQk2V7BoO2fMc0Dz_5k-0xGukFL20z-a7ObBdslwBie17pAtGra6Vv8iz2yr6PNPEVJzAATLM-ingR-ucc8DAPlJwMaqJqrjxkJ2pmqpBYJsLm6kOxzSViw5LaWflw-p65AAYpnmmT-u4XNuTU"
          alt="Timeless Pieces"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-end">
          <h3 className="text-white font-display font-bold text-lg leading-snug">
            Timeless Pieces
          </h3>
          <span className="text-white/80 text-[10px] uppercase tracking-widest font-semibold mt-1">Accessories</span>
        </div>
      </div>

      {/* Small Featured 3: Wall Art */}
      <div 
        onClick={() => handleBentoClick('product', 'gallery-wall-frames')}
        className="md:col-span-1 relative rounded-[32px] overflow-hidden group cursor-pointer shadow-md h-[200px] md:h-auto"
      >
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmS4Kgvp2R-vE-mI7ZMasMO2DAss7YwFiQ9Ru9OrBvwGG_0RPy_0e11rLx3wj1ilJYpQnPkrN9BJTcOlkqsvuh-pxO_yeIMCK2E_1U8IcGntLNqpFuWbjHZFziJoLxPnVUXHBqlZKji9my0VmPI_L25CgWjFbQKDBCno6CbaPN1traR4v4WaLKOgpt1VU5gT4ZayP-cujt1JpC6Qbtht0tQFx2R_kZRZQFCEDMPMdTcR61KrCRWt-IKfFCubGzjzqvunfKu8G3gnE"
          alt="Wall Art"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-end">
          <h3 className="text-white font-display font-bold text-lg leading-snug">
            Wall Art
          </h3>
          <span className="text-white/80 text-[10px] uppercase tracking-widest font-semibold mt-1">Frames & Gifts</span>
        </div>
      </div>
    </div>
  );
}
