import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SignatureCanvas from 'react-signature-canvas';
import { FiArrowLeft, FiSave, FiUpload, FiX, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiEdit } from 'react-icons/fi';
import { Button } from '../../components/common';
import { isHR, isManager, isEmployee, getRoleDisplayName } from '../../utils/roleUtils';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [savedSignature, setSavedSignature] = useState<string>('');
  const [useSavedSignature, setUseSavedSignature] = useState(false);
  const canvasRef = useRef<any>(null);
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
    // User data already loaded from auth context, just initialize signature
    if (user?.signature) {
      setSavedSignature(user.signature);
      setSignature(user.signature);
      if (canvasRef.current) {
        canvasRef.current.fromDataURL(user.signature);
      }
    }
    setLoading(false);
  }, [user]);

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
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
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
      toast.error('Please provide a signature');
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
      toast.error(error.response?.data?.error || 'Failed to save signature');
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

  // Check if user can change password (all users can change password)
  const canChangePassword = true;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          icon={FiArrowLeft}
          size="md"
        />
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
          {(isHR(user) || isManager(user)) && (
            <Button
              onClick={() => navigate('/profile/edit')}
              variant="primary"
              icon={FiEdit}
            >
              Edit Profile
            </Button>
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
            <p className="font-semibold text-gray-900">{getRoleDisplayName(user?.role_id)}</p>
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
              <Button
                onClick={handleUseSavedSignature}
                variant="primary"
                size="sm"
              >
                Use This Signature
              </Button>
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
              <Button
                type="button"
                onClick={handleClearSignature}
                variant="danger"
                icon={FiX}
                size="xs"
                className="absolute top-2 right-2"
              />
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
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              icon={FiUpload}
            >
              Upload Signature Image
            </Button>
            {savedSignature && (
              <Button
                onClick={handleUseSavedSignature}
                variant="primary"
                icon={FiCheckCircle}
              >
                Use Saved Signature
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            You can draw your signature above or upload an image file (PNG, JPG, max 2MB)
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!signature}
            loading={saving}
            variant="primary"
            icon={FiSave}
          >
            {saving ? 'Saving...' : 'Save Signature'}
          </Button>
        </div>
      </div>

      {/* Password Change Section (All Users) */}
      {canChangePassword && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiLock className="text-purple-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Update your account password. Make sure to use a strong password.
            {isEmployee(user) && (
              <span className="block mt-1 text-purple-600">
                If you're using the default password (Africa.1), please change it immediately for security.
              </span>
            )}
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
                <Button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  variant="ghost"
                  icon={showOldPassword ? FiEyeOff : FiEye}
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                />
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
                <Button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  variant="ghost"
                  icon={showNewPassword ? FiEyeOff : FiEye}
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                />
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
                <Button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  variant="ghost"
                  icon={showConfirmPassword ? FiEyeOff : FiEye}
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                />
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
            <Button
              onClick={handleChangePassword}
              disabled={!oldPassword || !newPassword || !confirmPassword}
              loading={changingPassword}
              variant="primary"
              icon={FiLock}
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

