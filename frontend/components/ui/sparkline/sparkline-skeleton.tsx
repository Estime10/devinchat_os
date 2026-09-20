type SparklineSkeletonProps = {
  width?: number;
  height?: number;
  bars?: number;
  className?: string;
};

/**
 * Placeholder sparkline — fallback Suspense / loading pagination.
 */
export function SparklineSkeleton({
  width = 96,
  height = 24,
  bars = 12,
  className = "",
}: SparklineSkeletonProps) {
  const gap = 1.5;
  const barWidth = (width - gap * (bars - 1)) / bars;
  const heights = [
    0.35, 0.55, 0.4, 0.7, 0.45, 0.6, 0.5, 0.75, 0.4, 0.55, 0.65, 0.45,
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`shrink-0 text-white/15 ${className}`.trim()}
      role="status"
      aria-label="Loading commit activity"
      aria-busy="true"
    >
      {Array.from({ length: bars }, (_, index) => {
        const ratio = heights[index % heights.length] ?? 0.4;
        const barHeight = Math.max(2, height * ratio);
        const x = index * (barWidth + gap);
        const y = height - barHeight;

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}
