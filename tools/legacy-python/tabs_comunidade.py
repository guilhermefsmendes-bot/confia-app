from pathlib import Path
import json
import shutil
import sys

app_path = Path("src/App.tsx")

locale_values = {
    "pt": "Comunidade",
    "en": "Community",
    "es": "Comunidad",
    "fr": "Communauté",
}

if not app_path.exists():
    print("ERRO: src/App.tsx não encontrado.")
    sys.exit(1)

text = app_path.read_text(encoding="utf-8")
original = text

# ============================================================
# CONFIA — NAVEGAÇÃO PRINCIPAL
#
# Nova arquitetura:
#
# TAB 1 — Principal
# TAB 2 — Abraço
# TAB 3 — Objetivos
# TAB 4 — Impulso / SOS
# TAB 5 — Comunidade
#
# Progresso deixa a bottom navigation.
# ProgressoDashboard NÃO é apagado.
# Dados de progresso NÃO são apagados.
# ============================================================


# ------------------------------------------------------------
# 1. Import do ícone da Comunidade
#
# Mantemos ChartNoAxesCombined porque continua a ser usado
# em Padrões dentro do Principal.
# ------------------------------------------------------------

old_icons = '''  ChartNoAxesCombined,
  Backpack,
  Store,
  Settings'''

new_icons = '''  ChartNoAxesCombined,
  Users,
  Backpack,
  Store,
  Settings'''

if text.count(old_icons) != 1:
    print("ERRO: bloco esperado de ícones Lucide não encontrado.")
    sys.exit(1)

text = text.replace(old_icons, new_icons, 1)


# ------------------------------------------------------------
# 2. TAB 4 passa a conter APENAS ImpulsoSOS
# ------------------------------------------------------------

old_tab4 = '''{currentTab === 3 && (
  /* TAB 4: IMPULSO SOS + COMUNIDADE */
  <motion.div
    key="impulso-tab"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-6"
  >
    <ImpulsoSOS onAddXp={addXp} />

    <PartilhaFeed
      posts={posts}
      onAddPost={handleAddPost}
      onLikePost={handleLikePost}
      onOpenChat={handleOpenChat}
  onDeletePost={handleDeletePost}
 onReportPost={handleReportPost}
onBlockUser={handleBlockUser}
    />
  </motion.div>
)}'''

new_tab4 = '''{currentTab === 3 && (
  /* TAB 4: IMPULSO — intervenção imediata / SOS */
  <motion.div
    key="impulso-tab"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <ImpulsoSOS onAddXp={addXp} />
  </motion.div>
)}'''

if text.count(old_tab4) != 1:
    print("ERRO: bloco atual do TAB 4 não encontrado exatamente uma vez.")
    sys.exit(1)

text = text.replace(old_tab4, new_tab4, 1)


# ------------------------------------------------------------
# 3. TAB 5 passa de Progresso para Comunidade
#
# Reutilizamos exatamente o PartilhaFeed que estava no Impulso.
# ------------------------------------------------------------

old_tab5 = '''          {currentTab === 4 && (
            /* TAB 5: PROGRESSO */
            <motion.div
              key="progress-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
<ProgressoDashboard
  ratings={ratings}
  avatarLevel={avatar.level}
  avatarXp={avatar.xp}
  completedObjectivesCount={completedObjectivesCount}
  objectivesHistory={objectivesHistory}
/>
            </motion.div>
          )}'''

new_tab5 = '''          {currentTab === 4 && (
            /* TAB 5: COMUNIDADE */
            <motion.div
              key="community-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PartilhaFeed
                posts={posts}
                onAddPost={handleAddPost}
                onLikePost={handleLikePost}
                onOpenChat={handleOpenChat}
                onDeletePost={handleDeletePost}
                onReportPost={handleReportPost}
                onBlockUser={handleBlockUser}
              />
            </motion.div>
          )}'''

if text.count(old_tab5) != 1:
    print("ERRO: bloco atual do TAB 5 Progresso não encontrado.")
    sys.exit(1)

text = text.replace(old_tab5, new_tab5, 1)


# ------------------------------------------------------------
# 4. Corrigir StopMode
#
# Antes:
# setCurrentTab(4)
#
# Isso apontava para o antigo Progresso.
#
# Agora deve abrir TAB 4 = índice 3 = Impulso.
# ------------------------------------------------------------

old_stop = '''          onStartImpulse={() => {
            setShowStopMode(false);
            setCurrentTab(4);
          }}'''

new_stop = '''          onStartImpulse={() => {
            setShowStopMode(false);
            setCurrentTab(3);
          }}'''

if text.count(old_stop) != 1:
    print("ERRO: navegação StopMode → Impulso não encontrada.")
    sys.exit(1)

text = text.replace(old_stop, new_stop, 1)


# ------------------------------------------------------------
# 5. Bottom navigation
#
# Progresso → Comunidade
# ChartNoAxesCombined → Users
# ------------------------------------------------------------

old_footer_tab = '''           { label: t("progress"), icon: ChartNoAxesCombined, index: 4 }'''

new_footer_tab = '''           { label: t("community"), icon: Users, index: 4 }'''

if text.count(old_footer_tab) != 1:
    print("ERRO: tab Progresso no footer não encontrada.")
    sys.exit(1)

text = text.replace(old_footer_tab, new_footer_tab, 1)


# ------------------------------------------------------------
# 6. Traduções
#
# Adicionamos apenas a chave top-level "community".
# Não alteramos "progress", porque continua a poder ser usada
# noutras áreas da aplicação.
# ------------------------------------------------------------

