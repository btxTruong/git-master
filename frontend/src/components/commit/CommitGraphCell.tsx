import { memo, useMemo } from 'react';
import type { CommitLaneInfo } from '@/utils/gitGraphLayout';
import { getLaneColor } from '@/utils/gitGraphLayout';

interface CommitGraphCellProps {
  laneInfo: CommitLaneInfo;
  isDark: boolean;
  width?: number;
  cellHeight?: number;
}

const LANE_WIDTH = 20;
const NODE_RADIUS = 5;
const MERGE_NODE_RADIUS = 7;
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

  const calculatedWidth = useMemo(() => {
    const maxLane = Math.max(
      laneInfo.laneIndex,
      ...Array.from(laneInfo.activeLanes),
      ...laneInfo.mergeSourceLanes,
      laneInfo.branchTargetLane ?? 0
    );
    const requiredWidth = (maxLane + 1) * LANE_WIDTH + LANE_WIDTH;
    return Math.max(width, requiredWidth);
  }, [laneInfo, width]);

  const height = cellHeight || DEFAULT_HEIGHT;
  const nodeY = height / 2;

  const mainColor = getLaneColor(laneInfo.laneIndex, isDark);
  const isMerge = laneInfo.isMergeCommit;
  const isOctopusMerge = laneInfo.parentCount >= 3;
  const nodeRadius = isMerge ? MERGE_NODE_RADIUS : NODE_RADIUS;

  const hasCrossLaneParent =
    laneInfo.primaryParentLane !== null && laneInfo.primaryParentLane !== laneInfo.laneIndex;

  return (
    <svg
      width={calculatedWidth}
      height="100%"
      className="overflow-visible"
      style={{ minWidth: calculatedWidth }}
      preserveAspectRatio="none"
      viewBox={`0 0 ${calculatedWidth} ${height}`}
    >
      {/* Draw active lane lines */}
      {Array.from(laneInfo.activeLanes).map((lane) => {
        const x = lane * LANE_WIDTH + LANE_WIDTH / 2;
        const color = getLaneColor(lane, isDark);
        const isCurrentLane = lane === laneInfo.laneIndex;

        return (
          <line
            key={`lane-${lane}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={color}
            strokeWidth={isCurrentLane ? 2 : 1.5}
            opacity={isCurrentLane ? 0.4 : 0.25}
          />
        );
      })}

      {/* Draw line from top to node (child connection) */}
      {laneInfo.hasChildInSameLane && (
        <line
          x1={nodeX}
          y1={0}
          x2={nodeX}
          y2={nodeY - nodeRadius}
          stroke={mainColor}
          strokeWidth={2.5}
        />
      )}

      {/* Draw line from node to bottom (parent connection) */}
      {laneInfo.hasParentInSameLane && !hasCrossLaneParent && (
        <line
          x1={nodeX}
          y1={nodeY + nodeRadius}
          x2={nodeX}
          y2={height}
          stroke={mainColor}
          strokeWidth={2.5}
        />
      )}

      {/* Draw curved line to parent in different lane (CHECKOUT/BRANCH - going OUT) */}
      {hasCrossLaneParent && laneInfo.primaryParentLane !== null && (
        <g>
          {/* Solid line for checkout/branch operations */}
          <path
            d={`M ${nodeX} ${nodeY + nodeRadius} Q ${nodeX} ${nodeY + height / 3}, ${laneInfo.primaryParentLane * LANE_WIDTH + LANE_WIDTH / 2} ${height}`}
            stroke={mainColor}
            strokeWidth={2.5}
            fill="none"
            opacity={0.95}
          />
        </g>
      )}

      {/* Draw merge lines from source lanes (INCOMING - bringing code IN) */}
      {laneInfo.mergeSourceLanes.map((sourceLane, idx) => {
        const sourceX = sourceLane * LANE_WIDTH + LANE_WIDTH / 2;
        const sourceColor = getLaneColor(sourceLane, isDark);
        const mergeArrowId = `merge-arrow-${laneInfo.laneIndex}-${idx}`;

        return (
          <g key={`merge-${sourceLane}`}>
            {/* Define arrow marker for this merge line */}
            <defs>
              <marker
                id={mergeArrowId}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M 0 0 L 6 3 L 0 6 z" fill={sourceColor} opacity={0.9} />
              </marker>
            </defs>
            {/* Glow effect for merge lines */}
            <path
              d={`M ${sourceX} ${0} Q ${sourceX} ${nodeY / 2}, ${nodeX} ${nodeY}`}
              stroke={sourceColor}
              strokeWidth={5}
              fill="none"
              opacity={0.2}
            />
            {/* Main merge line with dashed pattern and arrow */}
            <path
              d={`M ${sourceX} ${0} Q ${sourceX} ${nodeY / 2}, ${nodeX} ${nodeY}`}
              stroke={sourceColor}
              strokeWidth={3}
              fill="none"
              opacity={0.95}
              strokeDasharray="6 3"
              markerEnd={`url(#${mergeArrowId})`}
            />
          </g>
        );
      })}

      {/* Draw branch line to target lane */}
      {laneInfo.branchTargetLane !== null && (
        <path
          d={`M ${nodeX} ${nodeY} Q ${nodeX} ${nodeY + height / 4}, ${laneInfo.branchTargetLane * LANE_WIDTH + LANE_WIDTH / 2} ${height}`}
          stroke={mainColor}
          strokeWidth={2.5}
          fill="none"
          opacity={0.8}
        />
      )}

      {/* Draw commit node */}
      {isMerge ? (
        <>
          {/* Glow effect for merge commits */}
          <circle cx={nodeX} cy={nodeY} r={nodeRadius + 2} fill={mainColor} opacity={0.3} />
          {/* Outer ring for merge commits */}
          <circle
            cx={nodeX}
            cy={nodeY}
            r={nodeRadius}
            fill="none"
            stroke={mainColor}
            strokeWidth={2.5}
          />
          {/* Inner circle for merge commits */}
          <circle
            cx={nodeX}
            cy={nodeY}
            r={nodeRadius - 2}
            fill={mainColor}
            stroke={isDark ? '#1f2937' : 'white'}
            strokeWidth={1.5}
          />
          {/* Octopus merge indicator - additional inner dot */}
          {isOctopusMerge && (
            <circle cx={nodeX} cy={nodeY} r={1.5} fill={isDark ? '#1f2937' : 'white'} />
          )}
        </>
      ) : (
        <circle
          cx={nodeX}
          cy={nodeY}
          r={nodeRadius}
          fill={mainColor}
          stroke={isDark ? '#1f2937' : 'white'}
          strokeWidth={2}
        />
      )}
    </svg>
  );
});
