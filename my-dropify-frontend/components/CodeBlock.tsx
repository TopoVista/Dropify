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
          background: '#1f1f1f',
          color: '#fff',
          border: '1px solid #444',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: 12,
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
          borderRadius: 8,
          fontSize: 14,
          paddingTop: 40,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
