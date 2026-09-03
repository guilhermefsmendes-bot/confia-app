from pathlib import Path
import shutil

arquivo = Path("src/App.tsx")
backup = Path("src/App.tsx.backup_navegacao_home")

# Criar backup
shutil.copy2(arquivo, backup)
print(f"Backup criado em: {backup}")

texto = arquivo.read_text(encoding="utf-8")

# 1. Corrigir a função changeTab
antigo_change_tab = """const changeTab = (tab:number) => {
  setCurrentTab(tab);
};"""

novo_change_tab = """const changeTab = (tab:number) => {
  // Sempre que mudamos de separador, fechamos qualquer sub-ecrã
  // aberto dentro do separador principal.
  setHomeScreen("home");
  setCurrentTab(tab);
};"""

if antigo_change_tab not in texto:
    print("ERRO: não encontrei a função changeTab esperada.")
    print("Nenhuma alteração foi feita.")
    raise SystemExit(1)

texto = texto.replace(antigo_change_tab, novo_change_tab, 1)

# 2. Corrigir a navegação inferior
antigo_nav = """onClick={() => {
  window.dispatchEvent(new Event("stop-background-audio"));
  setCurrentTab(tab.index);
}}"""

novo_nav = """onClick={() => {
  window.dispatchEvent(new Event("stop-background-audio"));
  setHomeScreen("home");
  setCurrentTab(tab.index);
}}"""

if antigo_nav not in texto:
    print("ERRO: não encontrei o botão de navegação esperado.")
    print("Nenhuma alteração foi feita.")
    raise SystemExit(1)

texto = texto.replace(antigo_nav, novo_nav, 1)

arquivo.write_text(texto, encoding="utf-8")

print("Correção aplicada com sucesso.")
print()
print("A navegação agora força homeScreen para 'home' antes de mudar de separador.")
