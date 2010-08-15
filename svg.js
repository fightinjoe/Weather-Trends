var M = Math;

var xs = {
  /*== DOM Manipulation ==*/

  append : function( elt ) {
    this.appendChild( elt );
    return this;
  },

  clone : function() {
    var out = this.cloneNode(false),
    cs = this.childNodes;
    out.id = null;
    out = x(out);

    for(var i=0; i<cs.length; i++) {
      out.append( x(cs[i]).clone() );
    }

    return out;
  },

  /*== Element Manipulation ==*/

  attr : function(key, val) {
    if(typeof key == 'object') {
      for(var k in key) {
        this.attr(k,key[k]);
      }
    } else if(arguments.length == 2) {
      this.setAttributeNS(null,key,val);
    } else {
      return this.getAttributeNS(null,key);
    }
    return this;
  },

  trans : function(type) {
    var ap = Array.prototype;
    t = (this.attr('transform') || '').replace( new RegExp(type+'\([^)]*\)'),'');
    var val = t + ' ' + type + '(' + ap.join.call(ap.slice.call(arguments,1), ' ') + ')';
    this.attr('transform', val);
    return this;
  },

  move : function(x, y) {
    return this.trans('translate', x, y);
  },

  turn : function(deg, x, y) {
    return this.trans('rotate', deg, x, y);
  },

  bg : function(color) {
    return this.attr('fill','#'+color.toString());
  },

  text : function(txt) {
//    var cs = this.childNodes;
//    for(var i=0;i<cs.length;i++) {
//      this.removeChild(cs[i]);
//    }
    this.appendChild(document.createTextNode(txt));
    return this;
  },

  show : function() {
    this.style.display = '';
  },

  hide : function() {
    this.style.display = 'none';
  }
};

var x = function(id) {
  if(typeof id == 'string') {
    return x(document.getElementById(id));
  } else {
    for(var key in xs) {
      id[key] = xs[key];
    }
    return id;
  }
};

// Class for handling color
var C = function( opts ) {
  var self = this;

  this.A = {
    hex : null,
    tpl : null  // A 3-pair of decimal values for the RGB components
  };

  var init = function( opts ) {
    if(opts.hex) {
      self.A.hex = opts.hex;
      self.A.tpl = self.toTriplet();
    }

    if(opts.tpl) {
      self.A.tpl = opts.tpl;
      self.A.hex = self.toString();
    }
  };

  /*== Generation methods ==*/

  this.gradient = function( finalC, steps ) {
    var from3 = self.A.tpl,
          to3 = finalC.A.tpl,
          _h;

    _h = function(i) { return (to3[i]-from3[i])/steps; }
    var diff = [ _h(0), _h(1), _h(2) ];

    var out = [self];

    _h = function(i,j) { return from3[j]+(diff[j]*i); }
    for(var i=0;i<steps;i++) {
      out.push( new C({tpl:[ _h(i,0), _h(i,1), _h(i,2) ]}) );
    }

    return out;
  };

  /*== Output converstions ==*/

  // the tpl of decimal values for the color
  this.toTriplet = function() {
    function _h(i) { return parseInt( self.A.hex.substr(i,2), 16 ); }
    return [ _h(0), _h(2), _h(4) ];
  };

  // the hex string for the color
  this.toString = function() {
    var t = self.A.tpl, tt;
    function _h(i) { tt = M.floor(t[i]).toString(16); return (('0'+tt).substr(tt.length-1,2)); }
    return _h(0) + _h(1) + _h(2);
  };

  (function(){init(opts);}());
};

C.array = function( stops, steps ) {
  var c = new C( {hex:stops[0]} ),
    out = [],
      d;
  for(var i=1;i<stops.length;i++) {
    if(d) { c = d; }
    d = new C({hex:stops[i]});
    out = out.concat( c.gradient( d, steps-1 ) );
  }
  out.push(d);
  return out;
};

var _GRADIENTS = C.array([
  '000000',   // black    -10F
  '9363F6',   // purple    10F
  'FFFFFF',   // white - freezing
  '2CE7FC',   // blue      50F
  'FEFB60',   // yellow    70F
  'FF001A',   // red       90F
  '8C0009'    // maroon   110F
], 12);

