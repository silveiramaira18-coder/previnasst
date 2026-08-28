# Previna SST Inspections

Quero criar um aplicativo web chamado Previna SST, voltado para Inspeções de Segurança do Trabalho em obras e empresas.

Nesta primeira etapa, quero construir a estrutura visual e funcional inicial do aplicativo.

O aplicativo deve ter uma interface profissional, moderna, limpa e responsiva, funcionando muito bem em computador, tablet e celular.

O objetivo principal é permitir que um profissional de Segurança do Trabalho registre uma inspeção de forma rápida, inclusive utilizando o celular no local da obra.

Crie:

1. DASHBOARD

Criar uma tela inicial com:

- Nome do aplicativo: Previna SST

- Menu lateral

- Total de inspeções realizadas

- Total de não conformidades

- Total de itens conformes

- Total de itens pendentes

- Percentual de conformidade

- Quantidade de ações corretivas abertas

- Quantidade de ações corretivas atrasadas

- Gráfico simples de conformidade

Utilize inicialmente dados demonstrativos apenas para visualizar a interface.

2. MENU LATERAL

Criar:

- Dashboard

- Obras

- Nova Inspeção

- Inspeções

- Checklists

- Não Conformidades

- Ações Corretivas

- Relatórios

- Configurações

3. TELA "OBRAS"

Criar uma interface para futuramente cadastrar:

- Nome da obra

- Empresa

- Endereço

- Responsável

- Status da obra

- Data de cadastro

Adicionar botão:

"+ Nova Obra"

4. TELA "NOVA INSPEÇÃO"

Esta será uma das principais funcionalidades do aplicativo.

Criar uma tela simples e intuitiva para o profissional registrar uma inspeção em campo.

Campos:

- Obra

- Data

- Horário

- Inspetor/responsável

- Setor ou local da inspeção

- Tipo de inspeção

- Observações gerais

Criar uma seção chamada:

"Evidências Fotográficas"

Nessa seção o usuário deverá conseguir:

- Tirar uma foto utilizando a câmera do celular;

- Selecionar uma foto da galeria;

- Fazer upload de uma imagem pelo computador;

- Adicionar várias fotos à mesma inspeção;

- Visualizar miniaturas das fotos adicionadas;

- Excluir uma foto antes de finalizar a inspeção;

- Adicionar uma descrição/legenda para cada foto.

As fotos deverão ficar visualmente associadas à inspeção.

Criar botão:

"Finalizar Inspeção"

5. TELA "INSPEÇÕES"

Criar uma tabela contendo:

- Número da inspeção

- Obra

- Data

- Horário

- Responsável

- Local

- Status

- Quantidade de fotos

- Quantidade de não conformidades

- Ação "Visualizar"

Ao abrir uma inspeção, mostrar:

- Dados da inspeção

- Observações

- Galeria de fotos

- Não conformidades relacionadas

- Ações corretivas relacionadas

6. TELA "CHECKLISTS"

Criar uma área preparada para futuramente cadastrar checklists de segurança.

Cada checklist deverá possuir:

- Nome

- Descrição

- Categoria

- Status

Criar alguns exemplos visuais de categorias:

- Trabalho em altura

- EPI

- Organização e limpeza

- Máquinas e equipamentos

- Instalações elétricas

- Andaimes

- Escadas

- Sinalização

- Proteção contra incêndio

Nesta primeira etapa, os dados podem ser demonstrativos.

7. TELA "NÃO CONFORMIDADES"

Criar uma tabela contendo:

- Número

- Obra

- Data

- Categoria

- Descrição

- Severidade

- Status

- Prazo

- Fotos

Criar filtros por:

- Obra

- Severidade

- Status

- Período

8. TELA "AÇÕES CORRETIVAS"

Criar uma interface preparada para futuramente controlar as ações corretivas.

Mostrar:

- Não conformidade

- Ação corretiva

- Responsável

- Prazo

- Status

9. TELA "RELATÓRIOS"

Criar uma área preparada para futuramente gerar relatórios profissionais em PDF.

10. RESPONSIVIDADE

O aplicativo deverá ser pensado principalmente para uso em campo.

No celular:

- Menu fácil de acessar;

- Botões grandes;

- Formulários simples;

- Botão de câmera facilmente acessível;

- Upload de fotos rápido;

- Galeria de fotos organizada;

- Interface que possa ser utilizada com uma mão.

No computador:

- Dashboard completo;

- Tabelas;

- Filtros;

- Visualização detalhada das inspeções.

IMPORTANTE:

Nesta primeira etapa NÃO implemente:

- banco de dados definitivo;

- autenticação;

- inteligência artificial;

- análise automática de fotos;

- integração com n8n;

- envio de e-mails;

- geração definitiva de PDF.

Porém, a arquitetura da interface deve ser preparada para receber essas funcionalidades posteriormente.

Para as fotos, nesta primeira etapa pode utilizar armazenamento temporário/mock apenas para demonstrar o funcionamento da interface.

Não crie funcionalidades falsas que pareçam estar funcionando quando não estiverem implementadas.

Priorize uma experiência profissional e extremamente simples para o inspetor registrar uma inspeção diretamente no celular durante uma visita à obra.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/62c9607f-c188-4e6c-a89f-c39f6aa5b3a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
