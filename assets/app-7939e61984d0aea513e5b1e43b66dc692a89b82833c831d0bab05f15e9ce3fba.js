(function() {
  var activate_map, deactivate_map, enable_map_when_clicked;

  $(function() {
    if (screen.width >= 768) {
      return enable_map_when_clicked();
    }
  });

  enable_map_when_clicked = function() {
    return $('.map_container .overlay').click(activate_map);
  };

  activate_map = function() {
    $('.map_container .overlay').hide();
    $('body').one('mousemove', deactivate_map);
    return false;
  };

  deactivate_map = function() {
    return $('.map_container .overlay').show();
  };

}).call(this);
(function() {
  $(function() {
    return $(".full.zoomable img").click(function() {
      return $(this).toggleClass("zoom");
    });
  });

}).call(this);


