import './App.css'
import { useFieldSelection } from './contexts/FieldSelectionContext'
import { ErrorDisplay } from './components/ErrorDisplay'
import { RadioPlayer } from './components/RadioPlayer'
import { TestPanel } from './components/TestPanel'
import { SchemaExplorer } from './components/SchemaExplorer'
import { TimeRangeConfig } from './components/TimeRangeConfig'
import { FieldSelector } from './components/FieldSelector'
import { ConsoleOutput } from './components/ConsoleOutput'

function App() {
  const { error, isLoading, setError } = useFieldSelection()

  return (
    <div className='app-container'>
      {/* Error Display */}
      <ErrorDisplay error={error} onClose={() => setError(null)} />

      {/* Loading Indicator */}
      {isLoading && <div className='info-container'>Loading field keys...</div>}

      {/* Two Column Layout */}
      <div className='two-column-layout'>
        {/* Left Column - Main Actions */}
        <div className='left-column'>
          {/* Main Action Section */}
          <RadioPlayer />

          {/* Test Panels */}
          <TestPanel />
          <SchemaExplorer />

          {/* Console Output Section */}
          <ConsoleOutput />
        </div>

        {/* Right Column - Configuration */}
        <div className='right-column'>
          {/* Time Range Configuration */}
          <TimeRangeConfig />

          {/* Field Selection Section */}
          <FieldSelector />
        </div>
      </div>
    </div>
  )
}

export default App
