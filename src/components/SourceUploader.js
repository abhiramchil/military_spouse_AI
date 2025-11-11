import React, { useState } from 'react';

const SourceUploader = ({ apiUrl, uploadApiUrl }) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileSubmitting, setIsFileSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const hasUrlSupport = Boolean(apiUrl);
  const hasFileSupport = Boolean(uploadApiUrl);

  if (!hasUrlSupport && !hasFileSupport) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

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

      setFeedback({ type: 'success', message: `Added ${payload.title} (${payload.chunks_added} sections indexed).` });
      setUrl('');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Something went wrong while adding the source.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handleFileSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !uploadApiUrl || isFileSubmitting) return;

    const formElement = event.currentTarget;
    setIsFileSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(uploadApiUrl, {
        method: 'POST',
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof payload?.detail === 'string' ? payload.detail : 'Unable to add that file right now.';
        throw new Error(detail);
      }

      setFeedback({ type: 'success', message: `Uploaded ${payload.title} (${payload.chunks_added} sections indexed).` });
      setSelectedFile(null);
      formElement.reset();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Something went wrong while uploading the file.' });
    } finally {
      setIsFileSubmitting(false);
    }
  };

  return (
    <div className="source-uploader">
      <div className="source-uploader__header">
        <h3>Add Your Own Resource</h3>
        <p>Share a public URL or upload a PDF/text file to expand the knowledge base. Fresh sources become searchable immediately.</p>
      </div>
      {hasUrlSupport && (
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
            {isSubmitting ? 'Adding…' : 'Add URL'}
          </button>
        </form>
      )}

      {hasFileSupport && (
        <form className="source-uploader__form" onSubmit={handleFileSubmit}>
          <input
            type="file"
            accept=".pdf,.txt,.md,.rtf"
            onChange={handleFileChange}
            className="source-uploader__input"
          />
          <button
            type="submit"
            className="source-uploader__button"
            disabled={!selectedFile || isFileSubmitting}
          >
            {isFileSubmitting ? 'Uploading…' : 'Upload File'}
          </button>
        </form>
      )}

      {feedback && (
        <div className={`source-uploader__status ${feedback.type}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default SourceUploader;
