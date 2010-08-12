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
    function _h(i) { tt = Math.floor(t[i]).toString(16); return (('0'+tt).substr(tt.length-1,2)); }
    return _h(0) + _h(1) + _h(2);
  };

  (function(){initialize(opts);}());
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

    minTemp : -10,

    margin : 10
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
    var step = _get('step'),
         min = self.snapToGrid( opts.min, 'min' ),
         max = self.snapToGrid( opts.max, 'max' );
    // determine the number of triangles to draw
    var tCount = _countTriangles(min,max);

    // calculate the offset
    var xOffset = self.getWidth( min, max, opts.offset );

    // draw the triangles, making sure to choose the right color
    var orientation = true,
        pts         = [null, null, {x:xOffset, y:0}],
        temp        = max,
        color;

    for(var i=0;i<tCount;i++) {
      color = (temp <= opts.high && temp >= opts.low ) ? '#' + _getColorForTemp( temp ) : null;
      pts   = orientation ? _drawDown( pts[2], color ) : _drawUp( pts[2], color );

      orientation = !orientation;
      temp = temp - step;
    }
  };

  var _getColorForTemp = function( temp ) {
    return GRADIENT[ Math.floor((temp - _get('minTemp')) / _get('step')) ];
  };

  /*== Triangle Drawing Methods ==*/

  var _drawDown = function( point, color ){
    color = color || '#000000';
    var points = [point];
    points.push( { x: point.x+_get('x'),     y: point.y } );
    points.push( { x: point.x+(_get('x')/2), y: point.y+_get('y') } );
    points.push( point );

    _drawPoly( points, {fillStyle: color} );

    return points;
  };

  var _drawUp = function( point, color ){
    color = color || '#202020';
    var points = [point];
    points.push( { x: point.x-(_get('x')/2), y: point.y-_get('y') } );
    points.push( { x: point.x-_get('x'),      y: point.y } );
    points.push( point );

    _drawPoly( points, {fillStyle: color} );

    return points;
  };

  var _drawPoly = function( points, opts ) {
    var context = _get('canvas').getContext('2d'),
          point = points[0];

    for(var key in opts) { context[key] = opts[key]; }

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
    if(opts.strokeStyle) {context.stroke();}
    context.closePath();
  };

  /*== External Methods ==*/

  this.getHeight = function( min, max ) {
    return self.getWidth(min,max) * 2 * Math.sqrt(0.75);
  };

  this.getWidth = function( min, max, offset ) {
    var xOffset = Math.floor(_countTriangles(min,max)/2) * (_get('width') / 2);
    if(offset) { xOffset = xOffset + offset * ( _get('width') + _get('margin') ); }
    return xOffset;
  };

  // should pass in only snapToGrid values for min and max
  var _countTriangles = function( min, max ) {
    return Math.ceil( (max-min)/_get('step') );
  };

  // takes a temperature and normalizes it to a point on the triangle grid
  this.snapToGrid = function( val, minORmax ) {
    var s = _get('step');
    return minORmax == 'min' ?
      Math.floor(val / s) * s :
      Math.ceil(val / s)  * s;
  };

  this.degreeToPixel = function( degs ) {
    return degs * ((_get('width')*Math.sqrt(0.75)/2) * _get('per10') / 10);
  }

  /*== Initialize ==*/

  var initialize = function( config ) {
    _set('width', config.width, true);

    _set('x', _get('width') * 1);
    _set('y', _get('width') * Math.sqrt(0.75));

    _set('canvas', $( config.canvas )[0]);

    _set('per10', config.per10, true);
    _set('step',  10/_get('per10'));

    GRADIENT = _createColorArray();
  };

  var _createColorArray = function() {
    var out = [], 
       step = (_get('per10')*2)-1,
       to, from;

    for(var i=1;i<COLORS.length; i++) {
      var gs = COLORS[i-1].gradient( COLORS[i], step );
      out = out.concat( gs );
    }
    out.push( COLORS[ COLORS.length - 1 ] );
    return out;
  };

  /*== Helper Methods ==*/

  var _set = function( key, val, cautious ) {
    if(cautious && !val) { return; }
    self.ATTRS[key] = val;
  };

  var _get = function( key ) {
    return self.ATTRS[key];
  };

  (function(){initialize(config);}());
};

var Chart = function( temps ) {
  var self = this;

  this.ATTRS = {
    max : null,
    min : null,

    temps : null,

    // html elements
    container: null,
    canvas : null
  }

  var initialize = function( temps ) {
    // set the max and min values
    _set('max', temps[0].high);
    _set('min', temps[0].low);
    for(var i=0;i<temps.length;i++) {
      _set('max', Math.max( temps[i].high, _get('max') ) );
      _set('min', Math.min( temps[i].low,  _get('min') ) );
    }

    _set('tempArray', temps);

    _drawCanvas();

    _drawTempAxis();

    _drawTemps();
  };

  var _drawCanvas = function() {
    // draw container
    _set('container', $('<div class="tempContainer"/>'));
    $('body').append( _get('container') );

    // draw canvas
    var cv = $('<canvas>Canvas support is required to view this app</canvas>');
    _set('canvas', cv);
    _get('container').append( _get('canvas') );

    // create Temps instance
    var t = new Temps({canvas:cv, width:35});
    _set('temps', t);

    // scale the canvas
    var l = _set('min', t.snapToGrid( _get('min'), 'min')),
        h = _set('max', t.snapToGrid( _get('max'), 'max')),
        c = _get('tempArray').length,
        wi = t.getWidth(l,h) + t.ATTRS.width*c + t.ATTRS.margin*(c-1),
        hi = t.getHeight(l,h);

    cv[0].width = wi;
    cv[0].height = hi;

    _set('width',wi);
    _set('height',hi);
  };

  var _drawTempAxis = function() {
    var ta = $('<ul class="temps"/>').appendTo(_get('container')),
    canvas = _get('canvas');
    _set('tempAxis',ta);

    var min = Math.ceil(_get('min')/10)*10,
        max = Math.floor(_get('max')/10*10);

    for(var i=min;i<=max;i=i+10) {
      var t = $('<li>'+i+'&deg;</li>').appendTo(ta),
          b = _get('temps').degreeToPixel((i)-_get('min'));
      t.css({
        position: 'absolute',
        bottom:    b + 'px',
        textAlign:'right',
        right: (_get('width') - (b/Math.sqrt(0.75)*0.5)) + 'px'
      })
    }
  };

  var _drawTemps = function(){
    var  t = _get('temps'),
        ts = _get('tempArray'),
        ma = _get('max'),
        mi = _get('min');
    for(var i=0;i<ts.length;i++) {
      t.drawTemp({max:ma,min:mi,high:ts[i].high,low:ts[i].low, offset:i}); // NYC
    }
  };

  /*== Helper Methods ==*/
  var _set = function( key, val, cautious ) {
    if(cautious && !val) { return; }
    self.ATTRS[key] = val;
    return val;
  };

  var _get = function( key ) {
    return self.ATTRS[key];
  };

  (function(){initialize(temps);}())
};