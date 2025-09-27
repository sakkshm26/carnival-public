import React from 'react';

interface CopyIconProps {
  width?: number;
  height?: number;
  className?: string;
}

const CopyIcon: React.FC<CopyIconProps> = ({ 
  width = 14, 
  height = 14, 
  className = ""
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 14 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M11 9H11.4C12.2867 9 13 8.28667 13 7.4V2.6C13 1.71333 12.2867 1 11.4 1H6.6C5.71333 1 5 1.71333 5 2.6V3M7.4 5H2.6C2.17565 5 1.76869 5.16857 1.46863 5.46863C1.16857 5.76869 1 6.17565 1 6.6V11.4C1 11.8243 1.16857 12.2313 1.46863 12.5314C1.76869 12.8314 2.17565 13 2.6 13H7.4C7.82435 13 8.23131 12.8314 8.53137 12.5314C8.83143 12.2313 9 11.8243 9 11.4V6.6C9 6.38988 8.95861 6.18183 8.87821 5.98771C8.7978 5.79359 8.67994 5.6172 8.53137 5.46863C8.3828 5.32006 8.20641 5.2022 8.01229 5.12179C7.81817 5.04139 7.61012 5 7.4 5Z" 
        stroke={"#525664"} 
        strokeMiterlimit="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CopyIcon;
