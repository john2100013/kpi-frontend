/**
 * SMS Configuration Component - Super Admin
 * Manage SMS provider settings (Onfone API) for password reset and notifications
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, LoadingSpinner } from '../../../components/common';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';
import { companyService, Company } from '../services/companyService';

interface SMSConfig {
  id: number;
  company_id: number;
  provider: string;
  client_id: string;
  sender_id: string;
  is_active: number;
  has_api_key: boolean;
}

const SMSConfiguration: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [smsConfigs, setSmsConfigs] = useState<Map<number, SMSConfig>>(new Map());
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [formData, setFormData] = useState({
    client_id: '',
    api_key: '',
    access_key: '',
    sender_id: ''
  });
  const [testPhone, setTestPhone] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId && viewMode === 'form') {
      fetchConfig();
    }
  }, [selectedCompanyId, viewMode]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const companiesList = await companyService.fetchCompanies();
      setCompanies(companiesList);
      
      // Fetch SMS configs for all companies
      await fetchAllConfigs(companiesList);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllConfigs = async (companiesList: Company[]) => {
    const configsMap = new Map<number, SMSConfig>();
    
    await Promise.all(
      companiesList.map(async (company) => {
        try {
          const response = await api.get('/settings/sms-config', {
            params: { companyId: company.id }
          });
          
          if (response.data.success && response.data.data) {
            configsMap.set(company.id, response.data.data);
          }
        } catch (error) {
          // Company doesn't have SMS config yet, that's ok
        }
      })
    );
    
    setSmsConfigs(configsMap);
  };

  const fetchConfig = async () => {
    if (!selectedCompanyId) {
      return;
    }

    try {
      const response = await api.get('/settings/sms-config', {
        params: { companyId: selectedCompanyId }
      });
      
      if (response.data.success && response.data.data) {
        const configData = response.data.data;
        setConfig(configData);
        setFormData({
          client_id: configData.client_id || '',
          api_key: '', // Never show the actual API key
          access_key: '', // Never show the actual access key
          sender_id: configData.sender_id || ''
        });
      } else {
        // No config exists, clear form
        setConfig(null);
        setFormData({
          client_id: '',
          api_key: '',
          access_key: '',
          sender_id: ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching SMS config:', error);
      // Don't show error for missing config
      setConfig(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }
    
    if (!formData.client_id || !formData.api_key || !formData.access_key) {
      toast.error('Client ID, API Key, and Access Key are required');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/settings/sms-config', formData, {
        params: { companyId: selectedCompanyId }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchConfig();
        await fetchAllConfigs(companies); // Refresh list
        setFormData({ ...formData, api_key: '', access_key: '' }); // Clear sensitive fields
      }
    } catch (error: any) {
      console.error('Error saving SMS config:', error);
      toast.error(error.response?.data?.error || 'Failed to save SMS configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!config || !selectedCompanyId) return;

    try {
      const newStatus = !config.is_active;
      const response = await api.put('/settings/sms-config/toggle', {
        is_active: newStatus
      }, {
        params: { companyId: selectedCompanyId }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchConfig();
        await fetchAllConfigs(companies); // Refresh list
      }
    } catch (error: any) {
      console.error('Error toggling SMS config:', error);
      toast.error('Failed to update status');
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number to test');
      return;
    }

    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    try {
      setTesting(true);
      const response = await api.post('/settings/sms-config/test', {
        phone_number: testPhone
      }, {
        params: { companyId: selectedCompanyId }
      });

      if (response.data.success) {
        toast.success('Test SMS sent successfully! Check your phone.');
      }
    } catch (error: any) {
      console.error('Error testing SMS:', error);
      toast.error(error.response?.data?.error || 'Failed to send test SMS');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete SMS configuration?')) {
      return;
    }

    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    try {
      const response = await api.delete('/settings/sms-config', {
        params: { companyId: selectedCompanyId }
      });

      if (response.data.success) {
        toast.success('SMS configuration deleted successfully');
        setConfig(null);
        setFormData({
          client_id: '',
          api_key: '',
          access_key: '',
          sender_id: ''
        });
        await fetchAllConfigs(companies); // Refresh list
        setViewMode('list');
        setSelectedCompanyId(null);
      }
    } catch (error: any) {
      console.error('Error deleting SMS config:', error);
      toast.error('Failed to delete SMS configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMS Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure Onfone SMS provider for password reset and notifications
          </p>
        </div>
        <div className="flex gap-3">
          {viewMode === 'form' && (
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                setSelectedCompanyId(null);
                setConfig(null);
              }}
            >
              Back to List
            </Button>
          )}
          {config && viewMode === 'form' && (
            <Button
              variant={config.is_active ? 'outline' : 'primary'}
              onClick={handleToggleStatus}
            >
              {config.is_active ? 'Disable SMS' : 'Enable SMS'}
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        /* List View */
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">SMS Configurations by Company</h3>
              <p className="text-sm text-gray-600">
                {smsConfigs.size} of {companies.length} companies configured
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company) => {
                    const companyConfig = smsConfigs.get(company.id);
                    const hasConfig = !!companyConfig;
                    
                    return (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.domain}</div>
                        </td>
                        <td className="px-6 py-4">
                          {hasConfig ? (
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                companyConfig.is_active ? 'bg-green-500' : 'bg-yellow-500'
                              }`} />
                              <span className={`text-xs font-medium ${
                                companyConfig.is_active ? 'text-green-700' : 'text-yellow-700'
                              }`}>
                                {companyConfig.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                              <span className="text-xs font-medium text-gray-500">Not Configured</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {hasConfig ? companyConfig.provider : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {hasConfig ? companyConfig.client_id : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {hasConfig ? (companyConfig.sender_id || '-') : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant={hasConfig ? 'outline' : 'primary'}
                            onClick={() => {
                              setSelectedCompanyId(company.id);
                              setViewMode('form');
                            }}
                          >
                            {hasConfig ? 'Edit' : 'Configure'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {companies.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No companies found. Please add companies first.
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Form View */
        <>

      {/* Company Selector */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Company</h3>
          <div className="max-w-md">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {companies.find(c => c.id === selectedCompanyId)?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {companies.find(c => c.id === selectedCompanyId)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {companies.find(c => c.id === selectedCompanyId)?.domain}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Banner */}
      {config && (
        <div className={`rounded-lg border-2 p-4 ${
          config.is_active 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              config.is_active ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <div>
              <p className="font-medium text-gray-900">
                SMS Service {config.is_active ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-gray-600">
                {config.is_active 
                  ? 'SMS notifications are enabled for password reset and alerts'
                  : 'SMS notifications are currently disabled'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Provider Settings</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Onfone SMS Provider</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Get your credentials from <a href="https://onfonmedia.co.ke" target="_blank" rel="noopener noreferrer" className="underline">onfonmedia.co.ke</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Client ID */}
            <div>
              <Input
                name="client_id"
                label="Client ID"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                placeholder="e.g., saiofficetrans"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Onfone client identifier
              </p>
            </div>

            {/* API Key */}
            <div>
              <div className="relative">
                <Input
                  name="api_key"
                  label="API Key"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder={config?.has_api_key ? '••••••••••••••••' : 'Enter API key'}
                  required={!config}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {config?.has_api_key 
                  ? 'Leave blank to keep existing API key' 
                  : 'Your Onfone API key (keep this secure)'
                }
              </p>
            </div>

            {/* Access Key */}
            <div>
              <div className="relative">
                <Input
                  name="access_key"
                  label="Access Key"
                  type={showAccessKey ? 'text' : 'password'}
                  value={formData.access_key}
                  onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
                  placeholder={config?.has_api_key ? '••••••••••••••••' : 'Enter access key'}
                  required={!config}
                />
                <button
                  type="button"
                  onClick={() => setShowAccessKey(!showAccessKey)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showAccessKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {config?.has_api_key 
                  ? 'Leave blank to keep existing access key' 
                  : 'Your Onfone access key for authentication header'
                }
              </p>
            </div>

            {/* Sender ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender ID (Optional)
              </label>
              <input
                type="text"
                name="sender_id"
                value={formData.sender_id}
                onChange={(e) => setFormData({ ...formData, sender_id: e.target.value })}
                placeholder="e.g., KPI System"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                The name displayed as SMS sender (max 11 characters)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                disabled={saving}
              >
                {config ? 'Update Configuration' : 'Save Configuration'}
              </Button>
              
              {config && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                >
                  Delete Configuration
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card>

      {/* Test SMS */}
      {config && config.is_active && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test SMS Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <Input
                  name="test_phone"
                  label="Test Phone Number"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+254712345678 or 0712345678"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a phone number to receive a test SMS
                </p>
              </div>

              <Button
                onClick={handleTestSMS}
                variant="outline"
                loading={testing}
                disabled={testing || !testPhone}
              >
                {testing ? 'Sending...' : 'Send Test SMS'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Integration Guide */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Integration Guide</h3>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📋 Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Sign up for an Onfone account at <a href="https://onfonmedia.co.ke" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">onfonmedia.co.ke</a></li>
                <li>Get your Client ID, API Key, and Access Key from the dashboard</li>
                <li>Enter your credentials in the form above:
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                    <li><strong>Client ID:</strong> e.g., saiofficetrans</li>
                    <li><strong>API Key:</strong> ryjT6wHLUJ2sov8PfaDlAWZ3qbXcQkNRVMYxh5Iz9014Cne7</li>
                    <li><strong>Access Key:</strong> 2tXpWAGZ8bgwzDTwsSx6rOIkhfnRl37B</li>
                    <li><strong>Sender ID:</strong> SAI_OFFICE (max 11 chars)</li>
                  </ul>
                </li>
                <li>Test the configuration with your phone number</li>
                <li>Enable SMS to activate password reset notifications</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">🔧 API Configuration:</h4>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs">
                <p className="text-gray-700">API Endpoint:</p>
                <p className="text-blue-600 break-all">https://api.onfonmedia.com/v1/sms/SendBulkSMS</p>
                <p className="text-gray-700 mt-2">Phone Format:</p>
                <p className="text-gray-600">0712345678 → +254712345678</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">🔐 Security Notes:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>API keys are securely encrypted in the database</li>
                <li>Only Super Admins can view and modify SMS settings</li>
                <li>SMS is used for OTP verification in password reset flow</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">📱 Usage:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Users receive OTP via both email and SMS when resetting password</li>
                <li>Phone numbers must be added to user profiles for SMS delivery</li>
                <li>OTP codes expire after 10 minutes for security</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
      </>
      )}
    </div>
  );
};

export default SMSConfiguration;
