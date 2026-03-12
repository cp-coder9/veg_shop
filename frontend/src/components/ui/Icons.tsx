import { SVGProps } from 'react';

export const UserIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <circle cx="12" cy="10.5" r="4" />
        <path d="M2 21c0-5 5-7 10-7s10 2 10 7" />
    </svg>
);

export const CartIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect x="5" y="9" width="14" height="11" />
        <path d="M9 9c0-1.5 1-3 3-3s3 1.5 3 3" />
    </svg>
);
