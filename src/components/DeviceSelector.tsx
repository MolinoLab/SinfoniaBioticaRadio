import { useFieldSelection } from '../contexts/useFieldSelection'

export function DeviceSelector() {
  const {
    deviceTag,
    tagValues,
    selectedTagValues,
    isLoadingTags,
    handleTagValueToggle,
    handleSelectAllTagValues,
    handleDeselectAllTagValues,
  } = useFieldSelection()

  if (isLoadingTags || tagValues.length === 0) {
    return null
  }

  return (
    <div className='section-container'>
      <div className='section-title'>
        🔧 Device Filter ({selectedTagValues.length}/{tagValues.length} selected)
      </div>
      <label>Filter by {deviceTag} tag</label>
      <div className='button-group'>
        <button onClick={handleSelectAllTagValues}>Select All</button>
        <button onClick={handleDeselectAllTagValues}>Deselect All</button>
      </div>
      <div className='checkbox-container'>
        {tagValues.map((value) => (
          <label key={value} className='checkbox-label'>
            <input
              type='checkbox'
              checked={selectedTagValues.includes(value)}
              onChange={() => handleTagValueToggle(value)}
            />
            {value}
          </label>
        ))}
      </div>
    </div>
  )
}
