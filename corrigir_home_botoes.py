from pathlib import Path
import shutil

arquivo = Path("src/App.tsx")
backup = Path("src/App.tsx.backup_home_botoes")

# Criar backup
shutil.copy2(arquivo, backup)
print(f"Backup criado em: {backup}")

texto = arquivo.read_text(encoding="utf-8")

# Bloco atual dos botões Mochila + Casa
bloco_antigo = '''{homeScreen === "home" && (
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

# Novo bloco: exige explicitamente o separador 0
bloco_novo = '''{currentTab === 0 && homeScreen === "home" && (
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
    print("ERRO: não encontrei o bloco esperado.")
    print("Nenhuma alteração foi feita.")
    raise SystemExit(1)

texto = texto.replace(bloco_antigo, bloco_novo, 1)

arquivo.write_text(texto, encoding="utf-8")

print("Correção aplicada com sucesso.")
print()
print("Agora confirma com:")
print('grep -n -A25 -B2 "currentTab === 0 && homeScreen === \\"home\\"" src/App.tsx')
