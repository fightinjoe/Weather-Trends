function get(key) { return localStorage.getItem(key); }
function set(key, value) { localStorage.setItem(key,value); return value; }

function loc(location) {
  var li = $('<li>');
  $('ul').prepend(
    li.append( $('<a href="#">'+svg.tCase(location)+'</a>').click(fn) ).append( $('<span>-</span>').click(rm) )
  );
}

var svg, f, fn, cs, rm;
$(document).ready(function(){
  setTimeout(function(){
    svg = $('iframe')[0].getSVGDocument().defaultView;
    svg.$ = jQuery;
    svg.PW = window; // parent window
    f = svg.YQL.forecast;
    fn = function(){ f(this.innerHTML);return false; };

    rm = function() {
      var v = $(this).prev().html();
      $(this).parent().remove();
      cs = cs.join(';').replace(new RegExp('(^|;)'+v+'(;|$)'),'').split(';');
      set('ws',cs.join(';'));
    };

    cs = (get('ws') || set('ws','Los Angeles, CA;New York, NY;Chicago, IL')).split(';');
    for(var i=0;i<cs.length;i++) {
      loc(cs[i]);
    };

    $('p').click(function(){ $('#wrap').toggleClass('show'); });

    $('button').click(function(){
      var v = $('input').val();
      loc( v );
      set('ws', get('ws')+';'+v);
      f( v );
    });

    svg.glob();
    f( get('w') || cs[0] );
  },500);
});