locale_data = {}

for lang, value in locale_values.items():
    path = Path(f"src/locales/{lang}.json")

    if not path.exists():
        print(f"ERRO: locale não encontrado: {path}")
        sys.exit(1)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERRO ao ler {path}: {exc}")
        sys.exit(1)

    if "community" in data:
        if data["community"] != value:
            print(
                f'ERRO: chave top-level "community" já existe '
                f'com valor diferente em {path}: {data["community"]}'
            )
            sys.exit(1)
    else:
        data["community"] = value

    locale_data[path] = data


# ------------------------------------------------------------
# 7. Verificações estruturais
# ------------------------------------------------------------

required = [
    "Users,",
    "TAB 4: IMPULSO — intervenção imediata / SOS",
    "TAB 5: COMUNIDADE",
    'key="community-tab"',
    "<ImpulsoSOS onAddXp={addXp} />",
    "<PartilhaFeed",
    "posts={posts}",
    "onAddPost={handleAddPost}",
    "onLikePost={handleLikePost}",
    "onOpenChat={handleOpenChat}",
    "onDeletePost={handleDeletePost}",
    "onReportPost={handleReportPost}",
    "onBlockUser={handleBlockUser}",
    'label: t("community"), icon: Users, index: 4',
]

for fragment in required:
    if fragment not in text:
        print(f"ERRO: verificação final falhou: {fragment}")
        sys.exit(1)


# ------------------------------------------------------------
# 8. Garantir que PartilhaFeed aparece apenas no TAB Comunidade
# ------------------------------------------------------------

if text.count("<PartilhaFeed") != 1:
    print(
        "ERRO: PartilhaFeed deve ser renderizado exatamente "
        "uma vez no App.tsx."
    )
    sys.exit(1)

tab4_pos = text.find("TAB 4: IMPULSO — intervenção imediata / SOS")
tab5_pos = text.find("TAB 5: COMUNIDADE")
feed_pos = text.find("<PartilhaFeed")

if not (tab4_pos < tab5_pos < feed_pos):
    print("ERRO: PartilhaFeed não ficou corretamente no TAB 5.")
    sys.exit(1)


# ------------------------------------------------------------
# 9. Garantir que Impulso continua no índice 3
# ------------------------------------------------------------

if 'label: t("impulse"), icon: Zap, index: 3' not in text:
    print("ERRO: Impulso deixou de estar no índice 3.")
    sys.exit(1)

if "setCurrentTab(3);" not in text:
    print("ERRO: StopMode não aponta para o Impulso.")
    sys.exit(1)


# ------------------------------------------------------------
# 10. Garantir que Progresso saiu APENAS da navegação/render
#
# Não apagamos import nem componente nesta fase.
# ------------------------------------------------------------

if 'label: t("progress"), icon: ChartNoAxesCombined, index: 4' in text:
    print("ERRO: Progresso ainda está no footer.")
    sys.exit(1)

if "TAB 5: PROGRESSO" in text:
    print("ERRO: antigo TAB 5 Progresso ainda existe.")
    sys.exit(1)

if "<ProgressoDashboard" in text:
    print(
        "ERRO: ProgressoDashboard ainda está renderizado "
        "como separador."
    )
    sys.exit(1)

# O import deve continuar por agora.
if "import { ProgressoDashboard }" not in text:
    print(
        "ERRO: import de ProgressoDashboard desapareceu. "
        "Nesta fase queremos apenas desligá-lo."
    )
    sys.exit(1)


# ------------------------------------------------------------
# 11. Não permitir alterações silenciosas vazias
# ------------------------------------------------------------

if text == original:
    print("ERRO: nenhuma alteração efetuada.")
    sys.exit(1)


# ------------------------------------------------------------
# 12. Backups fora do projeto
# ------------------------------------------------------------

shutil.copy2(
    app_path,
    "/tmp/App.tsx.before_community_tab"
)

for path in locale_data:
    shutil.copy2(
        path,
        f"/tmp/{path.name}.before_community_tab"
    )


# ------------------------------------------------------------
# 13. Escrita
# ------------------------------------------------------------

app_path.write_text(text, encoding="utf-8")

for path, data in locale_data.items():
    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8",
    )


# ------------------------------------------------------------
# 14. Resultado
# ------------------------------------------------------------

print("=" * 72)
print("CONFIA — NOVA NAVEGAÇÃO PRINCIPAL")
print("=" * 72)
print("✓ TAB 1 mantém Principal")
print("✓ TAB 2 mantém Abraço")
print("✓ TAB 3 mantém Objetivos")
print("✓ TAB 4 contém apenas Impulso / SOS")
print("✓ Comunidade removida do Impulso")
print("✓ TAB 5 passou de Progresso para Comunidade")
print("✓ PartilhaFeed movido sem alterar handlers")
print("✓ Chat da Comunidade preservado")
print("✓ StopMode passa a abrir corretamente o Impulso")
print("✓ Progresso removido da bottom navigation")
print("✓ ProgressoDashboard não foi apagado")
print("✓ Dados de progresso não foram apagados")
print("✓ Ícone Users adicionado sem nova dependência")
print("✓ PT / EN / ES / FR tratados")
print()
print("NOVA NAVEGAÇÃO:")
print("Principal → Abraço → Objetivos → Impulso → Comunidade")
print()
print("OK — Comunidade elevada a separador principal.")
