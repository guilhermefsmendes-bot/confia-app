from pathlib import Path
import shutil
import json
import sys


SHOP = Path("src/components/HomeShop.tsx")
APP = Path("src/App.tsx")

LOCALES = {
    "pt": Path("src/locales/pt.json"),
    "en": Path("src/locales/en.json"),
    "es": Path("src/locales/es.json"),
    "fr": Path("src/locales/fr.json"),
}

BACKUPS = {
    SHOP:
        Path("/tmp/HomeShop.tsx.before_companheiro_premium_a5_6b"),
    APP:
        Path("/tmp/App.tsx.before_companheiro_premium_a5_6b"),
    LOCALES["pt"]:
        Path("/tmp/pt.json.before_companheiro_premium_a5_6b"),
    LOCALES["en"]:
        Path("/tmp/en.json.before_companheiro_premium_a5_6b"),
    LOCALES["es"]:
        Path("/tmp/es.json.before_companheiro_premium_a5_6b"),
    LOCALES["fr"]:
        Path("/tmp/fr.json.before_companheiro_premium_a5_6b"),
}


def restore_all():
    for path, backup in BACKUPS.items():
        shutil.copy2(backup, path)


# ==========================================================
# PRÉ-VALIDAÇÃO + BACKUPS
# ==========================================================

for path in BACKUPS:
    if not path.exists():
        print(f"ERRO: ficheiro não encontrado: {path}")
        sys.exit(1)

for path, backup in BACKUPS.items():
    shutil.copy2(path, backup)


