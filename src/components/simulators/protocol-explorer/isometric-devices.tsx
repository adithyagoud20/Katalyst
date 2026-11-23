"use client";

import React from "react";

// Mathematical constants for 30-degree isometric projection
const hp = Math.cos(Math.PI / 6); // ~0.8660254
const gp = 0.5;

function vp(e: number, t: number) {
  return (n: number, r: number, i: number = 0): [number, number] => [
    e + (n - r) * hp,
    t + (n + r) * gp - i,
  ];
}

const yp = ([e, t]: [number, number]) => `${e.toFixed(2)},${t.toFixed(2)}`;
const bp = (e: [number, number][], t = "") => `<polygon points="${e.map(yp).join(" ")}" ${t}/>`;
const xp = (e: [number, number][], t = "") => `<polyline points="${e.map(yp).join(" ")}" fill="none" ${t}/>`;

function Sp(
  e: (n: number, r: number, i?: number) => [number, number],
  t: number,
  n: number,
  r: number,
  i: number,
  a: number,
  o: number
) {
  return {
    top: (x: number, y: number) => e(t + x, n + y, r + o),
    left: (x: number, z: number) => e(t + x, n + a, r + z),
    right: (y: number, z: number) => e(t + i, n + a - y, r + z),
  };
}

const U = (
  e: (i: number, a: number) => [number, number],
  t: number,
  n: number,
  r: number,
  i: number,
  a = ""
) => bp([e(t, n), e(t + r, n), e(t + r, n + i), e(t, n + i)], a);

function Cp(
  e: (i: number, a: number) => [number, number],
  t: number,
  n: number,
  r: number,
  i = ""
) {
  const a: [number, number][] = [];
  for (let idx = 0; idx < 28; idx++) {
    const o = (idx / 28) * Math.PI * 2;
    a.push(e(t + r * Math.cos(o), n + r * Math.sin(o)));
  }
  return bp(a, i);
}

function wp(
  e: (n: number, r: number, i?: number) => [number, number],
  t: number,
  n: number,
  r: number,
  i: number,
  a: number,
  o: number,
  s: { top?: string; left?: string; right?: string; stroke?: string; sw?: number } = {}
) {
  const {
    top: c = "#1e293b",
    left: l = "#0f172a",
    right: u = "#090e1a",
    stroke: d = "#38bdf8",
    sw: f = 1.7,
  } = s;
  const p = `stroke="${d}" stroke-width="${f}" stroke-linejoin="round"`;
  return [
    bp([e(t, n, r + o), e(t + i, n, r + o), e(t + i, n + a, r + o), e(t, n + a, r + o)], `fill="${c}" ${p}`),
    bp([e(t, n + a, r), e(t + i, n + a, r), e(t + i, n + a, r + o), e(t, n + a, r + o)], `fill="${l}" ${p}`),
    bp([e(t + i, n + a, r), e(t + i, n, r), e(t + i, n, r + o), e(t + i, n + a, r + o)], `fill="${u}" ${p}`),
  ].join("");
}

function Tp(
  e: (i: number, a: number) => [number, number],
  t: number,
  n: number,
  r: number,
  i: number,
  a: number,
  o: string
) {
  let s = "";
  for (let c = a; c < r; c += a) s += xp([e(t + c, n), e(t + c, n + i)], o);
  for (let c = a; c < i; c += a) s += xp([e(t, n + c), e(t + r, n + c)], o);
  return s;
}

function Op(
  e: (n: number, r: number, i?: number) => [number, number],
  t: number,
  n: number,
  r: number,
  i: number,
  a: number
) {
  return bp([e(t + r, n), e(t + r + a, n), e(t + r + a, n + i), e(t + r, n + i)], `fill="rgba(0,0,0,0.5)"`);
}

interface DeviceProps {
  x: number;
  y: number;
  isActive?: boolean;
  isBounce?: boolean;
}

/**
 * Isometric Laptop (Client) matching protocolexplorer.org Fp()
 */
