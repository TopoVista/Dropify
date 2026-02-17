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
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current)
    }
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          background: '#1f2937',
          color: '#7aa2f7',
          border: '1px solid #2d333b',
          padding: '4px 10px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>

      <pre
        style={{
          borderRadius: 12,
          fontSize: 14,
          padding: '40px 16px 16px 16px',
          overflowX: 'auto',
          background: '#0d1117',
          border: '1px solid #2d333b',
        }}
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
