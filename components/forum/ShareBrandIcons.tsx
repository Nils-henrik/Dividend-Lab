type IconProps = {
  className?: string;
};

export function ShareXIcon({ className = "h-9 w-9" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
    >
      <rect width="24" height="24" rx="5.5" fill="#000000" />
      <path
        fill="#FFFFFF"
        d="M13.68 10.621 18.588 4.928h-1.162l-4.516 5.236L8.896 4.928H4.674l5.16 7.509-5.16 5.985h1.162l4.588-5.319 3.682 5.319h4.222L13.68 10.621zm-1.161 1.348-.523-.748-4.168-5.962H6.678l3.371 4.831.523.748 4.374 6.256h2.051l-3.568-5.125z"
      />
    </svg>
  );
}

export function ShareFacebookIcon({ className = "h-9 w-9" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
    >
      <rect width="24" height="24" rx="5.5" fill="#1877F2" />
      <path
        fill="#FFFFFF"
        d="M14.5 4h-1.8c-2.2 0-3.6 1.4-3.6 3.6V10H7v3h2.1v9h3.4v-9h2.9l.5-3h-3.4V8.1c0-.9.7-1.1 1.2-1.1h2.1V4z"
      />
    </svg>
  );
}

export function ShareCopyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
