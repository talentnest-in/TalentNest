

export function Logo({ className = "h-8", withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG Logo Mark */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full aspect-square"
      >
        {/* Hexagon Border */}
        <path
          d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z"
          stroke="#0B1F3A"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        
        {/* Bird / Nest abstract representation */}
        {/* Nest lines */}
        <path
          d="M25 65C40 75 60 75 75 65"
          stroke="#F26A21"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M35 75C45 80 55 80 65 75"
          stroke="#F26A21"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Bird body/wing */}
        <path
          d="M25 35L45 50C55 55 65 50 70 40C72 35 68 35 65 37C60 40 50 45 40 40L25 35Z"
          fill="#F26A21"
        />
        <path
          d="M28 48L42 58C52 65 62 60 65 50C66 45 62 45 60 48C55 52 45 58 35 52L28 48Z"
          fill="#F26A21"
        />
        {/* Eye */}
        <circle cx="65" cy="42" r="1.5" fill="#FFFFFF" />
      </svg>

      {/* Logotype */}
      {withText && (
        <div className="flex flex-col">
          <span className="font-logo font-bold text-2xl tracking-tight leading-none">
            <span className="text-primary">Talent</span>
            <span className="text-accent">Nest</span>
          </span>
          <span className="text-[0.5rem] tracking-widest text-primary font-medium uppercase leading-none mt-1">
            The Independent Career Platform
          </span>
        </div>
      )}
    </div>
  );
}
