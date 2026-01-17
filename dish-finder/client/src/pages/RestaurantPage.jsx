/**
 * RestaurantPage Component
 * Detailed view of a single restaurant
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DishBadge from '../components/DishBadge';
import LoadingState from '../components/LoadingState';
import { getRestaurantDetails, getPhotoUrl } from '../utils/api';

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getRestaurantDetails(id);
      setRestaurant(data);
    } catch (err) {
      setError(err.message || 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-16">
        <LoadingState count={1} />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Restaurant not found'}
          </h2>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { 
    name, 
    address, 
    rating, 
    price_level, 
    total_ratings, 
    phone, 
    website,
    photo_reference,
    is_open_now,
    topDishes = [],
    reviews = []
  } = restaurant;

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Image */}
      <div className="relative h-56 bg-gray-200">
        {photo_reference ? (
          <img 
            src={getPhotoUrl(photo_reference, 800)} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-primary-100 to-primary-200">
            <svg className="w-20 h-20 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <span className={`badge ${is_open_now ? 'badge-success' : 'badge-warning'}`}>
            {is_open_now ? 'Open Now' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="card p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{name}</h1>
          
          <p className="text-gray-600 text-sm mb-4">{address}</p>

          {/* Rating & Price */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    className={`w-5 h-5 ${star <= Math.round(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-semibold">{rating?.toFixed(1) || 'N/A'}</span>
              <span className="text-sm text-gray-500">({total_ratings?.toLocaleString() || 0} reviews)</span>
            </div>
            {price_level && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-green-600 font-medium">
                  {'$'.repeat(price_level)}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {phone && (
              <a 
                href={`tel:${phone}`}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
            )}
            {website && (
              <a 
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Top Dishes Section */}
      {topDishes.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            🔥 Top Rated Dishes
          </h2>
          <div className="space-y-3">
            {topDishes.map((dish, idx) => (
              <DishBadge key={idx} dish={dish} showDetails />
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Recent Reviews
          </h2>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((review, idx) => (
              <div key={idx} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {review.author_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {review.author_name || 'Anonymous'}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm text-gray-700">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {review.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
