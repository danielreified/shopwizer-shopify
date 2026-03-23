type Props = {
  width?: string | number;
  height?: string | number;
  className?: string;
};

export function SkeletonBlock({ width = '100%', height = 120, className = '' }: Props) {
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

export default SkeletonBlock;
