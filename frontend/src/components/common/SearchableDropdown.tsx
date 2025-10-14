import { useState } from 'react';
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

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>

      <Combobox value={value} onChange={onChange} immediate>
        <div className="relative">
          <ComboboxInput
            className="
              w-full px-3 py-2
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-md
              text-sm text-left
              text-gray-900 dark:text-gray-100
              hover:border-gray-400 dark:hover:border-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors
              pr-8
            "
            displayValue={(option: T | null) => (option ? formatOption(option) : '')}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <ComboboxOptions
          className="
            absolute
            w-full
            mt-1
            max-h-60
            overflow-auto
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg
            shadow-lg
            z-50
            p-1
          "
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
