from pathlib import Path
import re
import sys

# ============================================================
# CONFIA — AUDITORIA
# COMUNIDADE + CHAT APÓS MUDANÇA PARA SEPARADOR ISOLADO
#
# APENAS LEITURA.
#
# Objetivo:
# perceber se a mudança da Comunidade para um separador
# próprio pode ter afetado:
#
# - montagem/desmontagem do feed
# - estado do post selecionado
# - abertura do CommunityChat
# - props passadas ao chat
# - currentTab / navegação
# - autenticação Firebase
# - geração de chatId
# - onSnapshot / listeners
# - envio de mensagens
# - participantes
# - redLikedBy / autor do post
#
# NÃO ALTERA FICHEIROS.
# ============================================================

ROOT = Path.cwd()

CANDIDATES = {
    "APP": ROOT / "src/App.tsx",
    "FEED": ROOT / "src/components/PartilhaFeed.tsx",
    "CHAT": ROOT / "src/components/CommunityChat.tsx",
    "FIREBASE": ROOT / "src/firebase.ts",
}

print("=" * 78)
print("CONFIA — AUDITORIA COMUNIDADE / CHAT / SEPARADOR")
print("=" * 78)

missing = []

for name, path in CANDIDATES.items():
    if path.exists():
        print(f"✓ {name}: {path}")
    else:
        print(f"✗ {name}: {path}")
        missing.append(path)

if missing:
    print()
    print("Auditoria interrompida: faltam ficheiros essenciais.")
    sys.exit(1)

texts = {
    name: path.read_text(encoding="utf-8")
    for name, path in CANDIDATES.items()
}

app = texts["APP"]
feed = texts["FEED"]
chat = texts["CHAT"]
firebase = texts["FIREBASE"]


def section(title):
    print()
    print("-" * 78)
    print(title)
    print("-" * 78)


def show_matches(label, text, patterns):
    print()
    print(f"[{label}]")
    found_any = False

    lines = text.splitlines()

    for pattern in patterns:
        regex = re.compile(pattern, re.IGNORECASE)

        matches = []

        for i, line in enumerate(lines, start=1):
            if regex.search(line):
                matches.append((i, line.rstrip()))

        if matches:
            found_any = True
            print()
            print(f"PADRÃO: {pattern}")

            for line_no, line in matches[:30]:
                print(f"{line_no}: {line}")

            if len(matches) > 30:
                print(f"... +{len(matches) - 30} ocorrências")
        else:
            print()
            print(f"PADRÃO: {pattern}")
            print("  — não encontrado")

    return found_any


def context(text, marker, before=12, after=35):
    lines = text.splitlines()

    for i, line in enumerate(lines):
        if marker.lower() in line.lower():
            start = max(0, i - before)
            end = min(len(lines), i + after + 1)

            print()
            print(f'CONTEXTO: "{marker}"')
            print()

            for n in range(start, end):
                print(f"{n + 1}: {lines[n]}")

            return True

    print()
    print(f'⚠ Contexto não encontrado para: "{marker}"')
    return False


# ============================================================
# 1. COMO A COMUNIDADE ESTÁ LIGADA AO APP
# ============================================================

section("1. APP.TSX — NAVEGAÇÃO E SEPARADOR DA COMUNIDADE")

show_matches(
    "APP",
    app,
    [
        r"currentTab",
        r"setCurrentTab",
        r"PartilhaFeed",
        r"Community",
        r"Comunidade",
        r"community",
        r"partilha",
        r"selectedPost",
        r"chat",
    ],
)

for marker in [
    "<PartilhaFeed",
    "currentTab ===",
    "setCurrentTab",
]:
    context(app, marker, before=15, after=45)


# ============================================================
# 2. PROPS PASSADAS AO FEED
# ============================================================

section("2. APP → PARTILHAFEED — PROPS")

context(
    app,
    "<PartilhaFeed",
    before=25,
    after=80,
)


# ============================================================
# 3. ESTADO INTERNO DO FEED
# ============================================================

