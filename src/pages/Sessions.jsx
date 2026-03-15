import { PlayCircle } from 'lucide-react'

export default function Sessions() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <PlayCircle size={20} className="text-accent" />
        <h2 className="text-xl font-semibold">Session Recordings</h2>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center text-text-secondary">
        <p>Session recordings and replay will be built in Section 3.</p>
      </div>
    </div>
  )
}
