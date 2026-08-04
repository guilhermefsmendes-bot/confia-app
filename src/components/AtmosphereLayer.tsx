import React from "react";


const AtmosphereLayer = () => {

  return (

    <div className="absolute inset-0 overflow-hidden pointer-events-none">


      {/* Nuvens */}

      <div className="absolute top-10 left-10 text-6xl opacity-80 animate-pulse">
        ☁️
      </div>


      <div className="absolute top-24 right-20 text-5xl opacity-70 animate-pulse">
        ☁️
      </div>


      {/* Brilho suave */}

      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white/20 to-transparent" />



      {/* Partículas */}

      <div className="absolute top-32 left-1/3 text-xl animate-bounce opacity-70">
        ✨
      </div>


      <div className="absolute top-44 right-1/3 text-xl animate-bounce opacity-60">
        ✨
      </div>


    </div>

  );

};


export default AtmosphereLayer;
