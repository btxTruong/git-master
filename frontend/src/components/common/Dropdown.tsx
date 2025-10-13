import { LucideIcon, ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

interface DropdownProps<T extends string> {
  label: string;
  icon?: LucideIcon;
  value: T | null;
  onChange: (value: T | null) => void;
  options: readonly T[];
  placeholder?: string;
  formatOption?: (option: T) => string;
  className?: string;
}

export function Dropdown<T extends string>({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  formatOption = (option) => option,
  className = '',
}: DropdownProps<T>) {
  const EMPTY_VALUE = '__empty__';

  const handleValueChange = (val: string) => {
    if (val === EMPTY_VALUE) {
      onChange(null);
    } else {
      onChange(val as T);
    }
  };

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>

      <Select.Root value={value || EMPTY_VALUE} onValueChange={handleValueChange}>
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
          <Select.Value placeholder={placeholder} />
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

                {options.length > 0 && (
                  <Select.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                )}

                {options.map((option) => (
                  <Select.Item
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
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:bg-gray-100 dark:focus:bg-gray-700
                      data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/20
                      data-[state=checked]:text-blue-600 dark:data-[state=checked]:text-blue-400
                    "
                  >
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check className="w-4 h-4" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{formatOption(option)}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
