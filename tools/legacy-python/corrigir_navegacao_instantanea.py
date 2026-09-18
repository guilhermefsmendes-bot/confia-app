from pathlib import Path

path = Path("src/App.tsx")
text = path.read_text(encoding="utf-8")

original = text

# 1. Menu principal: motion.div -> div e remove animações
old = '''<motion.div

              key="main-menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >'''

new = '''<div
              key="main-menu"
              className="space-y-6"
            >'''

if old not in text:
    print("ERRO: bloco do menu principal não encontrado.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

# Fecho correspondente do menu principal.
# O primeiro </motion.div> depois do bloco de Patterns é o do menu.
marker = '''{patternsPage === "evolution" && (
  <HabitEvolution
    onBack={() => setPatternsPage("menu")}
  />
)}
            </motion.div>
          )}'''

replacement = '''{patternsPage === "evolution" && (
  <HabitEvolution
    onBack={() => setPatternsPage("menu")}
  />
)}
            </div>
          )}'''

if marker not in text:
    print("ERRO: fecho do menu principal não encontrado.")
    raise SystemExit(1)

text = text.replace(marker, replacement, 1)

# 2. Companion: retirar animação de entrada
old = '''<motion.div
    key="companion-screen"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex-1 px-4 pt-4"
  >'''

new = '''<div
    key="companion-screen"
    className="flex-1 px-4 pt-4"
  >'''

if old not in text:
    print("ERRO: bloco do Companion não encontrado.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

# Fecho do Companion
old = '''    </div>
  </motion.div>
)}

{currentTab === 0 && homeScreen === "shop"'''

new = '''    </div>
  </div>
)}

{currentTab === 0 && homeScreen === "shop"'''

if old not in text:
    print("ERRO: fecho do Companion não encontrado.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

# 3. Settings: retirar animação de entrada/saída
old = '''<motion.div
    key="settings-screen"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-5"
  >'''

new = '''<div
    key="settings-screen"
    className="space-y-5"
  >'''

if old not in text:
    print("ERRO: bloco das Definições não encontrado.")
    raise SystemExit(1)

text = text.replace(old, new, 1)

# O fecho das Definições será tratado pelo marcador específico.
# Procuramos o próximo padrão de fecho antes dos restantes conteúdos.
# Neste ponto, substituímos apenas o primeiro </motion.div> após settings-screen.
settings_pos = text.find('key="settings-screen"')

if settings_pos == -1:
    print("ERRO: não foi possível localizar settings-screen após alteração.")
    raise SystemExit(1)

close_pos = text.find("</motion.div>", settings_pos)

if close_pos == -1:
    print("ERRO: fecho das Definições não encontrado.")
    raise SystemExit(1)

text = text[:close_pos] + "</div>" + text[close_pos + len("</motion.div>"):]

if text == original:
    print("ERRO: nenhuma alteração realizada.")
    raise SystemExit(1)

path.write_text(text, encoding="utf-8")

print("✓ Menu principal: navegação instantânea")
print("✓ Companion: animação de entrada removida")
print("✓ Definições: animação de entrada/saída removida")
print("✓ Nenhuma outra lógica foi alterada")
print()
print("Agora execute:")
print("npm run build")
