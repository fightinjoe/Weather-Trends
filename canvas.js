var M = Math,
 sq75 = M.sqrt(0.75);

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
    function _h(i) { tt = M.floor(t[i]).toString(16); return (('0'+tt).substr(tt.length-1,2)); }
    return _h(0) + _h(1) + _h(2);
  };

  (function(){init(opts);}());
};

var Temps = function( config ) {
  var _s = this;

  this.A = {
    width : 30,
    x     : null,
    y     : null,

    canvas : null,

    per10 : 6,     // Number of triangles per 10 deg. F
    step  : null,  // Amount of variation between triangles

    minTemp : -10,

    margin : 10,

    m : -1  // slope of the graph
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

  /*== Temperature Drawing Methods ==*/

  // opts: {high, low, max, min}
  this.drawTemp = function(opts) {
    var step = _get('step'),
         min = _s.snap( opts.min, 'min' ),
         max = _s.snap( opts.max, 'max' );

    // determine the number of triangles to draw
    var tCount = _countTriangles(min,max),
        m      = _get('m');

    // calculate the offset
    var xOffset = m==1 ?
      _s.getWidth( min, max, opts.offset ) :
      (_get('width') +_get('margin')) * (opts.offset+.5);

    // draw the triangles, making sure to choose the right color
    var orientation = true,
        pts         = [null, null, {x:xOffset, y:0}],
        temp        = max,
        color;

    for(var i=0;i<tCount;i++) {
      color = (temp <= _s.snap(opts.high,'max') && temp >= opts.low ) ? '#' + _getColorForTemp( temp ) : null;
      pts   = orientation ? _drawDown( pts[2], color, m ) : _drawUp( pts[2], color, m );

      orientation = !orientation;
      temp = temp - step;
    }
  };

  var _getColorForTemp = function( temp ) {
    return GRADIENT[ M.floor((temp - _get('minTemp')) / _get('step')) ];
  };

  /*== Triangle Drawing Methods ==*/

  var _drawDown = function( point, color, m ){
    color = color || '#000000';
    m = m || 1;
    var points = [point];
    points.push( { x: point.x+m*_get('x'),     y: point.y } );
    points.push( { x: point.x+m*(_get('x')/2), y: point.y+_get('y') } );
    points.push( point );

    _drawPoly( points, {fillStyle: color} );

    return points;
  };

  var _drawUp = function( point, color, m ){
    color = color || '#2A2A2A';
    m = m || 1;
    var points = [point];
    points.push( { x: point.x-m*(_get('x')/2), y: point.y-_get('y') } );
    points.push( { x: point.x-m*_get('x'),     y: point.y } );
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
    return _s.getWidth(min,max) * 2 * sq75;
  };

  this.getWidth = function( min, max, offset ) {
    var xOffset = M.floor(_countTriangles(min,max)/2) * (_get('width') / 2);
    if(offset) { xOffset = xOffset + offset * ( _get('width') + _get('margin') ); }
    return xOffset;
  };

  // should pass in only snap values for min and max
  var _countTriangles = function( min, max ) {
    return M.ceil( (max-min)/_get('step') );
  };

  // takes a temperature and normalizes it to a point on the triangle grid
  this.snap = function( val, minORmax ) {
    var s = _get('step');
    return minORmax == 'min' ?
      M.floor(val / s) * s :
      M.ceil(val / s)  * s;
  };

  this.degreeToPixel = function( degs ) {
    return degs * ((_get('width')*sq75/2) * _get('per10') / 10);
  }

  /*== Initialize ==*/

  var init = function( config ) {
    _set('width', config.width, true);

    _set('x', _get('width') * 1);
    _set('y', _get('width') * sq75);

    _set('canvas', $( config.canvas )[0]);

    _set('per10', config.per10, true);
    _set('step',  10/_get('per10'));

    _set('slope', config.slope, true);

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
    _s.A[key] = val;
  };

  var _get = function( key ) {
    return _s.A[key];
  };

  (function(){init(config);}());
};

var Chart = function( temps ) {
  var _s = this;

  this.A = {
    low : null,
    high : null,

    temps : null,

    // html elements
    container: null,
    canvas : null
  }

  // ts : array of temps, represented by a {high,low} object
  var init = function( ts, location ) {
    // set the max and min values
    var l = ts[0].low,
        h = ts[0].high;
    for(var i=0;i<ts.length;i++) {
      l = M.min( ts[i].low, l );
      h = M.max( ts[i].high,h );
    }

    _set({
      'low' : l,
      'high': h,
      'min' : M.floor(l/10)*10,
      'max' : M.ceil(h/10)*10,
      'ts'  : temps
    });

    _drawCanvas(location);
    _drawAxes(ts);
    _drawTemps();
  };

  var _drawCanvas = function(location) {
    // draw container
    var cv = $('<canvas/>'),
        w  = $('<div class="wrapper"><div class="content"><h1>'+location+'</h1></div></div>').appendTo($('body')).append(cv),
        t  = new Temps({canvas:cv, width:35, m:-1});
    _set({
      'wrap'  :w,
      'canvas':cv,
      'temps' :t
    });

    cv.wrap('<div class="cWrapper"/>');

    // scale the canvas
    var l = _get('min'),
        h = _get('max'),
        c = _get('ts').length,
        wi = t.getWidth(l,h) + t.A.width*c + t.A.margin*(c-1),
        hi = t.getHeight(l,h);

    cv[0].width = wi;
    cv[0].height = hi;

    _set({
      'width':wi,
      'height':hi
    });
  };

  var _drawAxes = function(ts) {
    var x   = $('<ul class="x"/>'),
     y      = $('<ul class="y"/>'),
     w      = _get('width'),
     t, b, l;

     canvas = _get('canvas');
     canvas.after(x).after(y);

    _set({x:x,y:y});

    // X Axis
    l = ts.length;
    for(var i=0;i<l;i++) {
      t = $('<li>'+ts[i].label+'</li>').appendTo(x);
      t.css({ right:w-(45*i)-20 });
    }

    // Y Axis

    var min = _get('min'),
        max = _get('max');

    for(var i=min;i<=max;i=i+10) {
      t = $('<li>'+i+'&deg;</li>').appendTo(y);
      b = _get('temps').degreeToPixel((i)-min);
      t.css({
        bottom: b + 'px',
        left:  ((ts.length*45)+20+(b/sq75*0.5)) + 'px'
      })
    }
  };

  var _drawTemps = function(){
    var  t = _get('temps'),
        ts = _get('ts'),
        ma = _get('max'),
        mi = _get('min');
    for(var i=0;i<ts.length;i++) {
      t.drawTemp({max:ma,min:mi,high:ts[i].high,low:ts[i].low, offset:i}); // NYC
    }
  };

  /*== Helper Methods ==*/
  var _set = function( key, val, cautious ) {
    if(cautious && !val) { return; }
    if(typeof key == 'object') {
      for(var k in key) {_s.A[k] = key[k];}
    } else {
      _s.A[key] = val;
      return val;
    }
  };

  var _get = function( key ) {
    return _s.A[key];
  };

  (function(){init(temps);}())
};

var YQL = {
  url : "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22http%3A%2F%2Fapi.wunderground.com%2Fauto%2Fwui%2Fgeo%2FForecastXML%2Findex.xml%3Fquery%3D__L__%22&format=json",

  weather : function(location, forecast ) {
    var url = YQL.url.replace('__L__', escape(encodeURIComponent(location)));
    YQL._query( url, forecast ? 'YQL.weatherCBf' : 'YQL.weatherCBc');
  },

  weatherCBf : function( data ) {
    // parse the data set to create an array of temps for the upcoming week

    var fs   = data.query.results.forecast,
        f;

    var text = fs.txt_forecast.forecastday[0].fcttext;

    fs = fs.simpleforecast.forecastday;

    var temps = []
    for(var i in fs) {
      f = fs[i];
      temps.push({
        label: f.date.weekday,
        high : f.high.fahrenheit,
        low  : f.low.fahrenheit
      });
    }

    // update the name of the city on the page
    $('.wrapper').remove();

    // reprint the canvas
    new Chart(temps, text);
  },

  _query : function(url,cb) {
    console.log(cb);
    $.ajax({
      url:url,
      dataType:'jsonp',
      jsonp:'callback',
      jsonpCallback:cb
    })
  }
}