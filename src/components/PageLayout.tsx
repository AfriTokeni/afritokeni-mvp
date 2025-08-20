import React from 'react';
import Header from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showUserMenu?: boolean;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title, 
  showBackButton = false, 
  showUserMenu = true,
  className = ""
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={title} 
        showBackButton={showBackButton} 
        showUserMenu={showUserMenu} 
      />
      <main className={`max-w-6xl mx-auto px-6 py-8 ${className}`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
