import React from 'react';
import { Share2, Heart, Mail } from 'lucide-react';
import { PageType } from '../types';

interface FooterProps {
  onSelectCategory: (categoryId: string) => void;
  setCurrentPage: (page: PageType) => void;
}

export default function Footer({ onSelectCategory, setCurrentPage }: FooterProps) {
  const handleFooterLink = (categoryId: string) => {
    onSelectCategory(categoryId);
    setCurrentPage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full py-16 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 bg-[#ffe2de] rounded-t-[40px] border-t border-[#e8bcb7]/30 mt-20 text-[#291715]">
      <div>
        <div className="font-display text-2xl font-black text-primary mb-6">
          PCart
        </div>
        <p className="text-sm text-[#5e3f3b] mb-6 leading-relaxed">
          PurnimaCart is India's premier destination for luxury lifestyle products, from curated artisanal wooden toys to high-end designer couture and sweets.
        </p>
        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90">
            <Share2 size={16} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90">
            <Heart size={16} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90">
            <Mail size={16} />
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-display font-semibold text-base mb-6 text-[#291715]">Shop</h4>
        <ul className="space-y-4 text-sm text-[#5e3f3b]/90">
          <li>
            <button onClick={() => handleFooterLink('all')} className="hover:text-primary transition-colors text-left cursor-pointer">
              New Arrivals
            </button>
          </li>
          <li>
            <button onClick={() => handleFooterLink('all')} className="hover:text-primary transition-colors text-left cursor-pointer">
              Bestsellers
            </button>
          </li>
          <li>
            <button onClick={() => handleFooterLink('gifts')} className="hover:text-primary transition-colors text-left cursor-pointer">
              Exclusive Gifts
            </button>
          </li>
          <li>
            <button onClick={() => handleFooterLink('toys')} className="hover:text-primary transition-colors text-left cursor-pointer">
              Luxury Toys
            </button>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-display font-semibold text-base mb-6 text-[#291715]">Customer Care</h4>
        <ul className="space-y-4 text-sm text-[#5e3f3b]/90">
          <li>
            <button className="hover:text-primary transition-colors text-left cursor-pointer">Track Order</button>
          </li>
          <li>
            <button className="hover:text-primary transition-colors text-left cursor-pointer">Shipping Policy</button>
          </li>
          <li>
            <button className="hover:text-primary transition-colors text-left cursor-pointer">Returns & Exchanges</button>
          </li>
          <li>
            <button className="hover:text-primary transition-colors text-left cursor-pointer">FAQs</button>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-display font-semibold text-base mb-6 text-[#291715]">Contact Us</h4>
        <p className="text-sm text-[#5e3f3b]/95 mb-4 leading-relaxed">
          123 Premium Plaza, Silicon Valley<br />
          Bangalore, Karnataka 560001
        </p>
        <p className="text-sm text-[#5e3f3b]/95 leading-relaxed">
          Email: support@purnimacart.com<br />
          Phone: +91 800-P-CART-00
        </p>
      </div>

      <div className="col-span-1 md:col-span-4 pt-8 border-t border-[#e8bcb7]/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#5e3f3b]/80">
          © 2026 PurnimaCart. All rights reserved.
        </p>
        <div className="flex gap-6 text-xs text-[#5e3f3b]/80">
          <button className="hover:text-primary cursor-pointer">Privacy Policy</button>
          <button className="hover:text-primary cursor-pointer">Terms of Service</button>
        </div>
      </div>
    </footer>
  );
}
