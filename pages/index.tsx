




import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Search, Upload, Download, Linkedin, Facebook, Twitter, Instagram, Youtube, Globe, Mail, Loader2, Copy, Check, Clock, FileDown, Moon, Sun, RefreshCw, Phone, Eye, TrendingUp, Settings, X } from 'lucide-react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface EnrichResult {
  company_name: string;
  website: string;
  contact_page: string;
  email: string;
  phone: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  pinterest: string;
  github: string;
  keywords?: string[];
  status: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [companyInput, setCompanyInput] = useState('');
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini'>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [method, setMethod] = useState<'extraction' | 'ai' | 'hybrid'>('extraction');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [bulkResults, setBulkResults] = useState<EnrichResult[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [darkMode, setDarkMode] = useState(false);
  const [searchProgress, setSearchProgress] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'pinterest', 'github']);
  const [showPlatformFilter, setShowPlatformFilter] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [availableModels, setAvailableModels] = useState<Array<{id: string; name: string; isFree?: boolean}>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [hasEnvKeys, setHasEnvKeys] = useState({ openrouter: false, gemini: false });

  // Load recent searches, dark mode, and visitor stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Track visitor count
    const visitors = localStorage.getItem('visitorCount');
    const newVisitorCount = visitors ? parseInt(visitors) + 1 : 1;
    setVisitorCount(newVisitorCount);
    localStorage.setItem('visitorCount', newVisitorCount.toString());

    // Load search count
    const searches = localStorage.getItem('searchCount');
    if (searches) {
      setSearchCount(parseInt(searches));
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Check environment variables on load and auto-fetch models
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await axios.get('/api/check-env');
        setHasEnvKeys({
          openrouter: response.data.hasOpenRouterKey,
          gemini: response.data.hasGeminiKey
        });
        
        // Auto-fetch models if OpenRouter key is available in env
        if (response.data.hasOpenRouterKey && aiProvider === 'openrouter') {
          console.log('OpenRouter key found in environment, fetching models...');
          await fetchModels();
        }
      } catch (error) {
        console.error('Failed to check environment variables:', error);
      }
    };
    checkEnvVars();
  }, []);

  // Auto-fetch models when API key is entered or AI provider changes
  useEffect(() => {
    const shouldFetchModels = 
      aiProvider === 'openrouter' && 
      (method === 'ai' || method === 'hybrid') &&
      (apiKey || hasEnvKeys.openrouter) &&
      availableModels.length === 0;
    
    if (shouldFetchModels) {
      console.log('API key detected, auto-fetching models...');
      fetchModels();
    }
  }, [apiKey, aiProvider, method, hasEnvKeys.openrouter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      
      // Ctrl+Enter or Cmd+Enter - Submit search
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'single' && companyInput.trim()) {
          handleSingleSearch();
        }
      }
      
      // Escape - Clear results
      if (e.key === 'Escape') {
        setResult(null);
        setErrorMessage('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, companyInput]);

  // Save to recent searches
  const addToRecentSearches = (company: string) => {
    const updated = [company, ...recentSearches.filter(s => s !== company)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Fetch available models from OpenRouter
  const fetchModels = async () => {
    setLoadingModels(true);
    setErrorMessage('');
    
    try {
      // Pass apiKey if available, otherwise backend will use env variable
      const url = apiKey 
        ? `/api/models?apiKey=${encodeURIComponent(apiKey)}`
        : '/api/models';
      
      const response = await axios.get(url);
      const models = response.data.models;
      setAvailableModels(models);
      
      // Set first free model as default, or first model if no free models
      if (models.length > 0) {
        const firstFreeModel = models.find((m: any) => m.isFree);
        setSelectedModel(firstFreeModel ? firstFreeModel.id : models[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching models:', error);
      const errorMsg = error.response?.data?.error || error.message;
      setErrorMessage(`❌ Failed to fetch models: ${errorMsg}`);
    } finally {
      setLoadingModels(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export to CSV
  const exportToCSV = (data: EnrichResult[]) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `social-urls-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Increment search count
  const incrementSearchCount = () => {
    const newCount = searchCount + 1;
    setSearchCount(newCount);
    localStorage.setItem('searchCount', newCount.toString());
  };

  const handleSingleSearch = async () => {
    if (!companyInput.trim()) return;

    // Validate AI method requirements
    if (method === 'ai' || method === 'hybrid') {
      if (aiProvider === 'openrouter') {
        if (!apiKey && !hasEnvKeys.openrouter) {
          setErrorMessage('🔑 AI method requires an OpenRouter API key. Please enter your API key above or set it in environment variables.');
          return;
        }
        if (availableModels.length === 0) {
          setErrorMessage('⚠️ Please fetch AI models first by clicking the "Fetch Models" button.');
          return;
        }
        if (!selectedModel) {
          setErrorMessage('⚠️ Please select an AI model from the dropdown.');
          return;
        }
      } else if (aiProvider === 'gemini') {
        if (!geminiApiKey && !hasEnvKeys.gemini) {
          setErrorMessage('🔑 AI method requires a Google Gemini API key. Please enter your API key above or set it in environment variables.');
          return;
        }
      }
    }

    setLoading(true);
    setResult(null);
    setErrorMessage('');
    setSearchProgress('🔍 Finding website...');

    // Add to recent searches
    addToRecentSearches(companyInput);
    
    // Increment search count
    incrementSearchCount();

    try {
      // Show progress messages based on method
      if (method === 'ai') {
        setTimeout(() => setSearchProgress('🤖 AI analyzing company...'), 500);
        setTimeout(() => setSearchProgress('🔍 Searching social profiles...'), 1500);
        setTimeout(() => setSearchProgress('✅ Processing results...'), 2500);
      } else if (method === 'extraction') {
        setTimeout(() => setSearchProgress('🌐 Finding website...'), 500);
        setTimeout(() => setSearchProgress('📋 Step 1: Crawling menu links...'), 2000);
        setTimeout(() => setSearchProgress('🔍 Step 2: Identifying important pages...'), 4000);
        setTimeout(() => setSearchProgress('📄 Step 3: Scraping contact, about, privacy pages...'), 6000);
        setTimeout(() => setSearchProgress('🔗 Extracting social links and contact info...'), 8000);
        setTimeout(() => setSearchProgress('✅ Processing results...'), 10000);
      } else {
        setTimeout(() => setSearchProgress('🤖 AI analyzing company...'), 500);
        setTimeout(() => setSearchProgress('🌐 Finding website...'), 2000);
        setTimeout(() => setSearchProgress('📋 Crawling menu links...'), 4000);
        setTimeout(() => setSearchProgress('📄 Scraping multiple pages...'), 6000);
        setTimeout(() => setSearchProgress('✅ Processing results...'), 8000);
      }

      const response = await axios.post<EnrichResult>('/api/enrich', {
        company: companyInput,
        method: method,
        aiProvider: aiProvider,
        apiKey: apiKey || undefined,
        geminiApiKey: geminiApiKey || undefined,
        customPrompt: customPrompt || undefined,
        platforms: selectedPlatforms,
        model: selectedModel,
      });
      setResult(response.data);
      setSearchProgress('');
      
      // Better error messages based on status
      if (response.data.status.includes('Failed')) {
        if (response.data.status.includes('Could not find website')) {
          setErrorMessage('❌ Website not found. Please check the company name or try entering the website URL directly.');
        } else if (response.data.status.includes('API key')) {
          setErrorMessage('🔑 AI method requires an API key. Please enter your OpenRouter API key above or switch to Extraction method.');
        } else {
          setErrorMessage('⚠️ Search completed with some issues. Check the results below.');
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      // Detailed error messages
      if (error.response?.status === 429) {
        setErrorMessage('⏱️ Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.response?.status === 500) {
        setErrorMessage('🔧 Server error. The website might be temporarily unavailable.');
      } else if (error.code === 'ECONNABORTED') {
        setErrorMessage('⏰ Request timed out. The website took too long to respond.');
      } else {
        setErrorMessage('❌ An error occurred. Please try again or contact support.');
      }
      
      setResult({
        company_name: companyInput,
        website: '',
        contact_page: 'Not found',
        email: 'Not found',
        phone: 'Not found',
        linkedin: 'Not found',
        facebook: 'Not found',
        twitter: 'Not found',
        instagram: 'Not found',
        youtube: 'Not found',
        tiktok: 'Not found',
        pinterest: 'Not found',
        github: 'Not found',
        status: 'Error: Failed to fetch',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBulkFile(file);
      setBulkResults([]);
      setBulkProgress(0);
    }
  };

  const processBulkFile = async () => {
    if (!bulkFile) return;

    // Validate AI method requirements for bulk processing
    if (method === 'ai' || method === 'hybrid') {
      if (aiProvider === 'openrouter') {
        if (!apiKey && !hasEnvKeys.openrouter) {
          setErrorMessage('🔑 AI method requires an OpenRouter API key. Please enter your API key above or set it in environment variables.');
          return;
        }
        if (availableModels.length === 0) {
          setErrorMessage('⚠️ Please fetch AI models first by clicking the "Fetch Models" button.');
          return;
        }
        if (!selectedModel) {
          setErrorMessage('⚠️ Please select an AI model from the dropdown.');
          return;
        }
      } else if (aiProvider === 'gemini') {
        if (!geminiApiKey && !hasEnvKeys.gemini) {
          setErrorMessage('🔑 AI method requires a Google Gemini API key. Please enter your API key above or set it in environment variables.');
          return;
        }
      }
    }

    const fileExtension = bulkFile.name.split('.').pop()?.toLowerCase();
    let companies: string[] = [];

    if (fileExtension === 'csv') {
      Papa.parse(bulkFile, {
        header: true,
        complete: async (results) => {
          const data = results.data as any[];
          // Try to find company column
          const companyCol = Object.keys(data[0] || {}).find(key => 
            key.toLowerCase().includes('company') || key.toLowerCase().includes('name')
          );
          
          if (companyCol) {
            companies = data.map(row => row[companyCol]).filter(Boolean);
            await processBulkCompanies(companies);
          }
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
        
        const companyCol = Object.keys(jsonData[0] || {}).find(key => 
          key.toLowerCase().includes('company') || key.toLowerCase().includes('name')
        );
        
        if (companyCol) {
          companies = jsonData.map(row => row[companyCol]).filter(Boolean);
          await processBulkCompanies(companies);
        }
      };
      reader.readAsArrayBuffer(bulkFile);
    }
  };

  const processBulkCompanies = async (companies: string[]) => {
    const results: EnrichResult[] = [];
    
    for (let i = 0; i < companies.length; i++) {
      try {
        const response = await axios.post<EnrichResult>('/api/enrich', {
          company: companies[i],
          method: method,
          aiProvider: aiProvider,
          apiKey: apiKey || undefined,
          geminiApiKey: geminiApiKey || undefined,
          customPrompt: customPrompt || undefined,
          platforms: selectedPlatforms,
          model: selectedModel,
        });
        results.push(response.data);
      } catch (error) {
        results.push({
          company_name: companies[i],
          website: '',
          contact_page: 'Not found',
          email: 'Not found',
          phone: 'Not found',
          linkedin: 'Not found',
          facebook: 'Not found',
          twitter: 'Not found',
          instagram: 'Not found',
          youtube: 'Not found',
          tiktok: 'Not found',
          pinterest: 'Not found',
          github: 'Not found',
          status: 'Error',
        });
      }
      
      setBulkProgress(((i + 1) / companies.length) * 100);
      setBulkResults([...results]);
    }
  };

  const downloadResults = () => {
    const worksheet = XLSX.utils.json_to_sheet(bulkResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, 'company-social-urls.xlsx');
  };

  return (
    <>
      <Head>
        <title>Company Social URL Finder</title>
        <meta name="description" content="Find official social media profiles for any company" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-blue-50 to-white'}`}>
        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* API Keys Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                🔑 API Keys
                {(hasEnvKeys.openrouter || hasEnvKeys.gemini) && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Set</span>
                )}
              </h3>
              
              {/* Environment Status */}
              {(hasEnvKeys.openrouter || hasEnvKeys.gemini) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-1">✅ Environment Variables</p>
                  <div className="text-xs text-green-600 space-y-1">
                    {hasEnvKeys.openrouter && <p>• OpenRouter key set</p>}
                    {hasEnvKeys.gemini && <p>• Gemini key set</p>}
                  </div>
                </div>
              )}
              
              {/* OpenRouter API Key */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  OpenRouter API Key
                </label>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get free key at{' '}
                  <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    openrouter.ai
                  </a>
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get key at{' '}
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google AI Studio
                  </a>
                </p>
              </div>

              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showApiKey ? 'Hide' : 'Show'} keys
              </button>
            </div>

            {/* AI Provider Selection */}
            {(method === 'ai' || method === 'hybrid') && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🤖 AI Provider</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      value="openrouter"
                      checked={aiProvider === 'openrouter'}
                      onChange={(e) => setAiProvider(e.target.value as 'openrouter' | 'gemini')}
                      className="text-primary"
                    />
                    <div>
                      <div className="text-sm font-medium">OpenRouter</div>
                      <div className="text-xs text-gray-500">Free models available</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      value="gemini"
                      checked={aiProvider === 'gemini'}
                      onChange={(e) => setAiProvider(e.target.value as 'openrouter' | 'gemini')}
                      className="text-primary"
                    />
                    <div>
                      <div className="text-sm font-medium">Google Gemini</div>
                      <div className="text-xs text-gray-500">Premium quality</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* AI Model Selection */}
            {(method === 'ai' || method === 'hybrid') && aiProvider === 'openrouter' && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">AI Model</h3>
                  <button
                    onClick={fetchModels}
                    disabled={loadingModels}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                  >
                    {loadingModels ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </button>
                </div>
                
                {loadingModels ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-xs text-gray-600">Loading models...</span>
                  </div>
                ) : availableModels.length > 0 ? (
                  <>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    >
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.isFree ? '🆓 ' : ''}{model.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Free models marked with 🆓
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-600">
                    Click refresh to load models
                  </p>
                )}
              </div>
            )}

            {/* Platform Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Platforms to Search</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
                  { key: 'facebook', label: 'Facebook', icon: '📘' },
                  { key: 'twitter', label: 'Twitter/X', icon: '🐦' },
                  { key: 'instagram', label: 'Instagram', icon: '📸' },
                  { key: 'youtube', label: 'YouTube', icon: '📺' },
                  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
                  { key: 'pinterest', label: 'Pinterest', icon: '📌' },
                  { key: 'github', label: 'GitHub', icon: '💻' },
                ].map(({ key, label, icon }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(key)}
                      onChange={() => togglePlatform(key)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>{icon} {label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            {(method === 'ai' || method === 'hybrid') && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">✍️ Custom AI Prompt</h3>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Leave empty for default prompt..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header with Dark Mode Toggle and Stats */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1 text-center">
              <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-primary'}`}>
                🔍 Company Social URL Finder
              </h1>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Find official social media profiles and contact pages for any company
              </p>
              <div className="mt-2 text-xs text-gray-500">
                ⌨️ Shortcuts: <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+K</kbd> Focus | <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Enter</kbd> Search | <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> Clear
              </div>
              
              {/* Visitor Counter */}
              <div className="mt-3 flex justify-center gap-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-blue-100 text-blue-700'}`}>
                  <Eye className="w-3 h-3" />
                  <span className="font-semibold">{visitorCount.toLocaleString()}</span>
                  <span>visits</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-green-100 text-green-700'}`}>
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-semibold">{searchCount.toLocaleString()}</span>
                  <span>searches</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSidebar(true)}
                className={`p-3 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-blue-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-md`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} shadow-md`}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* API Keys and settings moved to sidebar */}

          {/* Method Selection - Simplified */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-800 mb-4">
                Choose Search Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`cursor-pointer p-4 border-2 rounded-xl hover:shadow-md transition-all ${
                  method === 'extraction' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    value="extraction"
                    checked={method === 'extraction'}
                    onChange={(e) => setMethod(e.target.value as 'extraction' | 'ai' | 'hybrid')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="font-bold text-gray-800 mb-1">Extraction</div>
                    <div className="text-xs text-gray-600 mb-2">Fast & Free</div>
                    <div className="text-xs text-green-600 font-medium">✓ No API key</div>
                  </div>
                </label>
                <label className={`cursor-pointer p-4 border-2 rounded-xl hover:shadow-md transition-all ${
                  method === 'ai' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    value="ai"
                    checked={method === 'ai'}
                    onChange={(e) => setMethod(e.target.value as 'extraction' | 'ai' | 'hybrid')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🤖</div>
                    <div className="font-bold text-gray-800 mb-1">AI Only</div>
                    <div className="text-xs text-gray-600 mb-2">Intelligent</div>
                    <div className="text-xs text-blue-600 font-medium">⚡ API key needed</div>
                  </div>
                </label>
                <label className={`cursor-pointer p-4 border-2 rounded-xl hover:shadow-md transition-all ${
                  method === 'hybrid' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <input
                    type="radio"
                    value="hybrid"
                    checked={method === 'hybrid'}
                    onChange={(e) => setMethod(e.target.value as 'extraction' | 'ai' | 'hybrid')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🚀</div>
                    <div className="font-bold text-gray-800 mb-1">Hybrid</div>
                    <div className="text-xs text-gray-600 mb-2">Best Quality</div>
                    <div className="text-xs text-purple-600 font-medium">⭐ Recommended</div>
                  </div>
                </label>
              </div>
            </div>

            {/* AI Provider Selection */}
            {(method === 'ai' || method === 'hybrid') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="openrouter"
                      checked={aiProvider === 'openrouter'}
                      onChange={(e) => setAiProvider(e.target.value as 'openrouter' | 'gemini')}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      <strong>OpenRouter</strong> - Free models available 🆓
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="gemini"
                      checked={aiProvider === 'gemini'}
                      onChange={(e) => setAiProvider(e.target.value as 'openrouter' | 'gemini')}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      <strong>Google Gemini</strong> - Premium quality ⭐
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* AI Model Selection (OpenRouter only) - Show for AI and Hybrid methods */}
            {(method === 'ai' || method === 'hybrid') && aiProvider === 'openrouter' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    AI Model
                  </label>
                  <button
                    onClick={fetchModels}
                    disabled={loadingModels}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                  >
                    {loadingModels ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        Fetch Models
                      </>
                    )}
                  </button>
                </div>
                
                {loadingModels ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Loading AI models...</span>
                  </div>
                ) : availableModels.length > 0 ? (
                  <>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.isFree ? '🆓 ' : ''}{model.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 <strong>Free models</strong> are marked with 🆓 - perfect for freelancers!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Selected: <strong>{availableModels.find(m => m.id === selectedModel)?.name || selectedModel}</strong>
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      Click "Fetch Models" to load available AI models from OpenRouter (includes free models!)
                    </p>
                    {(apiKey || hasEnvKeys.openrouter) && (
                      <p className="text-xs text-blue-600">
                        💡 API key detected - models will auto-fetch when you select AI or Hybrid method
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Advanced settings moved to sidebar */}
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'single'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="inline-block w-4 h-4 mr-2" />
                Single Company
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'bulk'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="inline-block w-4 h-4 mr-2" />
                Bulk Enrichment
              </button>
            </div>
          </div>

          {/* Single Company Tab */}
          {activeTab === 'single' && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowRecentSearches(!showRecentSearches)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Clock className="w-4 h-4" />
                    Recent Searches ({recentSearches.length})
                  </button>
                  {showRecentSearches && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => setCompanyInput(search)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
                  onFocus={() => setShowRecentSearches(true)}
                  placeholder="Enter company name or website URL (e.g., Microsoft or microsoft.com)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleSingleSearch}
                  disabled={loading || !companyInput.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Find Social URLs
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{errorMessage}</p>
                </div>
              )}

              {/* Progress Indicator */}
              {loading && searchProgress && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">{searchProgress}</p>
                  </div>
                </div>
              )}

              {/* Loading Skeleton */}
              {loading && !result && (
                <div className="mt-6 animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="mt-6">
                  <div className={`p-4 rounded-lg mb-4 flex justify-between items-center ${
                    result.status === 'Success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="font-medium">
                      Status: {result.status}
                    </p>
                    {result.status !== 'Success' && (
                      <button
                        onClick={handleSingleSearch}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry Search
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Company Information
                      </h3>
                      <p className="text-sm text-gray-600">Company: {result.company_name}</p>
                      {result.website && (
                        <a 
                          href={result.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Website: {result.website}
                        </a>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Contact Information
                      </h3>
                      <div className="space-y-2">
                        {/* Email */}
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {result.email !== 'Not found' ? (
                            <div className="flex items-center gap-2 flex-1">
                              <a 
                                href={`mailto:${result.email}`}
                                className="text-sm text-primary hover:underline truncate"
                                title={result.email}
                              >
                                {result.email}
                              </a>
                              <button
                                onClick={() => copyToClipboard(result.email)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy email"
                              >
                                {copiedUrl === result.email ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-600" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No email found</span>
                          )}
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {result.phone !== 'Not found' ? (
                            <div className="flex items-center gap-2 flex-1">
                              <a 
                                href={`tel:${result.phone}`}
                                className="text-sm text-primary hover:underline"
                                title={result.phone}
                              >
                                {result.phone}
                              </a>
                              <button
                                onClick={() => copyToClipboard(result.phone)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Copy phone"
                              >
                                {copiedUrl === result.phone ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-600" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No phone found</span>
                          )}
                        </div>

                        {/* Contact Page */}
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          {result.contact_page !== 'Not found' ? (
                            <a 
                              href={result.contact_page} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline break-all"
                            >
                              {result.contact_page}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500">No contact page found</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold mb-3">Social Media Profiles</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-600' },
                        { key: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-700' },
                        { key: 'twitter', icon: Twitter, label: 'Twitter/X', color: 'text-sky-500' },
                        { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-600' },
                        { key: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-600' },
                      ].map(({ key, icon: Icon, label, color }) => {
                        const url = result[key as keyof EnrichResult] as string;
                        const isFound = url !== 'Not found';
                        return (
                          <div key={key} className="flex items-center gap-2 p-3 bg-white border rounded-lg">
                            <Icon className={`w-5 h-5 ${color}`} />
                            <span className="font-medium text-sm">{label}:</span>
                            {isFound ? (
                              <>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-xs truncate flex-1"
                                  title={url}
                                >
                                  {url}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(url)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="Copy to clipboard"
                                >
                                  {copiedUrl === url ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">Not found</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keywords Section */}
                  {result.keywords && result.keywords.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                        <TrendingUp className="w-5 h-5" />
                        Website Keywords ({result.keywords.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white border border-purple-300 text-purple-700 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-3">
                        💡 These keywords represent the most frequent terms found on the website
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bulk Enrichment Tab */}
          {activeTab === 'bulk' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV or Excel file
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
                />
                <p className="mt-2 text-sm text-gray-500">
                  File should contain a column with company names or URLs
                </p>
              </div>

              {bulkFile && (
                <div className="mb-4">
                  <p className="text-sm text-green-600 mb-2">
                    ✓ File uploaded: {bulkFile.name}
                  </p>
                  <button
                    onClick={processBulkFile}
                    disabled={bulkProgress > 0 && bulkProgress < 100}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {bulkProgress > 0 && bulkProgress < 100 ? 'Processing...' : 'Start Bulk Enrichment'}
                  </button>
                </div>
              )}

              {bulkProgress > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-primary h-4 rounded-full transition-all duration-300"
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Progress: {Math.round(bulkProgress)}%
                  </p>
                </div>
              )}

              {bulkResults.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Results ({bulkResults.length} companies)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToCSV(bulkResults)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        Download CSV
                      </button>
                      <button
                        onClick={downloadResults}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Excel
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Page</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LinkedIn</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facebook</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Twitter</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bulkResults.map((result, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm">{result.company_name}</td>
                            <td className="px-4 py-3 text-sm">
                              {result.website ? (
                                <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  Link
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {result.contact_page !== 'Not found' ? (
                                <a href={result.contact_page} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  Link
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {result.email !== 'Not found' ? (
                                <a href={`mailto:${result.email}`} className="text-primary hover:underline truncate max-w-xs block">
                                  {result.email}
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {result.phone !== 'Not found' ? (
                                <a href={`tel:${result.phone}`} className="text-primary hover:underline">
                                  {result.phone}
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {result.linkedin !== 'Not found' ? (
                                <a href={result.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  Link
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {result.facebook !== 'Not found' ? (
                                <a href={result.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  Link
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {result.twitter !== 'Not found' ? (
                                <a href={result.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  Link
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                result.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>Made with ❤️ using Next.js | Deployed on Vercel</p>
          </div>
        </div>
      </main>
    </>
  );
}
