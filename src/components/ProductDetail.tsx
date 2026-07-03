import React, { useState } from 'react';
import { ArrowLeft, Star, Heart, ShoppingCart, ShieldCheck, Truck, RefreshCw, Send } from 'lucide-react';
import { Product, Review } from '../types';
import { MOCK_REVIEWS } from '../data';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export default function ProductDetail({
  product,
  onBack,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('Classic');
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewUser, setNewReviewUser] = useState('');

  const colors = ['Classic', 'Cream', 'Slate Grey'];
  const sizes = product.category === 'dresses' 
    ? ['S', 'M', 'L', 'XL'] 
    : product.category === 'accessories' && product.id.includes('sneakers')
    ? ['UK 7', 'UK 8', 'UK 9', 'UK 10']
    : ['Standard', 'Luxury Edition'];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !newReviewUser.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      userName: newReviewUser,
      rating: newReviewRating,
      date: 'Today',
      comment: newReviewComment,
    };

    setReviews([newReview, ...reviews]);
    setNewReviewComment('');
    setNewReviewUser('');
    setNewReviewRating(5);
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity, selectedColor, selectedSize);
    // Visual alert feedback
    const btn = document.getElementById('add-to-cart-detail-btn');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Added successfully!';
      btn.classList.add('bg-emerald-600', 'text-white');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-emerald-600', 'text-white');
      }, 1500);
    }
  };

  return (
    <div className="py-6 px-4 md:px-0 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#5e3f3b] hover:text-primary mb-8 cursor-pointer transition-colors group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Image & Badges */}
        <div className="lg:col-span-6 space-y-6">
          <div className="aspect-[4/3] md:aspect-[4/3] rounded-[32px] overflow-hidden bg-white border border-[#e8bcb7]/30 shadow-lg relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.isDeal && (
              <span className="absolute top-6 left-6 bg-primary text-white font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-sans">
                Active Deal
              </span>
            )}
          </div>

          {/* Core Guarantees Icons */}
          <div className="grid grid-cols-3 gap-4 bg-[#ffe9e6]/50 p-6 rounded-[24px] border border-[#e8bcb7]/20">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck size={24} className="text-primary" />
              <span className="text-xs font-bold text-[#291715]">Free Shipping</span>
              <span className="text-[10px] text-[#5e3f3b]/70">Standard delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 border-x border-[#e8bcb7]/20 px-2">
              <ShieldCheck size={24} className="text-primary" />
              <span className="text-xs font-bold text-[#291715]">Secure Gateway</span>
              <span className="text-[10px] text-[#5e3f3b]/70">Fully encrypted</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RefreshCw size={24} className="text-primary" />
              <span className="text-xs font-bold text-[#291715]">7-Day Return</span>
              <span className="text-[10px] text-[#5e3f3b]/70">Hassle-free swap</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Customizers */}
        <div className="lg:col-span-6 space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans">
              {product.category} Collection
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-[#291715] mt-2 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars Summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(product.rating) ? 'fill-current' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#291715]">{product.rating}</span>
              <span className="text-xs text-[#5e3f3b]/50">({reviews.length} authentic customer reviews)</span>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-4 p-5 bg-[#fff0ee] rounded-[24px] border border-[#e8bcb7]/10">
            <span className="text-3xl font-black text-primary font-sans">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-[#5e3f3b]/50 line-through text-sm font-sans">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-bold bg-[#ff6b6b]/15 text-[#bb0012] px-3 py-1 rounded-full">
                  Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-[#5e3f3b] leading-relaxed">
            {product.description}
          </p>

          {/* Customizations selectors */}
          <div className="space-y-6 pt-4 border-t border-[#e8bcb7]/10">
            {/* Color Selector */}
            <div>
              <span className="text-xs font-bold text-[#291715] uppercase tracking-wider block mb-3">
                Select Style/Color: <span className="text-primary">{selectedColor}</span>
              </span>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                        : 'border-[#e8bcb7]/30 bg-white text-[#5e3f3b] hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <span className="text-xs font-bold text-[#291715] uppercase tracking-wider block mb-3">
                Select Size Option: <span className="text-primary">{selectedSize}</span>
              </span>
              <div className="flex gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                        : 'border-[#e8bcb7]/30 bg-white text-[#5e3f3b] hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Add triggers */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center border border-[#e8bcb7]/30 rounded-xl bg-white w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-[#5e3f3b] hover:text-primary font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold text-[#291715] w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-[#5e3f3b] hover:text-primary font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex-1 flex gap-3">
                <button
                  onClick={handleAddToCartClick}
                  id="add-to-cart-detail-btn"
                  className="flex-1 bg-primary hover:bg-[#9a000e] text-white py-4 px-6 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/15 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>

                <button
                  onClick={() => onToggleWishlist(product)}
                  className="w-14 h-14 rounded-xl border border-[#e8bcb7]/30 bg-white flex items-center justify-center text-[#5e3f3b] hover:text-primary hover:border-primary transition-all cursor-pointer"
                  title="Add to Wishlist"
                >
                  <Heart size={20} className={isWishlisted ? 'fill-primary text-primary' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Features Highlight Grid */}
          {product.features && product.features.length > 0 && (
            <div className="pt-6 border-t border-[#e8bcb7]/10">
              <h4 className="font-display font-semibold text-sm text-[#291715] mb-4">Product Highlights:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="text-xs text-[#5e3f3b] flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 pt-12 border-t border-[#e8bcb7]/10">
        <h3 className="font-display font-bold text-2xl text-[#291715] mb-8">
          Customer Feedbacks ({reviews.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 bg-white border border-[#e8bcb7]/15 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm text-[#291715]">{review.userName}</h5>
                    <span className="text-[11px] text-[#5e3f3b]/50 block mt-0.5">{review.date}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= review.rating ? 'fill-current' : 'text-gray-200'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#5e3f3b] mt-4 leading-relaxed bg-[#fff8f7]/50 p-3 rounded-lg border border-[#e8bcb7]/5">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          {/* Write a review */}
          <div className="lg:col-span-5 bg-[#fff8f7] p-8 rounded-3xl border border-[#e8bcb7]/20">
            <h4 className="font-display font-semibold text-lg text-[#291715] mb-6">Write a Review</h4>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#5e3f3b] uppercase tracking-wider block mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sen"
                  value={newReviewUser}
                  onChange={(e) => setNewReviewUser(e.target.value)}
                  className="w-full bg-white px-4 py-3 text-xs rounded-xl border border-[#e8bcb7]/20 outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5e3f3b] uppercase tracking-wider block mb-1.5">
                  Star Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="text-amber-400 focus:outline-none cursor-pointer"
                    >
                      <Star
                        size={24}
                        className={star <= newReviewRating ? 'fill-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5e3f3b] uppercase tracking-wider block mb-1.5">
                  Review Comment
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your experience with this premium product..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full bg-white px-4 py-3 text-xs rounded-xl border border-[#e8bcb7]/20 outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-[#9a000e] text-white py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send size={14} />
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
