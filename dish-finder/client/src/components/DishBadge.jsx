/**
 * DishBadge Component
 * Displays a dish with sentiment indicator
 */

export default function DishBadge({ dish, showDetails = false }) {
  const { 
    dish_name, 
    dishName, 
    mention_count, 
    mentionCount,
    average_sentiment,
    averageSentiment, 
    sample_review,
    sampleReview 
  } = dish;

  const name = dish_name || dishName;
  const mentions = mention_count || mentionCount || 0;
  const sentiment = average_sentiment || averageSentiment || 0.5;
  const review = sample_review || sampleReview;

  // Sentiment color
  const sentimentColor = sentiment >= 0.7 
    ? 'bg-green-100 text-green-800 border-green-200' 
    : sentiment >= 0.5 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-red-100 text-red-800 border-red-200';

  if (!showDetails) {
    return (
      <span className={`badge ${sentimentColor} border`}>
        {name}
        {mentions > 1 && (
          <span className="ml-1 opacity-75">({mentions})</span>
        )}
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${sentimentColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{name}</span>
        <span className="text-xs opacity-75">
          {mentions} mention{mentions !== 1 ? 's' : ''}
        </span>
      </div>
      {review && (
        <p className="text-xs opacity-75 line-clamp-2 italic">
          "{review}"
        </p>
      )}
    </div>
  );
}
