import { formatDate } from "@/lib/format";
import type { AdminDashboardResponse } from "@/validators/admin-dashboard.validator";

const WIDTH = 720;
const HEIGHT = 230;
const PAD = { left: 34, right: 8, top: 12, bottom: 30 };
const MAX_TICKS = 4;

export function ApplicationsChart({
  days,
}: {
  days: AdminDashboardResponse["applicationsPerDay"];
}) {
  const peak = Math.max(2, ...days.map((day) => day.count));
  const step = Math.ceil(peak / MAX_TICKS);
  const top = Math.ceil(peak / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, index) => index * step);

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerWidth / Math.max(days.length, 1);
  const yOf = (value: number) => PAD.top + innerHeight - (value / top) * innerHeight;

  const first = days[0];
  const last = days[days.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Applications per day over the last ${days.length} days`}
      className="block h-auto w-full"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={yOf(tick)}
            y2={yOf(tick)}
            className="stroke-line"
          />
          <text
            x={PAD.left - 10}
            y={yOf(tick) + 4}
            textAnchor="end"
            fontSize={12}
            className="fill-muted-foreground"
          >
            {tick}
          </text>
        </g>
      ))}
      {days.map((day, index) =>
        day.count > 0 ? (
          <rect
            key={day.date}
            x={PAD.left + index * slot + slot * 0.16}
            y={yOf(day.count)}
            width={slot * 0.68}
            height={PAD.top + innerHeight - yOf(day.count)}
            rx={3}
            className="fill-primary"
          >
            <title>{`${formatDate(day.date)}: ${day.count} application${day.count === 1 ? "" : "s"}`}</title>
          </rect>
        ) : null,
      )}
      {first && (
        <text x={PAD.left} y={HEIGHT - 8} fontSize={12} className="fill-muted-foreground">
          {formatDate(first.date)}
        </text>
      )}
      {last && (
        <text
          x={WIDTH - PAD.right}
          y={HEIGHT - 8}
          textAnchor="end"
          fontSize={12}
          className="fill-muted-foreground"
        >
          {formatDate(last.date)}
        </text>
      )}
    </svg>
  );
}
