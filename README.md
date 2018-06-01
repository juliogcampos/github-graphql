# github-graphql

Script desenvolvido com o interpretador de código JavaScript Node.js para extração de dados a partir da GitHub GraphQL API.

Trabalho desenvolvido no projeto de iniciação científica "Descoberta de Conhecimento e Mineração aplicadas ao Levantamento e Modelagem de Processos de Negócios", do CNPq, no primeiro semestre de 2018.

Orientadoras: Dr.ª Flávia Maria Santoro e Dr.ª Fernanda Araujo Baião - CCET/UNIRIO.

### Exemplo de query

Executar a query abaixo no [GitHub GraphQL API Explorer](https://developer.github.com/v4/explorer/) para ver os dados coletados e realizar testes.

```
{
  repository(owner: "graphql", name: "graphiql") {
    pullRequests(first: 10, after: null, states: CLOSED) {
      totalCount
      edges {
        node {
          number
          url
          title
          bodyText
          author {
            login
          }
          authorAssociation
          state
          locked
          changedFiles
          deletions
          createdAt
          updatedAt
          publishedAt
          closedAt
          comments(first: 100) {
            totalCount
            edges {
              node {
                author {
                  login
                }
                authorAssociation
                bodyText
                createdAt
                editor {
                  login
                }
                lastEditedAt
                publishedAt
                updatedAt
                url
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
          commits(first: 100) {
            totalCount
            edges {
              node {
                commit {
                  author {
                    user {
                      login
                    }
                  }
                }
                id
                url
              }
            }
          }
          reviews(first: 100) {
            totalCount
            edges {
              node {
                author {
                  login
                }
                authorAssociation
                bodyText
                commit {
                  author {
                    user {
                      login
                    }
                  }
                }
                createdAt
                id
                publishedAt
                state
                submittedAt
                updatedAt
                url
              }
            }
          }
          reviewRequests(first: 100) {
            totalCount
            edges {
              node {
                id
                requestedReviewer {
                  __typename
                }
              }
            }
          }
          timeline(first: 100) {
            totalCount
            edges {
              comment: node {
                __typename
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```
### Instruções

- [Instalar o Node.js](https://nodejs.org/)
- Antes de executar o script no Node.Js é necessário inserir na variável **acessToken** o seu [token de acesso pessoal](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/). O token de acesso pessoal não deve ser compartilhado com ninguém.