export function IsometricLaptop({ x, y, isActive, isBounce }: DeviceProps) {
  const strokeColor = isActive ? "#38bdf8" : "#60a5fa";
  const W = `stroke="${strokeColor}"`;
  const Ep = `${W} stroke-width="1.3" stroke-linejoin="round"`;

  const n = vp(x, y);
  const r = Sp(n, 0, 0, 0, 56, 86, 5);
  let i = Op(n, -4, 0, 60, 86, 30);
  i += bp([n(-4, 86), n(56, 86), n(66, 94), n(-4, 94)], `fill="rgba(0,0,0,0.4)"`);
  const a = (e2: number) => (t2: number, r2: number) => n(e2 - (3 * r2) / 64, 85 - t2, 5 + r2);
  const o = a(-7);
  const s = a(0);
  const c = (
    e2: (i2: number, o2: number) => [number, number],
    t2: number,
    n2: number,
    r2: number,
    i2: number
  ) => [e2(t2, n2), e2(t2 + r2, n2), e2(t2 + r2, n2 + i2), e2(t2, n2 + i2)];

  i += bp(c(o, 0, 0, 82, 64), `fill="#1e293b" ${W} stroke-width="2" stroke-linejoin="round"`);
  i += bp([o(0, 0), s(0, 0), s(0, 64), o(0, 64)], `fill="#0f172a" ${W} stroke-width="1.6" stroke-linejoin="round"`);
  i += bp([o(0, 64), s(0, 64), s(82, 64), o(82, 64)], `fill="#0f172a" ${W} stroke-width="1.6" stroke-linejoin="round"`);
  i += bp(c(s, 0, 0, 82, 64), `fill="#0f172a" ${W} stroke-width="2" stroke-linejoin="round"`);
  i += bp(c(s, 4.5, 5, 73, 54.5), `fill="#0284c7" fill-opacity="0.25" ${W} stroke-width="1.5" stroke-linejoin="round"`);
  i += bp(c(s, 4.5, 50, 73, 9.5), `fill="#090e1a" ${W} stroke-width="1.2" stroke-linejoin="round"`);
  i += xp([s(9, 54.7), s(24, 54.7)], `stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"`);
  i += `<g class="screen-content">`;
  i += bp(c(s, 10, 13, 22, 24), `fill="#38bdf8" fill-opacity="0.3" stroke="none"`);
  for (let idx = 0; idx < 4; idx++) {
    i += xp([s(38, 33 - idx * 6), s(68, 33 - idx * 6)], `stroke="#38bdf8" stroke-width="3.2" stroke-linecap="round"`);
  }
  i += `</g>`;
  i += wp(n, 0, 0, 0, 56, 86, 5, { top: "#1e293b", left: "#0f172a", right: "#090e1a", stroke: strokeColor, sw: 2.1 });
  const l = r.top;
  i += U(l, 6, 9, 27, 68, `fill="#090e1a" ${W} stroke-width="1.6"`);
  for (let e2 = 11.4; e2 < 33; e2 += 5.4) i += xp([l(e2, 9), l(e2, 77)], `stroke="${strokeColor}" stroke-width="0.9"`);
  for (let e2 = 13.85; e2 < 77; e2 += 4.85) i += xp([l(6, e2), l(33, e2)], `stroke="${strokeColor}" stroke-width="0.9"`);
  i += U(l, 38, 28, 13, 30, `fill="#334155" ${Ep}`);

  return (
    <g
      className={`device-laptop transition-transform duration-300 ${isBounce ? "-translate-y-1" : ""}`}
      dangerouslySetInnerHTML={{ __html: i }}
    />
  );
}

/**
 * Isometric Router matching protocolexplorer.org kp()
 */
