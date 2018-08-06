let githubAccessToken = "a4420c6e4256e36b0a371f8cc0cdd7475a9f1590";
let headers = {
  "Content-Type": "application/json; charset=utf-8",
  Authorization: `Bearer ${githubAccessToken}`
};
// Using graphql v4 since v3 was returning incorrect pushed_at
// https://github.com/react-community/native-directory/issues/20
let query = (user, repo) => ({
  query: `
  query {
  repository(owner:"${user}", name:"${repo}") {
    stargazers {
      totalCount
    }
    ref(qualifiedName: "master") {
      target {
        ... on Commit {
          id
          committedDate
        }
      }
    }
  }
}
  `
});
function addCommas(t) {
  return String(t).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

var getGithubStarsAndUpdatedAgo = async gitUrl => {
  var path = /^.*github\.com\/(.*)/.exec(gitUrl)[1];
  // don't know how to match regex starting at end of string...
  var [user, repo, ...rest] = path.split("/"); // need to ignore further arguments
  // remove .git from repo if its there...
  repo = repo.endsWith(".git") ? repo.slice(0, -4) : repo;
  // hack: graphql v4 doesn't redirect for renamed repo, but v3 does
  // https://platform.github.community/t/repository-redirects-in-api-v4-graphql/4417
  var repoInfo = await fetch(`https://api.github.com/repos/${user}/${repo}`);
  var {
    name: repoName,
    owner: { login: repoUser }
  } = await repoInfo.json();
  var res = await fetch(`https://api.github.com/graphql`, {
    method: "POST",
    headers,
    body: JSON.stringify(query(repoUser, repoName))
  });
  var resJson = await res.json();
  if (resJson.errors) {
    console.log(`errors for ${repoUser}/${repoName}`);
    console.log(resJson.errors);
  }
  const {
    repository: {
      stargazers: { totalCount },
      ref: {
        target: { committedDate }
      }
    }
  } = resJson.data;
  return [totalCount, moment(committedDate).fromNow()];
};

$(document).ready(() => {
  $(".rc > h3").each(async (idx, elm) => {
    var href = $(elm)
      .find("a")
      .first()
      .attr("href");
    var githubRe = /^https:\/\/(www\.)?github\.com\/.+\/.+/gm;
    var npmRe = /^https:\/\/(www\.)?npmjs\.com\/package\/.+/gm;
    let gitStars = undefined,
      ago;
    if (githubRe.test(href)) {
      [gitStars, ago] = await getGithubStarsAndUpdatedAgo(href);
    } else if (npmRe.test(href)) {
      var packageName = /.*package\/(.*)/.exec(href)[1];
      // eg. package name: @polymer/polymer, /latest doesn't work for this...
      var packagePath = /@/.test(packageName)
        ? packageName
        : packageName + "/latest";
      // using 3rd party middleware since registry.npmjs.org doesn't support cors
      // /latest required otherwise too much data is returned.
      var npmRes = await fetch(
        `https://cors-proxy.htmldriven.com/?url=http://registry.npmjs.org/${packagePath}`
      );
      var npmResJson = await npmRes.json();
      const {
        repository: { url }
      } = JSON.parse(npmResJson.body);
      if (/.*github\.com\/.*/.test(url)) {
        [gitStars, ago] = await getGithubStarsAndUpdatedAgo(url);
      }
    }
    if (gitStars !== undefined && ago) {
      var greenRow = $(elm)
        .next()
        .find("div.f")
        .first();

      $(greenRow).append(
        `<div class='star-div'>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="9" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"/></svg>
          <span>${addCommas(gitStars)}</span>
        </div>
        <span class='ago-div'>
          ${ago}
        </span>
      `
      );
    }
  });
});
