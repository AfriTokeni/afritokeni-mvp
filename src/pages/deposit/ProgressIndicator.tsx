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
    <div className="max-w-4xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepClassName(index)}`}>
              {step.number}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;