section("3. PARTILHAFEED — ESTADO DO POST E ABERTURA DO CHAT")

show_matches(
    "FEED",
    feed,
    [
        r"useState",
        r"selectedPost",
        r"setSelectedPost",
        r"CommunityChat",
        r"onClose",
        r"post=",
        r"chat",
        r"redLikedBy",
        r"author",
        r"uid",
        r"user",
    ],
)

for marker in [
    "CommunityChat",
    "setSelectedPost",
    "selectedPost",
    "redLikedBy",
]:
    context(feed, marker, before=20, after=60)


# ============================================================
# 4. COMO O CHAT RECEBE O POST
# ============================================================

section("4. COMMUNITYCHAT — PROPS E POST RECEBIDO")

show_matches(
    "CHAT",
    chat,
    [
        r"export const CommunityChat",
        r"post",
        r"onClose",
        r"post\.",
        r"author",
        r"uid",
        r"redLikedBy",
    ],
)

context(
    chat,
    "export const CommunityChat",
    before=5,
    after=100,
)


# ============================================================
# 5. AUTENTICAÇÃO
# ============================================================

section("5. COMMUNITYCHAT — FIREBASE AUTH")

show_matches(
    "CHAT",
    chat,
    [
        r"auth",
        r"currentUser",
        r"uid",
        r"onAuth",
        r"user",
    ],
)

context(
    chat,
    "auth.currentUser",
    before=15,
    after=45,
)


# ============================================================
# 6. GERAÇÃO DO CHAT ID
# ============================================================

section("6. COMMUNITYCHAT — GERAÇÃO / RESOLUÇÃO DO CHAT ID")

show_matches(
    "CHAT",
    chat,
    [
        r"chatId",
        r"participants",
        r"sort",
        r"join",
        r"post\.id",
        r"postId",
        r"authorId",
        r"redLikedBy",
    ],
)

for marker in [
    "setChatId",
    "participants",
    "chatId",
]:
    context(chat, marker, before=30, after=90)


# ============================================================
# 7. LISTENER DE MENSAGENS
# ============================================================

section("7. COMMUNITYCHAT — onSnapshot / TEMPO REAL")

show_matches(
    "CHAT",
    chat,
    [
        r"onSnapshot",
        r"collection\(",
        r"orderBy",
        r"query\(",
        r"messages",
        r"createdAt",
    ],
)

context(
    chat,
    "onSnapshot",
    before=25,
    after=70,
)


# ============================================================
# 8. CLEANUP DO LISTENER
# ============================================================

section("8. COMMUNITYCHAT — CLEANUP AO DESMONTAR")

show_matches(
    "CHAT",
    chat,
    [
        r"return\s*\(",
        r"return unsubscribe",
        r"unsubscribe",
        r"useEffect",
    ],
)


# ============================================================
# 9. ENVIO DE MENSAGENS
# ============================================================

section("9. COMMUNITYCHAT — ENVIO")

show_matches(
    "CHAT",
    chat,
    [
        r"addDoc",
        r"serverTimestamp",
        r"lastMessage",
        r"lastMessageAt",
        r"updateDoc",
        r"setDoc",
        r"message",
        r"send",
    ],
)

for marker in [
    "addDoc",
    "lastMessage",
]:
    context(chat, marker, before=25, after=70)


# ============================================================
# 10. DEPENDÊNCIAS DOS EFFECTS
# ============================================================

section("10. COMMUNITYCHAT — DEPENDÊNCIAS DOS useEffect")

lines = chat.splitlines()

for i, line in enumerate(lines, start=1):
    if "useEffect" in line:
        start = max(0, i - 1)
        end = min(len(lines), i + 80)

        print()
        print(f"useEffect perto da linha {i}")
        print()

        for n in range(start, end):
            print(f"{n + 1}: {lines[n]}")

        print()


# ============================================================
# 11. RISCO DE REMOUNT PELO SEPARADOR
# ============================================================

