(function() {

  var CUSTOM_PROP = ['width', 'box-shadow', 'background-color', 'color',
      'border-radius', 'padding', 'border'];

  function pointInRect(rect, x, y) {
    return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  }

  /*
    Return the rectangle in rectList that contains the point (x, y).
    Reture the first rectangle in the list if none contains (x, y).
  */
  function getTargetRect(rectList, x, y) {
    for (var i = 0; i < rectList.length; i++) {
      if (pointInRect(rectList[i], x, y)) {
        return rectList[i];
      }
    }
    return rectList[0];
  }

  $('document').ready(function() {
    $('.tooltip-lite').each(function() {
      $this = $(this);

      // check weather the tooltip has target
      if (!$this.data('target')) {
        console.error("tooltip-dataw: lite-target not found for tooltip " + this);
        return false;
      }

      // check weather the target exists in the DOM
      var targetId = $this.data('target');
      var targets = $('#' + targetId);
      if (!targets.length) {
        console.error("tooltip-lite: tooltip target not found in DOM: " + targetId);
        return false;
      }

      // Set the customizable properties, like width etc.
      // Notice that width doesn't have a default value like others,
      // which mean if width is not customly set, it will be empty,
      // resulting in a tooltip as long as the browser see fit.
      for (var i = 0; i < CUSTOM_PROP.length; i++) {
        if ($this.data(CUSTOM_PROP[i])) {
          $this.css(CUSTOM_PROP[i], $this.data(CUSTOM_PROP[i]));
        }
      }

      // get place: north, south, etc.
      var place = $this.data('place');

      // attach the tooltip to all targets
      for (var i = 0; i < targets.length; i++) {
        var target = $(targets[i]);
        var clone = $this.clone();

        // set mouseover event to reveal tooltip
        target.on('mouseenter', {tooltip: clone}, function(e) {
          console.log('mouseenter');
          $this = $(this);
          var tooltip = e.data.tooltip;

          // find out position parameters of the target and its offsetParent
          var targetRect = getTargetRect(this.getClientRects(), e.clientX, e.clientY);
          var boundingRect = this.getBoundingClientRect();
          var targetOffsetLeft = $this.position().left + (targetRect.left - boundingRect.left);
          var targetOffsetTop = $this.position().top + (targetRect.top - boundingRect.top);
          var offsetParent = $this.offsetParent();
          if (offsetParent.prop("tagName").toUpperCase() == "HTML") {
            offsetParent = $('body');
          }

          // append the tooltip to the target's offsetParent if not already
          if (tooltip.parent().get(0) !== offsetParent.get(0)) {
            tooltip.appendTo(offsetParent);
          }
          
          // position the tooltip based on the orientation data attribute
          // default to north
          var orientation = tooltip.data("orientation");
          if (!orientation) {
            orientation = "north";
          }
          switch(orientation) {
          case "east":
            tooltip.css("left", targetOffsetLeft + targetRect.width + 'px');
            tooltip.css("top", targetOffsetTop + 'px');
            break;
          case "south":
            tooltip.css("left", targetOffsetLeft + 'px');
            tooltip.css("top", targetOffsetTop + targetRect.height + 'px');
            break;
          case "west":
            tooltip.css("right", offsetParent.width() - targetOffsetLeft + 'px');
            tooltip.css("top", targetOffsetTop + 'px');
            break;
          case "north":
          default:
            tooltip.css("left", targetOffsetLeft + 'px');
            tooltip.css("bottom", offsetParent.height() - targetOffsetTop + 'px');
          }
          
          // fade in
          tooltip.stop(true);
          tooltip.hide();
          tooltip.fadeIn(300, "swing", false);
        });

        // set mouseout event to hide tooltip
        target.on('mouseleave', {tooltip: clone}, function(e) {
          console.log('mouseleave');
          $this = $(this);
          var tooltip = e.data.tooltip;

          // fade out
          tooltip.stop(true);
          tooltip.fadeOut(300, "swing", false);
        });
      }
    });
  });

})();