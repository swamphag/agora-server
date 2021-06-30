// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

// Adapted from https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/#toggling-themes

import jquery from "jquery";
(<any>window).$ = (<any>window).jQuery = jquery;

document.addEventListener("DOMContentLoaded", function () {
  // Hack for settings page
  // try { processSettings({ignore: true}) } catch(e){ console.error(e)}
  // Select button
  const btn = document.querySelector(".theme-toggle");
  var theme = document.querySelector("#theme-link");
  const currentTheme = localStorage.getItem("theme");
  // If the user's preference in localStorage is dark...
  if (currentTheme == "dark") {
    theme.href = "/static/css/screen-dark.css";
  } else if (currentTheme == "light") {
    theme.href = "/static/css/screen-light.css";
  }

  // Listen for a click on the button
  btn.addEventListener("click", function () {
    // Select the stylesheet <link>
    var theme = document.querySelector("#theme-link");
    if (theme.getAttribute("href") == "/static/css/screen-light.css") {
      theme.href = "/static/css/screen-dark.css";
      localStorage.setItem("theme", "dark");
    } else {
      theme.href = "/static/css/screen-light.css";
      localStorage.setItem("theme", "light");
    }
  });

  // clear mini cli on clicking clear button
  $("#mini-cli-clear").click(() => $("#mini-cli").val(""))

  // focus mini-cli on key combo
  $(window).keydown(function (e) {
    if (e.ctrlKey && e.altKey && e.keyCode == 83) {
      $("#mini-cli").focus().val("")
    }
  })

  // pull a node from the default [[stoa]]
  $("#pull-stoa").click(function() {
      let node = this.value;
      $("#stoa-iframe").html('<iframe id="stoa-iframe" name="embed_readwrite" src="https://stoa.anagora.org/p/' + node + '?showControls=true&showChat=true&showLineNumbers=true&useMonospaceFont=false" width="100%" height="500" frameborder="0"></iframe>');
      this.innerText = 'pulled';
  });

  // pull a node from the [[agora]]
  $(".pull-node").click(function() {
      let node = this.value;
      $.get(AGORAURL + '/pull/' + node, function(data) {
          $("#" + node + ".pulled-iframe").html(data);
      });
      // old approach with iframe
      // $("#" + node + ".pulled-iframe").html('<iframe class="pulled-iframe" name="embed_readwrite" src="http://dev.anagora.org/pull/' + node +'" width="100%" height="500" frameborder="0"></iframe>');
      this.innerText = 'pulled';
  });

  // pull a tweet using the laziest way I found, might be a better one
  $(".pull-tweet").click(function(e) {
      let tweet = this.value;
      $(e.currentTarget).after('<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="' + tweet + '"></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>')
      this.innerText = 'pulled';
  });

  // pull a mastodon status (toot) using the roughly correct way IIUC.
  $(".pull-mastodon-status").click(function(e) {
      let toot = this.value;
      let domain, post;
      // extract instance and :id, then use https://docs.joinmastodon.org/methods/statuses/ and get an oembed
      // there are two kinds of statuses we want to be able to embed: /web/ led and @user led.
      const web_regex = /(https:\/\/[a-zA-Z-.]+)\/web\/statuses\/([0-9]+)/ig
      const user_regex = /(https:\/\/[a-zA-Z-.]+)\/@\w+\/([0-9]+)/ig

      console.log("testing type of presumed mastodon embed: " + toot);
      if (m = web_regex.exec(toot)) {
          console.log("found status of type /web/");
          domain = m[1];
          post = m[2];
      }
      if (m = user_regex.exec(toot)) {
          console.log("found status of type /@user/");
          domain = m[1];
          post = m[2];
      }

      req = domain + '/api/v1/statuses/' + post
      console.log('req: ' + req)
      $.get(req, function(data) {
          console.log('status: ' + data['url'])
          let actual_url = data['url']

          let oembed_req = domain + '/api/oembed?url=' + actual_url 
          $.get(oembed_req, function(data) {
              console.log('oembed: ' + data['html'])
              let html = data['html']
              $(e.currentTarget).after(html);
          });
      });
      this.innerText = 'pulled';
  });

  // pull a pleroma status (toot) using the laziest way I found, might be a better one
  $(".pull-pleroma-status").click(function(e) {
      let toot = this.value;
      $(e.currentTarget).after('<br /><iframe src="' + toot + '" class="mastodon-embed" style="max-width: 100%; border: 0" width="400" allowfullscreen="allowfullscreen"></iframe><script src="https://freethinkers.lgbt/embed.js" async="async"></script>')
      this.innerText = 'pulled';
  });

  // pull arbitrary URL
  $(".pull-url").click(function() {
      let url = this.value;
      $("#" + node + ".pulled-iframe").html('<iframe class="pulled-iframe" name="embed_readwrite" src="' + url +'" width="100%" max-height="500" frameborder="0"></iframe>');
      this.innerText = 'pulled';
  });

});


function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sortObjectEntries(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(el => el[0])
}

function loadGraph() {
  const colorNames = ["#1B9E77", "#D95F02", "#7570B3", "#E7298A"]
  const ctx = document.getElementById('myChart');
  const json = $('#proposal-data').text()
  const data = JSON.parse(json)
  // const fillPattern = ctx.createPattern(img, 'repeat');
  const colors = Object.values(data).map(() => colorNames.shift())
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: sortObjectEntries(data),
      datasets: [{
        label: '# of Votes',
        data: Object.values(data).sort(function (a, b) { return b - a }),
        borderWidth: 1,
        backgroundColor: colors
      }]
    },

  });

}



