import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 14,
  height: 14,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const Icon = {
  Star: (p: SVGProps<SVGSVGElement> & { filled?: boolean }) => {
    const { filled, ...rest } = p;
    return (
      <svg {...base(rest)} fill={filled ? "currentColor" : "none"}>
        <path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6z" />
      </svg>
    );
  },
  Download: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M8 2.5v8M4.8 7.6L8 10.8l3.2-3.2M2.8 13h10.4" />
    </svg>
  ),
  Compare: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M8 2v12M2.5 4h4v8h-4zM9.5 4h4v8h-4z" />
    </svg>
  ),
  Duplicate: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M5.5 5.5h7v7h-7zM3.5 10.5v-7h7" />
    </svg>
  ),
  Trash: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M3 4.5h10M6.5 4.5v-1.5h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" />
    </svg>
  ),
  Close: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  Plus: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  Lock: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M4 7.5h8v6H4zM5.5 7.5V5.2a2.5 2.5 0 015 0v2.3" />
    </svg>
  ),
  Unlock: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M4 7.5h8v6H4zM5.5 7.5V5.2a2.5 2.5 0 014.9-.6" />
    </svg>
  ),
  Reset: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M3.2 8a4.8 4.8 0 108-3.5M3.5 2.5v3h3" />
    </svg>
  ),
  Play: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)} fill="currentColor" stroke="none">
      <path d="M4.5 3l8 5-8 5z" />
    </svg>
  ),
  Pause: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)} fill="currentColor" stroke="none">
      <path d="M4 3h3v10H4zM9 3h3v10H9z" />
    </svg>
  ),
  Check: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  ),
  Point: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" />
    </svg>
  ),
  Image: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <circle cx="6" cy="7" r="1.1" />
      <path d="M2.8 12.2l3.6-3.6 2 2 2.4-2.8 2.4 3" />
    </svg>
  ),
  Cube: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M8 1.6l6 3.2v6.4L8 14.4l-6-3.2V4.8z" />
      <path d="M2 4.8L8 8l6-3.2M8 8v6.4" />
    </svg>
  ),
  Ruler: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <rect x="2" y="5.5" width="12" height="5" rx="1" transform="rotate(0 8 8)" />
      <path d="M4.5 5.5v2M7 5.5v2M9.5 5.5v2M12 5.5v2" />
    </svg>
  ),
  Move: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M8 2v12M2 8h12" />
      <path d="M8 2L6 4M8 2l2 2M8 14l-2-2M8 14l2-2M2 8l2-2M2 8l2 2M14 8l-2-2M14 8l-2 2" />
    </svg>
  ),
  Eye: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M1.5 8S4 3.8 8 3.8 14.5 8 14.5 8 12 12.2 8 12.2 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="1.8" />
    </svg>
  ),
  ChevronRight: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M6 3.5l5 4.5-5 4.5" />
    </svg>
  ),
};
