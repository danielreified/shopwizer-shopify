type Props = {
  width?: string | number;
  height?: string | number;
  className?: string;
};

export function SkeletonText({ width = '100%', height = '14px', className = '' }: Props) {
  return (
    <div
      className={'animate-pulse bg-gray-200 rounded-lg ' + className}
      style={{
        width,
        height,
      }}
    />
  );
}

export default SkeletonText;
