import React from 'react';
import { FiArrowLeft, FiSave, FiX, FiCheckCircle, FiEdit, FiHome, FiUpload } from 'react-icons/fi';
import { Modal } from '../../../components/common';
import { useCompanyManagement } from '../hooks';

const CompanyManagement: React.FC = () => {
  const {
    companies,
    loading,
    editingCompany,
    saving,
    successMessage,
    errorMessage,
    formData,
    selectedLogo,
    logoPreview,
    handleEdit,
    handleCancel,
    handleChange,
    handleLogoChange,
    handleRemoveLogo,
    handleSubmit,
    handleBack,
  } = useCompanyManagement();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Edit company information
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
          <FiCheckCircle className="text-lg" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
          <FiX className="text-lg" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Companies List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Companies</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Logo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employees</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Managers</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HR</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {company.logo_url ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${company.logo_url}`} 
                        alt={`${company.name} logo`}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <FiHome className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{company.domain || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.total_employees || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.total_managers || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.total_hr || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(company)}
                      className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      <FiEdit className="text-sm" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingCompany}
        onClose={handleCancel}
        title="Edit Company"
        size="lg"
      >
        {editingCompany && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img 
                        src={logoPreview.startsWith('blob:') || logoPreview.startsWith('data:') 
                          ? logoPreview 
                          : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}${logoPreview}`
                        } 
                        alt="Logo preview"
                        className="w-24 h-24 object-contain border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <FiX className="text-sm" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <FiHome className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <FiUpload className="mr-2" />
                      Choose Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: JPEG, PNG, GIF, SVG (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <FiSave className="text-lg" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CompanyManagement;

