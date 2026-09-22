type SparklineProps = {
  values: number[];
  className?: string;
  label?: string;
  width?: number;
  height?: number;
};

/**
 * Mini tendance — barres SVG (commits / semaine).
 */
export function Sparkline({
  values,
  className = "",
  label = "Commit activity",
  width = 72,
  height = 18,
}: SparklineProps) {
  const gap = 1.5;
  const barWidth =
    (width - gap * (values.length - 1)) / Math.max(values.length, 1);
  const max = Math.max(...values, 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`shrink-0 ${className}`.trim()}
      role="img"
      aria-label={label}
    >
      {values.map((value, index) => {
        const barHeight = Math.max(1.5, (value / max) * height);
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        const opacity = value === 0 ? 0.25 : 0.55 + (value / max) * 0.45;

        return (
          <rect
            key={`${index}-${value}`}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill="currentColor"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}
