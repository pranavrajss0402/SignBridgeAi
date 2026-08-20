import './Footer.css'

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className="footer-info">© 2024 Signova AI. v2.4.0</span>
      </div>
      
      <div className="footer-center">
        <span className="footer-status">
          <span className="status-dot" />
          System Status: Healthy
        </span>
      </div>
      
      <div className="footer-right">
        <a href="#" className="footer-link">
          Privacy Policy
        </a>
      </div>
    </footer>
  )
}
