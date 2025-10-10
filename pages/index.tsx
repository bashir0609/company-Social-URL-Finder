import { useState } from 'react';
import Head from 'next/head';
import { Search, Upload, Download, Linkedin, Facebook, Twitter, Instagram, Youtube, Globe, Mail, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [bulkResults, setBulkResults] = useState<EnrichResult[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState(0);

  const handleSingleSearch = async () => {
    if (!companyInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post<EnrichResult>('/api/enrich', {
        company: companyInput,
        method: 'extraction',
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
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
          method: 'extraction',
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
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSingleSearch()}
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
                      ].map(({ key, icon: Icon, label, color }) => (
                        <div key={key} className="flex items-center gap-2 p-3 bg-white border rounded-lg">
                          <Icon className={`w-5 h-5 ${color}`} />
                          <span className="font-medium">{label}:</span>
                          {result[key as keyof EnrichResult] !== 'Not found' ? (
                            <a
                              href={result[key as keyof EnrichResult] as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm truncate flex-1"
                            >
                              View Profile
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">Not found</span>
                          )}
                        </div>
                      ))}
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
                    <button
                      onClick={downloadResults}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Excel
                    </button>
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
