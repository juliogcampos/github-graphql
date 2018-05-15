# github-graphql

Script desenvolvido com o interpretador de código JavaScript Node.js para extração de dados a partir da GitHub GraphQL API.

Trabalho desenvolvido no projeto de iniciação científica "Descoberta de Conhecimento e Mineração aplicadas ao Levantamento e Modelagem de Processos de Negócios", do CNPq, no primeiro semestre de 2018.

Orientadoras: Dr.ª Flávia Maria Santoro e Dr.ª Fernanda Araujo Baião - CCET/UNIRIO.

### Exemplo de query

Executar a query abaixo no [GitHub GraphQL API Explorer](https://developer.github.com/v4/explorer/) para ver os dados coletados e realizar testes.

```
{
  repository(owner: "audacity", name: "audacity") {
    pullRequests(first: 2, after: null, states: CLOSED) {
      totalCount
      edges {
        node {
          additions
          author {
            login
          }
          authorAssociation
          bodyText
          changedFiles
          closedAt
          createdAt
          deletions
          labels(first: 100) {
            nodes {
              name
            }
          }
          mergeable
          merged
          mergedAt
          number
          participants(first: 100) {
            nodes {
              name
            }
          }
          publishedAt
          resourcePath
          state
          title
          updatedAt
          viewerDidAuthor
          viewerSubscription
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}
```
### Instruções

- Antes de executar o código no Node.Js é necessário inserir na variável **acessToken** o seu [token de acesso pessoal](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
- O token de acesso pessoal não deve ser compartilhado com ninguém.
