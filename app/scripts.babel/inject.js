console.log("inject working");
let headers = new Headers();
headers.append(
  "Authorization",
  "Basic " + btoa("google-npm:nobody-can-guess-this")
);
function addCommas(t) {
  return String(t).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

var getGithubStars = async gitUrl => {
  var path = /^.*github\.com\/(.*)/.exec(gitUrl)[1];
  // don't know how to match regex starting at end of string...
  var [user, repo, ...rest] = path.split("/"); // need to ignore further arguments
  // remove .git from repo if its there...
  repo = repo.endsWith(".git") ? repo.slice(0, -4) : repo;
  var res = await fetch(`https://api.github.com/repos/${user}/${repo}`, {
    headers
  });
  var resJson = await res.json();
  return resJson.stargazers_count;
};

$(document).ready(() => {
  console.log("document ready");
  console.log("is this working?");
  $(".rc > h3").each(async (idx, elm) => {
    var href = $(elm)
      .find("a")
      .first()
      .attr("href");
    var githubRe = /^https:\/\/(www\.)?github\.com\/.+\/.+/gm;
    var npmRe = /^https:\/\/(www\.)?npmjs\.com\/package\/.+/gm;
    let gitStars;
    if (githubRe.test(href)) {
      gitStars = await getGithubStars(href);
    } else if (npmRe.test(href)) {
      var packageName = /.*package\/(.*)/.exec(href)[1];
      // using 3rd party middleware since registry.npmjs.org doesn't support cors
      var npmRes = await fetch(
        `https://cors-proxy.htmldriven.com/?url=http://registry.npmjs.org/${packageName}`
      );
      var npmResJson = await npmRes.json();
      const {
        repository: { url }
      } = JSON.parse(npmResJson.body);
      if (/.*github\.com\/.*/.test(url)) {
        gitStars = await getGithubStars(url);
      }
    }
    if (gitStars) {
      var greenRow = $(elm)
        .next()
        .find("div.f")
        .first();

      $(greenRow).append(
        `<div class='star-div'>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 14 16"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74L14 6z"/></svg>
          <span>${addCommas(gitStars)}</span>
        </div>
      `
      );
    }
  });
});
