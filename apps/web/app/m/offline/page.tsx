export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z"
          />
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        当前无网络连接
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        请检查网络后重试
      </p>
      <a
        href="/m/pos"
        className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-medium text-base active:scale-95 transition-transform"
      >
        返回收银台
      </a>
    </div>
  );
}
