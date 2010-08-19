var M = Math,
    r = 8.66;

var R,W,G,T,TX,B;

function glob() {
  R = x('r'),
  W = x('w'),
  G = x('g'),
  T = x('t'),
  TX = x('txt');
}

var xs = {
  /*== DOM Manipulation ==*/

  append : function( elt ) {
    this.appendChild( elt );
    return this;
  },

  prepend : function( elt ) {
    this.insertBefore(elt,this.firstChild);
    return this;
  },

  // parent node
  dad : function() {
    return x(this.parentNode);
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
    var isStyle = ['fill-opacity','filter'].indexOf(key) > -1;

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
    t = (this.attr('transform') || '').replace( new RegExp(type+'\\\(.*?\\\)'),'');
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
    return this.attr('fill',color.toString());
  },

  text : function(txt) {
    this.appendChild(document.createTextNode(txt));
    return this;
  },

  empty : function() {
    var cs = this.childNodes;
    while(cs.length>0) {
      this.removeChild(cs[0]);
    }
  },

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
    return '#'+_h(0) + _h(1) + _h(2);
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

C.bw = ['#000','#2A2A2A'];

var _GRADIENTS = C.array([
  '000000',   // black    -10F
  '9363F6',   // purple    10F
  'FFFFFF',   // white - freezing
  '2CE7FC',   // blue      50F
  'FEFB60',   // yellow    70F
  'FF001A',   // red       90F
  '8C0009'    // maroon   110F
], 12);

var Temp = function(opts,label) {
  var self = this;

  self.A = {
    o : 1 // orientation
  };

  var _initialize = function( opts, label ) {
    self.A.opts = opts;
    self.A.low  = _round(opts.low,-1);
    self.A.high = _round(opts.high,1);
    if(opts.mark) { self.A.cur = _round(opts.mark,1); }

    var m = _round(opts.min || opts.low,-1,10);
    var n = _round(opts.max || opts.high,1,10);

    while(n - m < 40) {
      n >= 100 ? m=m-10 : n=n+10;
    }

    self.A.off  = (opts.off || 0)*16;

    self.A.levels = {
      d : (n - m)/10*3,          // delta between min and max, converted to number of triangle groups
      h : (n-self.A.high)/10*6,  // index of the high triangle, counting from the top
      l : (n-self.A.low)/10*6-1  //
    };

    // the index for the current temp
    if(opts.mark) {self.A.levels.c = M.floor((n-self.A.cur)/10*3) }

    self.A.label = label;
    self.A.min = m;
    self.A.max = n;

    self.A.cI = (m)*.6+16; // starting index to ref. colors from

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
    // create a temperature group
    var temp = G.clone(); W.append(temp);
    if( self.A.off ) { temp.move(self.A.off,0); }

    temp._offset = self.A.off;
    //temp._forecast = label + ' - high '+self.A.opts.high+'\u00B0, low '+self.A.opts.low+'\u00B0';
    temp._f4 = 'high '+self.A.opts.high+'\u00B0, low '+self.A.opts.low+'\u00B0';

    // create a level group
    var pair    = G.clone(),
        downTri = T.clone().move(5,0).turn(180,5,r/2),
        upTri   = T.clone(),
        levels  = self.A.levels,
        delta   = levels.d,
        j,g,k,off,level,inside;

    pair.append(downTri).append(upTri);

    // draw from the top dow
    for(var i=0;i<delta;i++) {
      level = pair.clone();
      temp.append(level);

      level._offset=(delta-i-1)*5;
      level.move(level._offset,r*i);

      j = delta-2*i+self.A.cI;
      for(k=0;k<2;k++) {
        inside = (levels.h <= i*2+k && i*2+k <= levels.l);
        level.childNodes[k].bg( inside ? _GRADIENTS[j-k] : C.bw[k] );
        if(!inside) { level.childNodes[k].attr('class','black') }
      }

      // mark the current temperature
      if(self.A.levels.c == i) {
        level.attr('id','cur');
      }

      // draw the temp axis if force
      if(drawTemps && (i%3==2)) {
        g = TX.clone();
        g.text( (self.A.max-(i+1)/3*10) + '\u00B0').move(15,r);
        level.append(g);
      }

      // city label
      if(i==delta-1 && self.A.label) {
        g = TX.clone();
        g.text(self.A.label);
        level.append( g.move(-10,10).turn(-60,0,0).attr({
          'font-size':'10px',
          'font-style':'italic'
        }) );
      }
    }

    var t2 = temp.clone(); W.prepend(t2);
    temp.attr('class','temp');

    // Add labels to the bottom
    tx = TX.clone();
    tx.text(label).attr('text-anchor','end').turn(300,0,0).move(-8,10);
    level.append(tx);
  };

  (function(){_initialize(opts,label)}());
};

var chart = function(temps, label) {
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

    new Temp( o, i==0 ? label : null );
  }

  // after adding all the temps, update the current temp flag
  try{
    var rr = R.clone(),
         p = x(rr.firstChild),
      rect = x(rr.childNodes[1]),
      grad = rect.clone(),
     level = x('cur'),
        wB = W.getBBox(),
     width = wB.width - (M.abs(wB.x) - 16 + level._offset);

     p.attr('transform','scale(0.8)');
     rr.attr('transform','scale(0.8)');

    level.append(
      p.move(-2,1)
    ).prepend(
      rr.move(-2,1)
    );

    rect.attr('width',width);
    rr.append(
      grad.move( width-0.2, 0 ).attr({
        'style':'fill:url(#gr)',
        'width':40
      })
    );
    var t = TX.clone().text('currently '+temps[0].mark+'\u00B0');
    rr.append(
      t.move(width+20,7).attr({
        'font-size':'10',
        'font-style':'italic'
      })
    );

    // Remove all the black foreground triangles
    var ts = document.getElementsByClassName('temp'), cs;
    for(var i=0;i<ts.length;i++) {
      cs = ts[i].getElementsByClassName('black');
      for(var j=0;j<cs.length;j++) {
        x(cs[j]).attr('style','display:none');
      }
    }

    // Add the forecast
    var temp = x(level.parentNode),
          tt = TX.clone().text( temp._f4 );
    rr.append(
      tt.move( rr.getBBox().width-4, 14 ).attr('fill','Gray').attr('text-anchor','end')
    );
  } catch(err) {}

};

