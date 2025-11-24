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


export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M15.5 10.2c.3-.8.5-1.7.5-2.7a8.5 8.5 0 0 0-17 0 8.5 8.5 0 0 0 4.2 7.3" />
      <path d="M14 14.5c.9-.9 1.5-2.1 1.5-3.5a5.5 5.5 0 0 0-11 0 5.5 5.5 0 0 0 2.3 4.4" />
      <path d="M22 19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1z" />
      <path d="M18 14v-2" />
    </svg>
  );
}
