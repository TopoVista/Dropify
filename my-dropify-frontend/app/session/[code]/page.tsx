'use client'

import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import DropInput from '@/components/DropInput'
import { useWebSocket } from '@/lib/useWebSocket'
import FileDropInput from '@/components/FileDropInput'
import { saveDrops, loadDrops } from '@/lib/db'
import * as THREE from 'three'

type DropType = {
  id: number
  type: 'text' | 'code' | 'file'
  content?: string
  path?: string
  created_at: string
  expires_at?: string | null
}

export default function SessionPage() {
  const params = useParams()
  const code = params?.code as string | undefined

  const [drops, setDrops] = useState<DropType[]>([])
  const [copied, setCopied] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [, forceTick] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameIdRef = useRef<number>()

  /* ---------------------------
     THREE.JS BACKGROUND
  ----------------------------*/
  useEffect(() => {
    if (!canvasRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 50

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: false, // Disable for performance
      powerPreference: 'low-power' // Optimize for battery/performance
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Cap pixel ratio for performance
    rendererRef.current = renderer

    // Optimized particle system (reduced count)
    const particleCount = 150 // Reduced from typical 1000+
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100
      positions[i + 1] = (Math.random() - 0.5) * 100
      positions[i + 2] = (Math.random() - 0.5) * 100
      
      velocities[i] = (Math.random() - 0.5) * 0.02
      velocities[i + 1] = (Math.random() - 0.5) * 0.02
      velocities[i + 2] = (Math.random() - 0.5) * 0.02
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x7aa2f7,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Ambient light for subtle glow
    const ambientLight = new THREE.AmbientLight(0x7aa2f7, 0.3)
    scene.add(ambientLight)

    // Animation loop
    let frameCount = 0
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)
      frameCount++

      // Update every other frame for 30fps (better performance)
      if (frameCount % 2 === 0) {
        const positions = geometry.attributes.position.array as Float32Array

        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] += velocities[i]
          positions[i + 1] += velocities[i + 1]
          positions[i + 2] += velocities[i + 2]

          // Boundary check and bounce
          if (Math.abs(positions[i]) > 50) velocities[i] *= -1
          if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1
          if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1
        }

        geometry.attributes.position.needsUpdate = true
        particles.rotation.y += 0.0005
        
        renderer.render(scene, camera)
      }
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!rendererRef.current) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  /* ---------------------------
     highlight.js (SAFE)
  ----------------------------*/
  useEffect(() => {
    if (typeof window === 'undefined') return

    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  }, [drops])

  /* ---------------------------
     ONLINE / OFFLINE
  ----------------------------*/
  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine)
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  /* ---------------------------
     COUNTDOWN TICK
  ----------------------------*/
  useEffect(() => {
    const interval = setInterval(() => {
      forceTick((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  /* ---------------------------
     LOAD DROPS
  ----------------------------*/
  useEffect(() => {
    if (!code) return

    const loadSessionDrops = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops`,
        )
        if (!res.ok) throw new Error()
        const data = await res.json()
        setDrops(data)
        await saveDrops(code, data)
      } catch {
        const cached = await loadDrops(code)
        if (cached) setDrops(cached)
      }
    }

    loadSessionDrops()
  }, [code])

  /* ---------------------------
     WEBSOCKET EVENTS
  ----------------------------*/
  const handleMessage = useCallback(
    (msg: any) => {
      if (!code) return

      if (msg?.event === 'DELETE_DROP') {
        setDrops((prev) => {
          const updated = prev.filter((d) => d.id !== msg.id)
          saveDrops(code, updated)
          return updated
        })
        return
      }

      if (msg?.event === 'NEW_DROP') {
        const newDrop: DropType = {
          id: msg.id,
          type: msg.type,
          content: msg.content,
          path: msg.path,
          created_at: msg.created_at,
          expires_at: msg.expires_at,
        }

        setDrops((prev) => {
          const updated = [...prev, newDrop]
          saveDrops(code, updated)
          return updated
        })
      }
    },
    [code],
  )

  useWebSocket(code, handleMessage)

  /* ---------------------------
     SEND DROP
  ----------------------------*/
  const handleSend = async (text: string, type: 'text' | 'code') => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops/text`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: text,
            drop_type: type,
          }),
        },
      )
    } catch {
      alert('Offline.')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const getRemainingTime = (expires_at?: string | null) => {
    if (!expires_at) return null
    const expiry = new Date(expires_at).getTime()
    const diff = expiry - Date.now()
    if (isNaN(expiry) || diff <= 0) return 'Expired'
    return `${Math.floor(diff / 1000)}s`
  }

  /* ---------------------------
     UI
  ----------------------------*/
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f1117',
        padding: '40px 20px',
        color: '#e6edf3',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Three.js Canvas Background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            animation: 'fadeInDown 0.6s ease-out',
          }}
        >
          <div>
            <h1 
              style={{ 
                fontSize: '28px', 
                fontWeight: 600,
                textShadow: '0 0 20px rgba(122, 162, 247, 0.5)',
              }}
            >
              Drop Session
            </h1>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#7aa2f7',
                textShadow: '0 0 10px rgba(122, 162, 247, 0.3)',
              }}
            >
              {code}
            </div>
          </div>

          <button
            onClick={handleCopy}
            style={{
              padding: '10px 18px',
              background: copied ? '#22c55e' : '#1f2937',
              color: '#fff',
              border: '1px solid #2d333b',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: copied ? '0 0 20px rgba(34, 197, 94, 0.4)' : '0 0 10px rgba(122, 162, 247, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(122, 162, 247, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = copied ? '0 0 20px rgba(34, 197, 94, 0.4)' : '0 0 10px rgba(122, 162, 247, 0.2)'
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {isOffline && (
          <div
            style={{
              background: '#2d1f1f',
              border: '1px solid #3f2a2a',
              padding: 12,
              borderRadius: 8,
              marginBottom: 30,
              color: '#f87171',
              boxShadow: '0 0 20px rgba(248, 113, 113, 0.3)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            You are offline
          </div>
        )}

        {/* QR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 40,
            animation: 'floatIn 0.8s ease-out',
          }}
        >
          <div
            style={{
              padding: 20,
              background: 'rgba(22, 27, 34, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12,
              border: '1px solid #2d333b',
              boxShadow: '0 0 30px rgba(122, 162, 247, 0.2)',
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            <img
              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/qrcode`}
              width={180}
              height={180}
              alt="QR"
              style={{ display: 'block' }}
            />
          </div>
        </div>

        <div style={{ animation: 'fadeIn 1s ease-out' }}>
          <DropInput onSend={handleSend} />
        </div>
        <div style={{ height: 20 }} />
        <div style={{ animation: 'fadeIn 1.2s ease-out' }}>
          <FileDropInput sessionCode={code} />
        </div>

        <div style={{ marginTop: 50 }}>
          {drops.length === 0 && (
            <div
              style={{
                padding: 30,
                border: '1px dashed #2d333b',
                borderRadius: 12,
                textAlign: 'center',
                color: '#6b7280',
                background: 'rgba(22, 27, 34, 0.5)',
                backdropFilter: 'blur(10px)',
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              No drops yet
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {drops.map((d, index) => (
              <div
                key={d.id}
                style={{
                  background: 'rgba(22, 27, 34, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #2d333b',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  animation: `slideIn 0.5s ease-out ${index * 0.1}s backwards`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(122, 162, 247, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                {d.type === 'file' && d.path && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${d.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#7aa2f7',
                      textDecoration: 'none',
                      fontWeight: 500,
                      textShadow: '0 0 10px rgba(122, 162, 247, 0.5)',
                    }}
                  >
                    Download File
                  </a>
                )}

                {d.type === 'text' && (
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                    {d.content}
                  </p>
                )}

                {d.type === 'code' && (
                  <pre style={{ borderRadius: 8, overflow: 'auto', margin: 0 }}>
                    <code className="language-javascript">
                      {d.content}
                    </code>
                  </pre>
                )}

                {d.expires_at && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: '#6b7280',
                    }}
                  >
                    Expires in: {getRemainingTime(d.expires_at)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}