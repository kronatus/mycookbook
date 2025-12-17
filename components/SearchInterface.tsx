'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchSuggestion {
  suggestion: string;
  source: 'history' | 'ingredient' | 'category' | 'tag';
  frequency: number;
}

interface SearchInterfaceProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
  enableServerSuggestions?: boolean;
}

export function SearchInterface({ 
  searchTerm, 
  onSearch, 
  placeholder = "Search recipes...",
  className = "",
  enableServerSuggestions = true
}: SearchInterfaceProps) {
  const [inputValue, setInputValue] = useState(searchTerm);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [serverSuggestions, setServerSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionDebounceRef = useRef<NodeJS.Timeout>();

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recipe-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  // Update input value when searchTerm prop changes
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Debounced search function
  const debouncedSearch = (term: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onSearch(term);
      
      // Add to search history if it's a meaningful search
      if (term.trim() && term.length > 2) {
        addToSearchHistory(term.trim());
      }
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
    
    // Fetch server suggestions if enabled
    if (enableServerSuggestions) {
      debouncedFetchSuggestions(value);
    }
  };

  // Debounced function to fetch server suggestions
  const debouncedFetchSuggestions = (term: string) => {
    if (suggestionDebounceRef.current) {
      clearTimeout(suggestionDebounceRef.current);
    }
    
    suggestionDebounceRef.current = setTimeout(async () => {
      if (term.length >= 2) {
        await fetchServerSuggestions(term);
      } else {
        setServerSuggestions([]);
      }
    }, 300);
  };

  // Fetch suggestions from server
  const fetchServerSuggestions = async (term: string) => {
    try {
      setLoadingSuggestions(true);
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(term)}&limit=8`);
      
      if (response.ok) {
        const data = await response.json();
        setServerSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearch(inputValue);
    
    if (inputValue.trim() && inputValue.length > 2) {
      addToSearchHistory(inputValue.trim());
    }
    
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const addToSearchHistory = (term: string) => {
    setSearchHistory(prev => {
      const newHistory = [term, ...prev.filter(item => item !== term)].slice(0, 10);
      localStorage.setItem('recipe-search-history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setInputValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  const clearSearchHistory = async () => {
    setSearchHistory([]);
    localStorage.removeItem('recipe-search-history');
    setShowSuggestions(false);
    
    // Also clear server-side search history if enabled
    if (enableServerSuggestions) {
      try {
        await fetch('/api/search/history', { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to clear server search history:', error);
      }
    }
  };

  // Combine and filter suggestions
  const getAllSuggestions = () => {
    const suggestions: Array<{ text: string; source: string; frequency?: number }> = [];
    
    // Add server suggestions first (if enabled and available)
    if (enableServerSuggestions && serverSuggestions.length > 0) {
      serverSuggestions.forEach(suggestion => {
        if (suggestion.suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
            suggestion.suggestion !== inputValue) {
          suggestions.push({
            text: suggestion.suggestion,
            source: suggestion.source,
            frequency: suggestion.frequency
          });
        }
      });
    }
    
    // Add local search history (for fallback or when server suggestions are disabled)
    const filteredHistory = searchHistory.filter(item =>
      item.toLowerCase().includes(inputValue.toLowerCase()) && 
      item !== inputValue &&
      !suggestions.some(s => s.text === item) // Avoid duplicates
    );
    
    filteredHistory.forEach(item => {
      suggestions.push({
        text: item,
        source: 'history'
      });
    });
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  };

  const allSuggestions = getAllSuggestions();

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow clicks
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && (allSuggestions.length > 0 || (!inputValue && searchHistory.length > 0) || loadingSuggestions) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-2">
            {!inputValue && searchHistory.length > 0 && (
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Recent Searches
              </div>
            )}
            
            {loadingSuggestions && (
              <div className="px-3 py-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                  Loading suggestions...
                </div>
              </div>
            )}
            
            {!loadingSuggestions && (inputValue ? allSuggestions : searchHistory.slice(0, 5)).map((suggestion, index) => {
              const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
              const suggestionSource = typeof suggestion === 'string' ? 'history' : suggestion.source;
              const suggestionFrequency = typeof suggestion === 'string' ? undefined : suggestion.frequency;
              
              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestionText)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {suggestionSource === 'history' ? (
                        <svg
                          className="h-4 w-4 text-gray-400 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : suggestionSource === 'ingredient' ? (
                        <svg
                          className="h-4 w-4 text-green-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 text-blue-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                          />
                        </svg>
                      )}
                      <span className="text-sm text-gray-900">{suggestionText}</span>
                    </div>
                    {suggestionFrequency && suggestionFrequency > 1 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {suggestionFrequency}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            
            {!inputValue && searchHistory.length > 0 && !loadingSuggestions && (
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={clearSearchHistory}
                  className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  Clear search history
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}