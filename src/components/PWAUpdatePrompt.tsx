import { useRegisterSW } from 'virtual:pwa-register/react'

const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-gray-900 border border-purple-500/30 px-6 py-4 shadow-xl animate-in slide-in-from-bottom-4">
      <p className="text-sm font-medium text-white">New version available</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
      >
        Update
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-xs text-gray-500 hover:text-white"
      >
        Later
      </button>
    </div>
  )
}

export default PWAUpdatePrompt