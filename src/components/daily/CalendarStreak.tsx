"use client";

import { useMemo } from "react";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";

interface CalendarStreakProps {
  history: Record<string, boolean>;
  streakDays: number;
}

const DAY_LABELS = ["", "월", "", "수", "", "금", ""];
const INACTIVE_LIGHT = "#ebedf0";
const INACTIVE_DARK = "#161b22";
const ACTIVE_SHADES = ["#9be9a8", "#40c463", "#30a14e", "#216e39"];

function getActivityColor(active: boolean, isDark: boolean): string {
  if (!active) return isDark ? INACTIVE_DARK : INACTIVE_LIGHT;
  // Use mid-intensity green for completed days
  return ACTIVE_SHADES[1];
}

export default function CalendarStreak({
  history,
  streakDays,
}: CalendarStreakProps) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const { weeks, monthLabels } = useMemo(() => {
    // Calculate 12 weeks of days ending at end of current week
    const endOfCurrentWeek = new Date(today);
    // Move to Saturday (end of week, week starts Monday)
    const dayOfWeek = today.getDay();
    const daysUntilSat = dayOfWeek === 0 ? 0 : 6 - dayOfWeek;
    endOfCurrentWeek.setDate(today.getDate() + daysUntilSat);

    const totalDays = 12 * 7;
    const startDate = subDays(endOfCurrentWeek, totalDays - 1);
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({
      start: weekStart,
      end: endOfCurrentWeek,
    });

    // Group into weeks (columns)
    const weeksArr: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeksArr.push(allDays.slice(i, i + 7));
    }

    // Take last 12 weeks
    const finalWeeks = weeksArr.slice(-12);

    // Generate month labels
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    finalWeeks.forEach((week, colIndex) => {
      const firstDay = week[0];
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: format(firstDay, "M월"),
          colIndex,
        });
        lastMonth = month;
      }
    });

    return { weeks: finalWeeks, monthLabels: labels };
  }, [today]);

  const cellSize = 14;
  const cellGap = 3;
  const labelWidth = 28;
  const topPadding = 20;
  const gridWidth = weeks.length * (cellSize + cellGap);
  const gridHeight = 7 * (cellSize + cellGap);

  return (
    <div className="space-y-4">
      {/* Streak Counter */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {streakDays}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            일 연속
          </span>
        </div>
      </div>

      {/* Heatmap Calendar */}
      <div className="overflow-x-auto">
        <svg
          width={labelWidth + gridWidth + cellGap}
          height={topPadding + gridHeight + cellGap}
          className="block"
        >
          {/* Month Labels */}
          {monthLabels.map(({ label, colIndex }) => (
            <text
              key={`month-${colIndex}`}
              x={labelWidth + colIndex * (cellSize + cellGap)}
              y={12}
              className="fill-gray-500 dark:fill-gray-400"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Day Labels */}
          {DAY_LABELS.map((label, rowIndex) =>
            label ? (
              <text
                key={`day-${rowIndex}`}
                x={0}
                y={topPadding + rowIndex * (cellSize + cellGap) + cellSize - 2}
                className="fill-gray-500 dark:fill-gray-400"
                fontSize={10}
              >
                {label}
              </text>
            ) : null,
          )}

          {/* Grid Cells */}
          {weeks.map((week, colIndex) =>
            week.map((day, rowIndex) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isActive = history[dateStr] === true;
              const isToday = dateStr === todayStr;
              const isFuture = day > today;

              return (
                <g key={dateStr}>
                  <rect
                    x={labelWidth + colIndex * (cellSize + cellGap)}
                    y={topPadding + rowIndex * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    ry={2}
                    fill={
                      isFuture
                        ? "transparent"
                        : getActivityColor(isActive, false)
                    }
                    className={isFuture ? "" : "dark:hidden"}
                  />
                  <rect
                    x={labelWidth + colIndex * (cellSize + cellGap)}
                    y={topPadding + rowIndex * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    ry={2}
                    fill={
                      isFuture
                        ? "transparent"
                        : getActivityColor(isActive, true)
                    }
                    className={isFuture ? "" : "hidden dark:block"}
                  />
                  {isToday && (
                    <rect
                      x={labelWidth + colIndex * (cellSize + cellGap) - 1}
                      y={topPadding + rowIndex * (cellSize + cellGap) - 1}
                      width={cellSize + 2}
                      height={cellSize + 2}
                      rx={3}
                      ry={3}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="text-gray-900 dark:text-white"
                    />
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>
    </div>
  );
}
