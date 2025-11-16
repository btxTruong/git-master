import { LucideIcon, ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { services } from '../../../wailsjs/go/models';

interface TokenDropdownProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  tokens: services.GitHubToken[];
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function TokenDropdown({
  label,
  icon: Icon,
  value,
  onChange,
  tokens,
  placeholder = 'Auto-select (Pattern matching)',
  helperText,
  className = '',
}: TokenDropdownProps) {
  const EMPTY_VALUE = '__auto_select__';

  const handleValueChange = (val: string) => {
    // Convert the special placeholder value back to empty string
    onChange(val === EMPTY_VALUE ? '' : val);
  };

  const formatTokenDisplay = (token: services.GitHubToken) => {
    if (!token) return '';
    if (token.repoPattern) {
      return `${token.name} (${token.repoPattern})`;
    }
    return token.name;
  };

  // Ensure we have a valid value (use placeholder value if empty/undefined/null)
  const safeValue = value || EMPTY_VALUE;
  // Ensure tokens is always an array
  const safeTokens = Array.isArray(tokens) ? tokens : [];

  // Determine the display value - convert empty string to EMPTY_VALUE for Radix UI
  const displayValue = safeValue === '' ? EMPTY_VALUE : safeValue;

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>

      <Select.Root value={displayValue} onValueChange={handleValueChange}>
        <Select.Trigger
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
            flex items-center justify-between gap-2
          "
        >
          <Select.Value placeholder={placeholder}>
            {displayValue === EMPTY_VALUE
              ? placeholder
              : (() => {
                  const selectedToken = safeTokens.find((t) => t && t.id === displayValue);
                  return selectedToken ? formatTokenDisplay(selectedToken) : placeholder;
                })()}
          </Select.Value>
          <Select.Icon>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="
              overflow-hidden
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-lg shadow-lg
              z-50
            "
            position="popper"
            sideOffset={5}
          >
            <Select.Viewport className="p-1">
              <Select.Group>
                {/* Auto-select option */}
                <Select.Item
                  value={EMPTY_VALUE}
                  className="
                    relative flex items-center
                    px-8 py-2
                    text-sm text-gray-700 dark:text-gray-300
                    rounded
                    cursor-pointer
                    outline-none
                    select-none
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    focus:bg-gray-100 dark:focus:bg-gray-700
                    data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/20
                    data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400
                  "
                >
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <Check className="w-4 h-4" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{placeholder}</Select.ItemText>
                </Select.Item>

                {safeTokens.length > 0 && (
                  <Select.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                )}

                {/* Token options */}
                {safeTokens.map((token) => (
                  <Select.Item
                    key={token.id}
                    value={token.id}
                    className="
                      relative flex items-center
                      px-8 py-2
                      text-sm text-gray-700 dark:text-gray-300
                      rounded
                      cursor-pointer
                      outline-none
                      select-none
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:bg-gray-100 dark:focus:bg-gray-700
                      data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/20
                      data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400
                    "
                  >
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check className="w-4 h-4" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{formatTokenDisplay(token)}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {helperText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{helperText}</p>}
    </div>
  );
}
