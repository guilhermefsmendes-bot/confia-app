from pathlib import Path
import shutil
import sys

PATH = Path("src/App.tsx")
BACKUP = Path("/tmp/App.tsx.before_test_xp_300")

if not PATH.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = PATH.read_text(encoding="utf-8")

MARKER = "CONFIA_TEST_XP_300"

if MARKER in text:
    print("ERRO: os 300 XP de teste já estão preparados.")
    sys.exit(1)

anchor = '''const [inventory, setInventory] = useState<any[]>([]);'''

if anchor not in text:
    print("ERRO: não encontrei o ponto seguro de inserção.")
    sys.exit(1)

block = '''

// CONFIA_TEST_XP_300 — TEMPORÁRIO
useEffect(() => {
  const testKey = "confia_test_xp_300_given";

  if (localStorage.getItem(testKey)) return;

  setAvatar(prev => {
    const nextXp = prev.xp + 300;

    return {
      ...prev,
      xp: nextXp,
      // Apenas para o teste: evita barra de progresso > 100%
      maxXp: Math.max(prev.maxXp, nextXp + 100)
    };
  });

  localStorage.setItem(testKey, "1");
}, []);
// FIM CONFIA_TEST_XP_300

'''

shutil.copy2(PATH, BACKUP)

text = text.replace(
    anchor,
    block + anchor,
    1
)

PATH.write_text(text, encoding="utf-8")

print("=" * 68)
print("CONFIA — XP TEMPORÁRIO PARA TESTE")
print("=" * 68)
print("✓ +300 XP será atribuído uma única vez")
print("✓ nível não é alterado")
print("✓ pontos não são alterados")
print("✓ preços não são alterados")
print("✓ compras continuam a descontar XP normalmente")
print("✓ proteção contra atribuição repetida")
print()
print("Backup:")
print(f"  {BACKUP}")
print()
print("Agora executa:")
print("  npm run build")
print("=" * 68)
