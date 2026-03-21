// TagFilter.jsx
//
// This component renders the horizontal row of tag buttons (All, Work, Home...).
// Clicking a tag filters the task list to show only that tag's tasks.
//
// Notice this component has NO state of its own.
// It receives `activeTag` and `setActiveTag` as props from App.jsx.
// This pattern is called "lifting state up" — the state lives in the
// parent (App.jsx) and flows down as props to child components.
// Why? Because both TagFilter AND TaskList need to know the active tag.

import { TAGS } from '../hooks/useTasks'

export default function TagFilter({ activeTag, setActiveTag }) {
  // The full list of filters: "All" first, then each tag from our TAGS array
  const filters = [
    { id: 'all', label: 'All', emoji: '✦' },
    ...TAGS  // spread operator: unpacks the TAGS array items here
  ]

  return (
    // overflow-x-auto + scrollbar-hide = horizontal scrolling on mobile without visible scrollbar
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-[73px] z-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-2 py-3 overflow-x-auto">
          {/*
            .map() is how React renders lists.
            For each item in the array, return JSX.
            The `key` prop is REQUIRED — React uses it to track
            which items changed. Always use a unique, stable value.
          */}
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveTag(filter.id)}
              className={`
                flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium
                whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${activeTag === filter.id
                  // Active tag: filled dark button
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  // Inactive tags: subtle border button
                  : 'bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className="text-xs">{filter.emoji}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
