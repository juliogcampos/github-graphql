// Requires
var fetch = require('node-fetch');
var fs = require('fs');

/* 
  GitHub access token
  Creating a personal access token for the command line
  https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/
*/
var accessToken = '';

// Object
var obj = {
  pullRequests: [],
  comments : []
}

// Variables
var user = 'github';
var repository = 'scientist';
var amount = 1;
var lastCursorPulls = null;
var lastCursorComments = null;
var hasNextPage = null;
var pullRequestsNumbers = [];
var number = 79;

// Queries
var queryPullRequets = `
query pullRequests ($user: String!, $repository: String!, $lastCursorPulls: String, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequests(first: $amount, after: $lastCursorPulls, states: CLOSED) {
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

var queryComments = `
query comments ($user: String!, $repository: String!, $lastCursorComments: String, $number: Int!, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequest(number: $number) {
      number
      comments(first: $amount, after: $lastCursorComments) {
        totalCount
        edges {
          node {
            author {
              login
            }
            authorAssociation
            body
            createdAt
            editor {
              login
            }
            id
            lastEditedAt
            publishedAt
            updatedAt
            viewerDidAuthor
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
}
`;

function extractPullRequests() {

  fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: queryPullRequets, 
      variables: {
        user: user,
        repository: repository,
        lastCursorPulls: lastCursorPulls,
        amount: amount
      },
    }),
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }).then(res => res.json())
    .then(body => savePullRequests(body))
    .then(data => fs.writeFile( user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback))
    .then(next => {
        if (hasNextPage) {
          extractPullRequests(next);
        } else {
          extractComments();
        }
      }
    )
    .catch(error => console.error(error));
}

extractPullRequests();

function savePullRequests(body) {

  hasNextPage = body.data.repository.pullRequests.pageInfo.hasNextPage;

  if(hasNextPage) {
    for(var i = 0; i < amount; i++) {

      var item = body.data.repository.pullRequests.edges[i].node;
      obj.pullRequests.push(item);
      // console.log(item);

      var pullRequestNumber = body.data.repository.pullRequests.edges[i].node.number;
      pullRequestsNumbers.push(pullRequestNumber);

      lastCursorPulls = body.data.repository.pullRequests.pageInfo.endCursor;
    }
      console.log("\n" + obj.pullRequests.length + " pull requests");
      console.log("Cursor: " + lastCursorPulls);
  }
}

function extractComments() {

  fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: queryComments, 
      variables: {
        user: user,
        number: number,
        repository: repository,
        lastCursorComments: lastCursorComments,
        amount: amount
      },
    }),
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }).then(res => res.json())
    .then(body => saveComments(body))
    .then(data => fs.writeFile( user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback))
    .then(next => {
        if (hasNextPage) {
          extractComments(next);
        } else {
          console.log("Finished!");
        }
      }
    )
    .catch(error => console.error(error));
}

function saveComments(body) {

  hasNextPage = body.data.repository.pullRequest.comments.pageInfo.hasNextPage;

  if (hasNextPage) {
    for(var i = 0; i < amount; i++) {

      var number = body.data.repository.pullRequest.number;
      var item = body.data.repository.pullRequest.comments.edges[i].node;
      obj.comments.push({number: number, item: item});

      lastCursorComments = body.data.repository.pullRequest.comments.pageInfo.endCursor;
    }

    console.log("\n" + obj.comments.length + " comments");
    console.log("Cursor: " + lastCursorComments);
  }

}

function callback(status) {

  if (hasNextPage) {
    console.log('Saved data!');
  }
}
