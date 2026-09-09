import React from "react";

const skeletonStyle = {
  shimmer: {
    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "6px",
    display: "inline-block",
  },
};

function SkeletonCell({ width = "80%", height = "14px", style = {} }) {
  return (
    <div
      style={{
        ...skeletonStyle.shimmer,
        width,
        height,
        ...style,
      }}
    />
  );
}

/**
 * ArrivalListSkeleton
 * @param {number} columns - number of columns in the table
 * @param {number} rows - number of skeleton rows to show (default 6)
 */
function ArrivalListSkeleton({ columns = 6, rows = 6 }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} style={{ borderBottom: "1px solid #f0f0f0" }}>
          {/* Booking ID */}
          <td style={{ padding: "14px 16px" }}>
            <SkeletonCell width="90px" height="13px" />
          </td>

          {/* Guest Name (double line) */}
          <td style={{ padding: "14px 16px" }}>
            <SkeletonCell width="120px" height="13px" />
            <SkeletonCell width="90px" height="11px" style={{ marginTop: "6px" }} />
          </td>

          {/* Middle columns */}
          {Array.from({ length: columns - 4 }).map((_, colIdx) => (
            <td key={colIdx} style={{ padding: "14px 16px" }}>
              <SkeletonCell width="80%" height="13px" />
            </td>
          ))}

          {/* Status badge */}
          <td style={{ padding: "14px 16px" }}>
            <SkeletonCell width="70px" height="24px" style={{ borderRadius: "12px" }} />
          </td>

          {/* Actions */}
          <td style={{ padding: "14px 16px", textAlign: "center" }}>
            <SkeletonCell width="30px" height="28px" style={{ borderRadius: "6px", margin: "0 auto" }} />
          </td>
        </tr>
      ))}
    </>
  );
}

export default ArrivalListSkeleton;
