import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style = {} }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

interface SkeletonTableProps {
  rows?: number;
  columns: number;
}

export function SkeletonTable({ rows = 5, columns }: SkeletonTableProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton className="skeleton-text" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
