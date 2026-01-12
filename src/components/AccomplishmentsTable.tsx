import React from 'react';
import { Accomplishment } from '../types';

interface AccomplishmentsTableProps {
  accomplishments: Accomplishment[];
  onChange?: (accomplishments: Accomplishment[]) => void;
  mode: 'employee' | 'manager' | 'view';
  ratingOptions?: Array<{value: number; label: string}>;
  managerRatingOptions?: Array<{value: number; label: string}>;
  readonly?: boolean;
}

export const AccomplishmentsTable: React.FC<AccomplishmentsTableProps> = ({
  accomplishments,
  onChange,
  mode,
  ratingOptions = [
    {value: 0, label: '0.00 - Not Achieved'},
    {value: 1.0, label: '1.00 - Partially Achieved'},
    {value: 1.25, label: '1.25 - Fully Achieved'},
    {value: 1.5, label: '1.50 - Exceeded'}
  ],
  managerRatingOptions,
  readonly = false
}) => {
  const actualManagerRatingOptions = managerRatingOptions || ratingOptions;
  const handleChange = (index: number, field: keyof Accomplishment, value: any) => {
    if (!onChange || readonly) return;
    const updated = [...accomplishments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addAccomplishment = () => {
    if (!onChange || readonly) return;
    onChange([...accomplishments, {
      review_id: accomplishments[0]?.review_id || 0,
      title: '',
      description: '',
      employee_rating: 0,
      item_order: accomplishments.length + 1
    }]);
  };

  const removeAccomplishment = (index: number) => {
    if (!onChange || readonly || accomplishments.length <= 2) return;
    const updated = accomplishments.filter((_, i) => i !== index);
    // Reorder items
    updated.forEach((acc, i) => {
      acc.item_order = i + 1;
    });
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Major Accomplishments</h3>
        {mode === 'employee' && !readonly && (
          <button 
            onClick={addAccomplishment}
            type="button" 
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            + Add Accomplishment
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap">#</th>
              <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '180px' }}>Title</th>
              <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '250px' }}>Description</th>
              
              {/* Employee Rating Column - shown in all modes */}
              <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '140px' }}>Employee Rating *</th>
              
              {/* Employee Comment - only in employee mode */}
              {mode === 'employee' && !readonly && (
                <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '200px' }}>Employee Comment</th>
              )}
              
              {/* Manager Rating - shown in manager and view modes */}
              {(mode === 'manager' || mode === 'view') && (
                <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '140px' }}>
                  Manager Rating {mode === 'manager' && '*'}
                </th>
              )}
              
              {/* Manager Comment - shown in manager and view modes */}
              {(mode === 'manager' || mode === 'view') && (
                <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap" style={{ minWidth: '200px' }}>Manager Comment</th>
              )}
              
              {mode === 'employee' && !readonly && (
                <th className="text-left p-3 bg-gray-50 font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {accomplishments.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No accomplishments added yet. {mode === 'employee' && !readonly && 'Click "Add Accomplishment" to add one.'}
                </td>
              </tr>
            ) : (
              accomplishments.map((acc, index) => (
                <tr key={acc.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-700 font-medium">{index + 1}</td>
                  
                  {/* Title */}
                  <td className="p-3">
                    {mode === 'employee' && !readonly ? (
                      <input
                        type="text"
                        value={acc.title}
                        onChange={(e) => handleChange(index, 'title', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Accomplishment title"
                        required
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{acc.title || '-'}</span>
                    )}
                  </td>
                  
                  {/* Description */}
                  <td className="p-3">
                    {mode === 'employee' && !readonly ? (
                      <textarea
                        value={acc.description || ''}
                        onChange={(e) => handleChange(index, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={2}
                        placeholder="Description"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{acc.description || '-'}</span>
                    )}
                  </td>
                  
                  {/* Employee Rating */}
                  <td className="p-3">
                    {mode === 'employee' && !readonly ? (
                      <select
                        value={acc.employee_rating || ''}
                        onChange={(e) => handleChange(index, 'employee_rating', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      >
                        <option value="">Select...</option>
                        {ratingOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <span className="font-semibold text-purple-600">
                          {acc.employee_rating !== null && acc.employee_rating !== undefined 
                            ? acc.employee_rating.toFixed(2) 
                            : 'N/A'}
                        </span>
                        {acc.employee_rating && acc.employee_rating > 0 && (
                          <span className="text-xs text-gray-500 block mt-1">
                            {ratingOptions.find(opt => opt.value === acc.employee_rating)?.label.split(' - ')[1] || ''}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* Employee Comment - only in employee mode */}
                  {mode === 'employee' && !readonly && (
                    <td className="p-3">
                      <textarea
                        value={acc.employee_comment || ''}
                        onChange={(e) => handleChange(index, 'employee_comment', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={2}
                        placeholder="Your comment (optional)"
                      />
                    </td>
                  )}
                  
                  {/* Manager Rating - in manager and view modes */}
                  {(mode === 'manager' || mode === 'view') && (
                    <td className="p-3">
                      {mode === 'manager' && !readonly ? (
                        <select
                          value={acc.manager_rating || ''}
                          onChange={(e) => handleChange(index, 'manager_rating', parseFloat(e.target.value))}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select...</option>
                          {actualManagerRatingOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <span className="font-semibold text-blue-600">
                            {acc.manager_rating !== null && acc.manager_rating !== undefined 
                              ? acc.manager_rating.toFixed(2) 
                              : 'N/A'}
                          </span>
                          {acc.manager_rating && acc.manager_rating > 0 && (
                            <span className="text-xs text-gray-500 block mt-1">
                              {actualManagerRatingOptions.find(opt => opt.value === acc.manager_rating)?.label.split(' - ')[1] || ''}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                  
                  {/* Manager Comment - in manager and view modes */}
                  {(mode === 'manager' || mode === 'view') && (
                    <td className="p-3">
                      {mode === 'manager' && !readonly ? (
                        <textarea
                          value={acc.manager_comment || ''}
                          onChange={(e) => handleChange(index, 'manager_comment', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Manager's feedback"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{acc.manager_comment || 'No comment'}</span>
                      )}
                    </td>
                  )}
                  
                  {mode === 'employee' && !readonly && (
                    <td className="p-3">
                      {accomplishments.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeAccomplishment(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {accomplishments.length < 2 && mode === 'employee' && !readonly && (
        <p className="text-sm text-orange-600 mt-2 font-medium">
          ⚠ Please add at least 2 accomplishments before submitting
        </p>
      )}
    </div>
  );
};

export default AccomplishmentsTable;
