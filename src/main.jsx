import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SceneView from './SceneView.jsx'
import { EVENTS } from './data/events'

// 開発用: ?scene=12 で 12 番目の映像シーンだけを全画面で確認できる
const only = new URLSearchParams(location.search).get('scene')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {only != null ? (
      <div className="app scene-only">
        <SceneView event={EVENTS[Number(only)]} active />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
)
