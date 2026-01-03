import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSave, FiTrash2, FiPlus, FiSettings } from 'react-icons/fi';

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
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'periods' | 'reminders' | 'daily' | 'email-notifications'>('periods');
  const [periodSettings, setPeriodSettings] = useState<PeriodSetting[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSetting[]>([]);
  const [dailyReminderSetting, setDailyReminderSetting] = useState<DailyReminderSetting>({
    send_daily_reminders: false,
    days_before_meeting: 3,
  });
  const [hrEmailNotifications, setHrEmailNotifications] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [periodsRes, remindersRes, dailyRes, emailNotifRes] = await Promise.all([
        api.get('/settings/period-settings'),
        api.get('/settings/reminder-settings'),
        api.get('/settings/daily-reminder-settings'),
        api.get('/settings/hr-email-notifications').catch(() => ({ data: { setting: { receive_email_notifications: true } } })),
      ]);

      setPeriodSettings(periodsRes.data.settings || []);
      setReminderSettings(remindersRes.data.settings || []);
      setDailyReminderSetting(dailyRes.data.setting || { send_daily_reminders: false, days_before_meeting: 3 });
      setHrEmailNotifications(emailNotifRes.data.setting?.receive_email_notifications !== false);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeriodSetting = async (setting: PeriodSetting, index: number) => {
    setSaving(true);
    try {
      const response = await api.post('/settings/period-settings', setting);
      const updated = [...periodSettings];
      updated[index] = response.data.setting;
      setPeriodSettings(updated);
    } catch (error) {
      console.error('Error saving period setting:', error);
      alert('Error saving period setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePeriodSetting = async (id: number) => {
    if (!confirm('Are you sure you want to delete this period setting?')) return;
    
    try {
      await api.delete(`/settings/period-settings/${id}`);
      setPeriodSettings(periodSettings.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting period setting:', error);
      alert('Error deleting period setting');
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
      alert('Error saving reminder setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminderSetting = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reminder setting?')) return;
    
    try {
      await api.delete(`/settings/reminder-settings/${id}`);
      setReminderSettings(reminderSettings.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting reminder setting:', error);
      alert('Error deleting reminder setting');
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
      await api.post('/settings/daily-reminder-settings', dailyReminderSetting);
      alert('Daily reminder settings saved successfully!');
    } catch (error) {
      console.error('Error saving daily reminder settings:', error);
      alert('Error saving daily reminder settings');
    } finally {
      setSaving(false);
    }
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
        </nav>
      </div>

      {/* Period Settings Tab */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">KPI Period Settings</h2>
            <button
              onClick={handleAddPeriodSetting}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FiPlus />
              <span>Add Period</span>
            </button>
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
                        <button
                          onClick={() => handleSavePeriodSetting(setting, index)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700"
                        >
                          <FiSave />
                        </button>
                        {setting.id && (
                          <button
                            onClick={() => handleDeletePeriodSetting(setting.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
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
            <button
              onClick={handleAddReminderSetting}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <FiPlus />
              <span>Add Reminder</span>
            </button>
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
                        <button
                          onClick={() => handleSaveReminderSetting(setting, index)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700"
                        >
                          <FiSave />
                        </button>
                        {setting.id && (
                          <button
                            onClick={() => handleDeleteReminderSetting(setting.id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start sending daily reminders X days before meeting
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
                </div>
              )}

              <button
                onClick={handleSaveDailyReminder}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <FiSave />
                <span>Save Settings</span>
              </button>
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
                <button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await api.post('/settings/hr-email-notifications', {
                        receive_email_notifications: hrEmailNotifications,
                      });
                      alert('Email notification settings saved successfully!');
                    } catch (error: any) {
                      console.error('Error saving email notification settings:', error);
                      alert(error.response?.data?.error || 'Error saving settings');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <FiSave />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

