import React from 'react';

interface StepsIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

const StepsIcon: React.FC<StepsIconProps> = ({
  width = 27,
  height = 12,
  className = '',
  fill = '#1C1C21'
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 27 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7.94727 11.668H0.666992V8.66797H7.94727V11.668ZM20.4268 7.66797H6.90723V4.66797H20.4268V7.66797ZM26.667 3.66797H19.3867V0.667969H26.667V3.66797Z"
        fill={fill}
      />
    </svg>
  );
};

export default StepsIcon; 