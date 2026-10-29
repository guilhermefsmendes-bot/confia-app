# Confia — auditoria e desenho do Motor de Impacto dos Hábitos

Data da auditoria inicial: 2026-10-29
Branch de trabalho: `feature/habit-impact-engine`

## Inventário dos registos existentes

### Sono
- `hours` (0–24), `quality` (1–5) e `awakenings` (opcional, 0–100).
- Registo por data, com histórico e evolução já disponíveis.

### Alimentação e bebidas
- Categorias: café, chá, bebidas energéticas, refrigerantes, água, álcool, tabaco, fast food, fruta, vegetais, cereais, proteínas, gorduras, doces e alimentos salgados.
- Campos detalhados: subtipo, quantidade, unidade, volume de dose opcional, período do dia, hora, tamanho, intensidade, cafeína (sim/não/desconhecida), açúcar (sim/não/desconhecido) e marcação de eliminação lógica.
- Unidades aceites: item, porção, chávena, lata, garrafa, ml, g, ocasião e refeição.
- Limitação: a maioria dos registos não contém rótulo nutricional, gramas de açúcar/sal/gordura, teor alcoólico ou classificação NOVA de processamento. Não se pode inferir esses valores a partir de categorias genéricas.

### Exercício
- Atividades: caminhada, corrida, ginásio, bicicleta, natação, dança, desporto, HIIT, alongamentos, yoga e outra.
- Campos: minutos (0–1440), intensidade opcional (ligeira/moderada/intensa) e período do dia opcional.
- Limitação: minutos sem intensidade não podem ser automaticamente classificados como moderados ou vigorosos.

### Hábitos definidos pelo utilizador
- Tipos: tabaco, café, álcool, social, jogos, açúcar, compras, verificação/compulsão, sono e personalizado.
- Campos: nome, ícone, objetivo em texto, estado ativo e data de criação; o registo diário é essencialmente binário (objetivo cumprido ou não).
- Limitação: o registo binário não quantifica dose, duração ou intensidade; objetivos personalizados não devem ser interpretados clinicamente sem uma medida estruturada.
- Reinícios guardam motivo e preservam o histórico.

### Planos de bem-estar
- Planos: cafeína, hidratação, vegetais, energia, movimento, caminhada, regularidade, horários e rotina.
- Registos de plano, verificações diárias e preferência para adiar convites.

## Armazenamento e histórico

- Os registos de hábitos são guardados localmente por proprietário e sincronizados para `users/{uid}/habitRecords` no Firestore.
- O histórico analítico pessoal usa `confia_personal_events_v1` e mantém até 5.000 eventos locais.
- A integração anterior de eventos analíticos inclui agregados de nutrição, exercício, desafios e planos; não converte diretamente os registos detalhados de sono e alimentos em eventos analíticos. O Motor de Impacto consulta os registos de hábitos diretamente e usa os eventos emocionais disponíveis para a comparação individual.
- O histórico antigo no Firestore pode ser paginado/carregado a pedido. Uma análise pessoal só é válida para os registos efetivamente carregados; ausência de registo nunca é tratada como zero.

## Base científica inicial

As fontes completas, estatísticas, populações e limitações estão em `src/data/habits/impactKnowledge.ts`:

- Sono: meta-análise de 44 estudos sobre restrição de sono e atenção (PubMed PMID 38759474) e consenso AASM/Sleep Research Society sobre duração do sono adulto.
- Cafeína: orientação da EFSA; estimativas de dose são explicitamente apresentadas como estimativas baseadas em porções típicas.
- Atividade física: recomendação da OMS de 150–300 minutos moderados ou 75–150 vigorosos por semana.
- Fruta e vegetais: recomendação da OMS de pelo menos 400 g/dia para pessoas com mais de 10 anos, apenas quando o utilizador registou peso ou porções explícitas.
- Água: orientação prática da DGS portuguesa, sem a apresentar como teste individual de hidratação.
- Ultraprocessados: revisão abrangente do BMJ; a associação com ansiedade tem evidência de baixa qualidade e não é atribuída a uma refeição isolada.
- Açúcares livres e sal/sódio: orientações da OMS; os formulários atuais não recolhem gramas de açúcar livre ou sódio, pelo que a aplicação não calcula percentagens ou ingestões a partir de ocasiões.
- Álcool e tabaco: orientações da OMS; a dose de álcool não é calculada sem volume e teor alcoólico, e a contagem de tabaco não identifica produto/dose.
- Jogos: definição de gaming disorder da OMS/ICD-11; jogar, por si só, não é tratado como perturbação, e o registo binário não mede prejuízo funcional nem perda de controlo.

## Regras de segurança científica

1. Separar recomendação populacional, resultado experimental, associação observacional e padrão pessoal.
2. Não transformar odds ratios, diferenças padronizadas ou médias de estudos em percentagens de causalidade individual.
3. Mostrar a fonte, a população estudada e as limitações.
4. Só mostrar associações pessoais quando há pelo menos cinco dias medidos em cada grupo e avaliação emocional nesses mesmos dias.
5. Não inferir zero a partir de dados ausentes nem calcular valores nutricionais que os formulários não recolhem.
6. A análise pessoal descreve associação, não causalidade.

## Alterações desta primeira implementação

- Criada uma biblioteca local de evidência científica verificável.
- Criado o motor de cálculo de reações para sono, cafeína estimada, exercício semanal, fruta/vegetais, água e categorias em que os dados atuais não permitem quantificação médica.
- Criado o componente de reação com evidência expandível e ligações às fontes originais.
- Integrado o componente na página principal de hábitos e nos painéis de sono, alimentação e exercício.
- Adicionado o Relógio Biológico visual, com graduação de laranja a verde, baseado apenas em registos explícitos e com intensidade reduzida quando há poucos domínios observados.
- Adicionado resumo dos últimos 7 e 30 dias com comparação numérica face aos períodos anteriores, sem classificar automaticamente uma variação como boa ou má.
- O painel de reações mostra primeiro até três observações e permite expandir o restante; padrões pessoais suficientes ficam acessíveis mesmo quando o hábito não foi registado no dia selecionado.
- Corrigidas dependências transitivas vulneráveis com overrides restritos para `@grpc/grpc-js` e `re2js`, sem downgrade major do Firebase.
- Criados testes unitários para sono, ausência de registos, relógio visual e limiar mínimo para associações pessoais.

## Limitações antes de lançamento

- Executar lint, testes unitários, build Android e testes E2E quando o runtime Node.js estiver disponível.
- Rever clinicamente o texto e as regras antes de apresentar isto como aconselhamento de saúde.
- Uma próxima fase poderá enriquecer o registo alimentar com nutrientes e porções estruturadas, se isso for desejado; esta versão não inventa esses dados.
