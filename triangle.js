var Color = function( opts ) {
  var _s = this;

  this.A = {
    hex     : null,
    triplet : null
  };

  var init = function( opts ) {
    if(opts.hex) {
      _s.A.hex = opts.hex;

      _s.A.triplet = _s.toTriplet();
    }

    if(opts.triplet) {
      _s.A.triplet = opts.triplet;
      _s.A.hex = _s.toString();
    }
  };

  /*== Generation methods ==*/

  this.gradient = function( finalColor, steps ) {
    var from3 = _s.A.triplet,
          to3 = finalColor.A.triplet;

    var diff = [ (to3[0]-from3[0])/steps, (to3[1]-from3[1])/steps, (to3[2]-from3[2])/steps ];

    var out = [_s];

    for(var i=0;i<steps;i++) {
      out.push( new Color({triplet:[ from3[0]+(diff[0]*i), from3[1]+(diff[1]*i), from3[2]+(diff[2]*i) ]}) );
    }

    // if(includeEnds) out.push(to3);

    return out;
  };

  /*== Output converstions ==*/

  // the triplet of decimal values for the color
  this.toTriplet = function() {
    return [
      parseInt( _s.A.hex.substr(0,2), 16 ),
      parseInt( _s.A.hex.substr(2,2), 16 ),
      parseInt( _s.A.hex.substr(4,2), 16 )
    ];
  };

  // the hex string for the color
  this.toString = function() {
    var t = _s.A.triplet, tt;
    function _h(i) { tt = Math.floor(t[i]).toString(16); return (('0'+tt).substr(tt.length-1,2)); }
    return _h(0) + _h(1) + _h(2);
  };

  (function(){init(opts);}());
};

var Temp = function( opts ) {
  var _s = this;
  this.A = {
    count : null,
    min   : null, // minimum range for the scale
    max   : null, // maximum range for the scale
    low   : null,
    high  : null,

    per10 : 6,
    delta : 5/3
  };

  var COLORS = [
    new Color({ hex: '000000' }),   // black    -10F
    new Color({ hex: '9363F6' }),   // purple    10F
    new Color({ hex: 'FFFFFF' }),   // white - freezing
    new Color({ hex: '2CE7FC' }),   // blue      50F
    new Color({ hex: 'FEFB60' }),   // yellow    70F
    new Color({ hex: 'FF001A' }),   // red       90F
    new Color({ hex: '8C0009' })    // maroon   110F
  ];

  var GRADIENT = null;

  this._g = function() { return GRADIENT; };

  var init = function( opts ) {
    _set('low',  opts.low);
    _set('high', opts.high);

    _calculateCountAndMin();
    GRADIENT = _createColorArray();

    _drawHTML();
  };

  /*== Drawing Methods ==*/
  var _drawHTML = function() {
    // draw container
    var p = $('<ul class="temp"/>').appendTo($('body'));

    // draw the triangles in pairs, starting from the bottom
    var c = _get('count'),
        m = _get('min'),
        d = _get('delta'),
        l = _get('low'),
        h = _get('high'),
        t = m;
    for(var i=0;i<_get('count');i=i+2) {
      p.prepend( _drawT(t, l<=t && t<=h, i, 'up') );
      t = t+d;
      p.prepend( _drawT(t, l<=t && t<=h, i+1, 'down') );
      t = t+d;
    }
  };

  var _drawT = function( temp, color, offset, klass ) {
    var out = $('<li class="'+klass+'"/>');
    if(color) { out.css('border-'+ ((offset%2)?'top':'bottom') +'-color', '#'+GRADIENT[offset].toString()); }

    out.css('left',Math.floor(offset/2)*0.5+'em');

    return out;
  }

  /*== Helper Methods ==*/

  // Only create the gradients that are needed for the current range
  var _createColorArray = function() {
    var out = [], 
       step = (_get('per10')*2)-1,
       to, from;

    var start  = _get('min')/10-2,
        length = (_get('max')-_get('min'))/10+start;

    for(var i=start+1;i<length; i++) {
      var gs = COLORS[i-1].gradient( COLORS[i], step );
      out = out.concat( gs );
    }
    out.push( COLORS[ COLORS.length - 1 ] );
    return out;
  };

  var _calculateCountAndMin = function(){
    var min   = Math.floor(_get('low')/10),
        max   = Math.ceil(_get('high')/10),
        count = (max - min) * _get('per10');

    _set('min',min*10);
    _set('max',max*10);
    _set('count',count);
  };

  var _set = function( key, val, cautious ) {
    if(cautious && !val) { return; }
    _s.A[key] = val;
  };

  var _get = function( key ) {
    return _s.A[key];
  };

  (function(){init( opts );}());
}