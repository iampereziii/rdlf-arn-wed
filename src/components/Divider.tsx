interface Props {
  inverted?: boolean
}

export default function Divider({ inverted = false }: Props) {
  return (
    <div className={`flex justify-center my-5 ${inverted ? 'text-white/40' : 'text-accent/40'}`}>
      <svg
        viewBox="0 0 220 28"
        className="w-52 h-7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        aria-hidden="true"
      >
        {/* Left line */}
        <line x1="0" y1="14" x2="82" y2="14" strokeWidth="0.5" />
        {/* Left leaf */}
        <path d="M 80,14 C 83,8 91,7 93,12 C 91,17 83,18 80,14" strokeWidth="0.8" />
        {/* 6-petal magnolia — matches botanical line art on the invitation */}
        <g transform="translate(110,14)" strokeWidth="0.9">
          <path d="M 0,0 C -2,-3 -1.5,-7 0,-9 C 1.5,-7 2,-3 0,0" />
          <path d="M 0,0 C -2,-3 -1.5,-7 0,-9 C 1.5,-7 2,-3 0,0" transform="rotate(60)" />
          <path d="M 0,0 C -2,-3 -1.5,-7 0,-9 C 1.5,-7 2,-3 0,0" transform="rotate(120)" />
          <path d="M 0,0 C -2,-3 -1.5,-7 0,-9 C 1.5,-7 2,-3 0,0" transform="rotate(180)" />
          <path d="M 0,0 C -2,-3 -1.5,-7 0,-9 C 1.5,-7 2,-3 0,0" transform="rotate(240)" />
          <path d="M 0,0 C -2,-3 -1.5,-7 0,-9 C 1.5,-7 2,-3 0,0" transform="rotate(300)" />
          <circle cx="0" cy="0" r="2" fill="currentColor" stroke="none" />
        </g>
        {/* Right leaf */}
        <path d="M 140,14 C 137,8 129,7 127,12 C 129,17 137,18 140,14" strokeWidth="0.8" />
        {/* Right line */}
        <line x1="138" y1="14" x2="220" y2="14" strokeWidth="0.5" />
      </svg>
    </div>
  )
}
