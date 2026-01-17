/**
 * RestaurantCard Component
 * Displays restaurant info with top dishes
 */

import { Link } from 'react-router-dom';
import { getPhotoUrl } from '../utils/api';

export default function RestaurantCard({ restaurant, rank }) {
  const { 
    id, 
    name, 
    address, 
    rating, 
    price_level,
    priceLevel, 
    total_reviews,
    totalReviews,
    total_ratings, 
    photo_reference,
    is_open_now,
    top_dishes = [],
    topDishes = []
  } = restaurant;

  // Handle different property names from backend
  const dishes = top_dishes.length > 0 ? top_dishes : topDishes;
  const reviewCount = total_reviews || totalReviews || total_ratings || 0;
  const price = price_level || priceLevel || '';
  const priceDisplay = price ? (typeof price === 'number' ? '$'.repeat(price) : price) : 'N/A';

  return (
    <Link 
      to={`/restaurant/${id}`}
      className="card card-hover block animate-slide-up"
      style={{ animationDelay: `${rank * 100}ms` }}
    >
      {/* Restaurant Image */}
      <div className="relative h-40 bg-gray-200">
        {photo_reference ? (
          <img 
            src={getPhotoUrl(photo_reference)} 
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        {/* Rank Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center justify-center w-8 h-8 
                         bg-primary-500 text-white font-bold rounded-full shadow-lg">
            #{rank}
          </span>
        </div>

        {/* Open Status */}
        <div className="absolute top-3 right-3">
          <span className={`badge ${is_open_now ? 'badge-success' : 'badge-warning'}`}>
            {is_open_now ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
          {name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          {address}
        </p>

        {/* Rating & Price */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium text-gray-900">{rating?.toFixed(1) || 'N/A'}</span>
            <span className="text-sm text-gray-500">({reviewCount?.toLocaleString() || 0})</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-green-600 font-medium">{priceDisplay}</span>
        </div>

        {/* Top Dishes */}
        {dishes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              🔥 Top Rated Dishes
            </p>
            <div className="flex flex-wrap gap-2">
              {dishes.map((dish, idx) => (
                <span 
                  key={idx} 
                  className="badge badge-primary"
                >
                  {dish.name || dish.dish_name || dish.dishName || dish}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
