from pathlib import Path
import shutil

arquivo = Path("src/App.tsx")
backup = Path("src/App.tsx.backup_botoes_menu")

shutil.copy2(arquivo, backup)
print(f"Backup criado: {backup}")

texto = arquivo.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Remover o bloco atual dos botões mochila + casa
# ---------------------------------------------------------

bloco_antigo = '''{currentTab === 0 && homeScreen === "home" && (
  <div className="flex justify-center gap-10 py-4">

    <button
      onClick={() => setHomeScreen("inventory")}
      className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center active:scale-95 transition hover:shadow-lg"
    >
      <span className="text-5xl">🎒</span>
    </button>

    <button
      onClick={() => setHomeScreen("shop")}
      className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center active:scale-95 transition hover:shadow-lg"
    >
      <span className="text-5xl">🏠</span>
    </button>

  </div>
)}'''

if bloco_antigo not in texto:
    print("AVISO: bloco mochila/casa não encontrado.")
else:
    texto = texto.replace(bloco_antigo, "", 1)
    print("Bloco antigo mochila/casa removido.")

# ---------------------------------------------------------
# 2. Remover botão definições que estava fora do menu
# ---------------------------------------------------------

bloco_settings = '''<button
  onClick={() => setHomeScreen("settings")}
  className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center active:scale-95 transition hover:shadow-lg"
>
  <span className="text-5xl">⚙️</span>
</button>
'''

if bloco_settings not in texto:
    print("AVISO: botão definições não encontrado.")
else:
    texto = texto.replace(bloco_settings, "", 1)
    print("Botão definições removido da posição antiga.")

# ---------------------------------------------------------
# 3. Inserir os três botões imediatamente depois do HomeWorld
# ---------------------------------------------------------

alvo = '''<HomeWorld
  avatar={avatar}
  avatarCelebrating={avatarCelebrating}
  avatarMemoryMessage={avatarMemoryMessage}
  morningRating={morningRating}
  afternoonRating={afternoonRating}
  handlePetAvatar={handlePetAvatar}
/>'''

novo = alvo + '''

{/* Botões do menu principal — só existem quando homeScreen === "home" */}
{homeScreen === "home" && (
  <div className="flex justify-center gap-6 py-4">

    <button
      onClick={() => setHomeScreen("inventory")}
      className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center active:scale-95 transition hover:shadow-lg"
    >
      <span className="text-5xl">🎒</span>
    </button>

    <button
      onClick={() => setHomeScreen("shop")}
      className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center active:scale-95 transition hover:shadow-lg"
    >
      <span className="text-5xl">🏠</span>
    </button>

    <button
      onClick={() => setHomeScreen("settings")}
      className="w-20 h-20 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center active:scale-95 transition hover:shadow-lg"
    >
      <span className="text-5xl">⚙️</span>
    </button>

  </div>
)}'''

if alvo not in texto:
    print("ERRO: HomeWorld não encontrado.")
    arquivo.write_text(texto, encoding="utf-8")
    raise SystemExit(1)

texto = texto.replace(alvo, novo, 1)
print("Os três botões foram colocados imediatamente depois do HomeWorld.")

arquivo.write_text(texto, encoding="utf-8")

print()
print("Correção concluída.")
print(f"Backup: {backup}")
