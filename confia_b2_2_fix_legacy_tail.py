from pathlib import Path
import shutil

path = Path.home() / "src/components/HomeShop.tsx"

if not path.exists():
    raise SystemExit(f"ERRO: não encontrado: {path}")

backup = Path("/tmp/HomeShop.tsx.before_b2_2_fix_legacy_tail")
shutil.copy2(path, backup)

text = path.read_text(encoding="utf-8")

old = """        </section>

      )}


          </div>

        </section>

      )}

    </div>
  );
};"""

new = """        </section>

      )}

    </div>
  );
};"""

if old not in text:
    raise SystemExit(
        "ERRO: não encontrei exatamente o bloco residual esperado. "
        "Nada foi alterado."
    )

text = text.replace(old, new, 1)

if "legacyItems" in text:
    raise SystemExit(
        "ERRO: ainda existe legacyItems. Nada foi gravado."
    )

path.write_text(text, encoding="utf-8")

print("=" * 68)
print("CONFIA — B2.2 FIX JSX RESIDUAL")
print("=" * 68)
print()
print("✓ </div> legacy órfão removido")
print("✓ </section> legacy órfão removido")
print("✓ )} legacy órfão removido")
print("✓ Secção dos 40 acessórios preservada")
print("✓ Fecho principal do HomeShop preservado")
print()
print(f"Backup: {backup}")
print()
print("Correção concluída.")
