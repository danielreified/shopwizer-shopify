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
    var a3, h4, y3, d3, w3, g4, _3, m3 = t3 && t3.__k || v, b2 = l3.length;
    for (f4 = P(u4, l3, m3, f4, b2), a3 = 0; a3 < b2; a3++) null != (y3 = u4.__k[a3]) && (h4 = -1 == y3.__i ? p : m3[y3.__i] || p, y3.__i = a3, g4 = O(n2, y3, h4, i3, o3, r3, e3, f4, c3, s3), d3 = y3.__e, y3.ref && h4.ref != y3.ref && (h4.ref && B(h4.ref, null, y3), s3.push(y3.ref, y3.__c || d3, y3)), null == w3 && null != d3 && (w3 = d3), (_3 = !!(4 & y3.__u)) || h4.__k === y3.__k ? f4 = A(y3, f4, n2, _3) : "function" == typeof y3.type && void 0 !== g4 ? f4 = g4 : d3 && (f4 = d3.nextSibling), y3.__u &= -7);
    return u4.__e = w3, f4;
  }
  function P(n2, l3, u4, t3, i3) {
    var o3, r3, e3, f4, c3, s3 = u4.length, a3 = s3, h4 = 0;
    for (n2.__k = new Array(i3), o3 = 0; o3 < i3; o3++) null != (r3 = l3[o3]) && "boolean" != typeof r3 && "function" != typeof r3 ? ("string" == typeof r3 || "number" == typeof r3 || "bigint" == typeof r3 || r3.constructor == String ? r3 = n2.__k[o3] = m(null, r3, null, null, null) : d(r3) ? r3 = n2.__k[o3] = m(k, { children: r3 }, null, null, null) : void 0 === r3.constructor && r3.__b > 0 ? r3 = n2.__k[o3] = m(r3.type, r3.props, r3.key, r3.ref ? r3.ref : null, r3.__v) : n2.__k[o3] = r3, f4 = o3 + h4, r3.__ = n2, r3.__b = n2.__b + 1, e3 = null, -1 != (c3 = r3.__i = L(r3, u4, f4, a3)) && (a3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null == e3.__v ? (-1 == c3 && (i3 > s3 ? h4-- : i3 < s3 && h4++), "function" != typeof r3.type && (r3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h4-- : c3 == f4 + 1 ? h4++ : (c3 > f4 ? h4-- : h4++, r3.__u |= 4))) : n2.__k[o3] = null;
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
    var a3, h4, p3, v3, y3, _3, m3, b2, S2, C3, M2, $3, P4, A4, H3, L2, T4, j4 = u4.type;
    if (void 0 !== u4.constructor) return null;
    128 & t3.__u && (c3 = !!(32 & t3.__u), r3 = [f4 = u4.__e = t3.__e]), (a3 = l.__b) && a3(u4);
    n: if ("function" == typeof j4) try {
      if (b2 = u4.props, S2 = "prototype" in j4 && j4.prototype.render, C3 = (a3 = j4.contextType) && i3[a3.__c], M2 = a3 ? C3 ? C3.props.value : a3.__ : i3, t3.__c ? m3 = (h4 = u4.__c = t3.__c).__ = h4.__E : (S2 ? u4.__c = h4 = new j4(b2, M2) : (u4.__c = h4 = new x(b2, M2), h4.constructor = j4, h4.render = E), C3 && C3.sub(h4), h4.state || (h4.state = {}), h4.__n = i3, p3 = h4.__d = true, h4.__h = [], h4._sb = []), S2 && null == h4.__s && (h4.__s = h4.state), S2 && null != j4.getDerivedStateFromProps && (h4.__s == h4.state && (h4.__s = w({}, h4.__s)), w(h4.__s, j4.getDerivedStateFromProps(b2, h4.__s))), v3 = h4.props, y3 = h4.state, h4.__v = u4, p3) S2 && null == j4.getDerivedStateFromProps && null != h4.componentWillMount && h4.componentWillMount(), S2 && null != h4.componentDidMount && h4.__h.push(h4.componentDidMount);
      else {
        if (S2 && null == j4.getDerivedStateFromProps && b2 !== v3 && null != h4.componentWillReceiveProps && h4.componentWillReceiveProps(b2, M2), u4.__v == t3.__v || !h4.__e && null != h4.shouldComponentUpdate && false === h4.shouldComponentUpdate(b2, h4.__s, M2)) {
          for (u4.__v != t3.__v && (h4.props = b2, h4.state = h4.__s, h4.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
            n3 && (n3.__ = u4);
          }), $3 = 0; $3 < h4._sb.length; $3++) h4.__h.push(h4._sb[$3]);
          h4._sb = [], h4.__h.length && e3.push(h4);
          break n;
        }
        null != h4.componentWillUpdate && h4.componentWillUpdate(b2, h4.__s, M2), S2 && null != h4.componentDidUpdate && h4.__h.push(function() {
          h4.componentDidUpdate(v3, y3, _3);
        });
      }
      if (h4.context = M2, h4.props = b2, h4.__P = n2, h4.__e = false, P4 = l.__r, A4 = 0, S2) {
        for (h4.state = h4.__s, h4.__d = false, P4 && P4(u4), a3 = h4.render(h4.props, h4.state, h4.context), H3 = 0; H3 < h4._sb.length; H3++) h4.__h.push(h4._sb[H3]);
        h4._sb = [];
      } else do {
        h4.__d = false, P4 && P4(u4), a3 = h4.render(h4.props, h4.state, h4.context), h4.state = h4.__s;
      } while (h4.__d && ++A4 < 25);
      h4.state = h4.__s, null != h4.getChildContext && (i3 = w(w({}, i3), h4.getChildContext())), S2 && !p3 && null != h4.getSnapshotBeforeUpdate && (_3 = h4.getSnapshotBeforeUpdate(v3, y3)), L2 = a3, null != a3 && a3.type === k && null == a3.key && (L2 = V(a3.props.children)), f4 = I(n2, d(L2) ? L2 : [L2], u4, t3, i3, o3, r3, e3, f4, c3, s3), h4.base = u4.__e, u4.__u &= -161, h4.__h.length && e3.push(h4), m3 && (h4.__E = h4.__ = null);
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
    var a3, h4, v3, y3, w3, _3, m3, b2 = i3.props || p, k3 = t3.props, x3 = t3.type;
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
      for (a3 in k3) w3 = k3[a3], "children" == a3 ? y3 = w3 : "dangerouslySetInnerHTML" == a3 ? h4 = w3 : "value" == a3 ? _3 = w3 : "checked" == a3 ? m3 = w3 : c3 && "function" != typeof w3 || b2[a3] === w3 || j(u4, a3, w3, b2[a3], r3);
      if (h4) c3 || v3 && (h4.__html == v3.__html || h4.__html == u4.innerHTML) || (u4.innerHTML = h4.__html), t3.__k = [];
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

  // src/ui/card.tsx
  function getShopifyImageUrl(src, width) {
    if (!src) return "";
    const hasQuery = src.includes("?");
    const separator = hasQuery ? "&" : "?";
    return `${src}${separator}width=${width}`;
  }
  function generateSrcSet(src) {
    if (!src) return "";
    const widths = [165, 360, 533, 720, 940, 1066];
    return widths.map((w3) => `${getShopifyImageUrl(src, w3)} ${w3}w`).join(", ");
  }
  function Card({
    product,
    moneyFormat = "${{amount}}",
    showVendor = false,
    showPrice = true,
    showComparePrice = true,
    showSaleBadge = true,
    showWishlist = true,
    showReviews = true,
    showQuickBuy = true,
    imageRatio = "auto",
    borderStyle = "solid",
    cardRadius = 12,
    integrations = {},
    onQuickBuy
  }) {
    if (!product) return null;
    if (product.skeleton) {
      return /* @__PURE__ */ u3(
        "div",
        {
          className: "sw-card sw-card--skeleton",
          style: {
            "--image-aspect-ratio": imageRatio,
            "--card-border-style": borderStyle,
            "--card-radius": `${cardRadius}px`
          },
          children: [
            /* @__PURE__ */ u3("div", { className: "sw-card__media-wrapper", children: /* @__PURE__ */ u3("div", { className: "sw-card__media sw-skel-shimmer" }) }),
            /* @__PURE__ */ u3("div", { className: "sw-card__body", children: [
              /* @__PURE__ */ u3("div", { className: "sw-skel-line sw-skel-shimmer", style: { width: "80%" } }),
              /* @__PURE__ */ u3("div", { className: "sw-skel-line sw-skel-line--short sw-skel-shimmer" })
            ] })
          ]
        }
      );
    }
    const firstImage = product?.images?.[0] || null;
    const variantId = product?.variants?.[0]?.id || product?.variant_id;
    const isOnSale = Boolean(product.compare_at_price) && product.compare_at_price > product.price;
    const productUrl = product.url?.startsWith("http") ? product.url : `${typeof window !== "undefined" ? window.location.origin : ""}${product.url || ""}`;
    const wishlistApp = integrations?.wishlist?.toLowerCase() || null;
    const reviewsApp = integrations?.reviews?.toLowerCase() || null;
    y2(() => {
    }, [reviewsApp]);
    return /* @__PURE__ */ u3(
      "div",
      {
        className: "sw-card",
        style: {
          "--image-aspect-ratio": imageRatio,
          "--card-border-style": borderStyle,
          "--card-radius": `${cardRadius}px`
        },
        children: [
          /* @__PURE__ */ u3("div", { className: "sw-card__media-wrapper", children: [
            /* @__PURE__ */ u3(
              "a",
              {
                href: product.url,
                className: "sw-card__media",
                draggable: false,
                onDragStart: (e3) => e3.preventDefault(),
                children: typeof firstImage === "string" && firstImage && /* @__PURE__ */ u3(
                  "img",
                  {
                    src: getShopifyImageUrl(firstImage, 360),
                    srcSet: generateSrcSet(firstImage),
                    sizes: "(min-width: 750px) calc(25vw - 10px), 50vw",
                    alt: product.title,
                    width: 360,
                    height: 450,
                    loading: "lazy",
                    decoding: "async",
                    draggable: false,
                    onDragStart: (e3) => e3.preventDefault()
                  }
                )
              }
            ),
            showSaleBadge && isOnSale && /* @__PURE__ */ u3("span", { className: "sw-card__badge sw-card__badge--sale", children: "Sale" }),
            showWishlist && wishlistApp && /* @__PURE__ */ u3("div", { className: "sw-card__wishlist", children: [
              wishlistApp === "swym" && /* @__PURE__ */ u3(
                "button",
                {
                  "aria-label": "Add to Wishlist",
                  "data-with-epi": "true",
                  className: `swym-button swym-add-to-wishlist-view-product product_${product.id}`,
                  "data-swaction": "addToWishlist",
                  "data-product-id": product.id,
                  "data-variant-id": variantId,
                  "data-product-url": productUrl
                }
              ),
              wishlistApp === "growave" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "gw-add-to-wishlist-product-card-placeholder",
                  "data-gw-product-id": product.id,
                  "data-gw-variant-id": variantId
                }
              ),
              wishlistApp === "wishlist-king" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "wk-button-product-card",
                  "data-wk-product-id": product.id,
                  "data-wk-variant-id": variantId
                }
              ),
              wishlistApp === "hulk" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "wishlist-btn grid-wishlist-btn",
                  "data-wishlist": "true",
                  "data-added": "false",
                  "data-proid": product.id,
                  "data-varid": variantId,
                  "aria-label": "Add to Wishlist"
                }
              ),
              wishlistApp === "wishlist-hero" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "wishlist-hero-custom-button wishlisthero-floating",
                  "data-wlh-id": product.id,
                  "data-wlh-link": productUrl,
                  "data-wlh-variantid": variantId,
                  "data-wlh-price": (product.price / 100).toFixed(2),
                  "data-wlh-name": product.title,
                  "data-wlh-image": product.images?.[0] || "",
                  "data-wlh-mode": "icon_only"
                }
              )
            ] }),
            showQuickBuy && onQuickBuy && !product.skeleton && /* @__PURE__ */ u3(
              "button",
              {
                className: "sw-card__quick-buy",
                onClick: (e3) => {
                  e3.preventDefault();
                  e3.stopPropagation();
                  onQuickBuy(product);
                },
                "aria-label": "Quick add to cart",
                children: /* @__PURE__ */ u3("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ u3("path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }),
                  /* @__PURE__ */ u3("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
                  /* @__PURE__ */ u3("path", { d: "M16 10a4 4 0 0 1-8 0" })
                ] })
              }
            )
          ] }),
          /* @__PURE__ */ u3("div", { className: "sw-card__body", children: [
            showVendor && Boolean(product.vendor) && /* @__PURE__ */ u3("div", { className: "sw-card__vendor", children: product.vendor }),
            /* @__PURE__ */ u3("h3", { className: "sw-card__title", children: /* @__PURE__ */ u3("a", { href: product.url, draggable: false, children: product.title }) }),
            showPrice && /* @__PURE__ */ u3("div", { className: "sw-card__price", children: [
              /* @__PURE__ */ u3("span", { className: "sw-card__price-current", children: formatMoney(product.price, moneyFormat) }),
              showComparePrice && isOnSale && /* @__PURE__ */ u3("span", { className: "sw-card__price-compare", children: formatMoney(product.compare_at_price, moneyFormat) })
            ] }),
            showReviews && reviewsApp && /* @__PURE__ */ u3("div", { className: "sw-card__reviews", children: [
              reviewsApp === "judge-me" && /* @__PURE__ */ u3("div", { className: "jdgm-badge-placeholder", "data-handle": product.handle }),
              reviewsApp === "okendo" && /* @__PURE__ */ u3(
                "div",
                {
                  "data-oke-star-rating": "true",
                  "data-oke-reviews-product-id": `shopify-${product.id}`
                }
              ),
              reviewsApp === "yotpo" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "yotpo-widget-instance",
                  "data-yotpo-instance-id": integrations?.yotpoId || "1254551",
                  "data-yotpo-product-id": product.id,
                  "data-yotpo-name": product.title,
                  "data-yotpo-url": productUrl,
                  "data-yotpo-image-url": product.image || product.images?.[0]?.url
                }
              ),
              reviewsApp === "stamped" && /* @__PURE__ */ u3("span", { className: "stamped-product-reviews-badge", "data-id": product.id }),
              reviewsApp === "growave" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "gw-rv-listing-average-placeholder",
                  "data-gw-product-id": product.id,
                  style: { display: "block" }
                }
              ),
              reviewsApp === "loox" && /* @__PURE__ */ u3(
                "div",
                {
                  className: "loox-rating",
                  "data-id": product.id,
                  "data-rating": product.metafields?.reviews?.avg_rating || "",
                  "data-raters": product.metafields?.reviews?.num_reviews || ""
                }
              )
            ] })
          ] })
        ]
      }
    );
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

  // src/ui/grid.tsx
  var debug = createDebugger("Grid");
  function Grid({
    products = [],
    settings = {},
    onClick,
    onQuickBuy,
    isLoading = false
  }) {
    const scrollRef = A2(null);
    const hasMoved = A2(false);
    const cols = Number(settings.desktopColumns) || 4;
    const gapX = Number(settings.desktopGapX) || 16;
    const gapY = Number(settings.desktopGapY) || 24;
    const padTop = Number(settings.padTopDesktop) || 0;
    const padBottom = Number(settings.padBottomDesktop) || 0;
    const textAlign = settings.desktopTextAlign || "left";
    const isCarousel = settings.desktopLayout === "carousel";
    const items = isLoading ? Array.from({ length: Number(settings.productsToShow) || 8 }, (_3, i3) => ({
      id: `skeleton-${i3}`,
      skeleton: true
    })) : products;
    if (!items.length) {
      return /* @__PURE__ */ u3("div", { className: "sw-grid", children: "No products available." });
    }
    const gridIdRef = A2(`sw-grid-${Math.random().toString(36).slice(2, 9)}`);
    y2(() => {
      if (isLoading || !products.length) return;
      const win = window;
      const gridId = gridIdRef.current;
      const initSwymForGrid = (swat) => {
        if (!swat?.initializeActionButtons) return;
        const container = document.getElementById(gridId);
        if (container) {
          swat.initializeActionButtons(`#${gridId}`);
        }
      };
      const initAllWishlistApps = () => {
        if (win._swat) {
          initSwymForGrid(win._swat);
        }
        try {
          win.Growave?.Wishlist?.init?.();
        } catch (e3) {
        }
        try {
          win.SmartWishlist?.init?.();
        } catch (e3) {
        }
        try {
          win.WishlistKing?.toolkit?.init?.();
        } catch (e3) {
        }
        try {
          win.HulkappWishlist?.init?.();
        } catch (e3) {
        }
        try {
          win.WishlistHero?.init?.();
        } catch (e3) {
        }
        document.dispatchEvent(new CustomEvent("shopify:section:load"));
      };
      if (win._swat) {
        const timer = setTimeout(initAllWishlistApps, 100);
        return () => clearTimeout(timer);
      }
      if (win.SwymCallbacks) {
        const callback = (swat) => initSwymForGrid(swat);
        win.SwymCallbacks.push(callback);
      } else {
        const checkSwym = setInterval(() => {
          if (win._swat) {
            initAllWishlistApps();
            clearInterval(checkSwym);
          }
        }, 200);
        const timeout = setTimeout(() => clearInterval(checkSwym), 1e4);
        return () => {
          clearInterval(checkSwym);
          clearTimeout(timeout);
        };
      }
    }, [products, isLoading]);
    y2(() => {
      if (isLoading || !products.length) return;
      const initReviewApps = () => {
        const win = window;
        if (win.jdgm?.batchRenderBadges) {
          const allBadges = document.querySelectorAll(".jdgm-badge-placeholder");
          const handles = [
            ...new Set(
              [...allBadges].map((el) => el.getAttribute("data-handle"))
            )
          ];
          const data = handles.map((handle) => ({
            productHandle: handle,
            badgePlaceholder: `.jdgm-badge-placeholder[data-handle="${handle}"]`
          }));
          debug.log("Judge.me initialized for", data.length, "products");
          win.jdgm.batchRenderBadges(data);
          return;
        }
        if (win.JDGM?.initWidgets) {
          debug.log("Judge.me (new API) initialized");
          win.JDGM.initWidgets();
          return;
        }
        if (win.okeWidgetApi?.initWidget) {
          document.querySelectorAll("[data-oke-star-rating]").forEach((el) => {
            try {
              win.okeWidgetApi.initWidget(el, true);
            } catch (e3) {
              debug.warn("Okendo error", e3);
            }
          });
          debug.log("Okendo initialized");
          return;
        }
        if (win.yotpoWidgetsContainer?.initWidgets) {
          win.yotpoWidgetsContainer.initWidgets();
        } else if (win.yotpo?.initWidgets) {
          win.yotpo.initWidgets();
        } else if (win.Yotpo?.initWidgets) {
          win.Yotpo.initWidgets();
        } else if (win.yotpo?.refreshWidgets) {
          win.yotpo.refreshWidgets();
        }
        if (win.StampedFn?.reloadUGC) {
          debug.log("Stamped.io initialized");
          win.StampedFn.reloadUGC();
          return;
        }
      };
      const timer = setTimeout(initReviewApps, 500);
      return () => clearTimeout(timer);
    }, [products, isLoading]);
    y2(() => {
      const slider = scrollRef.current;
      if (!slider) return;
      const updateGutter = () => {
        let gutterLeft = 20;
        const alignmentRef = slider.closest(".sw-rec__wrapper")?.querySelector(".sw-alignment-ref");
        if (alignmentRef) {
          const refRect = alignmentRef.getBoundingClientRect();
          gutterLeft = Math.max(20, refRect.left);
        } else {
          const heading = slider.closest(".sw-rec__wrapper")?.querySelector(".sw-heading");
          if (heading) {
            const headingRect = heading.getBoundingClientRect();
            gutterLeft = Math.max(20, headingRect.left);
          }
        }
        slider.style.setProperty("--actual-gutter-left", `${gutterLeft}px`);
      };
      updateGutter();
      window.addEventListener("resize", updateGutter);
      const preventDragStart = (e3) => {
        e3.preventDefault();
        return false;
      };
      const images = slider.querySelectorAll("img");
      const links = slider.querySelectorAll("a");
      images.forEach((img) => {
        img.setAttribute("draggable", "false");
        img.addEventListener("dragstart", preventDragStart);
      });
      links.forEach((link) => {
        link.setAttribute("draggable", "false");
        link.addEventListener("dragstart", preventDragStart);
      });
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let velocities = [];
      let lastX = 0;
      let lastTime = 0;
      let animationFrameId = null;
      let pendingScrollLeft = null;
      const handlePointerDown = (e3) => {
        const target = e3.target;
        if (target.closest(".sw-card__wishlist") || target.closest(".swym-button")) {
          return;
        }
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        startX = e3.pageX;
        scrollLeft = slider.scrollLeft;
        lastX = e3.pageX;
        lastTime = performance.now();
        velocities = [];
        hasMoved.current = false;
        isDown = true;
        slider.style.scrollBehavior = "auto";
      };
      const handlePointerMove = (e3) => {
        if (!isDown) return;
        if (hasMoved.current) {
          e3.preventDefault();
        }
        const x3 = e3.pageX;
        const walk = Math.abs(x3 - startX);
        if (walk > 8) {
          if (!hasMoved.current) {
            hasMoved.current = true;
            slider.classList.add("is-dragging");
            slider.setPointerCapture(e3.pointerId);
          }
          e3.preventDefault();
          let actualWalk = x3 - startX;
          const newScrollLeft = scrollLeft - actualWalk;
          const maxScroll = slider.scrollWidth - slider.clientWidth;
          if (newScrollLeft < 0) {
            const overscroll = Math.abs(newScrollLeft);
            const resistance = Math.max(0.15, 1 - overscroll / 300);
            actualWalk = actualWalk * resistance;
          } else if (newScrollLeft > maxScroll) {
            const overscroll = newScrollLeft - maxScroll;
            const resistance = Math.max(0.15, 1 - overscroll / 300);
            actualWalk = actualWalk * resistance;
          }
          pendingScrollLeft = scrollLeft - actualWalk;
          if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(() => {
              if (pendingScrollLeft !== null) {
                slider.scrollLeft = pendingScrollLeft;
              }
              animationFrameId = null;
            });
          }
          const now = performance.now();
          const dt = now - lastTime;
          if (dt > 0 && dt < 100) {
            const currentVelocity = (e3.pageX - lastX) / dt;
            velocities.push(currentVelocity);
            if (velocities.length > 5) velocities.shift();
          }
          lastX = e3.pageX;
          lastTime = now;
        }
      };
      const handlePointerUp = (e3) => {
        if (!isDown) return;
        try {
          slider.releasePointerCapture(e3.pointerId);
        } catch (_3) {
        }
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        const wasDragging = hasMoved.current;
        isDown = false;
        slider.classList.remove("is-dragging");
        if (!wasDragging) {
          hasMoved.current = false;
          return;
        }
        if (pendingScrollLeft !== null) {
          slider.scrollLeft = pendingScrollLeft;
          pendingScrollLeft = null;
        }
        const currentScroll = slider.scrollLeft;
        const maxScroll = slider.scrollWidth - slider.clientWidth;
        if (currentScroll < 0 || currentScroll > maxScroll) {
          slider.style.scrollBehavior = "smooth";
          const targetScroll = currentScroll < 0 ? 0 : maxScroll;
          slider.scrollTo({
            left: targetScroll,
            behavior: "smooth"
          });
          setTimeout(() => {
            hasMoved.current = false;
            slider.style.scrollBehavior = "auto";
          }, 300);
          return;
        }
        const samplesToUse = velocities.length > 2 ? velocities.slice(-3, -1) : velocities;
        const avgVelocity = samplesToUse.length > 0 ? samplesToUse.reduce((sum, v3) => sum + v3, 0) / samplesToUse.length : 0;
        if (Math.abs(avgVelocity) > 0.25) {
          slider.style.scrollBehavior = "smooth";
          const momentum = avgVelocity * 180;
          slider.scrollBy({
            left: -momentum,
            behavior: "smooth"
          });
          setTimeout(() => {
            hasMoved.current = false;
            slider.style.scrollBehavior = "auto";
          }, 350);
        } else {
          slider.style.scrollBehavior = "auto";
          hasMoved.current = false;
        }
      };
      const handleClick = (e3) => {
        const target = e3.target;
        if (target.closest(".sw-card__wishlist") || target.closest(".swym-button")) {
          return;
        }
        if (hasMoved.current) {
          e3.preventDefault();
          e3.stopPropagation();
        }
      };
      slider.addEventListener("pointerdown", handlePointerDown);
      slider.addEventListener("pointermove", handlePointerMove);
      slider.addEventListener("pointerup", handlePointerUp);
      slider.addEventListener("pointercancel", handlePointerUp);
      slider.addEventListener("click", handleClick, true);
      return () => {
        window.removeEventListener("resize", updateGutter);
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        images.forEach((img) => {
          img.removeEventListener("dragstart", preventDragStart);
        });
        links.forEach((link) => {
          link.removeEventListener("dragstart", preventDragStart);
        });
        slider.removeEventListener("pointerdown", handlePointerDown);
        slider.removeEventListener("pointermove", handlePointerMove);
        slider.removeEventListener("pointerup", handlePointerUp);
        slider.removeEventListener("pointercancel", handlePointerUp);
        slider.removeEventListener("click", handleClick, true);
      };
    }, [isCarousel]);
    debug.log("Grid settings:", settings);
    return /* @__PURE__ */ u3("div", { className: "sw-grid-container", children: /* @__PURE__ */ u3(
      "div",
      {
        id: gridIdRef.current,
        ref: scrollRef,
        className: `sw-grid ${isCarousel ? "sw-carousel" : "is-grid"}`,
        "data-responsive": "true",
        style: {
          "--reco-cols": cols,
          "--gap-grid-x": `${gapX}px`,
          "--gap-grid-y": `${gapY}px`,
          "--grid-padding-top": `${padTop}px`,
          "--grid-padding-bottom": `${padBottom}px`,
          "--grid-padding-top-mobile": `${settings.padTopMobile || 16}px`,
          "--grid-padding-bottom-mobile": `${settings.padBottomMobile || 16}px`,
          "--grid-text-alignment": textAlign,
          "--carousel-gap": `${settings.mobileGap || 12}px`,
          "--mobile-cols": settings.mobileColumns || 1
        },
        children: items.map((p3) => /* @__PURE__ */ u3(
          "div",
          {
            className: "sw-grid__item",
            onClick: (e3) => {
              if (isLoading || p3.skeleton) return;
              const target = e3.target;
              if (target.closest(".sw-card__wishlist") || target.closest(".swym-button")) {
                return;
              }
              onClick?.(p3);
            },
            children: /* @__PURE__ */ u3(
              Card,
              {
                product: p3,
                moneyFormat: settings.moneyFormat,
                showVendor: settings.showVendor,
                showPrice: settings.showPrice,
                showComparePrice: settings.showComparePrice,
                showSaleBadge: settings.showSaleBadge,
                showWishlist: settings.showWishlist,
                showReviews: settings.showReviews,
                showQuickBuy: settings.showQuickBuy !== false,
                imageRatio: settings.imageRatio,
                borderStyle: settings.cardBorderStyle,
                cardRadius: settings.cardRadius,
                integrations: settings.integrations,
                onQuickBuy
              }
            )
          },
          p3.id
        ))
      }
    ) });
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

  // src/ui/QuickBuyModal.tsx
  function getShopifyImageUrl2(src, width) {
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
                src: getShopifyImageUrl2(currentImage, 600),
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

  // src/core/utils/dom.ts
  var debug3 = createDebugger("DOM");
  function extractSettings(el) {
    const out = {};
    for (const [key, raw] of Object.entries(el.dataset)) {
      let value = raw;
      if (raw === "true") value = true;
      else if (raw === "false") value = false;
      else if (raw !== "" && !isNaN(raw)) value = Number(raw);
      else value = raw;
      out[key] = value;
    }
    debug3.log("Extracted settings:", out);
    return out;
  }

  // src/core/attribution/cache.ts
  var KEY = "__shopwizer_attrib__v1";
  var TTL = 30 * 24 * 60 * 60 * 1e3;
  var MAX = 50;
  function getAttributions() {
    try {
      const now = Date.now();
      const list = JSON.parse(localStorage.getItem(KEY) || "[]").filter((r3) => now - r3.ts < TTL).slice(-MAX);
      localStorage.setItem(KEY, JSON.stringify(list));
      return list;
    } catch {
      return [];
    }
  }
  function recordAttribution(pid, type) {
    const list = getAttributions();
    const now = Date.now();
    const found = list.find((r3) => r3.pid === pid);
    if (found) found.ts = now;
    else list.push({ pid, type, ts: now });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  }

  // src/core/attribution/cartAttribution.ts
  var debug4 = createDebugger("Attribution");
  function initCartAttribution() {
    debug4.log("\u{1F680} initCartAttribution() called");
    if (typeof window === "undefined") {
      debug4.log("\u274C window is undefined, aborting");
      return;
    }
    if (window.__sw_cart_listener__) {
      debug4.log("\u23ED\uFE0F Cart listener already initialized, skipping");
      return;
    }
    window.__sw_cart_listener__ = true;
    debug4.log("\u2705 Cart attribution listener REGISTERED");
    const ATTR_KEY = "__shopwizer_attrib__v1";
    window.addEventListener("SW:mutate", async () => {
      debug4.log("\u{1F4E6} SW:mutate event received - capturing cart state BEFORE add");
      try {
        const cart = await fetch("/cart.js").then((r3) => r3.json());
        window.__sw_cart_before__ = cart.items || [];
        debug4.log("   Cart items before:", window.__sw_cart_before__.length);
      } catch (err) {
        debug4.error("   \u274C Failed to fetch cart:", err);
        window.__sw_cart_before__ = [];
      }
    });
    async function patchCart(payload) {
      debug4.log("\u{1F527} patchCart called with:", payload);
      for (let i3 = 0; i3 < 3; i3++) {
        try {
          await fetch("/cart/change.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          debug4.log("   \u2705 Cart patched successfully, attempt:", i3 + 1);
          return true;
        } catch (err) {
          debug4.error("   \u274C Cart patch failed, attempt:", i3 + 1, err);
          await new Promise((res) => setTimeout(res, 150 * (i3 + 1)));
        }
      }
      debug4.error("   \u274C All patch attempts failed");
      return false;
    }
    window.addEventListener("SW:add", async () => {
      debug4.log("\u{1F6D2} SW:add event received - checking for new items to attribute");
      const before = window.__sw_cart_before__ || [];
      debug4.log("   Cart state BEFORE had:", before.length, "items");
      let cart;
      try {
        cart = await fetch("/cart.js").then((r3) => r3.json());
        debug4.log("   Cart state AFTER has:", cart.items?.length || 0, "items");
      } catch (err) {
        debug4.error("   \u274C Failed to fetch cart after add:", err);
        return;
      }
      const after = cart.items || [];
      const newItems = after.filter((a3) => !before.some((b2) => b2.key === a3.key));
      debug4.log("   \u{1F195} New items to process:", newItems.length);
      if (!newItems.length) {
        debug4.log("   \u23ED\uFE0F No new items found, nothing to attribute");
        return;
      }
      const attributions = JSON.parse(localStorage.getItem(ATTR_KEY) || "[]");
      debug4.log("   \u{1F4CB} Stored attributions from localStorage:", attributions);
      for (const item of newItems) {
        debug4.log("   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
        debug4.log("   \u{1F50D} Processing item:", item.title);
        debug4.log("      Product ID:", item.product_id);
        debug4.log("      Item key:", item.key);
        debug4.log("      Current properties:", item.properties);
        const record = attributions.find((r3) => String(r3.pid) === String(item.product_id));
        debug4.log("      Matching attribution record:", record);
        if (!record) {
          debug4.log("      \u274C No attribution record for this product, skipping");
          continue;
        }
        if (item.properties?._shopwizer) {
          debug4.log("      \u23ED\uFE0F Already has _shopwizer property, skipping");
          continue;
        }
        const props = {
          ...item.properties,
          _shopwizer: "Recommended by Shopwizer"
        };
        debug4.log("      \u{1F3F7}\uFE0F PATCHING cart item with:", props);
        const success = await patchCart({
          id: item.key,
          quantity: item.quantity,
          properties: props
        });
        if (success) {
          debug4.log("      \u2705 Attribution patched successfully!");
        } else {
          debug4.log("      \u274C Failed to patch attribution");
        }
      }
      debug4.log("\u{1F3C1} SW:add processing complete");
    });
    debug4.log("\u{1F442} Now listening for SW:mutate and SW:add events");
  }

  // src/core/analytics/index.ts
  var debug5 = createDebugger("[ANALYTICS]: ", true);
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
      debug5.warn("[Shopwizer] Failed to publish clicked event", err);
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
      debug5.warn("[Shopwizer] Failed to publish viewed event", err);
    }
  }

  // src/core/analytics/viewObserver.ts
  function observeViewOnce(el, callback) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e3) => e3.isIntersecting)) {
          callback();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
  }

  // src/ui/heading.tsx
  var SIZE_MAP = {
    xlarge: "sw-heading--xlarge",
    large: "sw-heading--large",
    medium: "sw-heading--medium",
    small: "sw-heading--small",
    xsmall: "sw-heading--xsmall"
  };
  function Heading({
    text,
    tag = "h3",
    size = "medium",
    alignment = "left"
  }) {
    const Tag = tag;
    const sizeClass = SIZE_MAP[size] || SIZE_MAP.medium;
    return /* @__PURE__ */ u3(Tag, { class: `sw-heading ${sizeClass}`, style: { textAlign: alignment }, children: text });
  }

  // src/components/widget.tsx
  var debug6 = createDebugger("[WIDGET]: ", false);
  initCartAttribution();
  function Widget({ el, loader }) {
    debug6.log("\u{1F7E6} [WIDGET] MOUNT on element:", el);
    const [settings] = d2(() => {
      const s3 = extractSettings(el);
      debug6.log("\u{1F7E6} [WIDGET] Final settings:", s3);
      return s3;
    });
    const [products, setProducts] = d2([]);
    const [integrations, setIntegrations] = d2({});
    const [slateId, setSlateId] = d2(void 0);
    const [payload, setPayload] = d2(void 0);
    const [sourcePayload, setSourcePayload] = d2(void 0);
    const [loading, setLoading] = d2(true);
    const [quickBuyProduct, setQuickBuyProduct] = d2(null);
    const mountRef = A2(null);
    y2(() => {
      let active = true;
      async function run() {
        try {
          setLoading(true);
          const { products: products2, slate_id, p: p3, ps, integrations: integrations2 } = await loader(settings);
          if (!active) return;
          setProducts(products2 || []);
          setSlateId(slate_id || void 0);
          setPayload(p3 || void 0);
          setSourcePayload(ps || void 0);
          setIntegrations(integrations2 || {});
        } catch (err) {
          debug6.warn("\u{1F7E5} loader failed:", err);
          if (active) setProducts([]);
        } finally {
          if (active) setLoading(false);
        }
      }
      run();
      return () => active = false;
    }, [settings.recommender, settings.productsToShow]);
    y2(() => {
      if (!mountRef.current || !products.length) return;
      observeViewOnce(mountRef.current, () => {
        publishViewed({
          rail: settings.recommender,
          placement: settings.placement || "widget",
          slateId
        });
      });
    }, [products, slateId, payload, sourcePayload]);
    if (!loading && !products.length) {
      return null;
    }
    const body = T2(() => {
      return /* @__PURE__ */ u3(
        Grid,
        {
          products,
          settings: { ...settings, integrations },
          isLoading: loading,
          onClick: (prod) => {
            recordAttribution(prod.id, settings.recommender);
            publishClicked({
              rail: settings.recommender,
              placement: settings.placement,
              productId: prod.id,
              srcPid: settings.productId,
              // Source product (the one being viewed)
              slateId,
              p: payload || void 0,
              ps: sourcePayload || void 0
            });
          },
          onQuickBuy: (prod) => {
            setQuickBuyProduct(prod);
            publishClicked({
              rail: settings.recommender,
              placement: settings.placement,
              productId: prod.id,
              srcPid: settings.productId,
              slateId,
              action: "quick_buy_open"
            });
          }
        }
      );
    }, [products, loading, settings, slateId, integrations]);
    return /* @__PURE__ */ u3(
      "section",
      {
        className: "sw-section",
        style: {
          "--pad-top-desktop": `${settings.padTopDesktop || 24}px`,
          "--pad-bottom-desktop": `${settings.padBottomDesktop || 24}px`,
          "--pad-top-mobile": `${settings.padTopMobile || 16}px`,
          "--pad-bottom-mobile": `${settings.padBottomMobile || 16}px`
        },
        children: [
          /* @__PURE__ */ u3(
            "div",
            {
              ref: mountRef,
              className: "sw-rec__wrapper",
              style: {
                "--gap-grid-x": `${settings.desktopGapX || 16}px`,
                "--gap-grid-y": `${settings.desktopGapY || 24}px`,
                "--carousel-gap": `${settings.mobileGap || 12}px`,
                "--heading-spacing-desktop": `${settings.headingSpacingDesktop || 16}px`,
                "--heading-spacing-mobile": `${settings.headingSpacingMobile || 12}px`,
                "--heading-alignment": settings.headingAlignment || "left"
              },
              children: [
                settings.headingTitle && /* @__PURE__ */ u3(
                  Heading,
                  {
                    text: settings.headingTitle,
                    tag: settings.headingTag || "h3",
                    size: settings.headingSize || "medium",
                    alignment: settings.headingAlignment || "left"
                  }
                ),
                /* @__PURE__ */ u3(
                  "div",
                  {
                    className: "sw-alignment-ref",
                    "aria-hidden": "true",
                    style: {
                      height: "1px",
                      visibility: "hidden",
                      pointerEvents: "none"
                    }
                  }
                ),
                body
              ]
            }
          ),
          quickBuyProduct && /* @__PURE__ */ u3(
            QuickBuyModal,
            {
              product: quickBuyProduct,
              moneyFormat: settings.moneyFormat,
              onClose: () => setQuickBuyProduct(null),
              onAddToCart: (variantId, quantity) => {
                publishClicked({
                  rail: settings.recommender,
                  placement: settings.placement,
                  productId: quickBuyProduct.id,
                  variantId,
                  quantity,
                  action: "quick_buy_add"
                });
              }
            }
          )
        ]
      }
    );
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

  // src/core/utils/mount.ts
  var debug7 = createDebugger("[MOUNT]: ", false);
  function mountByRecommender(recommender, WidgetComponent) {
    const ROOT_SELECTOR = '[id^="shopwise-reco-"]';
    debug7.log(`\u{1F4CC} [MOUNT] Initializing mountByRecommender("${recommender}")`);
    function mount(root = document) {
      debug7.log("\u{1F4CC} [MOUNT] Running mount() on root:", root);
      const nodes = root.querySelectorAll(ROOT_SELECTOR);
      debug7.log(
        `\u{1F4CC} [MOUNT] Found ${nodes.length} widget nodes for selector ${ROOT_SELECTOR}`
      );
      nodes.forEach((el, index) => {
        debug7.log(`\u{1F4CC} [MOUNT] \u2192 Node #${index}`, el);
        const r3 = el.dataset.recommender;
        debug7.log(`\u{1F4CC} [MOUNT]   dataset.recommender = "${r3}"`);
        if (r3 !== recommender) {
          debug7.log(
            `\u{1F4CC} [MOUNT]   SKIP \u2014 recommender mismatch (expected "${recommender}", got "${r3}")`
          );
          return;
        }
        if (el.dataset.mounted === "true") {
          debug7.log("\u{1F4CC} [MOUNT]   SKIP \u2014 already mounted");
          return;
        }
        debug7.log(`\u{1F4CC} [MOUNT]   Mounting widget "${recommender}" on:`, el);
        el.dataset.mounted = "true";
        try {
          debug7.log(`\u{1F4CC} [MOUNT]   Rendering Preact component into element...`);
          G(_(WidgetComponent, { el }), el);
          debug7.log(
            `\u{1F4CC} [MOUNT]   SUCCESS \u2014 WidgetComponent("${recommender}") rendered`
          );
        } catch (err) {
          debug7.warn(
            `\u{1F4CC} [MOUNT]   \u274C ERROR \u2014 Failed to mount widget "${recommender}"`,
            err
          );
        }
      });
    }
    if (document.readyState === "loading") {
      debug7.log(`\u{1F4CC} [MOUNT] Document loading \u2014 waiting for DOMContentLoaded`);
      document.addEventListener("DOMContentLoaded", () => {
        debug7.log("\u{1F4CC} [MOUNT] DOMContentLoaded fired");
        mount();
      });
    } else {
      debug7.log("\u{1F4CC} [MOUNT] Document ready \u2014 running initial mount()");
      mount();
    }
    document.addEventListener("shopify:section:load", (e3) => {
      debug7.log("\u{1F4CC} [MOUNT] shopify:section:load", e3.target);
      mount(e3.target);
    });
    document.addEventListener("shopify:block:select", (e3) => {
      debug7.log("\u{1F4CC} [MOUNT] shopify:block:select", e3.target);
      mount(e3.target);
    });
    document.addEventListener("shopify:section:unload", (e3) => {
      debug7.log("\u{1F4CC} [MOUNT] shopify:section:unload", e3.target);
    });
  }

  // src/events/cartEvents.ts
  (function() {
    if (typeof window === "undefined") return;
    const isDebug = (() => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlDebug = urlParams.get("swdebug");
        if (urlDebug === "1") {
          localStorage.setItem("swdebug", "1");
          return true;
        } else if (urlDebug === "0") {
          localStorage.removeItem("swdebug");
          return false;
        }
        return localStorage.getItem("swdebug") === "1";
      } catch {
        return false;
      }
    })();
    const log = (...args) => {
      if (isDebug) console.log("\u{1F527} [CartEvents]", ...args);
    };
    const warn = (...args) => {
      if (isDebug) console.warn("\u{1F527} [CartEvents]", ...args);
    };
    log("\u{1F680} Initializing cart event interceptors...");
    if (window.__ShopwiseCartEventsLoaded__) {
      log("\u23ED\uFE0F Already loaded, skipping");
      return;
    }
    window.__ShopwiseCartEventsLoaded__ = true;
    const CartEvents = {
      add: "SW:add",
      update: "SW:update",
      change: "SW:change",
      clear: "SW:clear",
      mutate: "SW:mutate"
    };
    const ShopifyCartURLs = [
      "/cart/add",
      "/cart/update",
      "/cart/change",
      "/cart/clear",
      "/cart/add.js",
      "/cart/update.js",
      "/cart/change.js",
      "/cart/clear.js"
    ];
    function isShopifyCartURL(url) {
      if (!url) return false;
      try {
        const parsed = new URL(url, window.location.origin);
        return ShopifyCartURLs.some((p3) => parsed.pathname.startsWith(p3));
      } catch {
        return ShopifyCartURLs.some((p3) => url.startsWith(p3));
      }
    }
    function updateType(url) {
      if (!url) return false;
      if (url.includes("cart/add")) return "add";
      if (url.includes("cart/update")) return "update";
      if (url.includes("cart/change")) return "change";
      if (url.includes("cart/clear")) return "clear";
      return false;
    }
    function dispatchEvent(url, detail) {
      log("\u{1F4E1} dispatchEvent called for URL:", url);
      if (typeof detail === "string") {
        try {
          detail = JSON.parse(detail);
        } catch {
        }
      }
      log("\u{1F4E4} Dispatching SW:mutate event");
      window.dispatchEvent(new CustomEvent(CartEvents.mutate, { detail }));
      const type = updateType(url);
      if (!type) {
        warn("\u26A0\uFE0F No matching cart type for URL");
        return;
      }
      log("\u{1F4E4} Dispatching SW:" + type + " event");
      window.dispatchEvent(new CustomEvent(CartEvents[type], { detail }));
    }
    function XHROverride() {
      if (window.__swXHRPatched) {
        log("\u23ED\uFE0F XHR already patched by ThemeBridge, skipping");
        return;
      }
      if (!window.XMLHttpRequest) {
        warn("\u274C XMLHttpRequest not available");
        return;
      }
      log("\u{1F527} Installing XHR interceptor...");
      const originalOpen = window.XMLHttpRequest.prototype.open;
      window.XMLHttpRequest.prototype.open = function(...args) {
        const url = args[1];
        this.addEventListener("load", function() {
          if (isShopifyCartURL(url)) {
            log("\u{1F50D} XHR intercepted cart request:", url);
            dispatchEvent(url, this.response);
          }
        });
        return originalOpen.apply(this, args);
      };
      log("\u2705 XHR interceptor installed");
    }
    function fetchOverride() {
      if (window.__swFetchPatched) {
        log("\u23ED\uFE0F Fetch already patched by ThemeBridge, skipping");
        return;
      }
      if (!window.fetch || typeof window.fetch !== "function") {
        warn("\u274C fetch not available");
        return;
      }
      log("\u{1F527} Installing fetch interceptor...");
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === "string" && url.includes("cart")) {
          log("\u{1F440} Saw fetch to cart-related URL:", url);
        }
        const response = originalFetch.apply(this, args);
        if (isShopifyCartURL(url)) {
          log("\u{1F50D} Fetch intercepted cart request:", url);
          response.then((res) => {
            log("\u{1F4EC} Fetch response received for:", res.url);
            res.clone().json().then((data) => {
              log("\u{1F4E6} Response data:", data);
              dispatchEvent(res.url, data);
            }).catch((err) => {
              warn("\u26A0\uFE0F JSON parse failed, trying text:", err);
              res.clone().text().then((text) => dispatchEvent(res.url, text));
            });
          }).catch((err) => {
            console.error("\u{1F527} [CartEvents] \u274C Fetch failed:", err);
          });
        }
        return response;
      };
      log("\u2705 Fetch interceptor installed");
    }
    fetchOverride();
    XHROverride();
    log("\u2705 Cart event interceptors ready! Listening for cart mutations...");
  })();

  // src/components/rail.tsx
  var debug8 = createDebugger("RAIL", true);
  async function fetchIntegrations(shop) {
    try {
      const res = await fetch(`/apps/sw/integrations/${shop}`);
      if (!res.ok) {
        debug8.warn("Failed to fetch integrations", res.status);
        return {};
      }
      const data = await res.json();
      return data.integrations || {};
    } catch (err) {
      debug8.warn("Error fetching integrations", err);
      return {};
    }
  }
  function createRailLoader(basePath, rail) {
    return async function load(settings) {
      debug8.log(`[${settings.recommender}] load() settings:`, settings);
      const shop = settings?.shop;
      const productId = settings?.productId;
      const variantId = settings?.variantId;
      const chosenId = variantId ? variantId : productId;
      const limit = Number(settings.productsToShow || 8);
      if (!shop) {
        debug8.warn(`[${settings.recommender}] No shop domain`);
        return { products: [], slate_id: null, integrations: {} };
      }
      if (!chosenId) {
        debug8.warn(`[${settings.recommender}] No productId or variantId`);
        return { products: [], slate_id: null, integrations: {} };
      }
      const url = `${basePath}/${shop}/${rail}/${chosenId}`;
      debug8.log(`[${settings.recommender}] Fetching ${url}`);
      try {
        const [recsRes, integrations] = await Promise.all([
          fetch(url),
          fetchIntegrations(shop)
        ]);
        if (!recsRes.ok) throw new Error(`API status ${recsRes.status}`);
        const data = await recsRes.json();
        const results = data.results || [];
        const reviewsMap = /* @__PURE__ */ new Map();
        for (const r3 of results) {
          if (r3.reviews) {
            reviewsMap.set(r3.handle, r3.reviews);
          }
        }
        const handles = results.map((r3) => r3.handle);
        debug8.log(`[${settings.recommender}] Handles:`, handles);
        const products = await Promise.all(
          handles.slice(0, limit).map(async (handle) => {
            try {
              const product = await fetchProductByHandle(handle);
              if (!product) return null;
              const reviewsData = reviewsMap.get(handle);
              if (reviewsData) {
                product.metafields = product.metafields || {};
                product.metafields.reviews = {
                  avg_rating: reviewsData.avgRating,
                  num_reviews: reviewsData.numReviews
                };
              }
              return product;
            } catch {
              return null;
            }
          })
        );
        return {
          products: products.filter(Boolean),
          slate_id: data.slate_id || null,
          p: data.p || null,
          ps: data.ps || null,
          integrations
        };
      } catch (err) {
        debug8.warn(`[${settings.recommender}] ERROR:`, err);
        return { products: [], slate_id: null, integrations: {} };
      }
    };
  }
  function createRailComponent(recommender, loader) {
    function RailComponent({ el }) {
      return /* @__PURE__ */ u3(Widget, { el, loader });
    }
    debug8.log(`[${recommender}] register mount`);
    mountByRecommender(recommender, (args) => RailComponent(args));
    return RailComponent;
  }

  // src/pdp-colors.tsx
  var loadColors = createRailLoader("/apps/sw/recs", "color");
  var ColorsWidget = createRailComponent("colors", loadColors);
})();
