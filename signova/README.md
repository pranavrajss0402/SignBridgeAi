# Signova AI Interpreter — React Frontend

A pixel-accurate, production-ready React web application for AI-powered Sign Language Interpretation.

## Features

✨ **Live Webcam Interface** — Real-time video capture and display  
✨ **Detection Status Panel** — Live detection results with confidence scores  
✨ **3D Avatar Placeholder** — Ready for integration with AK's 3D avatar module  
✨ **System Log** — Real-time system monitoring and diagnostics  
✨ **Text-to-Speech** — Speak detected signs using browser speech synthesis  
✨ **Responsive Design** — Works seamlessly on desktop, tablet, and mobile  
✨ **Accessibility** — WCAG 2.1 AA compliant with semantic HTML and ARIA labels  
✨ **Production Ready** — Clean component architecture, modular CSS, proper error handling  

## Project Structure

```
signova/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies
├── vite.config.js               # Vite configuration
├── src/
│   ├── main.jsx                 # React root
│   ├── index.css                # Global design system
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # Layout styling
│   ├── components/
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   ├── Sidebar.css
│   │   ├── Header.jsx           # Top header with utilities
│   │   ├── Header.css
│   │   ├── WebcamPanel.jsx      # Main camera interface
│   │   ├── WebcamPanel.css
│   │   ├── DetectionStatus.jsx  # Sign detection results
│   │   ├── DetectionStatus.css
│   │   ├── AvatarPanel.jsx      # 3D avatar placeholder
│   │   ├── AvatarPanel.css
│   │   ├── SystemLog.jsx        # System diagnostics
│   │   ├── SystemLog.css
│   │   ├── OutputTranslation.jsx # Text-to-speech output
│   │   ├── OutputTranslation.css
│   │   ├── Footer.jsx           # Footer information
│   │   └── Footer.css
│   └── pages/
│       ├── Dashboard.jsx        # Main dashboard page
│       └── Dashboard.css
└── README.md
```

## Installation

### Prerequisites

- Node.js 16+ and npm/yarn

### Setup

```bash
# Navigate to project directory
cd signova

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

## Building for Production

```bash
npm run build
npm run preview
```

## Architecture

### Component Hierarchy

```
App
├── Sidebar (Navigation)
├── Header (Utilities)
└── Dashboard (Main Content)
    ├── WebcamPanel
    ├── SystemLog
    ├── DetectionStatus
    ├── AvatarPanel
    ├── OutputTranslation
    └── Footer
```

### State Management

The application uses React hooks (`useState`, `useRef`) for local state management:

- **Webcam State**: Camera active, loading, error states
- **Detection State**: Detected sign, confidence, status
- **UI State**: Mobile menu, session state

### Design System

CSS variables defined in `src/index.css`:

```css
--color-primary-purple: #6B4CE6
--color-accent-green: #00A86B
--color-bg-dark: #2A2A2A
--color-bg-main: #FAFAFA
--radius-md: 12px
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12)
```

## Key Features Explained

### 1. Webcam Integration

The `WebcamPanel` component uses the browser's `navigator.mediaDevices.getUserMedia()` API:

- Requests camera permissions gracefully
- Handles permission denial and device errors
- Cleans up media streams on unmount
- Simulates sign detection with mock data
- Supports start/stop camera controls

### 2. Detection System

Mock detection simulation in `WebcamPanel`:

```javascript
const signs = ['HELLO', 'THANKS', 'SORRY', 'YES', 'NO', 'PLEASE']
// Simulates detection every 3 seconds
```

**Integration Point**: Replace with real API call to PR's AI module.

### 3. Text-to-Speech

The `OutputTranslation` component uses the Web Speech API:

```javascript
const utterance = new SpeechSynthesisUtterance(text)
window.speechSynthesis.speak(utterance)
```

**Integration Point**: Replace with MK's Text-to-Speech backend API.

### 4. Avatar Module

The `AvatarPanel` component is a placeholder container:

```javascript
<AvatarPanel 
  avatarComponent={<YourAvatarComponent />}  // Replace placeholder
  isActive={sessionActive}