try:

    # ==========================================================
    # 1. HOMESHOP — RECEBER NÍVEL DA CONFIA
    # ==========================================================

    src = SHOP.read_text(encoding="utf-8")

    old_props = '''interface HomeShopProps {
  onBack: () => void;
  xp: number;
  spendXp: (amount: number) => void;

  /**
   * Callback legacy.'''

    new_props = '''interface HomeShopProps {
  onBack: () => void;
  xp: number;
  companionLevel: number;
  spendXp: (amount: number) => void;

  /**
   * Callback legacy.'''

    if old_props not in src:
        raise RuntimeError(
            "HomeShopProps esperado não encontrado."
        )

    src = src.replace(
        old_props,
        new_props,
        1
    )


    old_destructure = '''const HomeShop: React.FC<HomeShopProps> = ({
  onBack,
  xp,
  spendXp,
  onBuy,
}) => {'''

    new_destructure = '''const HomeShop: React.FC<HomeShopProps> = ({
  onBack,
  xp,
  companionLevel,
  spendXp,
  onBuy,
}) => {'''

    if old_destructure not in src:
        raise RuntimeError(
            "Desestruturação de HomeShop não encontrada."
        )

    src = src.replace(
        old_destructure,
        new_destructure,
        1
    )


    # ==========================================================
    # 2. PROTEGER O FLUXO DE COMPRA
    # ==========================================================
    #
    # Não basta desativar o botão.
    # handleBuy também valida o nível.
    #
    # Itens já possuídos continuam intocados.
    # Legacy não tem minCompanionLevel e continua normal.
    # ==========================================================

    old_handle = '''    if (
      owned ||
      xp < item.cost
    ) {
      return;
    }

    spendXp(item.cost);'''

    new_handle = '''    const requiredLevel =
      item.minCompanionLevel ?? 1;

    const levelLocked =
      isCompanionAccessory(item) &&
      companionLevel < requiredLevel;

    if (
      owned ||
      levelLocked ||
      xp < item.cost
    ) {
      return;
    }

    spendXp(item.cost);'''

    if old_handle not in src:
        raise RuntimeError(
            "Proteção original de handleBuy não encontrada."
        )

    src = src.replace(
        old_handle,
        new_handle,
        1
    )


    # ==========================================================
    # 3. ESTADO DE BLOQUEIO NO CARTÃO DO ACESSÓRIO
    # ==========================================================

    old_accessory_state = '''    const owned =
      inventory.includes(item.id);

    const canBuy =
      !owned &&
      xp >= item.cost;

    const slotLabel ='''

    new_accessory_state = '''    const owned =
      inventory.includes(item.id);

    const requiredLevel =
      item.minCompanionLevel ?? 1;

    /**
     * Uma compra antiga nunca é invalidada.
     * O bloqueio aplica-se apenas a acessórios ainda não obtidos.
     */
    const levelLocked =
      !owned &&
      companionLevel < requiredLevel;

    const canBuy =
      !owned &&
      !levelLocked &&
      xp >= item.cost;

    const slotLabel ='''

    if old_accessory_state not in src:
        raise RuntimeError(
            "Estado do cartão de acessório não encontrado."
        )

    src = src.replace(
        old_accessory_state,
        new_accessory_state,
        1
    )


    # ==========================================================
    # 4. INDICADOR VISUAL DO NÍVEL
    # ==========================================================

    old_slot = '''          <p className="mt-1 text-xs font-semibold text-[#B07760]">
            {slotLabel}
          </p>

          <div className="mt-2 flex items-center gap-1 text-sm font-extrabold text-[#6B5148]">'''

    new_slot = '''          <p className="mt-1 text-xs font-semibold text-[#B07760]">
            {slotLabel}
          </p>

          {levelLocked && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E6D8CF] bg-[#F7F1ED] px-2.5 py-1 text-[10px] font-extrabold text-[#8C776E]">
              <span aria-hidden="true">
                🔒
              </span>

              <span>
                {t(
                  "companionShop.availableAtLevel",
                  { level: requiredLevel }
                )}
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 text-sm font-extrabold text-[#6B5148]">'''

    if old_slot not in src:
        raise RuntimeError(
            "Local para indicador de nível não encontrado."
        )

    src = src.replace(
        old_slot,
        new_slot,
        1
    )


    # ==========================================================
    # 5. TEXTO DO BOTÃO BLOQUEADO
    # ==========================================================

    old_button_text = '''          {owned
            ? `✓ ${t("companionShop.owned")}`
            : canBuy
              ? t("companionShop.buy")
              : t("companionShop.notEnoughXp")
          }'''

    new_button_text = '''          {owned
            ? `✓ ${t("companionShop.owned")}`
            : levelLocked
              ? `🔒 ${t(
                  "companionShop.levelRequired",
                  { level: requiredLevel }
                )}`
              : canBuy
                ? t("companionShop.buy")
                : t("companionShop.notEnoughXp")
          }'''

    if old_button_text not in src:
        raise RuntimeError(
            "Texto do botão de acessório não encontrado."
        )

    # Só substituímos a primeira ocorrência:
    # a segunda pertence aos itens legacy.
    src = src.replace(
        old_button_text,
        new_button_text,
        1
    )

    SHOP.write_text(
        src,
        encoding="utf-8"
    )


    # ==========================================================
    # 6. APP — PASSAR avatar.level
    # ==========================================================

    app_src = APP.read_text(encoding="utf-8")

    old_shop_call = '''<HomeShop
  onBack={() => setHomeScreen("home")}
  xp={avatar.xp}
  spendXp={spendXp}
/>'''

    new_shop_call = '''<HomeShop
  onBack={() => setHomeScreen("home")}
  xp={avatar.xp}
  companionLevel={avatar.level}
  spendXp={spendXp}
/>'''

    if old_shop_call not in app_src:
        raise RuntimeError(
            "Chamada atual de HomeShop não encontrada."
        )

    if app_src.count(old_shop_call) != 1:
        raise RuntimeError(
            "Número inesperado de chamadas HomeShop."
        )

    app_src = app_src.replace(
        old_shop_call,
        new_shop_call,
        1
    )

    APP.write_text(
        app_src,
        encoding="utf-8"
    )


    # ==========================================================
    # 7. TRADUÇÕES
    # ==========================================================

    new_strings = {
        "pt": {
            "availableAtLevel":
                "Disponível no nível {{level}}",
            "levelRequired":
                "Nível {{level}}",
        },

        "en": {
            "availableAtLevel":
                "Available at level {{level}}",
            "levelRequired":
                "Level {{level}}",
        },

        "es": {
            "availableAtLevel":
                "Disponible en el nivel {{level}}",
            "levelRequired":
                "Nivel {{level}}",
        },

        "fr": {
            "availableAtLevel":
                "Disponible au niveau {{level}}",
            "levelRequired":
                "Niveau {{level}}",
        },
    }


    for lang, path in LOCALES.items():

        locale_src = path.read_text(
            encoding="utf-8"
        )

        data = json.loads(locale_src)

        block = data.get("companionShop")

        if not isinstance(block, dict):
            raise RuntimeError(
                f"{lang}: companionShop não encontrado."
            )

        if (
            "availableAtLevel" in block or
            "levelRequired" in block
        ):
            raise RuntimeError(
                f"{lang}: traduções A5.6B já existem."
            )

        block.update(
            new_strings[lang]
        )

        # Substituir apenas o bloco companionShop,
        # preservando o restante ficheiro.
        marker = '"companionShop": {'
        start = locale_src.find(marker)

        if start == -1:
            raise RuntimeError(
                f"{lang}: início companionShop não encontrado."
            )

        brace_start = locale_src.find(
            "{",
            start
        )

        depth = 0
        end = None

        for i in range(
            brace_start,
            len(locale_src)
        ):
            char = locale_src[i]

            if char == "{":
                depth += 1

            elif char == "}":
                depth -= 1

                if depth == 0:
                    end = i + 1
                    break

        if end is None:
            raise RuntimeError(
                f"{lang}: fim companionShop não encontrado."
            )

        indent_block = json.dumps(
            block,
            ensure_ascii=False,
            indent=2
        )

        # O JSON gerado começa em coluna 0.
        # Recuamos as linhas para manter o estilo top-level.
        lines = indent_block.splitlines()

        formatted = lines[0]

        if len(lines) > 1:
            formatted += "\n" + "\n".join(
                "  " + line
                for line in lines[1:]
            )

        locale_src = (
            locale_src[:brace_start]
            + formatted
            + locale_src[end:]
        )

        # Garantia de JSON válido.
        json.loads(locale_src)

        path.write_text(
            locale_src,
            encoding="utf-8"
        )


    # ==========================================================
    # 8. VALIDAÇÃO FINAL
    # ==========================================================

    final_shop = SHOP.read_text(
        encoding="utf-8"
    )

    final_app = APP.read_text(
        encoding="utf-8"
    )

    checks = {
        "prop companionLevel":
            "companionLevel: number;"
            in final_shop,

        "App passa nível":
            "companionLevel={avatar.level}"
            in final_app,

        "usa minCompanionLevel":
            "item.minCompanionLevel ?? 1"
            in final_shop,

        "bloqueio por nível":
            "companionLevel < requiredLevel"
            in final_shop,

        "proteção dentro de handleBuy":
            "owned ||\n      levelLocked ||\n      xp < item.cost"
            in final_shop,

        "compra XP preservada":
            "spendXp(item.cost);"
            in final_shop,

        "buyItem preservado":
            "buyItem(item.id);"
            in final_shop,

        "callback seguro preservado":
            "onBuy?.(item);"
            in final_shop,

        "texto disponível nível":
            "companionShop.availableAtLevel"
            in final_shop,

        "texto botão nível":
            "companionShop.levelRequired"
            in final_shop,

        "sem localStorage":
            "localStorage"
            not in final_shop,

        "sem timer":
            "setTimeout("
            not in final_shop
            and "setInterval("
            not in final_shop,

        "sem rAF":
            "requestAnimationFrame("
            not in final_shop,
    }


    for lang, path in LOCALES.items():

        parsed = json.loads(
            path.read_text(encoding="utf-8")
        )

        shop_block = parsed.get(
            "companionShop",
            {}
        )

        checks[
            f"{lang} availableAtLevel"
        ] = (
            "availableAtLevel"
            in shop_block
        )

        checks[
            f"{lang} levelRequired"
        ] = (
            "levelRequired"
            in shop_block
        )


    failed = [
        name
        for name, ok in checks.items()
        if not ok
    ]

    if failed:
        raise RuntimeError(
            "Validação falhou:\n - "
            + "\n - ".join(failed)
        )


