import { Camera, MessageSquare } from "lucide-react";
import "./ModeSwitcher.css";

export default function ModeSwitcher({ mode, onModeChange }) {
  return (
    <div className="mode-switcher-wrap">
      <div className="mode-switcher" role="tablist" aria-label="Translation mode">
        <button
          role="tab"
          aria-selected={mode === "sign-to-speech"}
          className={`mode-tab ${mode === "sign-to-speech" ? "active" : ""}`}
          onClick={() => onModeChange("sign-to-speech")}
          id="tab-sign-to-speech"
        >
          <Camera size={16} />
          <span className="mode-tab-label">Sign → Text / Speech</span>
          <span className="mode-tab-desc">Detect signs from webcam</span>
        </button>

        <button
          role="tab"
          aria-selected={mode === "speech-to-avatar"}
          className={`mode-tab ${mode === "speech-to-avatar" ? "active" : ""}`}
          onClick={() => onModeChange("speech-to-avatar")}
          id="tab-speech-to-avatar"
        >
          <MessageSquare size={16} />
          <span className="mode-tab-label">Text / Speech → Avatar</span>
          <span className="mode-tab-desc">Animate 3D avatar from text</span>
        </button>
      </div>
    </div>
  );
}
