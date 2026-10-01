import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  code?: string;
}

export interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  isInvalid = false,
  disabled = false,
  className = ''
}) => {
  const generatedId = useId();
  const comboboxId = id || generatedId;
  const listboxId = `${comboboxId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.code && opt.code.toLowerCase().includes(query)) ||
      opt.value.toLowerCase().includes(query)
    );
  });

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll('li');
      const item = items[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        id={comboboxId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-invalid={isInvalid}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full h-12 px-3.5 rounded-lg bg-[#FFFFFF] text-[16px] sm:text-sm text-left flex items-center justify-between font-sans transition-colors duration-150
          border ${
            isInvalid
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
              : 'border-[#6B7280] focus:border-[#0A0A0A] focus:ring-[#0A0A0A]'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed
        `}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-[#0A0A0A] font-medium">{selectedOption.label}</span>
              {selectedOption.code && (
                <span className="font-mono text-xs text-[#6B7280] bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                  {selectedOption.code}
                </span>
              )}
            </span>
          ) : (
            <span className="text-[#6B7280]">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#0A0A0A]' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-[#FFFFFF] rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden"
          style={{ maxHeight: '280px' }}
        >
          {/* Search Field */}
          <div className="p-2 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#6B7280] shrink-0" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search department..."
              className="w-full bg-transparent text-sm text-[#0A0A0A] placeholder:text-[#6B7280] focus:outline-none"
              role="searchbox"
              aria-label="Filter departments"
            />
          </div>

          {/* Options List */}
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label="Departments"
            className="overflow-y-auto max-h-[220px] py-1 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-3 text-xs text-[#6B7280] text-center">
                No matching departments found
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-sm cursor-pointer select-none transition-colors ${
                      isHighlighted ? 'bg-[#FAFAFA]' : ''
                    } ${isSelected ? 'font-medium text-[#0A0A0A]' : 'text-[#0A0A0A]'}`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.code && (
                        <span className="font-mono text-xs text-[#6B7280] bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E7EB] shrink-0">
                          {opt.code}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0A0A0A] shrink-0" aria-hidden="true" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
