import './PredictionCard.css';

const EMOJI_MAP = {
  'A LOT': '🔢', 'ABUSE': '⚠️', 'AFRAID': '😨', 'AGREE': '🤝', 'ALL': '🌐',
  'ANGRY': '😡', 'ANYTHING': '🤷', 'APPRECIATE': '👏', 'BAD': '👎', 'BEAUTIFUL': '✨',
  'BECOME': '🌱', 'BED': '🛏️', 'BORED': '😑', 'BRING': '🤲', 'CHAT': '💬',
  'CLASS': '🏫', 'COLD': '🥶', 'COLLEGE_SCHOOL': '🎓', 'COMB': '🪮', 'COME': '👋',
  'CONGRATULATIONS': '🎉', 'CRYING': '😭', 'DARE': '⚡', 'DIFFERENCE': '⚖️', 'DILEMMA': '🤔',
  'DISAPPOINTED': '😞', 'DO': '🛠️', "DON'T CARE": '🙄', 'ENJOY': '😊', 'FAVOUR': '🙏',
  'FEVER': '🤒', 'FINE': '👌', 'FOOD': '🍔', 'FREE': '🕊️', 'FRIEND': '🧑‍🤝‍🧑',
  'FROM': '📍', 'GO': '🚶', 'GOOD': '👍', 'GRATEFUL': '🙇', 'HAD': '⏮️',
  'HAPPENED': '❓', 'HAPPY': '😄', 'HEAR': '👂', 'HEART': '❤️', 'HELLO_HI': '👋',
  'HELP': '🆘', 'HIDING': '🫣', 'HOW': '❔', 'HUNGRY': '😋', 'HURT': '🤕',
  'I_ME_MINE_MY': '👤', 'KIND': '😇', 'LEAVE': '🚪', 'LIKE': '👍', 'LIKE_LOVE': '💖',
  'MEAN IT': '💯', 'MEDICINE': '💊', 'MEET': '🤝', 'NAME': '🏷️', 'NICE': '😊',
  'NOT': '❌', 'NUMBER': '🔢', 'OLD_AGE': '🧓', 'ON THE WAY': '🏃', 'OUTSIDE': '🌳',
  'PHONE': '📞', 'PLACE': '🗺️', 'PLEASE': '🥺', 'POUR': '🥛', 'PREPARE': '🍳',
  'PROMISE': '🤙', 'REALLY': '❗', 'REPEAT': '🔁', 'ROOM': '🚪', 'SERVE': '🍽️',
  'SHIRT': '👕', 'SITTING': '🪑', 'SLEEP': '😴', 'SLOWER': '⏳', 'SO MUCH': '📦',
  'SOFTLY': '🤫', 'SOME HOW': '🤷', 'SOME ONE': '👤', 'SOMETHING': '❔', 'SORRY': '🙏',
  'SPEAK': '🗣️', 'STOP': '🛑', 'STUBBORN': '😤', 'SURE': '✅', 'TAKE CARE': '🫂',
  'TAKE TIME': '⏱️', 'TALK': '💬', 'TELL': '🗣️', 'THANK': '🙏', 'THAT': '👉',
  'THINGS': '📦', 'THINK': '💭', 'THIRSTY': '🥛', 'TIRED': '😫', 'TODAY': '📅',
  'TRAIN': '🚆', 'TRUST': '🤝', 'TRUTH': '👁️', 'TURN ON': '💡', 'UNDERSTAND': '💡',
  'WANT': '🤲', 'WATER': '💧', 'WEAR': '🧥', 'WELCOME': '🙏', 'WHAT': '❓',
  'WHERE': '📍', 'WHO': '👤', 'WORRY': '😟', 'YOU': '👉'
};

function PredictionCard({ prediction, threshold }) {
  // Guard against null/undefined prediction
  if (!prediction) {
    prediction = { text: "", confidence: 0, type: "none" };
  }

  const rawText = prediction.text || "";
  const isWaiting = rawText === "" || rawText === "Waiting for prediction...";
  const isHighConfidence = !isWaiting && (prediction.confidence ?? 0) >= threshold;
  const displayText = isHighConfidence ? rawText : "Listening...";
  const predType = prediction.type || "none";

  const upperText = displayText ? displayText.toUpperCase().trim() : "";
  const emoji = isHighConfidence ? (EMOJI_MAP[upperText] || "") : "";

  const formattedText = displayText
    ? (emoji ? `${emoji} ` : "") + (displayText.charAt(0).toUpperCase() + displayText.slice(1))
    : "";

  // Badge config per type
  const badgeConfig = {
    letter:   { label: "🔤 Letter",   className: "badge-letter" },
    word:     { label: "📝 Word",     className: "badge-word" },
    sentence: { label: "💬 Sentence", className: "badge-sentence" },
    gesture:  { label: "👋 Gesture",  className: "badge-gesture" },
    none:     { label: "⏳ Waiting",  className: "badge-none" },
    unknown:  { label: "❓ Unknown",  className: "badge-none" },
  };

  const badge = badgeConfig[predType] || badgeConfig.none;

  return (
    <div className="glass-card prediction-card">
      <h3>Detected Sign</h3>

      <span className={`prediction-type-badge ${badge.className}`}>
        {badge.label}
      </span>

      <div className={`prediction-text ${isHighConfidence ? "confident" : "listening"}`}>
        {formattedText}
      </div>

      <div className="prediction-meta">
        <span>Threshold: {Math.round(threshold * 100)}%</span>
        <span>
          Current: {prediction.confidence ? `${Math.round(prediction.confidence * 100)}%` : "0%"}
        </span>
      </div>
    </div>
  );
}

export default PredictionCard;