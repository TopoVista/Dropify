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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameIdRef = useRef<number | null>(null)

  /* ---------------- THREE BACKGROUND ---------------- */
  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.position.z = 50

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    rendererRef.current = renderer

    const particleCount = 150
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
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      const pos = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < particleCount * 3; i += 3) {
        pos[i] += velocities[i]
        pos[i + 1] += velocities[i + 1]
        pos[i + 2] += velocities[i + 2]

        if (Math.abs(pos[i]) > 50) velocities[i] *= -1
        if (Math.abs(pos[i + 1]) > 50) velocities[i + 1] *= -1
        if (Math.abs(pos[i + 2]) > 50) velocities[i + 2] *= -1
      }

      geometry.attributes.position.needsUpdate = true
      particles.rotation.y += 0.0005
      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  /* ---------------- HIGHLIGHT ---------------- */
  useEffect(() => {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  }, [drops])

  /* ---------------- ONLINE STATUS ---------------- */
  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  /* ---------------- COUNTDOWN ---------------- */
  useEffect(() => {
    const i = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(i)
  }, [])

  /* ---------------- LOAD DROPS ---------------- */
  useEffect(() => {
    if (!code) return

    const loadSessionDrops = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops`,
        )
        if (!res.ok) throw new Error()

        const data = await res.json()

        if (Array.isArray(data)) {
          setDrops(data)
          await saveDrops(code, data)
        } else {
          setDrops([])
        }
      } catch {
        const cached = await loadDrops(code)
        if (Array.isArray(cached)) {
          setDrops(cached)
        } else {
          setDrops([])
        }
      }
    }

    loadSessionDrops()
  }, [code])

  /* ---------------- WEBSOCKET ---------------- */
  const handleMessage = useCallback(
    (msg: any) => {
      if (!code) return

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

  /* ---------------- SEND ---------------- */
  const handleSend = async (text: string, type: 'text' | 'code') => {
    if (!code) return
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops/text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, drop_type: type }),
      },
    )
  }

  const handleCopy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const getRemainingTime = (expires_at?: string | null) => {
    if (!expires_at) return null
    const diff = new Date(expires_at).getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    return `${Math.floor(diff / 1000)}s`
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="relative min-h-screen bg-[#0f1117] text-[#e6edf3] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      <div className="relative z-10 px-6 py-10 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-white">Drop Session</h1>
            <div className="font-mono text-[#7aa2f7]">{code}</div>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-[#1f2937] border border-[#2d333b] hover:bg-[#273244] transition"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="p-5 bg-[#161b22]/80 backdrop-blur-xl border border-[#2d333b] rounded-xl shadow-[0_0_30px_rgba(122,162,247,0.2)]">
                <img
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/qrcode`}
                  width={200}
                  height={200}
                  alt="QR"
                />
              </div>
            </div>

            <DropInput onSend={handleSend} />
            {code && <FileDropInput sessionCode={code} />}
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-6">
            {drops.length === 0 && (
              <div className="p-8 text-center border border-dashed border-[#2d333b] rounded-xl text-gray-500">
                No drops yet
              </div>
            )}

            {drops.map((d) => (
              <div
                key={d.id}
                className="bg-[#161b22]/80 backdrop-blur-xl border border-[#2d333b] rounded-xl p-5 shadow-md"
              >
                {d.type === 'text' && <p>{d.content}</p>}

                {d.type === 'code' && (
                  <pre className="rounded-lg overflow-auto">
                    <code className="language-javascript">{d.content}</code>
                  </pre>
                )}

                {d.type === 'file' && d.path && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${d.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7aa2f7]"
                  >
                    Download File
                  </a>
                )}

                {d.expires_at && (
                  <div className="mt-3 text-sm text-gray-500">
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
