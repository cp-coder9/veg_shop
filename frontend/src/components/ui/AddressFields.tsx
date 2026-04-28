import { useState } from 'react';
import { MapPin, Building2, Navigation, Mail } from 'lucide-react';

// South African provinces
const PROVINCES = [
  { code: 'EC', name: 'Eastern Cape' },
  { code: 'FS', name: 'Free State' },
  { code: 'GP', name: 'Gauteng' },
  { code: 'KZN', name: 'KwaZulu-Natal' },
  { code: 'LP', name: 'Limpopo' },
  { code: 'MP', name: 'Mpumalanga' },
  { code: 'NC', name: 'Northern Cape' },
  { code: 'NW', name: 'North West' },
  { code: 'WC', name: 'Western Cape' },
];

export interface AddressData {
  streetName?: string;
  area?: string;
  province?: string;
  postalCode?: string;
}

interface AddressFieldsProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
  errors?: Partial<Record<keyof AddressData, string>>;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
}

export function AddressFields({
  data,
  onChange,
  errors = {},
  disabled = false,
  className = '',
  showLabels = true,
}: AddressFieldsProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof AddressData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleBlur = (field: keyof AddressData) => {
    setTouched({ ...touched, [field]: true });
  };

  const validatePostalCode = (code: string): boolean => {
    if (!code) return true; // Optional field
    // South African postal code format: 4 digits
    const saPostalCodeRegex = /^\d{4}$/;
    // International postal codes: alphanumeric, 3-10 characters
    const intlPostalCodeRegex = /^[A-Za-z0-9\-\s]{3,10}$/;
    return saPostalCodeRegex.test(code) || intlPostalCodeRegex.test(code);
  };

  const getPostalCodeError = (code: string): string | undefined => {
    if (!code) return undefined;
    if (!validatePostalCode(code)) {
      return 'Please enter a valid postal code';
    }
    return undefined;
  };

  const InputWrapper = ({
    children,
    label,
    htmlFor,
    error,
    icon: Icon,
  }: {
    children: React.ReactNode;
    label: string;
    htmlFor: string;
    error?: string;
    icon: React.ElementType;
  }) => (
    <div>
      {showLabels && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        {children}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Street Name */}
      <InputWrapper
        label="Street Name & Number"
        htmlFor="streetName"
        error={touched.streetName || errors.streetName ? errors.streetName : undefined}
        icon={MapPin}
      >
        <input
          id="streetName"
          type="text"
          value={data.streetName || ''}
          onChange={(e) => handleChange('streetName', e.target.value)}
          onBlur={() => handleBlur('streetName')}
          disabled={disabled}
          placeholder="e.g., 123 Main Street"
          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
            errors.streetName ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </InputWrapper>

      {/* Area/Suburb */}
      <InputWrapper
        label="Area / Suburb"
        htmlFor="area"
        error={touched.area || errors.area ? errors.area : undefined}
        icon={Building2}
      >
        <input
          id="area"
          type="text"
          value={data.area || ''}
          onChange={(e) => handleChange('area', e.target.value)}
          onBlur={() => handleBlur('area')}
          disabled={disabled}
          placeholder="e.g., Green Point"
          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
            errors.area ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </InputWrapper>

      {/* Province and Postal Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Province */}
        <InputWrapper
          label="Province"
          htmlFor="province"
          error={touched.province || errors.province ? errors.province : undefined}
          icon={Navigation}
        >
          <select
            id="province"
            value={data.province || ''}
            onChange={(e) => handleChange('province', e.target.value)}
            onBlur={() => handleBlur('province')}
            disabled={disabled}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors appearance-none bg-white ${
              errors.province ? 'border-red-300' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">Select Province</option>
            {PROVINCES.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </InputWrapper>

        {/* Postal Code */}
        <InputWrapper
          label="Postal Code"
          htmlFor="postalCode"
          error={touched.postalCode || errors.postalCode ? errors.postalCode : undefined}
          icon={Mail}
        >
          <input
            id="postalCode"
            type="text"
            value={data.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            onBlur={() => handleBlur('postalCode')}
            disabled={disabled}
            placeholder="e.g., 8001"
            maxLength={10}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
              errors.postalCode || (touched.postalCode && getPostalCodeError(data.postalCode || ''))
                ? 'border-red-300'
                : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </InputWrapper>
      </div>

      {/* Postal Code Validation Message */}
      {touched.postalCode && data.postalCode && getPostalCodeError(data.postalCode) && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {getPostalCodeError(data.postalCode)}
        </p>
      )}
    </div>
  );
}

// Helper function to format full address
export function formatFullAddress(data: AddressData): string {
  const parts = [
    data.streetName,
    data.area,
    data.province ? PROVINCES.find(p => p.code === data.province)?.name : null,
    data.postalCode,
  ].filter(Boolean);
  
  return parts.join(', ');
}

// Helper function to validate all address fields
export function validateAddress(data: AddressData): Partial<Record<keyof AddressData, string>> {
  const errors: Partial<Record<keyof AddressData, string>> = {};

  if (data.postalCode && !/^[\dA-Za-z\-\s]{3,10}$/.test(data.postalCode)) {
    errors.postalCode = 'Please enter a valid postal code';
  }

  return errors;
}

export { PROVINCES };
