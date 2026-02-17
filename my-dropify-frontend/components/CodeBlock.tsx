'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

type Props = {
  code: string
  language: string
}

export default function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(122,162,247,0.15)',
      }}
    >
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          right: 14,
          top: 14,
          padding: '6px 12px',
          borderRadius: 20,
          border: '1px solid #2d333b',
          background: copied ? '#22c55e' : '#1f2937',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        wrapLongLines
        customStyle={{
          margin: 0,
          paddingTop: 50,
          borderRadius: 16,
          background: '#0f1117',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
