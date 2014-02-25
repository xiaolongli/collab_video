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
    events: {
      'onStateChange': onPlayerStateChange,
    }
  });
}

function send_event(event, playtime) {
  var params = new FormData();
  params.append("event", event);
  params.append("timestamp", new Date().getTime());
  params.append("playtime", playtime);

  var ajax = new XMLHttpRequest();
  ajax.open("POST", "./master", true);
  ajax.send(params);

  console.log("event sent: " + event + " at " + playtime)
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
  switch(event.data) {
  case YT.PlayerState.PLAYING:
    send_event("play", player.getCurrentTime());
    break;
  case YT.PlayerState.PAUSED:
    send_event("pause", player.getCurrentTime());
    break;
  }
}

window.onload = function() {
  function keep_alive() {
    if (player !== null) {
      if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        send_event("keep_alive", player.getCurrentTime());
      }
    }
  }
  setInterval(keep_alive, 5000);

  // Set up special effects
  $("p.trigger").click(function(){
    $(this).toggleClass("active").next().slideToggle("normal");
    document.getElementById("trigger-icon").classList.toggle("fa-plus-square-o");
    document.getElementById("trigger-icon").classList.toggle("fa-minus-square-o");
  });
};