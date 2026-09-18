import io
import logging
from PIL import Image, ImageDraw, ImageFont
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# Configuração de logs no terminal
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# ---------------------------------------------------------
# FUNÇÃO PARA GERAR A IMAGEM DA TABELA FINANCEIRA
# ---------------------------------------------------------
def gerar_tabela_imagem():
    # Dados de exemplo dos últimos 7 dias
    transacoes = [
        {"data": "10/Set", "desc": "EDP Comercial", "tipo": "Débito Direto", "valor": "-45.20 €"},
        {"data": "12/Set", "desc": "Vodafone Fatura", "tipo": "Débito Direto", "valor": "-32.90 €"},
        {"data": "13/Set", "desc": "Supermercado", "tipo": "Cartão", "valor": "-68.40 €"},
        {"data": "14/Set", "desc": "Reembolso / Transferência", "tipo": "Entrada", "valor": "+120.00 €"},
    ]

    # Dimensões da imagem (largura x altura)
    img = Image.new('RGB', (600, 450), color='#1E1E2E')
    draw = ImageDraw.Draw(img)

    # Título e Cabeçalho
    draw.rectangle([0, 0, 600, 70], fill='#313244')
    draw.text((30, 20), "EXTRATO FINANCEIRO (ÚLTIMOS 7 DIAS)", fill='#CDD6F4')

    # Desentar Tabela
    y = 100
    draw.text((30, y), "DATA", fill='#A6ADC8')
    draw.text((120, y), "DESCRIÇÃO", fill='#A6ADC8')
    draw.text((350, y), "TIPO", fill='#A6ADC8')
    draw.text((480, y), "VALOR", fill='#A6ADC8')

    draw.line([(30, y + 25), (570, y + 25)], fill='#45475A', width=2)
    y += 40

    # Linhas com cada gasto/proveito
    for item in transacoes:
        cor_valor = '#F38BA8' if '-' in item['valor'] else '#A6E3A1' # Vermelho para gastos, verde para entradas

        draw.text((30, y), item['data'], fill='#CDD6F4')
        draw.text((120, y), item['desc'], fill='#CDD6F4')
        draw.text((350, y), item['tipo'], fill='#BAC2DE')
        draw.text((480, y), item['valor'], fill=cor_valor)

        y += 45
        draw.line([(30, y - 10), (570, y - 10)], fill='#313244', width=1)

    # Converter imagem para formato enviável na rede (Bytes)
    bio = io.BytesIO()
    bio.name = 'extrato.png'
    img.save(bio, 'PNG')
    bio.seek(0)
    return bio

# ---------------------------------------------------------
# COMANDOS DO BOT DO TELEGRAM
# ---------------------------------------------------------
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name
    await update.message.reply_text(f"Olá, {user_name}! 👋\nA gerar o resumo visual dos teus últimos 7 dias...")

    # Gerar a imagem e enviar diretamente ao utilizador
    imagem_bytes = gerar_tabela_imagem()
    await update.message.reply_photo(
        photo=imagem_bytes,
        caption="📊 **Resumo de Débitos Diretos e Gastos**\nProcessado com sucesso!"
    )

if __name__ == '__main__':
    # ATENÇÃO: Substitui o texto abaixo pela chave do @BotFather!
    TOKEN = 'SUBSTITUI_ESTE_TEXTO_PELO_TEU_TOKEN_REAL'

    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))

    print("Bot em execução no Cloud Shell...")
    app.run_polling()
