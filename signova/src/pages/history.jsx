import './History.css'

export default function History() {
  return (
    <section className="history-page">

      <div className="history-header">
        <h1 className="history-title">
          History
        </h1>

        <p className="history-subtitle">
          View your previous Signova interpretation sessions.
        </p>
      </div>

      <div className="history-container">

        <div className="history-item">
          <div className="history-info">
            <h3 className="history-item-title">
              Sign Language Session
            </h3>

            <p className="history-item-details">
              Today • 15:22 • 30 FPS
            </p>
          </div>

          <span className="history-status">
            Completed
          </span>
        </div>

        <div className="history-item">
          <div className="history-info">
            <h3 className="history-item-title">
              Sign Language Session
            </h3>

            <p className="history-item-details">
              Yesterday • 18:45 • 30 FPS
            </p>
          </div>

          <span className="history-status">
            Completed
          </span>
        </div>

        <div className="history-item">
          <div className="history-info">
            <h3 className="history-item-title">
              Sign Language Session
            </h3>

            <p className="history-item-details">
              Yesterday • 14:10 • 30 FPS
            </p>
          </div>

          <span className="history-status">
            Completed
          </span>
        </div>

      </div>

    </section>
  )
}