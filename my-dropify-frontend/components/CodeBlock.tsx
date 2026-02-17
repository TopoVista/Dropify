'use client'

import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

type Props = {
  code: string
  language: string
}

export default function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!codeRef.current) return

    // Prevent re-highlighting issues
    codeRef.current.removeAttribute('data-highlighted')
    hljs.highlightElement(codeRef.current)
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative mb-4 group">

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="
          absolute top-3 right-3
          px-3 py-1
          text-xs font-medium
          rounded-md
          bg-[#1f2937]
          text-[#7aa2f7]
          border border-[#2d333b]
          transition-all duration-300
          opacity-80
          group-hover:opacity-100
          hover:shadow-[0_0_15px_rgba(122,162,247,0.6)]
        "
      >
        {copied ? 'Copied' : 'Copy'}
      </button>

      {/* Code Block */}
      <pre
        className="
          rounded-xl
          text-sm
          p-4 pt-12
          overflow-x-auto
          bg-[#0d1117]
          border border-[#2d333b]
          shadow-[0_0_30px_rgba(122,162,247,0.08)]
        "
      >
        <code
          ref={codeRef}
          className={`language-${language}`}
        >
          {code}
        </code>
      </pre>
    </div>
  )
}
