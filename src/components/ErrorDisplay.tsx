interface ErrorDisplayProps {
  error: string | null
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null

  return (
    <div className="error-container">
      <strong>Error:</strong> {error}
    </div>
  )
}
