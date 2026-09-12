// ==UserScript==
// @name          Reddit Comments II
// @namespace     https://github.com/maptracker/confFiles/tree/master/UserScript
// @match         http://www.reddit.com/*/comments/*
// @match         http://np.reddit.com/*/comments/*
// @match         https://np.reddit.com/*/comments/*
// @match         http://www.reddit.com/user/*
// @match         https://www.reddit.com/*/comments/*
// @match         https://www.reddit.com/comments/*
// @match         https://www.reddit.com/user/*
// @match         https://www.reddit.com/r/*
// @match         https://www.reddit.com/
// @match         https://old.reddit.com/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/*/comments/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/comments/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/user/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/r/*
// @match         https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/
// @match         https://old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/*
// @description   Colorizes posts and comments by count
// @version       1.1.9
// @grant         none
// ==/UserScript==

// Redirect to old version of Reddit if needed
// useOld(); // Summer 2026 Reddit is killing Old Reddit

// Array to hold all comment elements, plus their score
const coms = [];
// ID of the comment range slider
const comRangeFilter = "comRangeFilter";
const comAreaClass = "commentarea";
var comEl = document.getElementsByClassName(comAreaClass)[0];
const noteEl = document.createElement("div");
// Will hold the top-by-date sorter target, if it's found
let topTarg = false;
// Tracking how many times we tried to find content
let contentSearchCount = 0;
let opAuthor = "DummyInitialValue";

console.log("TEST");
logX("-- Reddit Comment Highlighter --");

// Start the cascade looking to configure New Reddit
let infoDiv, newSpace, contentDiv, commentDiv;
// Lookup to help rebuild comment hierarchy
const comLookup = {};

// Create the top-level space which will hold relocated content
makeNewSpace();

setTimeout(modifyDoc, 3000);

function modifyDoc() {
  doubleNext();
  highlightX();
  filterButtons();
  colorRecentness();
  torSwap();
  basicHyperlinks();
}

