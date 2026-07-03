interface LogoProps {
    /** Rendered square size in px. */
    size?: number;
    className?: string;
}

/**
 * Brand mark — violet gradient tile with a shield-and-keyhole glyph.
 * Single source of truth for the app logo (sidebar, login, mobile bar).
 */
export function Logo({ size = 40, className = '' }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 ${className}`}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="px-logo-g" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#8e77e8" />
                    <stop offset="0.55" stopColor="#6e56cf" />
                    <stop offset="1" stopColor="#5a44b8" />
                </linearGradient>
            </defs>
            <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#px-logo-g)" />
            <path
                d="M24 8.5l11.5 4.2v9.1c0 7.4-4.85 12.9-11.5 14.7-6.65-1.8-11.5-7.3-11.5-14.7v-9.1L24 8.5z"
                fill="rgba(255,255,255,0.14)"
            />
            <circle cx="24" cy="20.5" r="4.4" fill="#fff" />
            <path
                d="M22.1 23.6h3.8l1.5 7.6a1.7 1.7 0 0 1-1.67 2H22.27a1.7 1.7 0 0 1-1.67-2l1.5-7.6z"
                fill="#fff"
            />
        </svg>
    );
}
