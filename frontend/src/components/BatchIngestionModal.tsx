import React, { useState } from 'react';
import { Sparkles, Link2 } from 'lucide-react';
import { BatchProcessResponse } from '../types/link';
import { ModalShell } from './ModalShell';

interface BatchIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessBatch: (urls: string[]) => Promise<BatchProcessResponse | null>;
  isLoading: boolean;
}
export const BatchIngestionModal: React.FC<BatchIngestionModalProps> = ({ isOpen, onClose, onProcessBatch, isLoading }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<BatchProcessResponse | null>(null);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const urls = text.split('\n').map((url) => url.trim()).filter(Boolean).map((url) => /^https?:\/\//i.test(url) ? url : `https://${url}`);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    if (!urls.length) {
      setError('Masukkan setidaknya satu tautan, satu per baris.');
      document.getElementById('batch-urls')?.focus();
      return;
    }
    setError('');
    const response = await onProcessBatch(urls);
    setResult(response);
    if (!response) { setError('Tautan belum diproses. Periksa koneksi dan coba lagi.'); return; }
    if (response.failed === 0) { setText(''); onClose(); }
  };
  return <ModalShell title="Batch Link Ingestion" description="Simpan beberapa referensi sekaligus, satu tautan per baris." onClose={onClose}>
    <form onSubmit={submit}>
      <div className="modal-body form-stack">
        <div className="field"><label htmlFor="batch-urls">Daftar URL <span className="muted">(satu per baris)</span></label><textarea id="batch-urls" name="urls" value={text} onChange={(event) => { setText(event.target.value); setError(''); }} rows={7} placeholder={'github.com/facebook/react\ndrive.google.com/drive/folders/…\nhttps://tailwindcss.com'} spellCheck={false} disabled={isLoading} aria-invalid={Boolean(error)} aria-describedby={error ? 'batch-error' : 'batch-hint'} /><p className="form-hint" id="batch-hint"><Link2 size={13} aria-hidden="true" />{urls.length} tautan terdeteksi. Tidak perlu menambahkan https://.</p></div>
        {error && <p className="inline-message is-error" role="alert" id="batch-error">{error}</p>}
        {result && result.failed > 0 && <div className="inline-message is-error" role="alert"><strong>{result.successful} tersimpan, {result.failed} gagal.</strong>{result.errors.map((item) => <p key={item.url}>{item.url}: {item.error}</p>)}</div>}
        {isLoading && <p role="status" className="inline-message">AI sedang mengurasi {urls.length} tautan. Proses ini dapat memerlukan waktu…</p>}
      </div>
      <div className="modal-footer"><button type="button" className="button button-outline" onClick={onClose}>Tutup</button><button type="submit" className="button button-primary" disabled={isLoading || !urls.length}><Sparkles size={16} aria-hidden="true" />{isLoading ? 'Memproses…' : `Mulai Kurasi Batch (${urls.length})`}</button></div>
    </form>
  </ModalShell>;
};
