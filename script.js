// NPM packages
var fetch = require('node-fetch');
var fs = require('fs');

// GitHub access token - https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/
var accessToken = '1b8e585c7bec196a3be67cc318894f9a86f657ec';

// Object
var obj = {
  totals: [
    {
      "pullRequests": null,
      "comments": null,
      "reviews": null,
      "reviewComments": null
    }
  ],
  pullRequests: [],
  comments: [],
  reviews: [],
  reviewComments: []
}

// Variables
var user = 'github';
var repository = 'scientist';
var amount = 10; // Maximum is 100. It's recommended not to use high values
var limit = 0;
var endCursor = null;
var pullRequestsNumbers = [];
var number = 0;
var index = 0;

// Queries
var totalCount = `
query totalCount ($user: String!, $repository: String!) {
  repository(owner: $user, name: $repository) {
    pullRequests(states: CLOSED) {
      totalCount
    }
  }
}
`;

var queryPullRequets = `
query pullRequests ($user: String!, $repository: String!, $endCursor: String, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequests(first: $amount, after: $endCursor, states: CLOSED) {
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
`;

var queryComments = `
query comments ($user: String!, $repository: String!, $endCursor: String, $number: Int!, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequest(number: $number) {
      comments(first: $amount, after: $endCursor) {
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
            id
            lastEditedAt
            publishedAt
            pullRequest {
              number
              url
            }
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

var queryReviews = `
query reviews ($user: String!, $repository: String!, $endCursor: String, $number: Int!, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequest(number: $number) {
      reviews(first: $amount, after: $endCursor) {
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
              commitUrl
              committedDate
              message
            }
            createdAt
            lastEditedAt
            publishedAt
            pullRequest {
              number
              url
            }
            state
            url
            viewerCanDelete
            viewerCanUpdate
            viewerCannotUpdateReasons
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

var queryReviewComments = `
query reviewComments ($user: String!, $repository: String!, $endCursor: String, $number: Int!, $amount: Int!) {
  repository(owner: $user, name: $repository) {
    pullRequest(number: $number) {
      reviews(first: $amount, after: $endCursor) {
        totalCount
        edges {
          node {
            comments(first: 100) {
              edges {
                node {
                  author {
                    login
                  }
                  authorAssociation
                  bodyText
                  commit {
                    url
                  }
                  createdAt
                  originalCommit {
                    author {
                      user {
                        login
                      }
                    }
                    url
                  }
                  position
                  publishedAt
                  pullRequest {
                    number
                    url
                  }
                  pullRequestReview {
                    url
                  }
                  reactions(first: 45) {
                    totalCount
                    edges {
                      node {
                        content
                        createdAt
                        user {
                          login
                        }
                      }
                    }
                  }
                  updatedAt
                  url
                }
              }
            }
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

// Check access token

if (accessToken == '') {
  console.log("variable 'access token' is empty!");
}

// Get total count of closed pull requests

fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: totalCount,
      variables: {
        user: user,
        repository: repository
      },
    }),
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  .then(res => res.json())
  .then(body => totalPullRequests(body))
  .catch(error => console.error(error));

function totalPullRequests(body) {
  var totalCount = body.data.repository.pullRequests.totalCount;
  obj.totals[0].pullRequests = totalCount;
  console.log('\033[2J'); // clear console
  console.log(" • " + user + "/" + repository + " has " + totalCount + " closed pull requests \n");
  console.log(" ⁞ Pull requests \n")
  extractPullRequests();
}

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
        console.log("   ⁞ " + pullRequestsNumbers.length + " of " + obj.totals[0].pullRequests + " pull requests");
        extractPullRequests(next);
      } else {
        number = pullRequestsNumbers[index];
        console.log("\n ⁞ Comments \n")
        extractComments();
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
    var item = body.data.repository.pullRequests.edges[i].node;
    obj.pullRequests.push(item);
    var number = body.data.repository.pullRequests.edges[i].node.number;
    pullRequestsNumbers.push(number);
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
          endCursor: endCursor,
          amount: amount
        },
      }),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    .then(res => res.json())
    .then(body => saveComments(body))
    .then(next => {
      if (endCursor != null) {
        extractComments(next);
      } else {
        console.log("   ⁞ " + (index + 1) + " of " + pullRequestsNumbers.length + " pull requests");
        index++;
        var hasElement = pullRequestsNumbers[index];
        if (hasElement != undefined) {
          number = hasElement;
          extractComments();
        } else {
          console.log("\n   ⁞ " + obj.comments.length + " comments extracted \n");
          obj.totals[0].comments = obj.comments.length;
          index = 0;
          number = pullRequestsNumbers[index];
          console.log(" ⁞ Reviews \n")
          extractReviews();
        }
      }
    })
    .catch(error => console.error(error));
}

function saveComments(body) {

  endCursor = body.data.repository.pullRequest.comments.pageInfo.endCursor;
  resultsPerPage = body.data.repository.pullRequest.comments.edges.length;

  if (amount == resultsPerPage) {
    limit = amount;
  } else {
    limit = resultsPerPage;
  }

  for (var i = 0; i < limit; i++) {
    var item = body.data.repository.pullRequest.comments.edges[i].node;
    obj.comments.push(item);

  }
}

function extractReviews() {

  fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: queryReviews,
        variables: {
          user: user,
          number: number,
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
    .then(body => saveReviews(body))
    .then(next => {
      if (endCursor != null) {
        extractReviews(next);
      } else {
        console.log("   ⁞ " + (index + 1) + " of " + pullRequestsNumbers.length + " pull requests");
        index++;
        var hasElement = pullRequestsNumbers[index];
        if (hasElement != undefined) {
          number = hasElement;
          extractReviews();
        } else {
          console.log("\n   ⁞ " + obj.reviews.length + " reviews extracted \n");
          obj.totals[0].reviews = obj.reviews.length;
          index = 0;
          number = pullRequestsNumbers[index];
          console.log(" ⁞ review comments \n")
          extractReviewComments();
        }
      }
    })
    .catch(error => console.error(error));
}

function saveReviews(body) {

  endCursor = body.data.repository.pullRequest.reviews.pageInfo.endCursor;
  resultsPerPage = body.data.repository.pullRequest.reviews.edges.length;

  if (amount == resultsPerPage) {
    limit = amount;
  } else {
    limit = resultsPerPage;
  }

  for (var i = 0; i < limit; i++) {
    var item = body.data.repository.pullRequest.reviews.edges[i].node;
    obj.reviews.push(item);
  }
}

function extractReviewComments() {

  fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: queryReviewComments,
        variables: {
          user: user,
          number: number,
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
    .then(body => saveReviewComments(body))
    .then(next => {
      if (endCursor != null) {
        extractReviewComments(next);
      } else {
        console.log("   ⁞ " + (index + 1) + " of " + pullRequestsNumbers.length + " pull requests");
        index++;
        var hasElement = pullRequestsNumbers[index];
        if (hasElement != undefined) {
          number = hasElement;
          extractReviewComments();
        } else {
          console.log("\n   ⁞ " + obj.reviewComments.length + " review comments extracted \n");
          obj.totals[0].reviewComments = obj.reviewComments.length;
          fs.writeFile(user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback);
        }
      }
    })
    .catch(error => console.error(error));
}

function saveReviewComments(body) {

  endCursor = body.data.repository.pullRequest.reviews.pageInfo.endCursor;
  resultsPerPage = body.data.repository.pullRequest.reviews.edges.length;

  if (amount == resultsPerPage) {
    limit = amount;
  } else {
    limit = resultsPerPage;
  }

  for (var i = 0; i < limit; i++) {
    var item = body.data.repository.pullRequest.reviews.edges[i].node.comments;
    obj.reviewComments.push(item);
  }
}

function callback(body) {
  console.log(' • Saved data!');
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
    Arrow functions - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
    JavaScript Array findIndex() Method - https://www.w3schools.com/jsref/jsref_findindex.asps
    Using Github GraphQL API with Node.js - https://www.scaledrone.com/blog/posts/graphql-tutorial-using-github-graphql-api-with-nodejs
    Saving Data to JSON File with Node.js - https://www.youtube.com/watch?v=6iZiqQZBQJY

  Questions
    Get the index of the object inside an array, matching a condition - https://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
    Write/add data in JSON file using node.js - https://stackoverflow.com/questions/36856232/write-add-data-in-json-file-using-node-js
    Node.Js on windows - How to clear console - https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
*/