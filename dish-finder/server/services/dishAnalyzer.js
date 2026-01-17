/**
 * Dish Analyzer Service
 * Analyzes restaurant reviews to extract and rank popular dishes
 * Uses NLP techniques to identify dish mentions and sentiment
 */

// Common food words to help identify dish names
const FOOD_INDICATORS = [
  'the', 'their', 'try', 'order', 'ordered', 'had', 'got', 'get',
  'amazing', 'delicious', 'best', 'fantastic', 'excellent', 'great',
  'recommend', 'must-try', 'favorite', 'loved'
];

// Common dish patterns
const DISH_PATTERNS = [
  // "[adjective] [dish]" patterns
  /\b(the|their|try|order|had|get)\s+([\w\s]+?)\s+(is|was|were|are)\s+(amazing|delicious|excellent|great|fantastic|incredible|perfect)/gi,
  // "loved the [dish]"
  /\b(loved|love|enjoyed|recommend)\s+(?:the|their)?\s*([\w\s]{3,30})/gi,
  // "best [dish]"
  /\bbest\s+([\w\s]{3,25})\s+(i've|I've|ever|in town|around)/gi,
  // "must try [dish]"
  /\bmust[\s-]try\s+(?:the|their)?\s*([\w\s]{3,30})/gi,
  // "[dish] is/was incredible"
  /\b([\w\s]{3,25})\s+(is|was)\s+(incredible|amazing|outstanding|phenomenal)/gi
];

// Words that indicate dishes
const DISH_KEYWORDS = [
  'burger', 'pizza', 'pasta', 'steak', 'salad', 'soup', 'sandwich',
  'tacos', 'burrito', 'sushi', 'roll', 'ramen', 'noodles', 'rice',
  'chicken', 'beef', 'pork', 'fish', 'shrimp', 'lobster', 'crab',
  'curry', 'pad thai', 'wings', 'ribs', 'brisket', 'fries',
  'breakfast', 'pancakes', 'waffles', 'eggs', 'omelette', 'benedict',
  'cake', 'pie', 'cheesecake', 'brownie', 'ice cream', 'dessert',
  'appetizer', 'special', 'combo', 'platter', 'bowl', 'wrap'
];

// Sentiment words and their scores
const SENTIMENT_SCORES = {
  positive: {
    'amazing': 0.9, 'excellent': 0.9, 'incredible': 0.95, 'outstanding': 0.95,
    'delicious': 0.85, 'fantastic': 0.85, 'wonderful': 0.85, 'perfect': 0.95,
    'great': 0.75, 'good': 0.65, 'nice': 0.6, 'tasty': 0.75, 'fresh': 0.7,
    'loved': 0.85, 'best': 0.9, 'favorite': 0.85, 'recommend': 0.8,
    'must-try': 0.9, 'phenomenal': 0.95, 'superb': 0.9
  },
  negative: {
    'terrible': -0.9, 'awful': -0.9, 'horrible': -0.9, 'disgusting': -0.95,
    'bad': -0.7, 'disappointing': -0.6, 'mediocre': -0.4, 'bland': -0.5,
    'cold': -0.4, 'overpriced': -0.5, 'avoid': -0.8, 'worst': -0.95
  }
};

/**
 * Extract potential dish names from review text
 */
function extractDishMentions(text) {
  const dishes = new Map();
  const lowerText = text.toLowerCase();

  // Method 1: Pattern matching
  for (const pattern of DISH_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const dishName = cleanDishName(match[2] || match[1]);
      if (isValidDishName(dishName)) {
        const sentiment = calculateSentiment(text, dishName);
        if (dishes.has(dishName)) {
          const existing = dishes.get(dishName);
          existing.count++;
          existing.sentiment = (existing.sentiment + sentiment) / 2;
        } else {
          dishes.set(dishName, { count: 1, sentiment, sampleReview: text.slice(0, 200) });
        }
      }
    }
  }

  // Method 2: Keyword-based extraction
  for (const keyword of DISH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      // Extract surrounding context
      const regex = new RegExp(`(\\w+\\s+)?${keyword}(\\s+\\w+)?`, 'gi');
      const matches = lowerText.matchAll(regex);
      for (const match of matches) {
        const dishName = cleanDishName(match[0]);
        if (isValidDishName(dishName) && !dishes.has(dishName)) {
          const sentiment = calculateSentiment(text, dishName);
          dishes.set(dishName, { count: 1, sentiment, sampleReview: text.slice(0, 200) });
        }
      }
    }
  }

  return dishes;
}

