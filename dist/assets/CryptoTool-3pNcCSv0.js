import{_ as Z,j as x0,o as S,b as _,d as s,t as b,u as d,e as a,N as T,O as e0,S as t0,y as I,x as E,n as N,z as U,F as r0,l as o0,r as v,C as R,h as i0}from"./main-BzfIGtWR.js";import{h as c0}from"./syntaxHighlight-ZWoPFC44.js";import{c as H}from"./clipboard-CjDFp3Pk.js";import{_ as L}from"./LinesBox-CIYup_sE.js";import{L as n0}from"./LinedTextarea-BhTjZqrK.js";const O="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";function C(t){const r=[];for(let e=0;e<t.length;e++){let x=t.codePointAt(e);x>65535&&e++,x<128?r.push(x):x<2048?r.push(192|x>>6,128|x&63):x<65536?r.push(224|x>>12,128|x>>6&63,128|x&63):r.push(240|x>>18,128|x>>12&63,128|x>>6&63,128|x&63)}return r}function P(t){const r=t instanceof Uint8Array?t:new Uint8Array(t);if(typeof TextDecoder<"u")return new TextDecoder("utf-8").decode(r);let e="";for(let x=0;x<r.length;x++){let o=r[x];if(o<128)e+=String.fromCharCode(o);else if(o<224)e+=String.fromCharCode((o&31)<<6|r[++x]&63);else if(o<240)e+=String.fromCharCode((o&15)<<12|(r[++x]&63)<<6|r[++x]&63);else{const i=(o&7)<<18|(r[++x]&63)<<12|(r[++x]&63)<<6|r[++x]&63;e+=String.fromCodePoint(i)}}return e}function A(t){let r="";for(let e=0;e<t.length;e+=3){const x=t[e],o=e+1<t.length?t[e+1]:0,i=e+2<t.length?t[e+2]:0;r+=O[x>>2],r+=O[(x&3)<<4|o>>4],r+=e+1<t.length?O[(o&15)<<2|i>>6]:"=",r+=e+2<t.length?O[i&63]:"="}return r}function K(t){t=String(t).replace(/\s+/g,"");const r=[];let e=0,x=0;for(let o=0;o<t.length;o++){const i=t[o];if(i==="=")break;const n=O.indexOf(i);if(n===-1)throw new Error("Invalid Base64 input");e=e<<6|n,x+=6,x>=8&&(x-=8,r.push(e>>x&255))}return r}function D(t,r){const e=C(r);if(!e.length)throw new Error("Key cannot be empty");return t.map((x,o)=>x^e[o%e.length])}function M(t,r){const e=C(r);if(!e.length)throw new Error("Key cannot be empty");const x=[];for(let c=0;c<256;c++)x[c]=c;let o=0;for(let c=0;c<256;c++)o=o+x[c]+e[c%e.length]&255,[x[c],x[o]]=[x[o],x[c]];let i=0;o=0;const n=new Array(t.length);for(let c=0;c<t.length;c++)i=i+1&255,o=o+x[i]&255,[x[i],x[o]]=[x[o],x[i]],n[c]=t[c]^x[x[i]+x[o]&255];return n}const B=[99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22],V=new Array(256);for(let t=0;t<256;t++)V[B[t]]=t;const s0=[1,2,4,8,16,32,64,128,27,54];function m(t){return(t<<1^(t&128?27:0))&255}function f(t,r){let e=0;for(;r;)r&1&&(e^=t),t=m(t),r>>=1;return e}function J(t){const r=new Array(176);for(let x=0;x<16;x++)r[x]=t[x];let e=0;for(let x=16;x<176;x+=4){let o=r[x-4],i=r[x-3],n=r[x-2],c=r[x-1];if(x%16===0){const y=o;o=i,i=n,n=c,c=y,o=B[o]^s0[e++],i=B[i],n=B[n],c=B[c]}r[x]=r[x-16]^o,r[x+1]=r[x-15]^i,r[x+2]=r[x-14]^n,r[x+3]=r[x-13]^c}return r}function j(t,r,e){const x=e*16;for(let o=0;o<16;o++)t[o]^=r[x+o]}function X(t,r){for(let e=1;e<4;e++){const x=[t[e],t[e+4],t[e+8],t[e+12]];for(let o=0;o<4;o++)t[e+4*o]=r?x[(o-e+4)%4]:x[(o+e)%4]}}function a0(t){for(let r=0;r<4;r++){const e=r*4,x=t[e],o=t[e+1],i=t[e+2],n=t[e+3];t[e]=m(x)^(m(o)^o)^i^n,t[e+1]=x^m(o)^(m(i)^i)^n,t[e+2]=x^o^m(i)^(m(n)^n),t[e+3]=m(x)^x^o^i^m(n)}}function f0(t){for(let r=0;r<4;r++){const e=r*4,x=t[e],o=t[e+1],i=t[e+2],n=t[e+3];t[e]=f(x,14)^f(o,11)^f(i,13)^f(n,9),t[e+1]=f(x,9)^f(o,14)^f(i,11)^f(n,13),t[e+2]=f(x,13)^f(o,9)^f(i,14)^f(n,11),t[e+3]=f(x,11)^f(o,13)^f(i,9)^f(n,14)}}function $0(t,r){j(t,r,0);for(let e=1;e<10;e++){for(let x=0;x<16;x++)t[x]=B[t[x]];X(t,!1),a0(t),j(t,r,e)}for(let e=0;e<16;e++)t[e]=B[t[e]];X(t,!1),j(t,r,10)}function d0(t,r){j(t,r,10);for(let e=9;e>=1;e--){X(t,!0);for(let x=0;x<16;x++)t[x]=V[t[x]];j(t,r,e),f0(t)}X(t,!0);for(let e=0;e<16;e++)t[e]=V[t[e]];j(t,r,0)}function u0(t){if(typeof crypto<"u"&&crypto.getRandomValues){const e=new Uint8Array(t);return crypto.getRandomValues(e),Array.from(e)}const r=[];for(let e=0;e<t;e++)r.push(Math.floor(Math.random()*256));return r}function Y(t){const r=C(t);if(r.length!==16)throw new Error("AES-128 requires a 16-byte (UTF-8) key");return r}function l0(t,r){const e=Y(r),x=C(t),o=16-x.length%16;for(let u=0;u<o;u++)x.push(o);const i=J(e),n=u0(16),c=n.slice();let y=n.slice();for(let u=0;u<x.length;u+=16){const w=x.slice(u,u+16).map((l,h)=>l^y[h]);$0(w,i),c.push(...w),y=w}return A(c)}function b0(t,r){const e=Y(r),x=K(t);if(x.length<32||(x.length-16)%16!==0)throw new Error("Invalid ciphertext length");const o=x.slice(0,16),i=x.slice(16),n=J(e),c=[];let y=o;for(let k=0;k<i.length;k+=16){const w=i.slice(k,k+16),l=w.slice();d0(l,n);for(let h=0;h<16;h++)l[h]^=y[h];c.push(...l),y=w}const u=c[c.length-1];if(u<1||u>16)throw new Error("Invalid PKCS7 padding");return c.length-=u,P(c)}function y0(t,r,e){switch(t){case"xor":return A(D(C(r),e));case"rc4":return A(M(C(r),e));case"aes":return l0(r,e);default:throw new Error("Unknown algorithm: "+t)}}function p0(t,r,e){switch(t){case"xor":return P(D(K(r),e));case"rc4":return P(M(K(r),e));case"aes":return b0(r,e);default:throw new Error("Unknown algorithm: "+t)}}const h0=String.raw`// ============ XOR + Base64 通用加解密（JavaScript） ============
// 单函数封装：encrypt(text, key) / decrypt(cipher, key)，复制即用
// 加密: base64( utf8(text) XOR key 字节循环 )   解密: utf8( base64_decode(cipher) XOR key )

function encrypt(text, key) {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = (str) => {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      let code = str.codePointAt(i)
      if (code > 0xffff) i++
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return bytes
  }
  const toB64 = (bytes) => {
    let out = ''
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i]
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
      out += B64[b0 >> 2]
      out += B64[((b0 & 3) << 4) | (b1 >> 4)]
      out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '='
      out += i + 2 < bytes.length ? B64[b2 & 63] : '='
    }
    return out
  }
  const k = utf8(key)
  if (!k.length) throw new Error('Key cannot be empty')
  return toB64(utf8(text).map((b, i) => b ^ k[i % k.length]))
}

function decrypt(cipher, key) {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = (str) => {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      let code = str.codePointAt(i)
      if (code > 0xffff) i++
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return bytes
  }
  const fromB64 = (b64) => {
    b64 = b64.replace(/\s+/g, '')
    const bytes = []
    let buffer = 0, bits = 0
    for (const ch of b64) {
      if (ch === '=') break
      const val = B64.indexOf(ch)
      if (val === -1) throw new Error('Invalid Base64')
      buffer = (buffer << 6) | val
      bits += 6
      if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 0xff) }
    }
    return bytes
  }
  const toUtf8 = (bytes) => {
    const arr = new Uint8Array(bytes)
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(arr)
    let out = ''
    for (let i = 0; i < arr.length; i++) {
      let c = arr[i]
      if (c < 0x80) out += String.fromCharCode(c)
      else if (c < 0xe0) out += String.fromCharCode(((c & 0x1f) << 6) | (arr[++i] & 0x3f))
      else if (c < 0xf0) out += String.fromCharCode(((c & 0x0f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f))
      else {
        const cp = ((c & 0x07) << 18) | ((arr[++i] & 0x3f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f)
        out += String.fromCodePoint(cp)
      }
    }
    return out
  }
  const k = utf8(key)
  if (!k.length) throw new Error('Key cannot be empty')
  return toUtf8(fromB64(cipher).map((b, i) => b ^ k[i % k.length]))
}

// 示例
// const cipher = encrypt('你好 world', 'my-secret-key')
// console.log(cipher)
// console.log(decrypt(cipher, 'my-secret-key'))
`,m0=String.raw`<?php
// ============ XOR + Base64 通用加解密（PHP） ============
// 单函数封装：encrypt($text, $key) / decrypt($cipher, $key)，复制即用
// 加密: base64( utf8(text) XOR key )   解密: utf8( base64_decode(cipher) XOR key )

function encrypt($text, $key) {
    $B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    $utf8 = function ($s) { return array_values(unpack('C*', $s)); };
    $b64encode = function ($bytes) use ($B64) {
        $out = '';
        $n = count($bytes);
        for ($i = 0; $i < $n; $i += 3) {
            $b0 = $bytes[$i];
            $b1 = $i + 1 < $n ? $bytes[$i + 1] : 0;
            $b2 = $i + 2 < $n ? $bytes[$i + 2] : 0;
            $out .= $B64[$b0 >> 2] . $B64[(($b0 & 3) << 4) | ($b1 >> 4)];
            $out .= $i + 1 < $n ? $B64[(($b1 & 15) << 2) | ($b2 >> 6)] : '=';
            $out .= $i + 2 < $n ? $B64[$b2 & 63] : '=';
        }
        return $out;
    };
    $k = $utf8($key);
    $n = count($k);
    if ($n === 0) throw new Exception('Key cannot be empty');
    $xored = [];
    foreach ($utf8($text) as $i => $b) $xored[] = $b ^ $k[$i % $n];
    return $b64encode($xored);
}

function decrypt($cipher, $key) {
    $B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    $utf8 = function ($s) { return array_values(unpack('C*', $s)); };
    $b64decode = function ($s) use ($B64) {
        $bytes = [];
        $buffer = 0;
        $bits = 0;
        foreach (str_split(trim($s)) as $ch) {
            if ($ch === '=') break;
            $val = strpos($B64, $ch);
            if ($val === false) throw new Exception('Invalid Base64');
            $buffer = ($buffer << 6) | $val;
            $bits += 6;
            if ($bits >= 8) { $bits -= 8; $bytes[] = ($buffer >> $bits) & 0xff; }
        }
        return $bytes;
    };
    $utf8out = function ($b) { return call_user_func_array('pack', array_merge(['C*'], $b)); };
    $k = $utf8($key);
    $n = count($k);
    if ($n === 0) throw new Exception('Key cannot be empty');
    $xored = [];
    foreach ($b64decode($cipher) as $i => $b) $xored[] = $b ^ $k[$i % $n];
    return $utf8out($xored);
}

// 示例
// echo encrypt('你好 world', 'my-secret-key'), PHP_EOL;
// echo decrypt('xxxx', 'my-secret-key'), PHP_EOL;
`,k0=String.raw`# ============ XOR + Base64 通用加解密（Python） ============
# 单函数封装：encrypt(text, key) / decrypt(cipher, key)，复制即用
# 加密: base64( utf8(text) XOR key )   解密: utf8( base64_decode(cipher) XOR key )
import base64


def encrypt(text, key):
    k = key.encode('utf-8')
    if not k:
        raise ValueError('Key cannot be empty')
    data = text.encode('utf-8')
    xored = bytes(b ^ k[i % len(k)] for i, b in enumerate(data))
    return base64.b64encode(xored).decode()


def decrypt(cipher, key):
    k = key.encode('utf-8')
    if not k:
        raise ValueError('Key cannot be empty')
    data = base64.b64decode(cipher)
    xored = bytes(b ^ k[i % len(k)] for i, b in enumerate(data))
    return xored.decode('utf-8')


# 示例
# cipher = encrypt('你好 world', 'my-secret-key')
# print(cipher)
# print(decrypt(cipher, 'my-secret-key'))
`,w0=String.raw`// ============ RC4 通用加解密（JavaScript） ============
// 单函数封装：encrypt(text, key) / decrypt(cipher, key)，复制即用
// 加密: base64( keystream XOR utf8(text) )   解密: utf8( keystream XOR base64_decode(cipher) )

function encrypt(text, key) {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = (str) => {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      let code = str.codePointAt(i)
      if (code > 0xffff) i++
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return bytes
  }
  const toB64 = (bytes) => {
    let out = ''
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i]
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
      out += B64[b0 >> 2]
      out += B64[((b0 & 3) << 4) | (b1 >> 4)]
      out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '='
      out += i + 2 < bytes.length ? B64[b2 & 63] : '='
    }
    return out
  }
  const rc4 = (input) => {
    const k = utf8(key)
    if (!k.length) throw new Error('Key cannot be empty')
    const S = []
    for (let i = 0; i < 256; i++) S[i] = i
    let j = 0
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + k[i % k.length]) & 0xff
      ;[S[i], S[j]] = [S[j], S[i]]
    }
    let i = 0
    j = 0
    const out = new Array(input.length)
    for (let n = 0; n < input.length; n++) {
      i = (i + 1) & 0xff
      j = (j + S[i]) & 0xff
      ;[S[i], S[j]] = [S[j], S[i]]
      out[n] = input[n] ^ S[(S[i] + S[j]) & 0xff]
    }
    return out
  }
  return toB64(rc4(utf8(text)))
}

function decrypt(cipher, key) {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = (str) => {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      let code = str.codePointAt(i)
      if (code > 0xffff) i++
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return bytes
  }
  const fromB64 = (b64) => {
    b64 = b64.replace(/\s+/g, '')
    const bytes = []
    let buffer = 0, bits = 0
    for (const ch of b64) {
      if (ch === '=') break
      const val = B64.indexOf(ch)
      if (val === -1) throw new Error('Invalid Base64')
      buffer = (buffer << 6) | val
      bits += 6
      if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 0xff) }
    }
    return bytes
  }
  const toUtf8 = (bytes) => {
    const arr = new Uint8Array(bytes)
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(arr)
    let out = ''
    for (let i = 0; i < arr.length; i++) {
      let c = arr[i]
      if (c < 0x80) out += String.fromCharCode(c)
      else if (c < 0xe0) out += String.fromCharCode(((c & 0x1f) << 6) | (arr[++i] & 0x3f))
      else if (c < 0xf0) out += String.fromCharCode(((c & 0x0f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f))
      else {
        const cp = ((c & 0x07) << 18) | ((arr[++i] & 0x3f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f)
        out += String.fromCodePoint(cp)
      }
    }
    return out
  }
  const rc4 = (input) => {
    const k = utf8(key)
    if (!k.length) throw new Error('Key cannot be empty')
    const S = []
    for (let i = 0; i < 256; i++) S[i] = i
    let j = 0
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + k[i % k.length]) & 0xff
      ;[S[i], S[j]] = [S[j], S[i]]
    }
    let i = 0
    j = 0
    const out = new Array(input.length)
    for (let n = 0; n < input.length; n++) {
      i = (i + 1) & 0xff
      j = (j + S[i]) & 0xff
      ;[S[i], S[j]] = [S[j], S[i]]
      out[n] = input[n] ^ S[(S[i] + S[j]) & 0xff]
    }
    return out
  }
  return toUtf8(rc4(fromB64(cipher)))
}

// 示例
// const cipher = encrypt('你好 world', 'my-secret-key')
// console.log(cipher)
// console.log(decrypt(cipher, 'my-secret-key'))
`,g0=String.raw`<?php
// ============ RC4 通用加解密（PHP） ============
// 单函数封装：encrypt($text, $key) / decrypt($cipher, $key)，复制即用
// 加密: base64( keystream XOR utf8(text) )   解密: utf8( keystream XOR base64_decode(cipher) )

function encrypt($text, $key) {
    $B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    $utf8 = function ($s) { return array_values(unpack('C*', $s)); };
    $b64encode = function ($bytes) use ($B64) {
        $out = '';
        $n = count($bytes);
        for ($i = 0; $i < $n; $i += 3) {
            $b0 = $bytes[$i];
            $b1 = $i + 1 < $n ? $bytes[$i + 1] : 0;
            $b2 = $i + 2 < $n ? $bytes[$i + 2] : 0;
            $out .= $B64[$b0 >> 2] . $B64[(($b0 & 3) << 4) | ($b1 >> 4)];
            $out .= $i + 1 < $n ? $B64[(($b1 & 15) << 2) | ($b2 >> 6)] : '=';
            $out .= $i + 2 < $n ? $B64[$b2 & 63] : '=';
        }
        return $out;
    };
    $rc4 = function ($bytes) use ($utf8, $key) {
        $k = $utf8($key);
        $n = count($k);
        if ($n === 0) throw new Exception('Key cannot be empty');
        $S = range(0, 255);
        $j = 0;
        for ($i = 0; $i < 256; $i++) {
            $j = ($j + $S[$i] + $k[$i % $n]) & 0xff;
            $t = $S[$i]; $S[$i] = $S[$j]; $S[$j] = $t;
        }
        $i = 0; $j = 0;
        $out = [];
        foreach ($bytes as $x) {
            $i = ($i + 1) & 0xff;
            $j = ($j + $S[$i]) & 0xff;
            $t = $S[$i]; $S[$i] = $S[$j]; $S[$j] = $t;
            $out[] = $x ^ $S[($S[$i] + $S[$j]) & 0xff];
        }
        return $out;
    };
    return $b64encode($rc4($utf8($text)));
}

function decrypt($cipher, $key) {
    $B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    $utf8 = function ($s) { return array_values(unpack('C*', $s)); };
    $b64decode = function ($s) use ($B64) {
        $bytes = [];
        $buffer = 0;
        $bits = 0;
        foreach (str_split(trim($s)) as $ch) {
            if ($ch === '=') break;
            $val = strpos($B64, $ch);
            if ($val === false) throw new Exception('Invalid Base64');
            $buffer = ($buffer << 6) | $val;
            $bits += 6;
            if ($bits >= 8) { $bits -= 8; $bytes[] = ($buffer >> $bits) & 0xff; }
        }
        return $bytes;
    };
    $utf8out = function ($b) { return call_user_func_array('pack', array_merge(['C*'], $b)); };
    $rc4 = function ($bytes) use ($utf8, $key) {
        $k = $utf8($key);
        $n = count($k);
        if ($n === 0) throw new Exception('Key cannot be empty');
        $S = range(0, 255);
        $j = 0;
        for ($i = 0; $i < 256; $i++) {
            $j = ($j + $S[$i] + $k[$i % $n]) & 0xff;
            $t = $S[$i]; $S[$i] = $S[$j]; $S[$j] = $t;
        }
        $i = 0; $j = 0;
        $out = [];
        foreach ($bytes as $x) {
            $i = ($i + 1) & 0xff;
            $j = ($j + $S[$i]) & 0xff;
            $t = $S[$i]; $S[$i] = $S[$j]; $S[$j] = $t;
            $out[] = $x ^ $S[($S[$i] + $S[$j]) & 0xff];
        }
        return $out;
    };
    return $utf8out($rc4($b64decode($cipher)));
}

// 示例
// echo encrypt('你好 world', 'my-secret-key'), PHP_EOL;
// echo decrypt('xxxx', 'my-secret-key'), PHP_EOL;
`,S0=String.raw`# ============ RC4 通用加解密（Python） ============
# 单函数封装：encrypt(text, key) / decrypt(cipher, key)，复制即用
# 加密: base64( keystream XOR utf8(text) )   解密: utf8( keystream XOR base64_decode(cipher) )
import base64


def encrypt(text, key):
    k = key.encode('utf-8')
    if not k:
        raise ValueError('Key cannot be empty')
    S = list(range(256))
    j = 0
    for i in range(256):
        j = (j + S[i] + k[i % len(k)]) & 0xff
        S[i], S[j] = S[j], S[i]
    i = j = 0
    out = []
    for b in text.encode('utf-8'):
        i = (i + 1) & 0xff
        j = (j + S[i]) & 0xff
        S[i], S[j] = S[j], S[i]
        out.append(b ^ S[(S[i] + S[j]) & 0xff])
    return base64.b64encode(bytes(out)).decode()


def decrypt(cipher, key):
    k = key.encode('utf-8')
    if not k:
        raise ValueError('Key cannot be empty')
    S = list(range(256))
    j = 0
    for i in range(256):
        j = (j + S[i] + k[i % len(k)]) & 0xff
        S[i], S[j] = S[j], S[i]
    i = j = 0
    out = []
    for b in base64.b64decode(cipher):
        i = (i + 1) & 0xff
        j = (j + S[i]) & 0xff
        S[i], S[j] = S[j], S[i]
        out.append(b ^ S[(S[i] + S[j]) & 0xff])
    return bytes(out).decode('utf-8')


# 示例
# cipher = encrypt('你好 world', 'my-secret-key')
# print(cipher)
# print(decrypt(cipher, 'my-secret-key'))
`,_0=String.raw`// ============ AES-128-CBC 纯手写加解密（JavaScript） ============
// 单函数封装：encrypt(text, key) / decrypt(cipher, key)，复制即用
// 输出格式: base64( 16字节随机IV + PKCS7填充密文 )，密钥需为 16 字节 UTF-8

function encrypt(text, key) {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = (str) => {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      let code = str.codePointAt(i)
      if (code > 0xffff) i++
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return bytes
  }
  const toB64 = (bytes) => {
    let out = ''
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i]
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
      out += B64[b0 >> 2]
      out += B64[((b0 & 3) << 4) | (b1 >> 4)]
      out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '='
      out += i + 2 < bytes.length ? B64[b2 & 63] : '='
    }
    return out
  }
  const SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
  ]
  const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36]
  const xtime = (x) => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff
  const expandKey = (keyBytes) => {
    const w = new Array(176)
    for (let i = 0; i < 16; i++) w[i] = keyBytes[i]
    let rcon = 0
    for (let i = 16; i < 176; i += 4) {
      let t0 = w[i-4], t1 = w[i-3], t2 = w[i-2], t3 = w[i-1]
      if (i % 16 === 0) {
        const tmp = t0; t0 = t1; t1 = t2; t2 = t3; t3 = tmp
        t0 = SBOX[t0] ^ RCON[rcon++]; t1 = SBOX[t1]; t2 = SBOX[t2]; t3 = SBOX[t3]
      }
      w[i] = w[i-16] ^ t0; w[i+1] = w[i-15] ^ t1
      w[i+2] = w[i-14] ^ t2; w[i+3] = w[i-13] ^ t3
    }
    return w
  }
  const addRoundKey = (s, w, rnd) => {
    const off = rnd * 16
    for (let i = 0; i < 16; i++) s[i] ^= w[off + i]
  }
  const shiftRows = (s, inv) => {
    for (let r = 1; r < 4; r++) {
      const row = [s[r], s[r+4], s[r+8], s[r+12]]
      for (let c = 0; c < 4; c++) s[r + 4*c] = inv ? row[(c - r + 4) % 4] : row[(c + r) % 4]
    }
  }
  const mixColumns = (s) => {
    for (let c = 0; c < 4; c++) {
      const i = c*4, a0 = s[i], a1 = s[i+1], a2 = s[i+2], a3 = s[i+3]
      s[i] = xtime(a0) ^ (xtime(a1)^a1) ^ a2 ^ a3
      s[i+1] = a0 ^ xtime(a1) ^ (xtime(a2)^a2) ^ a3
      s[i+2] = a0 ^ a1 ^ xtime(a2) ^ (xtime(a3)^a3)
      s[i+3] = (xtime(a0)^a0) ^ a1 ^ a2 ^ xtime(a3)
    }
  }
  const encryptBlock = (s, w) => {
    addRoundKey(s, w, 0)
    for (let rnd = 1; rnd < 10; rnd++) {
      for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]]
      shiftRows(s, false); mixColumns(s); addRoundKey(s, w, rnd)
    }
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]]
    shiftRows(s, false); addRoundKey(s, w, 10)
  }
  const keyBytes = utf8(key)
  if (keyBytes.length !== 16) throw new Error('AES-128 key must be 16 bytes (UTF-8)')
  const data = utf8(text)
  const pad = 16 - (data.length % 16)
  for (let i = 0; i < pad; i++) data.push(pad)
  const w = expandKey(keyBytes)
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const out = Array.from(iv)
  let prev = Array.from(iv)
  for (let i = 0; i < data.length; i += 16) {
    const st = data.slice(i, i + 16).map((b, j) => b ^ prev[j])
    encryptBlock(st, w)
    out.push(...st)
    prev = st
  }
  return toB64(out)
}

function decrypt(cipher, key) {
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const utf8 = (str) => {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      let code = str.codePointAt(i)
      if (code > 0xffff) i++
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
      else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
      else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
    return bytes
  }
  const fromB64 = (b64) => {
    b64 = b64.replace(/\s+/g, '')
    const bytes = []
    let buffer = 0, bits = 0
    for (const ch of b64) {
      if (ch === '=') break
      const val = B64.indexOf(ch)
      if (val === -1) throw new Error('Invalid Base64')
      buffer = (buffer << 6) | val
      bits += 6
      if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 0xff) }
    }
    return bytes
  }
  const toUtf8 = (bytes) => {
    const arr = new Uint8Array(bytes)
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(arr)
    let out = ''
    for (let i = 0; i < arr.length; i++) {
      let c = arr[i]
      if (c < 0x80) out += String.fromCharCode(c)
      else if (c < 0xe0) out += String.fromCharCode(((c & 0x1f) << 6) | (arr[++i] & 0x3f))
      else if (c < 0xf0) out += String.fromCharCode(((c & 0x0f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f))
      else {
        const cp = ((c & 0x07) << 18) | ((arr[++i] & 0x3f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f)
        out += String.fromCodePoint(cp)
      }
    }
    return out
  }
  const SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
  ]
  const INV_SBOX = new Array(256)
  for (let i = 0; i < 256; i++) INV_SBOX[SBOX[i]] = i
  const RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36]
  const xtime = (x) => ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff
  const gmul = (a, b) => {
    let r = 0
    while (b) { if (b & 1) r ^= a; a = xtime(a); b >>= 1 }
    return r
  }
  const expandKey = (keyBytes) => {
    const w = new Array(176)
    for (let i = 0; i < 16; i++) w[i] = keyBytes[i]
    let rcon = 0
    for (let i = 16; i < 176; i += 4) {
      let t0 = w[i-4], t1 = w[i-3], t2 = w[i-2], t3 = w[i-1]
      if (i % 16 === 0) {
        const tmp = t0; t0 = t1; t1 = t2; t2 = t3; t3 = tmp
        t0 = SBOX[t0] ^ RCON[rcon++]; t1 = SBOX[t1]; t2 = SBOX[t2]; t3 = SBOX[t3]
      }
      w[i] = w[i-16] ^ t0; w[i+1] = w[i-15] ^ t1
      w[i+2] = w[i-14] ^ t2; w[i+3] = w[i-13] ^ t3
    }
    return w
  }
  const addRoundKey = (s, w, rnd) => {
    const off = rnd * 16
    for (let i = 0; i < 16; i++) s[i] ^= w[off + i]
  }
  const shiftRows = (s, inv) => {
    for (let r = 1; r < 4; r++) {
      const row = [s[r], s[r+4], s[r+8], s[r+12]]
      for (let c = 0; c < 4; c++) s[r + 4*c] = inv ? row[(c - r + 4) % 4] : row[(c + r) % 4]
    }
  }
  const invMixColumns = (s) => {
    for (let c = 0; c < 4; c++) {
      const i = c*4, a0 = s[i], a1 = s[i+1], a2 = s[i+2], a3 = s[i+3]
      s[i] = gmul(a0,14)^gmul(a1,11)^gmul(a2,13)^gmul(a3,9)
      s[i+1] = gmul(a0,9)^gmul(a1,14)^gmul(a2,11)^gmul(a3,13)
      s[i+2] = gmul(a0,13)^gmul(a1,9)^gmul(a2,14)^gmul(a3,11)
      s[i+3] = gmul(a0,11)^gmul(a1,13)^gmul(a2,9)^gmul(a3,14)
    }
  }
  const decryptBlock = (s, w) => {
    addRoundKey(s, w, 10)
    for (let rnd = 9; rnd >= 1; rnd--) {
      shiftRows(s, true)
      for (let i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]]
      addRoundKey(s, w, rnd); invMixColumns(s)
    }
    shiftRows(s, true)
    for (let i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]]
    addRoundKey(s, w, 0)
  }
  const keyBytes = utf8(key)
  if (keyBytes.length !== 16) throw new Error('AES-128 key must be 16 bytes (UTF-8)')
  const all = fromB64(cipher)
  if (all.length < 32 || (all.length - 16) % 16 !== 0) throw new Error('Invalid ciphertext')
  const iv = all.slice(0, 16)
  const data = all.slice(16)
  const w = expandKey(keyBytes)
  const out = []
  let prev = iv
  for (let i = 0; i < data.length; i += 16) {
    const blk = data.slice(i, i + 16)
    const st = blk.slice()
    decryptBlock(st, w)
    for (let j = 0; j < 16; j++) st[j] ^= prev[j]
    out.push(...st)
    prev = blk
  }
  const pad = out[out.length - 1]
  if (pad < 1 || pad > 16) throw new Error('Invalid PKCS7 padding')
  return toUtf8(out.slice(0, out.length - pad))
}

// 示例（密钥必须是 16 字节，例如 '1234567890123456'）
// const cipher = encrypt('你好 world', '1234567890123456')
// console.log(cipher)
// console.log(decrypt(cipher, '1234567890123456'))
`,v0=String.raw`<?php
// ============ AES-128-CBC 纯手写加解密（PHP） ============
// 单函数封装：encrypt($text, $key) / decrypt($cipher, $key)，复制即用
// 输出格式: base64( 16字节随机IV + PKCS7填充密文 )，密钥需为 16 字节 UTF-8

function encrypt($text, $key) {
    $B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    $utf8 = function ($s) { return array_values(unpack('C*', $s)); };
    $b64encode = function ($bytes) use ($B64) {
        $out = '';
        $n = count($bytes);
        for ($i = 0; $i < $n; $i += 3) {
            $b0 = $bytes[$i];
            $b1 = $i + 1 < $n ? $bytes[$i + 1] : 0;
            $b2 = $i + 2 < $n ? $bytes[$i + 2] : 0;
            $out .= $B64[$b0 >> 2] . $B64[(($b0 & 3) << 4) | ($b1 >> 4)];
            $out .= $i + 1 < $n ? $B64[(($b1 & 15) << 2) | ($b2 >> 6)] : '=';
            $out .= $i + 2 < $n ? $B64[$b2 & 63] : '=';
        }
        return $out;
    };
    $SBOX = [
        0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
        0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
        0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
        0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
        0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
        0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
        0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
        0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
        0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
        0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
        0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
        0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
        0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
        0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
        0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
        0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
    ];
    $RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
    $xtime = function ($x) { return (($x << 1) ^ (($x & 0x80) ? 0x1b : 0)) & 0xff; };
    $expand_key = function ($keyBytes) use ($SBOX, $RCON) {
        $w = array_pad($keyBytes, 176, 0);
        $rcon = 0;
        for ($i = 16; $i < 176; $i += 4) {
            $t = [$w[$i-4], $w[$i-3], $w[$i-2], $w[$i-1]];
            if ($i % 16 === 0) {
                $t = [$t[1], $t[2], $t[3], $t[0]];
                for ($j = 0; $j < 4; $j++) $t[$j] = $SBOX[$t[$j]];
                $t[0] ^= $RCON[$rcon++];
            }
            for ($j = 0; $j < 4; $j++) $w[$i+$j] = $w[$i-16+$j] ^ $t[$j];
        }
        return $w;
    };
    $add_round_key = function (&$s, $w, $rnd) {
        $off = $rnd * 16;
        for ($i = 0; $i < 16; $i++) $s[$i] ^= $w[$off + $i];
    };
    $shift_rows = function (&$s, $inv) {
        for ($r = 1; $r < 4; $r++) {
            $row = [$s[$r], $s[$r+4], $s[$r+8], $s[$r+12]];
            for ($c = 0; $c < 4; $c++) $s[$r + 4*$c] = $row[($inv ? ($c - $r + 4) % 4 : ($c + $r) % 4)];
        }
    };
    $mix_columns = function (&$s) use ($xtime) {
        for ($c = 0; $c < 4; $c++) {
            $i = $c * 4;
            $a0 = $s[$i]; $a1 = $s[$i+1]; $a2 = $s[$i+2]; $a3 = $s[$i+3];
            $s[$i]   = $xtime($a0) ^ ($xtime($a1) ^ $a1) ^ $a2 ^ $a3;
            $s[$i+1] = $a0 ^ $xtime($a1) ^ ($xtime($a2) ^ $a2) ^ $a3;
            $s[$i+2] = $a0 ^ $a1 ^ $xtime($a2) ^ ($xtime($a3) ^ $a3);
            $s[$i+3] = ($xtime($a0) ^ $a0) ^ $a1 ^ $a2 ^ $xtime($a3);
        }
    };
    $encrypt_block = function (&$s, $w) use ($SBOX, $add_round_key, $shift_rows, $mix_columns) {
        $add_round_key($s, $w, 0);
        for ($rnd = 1; $rnd < 10; $rnd++) {
            for ($i = 0; $i < 16; $i++) $s[$i] = $SBOX[$s[$i]];
            $shift_rows($s, false);
            $mix_columns($s);
            $add_round_key($s, $w, $rnd);
        }
        for ($i = 0; $i < 16; $i++) $s[$i] = $SBOX[$s[$i]];
        $shift_rows($s, false);
        $add_round_key($s, $w, 10);
    };
    $keyBytes = $utf8($key);
    if (count($keyBytes) !== 16) throw new Exception('AES-128 key must be 16 bytes (UTF-8)');
    $data = $utf8($text);
    $pad = 16 - (count($data) % 16);
    for ($i = 0; $i < $pad; $i++) $data[] = $pad;
    $w = $expand_key($keyBytes);
    $iv = [];
    for ($i = 0; $i < 16; $i++) $iv[] = random_int(0, 255);
    $out = $iv;
    $prev = $iv;
    for ($i = 0; $i < count($data); $i += 16) {
        $st = array_slice($data, $i, 16);
        for ($j = 0; $j < 16; $j++) $st[$j] ^= $prev[$j];
        $encrypt_block($st, $w);
        $out = array_merge($out, $st);
        $prev = $st;
    }
    return $b64encode($out);
}

function decrypt($cipher, $key) {
    $B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    $utf8 = function ($s) { return array_values(unpack('C*', $s)); };
    $b64decode = function ($s) use ($B64) {
        $bytes = [];
        $buffer = 0;
        $bits = 0;
        foreach (str_split(trim($s)) as $ch) {
            if ($ch === '=') break;
            $val = strpos($B64, $ch);
            if ($val === false) throw new Exception('Invalid Base64');
            $buffer = ($buffer << 6) | $val;
            $bits += 6;
            if ($bits >= 8) { $bits -= 8; $bytes[] = ($buffer >> $bits) & 0xff; }
        }
        return $bytes;
    };
    $utf8out = function ($b) { return call_user_func_array('pack', array_merge(['C*'], $b)); };
    $SBOX = [
        0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
        0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
        0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
        0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
        0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
        0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
        0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
        0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
        0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
        0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
        0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
        0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
        0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
        0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
        0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
        0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
    ];
    $INV_SBOX = array_fill(0, 256, 0);
    foreach ($SBOX as $i => $v) $INV_SBOX[$v] = $i;
    $RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];
    $xtime = function ($x) { return (($x << 1) ^ (($x & 0x80) ? 0x1b : 0)) & 0xff; };
    $gmul = function ($a, $b) use ($xtime) {
        $r = 0;
        while ($b) { if ($b & 1) $r ^= $a; $a = $xtime($a); $b >>= 1; }
        return $r;
    };
    $expand_key = function ($keyBytes) use ($SBOX, $RCON) {
        $w = array_pad($keyBytes, 176, 0);
        $rcon = 0;
        for ($i = 16; $i < 176; $i += 4) {
            $t = [$w[$i-4], $w[$i-3], $w[$i-2], $w[$i-1]];
            if ($i % 16 === 0) {
                $t = [$t[1], $t[2], $t[3], $t[0]];
                for ($j = 0; $j < 4; $j++) $t[$j] = $SBOX[$t[$j]];
                $t[0] ^= $RCON[$rcon++];
            }
            for ($j = 0; $j < 4; $j++) $w[$i+$j] = $w[$i-16+$j] ^ $t[$j];
        }
        return $w;
    };
    $add_round_key = function (&$s, $w, $rnd) {
        $off = $rnd * 16;
        for ($i = 0; $i < 16; $i++) $s[$i] ^= $w[$off + $i];
    };
    $shift_rows = function (&$s, $inv) {
        for ($r = 1; $r < 4; $r++) {
            $row = [$s[$r], $s[$r+4], $s[$r+8], $s[$r+12]];
            for ($c = 0; $c < 4; $c++) $s[$r + 4*$c] = $row[($inv ? ($c - $r + 4) % 4 : ($c + $r) % 4)];
        }
    };
    $inv_mix_columns = function (&$s) use ($gmul) {
        for ($c = 0; $c < 4; $c++) {
            $i = $c * 4;
            $a0 = $s[$i]; $a1 = $s[$i+1]; $a2 = $s[$i+2]; $a3 = $s[$i+3];
            $s[$i]   = $gmul($a0,14) ^ $gmul($a1,11) ^ $gmul($a2,13) ^ $gmul($a3,9);
            $s[$i+1] = $gmul($a0,9)  ^ $gmul($a1,14) ^ $gmul($a2,11) ^ $gmul($a3,13);
            $s[$i+2] = $gmul($a0,13) ^ $gmul($a1,9)  ^ $gmul($a2,14) ^ $gmul($a3,11);
            $s[$i+3] = $gmul($a0,11) ^ $gmul($a1,13) ^ $gmul($a2,9)  ^ $gmul($a3,14);
        }
    };
    $decrypt_block = function (&$s, $w) use ($INV_SBOX, $add_round_key, $shift_rows, $inv_mix_columns) {
        $add_round_key($s, $w, 10);
        for ($rnd = 9; $rnd >= 1; $rnd--) {
            $shift_rows($s, true);
            for ($i = 0; $i < 16; $i++) $s[$i] = $INV_SBOX[$s[$i]];
            $add_round_key($s, $w, $rnd);
            $inv_mix_columns($s);
        }
        $shift_rows($s, true);
        for ($i = 0; $i < 16; $i++) $s[$i] = $INV_SBOX[$s[$i]];
        $add_round_key($s, $w, 0);
    };
    $keyBytes = $utf8($key);
    if (count($keyBytes) !== 16) throw new Exception('AES-128 key must be 16 bytes (UTF-8)');
    $all = $b64decode($cipher);
    $cnt = count($all);
    if ($cnt < 32 || ($cnt - 16) % 16 !== 0) throw new Exception('Invalid ciphertext');
    $iv = array_slice($all, 0, 16);
    $data = array_slice($all, 16);
    $w = $expand_key($keyBytes);
    $out = [];
    $prev = $iv;
    for ($i = 0; $i < count($data); $i += 16) {
        $blk = array_slice($data, $i, 16);
        $st = $blk;
        $decrypt_block($st, $w);
        for ($j = 0; $j < 16; $j++) $st[$j] ^= $prev[$j];
        $out = array_merge($out, $st);
        $prev = $blk;
    }
    $pad = $out[count($out) - 1];
    if ($pad < 1 || $pad > 16) throw new Exception('Invalid PKCS7 padding');
    return $utf8out(array_slice($out, 0, count($out) - $pad));
}

// 示例（密钥必须是 16 字节，例如 '1234567890123456'）
// echo encrypt('你好 world', '1234567890123456'), PHP_EOL;
// echo decrypt('xxxx', '1234567890123456'), PHP_EOL;
`,B0=String.raw`# ============ AES-128-CBC 纯手写加解密（Python） ============
# 单函数封装：encrypt(text, key) / decrypt(cipher, key)，复制即用
# 输出格式: base64( 16字节随机IV + PKCS7填充密文 )，密钥需为 16 字节 UTF-8
import base64
import os

SBOX = [
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
]
INV_SBOX = [0] * 256
for i, v in enumerate(SBOX):
    INV_SBOX[v] = i
RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36]


def encrypt(text, key):
    kb = key.encode('utf-8')
    if len(kb) != 16:
        raise ValueError('AES-128 key must be 16 bytes (UTF-8)')
    data = list(text.encode('utf-8'))
    pad = 16 - len(data) % 16
    data += [pad] * pad

    def xtime(x):
        return ((x << 1) ^ (0x1b if x & 0x80 else 0)) & 0xff

    def expand_key(key_bytes):
        w = list(key_bytes) + [0] * 160
        rcon = 0
        for i in range(16, 176, 4):
            t = w[i - 4:i]
            if i % 16 == 0:
                t = t[1:] + t[:1]
                t = [SBOX[x] for x in t]
                t[0] ^= RCON[rcon]
                rcon += 1
            for j in range(4):
                w[i + j] = w[i - 16 + j] ^ t[j]
        return w

    def add_round_key(s, w, rnd):
        off = rnd * 16
        for i in range(16):
            s[i] ^= w[off + i]

    def shift_rows(s, inv):
        for r in range(1, 4):
            row = [s[r], s[r + 4], s[r + 8], s[r + 12]]
            for c in range(4):
                s[r + 4 * c] = row[(c - r) % 4] if inv else row[(c + r) % 4]

    def mix_columns(s):
        for c in range(4):
            i = c * 4
            a0, a1, a2, a3 = s[i], s[i + 1], s[i + 2], s[i + 3]
            s[i] = xtime(a0) ^ (xtime(a1) ^ a1) ^ a2 ^ a3
            s[i + 1] = a0 ^ xtime(a1) ^ (xtime(a2) ^ a2) ^ a3
            s[i + 2] = a0 ^ a1 ^ xtime(a2) ^ (xtime(a3) ^ a3)
            s[i + 3] = (xtime(a0) ^ a0) ^ a1 ^ a2 ^ xtime(a3)

    def encrypt_block(s, w):
        add_round_key(s, w, 0)
        for rnd in range(1, 10):
            for i in range(16):
                s[i] = SBOX[s[i]]
            shift_rows(s, False)
            mix_columns(s)
            add_round_key(s, w, rnd)
        for i in range(16):
            s[i] = SBOX[s[i]]
        shift_rows(s, False)
        add_round_key(s, w, 10)

    w = expand_key(kb)
    iv = list(os.urandom(16))
    out = iv[:]
    prev = iv[:]
    for i in range(0, len(data), 16):
        st = [data[i + j] ^ prev[j] for j in range(16)]
        encrypt_block(st, w)
        out += st
        prev = st
    return base64.b64encode(bytes(out)).decode()


def decrypt(cipher, key):
    kb = key.encode('utf-8')
    if len(kb) != 16:
        raise ValueError('AES-128 key must be 16 bytes (UTF-8)')
    allb = list(base64.b64decode(cipher))
    if len(allb) < 32 or (len(allb) - 16) % 16:
        raise ValueError('Invalid ciphertext')

    def xtime(x):
        return ((x << 1) ^ (0x1b if x & 0x80 else 0)) & 0xff

    def gmul(a, b):
        r = 0
        while b:
            if b & 1:
                r ^= a
            a = xtime(a)
            b >>= 1
        return r

    def expand_key(key_bytes):
        w = list(key_bytes) + [0] * 160
        rcon = 0
        for i in range(16, 176, 4):
            t = w[i - 4:i]
            if i % 16 == 0:
                t = t[1:] + t[:1]
                t = [SBOX[x] for x in t]
                t[0] ^= RCON[rcon]
                rcon += 1
            for j in range(4):
                w[i + j] = w[i - 16 + j] ^ t[j]
        return w

    def add_round_key(s, w, rnd):
        off = rnd * 16
        for i in range(16):
            s[i] ^= w[off + i]

    def shift_rows(s, inv):
        for r in range(1, 4):
            row = [s[r], s[r + 4], s[r + 8], s[r + 12]]
            for c in range(4):
                s[r + 4 * c] = row[(c - r) % 4] if inv else row[(c + r) % 4]

    def inv_mix_columns(s):
        for c in range(4):
            i = c * 4
            a0, a1, a2, a3 = s[i], s[i + 1], s[i + 2], s[i + 3]
            s[i] = gmul(a0, 14) ^ gmul(a1, 11) ^ gmul(a2, 13) ^ gmul(a3, 9)
            s[i + 1] = gmul(a0, 9) ^ gmul(a1, 14) ^ gmul(a2, 11) ^ gmul(a3, 13)
            s[i + 2] = gmul(a0, 13) ^ gmul(a1, 9) ^ gmul(a2, 14) ^ gmul(a3, 11)
            s[i + 3] = gmul(a0, 11) ^ gmul(a1, 13) ^ gmul(a2, 9) ^ gmul(a3, 14)

    def decrypt_block(s, w):
        add_round_key(s, w, 10)
        for rnd in range(9, 0, -1):
            shift_rows(s, True)
            for i in range(16):
                s[i] = INV_SBOX[s[i]]
            add_round_key(s, w, rnd)
            inv_mix_columns(s)
        shift_rows(s, True)
        for i in range(16):
            s[i] = INV_SBOX[s[i]]
        add_round_key(s, w, 0)

    iv = allb[:16]
    data = allb[16:]
    w = expand_key(kb)
    out = []
    prev = iv
    for i in range(0, len(data), 16):
        blk = data[i:i + 16]
        st = blk[:]
        decrypt_block(st, w)
        out += [st[j] ^ prev[j] for j in range(16)]
        prev = blk
    pad = out[-1]
    if pad < 1 or pad > 16:
        raise ValueError('Invalid PKCS7 padding')
    return bytes(out[:-pad]).decode('utf-8')


# 示例（密钥必须是 16 字节，例如 '1234567890123456'）
# cipher = encrypt('你好 world', '1234567890123456')
# print(cipher)
# print(decrypt(cipher, '1234567890123456'))
`,j0=["js","php","py"];function F(t,r){const e={xor:{js:h0,php:m0,py:k0},rc4:{js:w0,php:g0,py:S0},aes:{js:_0,php:v0,py:B0}},x=e[t]||e.xor;return x[r]||x.js}const C0={class:"tool-panel"},O0={class:"tool-header"},X0={class:"tool-title"},E0={class:"tool-desc"},R0={class:"toolbar"},P0=["placeholder"],A0={key:0,class:"key-hint"},K0={class:"output-box"},V0={key:0,class:"output-inner"},T0={class:"crypto-output"},I0={key:1,class:"empty-hint"},N0={class:"code-section"},U0={class:"code-header"},H0={class:"code-title"},L0={class:"code-tabs"},F0=["onClick"],D0={class:"code-body"},M0=["innerHTML"],J0={__name:"CryptoTool",setup(t){const r=v("xor"),e=v(""),x=v(""),o=v(""),i=v(""),n=v(""),c=v("js"),{show:y}=i0(),u=R(()=>c.value==="js"?"js":c.value==="php"?"php":"python"),k=R(()=>F(r.value,c.value)),w=R(()=>c0(k.value,u.value));x0(r,()=>{c.value="js",l("","")});function l(g,$){i.value=g,n.value=$||""}function h(){return e.value.trim()?!0:(l(a("crypto.emptyKey"),"err"),!1)}function q(){if(x.value&&h())try{o.value=y0(r.value,x.value,e.value),l(a("crypto.encryptDone"),"ok")}catch(g){o.value="",l(g.message||String(g),"err")}}function z(){if(x.value&&h())try{o.value=p0(r.value,x.value.trim(),e.value),l(a("crypto.decryptDone"),"ok")}catch(g){o.value="",l(g.message||String(g),"err")}}function G(){x.value="",o.value="",e.value="",l("","")}async function Q(){await H(o.value)&&y(a("common.copied"))}async function W(){await H(F(r.value,c.value))&&y(a("common.copied"))}return(g,$)=>(S(),_("div",C0,[s("div",O0,[s("div",X0,b(d(a)("tools.crypto.name")),1),s("div",E0,b(d(a)("tools.crypto.desc")),1)]),s("div",R0,[T(s("select",{"onUpdate:modelValue":$[0]||($[0]=p=>r.value=p),class:"algo-select"},[...$[3]||($[3]=[s("option",{value:"xor"},"XOR + Base64",-1),s("option",{value:"rc4"},"RC4",-1),s("option",{value:"aes"},"AES-128-CBC",-1)])],512),[[e0,r.value]]),T(s("input",{"onUpdate:modelValue":$[1]||($[1]=p=>e.value=p),placeholder:d(a)("crypto.keyPlaceholder"),class:"key-input",type:"text",spellcheck:"false"},null,8,P0),[[t0,e.value]]),s("button",{class:"primary",onClick:q},b(d(a)("crypto.encrypt")),1),s("button",{onClick:z},b(d(a)("crypto.decrypt")),1),$[4]||($[4]=s("span",{class:"spacer"},null,-1)),s("button",{onClick:G},"🗑 "+b(d(a)("common.clear")),1)]),r.value==="aes"?(S(),_("div",A0,"⚠️ "+b(d(a)("crypto.aesKeyHint")),1)):I("",!0),E(n0,{modelValue:x.value,"onUpdate:modelValue":$[2]||($[2]=p=>x.value=p),placeholder:d(a)("crypto.inputPlaceholder"),"min-height":"180px"},null,8,["modelValue","placeholder"]),i.value?(S(),_("div",{key:1,class:N(["status",n.value])},b(i.value),3)):I("",!0),s("div",K0,[o.value?(S(),_("div",V0,[E(L,{text:o.value,class:"crypto-lines"},{default:U(()=>[s("pre",T0,b(o.value),1)]),_:1},8,["text"]),s("button",{class:"copy-btn",onClick:Q},b(d(a)("common.copy")),1)])):(S(),_("div",I0,b(d(a)("common.result")),1))]),s("div",N0,[s("div",U0,[s("span",H0,"🧰 "+b(d(a)("crypto.codeTitle")),1),s("div",L0,[(S(!0),_(r0,null,o0(d(j0),p=>(S(),_("button",{key:p,class:N(["code-tab",{active:c.value===p}]),onClick:Y0=>c.value=p},b(d(a)("crypto.lang."+p)),11,F0))),128))]),$[5]||($[5]=s("span",{class:"spacer"},null,-1)),s("button",{onClick:W},b(d(a)("common.copy")),1)]),s("div",D0,[E(L,{text:k.value,class:"code-lines"},{default:U(()=>[s("pre",{innerHTML:w.value},null,8,M0)]),_:1},8,["text"])])])]))}},Z0=Z(J0,[["__scopeId","data-v-10d2e022"]]);export{Z0 as default};
