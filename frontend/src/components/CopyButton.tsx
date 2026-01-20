import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label: string;
  className?: string;
}

export function CopyButton({ text, label, className = "btn-icon" }: CopyButtonProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setFeedback("✓");
      setTimeout(() => setFeedback(null), 2000);
    });
  };

  return (
    <div className="inline-relative">
      <button 
        className={className} 
        onClick={handleCopy} 
        title={`Copiar ${label}`}
      >
        {feedback || "📋"}
      </button>
    </div>
  );
}
