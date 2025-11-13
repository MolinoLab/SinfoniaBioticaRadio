import { useStreaming } from '../hooks/useStreaming'
import { useFieldSelection } from '../contexts/useFieldSelection'

export function RadioPlayer() {
  const {
    isStreaming,
    startStreaming,
    stopStreaming,
    isMidiStreaming,
    startMidiStreaming,
    stopMidiStreaming
  } = useStreaming()
  const { selectedFields } = useFieldSelection()

  return (
    <div className='section-container'>
      <div className='section-title'>📻 Radio sinfonia biotica</div>
      <button
        onClick={isStreaming ? stopStreaming : startStreaming}
        disabled={!isStreaming && selectedFields.length === 0}
      >
        {isStreaming ? '⏹️ Stop Stream' : '▶️ Stream fields'}
      </button>
      <button
        onClick={isMidiStreaming ? stopMidiStreaming : startMidiStreaming}
        disabled={!isMidiStreaming && selectedFields.length === 0}
      >
        {isMidiStreaming ? '⏹️ Stop midi' : '▶️ Stream midi radio'}
      </button>
    </div>
  )
}
