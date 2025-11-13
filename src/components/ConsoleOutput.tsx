import { useEffect, useRef } from 'react'

import { useConsole } from '../contexts/useConsole'

export function ConsoleOutput() {
  const { consoleOutput, clearConsole } = useConsole()
  const consoleBoxRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (consoleBoxRef.current) {
      consoleBoxRef.current.scrollTop = consoleBoxRef.current.scrollHeight
    }
  }, [consoleOutput])

  return (
    <div className='section-container'>
      <div className='section-title'>
        💻 Console Output
        <button onClick={clearConsole} className='clear-console-btn'>
          Clear
        </button>
      </div>
      <div className='console-box' ref={consoleBoxRef}>
        {consoleOutput.length === 0 ? (
          <div className='console-empty'>Console is empty. Run a query to see results...</div>
        ) : (
          consoleOutput.map((log, index) => (
            <div key={index} className={`console-line console-${log.type}`}>
              <span className='console-timestamp'>[{log.timestamp}]</span>
              <span className='console-message'>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
