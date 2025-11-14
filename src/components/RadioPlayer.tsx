import { useStreaming } from '../hooks/useStreaming'
import { useFieldSelection } from '../contexts/useFieldSelection'

export function RadioPlayer() {
  const {
    isStreaming,
    startStreaming,
    stopStreaming,
    isMidiStreaming,
    startMidiStreaming,
    stopMidiStreaming,
    isMidiPlaying
  } = useStreaming()
  const { selectedFields } = useFieldSelection()

  return (
    <div className='section-container'>
      <div className='section-title'>📻 Radio sinfonia biotica</div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
        <button
          onClick={isStreaming ? stopStreaming : startStreaming}
          disabled={!isStreaming && selectedFields.length === 0}
        >
          {isStreaming ? '⏹️ Stop Stream' : '▶️ Stream fields'}
        </button>
        <button
          onClick={isMidiStreaming || isMidiPlaying ? stopMidiStreaming : startMidiStreaming}
          disabled={!isMidiStreaming && !isMidiPlaying && selectedFields.length === 0}
        >
          {isMidiStreaming || isMidiPlaying ? '⏹️ Stop midi' : '▶️ Stream midi radio'}
        </button>
      </div>
    </div>
  )
}
