import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  size?: number;
  readonly?: boolean;
  onRate?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 20,
  readonly = true,
  onRate,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleMouseEnter = (index: number) => {
    if (!readonly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (!readonly && onRate) {
      onRate(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => {
        const filled = index <= (hoverRating || rating);
        return (
          <Star
            key={index}
            size={size}
            className={`${
              filled
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${!readonly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          />
        );
      })}
    </div>
  );
};