var Y = {
  api   : "http://api.wunderground.com/auto/wui/geo/",
  svcF  : "ForecastXML",
  svcC  : "WXCurrentObXML",
  url   : "http://query.yahooapis.com/v1/public/yql?diagnostics=true&format=json&q=",
  query : 'select * from xml where url',
      p : "/index.xml?query=",

//select * from xml where url="http://api.wunderground.com/auto/wui/geo/WXCurrentObXML/index.xml?query=San%20Francisco,%20CA"

  f4 : function(location ) {
    var u1 = Y.api+Y.svcF+Y.p+escape(location),
        u2 = u1.replace(Y.svcF,Y.svcC);
    var url = Y.url + escape(Y.query + ' in("'+ [u1,u2].join('","') +'")');
    Y._query( url, 'svg.Y.f4CB');
  },

  cities : function( locations ) {
    var urls = [];
    for(var i in locations) {
      urls.push( Y.api+Y.svcF+Y.p+escape(locations[i]) )
    }
    var url = Y.url + escape( Y.query + ' in ("'+urls.join('","')+'")');
    Y._query( url, 'svg.Y.citiesCB' );
  },

  f4CB : function( data ) {
    // parse the data set to create an array of temps for the upcoming week
    var res = data.query.results,
        fs  = res.forecast,
        cur = res.current_observation,
        f,h,cs;

    //var text = fs.txt_forecast.forecastday[0].fcttext;
    //var text = cur.observation_location.city;
    var text = tCase(unescape(data.query.diagnostics.url[0].content).split('=')[1]);

    fs = fs.simpleforecast.forecastday;

    var temps = []
    for(var i in fs) {
      f = fs[i];
      temps.push(Y._f4C(f));
    }
    temps[0].mark = parseInt(cur.temp_f);

    // update the name of the city on the page
    W.empty();

    PW.set('w',text);
    // reprint the canvas
    chart(temps, text);
    PW.$('.show').removeClass('show');
  },

  citiesCB : function( data ) {
    var fs = data.query.results.forecast,
     temps = [],
         f, cz;

    for(var i in fs) {
      f = fs[i].simpleforecast.forecastday[0];
      h = Y._f4C(f);
      cz= PW.cz();
      h.label = cz[i];
      temps.push( h );
    }

    // update the name of the city on the page
    $('.wrapper').remove();

    // reprint the canvas
    W.empty();
    chart(temps, 'Multi-city');
    PW.$('.show').removeClass('show');
  },

  _f4C : function( f ) {
    return {
      label: f.date.weekday,
      high : f.high.fahrenheit,
      low  : f.low.fahrenheit
    };
  },

  _query : function(url,cb) {
    console.log(url);
    $.ajax({
      url:url,
      dataType:'jsonp',
      jsonp:'callback',
      jsonpCallback:cb
    })
  }
};

tCase = function(s) {
  var s = s.split(' ');
  for(var i in s) { s[i] = s[i].substr(0,1).toUpperCase() + s[i].substr(1).toLowerCase(); }
  return s.join(' ');
};