var Temp = function(opts) {
  var self = this;

  self.A = {
    o : 1 // orientation
  };

  var _initialize = function( opts ) {
    self.A.low  = _round(opts.low,-1);
    self.A.high = _round(opts.high,1);

    self.A.min = _round(opts.min || opts.low,-1,10);
    self.A.max = _round(opts.max || opts.high,1,10);

    self.A.off  = (opts.off || 0)*16;

    self.A.levels = {
      c : (self.A.max - self.A.min)/10*3,
      h : (self.A.max-self.A.high)/10*6,   // index of the high triangle, counting from the top
      l : (self.A.max-self.A.low)/10*6-1
    }

    self.A.cI = (self.A.min)*.6+16; // starting index to ref. colors from

    _drawTemp( opts.label, opts.axis );
  };

  /*== Helper Methods ==*/

  // Rounds a value up or down to the nearest base
  var _round = function(val, dir, base) {
    base = base || 10/6;
    val = val/base;
    return (dir>0 ? M.ceil(val) : M.floor(val))*base;
  };

  var _drawTemp = function( label, drawTemps ) {
    // create a wrapper
    var w   = x('w'),
        g   = x('g'),
        t   = x('t'),
        txt = x('txt');

    // create a temperature group
    var temp = g.clone(); w.append(temp);
    if( self.A.off ) { temp.move(self.A.off,0); }

    // create a level group
    var l0 = g.clone(),
        t1 = t.clone().move(5,0).turn(180,5,4.33),
        t2 = t.clone(),
        lv = self.A.levels,
        c  = lv.c,
        l,j;

    l0.append(t1).append(t2);

    // draw from the top dow
    for(var i=0;i<c;i++) {
      l = l0.clone();
      temp.append(l);
      l.move((c-i-1)*5,8.66*i);
      j = c-2*i-1+self.A.cI;
      l.childNodes[0].bg( (lv.h <= i*2   && i*2   <= lv.l) ? _GRADIENTS[j+1]   : new C({hex:'000000'}));
      l.childNodes[1].bg( (lv.h <= i*2+1 && i*2+1 <= lv.l) ? _GRADIENTS[j] : new C({hex:'2A2A2A'}));

      // draw the temp axis if force
      if(drawTemps && (i%3==2)) {
        g = txt.clone();
        g.text( (self.A.max-(i+1)/3*10) + '°').move(15,8.66);
        l.append(g);
      }
    }

    // Add labels to the bottom
    t = txt.clone();
    t.text(label).attr('text-anchor','end').turn(300,0,0).move(-8,10);
    l.append(t);
  };

  (function(){_initialize(opts)}());
};

var Chart = function(temps) {
  var _initialize = function(temps) {
    var o,i,
        l = temps[0].low,
        h = temps[0].high;
    for(i=0;i<temps.length;i++) {
      l = M.min(l,temps[i].low);
      h = M.max(h,temps[i].high);
    }

    for(i=0;i<temps.length;i++) {
      o = temps[i];
      o.off = i;
      o.min = l;
      o.max = h;
      if(i==temps.length-1) { o.axis=true; }
      new Temp( o );
    }
  };

  (function(){_initialize(temps)}());
}

var YQL = {
  api   : "http://api.wunderground.com/auto/wui/geo/ForecastXML/index.xml?query=",
  url   : "http://query.yahooapis.com/v1/public/yql?format=json&q=",
  query : 'select * from xml where url',

  forecast : function(location ) {
    var url = YQL.url + escape(YQL.query + '="'+ YQL.api+escape(location) +'"');
    YQL._query( url, 'YQL.forecastCB');
  },

  cities : function( locations ) {
    var urls = [];
    for(var i in locations) {
      urls.push( YQL.api+escape(locations[i]) )
    }
    var url = YQL.url + escape( YQL.query + ' in ("'+urls.join('","')+'")');
    YQL._query( url, 'YQL.citiesCB' );
  },

  forecastCB : function( data ) {
    // parse the data set to create an array of temps for the upcoming week

    var fs = data.query.results.forecast,
        f;

    var text = fs.txt_forecast.forecastday[0].fcttext;

    fs = fs.simpleforecast.forecastday;

    var temps = []
    for(var i in fs) {
      f = fs[i];
      temps.push( YQL._forecastCollector(f));
    }

    // update the name of the city on the page
    $('.wrapper').remove();

    // reprint the canvas
    new Chart(temps, text);
  },

  citiesCB : function( data ) {
    var fs = data.query.results.forecast,
     temps = [],
         f;

    for(var i in fs) {
      f = fs[i].simpleforecast.forecastday[0];
      temps.push( YQL._forecastCollector(f));
    }

    // update the name of the city on the page
    $('.wrapper').remove();

    // reprint the canvas
    new Chart(temps, 'text',{m:-1});
  },

  _forecastCollector : function( f ) {
    return {
      label: f.date.weekday,
      high : f.high.fahrenheit,
      low  : f.low.fahrenheit
    };
  },

  _query : function(url,cb) {
    $.ajax({
      url:url,
      dataType:'jsonp',
      jsonp:'callback',
      jsonpCallback:cb
    })
  }
};