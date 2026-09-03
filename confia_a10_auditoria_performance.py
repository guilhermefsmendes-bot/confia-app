from pathlib import Path
import re

ROOT = Path("src")

FILES = [
    "App.tsx",
    "components/Companheiro/ConfiaCompanionHome.tsx",
    "components/Companheiro/ConfiaCreature.tsx",
    "components/Avatar.tsx",
    "data/reactive/companionReactionEngine.ts",
    "data/reactive/companionRelationalMemory.ts",
]

print("=" * 76)
print("CONFIA — A10 — AUDITORIA DE PERFORMANCE")
print("=" * 76)

def read(path):
    p = ROOT / path
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def count(text, pattern):
    return len(re.findall(pattern, text))

for rel in FILES:
    text = read(rel)

    if not text:
        print(f"\n! Ficheiro não encontrado: {rel}")
        continue

    print("\n" + "-" * 76)
    print(rel)
    print("-" * 76)

    print("linhas:", len(text.splitlines()))
    print("useState:", count(text, r"\buseState\b"))
    print("useEffect:", count(text, r"\buseEffect\b"))
    print("useMemo:", count(text, r"\buseMemo\b"))
    print("useCallback:", count(text, r"\buseCallback\b"))
    print("useRef:", count(text, r"\buseRef\b"))

    print("requestAnimationFrame:",
          count(text, r"\brequestAnimationFrame\b"))
    print("setInterval:",
          count(text, r"\bsetInterval\b"))
    print("setTimeout:",
          count(text, r"\bsetTimeout\b"))

    print("onSnapshot:",
          count(text, r"\bonSnapshot\b"))
    print("addEventListener:",
          count(text, r"\baddEventListener\b"))

    print("Math.random:",
          count(text, r"\bMath\.random\b"))

    print("localStorage:",
          count(text, r"\blocalStorage\b"))

    print("framer-motion:",
          count(text, r"from ['\"]framer-motion['\"]"))

    print("<motion.:",
          count(text, r"<motion\."))

print("\n" + "=" * 76)
print("AUDITORIA ESPECÍFICA A6 → A9")
print("=" * 76)

app = read("App.tsx")
home = read("components/Companheiro/ConfiaCompanionHome.tsx")
memory = read("data/reactive/companionRelationalMemory.ts")
reaction = read("data/reactive/companionReactionEngine.ts")

checks = [
    ("resolveCompanionReaction", app + home, 1),
    ("resolveCompanionRelationalMemory", app + home, 1),
    ("resolveCompanionRelationalExpression", home, 1),
    ("resolveCompanionRelationalAction", home, 1),
    ("companionRelationalNextStep", home, 1),
    ("companionMessage", home, 1),
]

for name, text, _ in checks:
    print(f"{name}: {count(text, re.escape(name))}")

print("\n" + "=" * 76)
print("PONTOS DE ATENÇÃO")
print("=" * 76)

for rel in FILES:
    text = read(rel)

    if not text:
        continue

    for pattern, label in [
        (r"\buseEffect\s*\(\s*\(\s*\)\s*=>", "useEffect"),
        (r"\brequestAnimationFrame\b", "requestAnimationFrame"),
        (r"\bsetInterval\b", "setInterval"),
        (r"\bonSnapshot\b", "onSnapshot"),
        (r"\baddEventListener\b", "addEventListener"),
    ]:
        for m in re.finditer(pattern, text):
            line = text[:m.start()].count("\n") + 1
            print(f"{rel}:{line} -> {label}")

print("\n" + "=" * 76)
print("BUNDLE / BUILD")
print("=" * 76)

dist = Path("dist")

if dist.exists():
    files = []
    total = 0

    for p in dist.rglob("*"):
        if p.is_file():
            size = p.stat().st_size
            total += size
            files.append((size, p))

    files.sort(reverse=True)

    print("Tamanho total dist:",
          f"{total / 1024 / 1024:.2f} MB")

    print("\nMaiores ficheiros:")

    for size, p in files[:10]:
        print(f"{size / 1024:.1f} KB  {p}")

else:
    print("! dist/ ainda não existe")

print("\n" + "=" * 76)
print("FIM A10 — APENAS LEITURA")
print("=" * 76)
