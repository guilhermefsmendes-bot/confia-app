export default function GrassTexture() {
  const patches = [
    { left: "10%", top: "65%", size: "12px" },
    { left: "25%", top: "78%", size: "8px" },
    { left: "40%", top: "70%", size: "10px" },
    { left: "55%", top: "82%", size: "14px" },
    { left: "70%", top: "68%", size: "9px" },
    { left: "85%", top: "76%", size: "12px" },
    { left: "15%", top: "90%", size: "10px" },
    { left: "60%", top: "92%", size: "8px" },
  ];

  return (
    <>
      {patches.map((patch, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-green-900/10 pointer-events-none"
          style={{
            left: patch.left,
            top: patch.top,
            width: patch.size,
            height: patch.size,
          }}
        />
      ))}
    </>
  );
}
