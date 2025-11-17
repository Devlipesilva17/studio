import type { SVGProps } from "react";

export function PoolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14c0 2.76 2.24 5 5 5s5-2.24 5-5" />
      <path d="M11.5 14a6 6 0 1 0-6-6" />
      <path d="M18 10h4v4h-4z" />
      <path d="M14 4h6v6h-6z" />
    </svg>
  );
}
