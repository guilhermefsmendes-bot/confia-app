import React, { useState } from "react";

import { homeItems } from "../data/homeItems";

import {
  getInventory,
  getEquipped,
  toggleEquip,
} from "../storage/homeInventory";


interface HomeInventoryProps {
  onBack: () => void;
}


const HomeInventory: React.FC<HomeInventoryProps> = ({ onBack }) => {

  const [, setRefresh] = useState(0);

  const inventory = getInventory();
  const equipped = getEquipped();


  const items = homeItems.filter(item =>
    inventory.includes(item.id)
  );


  return (

    <div className="space-y-6">


      <button
        onClick={onBack}
        className="text-3xl"
      >
        ←
      </button>

<div className="text-5xl text-center">
  🎒
</div>
 

      {items.length === 0 ? (

        <div className="bg-white rounded-3xl p-6 shadow-md text-center">

          <div className="text-6xl mb-4">
            📦
          </div>

          <p className="text-slate-500">
            Ainda não tens objetos.
          </p>

        </div>


      ) : (


        <div className="grid grid-cols-3 gap-4">


          {items.map(item => {


            const isEquipped =
              equipped.includes(item.id);



            return (

              <div
                key={item.id}
                className="bg-white rounded-2xl shadow p-4 flex flex-col items-center gap-3"
              >


                <div className="text-6xl">
                  {item.emoji}
                </div>



                <button
                  onClick={() => {

                    toggleEquip(item.id);

                    setRefresh(v => v + 1);

                  }}

                  className={`w-full rounded-xl py-2 font-bold ${
                    isEquipped
                      ? "bg-green-500 text-white"
                      : "bg-slate-200"
                  }`}
                >

                  {isEquipped
                    ? "✔"
                    : "Equipar"
                  }

                </button>


              </div>

            );


          })}


        </div>


      )}


    </div>

  );

};


export default HomeInventory;
