import React, { useState } from 'react';
import { FiX, FiUpload, FiDownload, FiAlertCircle, FiCheckCircle, FiFile } from 'react-icons/fi';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface BulkUploadEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: number;
  companyName: string;
}

interface UploadResult {
  successCount: number;
  skipCount: number;
  errors: string[];
  failedRows?: Array<{
    row: number;
    name: string;
    email: string;
    payroll_number: string;
    reason: string;
  }>;
}

const BulkUploadEmployeesModal: React.FC<BulkUploadEmployeesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companyId,
  companyName,
}) => {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      
      
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    // Create sample Excel data
    const templateData = [
      {
        'Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Payroll Number': 'EMP001',
        'Phone Number': '0711234567',
        'Department ID': '1',
        'Manager ID': '5',
        'Role ID': '4',
        'National ID': '12345678',
        'Position': 'Software Engineer',
        'Password': 'TempPass123',
      },
      {
        'Name': 'Jane Smith',
        'Email': 'jane.smith@example.com',
        'Payroll Number': 'EMP002',
        'Phone Number': '0722334455',
        'Department ID': '2',
        'Manager ID': '6',
        'Role ID': '4',
        'National ID': '87654321',
        'Position': 'Sales Manager',
        'Password': 'TempPass456',
      },
      {
        'Name': 'Bob Wilson',
        'Email': 'N/A',
        'Payroll Number': 'EMP003',
        'Phone Number': '0733445566',
        'Department ID': '1',
        'Manager ID': '5',
        'Role ID': '4',
        'National ID': '',
        'Position': '',
        'Password': 'TempPass789',
      },
    ];

    // Convert to CSV for simplicity
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_upload_template_${companyName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadResult(null);


    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('company_id', companyId.toString());


      const response = await api.post('/users/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for large uploads
      });


      const result = response.data;
      const successCount = result.data?.imported || 0;
      const skipCount = result.data?.skipped || 0;
      const errors = result.data?.errors || [];
      const failedRows = result.data?.failedRows || [];
      
      setUploadResult({
        successCount,
        skipCount,
        errors,
        failedRows,
      });

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} employee(s)`);
        onSuccess();
      } else {
        toast.warning('No employees were uploaded. Please check the errors.');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
      toast.error('Upload failed. Please check your file and try again.');
      
      setUploadResult({
        successCount: 0,
        skipCount: 0,
        errors: [errorMsg],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setUploadResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FiUpload className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Bulk Upload Employees</h3>
                <p className="text-sm text-purple-100">{companyName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-white hover:text-purple-100 disabled:opacity-50"
            >
              <FiX className="text-2xl" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <FiAlertCircle className="mr-2" />
                Excel File Requirements
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                <li><strong>Required columns:</strong> Name, Payroll Number, Phone Number, Role ID</li>
                <li><strong>Optional columns:</strong> Email (can be N/A or blank), Department ID, Manager ID, Password, National ID, Position</li>
                <li><strong>Column order:</strong> Name, Email, Payroll Number, Phone Number, Department ID, Manager ID, Role ID, National ID, Position, Password</li>
                <li><strong>Email:</strong> Can be left blank or marked as "N/A" for users without email</li>
                <li><strong>Role ID:</strong> Use 4 for Employee, 2 for Manager, 3 for HR</li>
                <li><strong>Department ID & Manager ID:</strong> Use numeric IDs from the system</li>
                <li><strong>Password:</strong> If not provided, default password "Africa.1" will be used</li>
                <li><strong>File format:</strong> .xlsx or .xls</li>
              </ul>
            </div>

            {/* Download Template */}
            <div>
              <button
                onClick={handleDownloadTemplate}
                disabled={uploading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FiDownload />
                <span>Download Template</span>
              </button>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <FiFile className="text-2xl" />
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div>
                      <FiUpload className="mx-auto text-4xl text-gray-400 mb-2" />
                      <p className="text-gray-600">Click to select Excel file</p>
                      <p className="text-xs text-gray-500 mt-1">Supports .xlsx and .xls formats</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className="space-y-3">
                {uploadResult.successCount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center text-green-800">
                      <FiCheckCircle className="mr-2 text-lg" />
                      <span className="font-semibold">
                        Successfully uploaded {uploadResult.successCount} employee(s)
                      </span>
                    </div>
                  </div>
                )}

                {uploadResult.skipCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center text-yellow-800">
                      <FiAlertCircle className="mr-2 text-lg" />
                      <span className="font-semibold">
                        Skipped {uploadResult.skipCount} duplicate(s)
                      </span>
                    </div>
                  </div>
                )}

                {uploadResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="font-semibold text-red-900 mb-3 flex items-center">
                      <FiAlertCircle className="mr-2" />
                      Failed Rows ({uploadResult.errors.length})
                    </h5>
                    
                    {uploadResult.failedRows && uploadResult.failedRows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-red-100 border-b border-red-200">
                              <th className="px-3 py-2 text-left text-red-900 font-semibold">Row #</th>
                              <th className="px-3 py-2 text-left text-red-900 font-semibold">Name</th>
                              <th className="px-3 py-2 text-left text-red-900 font-semibold">Email</th>
                              <th className="px-3 py-2 text-left text-red-900 font-semibold">Payroll Number</th>
                              <th className="px-3 py-2 text-left text-red-900 font-semibold">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-200">
                            {uploadResult.failedRows.map((failedRow, index) => (
                              <tr key={index} className="hover:bg-red-50">
                                <td className="px-3 py-2 text-red-800 font-medium">{failedRow.row}</td>
                                <td className="px-3 py-2 text-red-800">{failedRow.name}</td>
                                <td className="px-3 py-2 text-red-800">{failedRow.email}</td>
                                <td className="px-3 py-2 text-red-800">{failedRow.payroll_number}</td>
                                <td className="px-3 py-2 text-red-800">{failedRow.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {uploadResult ? 'Close' : 'Cancel'}
            </button>
            {!uploadResult && (
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiUpload />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadEmployeesModal;
