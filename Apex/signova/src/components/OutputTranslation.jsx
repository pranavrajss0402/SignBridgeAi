import { Volume2 } from 'lucide-react'
import './OutputTranslation.css'

export default function OutputTranslation({ text = 'Hello, how are you today?' }) {
  const handleSpeak = () => {
    // Mock implementation
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    } else {
      console.log('Speech synthesis not supported in this browser')
    }
  }

  return (
    <section className="output-translation-card">
      <h3 className="card-title">Output Translation</h3>
      
      <div className="translation-content">
        <p className="translation-text">
          {text}
        </p>
        
        <button 
          className="btn-speak"
          onClick={handleSpeak}
          aria-label="Speak result"
        >
          <Volume2 size={20} />
          <span>Speak Result</span>
        </button>
      </div>
    </section>
  )
}
