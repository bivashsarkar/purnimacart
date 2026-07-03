import React from 'react';
import { Blocks, Cookie, Shirt, Sparkles, Gift, Watch, Image as ImageIcon, Grid } from 'lucide-react';
import { Category } from '../types';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export default function CategoryList({ categories, selectedCategory, onSelectCategory }: CategoryListProps) {
  const getIcon = (iconName: string, size = 32) => {
    switch (iconName) {
      case 'grid':
        return <Grid size={size} />;
      case 'smart_toy':
        return <Blocks size={size} />;
      case 'cake':
        return <Cookie size={size} />;
      case 'apparel':
        return <Shirt size={size} />;
      case 'face_6':
        return <Sparkles size={size} />;
      case 'featured_seasonal_and_gifts':
        return <Gift size={size} />;
      case 'watch':
        return <Watch size={size} />;
      case 'photo_frame':
        return <ImageIcon size={size} />;
      default:
        return <Grid size={size} />;
    }
  };

  return (
    <div className="flex gap-6 md:gap-8 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth">
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="flex flex-col items-center gap-4 shrink-0 group focus:outline-none cursor-pointer"
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/25'
                  : 'bg-[#ffe2de] text-primary group-hover:bg-primary/10 group-hover:scale-110'
              }`}
            >
              {getIcon(cat.iconName, isActive ? 36 : 32)}
            </div>
            <span
              className={`text-xs font-semibold tracking-wide transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-[#291715] group-hover:text-primary'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
