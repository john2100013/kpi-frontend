import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../hooks/useConfirm';
import { FiSave, FiTrash2, FiPlus } from 'react-icons/fi';
import { Button } from '../../../components/common';

interface PeriodSetting {
  id?: number;
  period_type: 'quarterly' | 'yearly';
  quarter?: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ReminderSetting {
  id?: number;
  reminder_type: 'kpi_setting' | 'kpi_review';
  period_type?: 'quarterly' | 'yearly';
  reminder_number: number;
  reminder_days_before: number;
  reminder_label?: string;
  is_active: boolean;
}

interface DailyReminderSetting {
  send_daily_reminders: boolean;
  days_before_meeting: number;
  cc_emails?: string;
}

interface RatingOption {
  id?: number;
  rating_value: number | null;
  label: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  rating_type: 'yearly' | 'quarterly' | 'qualitative';
}

const Settings: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'periods' | 'reminders' | 'daily' | 'email-notifications' | 'rating-options'>('periods');
  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSetting[]>([]);
  const [dailyReminderSetting, setDailyReminderSetting] = useState<DailyReminderSetting>({
    send_daily_reminders: false,
    days_before_meeting: 3,
    cc_emails: '',
  });
  const [hrEmailNotifications, setHrEmailNotifications] = useState<boolean>(true);
  const [ratingOptions, setRatingOptions] = useState<RatingOption[]>([]);
  const [ratingTypeFilter, setRatingTypeFilter] = useState<'yearly' | 'quarterly' | 'qualitative'>('quarterly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [periodsRes, remindersRes, dailyRes, emailNotifRes, ratingOptionsRes] = await Promise.all([
        api.get('/settings/period-settings'),
        api.get('/settings/reminder-settings'),
        api.get('/settings/daily-reminders'),
        api.get('/settings/hr-email-notifications'),
        api.get('/rating-options/manage'),
      ]);

      console.log('📦 [Settings] API Responses:', {
        periods: periodsRes.data,
        reminders: remindersRes.data,
        daily: dailyRes.data,
        emailNotif: emailNotifRes.data,
        ratingOptions: ratingOptionsRes.data
      });

      // Backend now returns dates in YYYY-MM-DD format using PostgreSQL to_char
      // So we can use them directly without any timezone conversion
      const formattedSettings = (periodsRes.data.settings || []).map((setting: PeriodSetting) => {
        console.log('📅 [FRONTEND] Received setting from backend:', {
          id: setting.id,
          original_start: setting.start_date,
          original_end: setting.end_date,
          start_date_type: typeof setting.start_date,
          end_date_type: typeof setting.end_date
        });
        
        // Backend returns dates as plain YYYY-MM-DD strings via PostgreSQL to_char
        // Just ensure they're strings (should already be)
        const startDate = setting.start_date ? String(setting.start_date).split('T')[0] : '';
        const endDate = setting.end_date ? String(setting.end_date).split('T')[0] : '';
        
        console.log('📅 [FRONTEND] Using dates directly:', {
          formatted_start: startDate,
          formatted_end: endDate
        });
        
        return {
          ...setting,
          start_date: startDate,
          end_date: endDate,
        };
      });
      
      console.log('📋 [FRONTEND] Final formatted settings:', formattedSettings);
      setPeriodSettings(formattedSettings);
      setReminderSettings(remindersRes.data.settings || []);
      
      // FIX: Backend returns 'settings' (plural) not 'setting' (singular)
      setDailyReminderSetting(dailyRes.data.settings || { send_daily_reminders: false, days_before_meeting: 3, cc_emails: '' });
      
      // FIX: Backend returns 'settings' with 'receive_notifications' not 'receive_email_notifications'
      setHrEmailNotifications(emailNotifRes.data.settings?.receive_notifications !== false);
      
      setRatingOptions(ratingOptionsRes.data.rating_options || []);
    } catch (error) {
      console.error('❌ [Settings] Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeriodSetting = async (setting: PeriodSetting, index: number) => {
    console.log('📝 [FRONTEND] Saving period setting:', {
      index,
      setting,
      start_date: setting.start_date,
      end_date: setting.end_date,
      start_date_type: typeof setting.start_date,
      end_date_type: typeof setting.end_date
    });

    // Validate required fields
    if (!setting.start_date || !setting.end_date) {
      console.error('❌ [FRONTEND] Missing date fields:', { start_date: setting.start_date, end_date: setting.end_date });
      toast.warning('Please enter both start date and end date');
      return;
    }

    // Ensure dates are in YYYY-MM-DD format (date inputs return this format, but double-check)
    const formattedSetting = {
      ...setting,
      start_date: setting.start_date.includes('T') ? setting.start_date.split('T')[0] : setting.start_date,
      end_date: setting.end_date.includes('T') ? setting.end_date.split('T')[0] : setting.end_date,
    };

    console.log('📤 [FRONTEND] Sending to backend:', formattedSetting);

    setSaving(true);
    try {
      const response = await api.post('/settings/period-settings', formattedSetting);
      console.log('✅ [FRONTEND] Response received:', response.data);
      
      const savedSetting = response.data.setting;
      console.log('📥 [FRONTEND] Saved setting from backend:', savedSetting);
      
      // Ensure dates are in YYYY-MM-DD format for date inputs
      const formattedDates = {
        start_date: savedSetting.start_date ? (savedSetting.start_date.split('T')[0] || savedSetting.start_date) : '',
        end_date: savedSetting.end_date ? (savedSetting.end_date.split('T')[0] || savedSetting.end_date) : '',
      };
      
      console.log('📅 [FRONTEND] Formatted dates:', formattedDates);
      
      const updated = [...periodSettings];
      updated[index] = {
        ...savedSetting,
        ...formattedDates,
      };
      
      console.log('💾 [FRONTEND] Updated period settings array:', updated);
      setPeriodSettings(updated);
      toast.success('Period setting saved successfully!');
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error saving period setting:', error);
      console.error('❌ [FRONTEND] Error response:', error.response?.data);
      console.error('❌ [FRONTEND] Error status:', error.response?.status);
      toast.error(error.response?.data?.error || error.response?.data?.details || 'Error saving period setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePeriodSetting = async (id: number) => {
    const confirmed = await confirm.confirm({
      title: 'Delete Period Setting',
      message: 'Are you sure you want to delete this period setting?',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/settings/period-settings/${id}`);
      // Fix: Filter by id to ensure only the specific item is removed
      setPeriodSettings(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting period setting:', error);
      toast.error('Error deleting period setting');
    }
  };

  const handleAddPeriodSetting = () => {
    setPeriodSettings([
      ...periodSettings,
      {
        period_type: 'quarterly',
        year: new Date().getFullYear(),
        start_date: '',
        end_date: '',
        is_active: true,
      },
    ]);
  };

  const handleSaveReminderSetting = async (setting: ReminderSetting, index: number) => {
    setSaving(true);
    try {
      const response = await api.post('/settings/reminder-settings', setting);
      const updated = [...reminderSettings];
      if (response.data.setting.id) {
        updated[index] = response.data.setting;
      } else {
        updated.push(response.data.setting);
      }
      setReminderSettings(updated);
    } catch (error) {
      console.error('Error saving reminder setting:', error);
      toast.error('Error saving reminder setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminderSetting = async (id: number) => {
    const confirmed = await confirm.confirm({
      title: 'Delete Reminder Setting',
      message: 'Are you sure you want to delete this reminder setting?',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/settings/reminder-settings/${id}`);
      setReminderSettings(reminderSettings.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting reminder setting:', error);
      toast.error('Error deleting reminder setting');
    }
  };

  const handleAddReminderSetting = () => {
    setReminderSettings([
      ...reminderSettings,
      {
        reminder_type: 'kpi_setting',
        reminder_number: reminderSettings.length + 1,
        reminder_days_before: 14,
        is_active: true,
      },
    ]);
  };

  const handleSaveDailyReminder = async () => {
    setSaving(true);
    try {
      await api.post('/settings/daily-reminders', dailyReminderSetting);
      toast.success('Daily reminder settings saved successfully!');
    } catch (error) {
      console.error('Error saving daily reminder settings:', error);
      toast.error('Error saving daily reminder settings');
    } finally {
      setSaving(false);
    }
  };

  // Rating Options handlers
  const handleSaveRatingOption = async (option: RatingOption, index: number) => {
    // All rating types now require rating_value for proper sorting and identification
    const ratingValue = option.rating_value;
    const isValidRating = ratingValue !== null && ratingValue !== undefined && !isNaN(ratingValue);
    
    if (!isValidRating || !option.label || option.label.trim() === '') {
      toast.warning('Rating value and label are required');
      return;
    }

    setSaving(true);
    try {
      // Ensure rating_value is a number (not string)
      const optionToSave = {
        ...option,
        rating_value: typeof ratingValue === 'string' ? parseFloat(ratingValue) : (ratingValue as number),
      };
      
      console.log('🔍 [Settings] Saving rating option:', optionToSave);
      let response;
      if (option.id) {
        // Update existing
        console.log('🔍 [Settings] Updating existing rating option:', option.id);
        response = await api.put(`/rating-options/${option.id}`, optionToSave);
      } else {
        // Create new
        console.log('🔍 [Settings] Creating new rating option');
        response = await api.post('/rating-options', optionToSave);
      }

      console.log('✅ [Settings] Rating option saved:', response.data);
      const updated = [...ratingOptions];
      updated[index] = response.data.rating_option;
      setRatingOptions(updated);
      toast.success('Rating option saved successfully!');
    } catch (error: any) {
      console.error('❌ [Settings] Error saving rating option:', error);
      console.error('❌ [Settings] Error response:', error.response);
      console.error('❌ [Settings] Error data:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Error saving rating option';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRatingOption = async (id: number) => {
    const confirmed = await confirm.confirm({
      title: 'Delete Rating Option',
      message: 'Are you sure you want to delete this rating option?',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/rating-options/${id}`);
      setRatingOptions(prev => prev.filter(opt => opt.id !== id));
      toast.success('Rating option deleted successfully!');
    } catch (error) {
      console.error('Error deleting rating option:', error);
      toast.error('Error deleting rating option');
    }
  };

  const handleAddRatingOption = () => {
    const maxDisplayOrder = ratingOptions.length > 0 
      ? Math.max(...ratingOptions.map(opt => opt.display_order || 0))
      : 0;
    
    setRatingOptions([
      ...ratingOptions,
      {
        rating_value: null,
        label: '',
        description: '',
        is_active: true,
        display_order: maxDisplayOrder + 1,
        rating_type: ratingTypeFilter, // Use current filter as default
      },
    ]);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">HR Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('periods')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'periods'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KPI Period Settings
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reminders'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reminder Settings
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'daily'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Daily Reminders
          </button>
          <button
            onClick={() => setActiveTab('email-notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'email-notifications'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Email Notifications
          </button>
          <button
            onClick={() => setActiveTab('rating-options')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rating-options'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rating Options
          </button>
        </nav>
      </div>

      {/* Period Settings Tab */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">KPI Period Settings</h2>
            <Button
              onClick={handleAddPeriodSetting}
              variant="primary"
              icon={FiPlus}
            >
              Add Period
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quarter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periodSettings.map((setting, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <select
                        value={setting.period_type}
                        onChange={(e) => {
                          const updated = [...periodSettings];
                          updated[index].period_type = e.target.value as 'quarterly' | 'yearly';
                          if (updated[index].period_type === 'yearly') {
                            updated[index].quarter = undefined;
                          }
                          setPeriodSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {setting.period_type === 'quarterly' ? (
                        <select
                          value={setting.quarter || ''}
                          onChange={(e) => {
                            const updated = [...periodSettings];
                            updated[index].quarter = e.target.value;
                            setPeriodSettings(updated);
                          }}
                          className="border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Select</option>
                          <option value="Q1">Q1</option>
                          <option value="Q2">Q2</option>
                          <option value="Q3">Q3</option>
                          <option value="Q4">Q4</option>
                        </select>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={setting.year}
                        onChange={(e) => {
                          const updated = [...periodSettings];
                          updated[index].year = parseInt(e.target.value);
                          setPeriodSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="date"
                        value={setting.start_date}
                        onChange={(e) => {
                          const updated = [...periodSettings];
                          updated[index].start_date = e.target.value;
                          setPeriodSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="date"
                        value={setting.end_date}
                        onChange={(e) => {
                          const updated = [...periodSettings];
                          updated[index].end_date = e.target.value;
                          setPeriodSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={setting.is_active}
                        onChange={(e) => {
                          const updated = [...periodSettings];
                          updated[index].is_active = e.target.checked;
                          setPeriodSettings(updated);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleSavePeriodSetting(setting, index)}
                          disabled={saving}
                          variant="ghost"
                          size="sm"
                          icon={FiSave}
                          className="text-green-600 hover:text-green-700 p-0"
                        />
                        {setting.id && (
                          <Button
                            onClick={() => handleDeletePeriodSetting(setting.id!)}
                            variant="ghost"
                            size="sm"
                            icon={FiTrash2}
                            className="text-red-600 hover:text-red-700 p-0"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reminder Settings Tab */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Reminder Settings</h2>
            <Button
              onClick={handleAddReminderSetting}
              variant="primary"
              icon={FiPlus}
            >
              Add Reminder
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Before</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reminderSettings.map((setting, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <select
                        value={setting.reminder_type}
                        onChange={(e) => {
                          const updated = [...reminderSettings];
                          updated[index].reminder_type = e.target.value as 'kpi_setting' | 'kpi_review';
                          setReminderSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="kpi_setting">KPI Setting</option>
                        <option value="kpi_review">KPI Review</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={setting.period_type || ''}
                        onChange={(e) => {
                          const updated = [...reminderSettings];
                          updated[index].period_type = e.target.value as 'quarterly' | 'yearly' | undefined;
                          setReminderSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Any</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={setting.reminder_number}
                        onChange={(e) => {
                          const updated = [...reminderSettings];
                          updated[index].reminder_number = parseInt(e.target.value);
                          setReminderSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-16"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={setting.reminder_days_before}
                        onChange={(e) => {
                          const updated = [...reminderSettings];
                          updated[index].reminder_days_before = parseInt(e.target.value);
                          setReminderSettings(updated);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={setting.reminder_label || ''}
                        onChange={(e) => {
                          const updated = [...reminderSettings];
                          updated[index].reminder_label = e.target.value;
                          setReminderSettings(updated);
                        }}
                        placeholder="e.g., 2 weeks"
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={setting.is_active}
                        onChange={(e) => {
                          const updated = [...reminderSettings];
                          updated[index].is_active = e.target.checked;
                          setReminderSettings(updated);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleSaveReminderSetting(setting, index)}
                          disabled={saving}
                          variant="ghost"
                          size="sm"
                          icon={FiSave}
                          className="text-green-600 hover:text-green-700 p-0"
                        />
                        {setting.id && (
                          <Button
                            onClick={() => handleDeleteReminderSetting(setting.id!)}
                            variant="ghost"
                            size="sm"
                            icon={FiTrash2}
                            className="text-red-600 hover:text-red-700 p-0"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Reminder Settings Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">KPI Setting Meeting Daily Reminders</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="send_daily"
                  checked={dailyReminderSetting.send_daily_reminders}
                  onChange={(e) => {
                    setDailyReminderSetting({
                      ...dailyReminderSetting,
                      send_daily_reminders: e.target.checked,
                    });
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="send_daily" className="text-sm font-medium text-gray-700">
                  Send daily reminders when KPI setting meeting is due
                </label>
              </div>

              {dailyReminderSetting.send_daily_reminders && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start sending daily reminders X days after meeting is due
                    </label>
                    <input
                      type="number"
                      value={dailyReminderSetting.days_before_meeting}
                      onChange={(e) => {
                        setDailyReminderSetting({
                          ...dailyReminderSetting,
                          days_before_meeting: parseInt(e.target.value) || 3,
                        });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 w-32"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Note: Daily reminders are sent AFTER the meeting date has passed. This number indicates how many days after the due date to start sending reminders.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CC Email Addresses (Optional)
                    </label>
                    <input
                      type="text"
                      value={dailyReminderSetting.cc_emails || ''}
                      onChange={(e) => {
                        setDailyReminderSetting({
                          ...dailyReminderSetting,
                          cc_emails: e.target.value,
                        });
                      }}
                      placeholder="e.g., hr.assistant@company.com, admin@company.com"
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter comma-separated email addresses to CC on daily reminder emails (e.g., HR assistants)
                    </p>
                  </div>
                </>
              )}

              <Button
                onClick={handleSaveDailyReminder}
                disabled={saving}
                variant="primary"
                icon={FiSave}
                loading={saving}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Notifications Tab */}
      {activeTab === 'email-notifications' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Email Notification Settings</h2>
          
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Receive Email Notifications</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    When enabled, HR will receive email notifications for:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>New KPIs assigned to employees</li>
                      <li>KPIs acknowledged by employees</li>
                      <li>Self-ratings submitted by employees</li>
                      <li>KPI review completions</li>
                    </ul>
                  </p>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hr_email_notifications"
                      checked={hrEmailNotifications}
                      onChange={(e) => setHrEmailNotifications(e.target.checked)}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="hr_email_notifications" className="ml-3 text-sm font-medium text-gray-700">
                      Enable email notifications for HR
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await api.post('/settings/hr-email-notifications', {
                        receive_email_notifications: hrEmailNotifications,
                      });
                      toast.success('Email notification settings saved successfully!');
                    } catch (error: any) {
                      console.error('Error saving email notification settings:', error);
                      toast.error(error.response?.data?.error || 'Error saving settings');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  variant="primary"
                  icon={FiSave}
                  loading={saving}
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Options Tab */}
      {activeTab === 'rating-options' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rating Options</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage rating scale options for employee and manager reviews. These options will be available in KPI self-rating and review forms.
              </p>
            </div>
            <Button
              onClick={handleAddRatingOption}
              variant="primary"
              icon={FiPlus}
            >
              Add Rating Option
            </Button>
          </div>

          {/* Rating Type Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Rating Type
            </label>
            <div className="flex space-x-4">
              <Button
                variant={ratingTypeFilter === 'quarterly' ? 'primary' : 'secondary'}
                onClick={() => setRatingTypeFilter('quarterly')}
              >
                Quarterly Ratings
              </Button>
              <Button
                variant={ratingTypeFilter === 'yearly' ? 'primary' : 'secondary'}
                onClick={() => setRatingTypeFilter('yearly')}
              >
                Yearly Ratings
              </Button>
              <Button
                variant={ratingTypeFilter === 'qualitative' ? 'primary' : 'secondary'}
                onClick={() => setRatingTypeFilter('qualitative')}
              >
                Qualitative Ratings
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratingOptions.filter(opt => opt.rating_type === ratingTypeFilter).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No {ratingTypeFilter} rating options found. Click "Add Rating Option" to create one.
                    </td>
                  </tr>
                ) : (
                  ratingOptions.filter(opt => opt.rating_type === ratingTypeFilter).map((option, index) => (
                    <tr key={option.id || `new-${index}`}>
                      <td className="px-6 py-4">
                        <select
                          value={option.rating_type}
                          onChange={(e) => {
                            const updated = [...ratingOptions];
                            const actualIndex = ratingOptions.findIndex(o => o === option);
                            updated[actualIndex].rating_type = e.target.value as 'yearly' | 'quarterly' | 'qualitative';
                            setRatingOptions(updated);
                          }}
                          className="border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                          <option value="qualitative">Qualitative</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={option.rating_value !== undefined && option.rating_value !== null ? option.rating_value : ''}
                          onChange={(e) => {
                            const updated = [...ratingOptions];
                            const actualIndex = ratingOptions.findIndex(o => o === option);
                            const inputVal = e.target.value;
                            if (inputVal === '') {
                              updated[actualIndex].rating_value = null;
                            } else {
                              const parsed = parseFloat(inputVal);
                              updated[actualIndex].rating_value = !isNaN(parsed) ? parsed : null;
                            }
                            setRatingOptions(updated);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 w-24"
                          placeholder="1.00"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={option.label || ''}
                          onChange={(e) => {
                            const updated = [...ratingOptions];
                            const actualIndex = ratingOptions.findIndex(o => o === option);
                            updated[actualIndex].label = e.target.value;
                            setRatingOptions(updated);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          placeholder="e.g., Below Expectation"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={option.description || ''}
                          onChange={(e) => {
                            const updated = [...ratingOptions];
                            const actualIndex = ratingOptions.findIndex(o => o === option);
                            updated[actualIndex].description = e.target.value;
                            setRatingOptions(updated);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 w-full"
                          placeholder="Optional description"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={option.display_order || ''}
                          onChange={(e) => {
                            const updated = [...ratingOptions];
                            const actualIndex = ratingOptions.findIndex(o => o === option);
                            updated[actualIndex].display_order = parseInt(e.target.value) || 1;
                            setRatingOptions(updated);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 w-20"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={option.is_active !== false}
                          onChange={(e) => {
                            const updated = [...ratingOptions];
                            const actualIndex = ratingOptions.findIndex(o => o === option);
                            updated[actualIndex].is_active = e.target.checked;
                            setRatingOptions(updated);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => {
                              const actualIndex = ratingOptions.findIndex(o => o === option);
                              handleSaveRatingOption(option, actualIndex);
                            }}
                            disabled={saving}
                            variant="ghost"
                            size="sm"
                            icon={FiSave}
                            className="text-green-600 hover:text-green-700 p-0"
                            title="Save"
                          />
                          {option.id && (
                            <Button
                              onClick={() => handleDeleteRatingOption(option.id!)}
                              variant="ghost"
                              size="sm"
                              icon={FiTrash2}
                              className="text-red-600 hover:text-red-700 p-0"
                              title="Delete"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {ratingOptions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only active rating options will be available in KPI self-rating and review forms. 
                The display order determines the order in which options appear in dropdowns.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;

