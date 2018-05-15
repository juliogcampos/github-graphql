// Object
var obj = {
  pullRequests: []
}

// Clean
function clean() {
  obj = {
    pullRequests: []
  };

  lastCursor = '';
}
clean();

// Requires
var fetch = require('node-fetch');
var fs = require('fs');

/* 
  GitHub access token
  Creating a personal access token for the command line
  https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/
*/
var accessToken = '';

// Variables
var user = 'audacity';
var repository = 'audacity';
var amount = 2;
var lastCursor = null;
var query = `
query github ($user: String!, $repository: String!, $lastCursor: String, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequests(first: $amount, after: $lastCursor, states: CLOSED) {
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
          labels(first: $amount) {
            nodes {
              name
            }
          }
          mergeable
          merged
          mergedAt
          number
          participants(first: $amount) {
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
`;

fetch('https://api.github.com/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: query, 
    variables: {
      user: user,
      repository: repository,
      lastCursor: lastCursor,
      amount: amount
    },
  }),
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
}).then(res => res.json())
  .then(body => store(body))
  .then(data => fs.writeFile( user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback))
  .then(next => execute(next))
  .catch(error => console.error(error));

function store(body) {

  for(var i = 0; i < amount; i++) {
    var item = body.data.repository.pullRequests.edges[i].node;
    obj.pullRequests.push(item);
    lastCursor = body.data.repository.pullRequests.pageInfo.endCursor;
    var hasNextPage = body.data.repository.pullRequests.pageInfo.hasNextPage;
  }

  console.log("\n" + obj.pullRequests.length + " pull requests");
  console.log("Cursor: " + lastCursor);

  if (hasNextPage == true) {
      return body;
  } else {
      return console.log("Finished!");
  }
}

function callback(status) {
  console.log('Saved data!');
}

function execute(next) {

fetch('https://api.github.com/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: query, 
    variables: {
      user: user,
      repository: repository,
      lastCursor: lastCursor,
      amount: amount
    },
  }),
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
}).then(res => res.json())
  .then(body => store(body))
  .then(data => fs.writeFile('data.json', JSON.stringify(obj, null, '  '), callback))
  .then(next => execute(next))
  .catch(error => console.error(error));

}

/*
  GitHub GraphQL
  GitHub GraphQL API - https://developer.github.com/v4/explorer/
  Documentação PullRequest - https://developer.github.com/v4/object/pullrequest/

  GraphQL
  Passing Arguments - https://graphql.org/graphql-js/passing-arguments/
  Schemas and Types - http://graphql.org/learn/schema/#object-types-and-fields

  NPM
  node-fetch - https://www.npmjs.com/package/node-fetch

  Tutorials
  Usando Promisses - https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Usando_promises
  Using Github GraphQL API with Node.js - https://www.scaledrone.com/blog/posts/graphql-tutorial-using-github-graphql-api-with-nodejs
  Saving Data to JSON File with Node.js - https://www.youtube.com/watch?v=6iZiqQZBQJY

  Questions
  Write/add data in JSON file using node.js - https://stackoverflow.com/questions/36856232/write-add-data-in-json-file-using-node-js

*/