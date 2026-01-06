import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SignatureCanvas from 'react-signature-canvas';
import { FiArrowLeft, FiSave, FiUpload, FiX, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiEdit } from 'react-icons/fi';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [savedSignature, setSavedSignature] = useState<string>('');
  const [useSavedSignature, setUseSavedSignature] = useState(false);
  const canvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user?.signature) {
      setSavedSignature(user.signature);
      if (!signature) {
        setSignature(user.signature);
        if (canvasRef.current) {
          canvasRef.current.fromDataURL(user.signature);
        }
      }
    }
  }, [user?.signature]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      if (userData.signature) {
        setSavedSignature(userData.signature);
        setSignature(userData.signature);
        if (canvasRef.current) {
          canvasRef.current.fromDataURL(userData.signature);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureEnd = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL();
      setSignature(dataURL);
      setUseSavedSignature(false);
    }
  };

  const handleClearSignature = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      setSignature('');
    }
  };

  const handleUploadSignature = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSignature(result);
      setUseSavedSignature(false);
      if (canvasRef.current) {
        canvasRef.current.fromDataURL(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseSavedSignature = () => {
    if (savedSignature) {
      setSignature(savedSignature);
      setUseSavedSignature(true);
      if (canvasRef.current) {
        canvasRef.current.fromDataURL(savedSignature);
      }
    }
  };

  const handleSave = async () => {
    const signatureToSave = useSavedSignature ? savedSignature : signature;
    
    if (!signatureToSave) {
      alert('Please provide a signature');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', {
        signature: signatureToSave,
      });

      setSavedSignature(signatureToSave);
      const updatedUser = response.data.user;
      setUser(updatedUser);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccessMessage('Signature saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Reset messages
    setPasswordError('');
    setPasswordSuccess('');

    // Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password must be different from old password');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Check if user can change password (HR, Manager, Super Admin only)
  const canChangePassword = user?.role === 'hr' || user?.role === 'manager' || user?.role === 'super_admin';

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your profile and signature</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <FiCheckCircle className="text-green-600 text-xl" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* User Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">User Information</h2>
          {(user?.role === 'hr' || user?.role === 'manager') && (
            <button
              onClick={() => navigate('/profile/edit')}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FiEdit className="text-lg" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Name</p>
            <p className="font-semibold text-gray-900">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="font-semibold text-gray-900">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="font-semibold text-gray-900 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Payroll Number</p>
            <p className="font-semibold text-gray-900">{user?.payroll_number}</p>
          </div>
          {user?.department && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Department</p>
              <p className="font-semibold text-gray-900">{user.department}</p>
            </div>
          )}
          {user?.position && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Position</p>
              <p className="font-semibold text-gray-900">{user.position}</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h2>
        <p className="text-sm text-gray-600 mb-6">
          Upload or draw your signature. This signature will be used for KPI acknowledgements and reviews.
        </p>

        {/* Saved Signature Preview */}
        {savedSignature && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Saved Signature</h3>
              <button
                onClick={handleUseSavedSignature}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Use This Signature
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <img 
                src={savedSignature} 
                alt="Saved signature" 
                className="max-h-32 mx-auto"
              />
            </div>
          </div>
        )}

        {/* Signature Canvas */}
        <div className="space-y-4">
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <SignatureCanvas
              ref={canvasRef}
              canvasProps={{
                width: 600,
                height: 200,
                className: 'w-full h-48 rounded-lg',
              }}
              onEnd={handleSignatureEnd}
              backgroundColor="transparent"
            />
            {signature && !useSavedSignature && (
              <button
                type="button"
                onClick={handleClearSignature}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex items-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadSignature}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiUpload className="text-lg" />
              <span>Upload Signature Image</span>
            </button>
            {savedSignature && (
              <button
                onClick={handleUseSavedSignature}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FiCheckCircle className="text-lg" />
                <span>Use Saved Signature</span>
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            You can draw your signature above or upload an image file (PNG, JPG, max 2MB)
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !signature}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="text-lg" />
            <span>{saving ? 'Saving...' : 'Save Signature'}</span>
          </button>
        </div>
      </div>

      {/* Password Change Section (HR, Manager, Super Admin only) */}
      {canChangePassword && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiLock className="text-purple-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Update your account password. Make sure to use a strong password.
          </p>

          {passwordError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <FiX className="text-red-600 text-xl" />
              <p className="text-red-800">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <FiCheckCircle className="text-green-600 text-xl" />
              <p className="text-green-800">{passwordSuccess}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Old Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Old Password *
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showOldPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-600 mt-1">Passwords match</p>
              )}
            </div>
          </div>

          {/* Change Password Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiLock className="text-lg" />
              <span>{changingPassword ? 'Changing Password...' : 'Change Password'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

