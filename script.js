// NPM packages
var fetch = require('node-fetch');
var fs = require('fs');

// GitHub access token - https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/
var accessToken = '';

// Object
var obj = {
  totals: [],
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
      number
      url
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
  obj.totals.push({pullRequests: totalCount});
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
    console.log("   ⁞ Pull request " + number + " extracted");
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
        console.log("   ⁞ Index " + (index + 1) + " of " + pullRequestsNumbers.length);
        console.log("   ⁞ Pull request " + number);
        console.log("   ⁞ " + obj.comments.length + " comments extracted \n");
        index++;
        var hasElement = pullRequestsNumbers[index];
        if (hasElement != undefined) {
          number = hasElement;
          extractComments();
        } else {
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
    var number = body.data.repository.pullRequest.number;
    var url = body.data.repository.pullRequest.url;
    var item = body.data.repository.pullRequest.comments.edges[i].node;
    obj.comments.push({number: number, url: url, data: item});
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
        console.log("   ⁞ Index " + (index + 1) + " of " + pullRequestsNumbers.length);
        console.log("   ⁞ Pull request " + number);
        console.log("   ⁞ " + obj.reviews.length + " reviews extracted \n");
        index++;
        var hasElement = pullRequestsNumbers[index];
        if (hasElement != undefined) {
          number = hasElement;
          extractReviews();
        } else {
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
        console.log("   ⁞ Index " + (index + 1) + " of " + pullRequestsNumbers.length);
        console.log("   ⁞ Pull request " + number);
        console.log("   ⁞ " + obj.reviewComments.length + " review comments extracted \n");
        index++;
        var hasElement = pullRequestsNumbers[index];
        if (hasElement != undefined) {
          number = hasElement;
          extractReviewComments();
        } else {
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
    var item = body.data.repository.pullRequest.reviews.edges[i].node;
    obj.reviewComments.push(item);
  }
}

function callback(body) {
  console.log(' • Saved data!');
}
