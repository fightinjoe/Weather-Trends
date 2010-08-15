var M = Math;

var xs = {
  /*== DOM Manipulation ==*/

  append : function( elt ) {
    this.appendChild( elt );
    return this;
  },

  clone : function() {
    var out = x(this.cloneNode(false)),
    cs = this.children;

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

  show : function() {
    this.style.dispay = '';
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
    self.A.low  = opts.low;
    self.A.high = opts.high;

    self.A.min = _round(opts.low,-1,10);
    self.A.max = _round(opts.high,1,10);

    self.A.levels = (self.A.max - self.A.min)/10*3;

    self.A.cI = (self.A.min+10)*.6; // starting index to ref. colors from

    _drawTemp();
  };

  /*== Helper Methods ==*/

  // Rounds a value up or down to the nearest base
  var _round = function(val, dir, base) {
    val = val/(base || 1.6);
    return (dir>0 ? M.ceil(val) : M.floor(val))*base;
  };

  var _drawTemp = function() {
    // create a wrapper
    var w = x('w'),
        t = x('t');

    // create a temperature group
    var temp = w.clone(); w.append(temp);

    // create a level group
    var l0 = w.clone(),
        t1 = t.clone(),
        t2 = t.clone().attr('transform','translate(5 0) rotate(180 5 4.33)'),
        c  = self.A.levels,
        l,j;

    l0.append(t1).append(t2);

    // draw from the top dow
    for(var i=0;i<c;i++) {
      l = l0.clone();
      temp.append(l);
      l.attr('transform','translate('+(c-i-1)*5+' '+8.66*i+')');
      j = c-i-1+self.A.cI;
      console.log([c,i,j]);
      l.children[1].attr('fill','#'+_GRADIENTS[j].toString());
      l.children[2].attr('fill','#'+_GRADIENTS[j+1].toString());
    }
  };

  (function(){_initialize(opts)}());
}