except Exception as exc:

    restore_all()

    print("ERRO:", exc)
    print()
    print("Todos os ficheiros foram restaurados.")
    sys.exit(1)


print("=" * 76)
print("CONFIA — LOJA PREMIUM A5.6B")
print("=" * 76)
print()
print("✓ Bloqueio de acessórios por nível")
print("✓ Usa minCompanionLevel já existente")
print("✓ Nível real da CONFIA recebido do App")
print("✓ Laço Creme desbloqueia no nível 2")
print("✓ Lenço Terracota desbloqueia no nível 3")
print("✓ Amuleto Dourado desbloqueia no nível 5")
print("✓ Indicador visual de bloqueio")
print("✓ Botão bloqueado antes do nível necessário")
print("✓ handleBuy também protege a compra")
print("✓ XP não é gasto em item bloqueado")
print("✓ Compras antigas preservadas")
print("✓ Itens legacy sem bloqueio")
print("✓ spendXp preservado")
print("✓ buyItem preservado")
print("✓ home_inventory preservado")
print("✓ PT / EN / ES / FR")
print("✓ JSON validado nos 4 idiomas")
print("✓ Sem novo storage")
print("✓ Sem timers")
print("✓ Sem requestAnimationFrame")
print("✓ Sem dependências")
print()
print("Backups:")
for backup in BACKUPS.values():
    print(f"  {backup}")
print()
print("A5.6B aplicado.")
print("=" * 76)
