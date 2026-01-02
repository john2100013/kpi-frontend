import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FiX } from 'react-icons/fi';

interface SignatureFieldProps {
  value?: string;
  onChange: (signature: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const SignatureField: React.FC<SignatureFieldProps> = ({
  value,
  onChange,
  label = 'Digital Signature',
  placeholder = 'Click and drag to sign',
  required = false,
  disabled = false,
}) => {
  const canvasRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (value && canvasRef.current) {
      canvasRef.current.fromDataURL(value);
      setIsEmpty(false);
    }
  }, [value]);

  const handleEnd = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL();
      onChange(dataURL);
      setIsEmpty(canvasRef.current.isEmpty());
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      onChange('');
      setIsEmpty(true);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
        {isEmpty && !value && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <svg
              className="w-16 h-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">{placeholder}</p>
          </div>
        )}

        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            width: 600,
            height: 200,
            className: 'w-full h-48 rounded-lg',
          }}
          onEnd={handleEnd}
          backgroundColor="transparent"
          disabled={disabled}
        />

        {!isEmpty && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            disabled={disabled}
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {value && (
        <p className="text-xs text-gray-500">
          Or type your full name below
        </p>
      )}
    </div>
  );
};

export default SignatureField;

