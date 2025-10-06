import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter } from 'lucide-react';

const CompactFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-4">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-black font-bold text-xs">AT</span>
              </div>
              <span className="font-semibold">AfriTokeni</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 AfriTokeni. Built on ICP.
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
              About
            </Link>
            <Link to="/tariff" className="text-gray-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <a href="mailto:info@afritokeni.com" className="text-gray-400 hover:text-white transition-colors">
              Contact
            </a>
            
            {/* Social Links */}
            <div className="flex gap-3 ml-4">
              <a 
                href="https://www.linkedin.com/company/afritokeni/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://x.com/afritokeni" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CompactFooter;