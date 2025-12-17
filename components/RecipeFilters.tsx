'use client';

import { useState } from 'react';

interface RecipeFiltersProps {
  filters: {
    categories: string[];
    tags: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    maxCookingTime?: number;
    maxPrepTime?: number;
  };
  onFiltersChange: (filters: {
    categories: string[];
    tags: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    maxCookingTime?: number;
    maxPrepTime?: number;
  }) => void;
  availableCategories: string[];
  availableTags: string[];
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', icon: '🟢' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'hard', label: 'Hard', icon: '🔴' },
] as const;

const TIME_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export function RecipeFilters({
  filters,
  onFiltersChange,
  availableCategories,
  availableTags
}: RecipeFiltersProps) {
  const [customCookingTime, setCustomCookingTime] = useState('');
  const [customPrepTime, setCustomPrepTime] = useState('');

  const updateFilters = (updates: Partial<typeof filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const setDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | undefined) => {
    updateFilters({ difficulty });
  };

  const setCookingTime = (time: number | undefined) => {
    updateFilters({ maxCookingTime: time });
    if (time === undefined) {
      setCustomCookingTime('');
    }
  };

  const setPrepTime = (time: number | undefined) => {
    updateFilters({ maxPrepTime: time });
    if (time === undefined) {
      setCustomPrepTime('');
    }
  };

  const handleCustomCookingTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const time = parseInt(customCookingTime);
    if (!isNaN(time) && time > 0) {
      setCookingTime(time);
    }
  };

  const handleCustomPrepTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const time = parseInt(customPrepTime);
    if (!isNaN(time) && time > 0) {
      setPrepTime(time);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Categories */}
      {availableCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.categories.includes(category)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {category}
                {filters.categories.includes(category) && (
                  <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {availableTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.tags.includes(tag)
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                #{tag}
                {filters.tags.includes(tag) && (
                  <svg className="ml-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Difficulty</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDifficulty(undefined)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !filters.difficulty
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDifficulty(option.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.difficulty === option.value
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cooking Time */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Max Cooking Time</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCookingTime(undefined)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filters.maxCookingTime
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Any time
            </button>
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setCookingTime(preset.value)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.maxCookingTime === preset.value
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleCustomCookingTimeSubmit} className="flex items-center space-x-2">
            <input
              type="number"
              value={customCookingTime}
              onChange={(e) => setCustomCookingTime(e.target.value)}
              placeholder="Custom minutes"
              min="1"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Set
            </button>
          </form>
          
          {filters.maxCookingTime && !TIME_PRESETS.some(p => p.value === filters.maxCookingTime) && (
            <div className="text-sm text-gray-600">
              Current: {filters.maxCookingTime} minutes
            </div>
          )}
        </div>
      </div>

      {/* Prep Time */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Max Prep Time</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPrepTime(undefined)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filters.maxPrepTime
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Any time
            </button>
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setPrepTime(preset.value)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.maxPrepTime === preset.value
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleCustomPrepTimeSubmit} className="flex items-center space-x-2">
            <input
              type="number"
              value={customPrepTime}
              onChange={(e) => setCustomPrepTime(e.target.value)}
              placeholder="Custom minutes"
              min="1"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Set
            </button>
          </form>
          
          {filters.maxPrepTime && !TIME_PRESETS.some(p => p.value === filters.maxPrepTime) && (
            <div className="text-sm text-gray-600">
              Current: {filters.maxPrepTime} minutes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}