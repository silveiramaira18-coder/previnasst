# CRUD, preview e alertas da Gestão Documental

## Resultado
- Cada documento terá ações na ordem: visualizar, editar, baixar e excluir.
- O preview abrirá em modal amplo, com PDF incorporado, título, validade, status, download e fechamento.
- Empresas terceirizadas, colaboradores e documentos poderão ser editados em formulários preenchidos com os dados atuais.
- Toda exclusão usará confirmação explícita; documentos serão removidos do cadastro e do armazenamento privado.
- Uma central de alertas permitirá filtrar documentos vencidos, vencendo em 7, 15 ou 30 dias e visualizar notificações por prioridade.

## Permissões
- Somente os dois administradores principais poderão criar, editar ou excluir empresas, colaboradores, funções e documentos.
- Usuários não administradores verão apenas os registros já autorizados para sua conta, sem controles de alteração.
- As regras serão aplicadas na interface, nas tabelas e no armazenamento de arquivos; esconder botões não será a única proteção.

## Implementação
1. Separar as políticas atuais de acesso próprio em leitura e escrita, preservando leitura do proprietário e acesso total exclusivo dos administradores.
2. Criar componentes reutilizáveis para confirmação, preview de PDF e edição de documentos.
3. Reaproveitar o formulário de colaborador para cadastro e edição, mantendo máscara e validação de CPF e funções pesquisáveis.
4. Reaproveitar o formulário de terceirizada para cadastro e edição de razão social e CNPJ.
5. Atualizar as listas para ações responsivas, estados de carregamento e invalidação correta dos dados após mudanças.
6. Adicionar filtros de prazo e contagens específicas de vencidos, 7, 15 e 30 dias.
7. Validar permissões, fluxos principais, visualização em celular e ausência de erros na aplicação.
