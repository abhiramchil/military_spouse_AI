import React, { useState } from 'react';

const SourceUploader = ({ apiUrl, uploadUrl }) => {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!apiUrl && !uploadUrl) {
    return null;
  }

  const resetStatus = () => {
    setError(null);
    setResult(null);
  };

  const handleUrlSubmit = async (event) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!apiUrl || !trimmed || isSubmitting) return;

    setIsSubmitting(true);
    resetStatus();

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

      setResult({
        type: 'url',
        title: payload?.title,
        chunks: payload?.chunks_added
      });
      setUrl('');
    } catch (err) {
      setError(err.message || 'Something went wrong while adding the source.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleFileSubmit = async (event) => {
    event.preventDefault();
    if (!uploadUrl || !file || isSubmitting) return;

    setIsSubmitting(true);
    resetStatus();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof payload?.detail === 'string' ? payload.detail : 'Unable to upload that document right now.';
        throw new Error(detail);
      }

      setResult({
        type: 'file',
        title: payload?.title,
        chunks: payload?.chunks_added
      });
      setFile(null);
      setFileKey((value) => value + 1);
    } catch (err) {
      setError(err.message || 'Something went wrong while uploading the document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const successMessage = result
    ? `${result.type === 'file' ? 'Document' : 'Source'} "${result.title || 'entry'}" added${typeof result.chunks === 'number' ? ` (${result.chunks} chunks)` : ''}.`
    : '';

  return (
    <div className="source-uploader">
      <div className="source-uploader__header">
        <h3>Bring Your Own Sources</h3>
        <p>Paste a URL or upload a document to expand the knowledge base.</p>
      </div>
      <div className="source-uploader__panels">
        {apiUrl && (
          <form className="source-uploader__form" onSubmit={handleUrlSubmit}>
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
              {isSubmitting ? 'Adding...' : 'Add Source'}
            </button>
          </form>
        )}

        {uploadUrl && (
          <form className="source-uploader__form" onSubmit={handleFileSubmit}>
            <input
              key={fileKey}
              type="file"
              accept=".txt,.pdf,.docx"
              className="source-uploader__input"
              onChange={handleFileChange}
            />
            <button
              type="submit"
              className="source-uploader__button"
              disabled={!file || isSubmitting}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        )}
      </div>
      {result && (
        <div className="source-uploader__status success">
          {successMessage}
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
