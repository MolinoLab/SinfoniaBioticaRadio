import './App.css'
import { playTone } from './libs/tone'

function App() {
  return (
    <>
      <button onClick={playTone}>play</button>
    </>
  )
}

export default App
