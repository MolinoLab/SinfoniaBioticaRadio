interface ErrorDisplayProps {
  error: string | null
  onClose: () => void
}

export function ErrorDisplay({ error, onClose }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="error-container">
      <strong>Error:</strong> {error}
      <button onClick={onClose} className="error-close-btn">×</button>
    </div>
  )
}
