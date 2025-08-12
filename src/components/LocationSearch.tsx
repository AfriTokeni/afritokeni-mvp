import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { LocationSuggestion } from '../types/auth';

interface LocationSearchProps {
  value?: LocationSuggestion | null;
  onChange: (location: LocationSuggestion | null) => void;
  placeholder?: string;
  required?: boolean;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  placeholder = "Search for your location...",
  required = false
}) => {
  const [query, setQuery] = useState(value?.display_name || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeout = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock location data - in a real app, this would come from a geocoding API
  const mockLocations: LocationSuggestion[] = [
    {
      place_id: "1",
      display_name: "Lagos, Lagos State, Nigeria",
      lat: "6.5244",
      lon: "3.3792",
      address: {
        country: "Nigeria",
        state: "Lagos State",
        city: "Lagos"
      }
    },
    {
      place_id: "2",
      display_name: "Abuja, Federal Capital Territory, Nigeria",
      lat: "9.0765",
      lon: "7.3986",
      address: {
        country: "Nigeria",
        state: "Federal Capital Territory",
        city: "Abuja"
      }
    },
    {
      place_id: "3",
      display_name: "Kano, Kano State, Nigeria",
      lat: "12.0022",
      lon: "8.5920",
      address: {
        country: "Nigeria",
        state: "Kano State",
        city: "Kano"
      }
    },
    {
      place_id: "4",
      display_name: "Port Harcourt, Rivers State, Nigeria",
      lat: "4.8156",
      lon: "7.0498",
      address: {
        country: "Nigeria",
        state: "Rivers State",
        city: "Port Harcourt"
      }
    },
    {
      place_id: "5",
      display_name: "Ibadan, Oyo State, Nigeria",
      lat: "7.3775",
      lon: "3.9470",
      address: {
        country: "Nigeria",
        state: "Oyo State",
        city: "Ibadan"
      }
    }
  ];

  const searchLocations = (searchQuery: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      if (searchQuery.trim()) {
        const filtered = mockLocations.filter(location =>
          location.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.state?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filtered);
      } else {
        setSuggestions(mockLocations.slice(0, 5));
      }
      setIsLoading(false);
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.display_name);
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange(null);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      searchLocations(query);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              Searching locations...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center"
              >
                <MapPin className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-medium">{suggestion.address.city}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.address.state}, {suggestion.address.country}
                  </div>
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No locations found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              Start typing to search for locations
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
