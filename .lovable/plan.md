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
1. Criar acesso seguro e isolamento por empresa, com perfis de usuário, trilha de auditoria e proteção dos dados.
2. Modelar empresas, colaboradores, processos, tecnologias, clientes, capacidades, atividades, diagnósticos, indicadores, chamados e recomendações.
3. Construir a navegação do produto e as telas de empresas, diagnóstico guiado, colaboradores, processos, clientes, tecnologias, chamados e painel executivo.
4. Implementar o motor determinístico de KCI, Bus Factor, risco documental, CDI, Revenue At Risk e KRR, com configurações versionadas.
5. Atualizar automaticamente indicadores e painel após concluir um diagnóstico.
6. Implementar classificação de chamados e recomendações com IA, preservando os cálculos determinísticos e validando respostas estruturadas.
7. Cobrir validações, limites matemáticos, isolamento entre empresas, permissões, falhas de IA e os fluxos principais com testes.
8. Validar visualmente em telas grandes e pequenas, e percorrer o fluxo real de cadastro até o painel.

## Direção visual
Interface executiva em português, clara e densa na medida certa, com navegação lateral, sinais de risco em verde, amarelo, laranja e vermelho, tabelas comparáveis e gráficos legíveis. O painel priorizará responder rapidamente: quem, qual processo, qual conhecimento, qual cliente, quanto de receita e qual ação tomar.

## Detalhes técnicos
- Aplicação em TanStack Start, com páginas separadas e metadados próprios.
- Dados e autenticação no Lovable Cloud, com políticas de acesso por empresa.
- Chamadas de IA executadas apenas no servidor com `openai/gpt-6-astra` e respostas em streaming.
- Operações críticas auditadas; exclusão de colaboradores será lógica para preservar histórico.
