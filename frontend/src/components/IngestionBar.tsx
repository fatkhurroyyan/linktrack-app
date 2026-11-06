import React, { useState } from 'react';
import { Link2, Sparkles, ArrowRight } from 'lucide-react';

interface IngestionBarProps {
  onProcess: (url: string) => Promise<boolean>;
  isLoading: boolean;
}

export const IngestionBar: React.FC<IngestionBarProps> = ({ onProcess, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    const clean = url.trim();
    const normalized = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    try {
      const parsed = new URL(normalized);
      if (!clean || !parsed.hostname.includes('.') || !['https:', 'http:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setError('Masukkan tautan yang valid, misalnya github.com/facebook/react.');
      document.getElementById('link-url')?.focus();
      return;
    }
    setError('');
    const success = await onProcess(normalized);
    if (success) setUrl('');
  };
  return (
    <form onSubmit={handleSubmit} className="ingestion-form" aria-busy={isLoading}>
      <label htmlFor="link-url">Simpan ide berikutnya</label>
      <div className="ingestion-field">
        <Link2 className="input-leading-icon" size={19} aria-hidden="true" />
        <input id="link-url" name="url" type="text" inputMode="url" autoComplete="url" spellCheck={false} value={url} onChange={(event) => { setUrl(event.target.value); setError(''); }} placeholder="Tempel tautan favoritmu di sini…" disabled={isLoading} aria-invalid={Boolean(error)} aria-describedby={error ? 'ingestion-error' : 'ingestion-hint'} />
        <button className="button button-primary ingestion-submit" type="submit" disabled={isLoading}>
          <Sparkles size={16} aria-hidden="true" /><span>{isLoading ? 'Menganalisis…' : 'Analisis & Kurasi AI'}</span>{!isLoading && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </div>
      <p id={error ? 'ingestion-error' : 'ingestion-hint'} className={`form-hint ${error ? 'field-error' : ''}`} role={error ? 'alert' : undefined}>
        {error || (isLoading ? 'AI sedang membaca dan mengelompokkan tautanmu. Tunggu sebentar…' : 'Google Drive, GitHub, atau situs web. Tautanmu jadi lebih mudah ditemukan.')}
      </p>
    </form>
  );
};
