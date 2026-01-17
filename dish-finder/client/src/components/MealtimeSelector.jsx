/**
 * MealtimeSelector Component
 * Quick selection buttons for meal time
 */

const MEALTIMES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅', hours: '6am-11am' },
  { id: 'lunch', label: 'Lunch', icon: '☀️', hours: '11am-3pm' },
  { id: 'dinner', label: 'Dinner', icon: '🌙', hours: '5pm-10pm' },
  { id: 'latenight', label: 'Late Night', icon: '🌃', hours: '10pm-2am' }
];

export default function MealtimeSelector({ value, onChange }) {
  // Auto-detect current mealtime
  const getCurrentMealtime = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 17 && hour < 22) return 'dinner';
    return 'latenight';
  };

  const currentMealtime = getCurrentMealtime();

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        When are you eating?
      </label>
      <div className="grid grid-cols-2 gap-2">
        {MEALTIMES.map((meal) => (
          <button
            key={meal.id}
            type="button"
            onClick={() => onChange(meal.id)}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200
              flex flex-col items-center justify-center
              ${value === meal.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
              ${currentMealtime === meal.id && value !== meal.id ? 'ring-2 ring-primary-200' : ''}
            `}
          >
            <span className="text-2xl mb-1">{meal.icon}</span>
            <span className="font-medium text-sm">{meal.label}</span>
            <span className="text-xs text-gray-500 mt-0.5">{meal.hours}</span>
            
            {/* Current time indicator */}
            {currentMealtime === meal.id && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
