import React from 'react';

interface BoxesIconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

const BoxesIcon: React.FC<BoxesIconProps> = ({
  width = 18,
  height = 17,
  className = '',
  fill = '#1C1C21'
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7.63184 16.5518H0.666992V9.57324H7.63184V16.5518ZM14.5977 16.2988L8.62891 16.3018L8.625 9.82617L14.5947 9.82324L14.5977 16.2988ZM7.33398 8.57617H0.966797V2.59473H7.33398V8.57617ZM17.668 4.53418L13.6006 8.57617L9.55371 4.4873L13.6211 0.445312L17.668 4.53418Z"
        fill={fill}
      />
    </svg>
  );
};

export default BoxesIcon; 