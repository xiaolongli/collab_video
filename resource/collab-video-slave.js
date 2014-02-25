"use strict";

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    events: {},
  });
}

window.onload = function() {
  var id = document.getElementById("id").innerText;
  var last_timestamp = 0;
  var tolerance = 2;
  var pause_seek_timeout = null;
  var synced = true;

  function send_ajax() {
    var params = new FormData();
    params.append("id", id);
    params.append("last_timestamp", last_timestamp);
    var ajax = new XMLHttpRequest();
    ajax.onload = long_polling;
    ajax.open("POST", "./slave", true);
    ajax.send(params);
  }

  function pause_seek(playtime) {
    player.pauseVideo();
    player.seekTo(playtime, true);
    player.pauseVideo();
  }

  function curry_pause_seek(playtime) {
    return function() {
      pause_seek(playtime);
    }
  }

  function long_polling() {
    if (!synced) {
      return;
    }
    if (player.pauseVideo !== undefined) {
      var data = JSON.parse(this.responseText);
      console.log("received event: " + this.responseText);
      if (data.has_update === true) {
        var evt = data.event;
        var playtime = data.playtime;
        var timestamp = data.timestamp;
        if (!(evt && playtime && timestamp)) {
          console.log("bad JSON event update");
        } else {
          last_timestamp = timestamp;
          switch(evt) {
          case "pause":
            if (player.getPlayerState() != YT.PlayerState.PLAYING
                || player.getCurrentTime > playtime) {
              pause_seek(playtime);
            } else {
              console.log("smooth play ");
              pause_seek_timeout = setTimeout(curry_pause_seek(playtime),
                  parseInt((playtime - player.getCurrentTime()) * 1000));
            }
            break;
          case "play":
          case "keep_alive":
            if (pause_seek_timeout != null) {
              clearTimeout(pause_seek_timeout);
              pause_seek_timeout = null;
            }
            if (player.getPlayerState() != YT.PlayerState.PLAYING
                || Math.abs(player.getCurrentTime() - playtime) > tolerance) {
              player.seekTo(playtime, true);
            }
            player.playVideo();
            break;
          default:
            console.log("unknow event: " + evt);
          }
        }
      }
    }
    // Create and fire then next ajax request.
    setTimeout(send_ajax, 1000);
  }

  send_ajax();

  // Set up special effects
  $("p.trigger").click(function(){
    $(this).toggleClass("active").next().slideToggle("normal");
    document.getElementById("trigger-icon").classList.toggle("fa-plus-square-o");
    document.getElementById("trigger-icon").classList.toggle("fa-minus-square-o");
  });

  document.getElementById("btn-sync").onclick = function() {
    if (this.classList.contains("button")) {
      this.classList.remove("button");
      this.classList.add("button-inverse");
      document.getElementById("sync-description").innerText = "The video is detached now."
      this.innerText = "Sync";
      synced = false;
    } else {
      this.classList.remove("button-inverse");
      this.classList.add("button");
      document.getElementById("sync-description").innerText = "The video is synced now."
      this.innerText = "Detach";
      synced = true;
      send_ajax();
    }
  }
};