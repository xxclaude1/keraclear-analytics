import { TrendingUp } from 'lucide-react'

export default function Funnels() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={20} className="text-positive" />
        <h2 className="text-xl font-semibold">Funnel Economics</h2>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center text-text-secondary">
        <p>Funnel economics dashboard will be built in Section 6.</p>
      </div>
    </div>
  )
}
