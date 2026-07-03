import React from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onProductClick: (id: string) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

export default function ProductCard({
  product,
  onProductClick,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}: ProductCardProps) {
  return (
    <div
      onClick={() => onProductClick(product.id)}
      className="bg-white rounded-[24px] border border-[#e8bcb7]/20 overflow-hidden product-card-shadow group relative cursor-pointer flex flex-col h-full justify-between"
    >
      {/* Discount Tag */}
      {product.isDeal && product.dealDiscount && (
        <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-primary to-[#ff6b6b] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md font-sans">
          {product.dealDiscount}
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={(e) => onToggleWishlist(product, e)}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#5e3f3b] hover:text-primary transition-all duration-300 shadow-sm active:scale-90 hover:scale-110"
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart
          size={18}
          className={`transition-colors ${isWishlisted ? 'fill-primary text-primary' : 'text-[#5e3f3b]'}`}
        />
      </button>

      {/* Card Image */}
      <div className="h-64 overflow-hidden relative bg-[#fff8f7]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-xs text-[#5e3f3b]/60 uppercase tracking-wider font-semibold font-sans">
            {product.category}
          </span>
          <h3 className="font-display font-semibold text-base text-[#291715] mt-1 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Rating for layout polish */}
          <div className="flex items-center gap-1 mt-1.5 mb-3">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-[#291715]">{product.rating}</span>
            <span className="text-xs text-[#5e3f3b]/50">({product.reviewCount})</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-primary font-bold text-lg font-sans">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[#5e3f3b]/50 line-through text-xs font-sans">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={(e) => onAddToCart(product, e)}
            className="w-full py-3 bg-[#e5e2e1] hover:bg-primary text-[#474646] hover:text-white rounded-xl text-xs font-bold font-sans transition-all duration-300 flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
          >
            <ShoppingCart size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
