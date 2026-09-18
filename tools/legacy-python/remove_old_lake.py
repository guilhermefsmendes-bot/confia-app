from pathlib import Path
import re

path = Path("src/components/HomeWorld.tsx")
text = path.read_text()

pattern = re.compile(
    r'\n<div\s+'
    r'className="\s*'
    r'absolute\s+'
    r'right-8\s+'
    r'bottom-\[120px\]\s+'
    r'w-52\s+'
    r'h-28\s+'
    r'rounded-\[50%\]\s+'
    r'bg-gradient-to-b\s+'
    r'from-sky-200\s+'
    r'via-cyan-300\s+'
    r'to-blue-500\s+'
    r'shadow-xl\s+'
    r'z-10\s+'
    r'overflow-hidden\s*'
    r'"\s*'
    r'>.*?'
    r'</div>\s*',
    re.DOTALL
)

new_text, count = pattern.subn("\n", text, count=1)

if count == 0:
    print("⚠️ Lago antigo não encontrado.")
else:
    path.write_text(new_text)
    print("✓ Lago antigo removido.")
    print("✓ PremiumWater continua intacto.")
