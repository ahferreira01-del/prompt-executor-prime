# Knowledge Risk (KR)

Plataforma corporativa para identificação, diagnóstico determinístico e mitigação do risco de concentração de conhecimento crítico, cálculo de Bus Factor e impacto financeiro (*Revenue at Risk*), potencializada por IA para triagem de chamados e planos de mitigação estruturados.

---

## 🎯 Objetivo e Princípios

O **Knowledge Risk** resolve o problema de dependência excessiva de pessoas-chave em processos, clientes e tecnologias de empresas de tecnologia e serviços.

- **Determinismo Matemático Rigoroso:** Todos os índices de risco (KCI, Bus Factor, CDI, RAR, KRR) são 100% determinísticos, transparentes e imutáveis por execução. A inteligência artificial **nunca** calcula, altera ou infere esses índices.
- **Rastreabilidade e Versionamento:** Cada diagnóstico e cálculo armazena a versão exata da configuração de risco utilizada (`config_version`), garantindo auditabilidade histórica retroativa.
- **Isolamento Multi-Tenant:** Isolamento rigoroso por empresa (`company_id`) com Row Level Security (RLS) ativo em todas as tabelas.
- **Auditoria Contínua:** Registro automático de eventos e alterações com captura de usuário, IP e timestamp.

---

## 📐 Motor de Risco (Risk Engine)

| Métrica | Nome | Descrição | Limiares de Alerta |
| :--- | :--- | :--- | :--- |
| **KCI** | *Knowledge Concentration Index* | Concentração de conhecimento do colaborador | **> 80%** (Severo / Crítico) |
| **Bus Factor** | *Fator de Ônibus* | Qtd. mínima de colaboradores cuja saída inviabiliza o processo | **≤ 1** (Crítico / Alerta Vermelho) |
| **CDI** | *Client Dependency Index* | Dependência de colaboradores em clientes específicos | **> 70%** (Ação Imediata) |
| **RAR** | *Revenue at Risk* | Receita anual exposta a processos críticos | \(\sum (\text{Receita Anual} \times \text{Dependência})\) |
| **KRR** | *Knowledge Risk Rating* | Score ponderado de risco geral da organização (0 a 100) | Ponderação configurável versionada |

### Pontuação de Documentação
- **Nenhuma (NONE):** 100 pts (Risco Máximo)
- **Parcial (PARTIAL):** 50 pts (Risco Médio)
- **Completa (COMPLETE):** 10 pts (Risco Controlado)

---

## 🚀 Funcionalidades

1. **Dashboard Executivo:** Visão consolidada em tempo real com KRR geral, Receita em Risco (R$), alertas de Bus Factor crítico e gráficos de distribuição.
2. **Cadastros com Busca e Ordenação:**
   - **Colaboradores:** Histórico de processos, tecnologias, tempo de casa e exclusão lógica (*soft delete*).
   - **Processos:** Mapeamento de criticidade, documentação e cálculo de Bus Factor.
   - **Tecnologias:** Catálogo com prevenção de duplicidades e vínculos operacionais.
   - **Clientes:** Receita anual, contratos e cálculo de CDI.
3. **Diagnóstico Estruturado:** Questionário com validações obrigatórias e geração de plano de mitigação via IA.
4. **Chamados & Heatmap de Expertise:** Ingestão de tickets com classificação automática de tecnologia e categoria por IA.
5. **Integrações (SLA & Chamados):**
   - Suporte nativo ao **Movidesk** (Webhook em tempo real + Sincronização periódica via API).
   - Importação em lote via planilhas (CSV) para colaboradores, processos, tecnologias, clientes e chamados.
6. **Aparência e Usabilidade:** Suporte a tema **Claro e Escuro** com persistência automática de preferência.

---

## 🛠️ Stack Tecnológica

- **Framework:** TanStack Start v1 (React 19, SSR, Server Functions)
- **Roteamento:** TanStack Router (File-based Routing)
- **Estilização:** Tailwind CSS v4 com tokens semânticos OKLCH
- **Componentes:** Radix UI / shadcn/ui
- **Tipografia:** Sora (Títulos) e Manrope (Corpo e Interfaces)
- **Banco de Dados & Auth:** Lovable Cloud / PostgreSQL com Row Level Security (RLS)
- **Motor de IA:** Lovable AI Gateway (Triagem de chamados e planos de mitigação)

---

## 💻 Instalação e Execução Local

### Pré-requisitos
- Node.js 20+ ou Bun
- Git

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/ahferreira01-del/knowledge-risk.git

# 2. Acesse a pasta do projeto
cd knowledge-risk

# 3. Instale as dependências
bun install # ou npm install

# 4. Inicie o servidor de desenvolvimento
bun dev # ou npm run dev

🔒 Segurança e Papéis (RBAC)
O acesso é controlado por papéis específicos por empresa:

Admin: Acesso total, configurações de risco, tokens de API e gestão de usuários.
Manager: Gestão de cadastros, processos, colaboradores e chamados.
Analyst: Execução de diagnósticos e visualização de relatórios.
Viewer: Visualização somente leitura de dashboards e indicadores.
