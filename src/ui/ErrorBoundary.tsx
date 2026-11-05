// Shown instead of the page when it crashes (a white page would come back on every reload), so the data can still be saved.
import { Component, type ReactNode } from 'react'
import { downloadStored, readCopy, restoreCopy } from '../store/storage'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const copy = readCopy()
    return (
      <main className="app">
        <div className="save-warning" role="alert">
          <strong>Something went wrong and the page can't be shown.</strong> Your data is still in this browser. Download it to keep it
          safe; it also shows what went wrong.
          <div className="muted small">{error.message}</div>
          <div className="btn-row">
            <button className="btn small" onClick={() => location.reload()}>Reload</button>
            <button className="btn small" onClick={downloadStored}>Download my data</button>
            {copy && (
              <button className="btn small" onClick={() => {
                if (confirm(`Go back to your data from before ${copy.reason} (${new Date(copy.at).toLocaleString()})? What's stored now becomes the undo copy.`)) restoreCopy()
              }}>Restore the undo copy</button>
            )}
          </div>
        </div>
      </main>
    )
  }
}