function doubleNext() {
  var buts = document.getElementsByClassName("next-button");
  for (var i = 0; i < buts.length; i++) {
    var but = buts[i];
    var a = but.getElementsByTagName("a");
    if (a.length > 0) {
      var href = a[0].href;
      if (/count=/.test(href) && !/\+/.test(href)) {
        href = href.replace(/\/r\/([^/]+)\//, (_, sr) => `/r/${sr}+${sr}/`);
        a[0].href = href;
        logX("[-] Reddit Comments - Patched Next url");
      }
      but.style.backgroundColor = "green";
    }
  }
}

function makeNewSpace() {
  const loc = window.location.href;
  const isComment = new RegExp("\/comments\/");
  const domain = window.location.hostname;
  const isNew = new RegExp("^www\.");
  // Logic that is initiated below is only for New Reddit, and comment pages
  if (!isComment.test(loc) || !isNew.test(domain)) return null;

  setStyles();
  newSpace = document.createElement("div");
  newSpace.id = "newSpace";
  document.body.insertBefore(newSpace, document.body.firstChild);
  infoDiv = document.createElement("div");
  infoDiv.id = "infoDiv";
  newSpace.appendChild(infoDiv);
  logX("[0] Reddit Comments II - Created " + infoDiv.id);
  // Start waiting for content to appear
  relocateMetadata();
}

function relocateMetadata() {
  if (!newSpace) {
    logX("[x] Reddit Comments - Metadata relocation didn't find newSpace");
    return null;
  }
  const post = document.querySelector("shreddit-post");
  if (!post) {
    // If the post element isn't available try again after a second
    logX("[.] Reddit Comments - Awaiting shreddit-post");
    setTimeout(relocateMetadata, 1000);
    return false;
  }
  const postSroot = post.shadowRoot;
  if (!postSroot) {
    // If the post element isn't available try again after a second
    logX("[.] Reddit Comments - Awaiting post's shadowRoot");
    setTimeout(relocateMetadata, 1000);
    return false;
  }

  const acts = postSroot.querySelector("rpl-action-bar");
  if (!acts) {
    // If the action bar isn't available try again after a second
    logX("[.] Reddit Comments - Awaiting rpl-action-bar");
    setTimeout(relocateMetadata, 1000);
    return false;
  }

  opAuthor = post.getAttribute("author");
  logX("[1] Reddit Comments II - Metadata found. Author: " + opAuthor);
  // The topBar is a table holding simplified information about this page
  const topBar = [];
  // Upvotes
  const nums = acts.getElementsByTagName("faceplate-number");
  const numTD = document.createElement("td");
  if (nums.length == 0) {
    nums.push("?");
  } else {
    const pts = nums[0].getAttribute("number");
    const ptInfo = scoreToStyle(pts);
    applyStyle(ptInfo.style, numTD);
  }
  numTD.appendChild(nums[0]);
  topBar.push(numTD);

  // Upvote ratio
  const upr = post.getAttribute("upvote-ratio");
  if (upr) {
    const uprTD = document.createElement("td");
    topBar.push(uprTD);
    uprTD.innerText = Math.round(100 * upr) + "%";
    uprTD.title = "Upvote Ratio";
  }

  const info = document.getElementById("pdp-credit-bar");
  if (!info) {
    // If the author isn't available try again after a second
    // logX("[x] Reddit Comments - Failed to find shreddit-post");
    setTimeout(relocateMetadata, 1000);
    return false;
  }
  // Author
  const auths = info.getElementsByClassName("author-name");
  if (auths.length == 0) auths.push("Unknown Author");
  const authTD = document.createElement("td");
  authTD.appendChild(auths[0]);
  topBar.push(authTD);
  logX("[1] Reddit Comments II - Metadata +Author");

  // Date
  const times = info.getElementsByTagName("faceplate-timeago");
  if (times.length == 0) times.push("Unknown Date");
  const timeTD = document.createElement("td");
  timeTD.appendChild(times[0]);
  topBar.push(timeTD);

  // Subreddit
  const sred = info.getElementsByTagName("faceplate-hovercard");
  if (sred.length == 0) sred.push("Unknown Subredit");
  const sredTD = document.createElement("td");
  sredTD.appendChild(sred[0]);
  topBar.push(sredTD);

  if (topBar.length > 0) {
    logX(
      "[2] Reddit Comments II - Info bar with " + topBar.length + " details"
    );
    const metaTab = document.createElement("table");
    metaTab.style.width = "max-content";
    metaTab.style.whiteSpace = "nowrap";
    infoDiv.appendChild(metaTab);
    const metaBod = document.createElement("tbody");
    metaTab.appendChild(metaBod);
    const metaTr = document.createElement("tr");
    metaBod.appendChild(metaTr);
    for (var i = 0; i < topBar.length; i++) {
      var td = topBar[i];
      metaTr.appendChild(td);
    }
  }
  relocateTitle();
}

function relocateTitle() {
  const post = document.querySelector("shreddit-post");
  const h1s = post.querySelectorAll("h1");
  if (h1s.length == 0) {
    // If the title isn't available try again after a second
    setTimeout(relocateTitle, 1000);
    return false;
  }
  infoDiv.appendChild(h1s[0]);
  relocatePostContent();
}

function relocatePostContent() {
  // Post content
  contentDiv = document.createElement("div");
  contentDiv.id = "contentDiv";
  newSpace.appendChild(contentDiv);
  searchForContent();
}

function searchForContent() {
  const post = document.querySelector("shreddit-post");
  // Can we use post-type to better find content? TODO
  const type = post.getAttribute("post-type");

  const oneimg = document.getElementById("post-image");
  if (oneimg) {
    // The post has a single image
    relocateSingleImage(oneimg);
    return true;
  }
  const gcs = post.querySelector("gallery-carousel");
  if (gcs) {
    relocateGallery(gcs);
    return true;
  }

  const player = post.querySelector("shreddit-player");
  if (player) {
    if (relocateVideo(player)) {
      return true;
    }
  }

  const lightbox = post.querySelector('[source="post_lightbox"]');
  if (lightbox) {
    if (relocateLightbox(lightbox)) {
      return true;
    }
  }

  if (relocatePostText()) {
    /* This may end up causing problems with asynchronous loading of 
	   content. For text-only posts, this is all there will be. But other 
	   post types may evaluate true here, but fail to move over the 
	   'primary' content
	*/
    clearPost();
    relocateComments();
    return true;
  }
  // Couldn't find anything (or I haven't coded other option yet)
  if (contentSearchCount++ > 20) {
    // Some posts don't seem to have content? Only a title?
    // After 20 seconds give up and start managing rest of content
    logX("[3] Reddit Comments II - ?? Couldn't find any other content");
    clearPost();
    relocateComments();
    return true;
  }

  // Try again in a second
  setTimeout(searchForContent, 1000);
}

function largestSourceSet(img) {
  // takes an image element
  // if it has a parsable srcset, returns largest source
  // otherwise returns vanilla srcset
  var src;
  if (img.srcset) {
    src = lrgSrcMthd(img.srcset);
  } else if (img.getAttribute("data-lazy-srcset")) {
    src = lrgSrcMthd(img.getAttribute("data-lazy-srcset"));
  }
  if (!src) src = img.src;
  if (!src) src = img.getAttribute("data-lazy-src");
  return src;
}

function lrgSrcMthd(srcset) {
  // Disassembles srcset to find largest image
  return [...srcset.matchAll(/(\S+)\s+(\d+)w/g)].reduce(
    (largest, [, url, width]) =>
      Number(width) > largest.width ? { url, width: Number(width) } : largest,
    { url: null, width: -Infinity }
  ).url;
}

function relocateGallery(gc) {
  logX("[3] Reddit Comments II - Content type: Image gallery");
  // A slider to control the size of the tiles
  const range = document.createElement("input");
  range.type = "range";
  range.min = "200";
  range.max = "600";
  range.step = "50";
  range.value = "50";
  range.addEventListener("input", () => {
    resizeTiles(Number(range.value));
  });
  contentDiv.appendChild(range);
  // The gallery container
  div = document.createElement("div");
  div.id = "newGallery";
  contentDiv.appendChild(div);
  // Each individual picture
  const imgs = gc.querySelectorAll("img");
  for (var i = 0; i < imgs.length; i++) {
    const el = imgs[i];
    if (!el.classList.contains("absolute")) continue;
    const src = largestSourceSet(el);
    if (!src) continue;
    const tile = document.createElement("div");
    tile.className = "tile tilesz";
    const imgA = document.createElement("a");
    imgA.href = src;
    imgA.className = "tile tilesz";
    const image = document.createElement("img");
    image.src = src;
    image.alt = "Image " + (i + 1);
    //image.loading = "lazy";

    div.appendChild(tile);
    tile.appendChild(imgA);
    imgA.appendChild(image);
    //tile.appendChild(image);
  }
  relocatePostText();
  clearPost();
  relocateComments();
  return true;
}

function relocateVideo(player) {
  const pSroot = player.shadowRoot;
  if (!pSroot) return false;
  const vid = pSroot.querySelector("video");
  if (!vid) {
    logX("[.] Reddit Comments II - Awaiting video content");
    return false;
  }
  let src = vid.src;
  if (!src) {
    logX("[.] Reddit Comments II - Awaiting video source");
    return false;
  }
  if (/^blob/.test(src)) {
    // Not sure what this is, but it's not a video
    logX("[.] Reddit Comments II - Seeing if video will stop being a blob");
    return false;
  }
  logX("[3] Reddit Comments II - Content type: Video");

  const pDiv = document.createElement("div");
  pDiv.className = "vidDiv";
  // Relocating the original video didn't work at all
  // We'll make a new, clean video tag and just move the source over
  const newVid = document.createElement("video");
  newVid.controls = "controls";
  newVid.muted = "muted";
  newVid.preload = "auto";
  newVid.width = 640;
  pDiv.appendChild(newVid);
  const vidSrc = document.createElement("source");
  vidSrc.src = src;
  newVid.appendChild(vidSrc);

  contentDiv.appendChild(pDiv);
  relocatePostText();
  clearPost();
  relocateComments();
  return true;
}

function relocateLightbox(lightbox) {
  if (!lightbox) return false;
  logX("[3] Reddit Comments II - Content type: Basic Lightbox");
  contentDiv.appendChild(lightbox);
  relocatePostText();
  clearPost();
  relocateComments();
  return true;
}

function removeNode(el) {
  if (!el) return false;
  el.parentNode.removeChild(el);
  logX("[-] Removed node: " + el.tagName);
  return true;
}

function clearPost() {
  const post = document.querySelector("shreddit-post");
  if (!post) return;
  removeNode(post);
  removeNode(document.querySelector("comment-body-header"));
  const app = document.querySelector("#shreddit-app");
  if (app) app.style.display = "none";
}

function relocateSingleImage(img) {
  const src = largestSourceSet(img);
  if (!src) {
    logX("[x] Reddit Comments II - Failed to resolve Single Image");
    return false;
  }
  logX("[3] Reddit Comments II - Content type: Single Image");
  const imgA = document.createElement("a");
  imgA.href = src;

  // Check if there's an external link associated with the image, too
  const par = img.parentNode;
  if (par.tagName == "A") {
    logX("[+] Found associated link: " + par);
    const href = par.href;
    if (href && !/reddit/.test(href)) {
      // Make a new anchor to strip any sillyness from original link
      logX("[+] Including hyperlink: " + href);
      const newA = document.createElement("a");
      newA.href = href;
      newA.innerText = href;
      contentDiv.appendChild(newA);
      contentDiv.appendChild(document.createElement("br"));
      // Also set the image hyperlink to the external source
      imgA.href = href;
    }
  }

  contentDiv.appendChild(imgA);
  const newImg = document.createElement("img");
  newImg.src = src;
  newImg.style.objectFit = "contain";
  newImg.style.maxWidth = "600px";
  newImg.style.maxHeight = "600px";
  imgA.appendChild(newImg);
  relocatePostText();
  clearPost();
  relocateComments();
  return true;
}

function relocatePostText() {
  const post = document.querySelector("shreddit-post");
  const text = post.querySelector("shreddit-post-text-body");
  if (text) {
    contentDiv.appendChild(text);
    text.style.maxWidth = "800px";
    return true;
  }
  // Treat a removed post like simple text
  const removed = post.querySelector('[slot="post-removed-banner"]');
  if (removed) {
    contentDiv.appendChild(removed);
    text.style.maxWidth = "800px";
    return true;
  }

  return false;
}

function relocateComments() {
  commentDiv = document.createElement("div");
  contentDiv.appendChild(commentDiv);
  const range = document.createElement("input");
  range.id = comRangeFilter;
  range.type = "range";
  range.min = "10";
  range.max = "100";
  range.step = "10";
  range.value = "10";
  range.addEventListener("input", () => {
    filterComments();
  });
  commentDiv.appendChild(range);
  const rangeNote = document.createElement("span");
  rangeNote.className = "rangeNote";
  commentDiv.appendChild(rangeNote);
  scanComments();
}

function filterComments() {
  // Function supporting slider on New Reddit pages
  const range = document.getElementById(comRangeFilter);
  if (!range) return -1;
  const x = Number(range.value);
  if (!x) return -1;
  coms.sort(function (a, b) {
    return b[1] - a[1];
  });
  const numCom = coms.length;
  let cutoff = Math.round((numCom * x) / 100);
  if (cutoff < 10) cutoff = 10;
  if (cutoff > numCom) cutoff = numCom;
  for (let i = 0; i < numCom; i++) {
    const el = coms[i][0];
    el.style.display = i >= cutoff ? "none" : "block";
  }
  range.nextElementSibling.innerText =
    "Showing top " + cutoff + " of " + numCom + " comments";
  return cutoff;
}

function scanComments() {
  const tree = document.querySelector("shreddit-comment-tree");
  if (!tree) {
    // If the title isn't available try again after a second
    logX("[.] Reddit Comments - Awaiting shreddit-comment-tree");
    setTimeout(relocateComments, 1000);
    return false;
  }
  const coms = tree.querySelectorAll("shreddit-comment");
  let moved = 0;
  coms.forEach(function (com) {
    if (moveOneComment(com)) moved++;
  });
  // prettier-ignore
  logX("[+] Reddit Comments - Relocated " + moved + 
       ' of ' + coms.length + " comments");
  // Comments are being dynamically loaded, keep checking for new ones
  if (moved > 0) filterComments();
  // The comment block keeps popping back. So we'll hide the whole app at this point
  const app = document.querySelector("shreddit-app");
  app.style.display = "none";
  setTimeout(scanComments, 1000);
  const lastDiv = document.body.querySelector("div:last-of-type");
  if (lastDiv && lastDiv.innerText.includes("reCAPTCHA")) {
    // Shows up after some delay, so look for it here, inside timeout recursion
    removeNode(lastDiv);
  }
}

function moveOneComment(com) {
  if (!com) return false;
  if (com.DONE) return false;

  const comID = com.getAttribute("thingid");
  if (comLookup[comID]) {
    // A relocated DIV was already made for this ID
    // This shouldn't happen, but I think some comments may be
    // re-loading into the DOM?
    com.DONE = true;
    com.style.display = "none";
    return true;
  }
  // The outer div will be used for nesting replies
  const comOuter = document.createElement("div");
  comOuter.className = "newCom";
  comLookup[comID] = comOuter;
  // The div inside it will have content for this specific comment
  const comDiv = document.createElement("div");
  comOuter.appendChild(comDiv);

  // Small table to hold information about poster
  const metaTab = document.createElement("table");
  metaTab.style.width = "max-content";
  metaTab.style.whiteSpace = "nowrap";
  comDiv.appendChild(metaTab);
  const metaBod = document.createElement("tbody");
  metaTab.appendChild(metaBod);
  const metaTr = document.createElement("tr");
  metaBod.appendChild(metaTr);

  // Upvotes
  const numTD = document.createElement("td");
  metaTr.appendChild(numTD);
  const val = com.getAttribute("score");
  const ptInfo = scoreToStyle(val);
  numTD.innerText = val;
  numTD.title = "Score";
  applyStyle(ptInfo.style, numTD);
  coms.push([comDiv, ptInfo.value]);

  // Author
  const authTD = document.createElement("td");
  metaTr.appendChild(authTD);
  const auth = com.querySelector('[noun="comment_author"]');
  if (auth) {
    authTD.appendChild(auth);
    const authTxt = auth.innerText.replace(/\s*/g, "");
    // Highlight OP
    if (authTxt == opAuthor) {
      authTD.className = "opauthor";
    }
    // legacy attribute used for some styling
    comDiv.setAttribute("data-author", authTxt);
  } else {
    authTD.innerText = "?";
  }

  // Posting date
  const dt = com.querySelector("faceplate-timeago");
  const dtTD = document.createElement("td");
  dtTD.appendChild(dt);
  metaTr.appendChild(dtTD);

  // Are there hidden children?
  const kids = com.querySelector("#comment-children");
  if (false && kids) {
    // Eh, still can't get this to work
    const kbut = kids.querySelector("button");
    if (kbut) {
      const kidTD = document.createElement("td");
      metaTr.appendChild(kidTD);
      // The button doesn't work when moved outside its native context
      // So we'll make a new link that clicks the (now hidden) button for us
      const loadKids = document.createElement("a");
      loadKids.innerText = kbut.innerText;
      loadKids.onclick = function () {
        alert(kbut);
        kbut.click();
      };
      kidTD.appendChild(loadKids);
    }
  }

  // Get the actual comment body
  const bodDiv = document.createElement("div");
  bodDiv.className = "commentBody";
  comDiv.appendChild(bodDiv);
  const comVal = com.querySelector('[slot="comment"]');
  if (comVal) {
    const kid1 = comVal.firstElementChild;
    if (kid1) {
      // Looks like there's an intermediate div? Let's ignore that
      // and grab everything inside it
      while (kid1.firstChild) {
        bodDiv.appendChild(kid1.firstChild);
      }
    }
  } else {
    logX("[x] Reddit Comments - Failed to identify comment text: " + comID);
  }

  // Where should we attach this comment? Does it have a parent?
  let par = commentDiv;
  const parID = com.getAttribute("parentid");
  if (parID) {
    // A parent is mentioned. It should already have been dealt with
    const check = comLookup[parID];
    if (check) {
      par = check;
    } else {
      // prettier-ignore
      logX("[x] Reddit Comments - Comment " + comID +
          " could not find parent " + parID);
    }
  }
  par.appendChild(comOuter);
  com.DONE = true;
  com.style.display = "none";
  return true;
}

function useOld() {
  // auto-redirect to old website if on new one
  var loc = window.location.href;
  var newDom = new RegExp("^https:\/\/www\.");
  if (newDom.test(loc)) {
    var old = loc.replace(newDom, "https://old.");
    document.location = old;
  }
}

function highlightX() {
  // Sometimes spans, sometimes divs. Links for index comment count
  // prettier-ignore
  var elems = document.querySelectorAll(`
    div.score.unvoted,
    div.Comment__metadata,
    span.score.unvoted,
    span.score-hidden,
    a.bylink.comments.may-blank
  `);

  // prettier-ignore
  const tally = {};
  logX("Scanning elements for colorization");
  for (let e = 0; e < elems.length; e++) {
    const elem = elems[e];
    const ptInfo = scoreToStyle(elem.innerText);
    applyStyle(ptInfo.style, elem);
    const cEl = elem.parentNode.parentNode;
    coms.push([cEl, ptInfo.value]);
    const tn = elem.tagName;
    if (isNaN(tally[tn])) {
      tally[tn] = 1;
    } else {
      tally[tn]++;
    }
  }
  let tallyTxt = "Score styled for:";
  for (const [name, value] of Object.entries(tally)) {
    tallyTxt += ` ${name}:${value}`;
  }
  logX(tallyTxt);
}

function applyStyle(sty, el) {
  for (const [key, value] of Object.entries(sty)) {
    el.style[key] = value;
  }
}

function scoreToStyle(pts) {
  // Takes a score / vote count and generates style highlighting
  // Also generates placeholder values for non-numerics to aid in sorting
  if (pts == null) pts = "?";
  pts = pts.replace(/ (point|comment)s?.*/, "");
  if (pts == "[score hidden]") {
    return { style: { backgroundColor: "silver" }, value: 10 };
  }
  if (pts == "[removed]" || pts == "[deleted]") {
    return { style: { backgroundColor: "red" }, value: -10 };
  }
  if (/\dk$/.test(pts)) {
    // abbreviated thousands
    return {
      style: { backgroundColor: "purple", color: "yellow" },
      value: 10000
    };
  }
  pts = pts.replace(",", "");
  pts = parseInt(pts);
  const rv = { style: {}, value: pts };
  if (isNaN(pts)) {
    // Failed to find a numeric value
    rv.value = 0;
  } else if (pts >= 1000) {
    rv.style = { backgroundColor: "purple", color: "white" };
  } else if (pts >= 100) {
    rv.style = { backgroundColor: "lime", color: "black" };
  } else if (pts >= 50) {
    rv.style = { backgroundColor: "yellow", color: "black" };
  } else if (pts < -10) {
    rv.style = { backgroundColor: "black", color: "white" };
  } else if (pts <= 5) {
    // not sure why I had this here
    // var par = elem;
  }
  return rv;
}

function filterButtons() {
  if (!comEl) return;
  // sort elements by score
  const clen = coms.length;
  if (clen < 20) return;
  coms.sort(function (a, b) {
    return b[1] - a[1];
  });
  // Style to mask below-threshold comments
  const maskStyle = document.createElement("style");
  const styBits = [];
  for (let si = 2; si <= 10; si++) {
    styBits.push(".ca" + si + " * .cm" + si);
  }
  maskStyle.innerHTML = styBits.join(",") + " { display: none ! important }";
  comEl.parentNode.insertBefore(maskStyle, comEl);
  // Div to hold percentile buttons
  const butDiv = document.createElement("div");
  butDiv.appendChild(noteEl);
  comEl.parentNode.insertBefore(butDiv, comEl);
  // Feedback on number of comments being shown:
  noteEl.innerHTML = "All comments shown";
  noteEl.style.fontStyle = "italic";
  noteEl.style.fontSize = "1em";
  // Make percentile buttons
  let k = 0;
  let dbg = "";
  /* jshint loopfunc: true */
  for (let i = 1; i <= 10; i++) {
    // score threshold for this percentage:
    const thres = coms[Math.ceil((clen * i) / 10) - 1][1];
    const bt = document.createElement("button");
    let setClass = "";
    for (let j = i + 1; j <= 10; j++) {
      setClass += " ca" + j;
    }
    bt.innerHTML = i * 10 + "%";
    bt.threshold = thres;
    bt.thresholdClass = setClass;
    bt.numCom = 0;
    bt.onclick = function () {
      doFilter(this);
    };
    butDiv.append(bt);
    // Set comment element classes
    const ceCls = " cm" + i;
    dbg += "[" + i + " = " + thres + "] ";
    while (k < clen) {
      if (coms[k][1] < thres) {
        dbg += "(" + coms[k][1] + " < " + thres + ") ";
        break;
      }
      coms[k][0].className = coms[k][0].className + ceCls;
      dbg += coms[k][1] + " ";
      k++;
      bt.numCom++;
    }
    // Start initially at 10% filtering
    if (i == 1) doFilter(bt);
  }
  // alert(dbg);
}

function doFilter(x) {
  var tc = x.thresholdClass;
  comEl.className = comAreaClass + tc;
  noteEl.innerHTML =
    "Top " + x.innerHTML + " shown (&ge;" + x.threshold + " points)";
}

function logX(msg) {
  console.log(msg);
}

/* -------------------------------------------------------------------
 * Colorizing post times
 * This is to allow using filters like "last 24 hours" but highlighting
 * and allowing filtering on entries from the last 8 hours.
 * Use case: Read 24-hour news in morning, read again in evening, filter
 * for last 12 hours
 * -------------------------------------------------------------------
 */

let recent, middle, later;
/* Trying to get a gradient that doesn't overlap with score colors
 * and also does not have gray in the middle. I had to add a midpoint
 * color to avoid an ungly center point
 * Colors via https://www.visibone.com/products/ebk1_850.jpg
 */

recent = [255, 153, 153]; // Light Red
recent = [255, 0, 204]; // Magenta
later = [204, 255, 255]; // Light Blue
middle = [255, 0, 204]; // Magenta

recent = [255, 51, 53]; // Light Magenta
middle = [255, 255, 204]; // Pale Yellow
later = [51, 153, 255]; // Darker Blue

function midHex(frac, lo, hi) {
  // Given low and high values (0-255) and a fraction between them,
  // return the two character hex value representing that midpoint
  if (lo < 0) lo = 0;
  if (hi > 255) hi = 255;
  if (frac < 0) {
    frac = 0;
  } else if (frac > 1) {
    frac = 1;
  }
  // Make hexidecimal
  //  https://stackoverflow.com/a/16360660
  const mid = Math.ceil(lo + frac * (hi - lo));
  const hx = mid.toString(16);
  return hx.length == 1 ? "0" + hx : hx;
}

function gradStyle(frac) {
  // Create style string for gradient background color
  // frac = fraction (0-1) along gradient
  // Midpoint is taken at 0.5
  let p1 = recent;
  let p2 = middle;
  if (frac > 0.5) {
    p1 = middle;
    p2 = later;
    frac = (frac - 0.5) * 2;
  } else {
    frac *= 2;
  }

  return (
    "#" +
    midHex(frac, p1[0], p2[0]) +
    midHex(frac, p1[1], p2[1]) +
    midHex(frac, p1[2], p2[2])
  );
}

/* Try to auto-detect the scope of threads being shown
 * That is, look for Reddit's drop-down time filter and parse the current value
 * We will do two things:
 * 1. Determine the current value
 * 2. Add a gradient legend
 * The legend will also be clickable, and will act as a filter
 */

let maxScale = 24;
let maxName = "1 day";
function findScale() {
  // Interface uses "selected" element
  var chk = document.getElementsByClassName("selected");
  var ok =
    /^(past hour|past 24 hours|past week|past month|past year|all time)$/i;
  for (var i = 0; i < chk.length; i++) {
    var it = chk[i].innerText;
    if (it.match(ok)) {
      // Looks like we found what we want
      if (it.match(/past hour/i)) {
        maxScale = 1;
        maxName = "1 hour";
      } else if (it.match(/week/i)) {
        maxScale = 24 * 7;
        maxName = "1 week";
      } else if (it.match(/month/i)) {
        maxScale = 30 * 24;
        maxName = "30 days";
      } else if (it.match(/year/i) || it.match(/all/i)) {
        maxScale = 365 * 24;
        maxName = "1 year";
      }
      // el is going to hold the legend
      var el = document.createElement("span");
      el.innerHTML = "&nbsp;:&nbsp;now&nbsp;";
      // How many segments in the legend?
      var gradBits = 20;
      // Build color scale with non-breaking spaces
      /* jshint loopfunc: true */
      for (let j = 0; j <= gradBits; j++) {
        var gb = document.createElement("span");
        gb.innerHTML = "&nbsp;";
        const frac = j / gradBits;
        gb.style.backgroundColor = gradStyle(j / gradBits);
        // Make each element of legend a clickable interface
        // to the time filter function
        gb.style.cursor = "crosshair";
        gb.onclick = "filterByTime(" + Math.ceil(100 * frac) / 100 + ")";
        gb.onclick = function () {
          filterByTime(frac);
        };
        el.appendChild(gb);
      }
      // Final text indicating extent of gradient range
      var fin = document.createElement("span");
      fin.innerHTML = "&nbsp;" + maxName;
      // Clicking on the max time should remove all time filters
      fin.style.cursor = "crosshair";
      fin.onclick = function () {
        filterByTime(9999999);
      };
      el.appendChild(fin);
      // Append the legend just outside the drop-down interface
      // We will capture the element for use later
      topTarg = chk[i].parentNode.parentNode;
      topTarg.appendChild(el);
      //alert("maxScale: "+maxScale+ " maxName: "+maxName);
      break;
    }
  }
}

/* Find all timestamps and color them with the "recentness" gradient.
 * Also build an array structure of these stamps, which will be used
 * to filter values
 */
var timeFilterList = []; // Will hold filterable elements
var tre = new RegExp("^([0-9]+|a|an) (hour|day|week|minute|year)s?", "i");
function colorRecentness() {
  findScale(); // Determine maximum time to scale against
  var times = document.getElementsByTagName("time");
  for (var i = 0; i < times.length; i++) {
    var el = times[i];
    var it = el.innerText;
    if (it.match(tre)) {
      // Appears to be in the format 'x hours'
      // What fraction of the time scale has elapsed?
      var nt = it.replace(/ .+/, ""); //isolate the number
      // Recognize use of a/an for singular values:
      if (nt.match(/^(a|an)$/i)) nt = "1";
      nt = Number(nt); // numeric value
      // Normalize everything to hours
      if (it.match(/minute/i)) {
        nt /= 60;
      } else if (it.match(/day/i)) {
        nt *= 24;
      } else if (it.match(/week/i)) {
        nt *= 24 * 7;
      } else if (it.match(/month/i)) {
        nt *= 24 * 30;
      } else if (it.match(/year/i)) {
        nt *= 24 * 365;
      }
      // Given the current scale, what fraction along the scale
      // is this entry?
      var frac = nt / maxScale;
      el.style.backgroundColor = gradStyle(frac);
      // Can we find a filterable parent?
      var par = parFromTime(el);
      if (par) timeFilterList.push([par, frac]);
    }
  }
}

function filterByTime(frac) {
  // onclick event requesting to filter visibile elements to a particular
  // scale fraction or more recent
  for (var i = 0; i < timeFilterList.length; i++) {
    var tfl = timeFilterList[i];
    // first array element is the DOM element to be filtered,
    // second value is it's fraction
    if (tfl[1] > frac) {
      // Older than requested fraction - hide
      tfl[0].style.display = "none";
    } else {
      tfl[0].style.display = "inline";
    }
  }
}

function parFromTime(el) {
  // Find the "relevant" parent object from a time element
  var par = el.parentNode;
  if (!par || !par.classList) return null; // Got to root without finding anything
  if (par.classList.contains("entryzzz") || par.classList.contains("thing")) {
    // entry = comment. This caused problem with subreddit lists
    // thing = subredit list entry?
    return par;
  }
  // Recurse upwards
  return parFromTime(par);
}

function torSwap() {
  // Add convienence link to jump between normal and onion sites
  // Do we have a place to put it?
  var tm = topTarg;
  if (!tm) {
    tm = document.getElementsByClassName("top-matter");
    if (tm.length == 0) return;
    tm = tm[0];
  }
  but = document.createElement("a");
  var loc = document.location.href;
  var notTor = "//old.reddit.com";
  var isTor =
    "//old.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion";
  var itRE = new RegExp(isTor);
  if (itRE.test(loc)) {
    // Button will switch to the normal site
    but.href = loc.replace(itRE, notTor);
    but.innerText = "un-Tor";
    but.style.backgroundColor = "tan";
  } else {
    // Button will switch to Onion site
    var ntRE = new RegExp(notTor);
    but.href = loc.replace(ntRE, isTor);
    but.innerText = "Tor";
    but.style.backgroundColor = "cyan";
  }
  // Styling anchor as a buttion:
  //  https://stackoverflow.com/a/2906586
  but.style.color = "black";
  but.style.textDecoration = "none";
  but.style.border = "1px outset buttonborder";
  but.style.padding = "1px 6px";
  but.style.borderRadius = "3px";
  tm.appendChild(but);
}

function basicHyperlinks() {
  // Reddit adds an event that intercepts external events
  // This provides no user value, and can slow down access to the other site
  // StackExchange suggests easiest fix is just to clone the node
  //   https://stackoverflow.com/a/4386514

  const myDomain = window.location.hostname;
  const allLinks = document.getElementsByTagName("a");
  logX("Scanning " + allLinks.length + " hyperlinks to remove click intercept");
  let cleaned = 0;
  let bested = 0;
  for (let i = 0; i < allLinks.length; i++) {
    const lnk = allLinks[i];
    // Ignore any links that are to Reddit itself
    if (lnk.hostname == myDomain) {
      // If the link is to a comments page, set to sort by best by default
      let href = lnk.href;
      if (/\/comments\//.test(href)) {
        href += /\?/.test(href) ? "&" : "?";
        href += "sort=top";
        lnk.href = href;
      }
      continue;
    }
    // Make a copy of the link, insert next to original, remove original
    const cloneLink = lnk.cloneNode(true);
    // Cloning did not seem to sanitize as expected.
    // But removing some Reddit attributes did?
    // The first ATTR is the key one, but clearing the others to tidy up
    cloneLink.removeAttribute("data-outbound-url");
    cloneLink.removeAttribute("data-outbound-expiration");
    cloneLink.removeAttribute("data-href-url");
    lnk.parentNode.insertBefore(cloneLink, lnk);
    lnk.remove();
    cleaned++;
  }
  logX("  Sanitized " + cleaned + " hyperlinks");
}

function setStyles() {
  const style = document.createElement("style");

  style.textContent = `
    #newGallery {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .singleImage {
        maxWidth: 600px ! important;
        maxHeight: 600px ! important;
        width: auto;
        height: auto;
        object-fit: contain;
    }
    .tile {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: #eee;
    }

    .tile img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        margin-bottom: unset ! important;
    }
    .newCom {
       margin-left: 10px;
       border-left: 1px solid gray;
       border-top: 1px solid gray;
    }
    table { margin-bottom: unset ! important; }
    tbody { line-height: unset ! important; }
    td { padding: 3px ! important; }
    
    .rangeNote {
       color: tan;
       font-style: italic;
       font-size: 0.6em;
    }
    .vidDiv {
        maxWidth: 600px ! important;
        maxHeight: 600px ! important;
        width: auto;
        height: auto;
    }
     .vidDiv video {
        max-width: 600px;
        max-height: 600px;
        object-fit: contain;
        display: block;
    }
    .opauthor { background-color: cyan; }
   `;
  document.head.appendChild(style);
  // Tile size will be dynamically controlled with a slider using function below
  const tileSize = document.createElement("style");
  tileSize.id = "tileSize";
  tileSize.textContent = ".tilesz { width: 200px; height: 200px; }";
  document.head.appendChild(tileSize);
}

function resizeTiles(sz) {
  const tileStyles = document.querySelector("#tileSize");
  tileStyles.textContent = `.tilesz { width: ${sz}px; height: ${sz}px; }`;
}
