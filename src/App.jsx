// App.jsx — UPDATED for v2
// useTasks now receives `user` so it only fetches after login.
// AuthScreen receives onLogin for returning users.
// A loading spinner shows while the JWT token is being verified on mount.

import { useState, useEffect } from 'react'
import { useAuth }      from './hooks/useAuth'
import { useTasks }     from './hooks/useTasks'
import AuthScreen       from './components/AuthScreen'
import Header           from './components/Header'
import Sidebar          from './components/Sidebar'
import ProfileModal     from './components/ProfileModal'
import TagFilter        from './components/TagFilter'
import TaskList         from './components/TaskList'
import TaskForm         from './components/TaskForm'

export default function App() {
  const { user, loading: authLoading, saveUser, loginUser, clearUser } = useAuth()

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('done-darkmode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('done-darkmode', darkMode)
  }, [darkMode])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [formOpen,    setFormOpen]    = useState(false)
  const [activeTag,   setActiveTag]   = useState('all')

  const { tasks, loading: tasksLoading, addTask, toggleTask, toggleImportant, deleteTask, clearCompleted } = useTasks(user)

  // While verifying JWT token on startup — show a minimal spinner
  if (authLoading) {
    return (
      <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          <p className="font-serif text-3xl text-gray-900 dark:text-white mb-4">done.</p>
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto"/>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <AuthScreen onSave={saveUser} onLogin={loginUser} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        darkMode={darkMode} setDarkMode={setDarkMode} user={user}
        onSignOut={() => { setSidebarOpen(false); clearUser() }} />

      <Header user={user} onMenuOpen={() => setSidebarOpen(true)} onProfileOpen={() => setProfileOpen(true)} />
      <TagFilter activeTag={activeTag} setActiveTag={setActiveTag} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {tasksLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin"/>
          </div>
        ) : (
          <TaskList tasks={tasks} activeTag={activeTag} onToggle={toggleTask}
            onDelete={deleteTask} onToggleImportant={toggleImportant} onClearCompleted={clearCompleted} />
        )}
      </main>

      <button onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-2xl font-light z-10">
        +
      </button>

      <TaskForm onAdd={addTask} isOpen={formOpen} onClose={() => setFormOpen(false)} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} onSave={saveUser} />
    </div>
  )
}
