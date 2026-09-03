from pathlib import Path
import shutil

arquivo = Path("src/App.tsx")
backup = Path("src/App.tsx.backup_reset_homescreen")

shutil.copy2(arquivo, backup)
print(f"Backup criado: {backup}")

texto = arquivo.read_text(encoding="utf-8")

# Importar useEffect caso ainda não esteja importado
if "useEffect" not in texto.split("from \"react\"")[0]:
    texto = texto.replace(
        'import React, { useState } from "react";',
        'import React, { useEffect, useState } from "react";',
        1
    )

# Se o React estiver importado com outra combinação, verificar manualmente.
if "import React, { useEffect, useState } from \"react\";" not in texto:
    print("AVISO: não consegui confirmar o import de useEffect.")

# Procurar a declaração de currentTab
marcador = 'const [currentTab, setCurrentTab] = useState<number>(0);'

efeito = '''
const [currentTab, setCurrentTab] = useState<number>(0);

useEffect(() => {
  // Ao sair de qualquer sub-ecrã do primeiro separador,
  // garantir que o próximo acesso ao separador principal
  // começa sempre no menu principal.
  if (currentTab !== 0) {
    setHomeScreen("home");
  }
}, [currentTab]);
'''

if marcador not in texto:
    print("ERRO: não encontrei currentTab.")
    print("Nenhuma alteração foi feita.")
    raise SystemExit(1)

texto = texto.replace(marcador, efeito, 1)

arquivo.write_text(texto, encoding="utf-8")

print("useEffect de reset do homeScreen adicionado com sucesso.")
print(f"Backup: {backup}")