section("11. APP — RISCO DE MONTAGEM / DESMONTAGEM PELO currentTab")

tab_patterns = [
    r"currentTab\s*===\s*\d+",
    r"currentTab\s*!==\s*\d+",
    r"\?\s*<PartilhaFeed",
    r"&&\s*<PartilhaFeed",
]

show_matches(
    "APP",
    app,
    tab_patterns,
)


# ============================================================
# 12. KEYS / RECRIAÇÃO FORÇADA
# ============================================================

section("12. KEY / RECRIAÇÃO FORÇADA DO FEED OU CHAT")

show_matches(
    "APP",
    app,
    [
        r"<PartilhaFeed[^>]*key=",
        r"key=.*currentTab",
        r"key=.*community",
    ],
)

show_matches(
    "FEED",
    feed,
    [
        r"<CommunityChat[^>]*key=",
        r"key=.*selectedPost",
        r"key=.*post",
    ],
)


# ============================================================
# 13. FIREBASE BASE
# ============================================================

section("13. FIREBASE.TS — AUTH / FIRESTORE EXPORTADOS")

show_matches(
    "FIREBASE",
    firebase,
    [
        r"getAuth",
        r"getFirestore",
        r"export.*auth",
        r"export.*db",
        r"initializeApp",
    ],
)


# ============================================================
# 14. SINAIS DE POSSÍVEL PROBLEMA
# ============================================================

section("14. SINAIS DE RISCO")

risks = []

if "<PartilhaFeed" not in app:
    risks.append("PartilhaFeed não encontrado no App.tsx.")

if "CommunityChat" not in feed:
    risks.append("PartilhaFeed não parece montar CommunityChat.")

if "onSnapshot" not in chat:
    risks.append("CommunityChat não tem onSnapshot.")

if "addDoc" not in chat:
    risks.append("CommunityChat não tem addDoc.")

if "serverTimestamp" not in chat:
    risks.append("Mensagens podem não usar serverTimestamp.")

if "auth.currentUser" not in chat and "auth" not in chat:
    risks.append("Autenticação não identificada no CommunityChat.")

if "chatId" not in chat:
    risks.append("chatId não identificado.")

if "participants" not in chat:
    risks.append("Participantes não identificados.")

if risks:
    for risk in risks:
        print(f"⚠ {risk}")
else:
    print("✓ Nenhum risco estrutural óbvio encontrado pelos checks básicos.")


# ============================================================
# 15. CONTAGENS — PARA COMPARAÇÃO FUTURA
# ============================================================

section("15. CONTAGENS ESTRUTURAIS")

tokens = [
    "useState(",
    "useEffect(",
    "onSnapshot(",
    "addDoc(",
    "setDoc(",
    "updateDoc(",
    "collection(",
    "query(",
    "orderBy(",
    "auth.currentUser",
    "chatId",
    "participants",
]

for name, text in [
    ("APP", app),
    ("FEED", feed),
    ("CHAT", chat),
]:
    print()
    print(f"[{name}]")

    for token in tokens:
        print(f"{token:<24} {text.count(token)}")


# ============================================================
# 16. CONCLUSÃO
# ============================================================

section("16. O QUE ESTA AUDITORIA VAI PERMITIR DECIDIR")

print("""
Depois do output conseguimos responder com segurança:

1. Se o novo separador apenas monta/desmonta o Feed normalmente.

2. Se a mudança alterou props ou estado necessário ao chat.

3. Se o CommunityChat continua a receber exatamente o post certo.

4. Se o chatId continua determinado pelos UIDs corretos.

5. Se o listener onSnapshot é recriado corretamente após entrar
   novamente no separador.

6. Se existe algum risco de selectedPost desaparecer ao mudar
   de separador.

7. Se existe alguma dependência em currentTab que interfira
   diretamente no Firebase.

IMPORTANTE:
esta auditoria não alterou qualquer ficheiro.
""")

print("=" * 78)
print("FIM DA AUDITORIA")
print("=" * 78)
