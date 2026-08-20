import { useState } from 'react'
import { Volume2, Copy, Check } from 'lucide-react'
import './OutputPanel.css'

export default function OutputTranslation({ sentence, onSpeak, onCopy, onBackspace, onSpace, onReset }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof onCopy === 'function') onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="output-translation-card">
      <h3 className="output-card-title">📝 Built Sentence</h3>

      <div className="translation-content">
        <div className={`translation-text-box ${!sentence ? 'empty' : ''}`}>
          {sentence || 'Detected letters and words will appear here...'}
          {<span className="translation-cursor" />}
        </div>

        <div className="translation-actions">
          <button className="sentence-btn" onClick={onBackspace} title="Remove last character">
            ⌫ Back
          </button>
          <button className="sentence-btn" onClick={onSpace} title="Insert space">
            ␣ Space
          </button>
          <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="btn-speak" onClick={onSpeak} title="Read aloud">
            <Volume2 size={14} />
            Speak
          </button>
          <button className="sentence-btn danger" onClick={onReset} title="Clear">
            🗑 Clear
          </button>
        </div>
      </div>
    </section>
  )
}
