import { memo, useMemo } from 'react';
import type { CommitLaneInfo } from '@/utils/gitGraphLayout';
import { getLaneColor } from '@/utils/gitGraphLayout';

interface CommitGraphCellProps {
  laneInfo: CommitLaneInfo;
  isDark: boolean;
  width?: number;
  cellHeight?: number;
}

const LANE_WIDTH = 12;
const NODE_RADIUS = 4;
const DEFAULT_HEIGHT = 60;

/**
 * Renders a single cell of the git graph for a commit
 * Shows branch lanes, commit node, and merge/branch connections
 */
export const CommitGraphCell = memo(function CommitGraphCell({
  laneInfo,
  isDark,
  width = 60,
  cellHeight,
}: CommitGraphCellProps) {
  const nodeX = useMemo(() => {
    return laneInfo.laneIndex * LANE_WIDTH + LANE_WIDTH / 2;
  }, [laneInfo.laneIndex]);

  const height = cellHeight || DEFAULT_HEIGHT;
  const nodeY = height / 2;

  const mainColor = getLaneColor(laneInfo.laneIndex, isDark);

  return (
    <svg
      width={width}
      height="100%"
      className="overflow-visible"
      style={{ minWidth: width }}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Draw active lane lines */}
      {Array.from(laneInfo.activeLanes).map((lane) => {
        const x = lane * LANE_WIDTH + LANE_WIDTH / 2;
        const color = getLaneColor(lane, isDark);

        return (
          <line
            key={`lane-${lane}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={color}
            strokeWidth={2}
            opacity={0.6}
          />
        );
      })}

      {/* Draw line from top to node (child connection) */}
      {laneInfo.hasChildInSameLane && (
        <line
          x1={nodeX}
          y1={0}
          x2={nodeX}
          y2={nodeY - NODE_RADIUS}
          stroke={mainColor}
          strokeWidth={2}
        />
      )}

      {/* Draw line from node to bottom (parent connection) */}
      {laneInfo.hasParentInSameLane && (
        <line
          x1={nodeX}
          y1={nodeY + NODE_RADIUS}
          x2={nodeX}
          y2={height}
          stroke={mainColor}
          strokeWidth={2}
        />
      )}

      {/* Draw merge lines from source lanes */}
      {laneInfo.mergeSourceLanes.map((sourceLane) => {
        const sourceX = sourceLane * LANE_WIDTH + LANE_WIDTH / 2;
        const sourceColor = getLaneColor(sourceLane, isDark);

        return (
          <path
            key={`merge-${sourceLane}`}
            d={`M ${sourceX} ${0} Q ${sourceX} ${nodeY / 2}, ${nodeX} ${nodeY}`}
            stroke={sourceColor}
            strokeWidth={2}
            fill="none"
            opacity={0.8}
          />
        );
      })}

      {/* Draw branch line to target lane */}
      {laneInfo.branchTargetLane !== null && (
        <path
          d={`M ${nodeX} ${nodeY} Q ${nodeX} ${nodeY + height / 4}, ${laneInfo.branchTargetLane * LANE_WIDTH + LANE_WIDTH / 2} ${height}`}
          stroke={mainColor}
          strokeWidth={2}
          fill="none"
          opacity={0.8}
        />
      )}

      {/* Draw commit node */}
      <circle
        cx={nodeX}
        cy={nodeY}
        r={NODE_RADIUS}
        fill={mainColor}
        stroke="white"
        strokeWidth={2}
      />
    </svg>
  );
});
