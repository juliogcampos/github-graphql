// Object
var obj = {
  pullRequests: [],
  comments : []
}

var pullRequestsNumbers = [];

// Clean
function clean() {
  obj = {
    pullRequests: []
  };

  pullRequestsNumbers = [];
  lastCursor = '';
}

// Execute clean
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
var user = 'github';
var repository = 'scientist';
var amount = 1;
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

function extractPullRequests() {

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
    .then(body => savePullRequests(body))
    .then(data => fs.writeFile( user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback))
    .then(next => extractPullRequests(next))
    .catch(error => console.error(error));
}
extractPullRequests();

function savePullRequests(body) {

  for(var i = 0; i < amount; i++) {

    var item = body.data.repository.pullRequests.edges[i].node;
    obj.pullRequests.push(item);

    var pullRequestNumber = body.data.repository.pullRequests.edges[i].node.number;
    pullRequestsNumbers.push(pullRequestNumber);

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