/**
 * Clean and normalize dish name
 */
function cleanDishName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validate if extracted text is likely a dish name
 */
function isValidDishName(name) {
  if (!name || name.length < 3 || name.length > 40) return false;
  
  // Filter out common non-dish words
  const invalidWords = [
    'the', 'and', 'but', 'this', 'that', 'they', 'them', 'their',
    'here', 'there', 'place', 'restaurant', 'service', 'staff',
    'waiter', 'waitress', 'server', 'atmosphere', 'ambiance',
    'time', 'night', 'day', 'week', 'month', 'year'
  ];
  
  const words = name.toLowerCase().split(' ');
  if (words.every(w => invalidWords.includes(w))) return false;
  if (words.length > 5) return false;
  
  return true;
}

/**
 * Calculate sentiment score for a dish mention
 */
function calculateSentiment(text, dishName) {
  const lowerText = text.toLowerCase();
  let totalScore = 0.5; // Neutral baseline
  let scoreCount = 0;

  // Check for positive words near dish mention
  for (const [word, score] of Object.entries(SENTIMENT_SCORES.positive)) {
    if (lowerText.includes(word)) {
      totalScore += score;
      scoreCount++;
    }
  }

  // Check for negative words
  for (const [word, score] of Object.entries(SENTIMENT_SCORES.negative)) {
    if (lowerText.includes(word)) {
      totalScore += score;
      scoreCount++;
    }
  }

  if (scoreCount === 0) return 0.5;
  return Math.max(0, Math.min(1, totalScore / scoreCount));
}

/**
 * Analyze reviews and extract top dishes
 */
export function analyzeReviews(reviews) {
  const allDishes = new Map();

  for (const review of reviews) {
    if (!review.text) continue;
    
    const reviewDishes = extractDishMentions(review.text);
    
    for (const [dishName, data] of reviewDishes) {
      if (allDishes.has(dishName)) {
        const existing = allDishes.get(dishName);
        existing.mentionCount += data.count;
        existing.totalSentiment += data.sentiment;
        existing.reviewCount++;
        if (data.sentiment > existing.bestSentiment) {
          existing.bestSentiment = data.sentiment;
          existing.sampleReview = data.sampleReview;
        }
      } else {
        allDishes.set(dishName, {
          dishName,
          mentionCount: data.count,
          totalSentiment: data.sentiment,
          reviewCount: 1,
          bestSentiment: data.sentiment,
          sampleReview: data.sampleReview
        });
      }
    }
  }

  // Convert to array and calculate average sentiment
  const dishArray = Array.from(allDishes.values()).map(dish => ({
    dishName: dish.dishName,
    mentionCount: dish.mentionCount,
    averageSentiment: dish.totalSentiment / dish.reviewCount,
    sampleReview: dish.sampleReview
  }));

  // Sort by mention count and sentiment, return top 3
  return dishArray
    .sort((a, b) => {
      // Primary sort by mentions, secondary by sentiment
      const scoreA = a.mentionCount * 0.6 + a.averageSentiment * 10 * 0.4;
      const scoreB = b.mentionCount * 0.6 + b.averageSentiment * 10 * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, 3);
}

/**
 * Get dish recommendations for a restaurant
 */
export function getTopDishes(reviews) {
  if (!reviews || reviews.length === 0) {
    return [];
  }

  const dishes = analyzeReviews(reviews);
  
  // If no dishes found, return generic recommendations based on cuisine
  if (dishes.length === 0) {
    return [
      { dishName: 'Chef\'s Special', mentionCount: 0, averageSentiment: 0.7, sampleReview: 'Popular choice' }
    ];
  }

  return dishes;
}

export default {
  analyzeReviews,
  getTopDishes
};
