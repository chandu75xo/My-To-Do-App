import { useState, useEffect, useMemo } from 'react'
import { useAuth }        from './hooks/useAuth'
import { useTasks }       from './hooks/useTasks'
import { usePush }        from './hooks/usePush'
import { useSettings }    from './hooks/useSettings'
import { useDueAlarm }    from './hooks/useDueAlarm'
import SplashScreen       from './components/SplashScreen'
import AuthScreen         from './components/AuthScreen'
import NotificationPrompt from './components/NotificationPrompt'
import Header             from './components/Header'
import Sidebar            from './components/Sidebar'
import ProfileModal       from './components/ProfileModal'
import SettingsModal      from './components/SettingsModal'
import StatsScreen        from './components/StatsScreen'
import SearchSortBar      from './components/SearchSortBar'
import TagFilter          from './components/TagFilter'
import TaskList           from './components/TaskList'
import TaskForm           from './components/TaskForm'
import EditTaskModal      from './components/EditTaskModal'
import PushToast          from './components/PushToast'
import AlarmModal         from './components/AlarmModal'

const NOTIF_KEY  = 'done-notif-prompted'
const SPLASH_KEY = 'done-splash-shown'
const BASE_URL   = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function sortTasks(tasks, sort) {
  const arr = [...tasks]
  switch (sort) {
    case 'date':     return arr.sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1)
    case 'priority': return arr.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
    case 'name':     return arr.sort((a, b) => a.title.localeCompare(b.title))
    default:         return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

export default function App() {
  const { user, loading: authLoading, saveUser, loginUser, clearUser } = useAuth()
  const { settings, updateSetting } = useSettings()

  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem(SPLASH_KEY))
  const handleSplashDone = () => { sessionStorage.setItem(SPLASH_KEY, 'true'); setShowSplash(false) }

  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('done-darkmode'); if (s) return s === 'true' } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('done-darkmode', String(darkMode))
  }, [darkMode])

  const [showNotifPrompt, setShowNotifPrompt] = useState(false)
  useEffect(() => {
    if (user && !localStorage.getItem(NOTIF_KEY)) setShowNotifPrompt(true)
  }, [user])

  // Keep-alive ping every 14 mins
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => fetch(`${BASE_URL}/api/health`).catch(() => {}), 14 * 60 * 1000)
    return () => clearInterval(id)
  }, [user])

  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statsOpen,    setStatsOpen]    = useState(false)
  const [formOpen,     setFormOpen]     = useState(false)
  const [activeTag,    setActiveTag]    = useState('all')
  const [editingTask,  setEditingTask]  = useState(null)
  const [search,       setSearch]       = useState('')
  const [sort,         setSort]         = useState('created')

  const {
    tasks, loading: tasksLoading,
    addTask, editTask, toggleTask, toggleImportant, deleteTask, clearCompleted,
    addSubtask, toggleSubtask, deleteSubtask,
  } = useTasks(user)

  const {
    permission, isSupported,
    requestPermission, unsubscribe,
    sendTestPush, testStatus,
  } = usePush(user)

  const { alarmTask, handleDismiss, handleSnooze } = useDueAlarm(tasks, settings)

  // Search + sort + tag filter all applied here
  const displayTasks = useMemo(() => {
    let t = tasks
    if (activeTag !== 'all') t = t.filter(task => task.tag === activeTag)
    if (search.trim()) {
      const q = search.toLowerCase()
      t = t.filter(task =>
        task.title.toLowerCase().includes(q) ||
        (task.notes || '').toLowerCase().includes(q)
      )
    }
    return sortTasks(t, sort)
  }, [tasks, activeTag, search, sort])

  const handleAllow = async () => {
    localStorage.setItem(NOTIF_KEY, 'true'); setShowNotifPrompt(false)
    await requestPermission()
  }
  const handleDecline = () => {
    localStorage.setItem(NOTIF_KEY, 'true'); setShowNotifPrompt(false)
  }

  if (showSplash) return <div className={darkMode ? 'dark' : ''}><SplashScreen onDone={handleSplashDone}/></div>

  if (authLoading) return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center`}>
      <div className="text-center">
        <p className="font-serif text-3xl text-gray-900 dark:text-white mb-4">done.</p>
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto"/>
      </div>
    </div>
  )

  if (!user) return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
        <AuthScreen onSave={saveUser} onLogin={loginUser}/>
      </div>
    </div>
  )

  if (showNotifPrompt) return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
        <NotificationPrompt onAllow={handleAllow} onDecline={handleDecline}/>
      </div>
    </div>
  )

  if (statsOpen) return (
    <div className={darkMode ? 'dark' : ''}>
      <StatsScreen tasks={tasks} onClose={() => setStatsOpen(false)}/>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      <Sidebar
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        darkMode={darkMode} setDarkMode={setDarkMode} user={user}
        permission={permission} isSupported={isSupported}
        onEnableNotifications={requestPermission} onDisableNotifications={unsubscribe}
        onTestPush={sendTestPush} testStatus={testStatus}
        onOpenSettings={() => { setSidebarOpen(false); setSettingsOpen(true) }}
        onOpenStats={() => setStatsOpen(true)}
        onSignOut={() => { setSidebarOpen(false); clearUser() }}
      />

      <Header user={user} onMenuOpen={() => setSidebarOpen(true)} onProfileOpen={() => setProfileOpen(true)}/>
      <TagFilter activeTag={activeTag} setActiveTag={setActiveTag}/>
      <SearchSortBar search={search} setSearch={setSearch} sort={sort} setSort={setSort}/>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-28">
        {tasksLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin"/>
          </div>
        ) : (
          <TaskList
            tasks={displayTasks} activeTag={activeTag}
            onToggle={toggleTask} onDelete={deleteTask}
            onToggleImportant={toggleImportant} onClearCompleted={clearCompleted}
            onEdit={setEditingTask} timeFormat={settings.timeFormat}
            onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask}
          />
        )}
      </main>

      <button onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-2xl font-light z-10">
        +
      </button>

      <TaskForm       onAdd={addTask}    isOpen={formOpen}      onClose={() => setFormOpen(false)}/>
      <EditTaskModal  key={editingTask?.id} task={editingTask}  isOpen={!!editingTask} onClose={() => setEditingTask(null)} onSave={editTask}/>
      <ProfileModal   isOpen={profileOpen}  onClose={() => setProfileOpen(false)}  user={user}     onSave={saveUser}/>
      <SettingsModal  isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onUpdate={updateSetting}/>
      <AlarmModal     task={alarmTask} snoozeMinutes={settings.snoozeMinutes} onDismiss={handleDismiss} onSnooze={handleSnooze}/>
      <PushToast/>
    </div>
  )
}
