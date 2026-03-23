"use strict";
(() => {
  // ../../../../node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var t;
  var i;
  var o;
  var r;
  var e;
  var f;
  var c;
  var s;
  var a;
  var h;
  var p = {};
  var v = [];
  var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  var d = Array.isArray;
  function w(n2, l3) {
    for (var u4 in l3) n2[u4] = l3[u4];
    return n2;
  }
  function g(n2) {
    n2 && n2.parentNode && n2.parentNode.removeChild(n2);
  }
  function _(l3, u4, t3) {
    var i3, o3, r3, e3 = {};
    for (r3 in u4) "key" == r3 ? i3 = u4[r3] : "ref" == r3 ? o3 = u4[r3] : e3[r3] = u4[r3];
    if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (r3 in l3.defaultProps) void 0 === e3[r3] && (e3[r3] = l3.defaultProps[r3]);
    return m(l3, e3, i3, o3, null);
  }
  function m(n2, t3, i3, o3, r3) {
    var e3 = { type: n2, props: t3, key: i3, ref: o3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == r3 ? ++u : r3, __i: -1, __u: 0 };
    return null == r3 && null != l.vnode && l.vnode(e3), e3;
  }
  function k(n2) {
    return n2.children;
  }
  function x(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function S(n2, l3) {
    if (null == l3) return n2.__ ? S(n2.__, n2.__i + 1) : null;
    for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
    return "function" == typeof n2.type ? S(n2) : null;
  }
  function C(n2) {
    var l3, u4;
    if (null != (n2 = n2.__) && null != n2.__c) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) {
        n2.__e = n2.__c.base = u4.__e;
        break;
      }
      return C(n2);
    }
  }
  function M(n2) {
    (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || o != l.debounceRendering) && ((o = l.debounceRendering) || r)($);
  }
  function $() {
    for (var n2, u4, t3, o3, r3, f4, c3, s3 = 1; i.length; ) i.length > s3 && i.sort(e), n2 = i.shift(), s3 = i.length, n2.__d && (t3 = void 0, o3 = void 0, r3 = (o3 = (u4 = n2).__v).__e, f4 = [], c3 = [], u4.__P && ((t3 = w({}, o3)).__v = o3.__v + 1, l.vnode && l.vnode(t3), O(u4.__P, t3, o3, u4.__n, u4.__P.namespaceURI, 32 & o3.__u ? [r3] : null, f4, null == r3 ? S(o3) : r3, !!(32 & o3.__u), c3), t3.__v = o3.__v, t3.__.__k[t3.__i] = t3, N(f4, t3, c3), o3.__e = o3.__ = null, t3.__e != r3 && C(t3)));
    $.__r = 0;
  }
  function I(n2, l3, u4, t3, i3, o3, r3, e3, f4, c3, s3) {
    var a3, h5, y3, d3, w3, g4, _3, m3 = t3 && t3.__k || v, b2 = l3.length;
    for (f4 = P(u4, l3, m3, f4, b2), a3 = 0; a3 < b2; a3++) null != (y3 = u4.__k[a3]) && (h5 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g4 = O(n2, y3, h5, i3, o3, r3, e3, f4, c3, s3), d3 = y3.__e, y3.ref && h5.ref != y3.ref && (h5.ref && B(h5.ref, null, y3), s3.push(y3.ref, y3.__c || d3, y3)), null == w3 && null != d3 && (w3 = d3), (_3 = !!(4 & y3.__u)) || h5.__k === y3.__k ? f4 = A(y3, f4, n2, _3) : "function" == typeof y3.type && void 0 !== g4 ? f4 = g4 : d3 && (f4 = d3.nextSibling), y3.__u &= -7);
    return u4.__e = w3, f4;
  }
  function P(n2, l3, u4, t3, i3) {
    var o3, r3, e3, f4, c3, s3 = u4.length, a3 = s3, h5 = 0;
    for (n2.__k = new Array(i3), o3 = 0; o3 < i3; o3++) null != (r3 = l3[o3]) && "boolean" != typeof r3 && "function" != typeof r3 ? ("string" == typeof r3 || "number" == typeof r3 || "bigint" == typeof r3 || r3.constructor == String ? r3 = n2.__k[o3] = m(null, r3, null, null, null) : d(r3) ? r3 = n2.__k[o3] = m(k, { children: r3 }, null, null, null) : void 0 === r3.constructor && r3.__b > 0 ? r3 = n2.__k[o3] = m(r3.type, r3.props, r3.key, r3.ref ? r3.ref : null, r3.__v) : n2.__k[o3] = r3, f4 = o3 + h5, r3.__ = n2, r3.__b = n2.__b + 1, e3 = null, -1 != (c3 = r3.__i = L(r3, u4, f4, a3)) && (a3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h5-- : i3 < s3 && h5++), "function" != typeof r3.type && (r3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h5-- : c3 == f4 + 1 ? h5++ : (c3 > f4 ? h5-- : h5++, r3.__u |= 4))) : n2.__k[o3] = null;
    if (a3) for (o3 = 0; o3 < s3; o3++) null != (e3 = u4[o3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = S(e3)), D(e3, e3));
    return t3;
  }
  function A(n2, l3, u4, t3) {
    var i3, o3;
    if ("function" == typeof n2.type) {
      for (i3 = n2.__k, o3 = 0; i3 && o3 < i3.length; o3++) i3[o3] && (i3[o3].__ = n2, l3 = A(i3[o3], l3, u4, t3));
      return l3;
    }
    n2.__e != l3 && (t3 && (l3 && n2.type && !l3.parentNode && (l3 = S(n2)), u4.insertBefore(n2.__e, l3 || null)), l3 = n2.__e);
    do {
      l3 = l3 && l3.nextSibling;
    } while (null != l3 && 8 == l3.nodeType);
    return l3;
  }
  function H(n2, l3) {
    return l3 = l3 || [], null == n2 || "boolean" == typeof n2 || (d(n2) ? n2.some(function(n3) {
      H(n3, l3);
    }) : l3.push(n2)), l3;
  }
  function L(n2, l3, u4, t3) {
    var i3, o3, r3, e3 = n2.key, f4 = n2.type, c3 = l3[u4], s3 = null != c3 && 0 == (2 & c3.__u);
    if (null === c3 && null == e3 || s3 && e3 == c3.key && f4 == c3.type) return u4;
    if (t3 > (s3 ? 1 : 0)) {
      for (i3 = u4 - 1, o3 = u4 + 1; i3 >= 0 || o3 < l3.length; ) if (null != (c3 = l3[r3 = i3 >= 0 ? i3-- : o3++]) && 0 == (2 & c3.__u) && e3 == c3.key && f4 == c3.type) return r3;
    }
    return -1;
  }
  function T(n2, l3, u4) {
    "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || y.test(l3) ? u4 : u4 + "px";
  }
  function j(n2, l3, u4, t3, i3) {
    var o3, r3;
    n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
    else {
      if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || T(n2.style, l3, "");
      if (u4) for (l3 in u4) t3 && u4[l3] == t3[l3] || T(n2.style, l3, u4[l3]);
    }
    else if ("o" == l3[0] && "n" == l3[1]) o3 = l3 != (l3 = l3.replace(f, "$1")), r3 = l3.toLowerCase(), l3 = r3 in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? r3.slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u4, u4 ? t3 ? u4.u = t3.u : (u4.u = c, n2.addEventListener(l3, o3 ? a : s, o3)) : n2.removeEventListener(l3, o3 ? a : s, o3);
    else {
      if ("http://www.w3.org/2000/svg" == i3) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
        n2[l3] = null == u4 ? "" : u4;
        break n;
      } catch (n3) {
      }
      "function" == typeof u4 || (null == u4 || false === u4 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
    }
  }
  function F(n2) {
    return function(u4) {
      if (this.l) {
        var t3 = this.l[u4.type + n2];
        if (null == u4.t) u4.t = c++;
        else if (u4.t < t3.u) return;
        return t3(l.event ? l.event(u4) : u4);
      }
    };
  }
  function O(n2, u4, t3, i3, o3, r3, e3, f4, c3, s3) {
    var a3, h5, p3, v3, y3, _3, m3, b2, S2, C3, M2, $3, P4, A4, H3, L2, T4, j4 = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), r3 = [f4 = u4.__e = t3.__e]), (a3 = l.__b) && a3(u4);
    n: if ("function" == typeof j4) try {
      if (b2 = u4.props, S2 = "prototype" in j4 && j4.prototype.render, C3 = (a3 = j4.contextType) && i3[a3.__c], M2 = a3 ? C3 ? C3.props.value : a3.__ : i3, t3.__c ? m3 = (h5 = u4.__c = t3.__c).__ = h5.__E : (S2 ? u4.__c = h5 = new j4(b2, M2) : (u4.__c = h5 = new x(b2, M2), h5.constructor = j4, h5.render = E), C3 && C3.sub(h5), h5.state || (h5.state = {}), h5.__n = i3, p3 = h5.__d = true, h5.__h = [], h5._sb = []), S2 && null == h5.__s && (h5.__s = h5.state), S2 && null != j4.getDerivedStateFromProps && (h5.__s == h5.state && (h5.__s = w({}, h5.__s)), w(h5.__s, j4.getDerivedStateFromProps(b2, h5.__s))), v3 = h5.props, y3 = h5.state, h5.__v = u4, p3) S2 && null == j4.getDerivedStateFromProps && null != h5.componentWillMount && h5.componentWillMount(), S2 && null != h5.componentDidMount && h5.__h.push(h5.componentDidMount);
      else {
        if (S2 && null == j4.getDerivedStateFromProps && b2 !== v3 && null != h5.componentWillReceiveProps && h5.componentWillReceiveProps(b2, M2), u4.__v == t3.__v || !h5.__e && null != h5.shouldComponentUpdate && false === h5.shouldComponentUpdate(b2, h5.__s, M2)) {
          for (u4.__v != t3.__v && (h5.props = b2, h5.state = h5.__s, h5.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
            n3 && (n3.__ = u4);
          }), $3 = 0; $3 < h5._sb.length; $3++) h5.__h.push(h5._sb[$3]);
          h5._sb = [], h5.__h.length && e3.push(h5);
          break n;
        }
        null != h5.componentWillUpdate && h5.componentWillUpdate(b2, h5.__s, M2), S2 && null != h5.componentDidUpdate && h5.__h.push(function() {
          h5.componentDidUpdate(v3, y3, _3);
        });
      }
      if (h5.context = M2, h5.props = b2, h5.__P = n2, h5.__e = false, P4 = l.__r, A4 = 0, S2) {
        for (h5.state = h5.__s, h5.__d = false, P4 && P4(u4), a3 = h5.render(h5.props, h5.state, h5.context), H3 = 0; H3 < h5._sb.length; H3++) h5.__h.push(h5._sb[H3]);
        h5._sb = [];
      } else do {
        h5.__d = false, P4 && P4(u4), a3 = h5.render(h5.props, h5.state, h5.context), h5.state = h5.__s;
      } while (h5.__d && ++A4 < 25);
      h5.state = h5.__s, null != h5.getChildContext && (i3 = w(w({}, i3), h5.getChildContext())), S2 && !p3 && null != h5.getSnapshotBeforeUpdate && (_3 = h5.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f4 = I(n2, d(L2) ? L2 : [L2], u4, t3, i3, o3, r3, e3, f4, c3, s3), h5.base = u4.__e, u4.__u &= -161, h5.__h.length && e3.push(h5), m3 && (h5.__E = h5.__ = null);
    } catch (n3) {
      if (u4.__v = null, c3 || null != r3) if (n3.then) {
        for (u4.__u |= c3 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
        r3[r3.indexOf(f4)] = null, u4.__e = f4;
      } else {
        for (T4 = r3.length; T4--; ) g(r3[T4]);
        z(u4);
      }
      else u4.__e = t3.__e, u4.__k = t3.__k, n3.then || z(u4);
      l.__e(n3, u4, t3);
    }
    else null == r3 && u4.__v == t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : f4 = u4.__e = q(t3.__e, u4, t3, i3, o3, r3, e3, c3, s3);
    return (a3 = l.diffed) && a3(u4), 128 & u4.__u ? void 0 : f4;
  }
  function z(n2) {
    n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z);
  }
  function N(n2, u4, t3) {
    for (var i3 = 0; i3 < t3.length; i3++) B(t3[i3], t3[++i3], t3[++i3]);
    l.__c && l.__c(u4, n2), n2.some(function(u5) {
      try {
        n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
          n3.call(u5);
        });
      } catch (n3) {
        l.__e(n3, u5.__v);
      }
    });
  }
  function V(n2) {
    return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : d(n2) ? n2.map(V) : w({}, n2);
  }
  function q(u4, t3, i3, o3, r3, e3, f4, c3, s3) {
    var a3, h5, v3, y3, w3, _3, m3, b2 = i3.props || p, k3 = t3.props, x3 = t3.type;
    if ("svg" == x3 ? r3 = "http://www.w3.org/2000/svg" : "math" == x3 ? r3 = "http://www.w3.org/1998/Math/MathML" : r3 || (r3 = "http://www.w3.org/1999/xhtml"), null != e3) {
      for (a3 = 0; a3 < e3.length; a3++) if ((w3 = e3[a3]) && "setAttribute" in w3 == !!x3 && (x3 ? w3.localName == x3 : 3 == w3.nodeType)) {
        u4 = w3, e3[a3] = null;
        break;
      }
    }
    if (null == u4) {
      if (null == x3) return document.createTextNode(k3);
      u4 = document.createElementNS(r3, x3, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
    }
    if (null == x3) b2 === k3 || c3 && u4.data == k3 || (u4.data = k3);
    else {
      if (e3 = e3 && n.call(u4.childNodes), !c3 && null != e3) for (b2 = {}, a3 = 0; a3 < u4.attributes.length; a3++) b2[(w3 = u4.attributes[a3]).name] = w3.value;
      for (a3 in b2) if (w3 = b2[a3], "children" == a3) ;
      else if ("dangerouslySetInnerHTML" == a3) v3 = w3;
      else if (!(a3 in k3)) {
        if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
        j(u4, a3, null, w3, r3);
      }
      for (a3 in k3) w3 = k3[a3], "children" == a3 ? y3 = w3 : "dangerouslySetInnerHTML" == a3 ? h5 = w3 : "value" == a3 ? _3 = w3 : "checked" == a3 ? m3 = w3 : c3 && "function" != typeof w3 || b2[a3] === w3 || j(u4, a3, w3, b2[a3], r3);
      if (h5) c3 || v3 && (h5.__html == v3.__html || h5.__html == u4.innerHTML) || (u4.innerHTML = h5.__html), t3.__k = [];
      else if (v3 && (u4.innerHTML = ""), I("template" == t3.type ? u4.content : u4, d(y3) ? y3 : [y3], t3, i3, o3, "foreignObject" == x3 ? "http://www.w3.org/1999/xhtml" : r3, e3, f4, e3 ? e3[0] : i3.__k && S(i3, 0), c3, s3), null != e3) for (a3 = e3.length; a3--; ) g(e3[a3]);
      c3 || (a3 = "value", "progress" == x3 && null == _3 ? u4.removeAttribute("value") : null != _3 && (_3 !== u4[a3] || "progress" == x3 && !_3 || "option" == x3 && _3 != b2[a3]) && j(u4, a3, _3, b2[a3], r3), a3 = "checked", null != m3 && m3 != u4[a3] && j(u4, a3, m3, b2[a3], r3));
    }
    return u4;
  }
  function B(n2, u4, t3) {
    try {
      if ("function" == typeof n2) {
        var i3 = "function" == typeof n2.__u;
        i3 && n2.__u(), i3 && null == u4 || (n2.__u = n2(u4));
      } else n2.current = u4;
    } catch (n3) {
      l.__e(n3, t3);
    }
  }
  function D(n2, u4, t3) {
    var i3, o3;
    if (l.unmount && l.unmount(n2), (i3 = n2.ref) && (i3.current && i3.current != n2.__e || B(i3, null, u4)), null != (i3 = n2.__c)) {
      if (i3.componentWillUnmount) try {
        i3.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u4);
      }
      i3.base = i3.__P = null;
    }
    if (i3 = n2.__k) for (o3 = 0; o3 < i3.length; o3++) i3[o3] && D(i3[o3], u4, t3 || "function" != typeof n2.type);
    t3 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
  }
  function E(n2, l3, u4) {
    return this.constructor(n2, u4);
  }
  function G(u4, t3, i3) {
    var o3, r3, e3, f4;
    t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), r3 = (o3 = "function" == typeof i3) ? null : i3 && i3.__k || t3.__k, e3 = [], f4 = [], O(t3, u4 = (!o3 && i3 || t3).__k = _(k, null, [u4]), r3 || p, p, t3.namespaceURI, !o3 && i3 ? [i3] : r3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !o3 && i3 ? i3 : r3 ? r3.__e : t3.firstChild, o3, f4), N(e3, u4, f4);
  }
  n = v.slice, l = { __e: function(n2, l3, u4, t3) {
    for (var i3, o3, r3; l3 = l3.__; ) if ((i3 = l3.__c) && !i3.__) try {
      if ((o3 = i3.constructor) && null != o3.getDerivedStateFromError && (i3.setState(o3.getDerivedStateFromError(n2)), r3 = i3.__d), null != i3.componentDidCatch && (i3.componentDidCatch(n2, t3 || {}), r3 = i3.__d), r3) return i3.__E = i3;
    } catch (l4) {
      n2 = l4;
    }
    throw n2;
  } }, u = 0, t = function(n2) {
    return null != n2 && void 0 === n2.constructor;
  }, x.prototype.setState = function(n2, l3) {
    var u4;
    u4 = null != this.__s && this.__s != this.state ? this.__s : this.__s = w({}, this.state), "function" == typeof n2 && (n2 = n2(w({}, u4), this.props)), n2 && w(u4, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), M(this));
  }, x.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
  }, x.prototype.render = k, i = [], r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
    return n2.__v.__b - l3.__v.__b;
  }, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;

  // ../../../../node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var r2;
  var u2;
  var i2;
  var o2 = 0;
  var f2 = [];
  var c2 = l;
  var e2 = c2.__b;
  var a2 = c2.__r;
  var v2 = c2.diffed;
  var l2 = c2.__c;
  var m2 = c2.unmount;
  var s2 = c2.__;
  function p2(n2, t3) {
    c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
    var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
    return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
  }
  function d2(n2) {
    return o2 = 1, h2(D2, n2);
  }
  function h2(n2, u4, i3) {
    var o3 = p2(t2++, 2);
    if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u4) : D2(void 0, u4), function(n3) {
      var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
      t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
    }], o3.__c = r2, !r2.__f)) {
      var f4 = function(n3, t3, r3) {
        if (!o3.__c.__H) return true;
        var u5 = o3.__c.__H.__.filter(function(n4) {
          return !!n4.__c;
        });
        if (u5.every(function(n4) {
          return !n4.__N;
        })) return !c3 || c3.call(this, n3, t3, r3);
        var i4 = o3.__c.props !== n3;
        return u5.forEach(function(n4) {
          if (n4.__N) {
            var t4 = n4.__[0];
            n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
          }
        }), c3 && c3.call(this, n3, t3, r3) || i4;
      };
      r2.__f = true;
      var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
      r2.componentWillUpdate = function(n3, t3, r3) {
        if (this.__e) {
          var u5 = c3;
          c3 = void 0, f4(n3, t3, r3), c3 = u5;
        }
        e3 && e3.call(this, n3, t3, r3);
      }, r2.shouldComponentUpdate = f4;
    }
    return o3.__N || o3.__;
  }
  function y2(n2, u4) {
    var i3 = p2(t2++, 3);
    !c2.__s && C2(i3.__H, u4) && (i3.__ = n2, i3.u = u4, r2.__H.__h.push(i3));
  }
  function A2(n2) {
    return o2 = 5, T2(function() {
      return { current: n2 };
    }, []);
  }
  function T2(n2, r3) {
    var u4 = p2(t2++, 7);
    return C2(u4.__H, r3) && (u4.__ = n2(), u4.__H = r3, u4.__h = n2), u4.__;
  }
  function j2() {
    for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
      n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
    } catch (t3) {
      n2.__H.__h = [], c2.__e(t3, n2.__v);
    }
  }
  c2.__b = function(n2) {
    r2 = null, e2 && e2(n2);
  }, c2.__ = function(n2, t3) {
    n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
  }, c2.__r = function(n2) {
    a2 && a2(n2), t2 = 0;
    var i3 = (r2 = n2.__c).__H;
    i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
      n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
    })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r2;
  }, c2.diffed = function(n2) {
    v2 && v2(n2);
    var t3 = n2.__c;
    t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
      n3.u && (n3.__H = n3.u), n3.u = void 0;
    })), u2 = r2 = null;
  }, c2.__c = function(n2, t3) {
    t3.some(function(n3) {
      try {
        n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
          return !n4.__ || B2(n4);
        });
      } catch (r3) {
        t3.some(function(n4) {
          n4.__h && (n4.__h = []);
        }), t3 = [], c2.__e(r3, n3.__v);
      }
    }), l2 && l2(n2, t3);
  }, c2.unmount = function(n2) {
    m2 && m2(n2);
    var t3, r3 = n2.__c;
    r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
      try {
        z2(n3);
      } catch (n4) {
        t3 = n4;
      }
    }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
  };
  var k2 = "function" == typeof requestAnimationFrame;
  function w2(n2) {
    var t3, r3 = function() {
      clearTimeout(u4), k2 && cancelAnimationFrame(t3), setTimeout(n2);
    }, u4 = setTimeout(r3, 35);
    k2 && (t3 = requestAnimationFrame(r3));
  }
  function z2(n2) {
    var t3 = r2, u4 = n2.__c;
    "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t3;
  }
  function B2(n2) {
    var t3 = r2;
    n2.__c = n2.__(), r2 = t3;
  }
  function C2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
      return t4 !== n2[r3];
    });
  }
  function D2(n2, t3) {
    return "function" == typeof t3 ? t3(n2) : t3;
  }

  // src/core/fetch/product.ts
  var cache = /* @__PURE__ */ new Map();
  async function fetchProductByHandle(handle) {
    const url = `/products/${encodeURIComponent(handle)}.js`;
    if (!cache.has(url)) {
      cache.set(
        url,
        fetch(url).then(async (r3) => {
          if (!r3.ok) throw new Error(`${r3.status} for ${url}`);
          return r3.json();
        })
      );
    }
    return cache.get(url);
  }

  // src/core/utils/debug.ts
  var DEBUG_KEY = "swdebug";
  function isDebugEnabled() {
    if (typeof window === "undefined") return false;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDebug = urlParams.get(DEBUG_KEY);
      if (urlDebug === "1") {
        localStorage.setItem(DEBUG_KEY, "1");
        return true;
      } else if (urlDebug === "0") {
        localStorage.removeItem(DEBUG_KEY);
        return false;
      }
      return localStorage.getItem(DEBUG_KEY) === "1";
    } catch {
      return false;
    }
  }
  var _debugEnabled = null;
  function getDebugEnabled() {
    if (_debugEnabled === null) {
      _debugEnabled = isDebugEnabled();
      if (_debugEnabled) {
        console.log(
          "%c\u{1F527} Shopwizer Debug Mode ON %c Add ?swdebug=0 to disable",
          "background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
          "color: #666; font-size: 11px;"
        );
      }
    }
    return _debugEnabled;
  }
  function createDebugger(name, _enabled = false) {
    const prefix = `\u{1F527} [${name}]`;
    return {
      log: (...args) => {
        if (getDebugEnabled()) console.log(prefix, ...args);
      },
      warn: (...args) => {
        if (getDebugEnabled()) console.warn(prefix, ...args);
      },
      error: (...args) => {
        console.error(prefix, ...args);
      },
      table: (data) => {
        if (getDebugEnabled()) {
          console.log(prefix);
          console.table(data);
        }
      },
      group: (label) => {
        if (getDebugEnabled()) console.group(`${prefix} ${label}`);
      },
      groupEnd: () => {
        if (getDebugEnabled()) console.groupEnd();
      }
    };
  }

  // src/core/analytics/index.ts
  var debug = createDebugger("[ANALYTICS]: ", true);
  function publishClicked({
    productId,
    variantId,
    rail,
    placement,
    srcPid,
    slateId,
    p: p3,
    ps,
    action,
    quantity
  }) {
    try {
      window.Shopify?.analytics?.publish?.("recommendation_clicked", {
        productId,
        variantId,
        rail,
        placement,
        srcPid,
        slate_id: slateId,
        p: p3,
        ps,
        action: action || "click",
        quantity: quantity || 1
      });
    } catch (err) {
      debug.warn("[Shopwizer] Failed to publish clicked event", err);
    }
  }
  function publishViewed({
    rail,
    placement,
    slateId
  }) {
    try {
      window.Shopify?.analytics?.publish?.("recommendation_viewed", {
        rail,
        placement,
        slate_id: slateId
      });
    } catch (err) {
      debug.warn("[Shopwizer] Failed to publish viewed event", err);
    }
  }

  // ../../../../node_modules/preact/compat/dist/compat.module.js
  function g3(n2, t3) {
    for (var e3 in t3) n2[e3] = t3[e3];
    return n2;
  }
  function E2(n2, t3) {
    for (var e3 in n2) if ("__source" !== e3 && !(e3 in t3)) return true;
    for (var r3 in t3) if ("__source" !== r3 && n2[r3] !== t3[r3]) return true;
    return false;
  }
  function N2(n2, t3) {
    this.props = n2, this.context = t3;
  }
  (N2.prototype = new x()).isPureReactComponent = true, N2.prototype.shouldComponentUpdate = function(n2, t3) {
    return E2(this.props, n2) || E2(this.state, t3);
  };
  var T3 = l.__b;
  l.__b = function(n2) {
    n2.type && n2.type.__f && n2.ref && (n2.props.ref = n2.ref, n2.ref = null), T3 && T3(n2);
  };
  var A3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
  var U = l.__e;
  l.__e = function(n2, t3, e3, r3) {
    if (n2.then) {
      for (var u4, o3 = t3; o3 = o3.__; ) if ((u4 = o3.__c) && u4.__c) return null == t3.__e && (t3.__e = e3.__e, t3.__k = e3.__k), u4.__c(n2, t3);
    }
    U(n2, t3, e3, r3);
  };
  var F3 = l.unmount;
  function V2(n2, t3, e3) {
    return n2 && (n2.__c && n2.__c.__H && (n2.__c.__H.__.forEach(function(n3) {
      "function" == typeof n3.__c && n3.__c();
    }), n2.__c.__H = null), null != (n2 = g3({}, n2)).__c && (n2.__c.__P === e3 && (n2.__c.__P = t3), n2.__c.__e = true, n2.__c = null), n2.__k = n2.__k && n2.__k.map(function(n3) {
      return V2(n3, t3, e3);
    })), n2;
  }
  function W(n2, t3, e3) {
    return n2 && e3 && (n2.__v = null, n2.__k = n2.__k && n2.__k.map(function(n3) {
      return W(n3, t3, e3);
    }), n2.__c && n2.__c.__P === t3 && (n2.__e && e3.appendChild(n2.__e), n2.__c.__e = true, n2.__c.__P = e3)), n2;
  }
  function P3() {
    this.__u = 0, this.o = null, this.__b = null;
  }
  function j3(n2) {
    if (!n2.__) return null;
    var t3 = n2.__.__c;
    return t3 && t3.__a && t3.__a(n2);
  }
  function B3() {
    this.i = null, this.l = null;
  }
  l.unmount = function(n2) {
    var t3 = n2.__c;
    t3 && (t3.__z = true), t3 && t3.__R && t3.__R(), t3 && 32 & n2.__u && (n2.type = null), F3 && F3(n2);
  }, (P3.prototype = new x()).__c = function(n2, t3) {
    var e3 = t3.__c, r3 = this;
    null == r3.o && (r3.o = []), r3.o.push(e3);
    var u4 = j3(r3.__v), o3 = false, i3 = function() {
      o3 || r3.__z || (o3 = true, e3.__R = null, u4 ? u4(c3) : c3());
    };
    e3.__R = i3;
    var l3 = e3.__P;
    e3.__P = null;
    var c3 = function() {
      if (!--r3.__u) {
        if (r3.state.__a) {
          var n3 = r3.state.__a;
          r3.__v.__k[0] = W(n3, n3.__c.__P, n3.__c.__O);
        }
        var t4;
        for (r3.setState({ __a: r3.__b = null }); t4 = r3.o.pop(); ) t4.__P = l3, t4.forceUpdate();
      }
    };
    r3.__u++ || 32 & t3.__u || r3.setState({ __a: r3.__b = r3.__v.__k[0] }), n2.then(i3, i3);
  }, P3.prototype.componentWillUnmount = function() {
    this.o = [];
  }, P3.prototype.render = function(n2, e3) {
    if (this.__b) {
      if (this.__v.__k) {
        var r3 = document.createElement("div"), o3 = this.__v.__k[0].__c;
        this.__v.__k[0] = V2(this.__b, r3, o3.__O = o3.__P);
      }
      this.__b = null;
    }
    var i3 = e3.__a && _(k, null, n2.fallback);
    return i3 && (i3.__u &= -33), [_(k, null, e3.__a ? null : n2.children), i3];
  };
  var H2 = function(n2, t3, e3) {
    if (++e3[1] === e3[0] && n2.l.delete(t3), n2.props.revealOrder && ("t" !== n2.props.revealOrder[0] || !n2.l.size)) for (e3 = n2.i; e3; ) {
      for (; e3.length > 3; ) e3.pop()();
      if (e3[1] < e3[0]) break;
      n2.i = e3 = e3[2];
    }
  };
  function Z(n2) {
    return this.getChildContext = function() {
      return n2.context;
    }, n2.children;
  }
  function Y(n2) {
    var e3 = this, r3 = n2.h;
    if (e3.componentWillUnmount = function() {
      G(null, e3.v), e3.v = null, e3.h = null;
    }, e3.h && e3.h !== r3 && e3.componentWillUnmount(), !e3.v) {
      for (var u4 = e3.__v; null !== u4 && !u4.__m && null !== u4.__; ) u4 = u4.__;
      e3.h = r3, e3.v = { nodeType: 1, parentNode: r3, childNodes: [], __k: { __m: u4.__m }, contains: function() {
        return true;
      }, namespaceURI: r3.namespaceURI, insertBefore: function(n3, t3) {
        this.childNodes.push(n3), e3.h.insertBefore(n3, t3);
      }, removeChild: function(n3) {
        this.childNodes.splice(this.childNodes.indexOf(n3) >>> 1, 1), e3.h.removeChild(n3);
      } };
    }
    G(_(Z, { context: e3.context }, n2.__v), e3.v);
  }
  function $2(n2, e3) {
    var r3 = _(Y, { __v: n2, h: e3 });
    return r3.containerInfo = e3, r3;
  }
  (B3.prototype = new x()).__a = function(n2) {
    var t3 = this, e3 = j3(t3.__v), r3 = t3.l.get(n2);
    return r3[0]++, function(u4) {
      var o3 = function() {
        t3.props.revealOrder ? (r3.push(u4), H2(t3, n2, r3)) : u4();
      };
      e3 ? e3(o3) : o3();
    };
  }, B3.prototype.render = function(n2) {
    this.i = null, this.l = /* @__PURE__ */ new Map();
    var t3 = H(n2.children);
    n2.revealOrder && "b" === n2.revealOrder[0] && t3.reverse();
    for (var e3 = t3.length; e3--; ) this.l.set(t3[e3], this.i = [1, 0, this.i]);
    return n2.children;
  }, B3.prototype.componentDidUpdate = B3.prototype.componentDidMount = function() {
    var n2 = this;
    this.l.forEach(function(t3, e3) {
      H2(n2, e3, t3);
    });
  };
  var q3 = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103;
  var G2 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
  var J2 = /^on(Ani|Tra|Tou|BeforeInp|Compo)/;
  var K2 = /[A-Z0-9]/g;
  var Q2 = "undefined" != typeof document;
  var X = function(n2) {
    return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n2);
  };
  x.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(t3) {
    Object.defineProperty(x.prototype, t3, { configurable: true, get: function() {
      return this["UNSAFE_" + t3];
    }, set: function(n2) {
      Object.defineProperty(this, t3, { configurable: true, writable: true, value: n2 });
    } });
  });
  var en = l.event;
  function rn() {
  }
  function un() {
    return this.cancelBubble;
  }
  function on() {
    return this.defaultPrevented;
  }
  l.event = function(n2) {
    return en && (n2 = en(n2)), n2.persist = rn, n2.isPropagationStopped = un, n2.isDefaultPrevented = on, n2.nativeEvent = n2;
  };
  var ln;
  var cn = { enumerable: false, configurable: true, get: function() {
    return this.class;
  } };
  var fn = l.vnode;
  l.vnode = function(n2) {
    "string" == typeof n2.type && (function(n3) {
      var t3 = n3.props, e3 = n3.type, u4 = {}, o3 = -1 === e3.indexOf("-");
      for (var i3 in t3) {
        var l3 = t3[i3];
        if (!("value" === i3 && "defaultValue" in t3 && null == l3 || Q2 && "children" === i3 && "noscript" === e3 || "class" === i3 || "className" === i3)) {
          var c3 = i3.toLowerCase();
          "defaultValue" === i3 && "value" in t3 && null == t3.value ? i3 = "value" : "download" === i3 && true === l3 ? l3 = "" : "translate" === c3 && "no" === l3 ? l3 = false : "o" === c3[0] && "n" === c3[1] ? "ondoubleclick" === c3 ? i3 = "ondblclick" : "onchange" !== c3 || "input" !== e3 && "textarea" !== e3 || X(t3.type) ? "onfocus" === c3 ? i3 = "onfocusin" : "onblur" === c3 ? i3 = "onfocusout" : J2.test(i3) && (i3 = c3) : c3 = i3 = "oninput" : o3 && G2.test(i3) ? i3 = i3.replace(K2, "-$&").toLowerCase() : null === l3 && (l3 = void 0), "oninput" === c3 && u4[i3 = c3] && (i3 = "oninputCapture"), u4[i3] = l3;
        }
      }
      "select" == e3 && u4.multiple && Array.isArray(u4.value) && (u4.value = H(t3.children).forEach(function(n4) {
        n4.props.selected = -1 != u4.value.indexOf(n4.props.value);
      })), "select" == e3 && null != u4.defaultValue && (u4.value = H(t3.children).forEach(function(n4) {
        n4.props.selected = u4.multiple ? -1 != u4.defaultValue.indexOf(n4.props.value) : u4.defaultValue == n4.props.value;
      })), t3.class && !t3.className ? (u4.class = t3.class, Object.defineProperty(u4, "className", cn)) : (t3.className && !t3.class || t3.class && t3.className) && (u4.class = u4.className = t3.className), n3.props = u4;
    })(n2), n2.$$typeof = q3, fn && fn(n2);
  };
  var an = l.__r;
  l.__r = function(n2) {
    an && an(n2), ln = n2.__c;
  };
  var sn = l.diffed;
  l.diffed = function(n2) {
    sn && sn(n2);
    var t3 = n2.props, e3 = n2.__e;
    null != e3 && "textarea" === n2.type && "value" in t3 && t3.value !== e3.value && (e3.value = null == t3.value ? "" : t3.value), ln = null;
  };

  // src/core/utils/formatMoney.ts
  function roundCurrency(value) {
    const fractionalPart = value - Math.floor(value);
    return fractionalPart >= 0.5 ? Math.ceil(value) : Math.floor(value);
  }
  function formatMoney(cents, template) {
    const value = cents / 100;
    const rounded = roundCurrency(value);
    const formats = {
      // 1134.65 -> "1,134.65"
      "{{amount}}": value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      // 1134.65 -> "1,135" (rounded)
      "{{amount_no_decimals}}": rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      // 1134.65 -> "1.134,65"
      "{{amount_with_comma_separator}}": value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      // 1134.65 -> "1.135" (rounded)
      "{{amount_no_decimals_with_comma_separator}}": rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      // 1134.65 -> "1'134.65"
      "{{amount_with_apostrophe_separator}}": value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'"),
      // 1134.65 -> "1 135" (rounded)
      "{{amount_no_decimals_with_space_separator}}": rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "),
      // 1134.65 -> "1 134,65"
      "{{amount_with_space_separator}}": value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " "),
      // 1134.65 -> "1 134.65"
      "{{amount_with_period_and_space_separator}}": value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    };
    let result = template;
    Object.keys(formats).forEach((placeholder) => {
      if (result.includes(placeholder)) {
        result = result.replace(placeholder, formats[placeholder]);
      }
    });
    return result;
  }

  // src/core/theme/themeBridge.ts
  var debug2 = createDebugger("[ThemeBridge]", false);
  var ThemeBridge = class _ThemeBridge {
    constructor() {
      this.isRefreshing = false;
      if (window.__shopwiseThemeBridge) {
        return;
      }
      this.initEventListeners();
      window.__shopwiseThemeBridge = this;
      debug2.log("Initialized (singleton)");
    }
    static {
      this.instance = null;
    }
    static getInstance() {
      if (window.__shopwiseThemeBridge) {
        return window.__shopwiseThemeBridge;
      }
      if (!_ThemeBridge.instance) {
        _ThemeBridge.instance = new _ThemeBridge();
      }
      return _ThemeBridge.instance;
    }
    initEventListeners() {
      window.addEventListener("SW:add", () => this.notifyCartUpdate());
      window.addEventListener("SW:update", () => this.notifyCartUpdate());
      window.addEventListener("SW:change", () => this.notifyCartUpdate());
      window.addEventListener("SW:clear", () => this.notifyCartUpdate());
    }
    async notifyCartUpdate(_options = {}) {
      if (this.isRefreshing) return;
      this.isRefreshing = true;
      try {
        const cart = await fetch("/cart.js", {
          headers: { "X-Shopwise-Ignore": "true" }
        }).then((r3) => r3.json()).catch(() => null);
        this.fireHorizonEvent(cart);
        document.dispatchEvent(new CustomEvent("shopwise:cart:changed", { detail: cart }));
      } catch (err) {
        debug2.warn("Update failed:", err);
      } finally {
        this.isRefreshing = false;
      }
    }
    fireHorizonEvent(cart) {
      const itemCount = cart?.item_count ?? 0;
      document.dispatchEvent(new CustomEvent("cart:update", {
        bubbles: true,
        detail: {
          data: {
            itemCount,
            source: "shopwise"
          }
        }
      }));
    }
    destroy() {
      _ThemeBridge.instance = null;
      delete window.__shopwiseThemeBridge;
    }
  };
  var themeBridge = ThemeBridge.getInstance();

  // ../../../../node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f3 = 0;
  function u3(e3, t3, n2, o3, i3, u4) {
    t3 || (t3 = {});
    var a3, c3, p3 = t3;
    if ("ref" in p3) for (c3 in p3 = {}, t3) "ref" == c3 ? a3 = t3[c3] : p3[c3] = t3[c3];
    var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i3, __self: u4 };
    if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c3 in a3) void 0 === p3[c3] && (p3[c3] = a3[c3]);
    return l.vnode && l.vnode(l3), l3;
  }

  // src/ui/QuickBuyModal.tsx
  function getShopifyImageUrl(src, width) {
    if (!src) return "";
    const hasQuery = src.includes("?");
    const separator = hasQuery ? "&" : "?";
    return `${src}${separator}width=${width}`;
  }
  function QuickBuyModal({
    product,
    moneyFormat = "${{amount}}",
    onClose,
    onAddToCart
  }) {
    const [productData, setProductData] = d2(null);
    const [loading, setLoading] = d2(true);
    const [error, setError] = d2(null);
    const [selectedOptions, setSelectedOptions] = d2({});
    const [quantity, setQuantity] = d2(1);
    const [addingToCart, setAddingToCart] = d2(false);
    const [addSuccess, setAddSuccess] = d2(false);
    const modalRef = A2(null);
    y2(() => {
      if (!product?.handle) return;
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/products/${product.handle}.js`);
          if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);
          const data = await res.json();
          setProductData(data);
          const firstAvailable = data.variants.find((v3) => v3.available) || data.variants[0];
          if (firstAvailable && data.options) {
            const initial = {};
            data.options.forEach((opt, idx) => {
              const optionKey = `option${idx + 1}`;
              initial[opt.name] = firstAvailable[optionKey] || opt.values[0];
            });
            setSelectedOptions(initial);
          }
        } catch (err) {
          setError(err.message || "Failed to load product");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }, [product?.handle]);
    const selectedVariant = productData?.variants.find((v3) => {
      if (!productData.options || productData.options.length === 0) return true;
      return productData.options.every((opt, idx) => {
        const optionKey = `option${idx + 1}`;
        return v3[optionKey] === selectedOptions[opt.name];
      });
    });
    const currentImage = selectedVariant?.featured_image?.src || productData?.images?.[0] || "";
    const handleOptionChange = (optionName, value) => {
      setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
    };
    const handleAddToCart = async () => {
      if (!selectedVariant || !selectedVariant.available) return;
      setAddingToCart(true);
      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedVariant.id,
            quantity
          })
        });
        if (!res.ok) throw new Error("Failed to add to cart");
        const data = await res.json();
        themeBridge.notifyCartUpdate();
        if (onAddToCart) {
          onAddToCart(selectedVariant.id, quantity);
        }
        setAddSuccess(true);
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err) {
        console.error("Add to cart error:", err);
      } finally {
        setAddingToCart(false);
      }
    };
    y2(() => {
      const handleEsc = (e3) => {
        if (e3.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);
    y2(() => {
      const modal = modalRef.current;
      if (!modal) return;
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];
      const handleTab = (e3) => {
        if (e3.key !== "Tab") return;
        if (e3.shiftKey && document.activeElement === firstEl) {
          e3.preventDefault();
          lastEl?.focus();
        } else if (!e3.shiftKey && document.activeElement === lastEl) {
          e3.preventDefault();
          firstEl?.focus();
        }
      };
      window.addEventListener("keydown", handleTab);
      firstEl?.focus();
      return () => window.removeEventListener("keydown", handleTab);
    }, [loading]);
    y2(() => {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }, []);
    const isSingleVariant = productData?.variants.length === 1;
    const isOnSale = selectedVariant?.compare_at_price && selectedVariant.compare_at_price > selectedVariant.price;
    const modalContent = /* @__PURE__ */ u3("div", { className: "sw-modal__backdrop", onClick: onClose, children: /* @__PURE__ */ u3(
      "div",
      {
        ref: modalRef,
        className: "sw-modal__container",
        onClick: (e3) => e3.stopPropagation(),
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "sw-modal-title",
        children: [
          /* @__PURE__ */ u3("button", { className: "sw-modal__close", onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ u3("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ u3("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            /* @__PURE__ */ u3("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
          ] }) }),
          loading ? /* @__PURE__ */ u3("div", { className: "sw-modal__loading", children: /* @__PURE__ */ u3("div", { className: "sw-modal__spinner" }) }) : error ? /* @__PURE__ */ u3("div", { className: "sw-modal__error", children: error }) : productData ? /* @__PURE__ */ u3(k, { children: [
            /* @__PURE__ */ u3("div", { className: "sw-modal__image", children: currentImage && /* @__PURE__ */ u3(
              "img",
              {
                src: getShopifyImageUrl(currentImage, 600),
                alt: productData.title,
                width: 600,
                height: 600
              }
            ) }),
            /* @__PURE__ */ u3("div", { className: "sw-modal__details", children: [
              productData.vendor && /* @__PURE__ */ u3("div", { className: "sw-modal__vendor", children: productData.vendor }),
              /* @__PURE__ */ u3("h2", { id: "sw-modal-title", className: "sw-modal__title", children: productData.title }),
              /* @__PURE__ */ u3("div", { className: "sw-modal__price", children: [
                /* @__PURE__ */ u3("span", { className: "sw-modal__price-current", children: formatMoney(selectedVariant?.price || 0, moneyFormat) }),
                isOnSale && selectedVariant?.compare_at_price && /* @__PURE__ */ u3("span", { className: "sw-modal__price-compare", children: formatMoney(selectedVariant.compare_at_price, moneyFormat) })
              ] }),
              !isSingleVariant && productData.options.map((option) => /* @__PURE__ */ u3("div", { className: "sw-modal__option", children: [
                /* @__PURE__ */ u3("label", { className: "sw-modal__option-label", children: [
                  option.name,
                  ": ",
                  /* @__PURE__ */ u3("strong", { children: selectedOptions[option.name] })
                ] }),
                /* @__PURE__ */ u3("div", { className: "sw-modal__option-values", children: option.values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value;
                  const isAvailable = productData.variants.some((v3) => {
                    const optionIdx = productData.options.findIndex((o3) => o3.name === option.name);
                    const optionKey = `option${optionIdx + 1}`;
                    return v3[optionKey] === value && v3.available;
                  });
                  const isColorOption = option.name.toLowerCase() === "color" || option.name.toLowerCase() === "colour";
                  return /* @__PURE__ */ u3(
                    "button",
                    {
                      className: `sw-modal__option-btn ${isSelected ? "is-selected" : ""} ${!isAvailable ? "is-disabled" : ""} ${isColorOption ? "is-swatch" : ""}`,
                      onClick: () => handleOptionChange(option.name, value),
                      disabled: !isAvailable,
                      title: value,
                      children: isColorOption ? /* @__PURE__ */ u3("span", { className: "sw-modal__swatch", style: { backgroundColor: value.toLowerCase() } }) : value
                    },
                    value
                  );
                }) })
              ] }, option.name)),
              /* @__PURE__ */ u3("div", { className: "sw-modal__availability", children: selectedVariant?.available ? /* @__PURE__ */ u3("span", { className: "sw-modal__in-stock", children: [
                /* @__PURE__ */ u3("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", children: /* @__PURE__ */ u3("path", { d: "M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.78 5.72a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L4.22 8.78a.75.75 0 0 1 1.06-1.06l1.72 1.72 3.72-3.72a.75.75 0 0 1 1.06 0z" }) }),
                "In stock"
              ] }) : /* @__PURE__ */ u3("span", { className: "sw-modal__sold-out", children: "Sold out" }) }),
              /* @__PURE__ */ u3("div", { className: "sw-modal__quantity", children: [
                /* @__PURE__ */ u3(
                  "button",
                  {
                    className: "sw-modal__qty-btn",
                    onClick: () => setQuantity((q4) => Math.max(1, q4 - 1)),
                    "aria-label": "Decrease quantity",
                    children: "\u2212"
                  }
                ),
                /* @__PURE__ */ u3(
                  "input",
                  {
                    type: "number",
                    className: "sw-modal__qty-input",
                    value: quantity,
                    min: 1,
                    onChange: (e3) => setQuantity(Math.max(1, parseInt(e3.target.value) || 1))
                  }
                ),
                /* @__PURE__ */ u3(
                  "button",
                  {
                    className: "sw-modal__qty-btn",
                    onClick: () => setQuantity((q4) => q4 + 1),
                    "aria-label": "Increase quantity",
                    children: "+"
                  }
                )
              ] }),
              /* @__PURE__ */ u3(
                "button",
                {
                  className: `sw-modal__add-btn ${addingToCart ? "is-loading" : ""} ${addSuccess ? "is-success" : ""}`,
                  onClick: handleAddToCart,
                  disabled: !selectedVariant?.available || addingToCart,
                  children: addSuccess ? /* @__PURE__ */ u3(k, { children: [
                    /* @__PURE__ */ u3("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ u3("path", { d: "M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" }) }),
                    "Added!"
                  ] }) : addingToCart ? /* @__PURE__ */ u3("span", { className: "sw-modal__btn-spinner" }) : selectedVariant?.available ? "Add to Cart" : "Sold Out"
                }
              )
            ] })
          ] }) : null
        ]
      }
    ) });
    return $2(modalContent, document.body);
  }

  // src/ui/reviews.tsx
  function Reviews({ product, reviewsApp, yotpoId }) {
    if (!reviewsApp) return null;
    const app = reviewsApp.toLowerCase();
    const productUrl = product.url?.startsWith("http") ? product.url : `${typeof window !== "undefined" ? window.location.origin : ""}${product.url || ""}`;
    return /* @__PURE__ */ u3("div", { class: "sw-card__reviews", children: [
      app === "judge-me" && /* @__PURE__ */ u3("div", { class: "jdgm-badge-placeholder", "data-handle": product.handle }),
      app === "okendo" && /* @__PURE__ */ u3(
        "div",
        {
          "data-oke-star-rating": "true",
          "data-oke-reviews-product-id": `shopify-${product.id}`
        }
      ),
      app === "yotpo" && /* @__PURE__ */ u3(
        "div",
        {
          class: "yotpo-widget-instance",
          "data-yotpo-instance-id": yotpoId || "1254551",
          "data-yotpo-product-id": product.id,
          "data-yotpo-name": product.title,
          "data-yotpo-url": productUrl,
          "data-yotpo-image-url": product.image || product.images?.[0]?.url
        }
      ),
      app === "stamped" && /* @__PURE__ */ u3("span", { class: "stamped-product-reviews-badge", "data-id": product.id }),
      app === "growave" && /* @__PURE__ */ u3(
        "div",
        {
          class: "gw-rv-listing-average-placeholder",
          "data-gw-product-id": product.id,
          style: { display: "block" }
        }
      ),
      app === "loox" && /* @__PURE__ */ u3(
        "div",
        {
          class: "loox-rating",
          "data-id": product.id,
          "data-rating": product.reviews?.avgRating || product.metafields?.reviews?.avg_rating || "",
          "data-raters": product.reviews?.numReviews || product.metafields?.reviews?.num_reviews || ""
        }
      )
    ] });
  }

  // src/pdp-bundles.tsx
  function BundleItem({
    product,
    onClick,
    onQuickBuy,
    showReviews,
    integrations,
    layout,
    skeleton = false
  }) {
    const isLoading = skeleton || !product;
    return /* @__PURE__ */ u3("div", { className: `sw-bundle__item-container sw-bundle__item--${layout}`, children: isLoading ? (
      // Skeleton content
      /* @__PURE__ */ u3("div", { className: "sw-bundle__item", children: [
        /* @__PURE__ */ u3("div", { className: "sw-bundle__item-image-wrap", children: /* @__PURE__ */ u3("div", { className: "sw-bundle__item-image sw-skel-shimmer" }) }),
        /* @__PURE__ */ u3("div", { className: "sw-bundle__item-info", children: [
          /* @__PURE__ */ u3("div", { className: "sw-bundle__item-title-skeleton sw-skel-shimmer" }),
          /* @__PURE__ */ u3("div", { className: "sw-bundle__item-title-skeleton sw-bundle__item-title-skeleton--short sw-skel-shimmer" })
        ] }),
        /* @__PURE__ */ u3("div", { className: "sw-bundle__item-price-wrap", children: /* @__PURE__ */ u3("div", { className: "sw-bundle__item-price-skeleton sw-skel-shimmer" }) })
      ] })
    ) : (
      // Real content
      /* @__PURE__ */ u3(k, { children: [
        /* @__PURE__ */ u3(
          "a",
          {
            href: product.url,
            className: "sw-bundle__item",
            draggable: false,
            onClick: () => onClick?.(),
            children: [
              /* @__PURE__ */ u3("div", { className: "sw-bundle__item-image-wrap", children: [
                /* @__PURE__ */ u3("div", { className: "sw-bundle__item-image", children: product.imageUrl && /* @__PURE__ */ u3(
                  "img",
                  {
                    src: product.imageUrl,
                    alt: product.title,
                    loading: "lazy"
                  }
                ) }),
                layout === "carousel" && /* @__PURE__ */ u3(
                  "button",
                  {
                    className: "sw-bundle__quick-buy",
                    onClick: (e3) => {
                      e3.preventDefault();
                      e3.stopPropagation();
                      onQuickBuy?.(product);
                    },
                    "aria-label": "Quick Buy",
                    children: /* @__PURE__ */ u3("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ u3("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }),
                      /* @__PURE__ */ u3("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
                      /* @__PURE__ */ u3("path", { d: "M16 10a4 4 0 0 1-8 0" })
                    ] })
                  }
                )
              ] }),
              /* @__PURE__ */ u3("div", { className: "sw-bundle__item-info", children: [
                /* @__PURE__ */ u3("div", { className: "sw-bundle__item-title", children: product.title }),
                showReviews && /* @__PURE__ */ u3(
                  Reviews,
                  {
                    product,
                    reviewsApp: integrations?.reviews,
                    yotpoId: integrations?.yotpoId
                  }
                )
              ] }),
              /* @__PURE__ */ u3("div", { className: "sw-bundle__item-price-wrap", children: /* @__PURE__ */ u3("div", { className: "sw-bundle__item-prices", children: [
                /* @__PURE__ */ u3("div", { className: "sw-bundle__item-price", children: product.price }),
                product.compareAtPrice && /* @__PURE__ */ u3("div", { className: "sw-bundle__item-compare-price", children: product.compareAtPrice })
              ] }) })
            ]
          }
        ),
        layout === "stack" && /* @__PURE__ */ u3(
          "button",
          {
            className: "sw-bundle__quick-buy",
            onClick: (e3) => {
              e3.preventDefault();
              e3.stopPropagation();
              onQuickBuy?.(product);
            },
            "aria-label": "Quick Buy",
            children: /* @__PURE__ */ u3("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
              /* @__PURE__ */ u3("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }),
              /* @__PURE__ */ u3("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
              /* @__PURE__ */ u3("path", { d: "M16 10a4 4 0 0 1-8 0" })
            ] })
          }
        )
      ] })
    ) });
  }
  function BundleWidget({ settings }) {
    const [variants, setVariants] = d2([]);
    const [currentIndex, setCurrentIndex] = d2(0);
    const [products, setProducts] = d2([]);
    const [integrations, setIntegrations] = d2({});
    const [loading, setLoading] = d2(true);
    const [error, setError] = d2(null);
    const [quickBuyProduct, setQuickBuyProduct] = d2(null);
    const mountRef = A2(null);
    y2(() => {
      async function fetchBundleData() {
        try {
          const apiUrl = `/apps/sw/recs/${settings.shop}/bundles/${settings.productId}`;
          const integrationsUrl = `/apps/sw/integrations/${settings.shop}`;
          const [variantsRes, integrationsRes] = await Promise.all([
            fetch(apiUrl),
            fetch(integrationsUrl).catch(() => null)
          ]);
          if (!variantsRes.ok) {
            throw new Error(`API error: ${variantsRes.status}`);
          }
          const variantsData = await variantsRes.json();
          let integrationsData = {};
          if (integrationsRes?.ok) {
            const intRes = await integrationsRes.json();
            integrationsData = intRes.integrations || {};
          }
          if (!variantsData.variants || variantsData.variants.length === 0) {
            setVariants([]);
            setLoading(false);
            return;
          }
          setVariants(variantsData.variants);
          setIntegrations(integrationsData);
          const initialIndex = getWeightedRandomIndex(variantsData.variants);
          setCurrentIndex(initialIndex);
        } catch (err) {
          console.error("[Bundle Widget] Error fetching bundle data:", err);
          setError(err.message);
          setLoading(false);
        }
      }
      fetchBundleData();
    }, [settings.shop, settings.productId]);
    y2(() => {
      const activeVariant2 = variants[currentIndex];
      if (!activeVariant2) return;
      async function fetchVariantProducts() {
        setLoading(true);
        try {
          const handles = activeVariant2.results.slice(0, settings.productsToShow).map((r3) => r3.handle);
          console.log("[Bundle] Fetching handles:", handles);
          const productPromises = handles.map(async (handle) => {
            try {
              console.log("[Bundle] Fetching product:", handle);
              const product = await fetchProductByHandle(handle);
              console.log("[Bundle] Got product:", handle, product ? "OK" : "NULL");
              if (!product) return null;
              const imageUrl = product.images?.[0] || product.featured_image || null;
              const priceInCents = product.price || 0;
              const compareAtPriceInCents = product.compare_at_price || 0;
              return {
                id: String(product.id),
                handle: product.handle,
                title: product.title,
                url: product.url || `/products/${product.handle}`,
                price: formatMoney2(priceInCents, settings.moneyFormat),
                compareAtPrice: compareAtPriceInCents > priceInCents ? formatMoney2(compareAtPriceInCents, settings.moneyFormat) : null,
                imageUrl
              };
            } catch (err) {
              console.error("[Bundle] Error fetching product:", handle, err);
              return null;
            }
          });
          const fetchedProducts = (await Promise.all(productPromises)).filter(Boolean);
          const productsWithReviews = fetchedProducts.map((p3) => {
            const variantResult = activeVariant2.results.find((r3) => r3.handle === p3.handle);
            return {
              ...p3,
              reviews: variantResult?.reviews
            };
          });
          console.log("[Bundle] Fetched products count:", fetchedProducts.length);
          setProducts(productsWithReviews);
        } catch (err) {
          console.error("[Bundle Widget] Error fetching products:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchVariantProducts();
    }, [currentIndex, variants, settings.productsToShow, settings.moneyFormat]);
    y2(() => {
      if (!mountRef.current || !products.length) return;
      const activeVariant2 = variants[currentIndex];
      if (!activeVariant2) return;
      publishViewed({
        rail: "bundles",
        placement: "pdp_bundles",
        slateId: activeVariant2.slate_id
      });
    }, [products, currentIndex, variants]);
    const activeVariant = variants[currentIndex];
    const nextVariant = (e3) => {
      e3.preventDefault();
      e3.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % variants.length);
    };
    const prevVariant = (e3) => {
      e3.preventDefault();
      e3.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + variants.length) % variants.length);
    };
    const isInitialLoad = loading && variants.length === 0;
    if (error || variants.length === 0 && !loading) {
      return null;
    }
    const slotCount = settings.productsToShow;
    return /* @__PURE__ */ u3("div", { className: `sw-bundle sw-bundle--${settings.layout}`, ref: mountRef, children: [
      /* @__PURE__ */ u3("div", { className: "sw-bundle__header", children: [
        /* @__PURE__ */ u3("div", { className: "sw-bundle__header-left", children: isInitialLoad ? /* @__PURE__ */ u3("div", { className: "sw-bundle__title-skeleton sw-skel-shimmer" }) : /* @__PURE__ */ u3("h3", { className: "sw-bundle__title", children: settings.headingTitle }) }),
        !isInitialLoad && variants.length > 1 && /* @__PURE__ */ u3("div", { className: "sw-bundle__nav", children: [
          /* @__PURE__ */ u3("button", { className: "sw-bundle__nav-btn", onClick: prevVariant, "aria-label": "Previous Bundle", children: /* @__PURE__ */ u3("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u3("path", { d: "m15 18-6-6 6-6" }) }) }),
          /* @__PURE__ */ u3("span", { className: "sw-bundle__nav-info", children: [
            currentIndex + 1,
            " / ",
            variants.length
          ] }),
          /* @__PURE__ */ u3("button", { className: "sw-bundle__nav-btn", onClick: nextVariant, "aria-label": "Next Bundle", children: /* @__PURE__ */ u3("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u3("path", { d: "m9 18 6-6-6-6" }) }) })
        ] })
      ] }),
      /* @__PURE__ */ u3("div", { className: "sw-bundle__items", children: Array.from({ length: slotCount }).map((_3, index) => {
        const product = isInitialLoad ? void 0 : products[index];
        return /* @__PURE__ */ u3(
          BundleItem,
          {
            product,
            layout: settings.layout,
            skeleton: !product,
            showReviews: settings.showReviews,
            integrations,
            onQuickBuy: product ? (p3) => {
              setQuickBuyProduct(p3);
              if (activeVariant) {
                publishClicked({
                  rail: "bundles",
                  placement: "pdp_bundles",
                  productId: p3.id,
                  srcPid: settings.productId,
                  slateId: activeVariant.slate_id,
                  action: "quick_buy_open"
                });
              }
            } : void 0,
            onClick: product ? () => {
              if (!activeVariant) return;
              publishClicked({
                rail: "bundles",
                placement: "pdp_bundles",
                // @ts-ignore - variant is custom data
                variant: activeVariant.variant,
                productId: product.id,
                srcPid: settings.productId,
                slateId: activeVariant.slate_id,
                p: activeVariant.p,
                ps: activeVariant.ps
              });
            } : void 0
          },
          index
        );
      }) }),
      quickBuyProduct && /* @__PURE__ */ u3(
        QuickBuyModal,
        {
          product: {
            handle: quickBuyProduct.handle,
            id: parseInt(quickBuyProduct.id, 10),
            title: quickBuyProduct.title
          },
          moneyFormat: settings.moneyFormat,
          onClose: () => setQuickBuyProduct(null),
          onAddToCart: (variantId, quantity) => {
            if (activeVariant) {
              publishClicked({
                rail: "bundles",
                placement: "pdp_bundles",
                productId: quickBuyProduct.id,
                variantId,
                quantity,
                action: "quick_buy_add"
              });
            }
          }
        }
      )
    ] });
  }
  function formatMoney2(cents, moneyFormat) {
    const amount = (cents / 100).toFixed(2);
    const amountNoDecimals = Math.round(cents / 100).toString();
    const amountWithComma = amount.replace(".", ",");
    return moneyFormat.replace("{{amount}}", amount).replace("{{amount_no_decimals}}", amountNoDecimals).replace("{{amount_with_comma_separator}}", amountWithComma).replace("{{amount_no_decimals_with_comma_separator}}", amountNoDecimals);
  }
  function getWeightedRandomIndex(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let r3 = Math.random() * totalWeight;
    for (let i3 = 0; i3 < items.length; i3++) {
      if (r3 < items[i3].weight) return i3;
      r3 -= items[i3].weight;
    }
    return 0;
  }
  function mount() {
    document.querySelectorAll('.sw-reco[data-recommender="bundles"]').forEach((el) => {
      const settings = {
        shop: el.dataset.shop || "",
        productId: el.dataset.productId || "",
        productsToShow: parseInt(el.dataset.productsToShow || "3", 10),
        headingTitle: el.dataset.headingTitle || "Complete the Look",
        moneyFormat: el.dataset.moneyFormat || "R {{amount}}",
        showReviews: el.dataset.showReviews === "true",
        layout: el.dataset.desktopLayout || "stack"
      };
      if (!settings.shop || !settings.productId) {
        console.warn("[Bundle Widget] Missing shop or productId");
        return;
      }
      G(/* @__PURE__ */ u3(BundleWidget, { settings }), el);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
