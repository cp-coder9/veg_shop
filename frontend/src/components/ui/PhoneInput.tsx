import { useState, useMemo } from 'react';

// Country phone code data
export const COUNTRY_CODES = [
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', phoneFormat: '## ### ####', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', phoneFormat: '(###) ###-####', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', phoneFormat: '#### ######', maxLength: 11 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', phoneFormat: '(###) ###-####', maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', phoneFormat: '#### ### ###', maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', phoneFormat: '#### #######', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', phoneFormat: '# ## ## ## ##', maxLength: 10 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', phoneFormat: '# ## ## ## ##', maxLength: 10 },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', phoneFormat: '### ### ###', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', phoneFormat: '### ### ####', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', phoneFormat: '### ### ###', maxLength: 9 },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', phoneFormat: '### ### ###', maxLength: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', phoneFormat: '## ### ## ##', maxLength: 10 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', phoneFormat: '### ### ###', maxLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', phoneFormat: '## ### ## ##', maxLength: 10 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', phoneFormat: '### ## ###', maxLength: 8 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', phoneFormat: '## ## ## ##', maxLength: 8 },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', phoneFormat: '## ### ## ##', maxLength: 10 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', phoneFormat: '## ### ####', maxLength: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', phoneFormat: '## ### ####', maxLength: 10 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', phoneFormat: '##### #####', maxLength: 10 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', phoneFormat: '### #### ####', maxLength: 11 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', phoneFormat: '## #### ####', maxLength: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', phoneFormat: '## #### ####', maxLength: 10 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', phoneFormat: '#### ####', maxLength: 8 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', phoneFormat: '## ### ####', maxLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', phoneFormat: '## ### ####', maxLength: 9 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', phoneFormat: '(##) #####-####', maxLength: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', phoneFormat: '### ### ####', maxLength: 10 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', phoneFormat: '## ####-####', maxLength: 10 },
] as const;

export type CountryCode = typeof COUNTRY_CODES[number]['code'];

interface PhoneInputProps {
  value: string;
  onChange: (value: string, countryCode: CountryCode) => void;
  countryCode: CountryCode;
  onCountryChange: (countryCode: CountryCode) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryChange,
  label,
  placeholder,
  required = false,
  error,
  className = '',
  disabled = false,
}: PhoneInputProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const selectedCountry = useMemo(() => {
    return COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];
  }, [countryCode]);

  const formatPhoneNumber = (input: string, country: typeof COUNTRY_CODES[number]): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Remove leading country code digits if present
    let cleanDigits = digits;
    const dialCodeDigits = country.dialCode.replace('+', '');
    if (cleanDigits.startsWith(dialCodeDigits)) {
      cleanDigits = cleanDigits.slice(dialCodeDigits.length);
    }
    
    // Limit to max length
    cleanDigits = cleanDigits.slice(0, country.maxLength);
    
    // Format according to pattern
    let formatted = '';
    let digitIndex = 0;
    
    for (const char of country.phoneFormat) {
      if (digitIndex >= cleanDigits.length) break;
      if (char === '#') {
        formatted += cleanDigits[digitIndex];
        digitIndex++;
      } else {
        formatted += char;
      }
    }
    
    return formatted;
  };

  const validatePhoneNumber = (input: string, country: typeof COUNTRY_CODES[number]): boolean => {
    const digits = input.replace(/\D/g, '');
    // Check if we have enough digits (typically 9-10 for most countries)
    const minLength = Math.min(9, country.maxLength);
    return digits.length >= minLength && digits.length <= country.maxLength;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input, selectedCountry);
    onChange(formatted, countryCode);
  };

  const handleCountrySelect = (code: CountryCode) => {
    onCountryChange(code);
    setIsDropdownOpen(false);
    // Clear the phone number when country changes
    onChange('', code);
  };

  const isValid = !value || validatePhoneNumber(value, selectedCountry);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex">
        {/* Country dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={disabled}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute z-50 mt-1 left-0 w-72 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                {COUNTRY_CODES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                      country.code === countryCode ? 'bg-green-50' : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium text-gray-900">{country.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{country.dialCode}</span>
                    </div>
                    {country.code === countryCode && (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Phone number input */}
        <input
          type="tel"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder || selectedCountry.phoneFormat.replace(/#/g, '0')}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
            error || !isValid ? 'border-red-300 focus:ring-red-500' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          disabled={disabled}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!isValid && !error && value && (
        <p className="mt-1 text-sm text-red-600">
          Please enter a valid {selectedCountry.name} phone number
        </p>
      )}
    </div>
  );
}

export function formatFullPhoneNumber(phone: string, countryCode: CountryCode): string {
  const country = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];
  const digits = phone.replace(/\D/g, '');
  return `${country.dialCode} ${digits}`;
}

export function parsePhoneNumber(fullPhone: string): { phone: string; countryCode: CountryCode } {
  // Try to match country code
  for (const country of COUNTRY_CODES) {
    const dialCode = country.dialCode.replace('+', '');
    if (fullPhone.startsWith(country.dialCode) || fullPhone.startsWith(dialCode)) {
      const phone = fullPhone.replace(new RegExp(`^\\+?${dialCode}`), '').trim();
      return { phone, countryCode: country.code };
    }
  }
  // Default to South Africa
  return { phone: fullPhone, countryCode: 'ZA' };
}
