import { useFieldSelection } from '../contexts/FieldSelectionContext'

export function FieldSelector() {
  const { fieldKeys, selectedFields, isLoading, handleFieldToggle, handleSelectAll, handleDeselectAll } =
    useFieldSelection()

  if (isLoading || fieldKeys.length === 0) {
    return null
  }

  return (
    <div className='section-container'>
      <div className='section-title'>
        🔘 Field Selection ({selectedFields.length}/{fieldKeys.length} selected)
      </div>
      <label>Select which fields should be queried by radio sinfonia biotica</label>
      <div className='button-group'>
        <button onClick={handleSelectAll}>Select All</button>
        <button onClick={handleDeselectAll}>Deselect All</button>
      </div>
      <div className='checkbox-container'>
        {fieldKeys.map((field) => (
          <label key={field} className='checkbox-label'>
            <input type='checkbox' checked={selectedFields.includes(field)} onChange={() => handleFieldToggle(field)} />
            {field}
          </label>
        ))}
      </div>
    </div>
  )
}
