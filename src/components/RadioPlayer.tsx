import { useStreaming } from '../hooks/useStreaming'
import { useFieldSelection } from '../contexts/FieldSelectionContext'

export function RadioPlayer() {
  const { isStreaming, startStreaming, stopStreaming } = useStreaming()
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
    </div>
  )
}
