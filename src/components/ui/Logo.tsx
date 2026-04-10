

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-16 h-16" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Silver metallic gradient for the arrow */}
        <linearGradient id="silver" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="30%" stopColor="#94a3b8" />
          <stop offset="70%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        
        {/* Colorful gradients for the chart bars */}
        <linearGradient id="bar1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
        <linearGradient id="bar2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id="bar3" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="bar4" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="bar5" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        
        {/* Drop shadow for 3D effect */}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.6"/>
        </filter>
        <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4"/>
        </filter>
      </defs>

      {/* The colored bars */}
      <g filter="url(#barShadow)">
        <rect x="40" y="130" width="10" height="15" fill="url(#bar1)" rx="1" transform="rotate(5 40 130)" />
        <rect x="65" y="112" width="10" height="28" fill="url(#bar2)" rx="1" transform="rotate(10 65 112)" />
        <rect x="90" y="90" width="10" height="42" fill="url(#bar3)" rx="1" transform="rotate(15 90 90)" />
        <rect x="115" y="65" width="10" height="58" fill="url(#bar4)" rx="1" transform="rotate(20 115 65)" />
        <rect x="140" y="38" width="10" height="75" fill="url(#bar5)" rx="1" transform="rotate(25 140 38)" />
      </g>

      {/* The swooping silver arrow */}
      <path 
        d="M 10 180 C 60 170, 110 130, 145 75 L 125 68 L 180 30 L 170 90 L 155 83 C 125 140, 75 185, 15 190 Z" 
        fill="url(#silver)" 
        stroke="#1e293b"
        strokeWidth="1.5"
        filter="url(#shadow)"
      />
    </svg>
  );
}
