"use strict";

window.onload = function() {
  document.getElementById("btn-create").onclick = function() {
    window.location = "/master?vid=" + document.getElementById("input-vid").value;
  }
}