// NPM packages
var fetch = require('node-fetch');
var fs = require('fs');

// GitHub access token - https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/
var accessToken = '';

// Array
var arr = [];

// Variables
var user = 'github';
var repository = 'scientist';
var amount = 10; // Maximum is 100. It's recommended not to use high values
var limit = 0;
var endCursor = null;

// Query
var queryPullRequets = `
query pullRequests ($user: String!, $repository: String!, $amount: Int!, $endCursor: String) {
  repository(owner: $user, name: $repository) {
    pullRequests(first: $amount, after: $endCursor, states: CLOSED) {
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
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

if (accessToken == '') {
  console.log("\n   Variable 'access token' is empty!");
}
console.log("\n   User: " + user);
console.log("   Repository: " + repository);
console.log("   Amount: " + amount + "\n");
extractPullRequests();

function extractPullRequests() {

  fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: queryPullRequets,
        variables: {
          user: user,
          repository: repository,
          endCursor: endCursor,
          amount: amount
        },
      }),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    .then(res => res.json())
    .then(body => savePullRequests(body))
    .then(next => {
      if (endCursor != null) {
        extractPullRequests(next);
      } else {
      	fs.writeFile(user + '_' + repository + '.json', JSON.stringify(arr, null, '  '), callback);
      }
    })
    .catch(error => console.error(error));
}

function savePullRequests(body) {

  endCursor = body.data.repository.pullRequests.pageInfo.endCursor;
  var resultsPerPage = body.data.repository.pullRequests.edges.length;


  if (amount == resultsPerPage) {
    limit = amount;
  } else {
    limit = resultsPerPage;
  }

  for (var i = 0; i < limit; i++) {
    console.log("   Collecting pull request " + body.data.repository.pullRequests.edges[i].node.number);
    var item = body.data.repository.pullRequests.edges[i].node;
    arr.push(item);
  }
}

function callback(body) {
  console.log('\n   Saved data!');
}

