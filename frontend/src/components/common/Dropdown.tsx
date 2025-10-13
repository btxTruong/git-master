import { LucideIcon } from 'lucide-react';

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
  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange((e.target.value as T) || null)}
        className="
          w-full px-3 py-2 border border-gray-300 rounded-md
          text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
