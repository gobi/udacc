'use client';

interface RouteStats {
  distance_km: number;
  elevation_gain: number;
  max_gradient: number;
  max_descent: number;
  pass_count: number;
}

interface RouteStatsPreviewProps {
  stats: RouteStats;
}

export function RouteStatsPreview({ stats }: RouteStatsPreviewProps) {
  return (
    <div className="grid grid-cols-5 gap-2 bg-secondary-50 rounded-xl p-4">
      <div className="text-center">
        <div className="text-lg font-bold text-secondary-800">
          {stats.distance_km.toFixed(1)}
          <span className="text-sm font-normal text-secondary-500 ml-1">км</span>
        </div>
        <div className="text-xs text-secondary-500">Зай</div>
      </div>

      <div className="text-center border-l border-secondary-200">
        <div className="text-lg font-bold text-secondary-800">
          +{Math.round(stats.elevation_gain)}
          <span className="text-sm font-normal text-secondary-500 ml-1">м</span>
        </div>
        <div className="text-xs text-secondary-500">Өндөр авалт</div>
      </div>

      <div className="text-center border-l border-secondary-200">
        <div className="text-lg font-bold text-secondary-800">
          {stats.max_gradient.toFixed(1)}
          <span className="text-sm font-normal text-secondary-500 ml-1">%</span>
        </div>
        <div className="text-xs text-secondary-500">Их өгсөлт</div>
      </div>

      <div className="text-center border-l border-secondary-200">
        <div className="text-lg font-bold text-secondary-800">
          {stats.max_descent.toFixed(1)}
          <span className="text-sm font-normal text-secondary-500 ml-1">%</span>
        </div>
        <div className="text-xs text-secondary-500">Их уруудал</div>
      </div>

      <div className="text-center border-l border-secondary-200">
        <div className="text-lg font-bold text-secondary-800">
          {stats.pass_count}
        </div>
        <div className="text-xs text-secondary-500">Даваа</div>
      </div>
    </div>
  );
}
