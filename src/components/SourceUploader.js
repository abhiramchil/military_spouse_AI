import React, { useState } from 'react';

const SourceUploader = ({ apiUrl }) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!apiUrl) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof payload?.detail === 'string' ? payload.detail : 'Unable to add that source right now.';
        throw new Error(detail);
      }

      setResult(payload);
      setUrl('');
    } catch (err) {
      setError(err.message || 'Something went wrong while adding the source.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="source-uploader">
      <div className="source-uploader__header">
        <h3>Add Your Own Resource</h3>
        <p>Paste a public URL to expand the knowledge base. Fresh sources become searchable immediately.</p>
      </div>
      <form className="source-uploader__form" onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="https://example.mil/resource"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="source-uploader__input"
          required
        />
        <button
          type="submit"
          className="source-uploader__button"
          disabled={!url.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding…' : 'Add Source'}
        </button>
      </form>
      {result && (
        <div className="source-uploader__status success">
          Added <strong>{result.title}</strong> ({result.chunks_added} sections indexed).
        </div>
      )}
      {error && (
        <div className="source-uploader__status error">
          {error}
        </div>
      )}
    </div>
  );
};

export default SourceUploader;
