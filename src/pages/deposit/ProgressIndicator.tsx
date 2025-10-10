import React from 'react';
import { ProgressIndicatorProps } from '../../types/depositTypes';

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, steps }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const getStepClassName = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    
    if (stepIndex < currentIndex) {
      return 'bg-green-500 text-white'; // Completed
    } else if (stepIndex === currentIndex) {
      return 'bg-gray-900 text-white'; // Current
    } else {
      return 'bg-gray-200 text-gray-500'; // Not started
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-4 md:mb-6 lg:mb-8 px-2 md:px-4">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-xs md:text-sm font-medium ${getStepClassName(index)}`}>
              {step.number}
            </div>
            <span className="ml-1 sm:ml-1 md:ml-2 text-xs sm:text-xs md:text-sm lg:text-base font-medium text-gray-700">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;