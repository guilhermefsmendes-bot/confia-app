from pathlib import Path
import shutil

arquivo = Path("src/App.tsx")
backup = Path("src/App.tsx.backup_primeiro_separador")

shutil.copy2(arquivo, backup)
print(f"Backup criado: {backup}")

texto = arquivo.read_text(encoding="utf-8")

# Procuramos o início do conteúdo principal do primeiro separador.
inicio = '{currentTab === 0 && homeScreen === "home" && ('

# O conteúdo do HomeWorld já está protegido por currentTab/homeScreen.
# Reforçamos especificamente os botões para que só existam no primeiro separador.
antigo = '''{currentTab === 0 && homeScreen === "home" && (
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

novo = '''{currentTab === 0 && homeScreen === "home" ? (
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
) : null}'''

if antigo not in texto:
    print("ERRO: bloco dos botões não encontrado.")
    print("Nenhuma alteração foi feita.")
    raise SystemExit(1)

texto = texto.replace(antigo, novo, 1)

arquivo.write_text(texto, encoding="utf-8")

print("Correção aplicada.")
print("Backup disponível em:", backup)
