import { useEffect, useRef, useState } from 'react'

// 3D の映像シーンを描くキャンバス。three.js は重いので必要になってから読み込む
const load = () => import('./scene')

export function preloadScenes() {
  load()
}

export default function SceneView({ event, active }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const builtRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onResize = () => stageRef.current?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      stageRef.current?.dispose()
      stageRef.current = null
      builtRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active || !event) {
      stageRef.current?.stop()
      return
    }
    let dead = false
    load()
      .then(({ Stage, buildScene }) => {
        if (dead) return
        const stage = (stageRef.current ??= new Stage(canvasRef.current))
        if (builtRef.current !== event.id) {
          buildScene(stage, event)
          builtRef.current = event.id
        }
        stage.play()
        if (import.meta.env.DEV) window.__stage = stage
      })
      .catch((e) => {
        console.error(e)
        setFailed(true)
      })
    return () => {
      dead = true
    }
  }, [event, active])

  return (
    <div className={'scene' + (active && !failed ? ' on' : '')} aria-hidden={!active}>
      <canvas ref={canvasRef} />
    </div>
  )
}
