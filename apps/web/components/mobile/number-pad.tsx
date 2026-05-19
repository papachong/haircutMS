'use client';

import { useState, useCallback } from 'react';

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxDecimals?: number;
  label?: string;
}

export default function NumberPad({
  value,
  onChange,
  onSubmit,
  maxDecimals = 2,
  label = '金额',
}: NumberPadProps) {
  const [justPressed, setJustPressed] = useState<string | null>(null);

  const handleHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      handleHaptic();
      setJustPressed(key);
      setTimeout(() => setJustPressed(null), 100);

      if (key === 'backspace') {
        onChange(value.slice(0, -1));
        return;
      }

      if (key === '.' && value.includes('.')) {
        return;
      }

      if (value.includes('.')) {
        const decimals = value.split('.')[1];
        if (decimals.length >= maxDecimals && key !== '.') {
          return;
        }
      }

      if (value === '0' && key !== '.') {
        onChange(key);
      } else {
        onChange(value + key);
      }
    },
    [value, onChange, maxDecimals, handleHaptic]
  );

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2">
      {/* Display */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 mb-2 text-right">
        <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white min-h-[36px] flex items-center justify-end">
          <span className="text-lg text-slate-400 mr-1">¥</span>
          <span>{value || '0'}</span>
          <span className="w-0.5 h-7 bg-blue-500 animate-pulse ml-0.5" />
        </div>
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-1.5">
        {keys.flat().map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            className={`h-14 rounded-xl font-bold text-lg flex items-center justify-center transition-all active:scale-95 ${
              justPressed === key
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-slate-600'
            }`}
            aria-label={key === 'backspace' ? 'Delete' : key}
          >
            {key === 'backspace' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H19a2 2 0 012 2v10a2 2 0 01-2 2h-8.172a2 2 0 01-1.414-.586L3 12z"
                />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      {/* Submit button */}
      {onSubmit && (
        <button
          type="button"
          onClick={() => {
            handleHaptic();
            onSubmit();
          }}
          className="w-full mt-2 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
        >
          确认
        </button>
      )}
    </div>
  );
}
