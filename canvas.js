var Color = function( opts ) {
  var self = this;

  this.ATTRS = {
    hex     : null,
    triplet : null
  };

  var initialize = function( opts ) {
    if(opts.hex) {
      self.ATTRS.hex = opts.hex;

      self.ATTRS.triplet = self.toTriplet();
    }

    if(opts.triplet) {
      self.ATTRS.triplet = opts.triplet;
      self.ATTRS.hex = self.toString();
    }
  };

  /*== Generation methods ==*/

  this.gradient = function( finalColor, steps ) {
    var from3 = self.ATTRS.triplet,
          to3 = finalColor.ATTRS.triplet;

    var diff = [ (to3[0]-from3[0])/steps, (to3[1]-from3[1])/steps, (to3[2]-from3[2])/steps ];

    var out = [self];

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
      parseInt( self.ATTRS.hex.substr(0,2), 16 ),
      parseInt( self.ATTRS.hex.substr(2,2), 16 ),
      parseInt( self.ATTRS.hex.substr(4,2), 16 )
    ];
  };

  // the hex string for the color
  this.toString = function() {
    var t = self.ATTRS.triplet, tt;
    function _h(i) { tt = Math.floor(t[i]).toString(16); return (('0'+tt).substr(tt.length-1,2)) };
    return _h(0) + _h(1) + _h(2);
  };

  (function(){initialize(opts)}());
};

var Temps = function( config ) {
  var self = this;

  this.ATTRS = {
    width : 30,
    x     : null,
    y     : null,

    canvas : null,

    per10 : 6,     // Number of triangles per 10 deg. F
    step  : null,  // Amount of variation between triangles

    minTemp : -10
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

  this._g = function() {return GRADIENT;};

  /*== Temperature Drawing Methods ==*/

  // opts: {high, low, max, min}
  this.drawTemp = function(opts) {
    var step = _get('step');
    opts.max = (Math.floor(opts.max / step) + 1) * step;
    // determine the number of triangles to draw
    var tCount = Math.ceil( (opts.max-opts.min)/step );

    // calculate the offset
    var xOffset = Math.floor(tCount/2) * _get('width');

    // draw the triangles, making sure to choose the right color
    var orientation = true,
        pts         = [null, null, {x:xOffset, y:0}],
        temp        = opts.max,
        color;

    for(var i=0;i<tCount;i++) {
      color = '#' + _getColorForTemp( temp );
      pts   = orientation ? _drawDown( pts[2], color ) : _drawUp( pts[2], color );

      orientation = !orientation;
      temp = temp - step;
    }
  };

  _getColorForTemp = function( temp ) {
    return GRADIENT[ Math.floor((temp - _get('minTemp')) / _get('step')) ];
  }

  /*== Triangle Drawing Methods ==*/

  _drawDown = function( point, color ){
    var points = [point];
    points.push( { x: point.x+_get('x'),     y: point.y } );
    points.push( { x: point.x+(_get('x')/2), y: point.y+_get('y') } );
    points.push( point );

    _drawPoly( points, {fillStyle: color} );

    return points;
  };

  _drawUp = function( point, color ){
    var points = [point];
    points.push( { x: point.x-(_get('x')/2), y: point.y-_get('y') } );
    points.push( { x: point.x-_get('x'),      y: point.y } );
    points.push( point );

    _drawPoly( points, {fillStyle: color} );

    return points;
  };

  _drawPoly = function( points, opts ) {
    var context = _get('canvas').getContext('2d'),
          point = points[0];

    for(var key in opts) {
      context[key] = opts[key];
    }

    //context.fillStyle   = opts.fillStyle;
    //context.strokeStyle = opts.strokeStyle;
    //context.lineWidth   = opts.lineWidth;

    context.beginPath();
    context.moveTo( point.x, point.y );
    for( var i=1; i<points.length; i++ ) {
      point = points[i];
      context.lineTo( point.x, point.y );
    }

    context.fill();
    if(opts.strokeStyle) context.stroke();
    context.closePath();
  }

  /*== Initialize ==*/

  var initialize = function( config ) {
    _set('width', config.width, true);

    _set('x', _get('width') * 1);
    _set('y', _get('width') * Math.sqrt(0.75));

    _set('canvas', document.getElementById( config.canvas ));

    _set('per10', config.per10, true);
    _set('step',  10/_get('per10'));

    var ps = _drawDown( {x:100,y:0}, '#08F' );
    _drawUp( ps[2], '#912' );

    GRADIENT = _createColorArray();
  };

  _createColorArray = function() {
    var out = [], 
       step = (_get('per10')*2)-1,
       to, from;

    for(var i=1;i<COLORS.length; i++) {
      var gs = COLORS[i-1].gradient( COLORS[i], step );
      out = out.concat( gs )
    }
    out.push( COLORS[ COLORS.length - 1 ] );
    return out;
  }

  /*== Helper Methods ==*/

  _set = function( key, val, cautious ) {
    if(cautious) { if(!val) return; }
    self.ATTRS[key] = val;
  };

  _get = function( key ) {
    return self.ATTRS[key];
  };

  (function(){initialize(config)}());
};