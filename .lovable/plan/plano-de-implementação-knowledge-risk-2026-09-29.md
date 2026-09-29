# Plano de implementação — Knowledge Risk

## Objetivo
Construir o sistema completo da especificação, começando pelo MVP operacional e incluindo os recursos de IA previstos para as fases seguintes.

## Regras de negócio confirmadas
- Documentação: sem documentação = 100, parcial = 50, completa = 10.
- KRR: concentração 25%, criticidade 20%, cobertura 20%, documentação 15%, receita em risco 20%.
- Revenue At Risk: receita anual multiplicada pelo percentual de dependência.
- Bus Factor zero: risco crítico.
- Limites estritos: KCI > 80%, CDI > 80%, especialista crítico > 70%.

## Entrega
1. Criar a fundação: acesso seguro, perfis, empresa/tenant, políticas de isolamento, trilha de auditoria e estrutura de páginas.
2. Modelar o domínio principal: empresas, colaboradores, processos, tecnologias, clientes, capacidades e atividades; exclusão de colaborador será sempre lógica.
3. Construir o diagnóstico guiado com perguntas obrigatórias, documentação, criticidade, revisão e conclusão.
4. Implementar o motor determinístico de KCI, Bus Factor, risco documental, CDI, Revenue At Risk e KRR; cada cálculo persistirá a versão exata da configuração utilizada.
5. Construir o painel executivo com agregações, listas críticas e atualização automática após concluir um diagnóstico.
6. Implementar chamados, histórico de atividades, classificação e identificação de especialista crítico; depois, mitigação por IA baseada somente nos indicadores calculados.
7. Endurecer o produto com RBAC, isolamento multiempresa, auditoria, falhas de IA e testes matemáticos de fronteira, regressão e fluxo ponta a ponta.
8. Validar visualmente em telas grandes e pequenas, e percorrer o fluxo real de cadastro até o painel.

## Direção visual
Interface executiva em português, clara e densa na medida certa, com navegação lateral, sinais de risco em verde, amarelo, laranja e vermelho, tabelas comparáveis e gráficos legíveis. O painel priorizará responder rapidamente: quem, qual processo, qual conhecimento, qual cliente, quanto de receita e qual ação tomar.

## Detalhes técnicos
- Aplicação em TanStack Start, com páginas separadas e metadados próprios.
- Dados e autenticação no Lovable Cloud, com políticas de acesso por empresa.
- Chamadas de IA executadas apenas no servidor com `openai/gpt-6-astra` e respostas em streaming.
- Operações críticas auditadas; exclusão de colaboradores será lógica para preservar histórico.
