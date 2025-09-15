import React, { useState } from 'react';
import { Copy, QrCode, Eye, EyeOff } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

interface TransactionCodeDisplayProps {
  code: string;
  title: string;
  description?: string;
  showQR?: boolean;
  className?: string;
}

const TransactionCodeDisplay: React.FC<TransactionCodeDisplayProps> = ({
  code,
  title,
  description,
  showQR = true,
  className = ''
}) => {
  const [showCode, setShowCode] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const formatCode = (code: string) => {
    // Format 6-digit codes as XXX-XXX for better readability
    if (code.length === 6) {
      return `${code.slice(0, 3)}-${code.slice(3)}`;
    }
    return code;
  };

  return (
    <div className={`bg-white border border-neutral-200 rounded-xl p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-600 mb-4">{description}</p>
        )}

        {/* Code Display */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl font-mono font-bold text-neutral-900">
              {showCode ? formatCode(code) : '•••-•••'}
            </span>
            <button
              onClick={() => setShowCode(!showCode)}
              className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
              title={showCode ? 'Hide code' : 'Show code'}
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex justify-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm text-neutral-700 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            
            {showQR && (
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="flex items-center space-x-1 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm text-neutral-700 transition-colors"
              >
                <QrCode className="w-3 h-3" />
                <span>{showQRCode ? 'Hide QR' : 'Show QR'}</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        {showQR && showQRCode && (
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <QRCodeGenerator 
                value={code} 
                size={150}
                className="mx-auto"
              />
              <p className="text-xs text-neutral-500 mt-2 text-center">
                Scan with agent's device
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionCodeDisplay;
