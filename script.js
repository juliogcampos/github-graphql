// NPM packages
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
	totals: [],
	pullRequests: [],
	comments : []
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
	console.log("\n → " + user + "/" + repository + " has " + totalCount + " closed pull requests");
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
    .then(data => fs.writeFile(user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback))
    .then(next => 
		{
	      	if (endCursor != null) {
	         	extractPullRequests(next);
	        } else {
	         	console.log("\n → " + obj.pullRequests.length + " pull requests saved!");
	         	number = pullRequestsNumbers[index];
	         	extractComments();
	        }
	  	}
    )
    .catch(error => console.error(error));
}

function savePullRequests(body) {

	endCursor = body.data.repository.pullRequests.pageInfo.endCursor;
	var resultsPerPage = body.data.repository.pullRequests.edges.length;

	if(amount == resultsPerPage) {
		limit = amount;
	} else {
		limit = resultsPerPage;
	}

	for(var i = 0; i < limit; i++) {
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
    .then(data => fs.writeFile(user + '_' + repository + '.json', JSON.stringify(obj, null, '  '), callback))
    .then(next => 
    	{
	        if (endCursor != null) {
	        	extractComments(next);
	        } else {
	          	console.log("\n → " + obj.comments.length + " comments saved!");
	          	index++;
	          	var hasElement = pullRequestsNumbers[index]; 
	          	if (hasElement != undefined) {
	          		number = hasElement;
	          		extractComments();
	          	} else {
	          		console.log("\n → Finished!");
	          	}	        
	        }
      	}
    )
    .catch(error => console.error(error));
}

function saveComments(body) {

	endCursor = body.data.repository.pullRequest.comments.pageInfo.endCursor;
	resultsPerPage = body.data.repository.pullRequest.comments.edges.length;

	if(amount == resultsPerPage) {
		limit = amount;
	} else {
		limit = resultsPerPage;
	}

	for(var i = 0; i < limit; i++) {
		var number = body.data.repository.pullRequest.number;
	  	var url = body.data.repository.pullRequest.url;
	  	var item = body.data.repository.pullRequest.comments.edges[i].node;
	  	obj.comments.push({number: number, url: url, data: item});
	}
}

function callback(status) {

	/*
	if(endCursor || endCursor != null) {
		console.log(' Saved data!');
	}
	*/
}
