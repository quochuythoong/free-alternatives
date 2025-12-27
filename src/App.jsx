import React, { useState } from 'react';
import { Search, Sparkles, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter something to search for');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);
    setSearchMessage('');

    try {
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/api/search'
        : '/api/search';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
      setSearchMessage(data.message || '');
      
      if (data.results.length === 0) {
        setError(`No free alternatives found for "${searchQuery}". Try searching for a popular paid software.`);
      }

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      {/* Header */}
      <header className="border-b border-green-200/50 bg-white/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Free Alternatives</h1>
              <p className="text-sm text-gray-500">AI-powered search for truly free software</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What paid software are you looking to replace? (e.g., Photoshop, AutoCAD, Notion)"
                className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-green-200/50 bg-white/60 backdrop-blur-sm focus:border-green-400 focus:outline-none transition-all text-gray-700 placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Searching the internet...</h3>
            <p className="text-gray-500">AI is finding free alternatives for you</p>
            <div className="mt-8 max-w-md mx-auto">
              <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 animate-loading" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Search Failed</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                {searchMessage} {results.length > 0 && `• ${results.length} results`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((provider, idx) => (
                <div
                  key={provider.id || idx}
                  className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-green-200/50 hover:border-green-300 hover:shadow-xl transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium rounded-full">
                      {provider.category}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                    {provider.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {provider.short_description}
                  </p>
                  
                  {provider.tags && provider.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {provider.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <a
                    href={provider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
                  >
                    Visit Site
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initial State */}
        {!loading && !hasSearched && (
          <div className="text-center py-16 max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Find Free Alternatives
            </h2>
            <p className="text-gray-600 mb-8">
              Search for any paid software and we'll find truly free alternatives using AI.
              No trials, no subscriptions, just permanent free software.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Photoshop', 'AutoCAD', 'Notion', 'Figma', 'Final Cut Pro', 'Microsoft Office'].map(example => (
                <button
                  key={example}
                  onClick={() => {
                    setSearchQuery(example);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="px-4 py-2 bg-white/60 hover:bg-white/80 border border-green-200/50 rounded-xl text-gray-700 hover:text-green-600 transition-all text-sm"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty Results */}
        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No alternatives found</h3>
            <p className="text-gray-500">
              Try searching for a different paid software or be more specific
            </p>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-loading {
          animation: loading 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default App;