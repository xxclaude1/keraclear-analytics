import { Activity } from 'lucide-react'

export default function LiveVisitors() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className="text-positive" />
        <h2 className="text-xl font-semibold">Live Visitors</h2>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center text-text-secondary">
        <p>Real-time visitor monitoring will be built in Section 4.</p>
        <p className="text-xs mt-2">Connect your Supabase credentials and deploy the tracking snippet first.</p>
      </div>
    </div>
  )
}
