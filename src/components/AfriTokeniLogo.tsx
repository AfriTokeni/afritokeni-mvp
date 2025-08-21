import React from 'react';

interface AfriTokeniLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AfriTokeniLogo: React.FC<AfriTokeniLogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', iconText: 'text-sm' },
    md: { icon: 'w-8 h-8', text: 'text-xl', iconText: 'text-lg' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', iconText: 'text-xl' }
  };

  const { icon, text, iconText } = sizeClasses[size];

  return (
      <div className="flex items-center space-x-3">
        <div className={`${icon} bg-black rounded-lg flex items-center justify-center`}>
          <span className={`text-white font-bold ${iconText}`}>A</span>
        </div>
        <h1 className={`${text} font-semibold text-gray-900`}>
          AfriTokeni
        </h1>
      </div>
  );
};

export default AfriTokeniLogo;
