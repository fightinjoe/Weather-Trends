function get(key) { return localStorage.getItem(key); }
function set(key, value) { localStorage.setItem(key,value); return value; }

function loc(location) {
  var li = $('<li>');
  $('ul').prepend(
    li.append( $('<a href="#">'+svg.tCase(location)+'</a>').click(fn) ).append( $('<span>-</span>').click(rm) )
  );
}

function cz() {
  var ci = [];
   $('li:lt(6) a').each(function(){
     ci.push(this.innerHTML);
   });
   return ci;
}

var svg, f, fn, cs, rm;
$(document).ready(function(){
  setTimeout(function(){
    svg = $('iframe')[0].getSVGDocument().defaultView;
    svg.$ = jQuery;
    svg.PW = window; // parent window
    f = svg.Y.f4;
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

    $('button:first').click(function(){
      var v = $('input').val();
      loc( v );
      $('input').val('');
      set('ws', get('ws')+';'+v);
      f( v );
    });

    $('button:last').click(function(){
      svg.Y.cities(cz());
    });

    svg.glob();
    f( get('w') || cs[0] );
  },500);
});