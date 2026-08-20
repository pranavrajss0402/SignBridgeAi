import { useEffect, useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import Settings from "./pages/Settings";
import ProfileSettings from "./pages/ProfileSettings";
import DatasetPage from "./pages/DatasetPage";

import "./App.css";

const BACKEND_URL = "http://localhost:5000";
const AI_URL = "http://localhost:8000";

function App() {
  
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sessionActive, setSessionActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [translationMode, setTranslationMode] = useState("sign-to-speech");

 
  const [prediction, setPrediction] = useState({
    text: "Waiting for prediction...",
    confidence: 0,
    type: "none",
  });
  const [threshold, setThreshold] = useState(0.3); 
  const [history, setHistory] = useState([]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sentenceModelEnabled, setSentenceModelEnabled] = useState(true);
  const [sentence, setSentence] = useState("");


  const [backendOnline, setBackendOnline] = useState(false);
  const [aiOnline, setAiOnline] = useState(false);

  const lastSpokenRef = useRef("");
  const lastTimestampRef = useRef("");

 
  const handleStartSession = () => {
    setSessionActive(true);
    setCurrentPage("dashboard");
    setIsMobileMenuOpen(false);
  };

  const handleStopSession = () => {
    setSessionActive(false);
  };

  const handleProfileSettings = () => {
    setCurrentPage("profile");
    setIsMobileMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

 
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/prediction`);
        const data = await response.json();
        setBackendOnline(true);

        if (data.success && data.prediction && data.prediction.text) {
          const newText = data.prediction.text;
          const newConf = data.prediction.confidence;
          const newTime = data.prediction.timestamp;
          const newType = data.prediction.type || "none";

          setPrediction({
            text: newText,
            confidence: newConf,
            type: newType,
          });

          if (
            newConf >= threshold &&
            newText !== "Waiting for prediction..." &&
            newTime !== lastTimestampRef.current
          ) {
            lastTimestampRef.current = newTime;

            if (newText !== lastSpokenRef.current) {
              lastSpokenRef.current = newText;

             
              if (ttsEnabled && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(newText);
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
              }

              
              setHistory((prev) => [
                {
                  text: newText,
                  confidence: newConf,
                  type: newType,
                  timestamp: newTime || new Date().toISOString(),
                },
                ...prev.slice(0, 49),
              ]);
            }
          }
        }
      } catch (error) {
        setBackendOnline(false);
      }
    };

    const fetchSentence = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/sentence`);
        const data = await response.json();
        if (data.success) {
          setSentence(data.sentence || "");
        }
      } catch (error) {
        // silent
      }
    };

    const checkAIHealth = async () => {
      try {
        const response = await fetch(`${AI_URL}/health`);
        const data = await response.json();
        setAiOnline(data.status === "healthy");
      } catch (error) {
        setAiOnline(false);
      }
    };

    let interval;
    let sentenceInterval;
    
    if (sessionActive) {
      interval = setInterval(fetchPrediction, 200);
      sentenceInterval = setInterval(fetchSentence, 600);
    }

    checkAIHealth();
    const healthInterval = setInterval(checkAIHealth, 3000);

    return () => {
      if (interval) clearInterval(interval);
      if (sentenceInterval) clearInterval(sentenceInterval);
      clearInterval(healthInterval);
    };
  }, [threshold, ttsEnabled, sessionActive]);


  const resetSentence = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/sentence/reset`, { method: "POST" });
      setSentence("");
    } catch (e) {
      console.error("Reset failed:", e);
    }
  };

  const backspaceSentence = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sentence/backspace`, { method: "POST" });
      const data = await res.json();
      if (data.success) setSentence(data.sentence || "");
    } catch (e) {
      console.error("Backspace failed:", e);
    }
  };

  const addSpace = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sentence/space`, { method: "POST" });
      const data = await res.json();
      if (data.success) setSentence(data.sentence || "");
    } catch (e) {
      console.error("Space failed:", e);
    }
  };

  const copySentence = () => {
    if (sentence) {
      navigator.clipboard.writeText(sentence);
    }
  };

  const speakSentence = () => {
    if (sentence && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    lastSpokenRef.current = "";
    try {
      await fetch(`${BACKEND_URL}/api/history/clear`, { method: "POST" });
    } catch (e) {
     
    }
  };

 
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "history":
        return <HistoryPage history={history} onClearHistory={clearHistory} />;

      case "settings":
        return (
          <Settings
            threshold={threshold}
            onThresholdChange={setThreshold}
            ttsEnabled={ttsEnabled}
            onTtsToggle={setTtsEnabled}
            sentenceModelEnabled={sentenceModelEnabled}
            onSentenceModelToggle={setSentenceModelEnabled}
            cameraActive={sessionActive}
          />
        );

      case "profile":
        return <ProfileSettings onCancel={() => setCurrentPage("dashboard")} />;

      case "dataset":
        return <DatasetPage />;

      case "dashboard":
      default:
        return (
          <Dashboard
            prediction={prediction}
            sentence={sentence}
            history={history}
            backendOnline={backendOnline}
            aiOnline={aiOnline}
            sessionActive={sessionActive}
            onStartSession={handleStartSession}
            sentenceModelEnabled={sentenceModelEnabled}
            onResetSentence={resetSentence}
            onBackspaceSentence={backspaceSentence}
            onAddSpace={addSpace}
            onCopySentence={copySentence}
            onSpeakSentence={speakSentence}
            // Control cards
            threshold={threshold}
            onThresholdChange={setThreshold}
            ttsEnabled={ttsEnabled}
            onTtsToggle={setTtsEnabled}
            onSentenceModelToggle={setSentenceModelEnabled}
            onClearHistory={clearHistory}
           
            translationMode={translationMode}
            onTranslationModeChange={setTranslationMode}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activePage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsMobileMenuOpen(false);
        }}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
        onMenuToggle={handleMenuToggle}
        isMobileMenuOpen={isMobileMenuOpen}
        backendOnline={backendOnline}
        aiOnline={aiOnline}
        sessionActive={sessionActive}
      />

      <div className="main-wrapper">
        <Header
          onProfileSettings={handleProfileSettings}
          backendOnline={backendOnline}
          aiOnline={aiOnline}
          activePage={currentPage}
        />

        <main className="main-content">
          {renderCurrentPage()}
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default App;