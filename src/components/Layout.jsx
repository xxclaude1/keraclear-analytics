import { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function GalaxyCanvas() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight

    const STAR_COUNT = 300
    const stars = []
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * w * 3,
        y: (Math.random() - 0.5) * h * 3,
        z: Math.random() * 1500 + 100,
        size: Math.random() * 1.0 + 0.5,
        baseColor: ['#ffffff', '#aaccff', '#ffddaa', '#aaaaff', '#ffaacc'][Math.floor(Math.random() * 5)],
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
      })
    }

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    function draw() {
      const now = Date.now()
      const time = now / 1000

      ctx.fillStyle = '#0A0A0B'
      ctx.fillRect(0, 0, w, h)

      for (const star of stars) {
        star.z -= 0.3
        if (star.z <= 0) {
          star.z = 1500
          star.x = (Math.random() - 0.5) * w * 3
          star.y = (Math.random() - 0.5) * h * 3
        }

        const sx = (star.x / star.z) * (w / 2) + w / 2
        const sy = (star.y / star.z) * (h / 2) + h / 2
        const r = Math.max(0.3, (1 - star.z / 1500) * star.size * 1.8)
        let alpha = Math.min(1, (1 - star.z / 1500) * 1.5)

        const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset)
        alpha *= 0.35 * twinkle

        const purplePulse = Math.sin(time * 1.2 + star.twinkleOffset * 3)
        let color = star.baseColor
        if (purplePulse > 0.7) {
          color = '#A855F7'
          alpha *= 1.5
        }

        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Subtle nebula corners
      const nebulaAlpha = 0.04 + 0.02 * Math.sin(time * 0.5)
      const g1 = ctx.createRadialGradient(0, h, 0, 0, h, w * 0.6)
      g1.addColorStop(0, `rgba(139, 92, 246, ${nebulaAlpha})`)
      g1.addColorStop(0.5, `rgba(59, 130, 246, ${nebulaAlpha * 0.5})`)
      g1.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g1
      ctx.fillRect(0, 0, w, h)

      const g2 = ctx.createRadialGradient(w, 0, 0, w, 0, w * 0.5)
      g2.addColorStop(0, `rgba(168, 85, 247, ${nebulaAlpha * 0.7})`)
      g2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, w, h)

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
}

export default function Layout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTimeout(() => setReady(true), 100)
  }, [])

  return (
    <>
      <GalaxyCanvas />
      <div className={`app-layout ${ready ? 'entered' : ''}`}>
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
