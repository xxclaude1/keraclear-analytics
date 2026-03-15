import { BarChart3 } from 'lucide-react'

export default function Dashboard() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-neutral" />
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center text-text-secondary">
        <p>Analytics dashboard will be built in Section 5.</p>
      </div>
    </div>
  )
}
