import { useState, useRef, useEffect } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import 'react-day-picker/style.css';

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date || null);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const defaultClassNames = getDefaultClassNames();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{label}</label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
        <span className={value ? '' : 'text-gray-500 dark:text-gray-400'}>
          {value ? format(value, 'PPP') : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={handleClear}
            />
          )}
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div
          className="
            absolute top-full left-0 mt-2 z-50
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            p-3
          "
        >
          <DayPicker
            mode="single"
            selected={value || undefined}
            onSelect={handleDateSelect}
            classNames={{
              root: `${defaultClassNames.root}`,
              months: `${defaultClassNames.months}`,
              month: `${defaultClassNames.month}`,
              month_caption: `${defaultClassNames.month_caption} text-gray-900 dark:text-gray-100 font-semibold`,
              caption_label: `${defaultClassNames.caption_label}`,
              nav: `${defaultClassNames.nav}`,
              button_previous: `${defaultClassNames.button_previous} hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`,
              button_next: `${defaultClassNames.button_next} hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400`,
              month_grid: `${defaultClassNames.month_grid}`,
              weekdays: `${defaultClassNames.weekdays}`,
              weekday: `${defaultClassNames.weekday} text-gray-600 dark:text-gray-400 font-medium`,
              week: `${defaultClassNames.week}`,
              day: `${defaultClassNames.day} text-gray-900 dark:text-gray-100`,
              day_button: `${defaultClassNames.day_button} hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md`,
              selected: `bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700`,
              today: `font-bold text-blue-600 dark:text-blue-400`,
              outside: `text-gray-400 dark:text-gray-600`,
              disabled: `text-gray-300 dark:text-gray-700`,
              hidden: `invisible`,
            }}
          />
        </div>
      )}
    </div>
  );
}
