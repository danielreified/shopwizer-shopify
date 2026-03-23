export interface CircleProgressProps {
  progress: number;
  size?: number;
  trackColor?: string;
  progressColor?: string;
}

export function CircleProgress({
  progress,
  size = 20,
  trackColor = 'text-gray-200',
  progressColor = 'text-green-700',
}: CircleProgressProps) {
  const pct = Math.min(Math.max(progress, 0), 100);

  return (
    <svg viewBox="0 0 36 36" className={`inline-block`} style={{ width: size, height: size }}>
      <circle
        className={trackColor}
        cx="18"
        cy="18"
        r="15.9155"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
      />
      <circle
        className={progressColor}
        cx="18"
        cy="18"
        r="15.9155"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${pct} 100`}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
}
