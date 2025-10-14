import { useState, useRef, useEffect } from 'react';
import { LucideIcon, ChevronDown, Check, X } from 'lucide-react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';

interface SearchableDropdownProps<T extends string> {
  label: string;
  icon?: LucideIcon;
  value: T | null;
  onChange: (value: T | null) => void;
  options: readonly T[];
  placeholder?: string;
  formatOption?: (option: T) => string;
  className?: string;
}

export function SearchableDropdown<T extends string>({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  formatOption = (option) => option,
  className = '',
}: SearchableDropdownProps<T>) {
  const [query, setQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [dropdownAlign, setDropdownAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          formatOption(option).toLowerCase().includes(query.toLowerCase())
        );

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  useEffect(() => {
    const calculatePosition = () => {
      if (!containerRef.current || !dropdownRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
      const dropdownWidth = dropdownRef.current.offsetWidth || 200;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;
      const spaceRight = viewportWidth - containerRect.left;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }

      if (spaceRight < dropdownWidth) {
        setDropdownAlign('right');
      } else {
        setDropdownAlign('left');
      }
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </label>
      )}

      <Combobox value={value} onChange={onChange} immediate>
        <div className="relative">
          <ComboboxInput
            className={`
              w-full px-3 py-2
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-md
              text-sm text-left
              text-gray-900 dark:text-gray-100
              hover:border-gray-400 dark:hover:border-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors
              ${value ? 'pr-16' : 'pr-8'}
            `}
            displayValue={(option: T | null) => (option ? formatOption(option) : '')}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <ComboboxOptions
          ref={dropdownRef}
          className={`
            absolute
            ${dropdownAlign === 'left' ? 'left-0' : 'right-0'}
            ${dropdownPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'}
            min-w-max
            max-h-60
            overflow-y-auto
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg
            shadow-lg
            z-50
            p-1
          `}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option}
                value={option}
                className="
                  relative flex items-center
                  px-8 py-2
                  text-sm text-gray-700 dark:text-gray-300
                  rounded
                  cursor-pointer
                  outline-none
                  select-none
                  data-[focus]:bg-gray-100 dark:data-[focus]:bg-gray-700
                  data-[selected]:bg-blue-50 dark:data-[selected]:bg-blue-900/20
                  data-[selected]:text-blue-600 dark:data-[selected]:text-blue-400
                "
              >
                {({ selected }) => (
                  <>
                    {selected && (
                      <span className="absolute left-2 inline-flex items-center">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                    <span>{formatOption(option)}</span>
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
