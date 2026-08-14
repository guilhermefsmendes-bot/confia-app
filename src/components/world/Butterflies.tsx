import { memo } from "react";
function Butterflies() {
  return (
    <>
      <div
        className="absolute text-3xl pointer-events-none select-none"
        style={{
          left: "65%",
          top: "35%",
        }}
      >
        🦋
      </div>

      <div
        className="absolute text-2xl pointer-events-none select-none"
        style={{
          left: "30%",
          top: "45%",
        }}
      >
        🦋
      </div>
    </>
  );
}

export default memo(Butterflies);
