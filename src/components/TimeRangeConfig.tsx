import { useFieldSelection } from '../contexts/FieldSelectionContext'

export function TimeRangeConfig() {
  const { startAgo, setStartAgo, measurement, setMeasurement } = useFieldSelection()

  return (
    <div className='section-container'>
      <div className='section-title'>⏱️ Time Range Configuration</div>
      <div className='input-group'>
        <label htmlFor='measurement'>Measurement:</label>
        <input
          id='measurement'
          type='text'
          value={measurement}
          onChange={(e) => setMeasurement(e.target.value)}
          placeholder='environment'
        />
        <div className='input-explanation'>
          The measurement name to query from InfluxDB. Default: environment
        </div>
      </div>
      <div className='input-group'>
        <label htmlFor='start-ago'>Time Range (start for all queries):</label>
        <input
          id='start-ago'
          type='text'
          value={startAgo}
          onChange={(e) => setStartAgo(e.target.value)}
          placeholder='-720h'
        />
        <div className='input-explanation'>
          Specify how far back to query data. Examples: -1h (last hour), -24h (last day), -7d (last week), -30d (last
          month)
        </div>
      </div>
    </div>
  )
}
