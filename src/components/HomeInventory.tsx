import React, { useState } from "react";

import { homeItems } from "../data/homeItems";

import {
  getInventory,
  getEquipped,
  toggleEquip,
} from "../storage/homeInventory";

import { getWeeklyTrophies } from "../storage/weeklyTrophies";

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

  const weeklyTrophies = getWeeklyTrophies();

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

      {items.length === 0 && weeklyTrophies.length === 0 ? (

        <div className="bg-white rounded-3xl p-6 shadow-md text-center">

          <div className="text-6xl mb-4">
            📦
          </div>

          <p className="text-slate-500">
            Ainda não tens objetos.
          </p>

        </div>

      ) : (

        <>

          {items.length > 0 && (
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
                      {isEquipped ? "✔" : "Equipar"}
                    </button>

                  </div>

                );
              })}

            </div>
          )}

          {weeklyTrophies.length > 0 && (

            <div className="space-y-4">

              <div className="text-center">
                <div className="text-4xl">
                  🏆
                </div>

                <p className="mt-1 font-extrabold text-[#4E3B36]">
                  Troféus
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                {weeklyTrophies.map(trophy => {

                  const isEquipped =
                    equipped.includes(trophy.id);

                  return (

                    <div
                      key={trophy.id}
                      className="rounded-2xl bg-white p-4 shadow flex flex-col items-center gap-3"
                    >

                      <div className="text-6xl">
                        {trophy.emoji}
                      </div>

                      <div className="w-full text-center">

                        <p className="text-sm font-extrabold text-[#4E3B36] break-words">
                          {trophy.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Objetivo concluído
                        </p>

                      </div>

                      <button
                        onClick={() => {
                          toggleEquip(trophy.id);
                          setRefresh(v => v + 1);
                        }}
                        className={`w-full rounded-xl py-2 font-bold ${
                          isEquipped
                            ? "bg-green-500 text-white"
                            : "bg-slate-200"
                        }`}
                      >
                        {isEquipped ? "✔" : "Equipar"}
                      </button>

                    </div>

                  );

                })}

              </div>

            </div>

          )}

        </>

      )}

    </div>
  );
};

export default HomeInventory;
