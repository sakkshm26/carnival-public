import React from 'react';

interface LeafProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}

const Leaf: React.FC<LeafProps> = ({
  width = 20,
  height = 21,
  className = '',
  fill = '#1C1C21'
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1.30713 0.78418L1.89893 0.818359C4.81215 1.02667 6.9988 1.78142 8.55811 3.28027C10.2177 4.87594 11.084 7.23549 11.4644 10.3984L11.4517 10.3994V20.1338H9.16064V11.4336C6.29743 10.8738 4.31652 10.0188 2.99561 8.42871C1.74141 6.91855 1.14795 4.82237 0.835449 1.92871L0.776855 1.33984L0.721191 0.757812L1.30713 0.78418ZM19.6089 8.5C19.2919 10.5293 18.7725 11.9722 17.7817 12.9434C16.9106 13.7971 15.7393 14.2241 14.2271 14.4463L13.5571 14.5293L12.9087 14.5977L13.0005 13.9512L13.1089 13.2812C13.3885 11.7719 13.8543 10.6449 14.7095 9.80176C15.6773 8.84765 17.0724 8.33012 19.0005 7.92383L19.7231 7.77148L19.6089 8.5Z"
        fill={fill}
      />
    </svg>
  );
};

export default Leaf; 