export function IsometricRouter({ x, y, isActive, isBounce }: DeviceProps) {
  const strokeColor = isActive ? "#38bdf8" : "#60a5fa";
  const W = `stroke="${strokeColor}"`;
  const Ep = `${W} stroke-width="1.3" stroke-linejoin="round"`;
  const Dp = { top: "#1e293b", left: "#0f172a", right: "#090e1a", stroke: strokeColor };

  const r = vp(x, y);
  const i = Sp(r, 0, 0, 0, 70, 70, 33);
  let a = Op(r, 0, 0, 70, 70, 34);
  a += wp(r, 0, 0, 0, 70, 70, 33, { ...Dp, sw: 2.2 });
  for (const [e2, t2] of [
    [9, 7],
    [19.5, 5],
    [28, 7],
    [39, 5],
  ]) {
    a += U(i.top, e2, 30.5, t2, 5, `fill="#38bdf8" fill-opacity="0.3" ${W} stroke-width="1.5"`);
  }
  a += U(i.top, 30, 32, 3, 2, `fill="${strokeColor}" stroke="none"`);
  const o = i.left;
  a += Cp(o, 9.5, 17, 5, `fill="none" ${W} stroke-width="2.6"`);
  a += U(o, 17, 13, 3.6, 8, `fill="${strokeColor}" stroke="none"`);
  a += U(o, 15.5, 20, 6.6, 2, `fill="${strokeColor}" stroke="none"`);
  a += U(o, 15.5, 11.5, 6.6, 2, `fill="${strokeColor}" stroke="none"`);
  a += U(o, 30, 8, 13, 11, `fill="#1e293b" ${W} stroke-width="2"`);
  const s = i.right;
  a += U(s, 9, 9, 52, 15, `fill="#0f172a" ${W} stroke-width="2"`);
  a += U(s, 13, 12, 44, 9, `fill="#0284c7" fill-opacity="0.2" ${Ep}`);
  for (let e2 = 0; e2 < 3; e2++) a += xp([s(16, 14 + e2 * 2.6), s(54, 14 + e2 * 2.6)], `stroke="#38bdf8" stroke-width="0.9"`);

  const [c, l] = i.top(16, 8);
  a += `<ellipse cx="${c}" cy="${l}" rx="5.2" ry="2.8" fill="#1e293b" ${W} stroke-width="1.5"/>`;
  a += `<path d="M${c - 3.2},${l} L${c - 1.4},${l - 40} L${c + 1.4},${l - 40} L${c + 3.2},${l} Z" fill="#1e293b" ${W} stroke-width="1.6" stroke-linejoin="round"/>`;
  a += `<circle cx="${c}" cy="${l - 43.5}" r="4" fill="#38bdf8" ${W} stroke-width="1.8"/>`;

  return (
    <g
      className={`device-router transition-transform duration-300 ${isBounce ? "-translate-y-1.5" : ""}`}
      dangerouslySetInnerHTML={{ __html: a }}
    />
  );
}

/**
 * Isometric DNS Resolver matching protocolexplorer.org Np()
 */
export function IsometricDnsResolver({ x, y, isActive, isBounce }: DeviceProps) {
  const strokeColor = isActive ? "#38bdf8" : "#60a5fa";
  const W = `stroke="${strokeColor}"`;
  const Ep = `${W} stroke-width="1.3" stroke-linejoin="round"`;
  const Dp = { top: "#1e293b", left: "#0f172a", right: "#090e1a", stroke: strokeColor };

  const n = vp(x, y);
  const r = 40.5;
  const i2 = 40.5;
  const a = 13.6;
  let o = Op(n, 0, 0, r, i2, 30);
  o += wp(n, 1.5, 1.5, 0, 37.5, 37.5, 46.6, { top: "#1e293b", left: "#0f172a", right: "#090e1a", stroke: strokeColor });
  for (let e2 = 0; e2 < 3; e2++) {
    const t2 = e2 * 16.5;
    const s = Sp(n, 0, 0, t2, r, i2, a);
    o += wp(n, 0, 0, t2, r, i2, a, { ...Dp, sw: 1.9 });
    if (e2 === 0) {
      o += U(s.left, 4, 3.8, 7, 5.6, `fill="#38bdf8" ${Ep}`);
      o += U(s.left, 13, 3.8, 9, 5.6, `fill="#22c55e" ${Ep}`);
      o += U(s.left, 24, 3.8, 6, 5.6, `fill="#38bdf8" ${Ep}`);
    } else {
      o += U(s.left, 4, 3.8, 27, 5.6, `fill="#38bdf8" ${Ep}`);
      o += U(s.left, 4, 3.8, 9, 5.6, `fill="#22c55e" stroke="none"`);
    }
    o += U(s.right, 4, 3.8, 32, 5.6, `fill="#0f172a" ${Ep}`);
    if (e2 === 2) {
      o += U(s.top, 8.5, 8.5, 23.5, 23.5, `fill="#090e1a" ${W} stroke-width="1.6"`);
      o += Tp(s.top, 8.5, 8.5, 23.5, 23.5, 2.6, `stroke="#38bdf8" stroke-width="0.6"`);
    }
  }

  return (
    <g
      className={`device-dns transition-transform duration-300 ${isBounce ? "-translate-y-1.5" : ""}`}
      dangerouslySetInnerHTML={{ __html: o }}
    />
  );
}

/**
 * Isometric Web Server matching protocolexplorer.org Pp()
 */
