import React from 'react';
import { FiCalendar } from 'react-icons/fi';

interface DatePickerProps {
  value?: string | Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  required = false,
  disabled = false,
  minDate,
  maxDate,
}) => {
  const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : null;
  const [dateString, setDateString] = React.useState(
    dateValue ? dateValue.toISOString().split('T')[0] : ''
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    setDateString(e.target.value);
    onChange(newDate);
  };

  React.useEffect(() => {
    if (dateValue) {
      setDateString(dateValue.toISOString().split('T')[0]);
    } else {
      setDateString('');
    }
  }, [dateValue]);

  const minDateString = minDate ? minDate.toISOString().split('T')[0] : undefined;
  const maxDateString = maxDate ? maxDate.toISOString().split('T')[0] : undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="date"
          value={dateString}
          onChange={handleDateChange}
          placeholder={placeholder}
          disabled={disabled}
          min={minDateString}
          max={maxDateString}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default CustomDatePicker;

