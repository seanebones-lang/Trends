import { useState } from 'react';
import { useStore } from '../store';

export default function ConfigPanel() {
  const { apiKeys, filters, setApiKeys, setFilters } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        ⚙️ Settings
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* API Keys Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">API Keys</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        X API Key (Required)
                      </label>
                      <input
                        type="password"
                        value={apiKeys.xApiKey}
                        onChange={(e) => setApiKeys({ xApiKey: e.target.value })}
                        placeholder="Enter your X API Bearer Token"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from{' '}
                        <a
                          href="https://developer.twitter.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          developer.twitter.com
                        </a>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        xAI Grok API Key (Optional)
                      </label>
                      <input
                        type="password"
                        value={apiKeys.grokApiKey}
                        onChange={(e) => setApiKeys({ grokApiKey: e.target.value })}
                        placeholder="Enter your xAI Grok API Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: For advanced sentiment analysis. Uses free sentiment library if not provided.
                        Get your key from{' '}
                        <a
                          href="https://console.x.ai"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          console.x.ai
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search Configuration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keyword / Search Query
                      </label>
                      <input
                        type="text"
                        value={filters.keyword}
                        onChange={(e) => setFilters({ keyword: e.target.value })}
                        placeholder="e.g., artificial intelligence"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setIsOpen(false);
                          }
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Results
                        </label>
                        <input
                          type="number"
                          value={filters.maxResults || 100}
                          onChange={(e) => setFilters({ maxResults: parseInt(e.target.value) || 100 })}
                          min="1"
                          max="500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Engagement
                        </label>
                        <input
                          type="number"
                          value={filters.minEngagement || ''}
                          onChange={(e) => setFilters({ minEngagement: parseInt(e.target.value) || undefined })}
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
