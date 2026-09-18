from pathlib import Path
import re
import shutil
from datetime import datetime

p = Path("src/components/InnerCanvas/InnerCanvas.tsx")

if not p.exists():
    raise SystemExit("ERRO: InnerCanvas.tsx não encontrado")

stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup = p.with_name(
    p.name + f".before_fix_imports_{stamp}"
)
shutil.copy2(p, backup)

s = p.read_text(encoding="utf-8")

# ------------------------------------------------------------
# Remove o import incorreto criado pelo patch anterior.
# ------------------------------------------------------------

bad_import = re.compile(
    r'import\s*\{\s*'
    r'deleteInnerCanvasEntry,.*?'
    r'type\s+InnerCanvasTier,\s*'
    r'\}\s*from\s*"react-i18next";',
    re.S,
)

s, count = bad_import.subn("", s, count=1)

if count != 1:
    raise SystemExit(
        "ERRO: não encontrei exatamente o import incorreto."
    )

# ------------------------------------------------------------
# Imports corretos.
# ------------------------------------------------------------

imports = '''import { useTranslation } from "react-i18next";

import {
  EMOTIONAL_STATES,
  FAMILY_COLORS,
  getDominantStates,
  hashAnswers,
  seededNoise,
  type EmotionalAnswers,
  type EmotionalFamily,
} from "./innerCanvasEngine";

import {
  deleteInnerCanvasEntry,
  getInnerCanvasDayKey,
  getInnerCanvasGallery,
  getInnerCanvasRewardProgress,
  saveInnerCanvasEntry,
  type InnerCanvasEntry,
  type InnerCanvasTier,
} from "../../storage/innerCanvasStorage";
'''

# Coloca-os imediatamente depois do import React.
react_import = re.search(
    r'import React,\s*\{.*?\}\s*from\s*"react";',
    s,
    re.S,
)

if not react_import:
    raise SystemExit(
        "ERRO: import React não encontrado."
    )

insert_at = react_import.end()

s = (
    s[:insert_at]
    + "\n\n"
    + imports
    + s[insert_at:]
)

# ------------------------------------------------------------
# Verificações antes de gravar.
# ------------------------------------------------------------

checks = [
    'from "react-i18next"',
    'from "./innerCanvasEngine"',
    'from "../../storage/innerCanvasStorage"',
    "useTranslation",
    "EMOTIONAL_STATES",
    "EmotionalAnswers",
    "getInnerCanvasGallery",
    "InnerCanvasTier",
]

for token in checks:
    if token not in s:
        raise SystemExit(
            f"ERRO DE SEGURANÇA: falta {token}"
        )

# Não pode voltar a existir storage vindo do react-i18next.
if re.search(
    r'deleteInnerCanvasEntry.*?from\s*"react-i18next"',
    s,
    re.S,
):
    raise SystemExit(
        "ERRO: import incorreto ainda existe."
    )

p.write_text(s, encoding="utf-8")

print("=" * 68)
print("CONFIA — IMPORTS INNER CANVAS CORRIGIDOS")
print("=" * 68)
print(f"✓ backup: {backup}")
print("✓ useTranslation → react-i18next")
print("✓ motor artístico → ./innerCanvasEngine")
print("✓ Bronze/Prata/Ouro → ../../storage/innerCanvasStorage")
print("✓ nenhuma outra lógica alterada")
print("=" * 68)