export function IsometricWebServer({ x, y, isActive, isBounce }: DeviceProps) {
  const strokeColor = isActive ? "#38bdf8" : "#60a5fa";
  const W = `stroke="${strokeColor}"`;
  const Ep = `${W} stroke-width="1.3" stroke-linejoin="round"`;

  const n = vp(x, y);
  const r = 56.6;
  const i2 = 56.6;
  const a = Sp(n, 0, 0, 0, r, i2, 70);
  let o = Op(n, 0, 0, r, i2, 40);
  o += wp(n, 0, 0, 0, r, i2, 70, { top: "#1e293b", left: "#0f172a", right: "#090e1a", stroke: strokeColor, sw: 2.3 });
  o += U(a.top, 10, 10, 37, 37, `fill="#090e1a" ${W} stroke-width="1.2"`);
  for (let e2 = 2.2; e2 < 37; e2 += 2.2) o += xp([a.top(10 + e2, 10), a.top(10 + e2, 47)], `stroke="#38bdf8" stroke-width="0.7"`);
  const s = a.left;
  for (let e2 = 0; e2 < 3; e2++) {
    const t2 = 6 + e2 * 20.5;
    o += U(s, 4.5, t2, 47.5, 17, `fill="#1e293b" ${W} stroke-width="2"`);
    o += U(s, 7.5, t2 + 3, 41.5, 11, `fill="#0284c7" fill-opacity="0.2" ${Ep}`);
    for (const [e3, n2] of [
      [10, 5],
      [16, 3],
      [21, 3],
      [36, 3.4],
    ]) {
      o += U(s, e3, t2 + 5, n2, 7, `fill="#38bdf8" stroke="none"`);
    }
    o += U(s, 26, t2 + 6, 7, 5, `fill="#22c55e" stroke="none"`);
  }
  const c = a.right;
  const l = `fill="none" ${W} stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"`;
  o += U(c, 8, 34, 40, 27, `fill="#0f172a" ${l}`);
  o += xp([c(8, 52), c(30, 52), c(30, 46), c(48, 46)], l);
  o += xp([c(14, 40), c(26, 40), c(26, 34)], l);
  o += xp([c(36, 61), c(36, 54), c(44, 54)], l);
  o += U(c, 8, 9, 16, 15, `fill="#0f172a" ${l}`);
  o += U(c, 30, 9, 16, 15, `fill="#0f172a" ${l}`);
  o += xp([c(30, 19), c(36, 19), c(36, 24)], l);
  o += `<circle cx="${c(47, 1)[0]}" cy="${c(47, 1)[1]}" r="2.6" fill="${strokeColor}"/>`;

  return (
    <g
      className={`device-web transition-transform duration-300 ${isBounce ? "-translate-y-1.5" : ""}`}
      dangerouslySetInnerHTML={{ __html: o }}
    />
  );
}

/**
 * Isometric Internet Cloud matching protocolexplorer.org Ip()
 */
export function IsometricInternetCloud({ x, y, isActive, isBounce }: DeviceProps) {
  const strokeColor = isActive ? "#38bdf8" : "#60a5fa";
  const W = `stroke="${strokeColor}"`;

  const n = [
    [-60, 10, 21],
    [-32, -16, 20],
    [-6, -36, 17],
    [22, -36, 26],
    [46, -16, 20],
    [58, 3, 22],
    [40, 22, 24],
    [-24, 24, 24],
    [8, 2, 32],
    [-20, 6, 26],
  ];
  const r = (r2: string, i2 = 0, a2 = 0) =>
    n.map(([n2, o, s]) => `<circle cx="${x + n2 + i2}" cy="${y + o + a2}" r="${s}" ${r2}/>`).join("");
  const i = x + 20;
  const a = y;
  const o = 19.5;

  const html = `<g class="device cloud">
    <ellipse cx="${x + 12}" cy="${y + 44}" rx="80" ry="10" fill="rgba(0,0,0,0.5)"/>
    ${r(`fill="#0f172a" ${W} stroke-width="4.6"`)}
    <g fill="none" ${W} stroke-width="2.4" stroke-linecap="round">
      <circle cx="${i}" cy="${a}" r="${o}" fill="#090e1a"/>
      <ellipse cx="${i}" cy="${a}" rx="8.5" ry="${o}"/>
      <line x1="${i}" y1="${a - o}" x2="${i}" y2="${a + o}"/>
      <path d="M${i - o},${a} H${i + o}"/>
      <path d="M${i - 16},${a - 10} Q${i},${a - 5} ${i + 16},${a - 10} M${i - 16},${a + 10} Q${i},${a + 15} ${i + 16},${a + 10}"/>
    </g>
  </g>`;

  return (
    <g
      className={`device-cloud transition-transform duration-300 ${isBounce ? "-translate-y-1.5" : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
