import { useState } from 'react'
import { Search, Info } from 'lucide-react'
import './DatasetPage.css'

// Complete word list parsed from available_words.csv to meet "full words in the dataset" requirement
const DATASET_WORDS = [
  { name: 'A LOT', samples: 4, emoji: '🔢' },
  { name: 'ABUSE', samples: 5, emoji: '⚠️' },
  { name: 'AFRAID', samples: 6, emoji: '😨' },
  { name: 'AGREE', samples: 7, emoji: '🤝' },
  { name: 'ALL', samples: 4, emoji: '🌐' },
  { name: 'ANGRY', samples: 10, emoji: '😡' },
  { name: 'ANYTHING', samples: 4, emoji: '🤷' },
  { name: 'APPRECIATE', samples: 5, emoji: '👏' },
  { name: 'BAD', samples: 5, emoji: '👎' },
  { name: 'BEAUTIFUL', samples: 5, emoji: '✨' },
  { name: 'BECOME', samples: 5, emoji: '🌱' },
  { name: 'BED', samples: 7, emoji: '🛏️' },
  { name: 'BORED', samples: 6, emoji: '😑' },
  { name: 'BRING', samples: 7, emoji: '🤲' },
  { name: 'CHAT', samples: 6, emoji: '💬' },
  { name: 'CLASS', samples: 5, emoji: '🏫' },
  { name: 'COLD', samples: 7, emoji: '🥶' },
  { name: 'COLLEGE_SCHOOL', samples: 18, emoji: '🎓' },
  { name: 'COMB', samples: 7, emoji: '🪮' },
  { name: 'COME', samples: 6, emoji: '👋' },
  { name: 'CONGRATULATIONS', samples: 7, emoji: '🎉' },
  { name: 'CRYING', samples: 13, emoji: '😭' },
  { name: 'DARE', samples: 6, emoji: '⚡' },
  { name: 'DIFFERENCE', samples: 5, emoji: '⚖️' },
  { name: 'DILEMMA', samples: 6, emoji: '🤔' },
  { name: 'DISAPPOINTED', samples: 6, emoji: '😞' },
  { name: 'DO', samples: 12, emoji: '🛠️' },
  { name: 'DON\'T CARE', samples: 3, emoji: '🙄' },
  { name: 'ENJOY', samples: 4, emoji: '😊' },
  { name: 'FAVOUR', samples: 4, emoji: '🙏' },
  { name: 'FEVER', samples: 7, emoji: '🤒' },
  { name: 'FINE', samples: 6, emoji: '👌' },
  { name: 'FOOD', samples: 23, emoji: '🍔' },
  { name: 'FREE', samples: 7, emoji: '🕊️' },
  { name: 'FRIEND', samples: 6, emoji: '🧑‍🤝‍🧑' },
  { name: 'FROM', samples: 7, emoji: '📍' },
  { name: 'GO', samples: 9, emoji: '🚶' },
  { name: 'GOOD', samples: 7, emoji: '👍' },
  { name: 'GRATEFUL', samples: 6, emoji: '🙇' },
  { name: 'HAD', samples: 4, emoji: '⏮️' },
  { name: 'HAPPENED', samples: 5, emoji: '❓' },
  { name: 'HAPPY', samples: 5, emoji: '😄' },
  { name: 'HEAR', samples: 7, emoji: '👂' },
  { name: 'HEART', samples: 6, emoji: '❤️' },
  { name: 'HELLO_HI', samples: 4, emoji: '👋' },
  { name: 'HELP', samples: 26, emoji: '🆘' },
  { name: 'HIDING', samples: 6, emoji: '🫣' },
  { name: 'HOW', samples: 20, emoji: '❔' },
  { name: 'HUNGRY', samples: 7, emoji: '😋' },
  { name: 'HURT', samples: 14, emoji: '🤕' },
  { name: 'I_ME_MINE_MY', samples: 97, emoji: '👤' },
  { name: 'KIND', samples: 7, emoji: '😇' },
  { name: 'LEAVE', samples: 5, emoji: '🚪' },
  { name: 'LIKE', samples: 6, emoji: '👍' },
  { name: 'LIKE_LOVE', samples: 7, emoji: '💖' },
  { name: 'MEAN IT', samples: 3, emoji: '💯' },
  { name: 'MEDICINE', samples: 6, emoji: '💊' },
  { name: 'MEET', samples: 5, emoji: '🤝' },
  { name: 'NAME', samples: 7, emoji: '🏷️' },
  { name: 'NICE', samples: 15, emoji: '😊' },
  { name: 'NOT', samples: 16, emoji: '❌' },
  { name: 'NUMBER', samples: 8, emoji: '🔢' },
  { name: 'OLD_AGE', samples: 12, emoji: '🧓' },
  { name: 'ON THE WAY', samples: 3, emoji: '🏃' },
  { name: 'OUTSIDE', samples: 6, emoji: '🌳' },
  { name: 'PHONE', samples: 7, emoji: '📞' },
  { name: 'PLACE', samples: 4, emoji: '🗺️' },
  { name: 'PLEASE', samples: 2, emoji: '🥺' },
  { name: 'POUR', samples: 7, emoji: '🥛' },
  { name: 'PREPARE', samples: 6, emoji: '🍳' },
  { name: 'PROMISE', samples: 7, emoji: '🤙' },
  { name: 'REALLY', samples: 12, emoji: '❗' },
  { name: 'REPEAT', samples: 6, emoji: '🔁' },
  { name: 'ROOM', samples: 8, emoji: '🚪' },
  { name: 'SERVE', samples: 7, emoji: '🍽️' },
  { name: 'SHIRT', samples: 7, emoji: '👕' },
  { name: 'SITTING', samples: 5, emoji: '🪑' },
  { name: 'SLEEP', samples: 5, emoji: '😴' },
  { name: 'SLOWER', samples: 5, emoji: '⏳' },
  { name: 'SO MUCH', samples: 7, emoji: '📦' },
  { name: 'SOFTLY', samples: 5, emoji: '🤫' },
  { name: 'SOME HOW', samples: 7, emoji: '🤷' },
  { name: 'SOME ONE', samples: 10, emoji: '👤' },
  { name: 'SOMETHING', samples: 3, emoji: '❔' },
  { name: 'SORRY', samples: 6, emoji: '🙏' },
  { name: 'SPEAK', samples: 5, emoji: '🗣️' },
  { name: 'STOP', samples: 6, emoji: '🛑' },
  { name: 'STUBBORN', samples: 5, emoji: '😤' },
  { name: 'SURE', samples: 6, emoji: '✅' },
  { name: 'TAKE CARE', samples: 8, emoji: '🫂' },
  { name: 'TAKE TIME', samples: 7, emoji: '⏱️' },
  { name: 'TALK', samples: 7, emoji: '💬' },
  { name: 'TELL', samples: 9, emoji: '🗣️' },
  { name: 'THANK', samples: 14, emoji: '🙏' },
  { name: 'THAT', samples: 12, emoji: '👉' },
  { name: 'THINGS', samples: 3, emoji: '📦' },
  { name: 'THINK', samples: 7, emoji: '💭' },
  { name: 'THIRSTY', samples: 7, emoji: '🥛' },
  { name: 'TIRED', samples: 6, emoji: '😫' },
  { name: 'TODAY', samples: 7, emoji: '📅' },
  { name: 'TRAIN', samples: 5, emoji: '🚆' },
  { name: 'TRUST', samples: 4, emoji: '🤝' },
  { name: 'TRUTH', samples: 4, emoji: '👁️' },
  { name: 'TURN ON', samples: 6, emoji: '💡' },
  { name: 'UNDERSTAND', samples: 5, emoji: '💡' },
  { name: 'WANT', samples: 5, emoji: '🤲' },
  { name: 'WATER', samples: 21, emoji: '💧' },
  { name: 'WEAR', samples: 7, emoji: '🧥' },
  { name: 'WELCOME', samples: 5, emoji: '🙏' },
  { name: 'WHAT', samples: 31, emoji: '❓' },
  { name: 'WHERE', samples: 7, emoji: '📍' },
  { name: 'WHO', samples: 7, emoji: '👤' },
  { name: 'WORRY', samples: 4, emoji: '😟' },
  { name: 'YOU', samples: 110, emoji: '👉' }
]

export default function DatasetPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredWords = DATASET_WORDS.filter((word) =>
    word.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <section className="dataset-page">
      <div className="dataset-header">
        <h1 className="dataset-title">Supported Sign Dataset</h1>
        <p className="dataset-subtitle">
          Browse the complete list of 113 Indian Sign Language signs supported by the Signova model.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <div className="search-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search words in dataset (e.g. WATER, FEVER, HELP)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>



        <div className="words-grid">
          {filteredWords.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No matches found for &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredWords.map((word, idx) => (
              <div key={idx} className="word-badge-card">
                <span className="word-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{word.emoji}</span>
                  {word.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
