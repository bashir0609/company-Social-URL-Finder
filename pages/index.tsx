import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Search, Upload, Download, Linkedin, Facebook, Twitter, Instagram, Youtube, Globe, Mail, Loader2, Copy, Check, Clock, FileDown } from 'lucide-react';
import axios from 'axios';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface EnrichResult {
  company_name: string;
  website: string;
  contact_page: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  pinterest: string;
  github: string;
  status: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [companyInput, setCompanyInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [method, setMethod] = useState<'extraction' | 'ai'>('extraction');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [bulkResults, setBulkResults] = useState<EnrichResult[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = (company: string) => {
    const updated = [company, ...recentSearches.filter(s => s !== company)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
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

  const handleSingleSearch = async () => {
    if (!companyInput.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorMessage('');

    // Add to recent searches
    addToRecentSearches(companyInput);

    try {
      const response = await axios.post<EnrichResult>('/api/enrich', {
        company: companyInput,
        method: method,
        apiKey: apiKey || undefined,
        customPrompt: customPrompt || undefined,
      });
      setResult(response.data);
      
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
          apiKey: apiKey || undefined,
          customPrompt: customPrompt || undefined,
        });
        results.push(response.data);
      } catch (error) {
        results.push({
          company_name: companies[i],
          website: '',
          contact_page: 'Not found',
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

      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              🔍 Company Social URL Finder
            </h1>
            <p className="text-gray-600">
              Find official social media profiles and contact pages for any company
            </p>
          </div>

          {/* API Key Configuration */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenRouter API Key (Optional)
                </label>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key for enhanced features"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 App works without API key. Add key for AI-enhanced search. Get one at{' '}
              <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                openrouter.ai
              </a>
            </p>
          </div>

          {/* Method Selection */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 max-w-2xl mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="extraction"
                    checked={method === 'extraction'}
                    onChange={(e) => setMethod(e.target.value as 'extraction' | 'ai')}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    <strong>Extraction</strong> - Fast web scraping (No API key needed)
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="ai"
                    checked={method === 'ai'}
                    onChange={(e) => setMethod(e.target.value as 'extraction' | 'ai')}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    <strong>AI</strong> - Enhanced search (Requires API key)
                  </span>
                </label>
              </div>
            </div>

            {/* Advanced Settings */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary hover:underline"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Settings
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom AI Prompt (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter custom instructions for AI search..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Customize how AI searches for social profiles. Leave empty for default behavior.
                </p>
              </div>
            )}
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
                  <div className={`p-4 rounded-lg mb-4 ${
                    result.status === 'Success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="font-medium">
                      Status: {result.status}
                    </p>
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
                      {result.contact_page !== 'Not found' ? (
                        <a 
                          href={result.contact_page} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Contact Page
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not found</p>
                      )}
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
