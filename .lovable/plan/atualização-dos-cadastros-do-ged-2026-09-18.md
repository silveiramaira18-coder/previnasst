# Atualização dos cadastros do GED

## Objetivo
Aprimorar os modais de colaborador e documentos com seleção pesquisável, validações e funções personalizadas persistentes, mantendo o visual e o isolamento atuais do Previna SST.

## Implementação
- Substituir “Função” por um seletor pesquisável com as funções padrão informadas e opção “Outra”.
- Exibir “Especifique a função” quando necessário e permitir salvar uma nova função para reutilização no mesmo contexto: empresa própria ou terceirizada selecionada.
- Criar a tabela auxiliar de funções personalizadas com acesso restrito ao proprietário dos dados e aos administradores autorizados.
- Aplicar máscara de CPF em tempo real, limitar a 11 dígitos e validar formato e dígitos verificadores antes do cadastro.
- Expandir os tipos de documentos do colaborador com documentos gerais e treinamentos das NRs vigentes, usando seletor pesquisável por número ou nome.
- Ao escolher “Outros”, exibir um campo de especificação e usar esse texto como título final do documento.
- Manter o envio na coluna atual `role_title` e preservar os fluxos existentes de upload, validade e versionamento.

## Detalhes técnicos
- O escopo de funções personalizadas seguirá o modelo atual: usuário proprietário + empresa terceirizada opcional; valor nulo representa a empresa própria.
- A nova tabela terá `GRANT`, RLS, políticas de proprietário/administrador, unicidade por escopo e limite de tamanho.
- A lista de NRs usará as denominações oficiais vigentes; NRs revogadas não serão apresentadas como ativas.
- As entradas serão limitadas e normalizadas no cliente, com restrições complementares no banco para funções personalizadas.

## Verificação
- Conferir seleção, busca, modo “Outra”, persistência de função personalizada e reabertura do modal.
- Conferir máscara e rejeição de CPF inválido.
- Conferir busca por “35” e “ASO”, especificação de “Outros” e salvamento do documento.
- Executar verificação de tipos e teste visual dos dois modais em tela móvel.
