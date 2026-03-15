import { ShoppingCart } from 'lucide-react'

export default function Abandonment() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart size={20} className="text-negative" />
        <h2 className="text-xl font-semibold">Abandonment Analysis</h2>
      </div>
      <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center text-text-secondary">
        <p>Abandonment analysis will be built in Section 7.</p>
      </div>
    </div>
  )
}
