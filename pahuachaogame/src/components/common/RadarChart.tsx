import type { PlayerStats } from '../../constants/players';

interface Props {
  stats: PlayerStats;
  color: string; // e.g. '#B22222' or '#DAA520'
}

export default function RadarChart({ stats, color }: Props) {
  const size = 160;
  const center = size / 2;
  const radius = size / 2 - 20;

  // 五個軸的標籤與對應的值
  const axes = [
    { label: '節奏感', value: stats.rhythm },
    { label: '協調性', value: stats.coordination },
    { label: '趣味度', value: stats.humor },
    { label: '力度', value: stats.strength },
    { label: '柔軟度', value: stats.flexibility },
  ];

  const getPoint = (value: number, index: number, maxPoints: number) => {
    // 角度從正上方開始 (-90度 = -PI/2)
    const angle = (Math.PI * 2 * index) / maxPoints - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 繪製背景網格（五角形，分 3 層）
  const gridLevels = [0.33, 0.66, 1];
  const gridPolygons = gridLevels.map(level => {
    const points = axes.map((_, i) => getPoint(100 * level, i, axes.length));
    return points.map(p => `${p.x},${p.y}`).join(' ');
  });

  // 繪製數據多邊形
  const dataPoints = axes.map((axis, i) => getPoint(axis.value, i, axes.length));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative flex items-center justify-center font-sans">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* 網格 */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="rgba(255, 255, 255, 0.05)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* 輻射線 */}
        {axes.map((_, i) => {
          const p = getPoint(100, i, axes.length);
          return (
            <line
              key={`line-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* 數據多邊形 */}
        <polygon
          points={dataPolygon}
          fill={`${color}66`} // 40% opacity hex
          stroke={color}
          strokeWidth="2"
          className="transition-all duration-500"
        />

        {/* 數據節點 */}
        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke={color}
            strokeWidth="1"
            className="transition-all duration-500"
          />
        ))}

        {/* 標籤 */}
        {axes.map((axis, i) => {
          // 將標籤位置往外推一點
          const p = getPoint(125, i, axes.length);
          return (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y}
              fontSize="10"
              fill="rgba(255, 255, 255, 0.7)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
