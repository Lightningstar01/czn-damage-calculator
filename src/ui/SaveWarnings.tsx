// Shown under the header when the browser isn't keeping the owner's data, so it can't go unnoticed.
import { defaultSave } from '../store/save'
import { downloadBackup, downloadUnreadable } from '../store/storage'
import { useStore } from '../store/store'

export function SaveWarnings() {
  const { data, replace, unreadable, saveFailed } = useStore()
  if (unreadable) {
    return (
      <div className="save-warning" role="alert">
        <strong>Your saved data couldn't be opened.</strong> It's still in this browser, but changes you make now won't be saved.
        <div className="muted small">{unreadable.reason}</div>
        <div className="btn-row">
          <button className="btn small" onClick={() => location.reload()}>Reload</button>
          <button className="btn small" onClick={() => downloadUnreadable(unreadable.text)}>Download it</button>
          <button className="btn small danger" onClick={() => {
            if (confirm('Delete the saved data that couldn\'t be opened and start empty? Download it first if you want to keep it.')) replace(defaultSave())
          }}>Start fresh</button>
        </div>
      </div>
    )
  }
  if (saveFailed) {
    return (
      <div className="save-warning" role="alert">
        <strong>This browser isn't saving your changes</strong> (storage is full or blocked). They'll be lost when you close the page.
        <div className="btn-row">
          <button className="btn small" onClick={() => downloadBackup(data)}>Export backup</button>
        </div>
      </div>
    )
  }
  return null
}
