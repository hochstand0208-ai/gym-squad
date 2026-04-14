import { useEffect } from 'react';

interface Props {
  show: boolean;
  onComplete: () => void;
}

export function SuccessAnimation({ show, onComplete }: Props) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onComplete, 2200);
    return () => clearTimeout(t);
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="success-overlay">
      <div className="success-box">
        <svg className="success-ring" viewBox="0 0 52 52">
          <circle className="checkmark-circle" cx="26" cy="26" r="24" />
          <path className="checkmark-path" d="M14 27l8 8 16-16" />
        </svg>
        <p className="success-text">記録しました！💪</p>
      </div>
    </div>
  );
}