/>
```

**Integration Point**: Insert AK's React-based avatar component directly.

## Responsive Breakpoints

| Breakpoint | Use Case | Layout |
|-----------|----------|--------|
| `1440px+` | Large Desktop | 2-column grid (webcam + sidebar) |
| `1025-1440px` | Desktop | 2-column grid, narrower sidebar |
| `913-1024px` | iPad Landscape | 1-column main, 2-column right panel |
| `769-912px` | Tablet | 1-column stacked |
| `481-768px` | Mobile Landscape | 1-column stacked, optimized buttons |
| `0-480px` | Mobile Portrait | 1-column, minimal padding, hidden labels |

## Accessibility

- **Semantic HTML**: Uses `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- **ARIA Labels**: All buttons and interactive elements labeled
- **Keyboard Navigation**: Full keyboard support throughout
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Focus States**: Visible focus indicators on all interactive elements
- **Status Updates**: `aria-live` regions for dynamic content

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- No unnecessary re-renders (React.memo, useCallback where needed)
- Media streams cleaned up on unmount
- Lazy component splitting ready for code-splitting
- CSS Grid for efficient layout calculations
- Minimal animation performance impact

## Future Integrations

### PR — AI Module Integration

```javascript
// In WebcamPanel.jsx
const handleDetectionUpdate = async (frame) => {
  const result = await prAIModule.predictSign(frame)
  onDetectionUpdate(result)
}
```

### MK — Text-to-Speech Backend

```javascript
// In OutputTranslation.jsx
const handleSpeak = async (text) => {
  const audio = await mkTextToSpeechAPI.synthesize(text)
  audio.play()
}
```

### AK — 3D Avatar Component

```javascript
// In Dashboard.jsx
import Avatar3D from '@signova/avatar-module'

<AvatarPanel avatarComponent={<Avatar3D sign={detectionData.sign} />} />
```

## Customization

### Changing Colors

Edit CSS variables in `src/index.css`:

```css
--color-primary-purple: #YOUR_COLOR
--color-accent-green: #YOUR_COLOR
```

### Adjusting Spacing

Modify spacing scale in `src/index.css`:

```css
--spacing-lg: 32px  /* Change from default */
```

### Responsive Breakpoints

Edit media queries in component CSS files (e.g., `WebcamPanel.css`):

```css
@media (max-width: 1024px) {
  /* Your responsive styles */
}
```

## Troubleshooting

### Camera Not Working

1. Check browser permissions (Settings → Privacy → Camera)
2. Verify HTTPS (required for getUserMedia on production)
3. Check console for error messages
4. Try a different browser

### Webcam Lag

1. Check browser performance (DevTools → Performance)
2. Reduce detection update frequency
3. Lower webcam resolution in constraints
4. Close unnecessary browser tabs

### Memory Leaks

1. Verify media streams are cleaned up (check `.stop()` calls)
2. Use React DevTools Profiler to check re-renders
3. Ensure refs are properly cleared on unmount

## Contributing

When adding new features:

1. **Create reusable components** — Avoid monolithic files
2. **Use CSS design system** — Consistency across UI
3. **Add responsive media queries** — Test on multiple devices
4. **Include ARIA labels** — Maintain accessibility
5. **Clean up side effects** — Use cleanup functions in useEffect
6. **Test on mobile** — Use DevTools device emulation

## License

© 2024 Signova AI. All rights reserved.

## Support

For questions or issues:

1. Check the troubleshooting section above
2. Review component prop documentation in JSX files
3. Test on latest browser versions
4. Open an issue with detailed reproduction steps

---

**Ready to integrate with the Signova team's AI, backend, and avatar modules!** 🎉
