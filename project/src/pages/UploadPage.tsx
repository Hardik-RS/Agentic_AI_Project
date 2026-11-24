import { useState, useCallback, useRef, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  ArrowRight,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { uploadResume, processResume } from '@/api/resume';
import { classifyError } from '@/api/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Spinner } from '@/components/LoadingState';
import { useNotification as useNotify } from '@/components/NotificationProvider';
import { saveLatestResumeResult } from '@/utils/resume';

const ACCEPTED_TYPES = ['.pdf'];
const ACCEPTED_MIME_TYPES = ['application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export function UploadPage() {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [processingStage, setProcessingStage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) || !ACCEPTED_MIME_TYPES.includes(f.type)) {
      return 'Only PDF files are supported. Please choose a PDF resume.';
    }
    if (f.size > MAX_SIZE) {
      return 'File size must be under 10MB.';
    }
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      notify('error', err);
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMsg(null);
  }, [notify]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setErrorMsg(null);
    setResumeId(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUploadAndProcess = async () => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      notify('error', validationError);
      return;
    }
    setStatus('uploading');
    setErrorMsg(null);

    try {
      // Step 1: Upload the file
      setProcessingStage('Uploading resume...');
      const uploadRes = await uploadResume(file);

      // Extract resume ID from response — handle various field names
      const id =
        (uploadRes as Record<string, unknown>).id as number ||
        (uploadRes as Record<string, unknown>).resume_id as number;
      if (!id) {
        setStatus('error');
        setErrorMsg('Upload succeeded but no resume ID was returned by the server. Check your backend response format.');
        return;
      }
      setResumeId(id);
      notify('success', 'Resume uploaded successfully!');

      // Step 2: Process the resume with AI
      setStatus('processing');
      setProcessingStage('AI is analyzing your resume...');
      const processRes = await processResume(id);
      saveLatestResumeResult(id, processRes);

      notify('success', 'Resume analysis complete!');
      setStatus('success');

      // Navigate to dashboard with the result data
      setTimeout(() => {
        navigate('/dashboard', {
          state: {
            resumeId: id,
            analysisData: processRes,
          },
        });
      }, 1200);
    } catch (err) {
      setStatus('error');
      const classified = classifyError(err);
      setErrorMsg(classified.message);
      notify('error', classified.message);
    }
  };

  return (
    <DashboardLayout title="Upload Resume" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Upload Resume' }]}>
      <div className="max-w-3xl mx-auto">
        <div className="card-elevated p-6 sm:p-10 animate-slide-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-4">
              <FileCheck className="w-3.5 h-3.5" /> PDF only
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-navy-900 mb-2">Upload your resume</h2>
            <p className="text-sm text-navy-500 max-w-lg mx-auto">
              Upload your PDF resume to get AI-powered insights, resume analysis, and career recommendations.
            </p>
          </div>

          {/* Upload zone */}
          {!file && status !== 'uploading' && status !== 'processing' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-brand-500 bg-brand-50 scale-[1.02]'
                  : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  dragging ? 'bg-brand-500 scale-110' : 'bg-brand-100'
                }`}>
                  <UploadCloud className={`w-8 h-8 ${dragging ? 'text-white' : 'text-brand-600'}`} />
                </div>
                <p className="text-base font-semibold text-navy-900 mb-1">
                  {dragging ? 'Drop your file here' : 'Drag and drop your resume'}
                </p>
                <p className="text-sm text-navy-400">
                  or <span className="text-brand-600 font-medium">click to browse</span>
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {ACCEPTED_TYPES.map((type) => (
                    <span key={type} className="badge bg-slate-100 text-navy-500 uppercase text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* File selected */}
          {file && status !== 'uploading' && status !== 'processing' && status !== 'success' && (
            <div className="animate-scale-in">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{file.name}</p>
                  <p className="text-xs text-navy-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                {status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
                )}
                <button
                  onClick={removeFile}
                  className="p-2 text-navy-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg bg-error-50 border border-error-500/20 text-sm text-error-700">
                  {errorMsg}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={removeFile} className="btn-secondary flex-1">
                  Choose different file
                </button>
                <button onClick={handleUploadAndProcess} className="btn-primary flex-1">
                  <UploadCloud className="w-4 h-4" />
                  Upload & Analyze
                </button>
              </div>
            </div>
          )}

          {/* Uploading / Processing */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="py-12 text-center animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-brand-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {status === 'uploading' ? (
                    <UploadCloud className="w-10 h-10 text-brand-500 animate-pulse" />
                  ) : (
                    <Spinner size={36} className="text-brand-500" />
                  )}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">
                {status === 'uploading' ? 'Uploading your resume...' : 'AI is analyzing your resume...'}
              </h3>
              <p className="text-sm text-navy-400">{processingStage}</p>
              {status === 'processing' && (
                <div className="mt-6 max-w-xs mx-auto">
                  <div className="flex items-center justify-center gap-2 text-xs text-navy-400">
                    <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                    Parsing content
                    <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
                    Evaluating skills
                    <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                    Scoring
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="py-12 text-center animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success-500" />
              </div>
              <h3 className="text-lg font-semibold text-navy-900 mb-2">Analysis complete!</h3>
              <p className="text-sm text-navy-400 mb-4">Redirecting to your dashboard...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-brand-600 font-medium">
                <Spinner size={14} />
                Loading results...
              </div>
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <FileCheck className="w-5 h-5 text-brand-600" />
              <h4 className="text-sm font-semibold text-navy-900">Best practices</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-navy-500">
              <li>• Use a single-page resume for best ATS parsing</li>
              <li>• Avoid tables, text boxes, and images</li>
              <li>• Use standard section headings (Experience, Education, Skills)</li>
            </ul>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-warning-600" />
              <h4 className="text-sm font-semibold text-navy-900">Privacy</h4>
            </div>
            <p className="text-xs text-navy-500 leading-relaxed">
              Your resume is processed by our AI engine and stored securely. It is never
              shared with third parties.
            </p>
          </div>
        </div>

        {/* Next steps link */}
        {resumeId && status === 'success' && (
          <div className="mt-6 text-center">
            <Link to="/dashboard" className="btn-primary">
              View Analysis Results
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
