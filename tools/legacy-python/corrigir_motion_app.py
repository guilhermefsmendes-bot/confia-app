from pathlib import Path

path = Path("src/App.tsx")
text = path.read_text()

# Restaurar AnimatePresence mode="wait"
text = text.replace(
    '<AnimatePresence>\n{currentTab === 0 && homeScreen === "home" && (',
    '<AnimatePresence mode="wait">\n{currentTab === 0 && homeScreen === "home" && (',
    1
)

# Restaurar exit da página principal
text = text.replace(
    '''initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"''',
    '''initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"''',
    1
)

# Restaurar exits das restantes telas
replacements = [
    (
        '''initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-5"''',
        '''initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-5"'''
    ),
    (
        '''initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white border border-slate-100/80''',
        '''initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white border border-slate-100/80'''
    ),
    (
        '''initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"''',
        '''initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-6"'''
    ),
    (
        '''initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
<ProgressoDashboard''',
        '''initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
<ProgressoDashboard'''
    ),
]

for old, new in replacements:
    text = text.replace(old, new, 1)

path.write_text(text)

print("✓ App.tsx: animações de saída restauradas")
print("✓ AnimatePresence mode='wait' restaurado")
print("✓ Nenhuma outra lógica foi alterada")
