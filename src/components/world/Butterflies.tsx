import { memo } from "react";

function Butterfly({
  className,
  opacity = 1,
  scale = 1,
  rotate = 0,
}: {
  className: string;
  opacity?: number;
  scale?: number;
  rotate?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 40"
      className={className}
      style={{
        opacity,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="confiaButterflyWing"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#F3C7B5" />
          <stop offset="100%" stopColor="#C97B5E" />
        </linearGradient>

        <linearGradient
          id="confiaButterflyWingSoft"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#F7E3D9" />
          <stop offset="100%" stopColor="#DDA38A" />
        </linearGradient>
      </defs>

      {/* asas superiores */}
      <path
        d="M22 19 C15 4 2 5 5 16 C7 24 15 25 22 21 Z"
        fill="url(#confiaButterflyWing)"
      />

      <path
        d="M26 19 C33 4 46 5 43 16 C41 24 33 25 26 21 Z"
        fill="url(#confiaButterflyWing)"
      />

      {/* asas inferiores */}
      <path
        d="M21 22 C14 20 8 24 10 31 C12 36 19 32 23 25 Z"
        fill="url(#confiaButterflyWingSoft)"
      />

      <path
        d="M27 22 C34 20 40 24 38 31 C36 36 29 32 25 25 Z"
        fill="url(#confiaButterflyWingSoft)"
      />

      {/* corpo */}
      <ellipse
        cx="24"
        cy="22"
        rx="2.2"
        ry="8"
        fill="#5C4035"
      />

      {/* antenas */}
      <path
        d="M23 14 C20 9 18 8 16 8"
        fill="none"
        stroke="#5C4035"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      <path
        d="M25 14 C28 9 30 8 32 8"
        fill="none"
        stroke="#5C4035"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Butterflies() {
  return (
    <div
      className="absolute inset-0 z-[21] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <Butterfly
        className="absolute left-[64%] top-[34%] w-[30px]"
        opacity={0.82}
        scale={1}
        rotate={8}
      />

      <Butterfly
        className="absolute left-[29%] top-[43%] w-[23px]"
        opacity={0.62}
        scale={0.85}
        rotate={-12}
      />

      <Butterfly
        className="absolute right-[18%] top-[27%] w-[18px]"
        opacity={0.38}
        scale={0.72}
        rotate={16}
      />
    </div>
  );
}

export default memo(Butterflies);
