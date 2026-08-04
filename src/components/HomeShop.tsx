import React, { useState } from "react";

import { homeItems } from "../data/homeItems";
import { getInventory, buyItem } from "../storage/homeInventory";


interface HomeShopProps {
  onBack: () => void;
  xp: number;
  spendXp: (amount: number) => void;
  onBuy: (item: any) => void;
}


const HomeShop: React.FC<HomeShopProps> = ({
  onBack,
  xp,
  spendXp,
  onBuy,
}) => {

  const [, setRefresh] = useState(0);

  const inventory = getInventory();


  return (

    <div className="space-y-6">


      <button
        onClick={onBack}
        className="text-3xl"
      >
        ←
      </button>


<div className="text-5xl text-center">
  🏠
</div>

      <div className="text-center font-bold text-slate-600">
        ⭐ XP l: {xp}
      </div>



      <div className="grid grid-cols-3 gap-4">


        {homeItems.map((item) => {


          const owned = inventory.includes(item.id);



          return (

            <div
              key={item.id}
              className="bg-white rounded-2xl shadow p-4 flex flex-col items-center gap-3"
            >


              <div className="text-6xl">
                {item.emoji}
              </div>



              <div className="font-bold text-sm">
                {item.cost} XP
              </div>



              <button

                disabled={owned || xp < item.cost}


                onClick={() => {

                  if (owned) return;

                  spendXp(item.cost);

                  buyItem(item.id);

                  onBuy(item);

                  setRefresh(v => v + 1);

                }}


                className={`w-full rounded-xl py-2 font-bold ${
                  owned
                    ? "bg-green-500 text-white"
                    : "bg-slate-200"
                }`}

              >

{owned
  ? "✔"
  : "🛒"
}
              </button>


            </div>

          );


        })}


      </div>


    </div>

  );

};


export default HomeShop;
