// SearchSortBar.jsx — v5 new feature
// Search tasks by title, sort by various criteria

const SvgIcon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const SORT_OPTIONS = [
  { id: 'created',  label: 'Newest first' },
  { id: 'date',     label: 'Due date'     },
  { id: 'priority', label: 'Priority'     },
  { id: 'name',     label: 'Name A–Z'     },
]

export default function SearchSortBar({ search, setSearch, sort, setSort }) {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
      {/* Search */}
      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <SvgIcon d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM16.5 16.5l-3.5-3.5" size={15}/>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <SvgIcon d="M5 5l10 10M15 5L5 15" size={13}/>
          </button>
        )}
      </div>

      {/* Sort dropdown */}
      <select
        value={sort}
        onChange={e => setSort(e.target.value)}
        className="text-xs py-2 px-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 cursor-pointer">
        {SORT_OPTIONS.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
