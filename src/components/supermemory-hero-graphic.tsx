"use client";

import { useState } from "react";

const learningFields = [
  { id: "software", label: "Software", x: 48, y: 34, labelY: 21 },
  { id: "web-ai", label: "AI + web", x: 112, y: 20, labelY: 8 },
  { id: "data", label: "Data", x: 208, y: 20, labelY: 8 },
  { id: "visual", label: "Visual media", x: 272, y: 43, labelY: 30 },
  { id: "logic", label: "Digital logic", x: 272, y: 130, labelY: 151 },
  { id: "circuits", label: "Circuits", x: 208, y: 151, labelY: 171 },
  { id: "embedded", label: "Embedded", x: 112, y: 151, labelY: 171 },
  { id: "systems", label: "Systems", x: 48, y: 130, labelY: 151 },
] as const;

export function SupermemoryHeroGraphic() {
  const [activeField, setActiveField] = useState<string | null>(null);

  return (
    <figure className="lab-figure" aria-label="KATALYST learning pipeline across software, hardware, data, AI, and visual media">
      <div className="lab-figure-topline">
        <span><i aria-hidden="true" /> ONE STUDIO / MANY FIELDS</span>
        <span className="lab-figure-index">FIG. 01</span>
      </div>

      <svg className="pipeline-diagram" viewBox="0 0 600 216" role="img" aria-labelledby="pipeline-title pipeline-description">
        <title id="pipeline-title">The KATALYST learning loop</title>
        <desc id="pipeline-description">Explore a field, learn through lessons and interactive labs, then build understanding across software, hardware, circuits, data, AI, and visual media. AI requests are routed securely through the app.</desc>
        <defs>
          <linearGradient id="pipeline-flow-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="#38bdf8" stopOpacity=".35" />
            <stop offset=".52" stopColor="#6366f1" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity=".35" />
          </linearGradient>
          <filter id="pipeline-node-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path className="pipeline-gridline" d="M0 54H600M0 108H600M0 162H600M100 0V216M200 0V216M300 0V216M400 0V216M500 0V216" />
        <path className="pipeline-flow" d="M173 104H236M365 104H427" />
        <path className="pipeline-flow-arrow" d="m229 98 8 6-8 6M420 98l8 6-8 6" />
        <circle className="pipeline-signal" r="2.3">
          <animateMotion dur="2.8s" repeatCount="indefinite" path="M173 104H236" />
        </circle>
        <circle className="pipeline-signal pipeline-signal-delayed" r="2.3">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M365 104H427" />
        </circle>
        <g className="pipeline-node pipeline-node-source">
          <rect x="31" y="62" width="142" height="84" rx="3" />
          <text className="pipeline-node-index" x="45" y="82">01 / EXPLORE</text>
          <circle className="pipeline-node-pulse" cx="53" cy="105" r="4" />
          <text className="pipeline-node-title" x="45" y="130">Questions + ideas</text>
          <text className="pipeline-node-subtitle" x="45" y="140">any field can begin here</text>
        </g>
        <g className="pipeline-node pipeline-node-engine">
          <rect x="237" y="62" width="128" height="84" rx="3" />
          <text className="pipeline-node-index" x="251" y="82">02 / LEARN</text>
          <circle className="pipeline-orbit" cx="301" cy="107" r="13" />
          <circle className="pipeline-core" cx="301" cy="107" r="4" />
          <text className="pipeline-node-title" x="251" y="133">Lessons + labs</text>
          <text className="pipeline-node-subtitle" x="251" y="143">tools across disciplines</text>
        </g>
        <g className="pipeline-node pipeline-node-output">
          <rect x="427" y="62" width="142" height="84" rx="3" />
          <text className="pipeline-node-index" x="441" y="82">03 / CONNECT</text>
          <path d="M442 105h23m-23 7h34m-34 7h16" />
          <circle className="pipeline-output-pulse" cx="550" cy="118" r="4" />
          <text className="pipeline-node-title" x="441" y="137">Ideas in action</text>
        </g>
        <text className="pipeline-zero-server" x="30" y="190">BROWSER LABS RUN LOCALLY</text>
        <text className="pipeline-zero-server" x="568" y="190" textAnchor="end">AI REQUESTS ROUTED SECURELY</text>
      </svg>

      <div className="constellation-heading"><span>LEARNING CONSTELLATION</span><span>08 FIELDS</span></div>
      <svg className="track-constellation" viewBox="0 0 320 184" role="group" aria-label="All KATALYST learning fields connected in one system">
        <g className="constellation-edges" aria-hidden="true">
          {learningFields.map((field) => (
            <line
              key={field.id}
              className={`constellation-edge${activeField === null || activeField === field.id ? " is-connected" : ""}`}
              x1="160" y1="87" x2={field.x} y2={field.y}
            />
          ))}
          <line className="constellation-edge constellation-cross-edge" x1="48" y1="34" x2="112" y2="151" />
          <line className="constellation-edge constellation-cross-edge" x1="112" y1="20" x2="208" y2="151" />
          <line className="constellation-edge constellation-cross-edge" x1="208" y1="20" x2="272" y2="130" />
          <line className="constellation-edge constellation-cross-edge" x1="48" y1="130" x2="272" y2="43" />
        </g>
        <circle className="constellation-center-ring" cx="160" cy="87" r="19" aria-hidden="true" />
        <circle className="constellation-center" cx="160" cy="87" r="5" aria-hidden="true" />
        <text className="constellation-center-label" x="160" y="115" textAnchor="middle">KATALYST</text>
        {learningFields.map((field) => (
          <g
            key={field.id}
            className={`constellation-track${activeField === field.id ? " is-active" : ""}`}
            tabIndex={0}
            role="button"
            aria-label={`Highlight ${field.label} field`}
            onMouseEnter={() => setActiveField(field.id)}
            onMouseLeave={() => setActiveField(null)}
            onFocus={() => setActiveField(field.id)}
            onBlur={() => setActiveField(null)}
          >
            <circle className="constellation-hitbox" cx={field.x} cy={field.y} r="17" />
            <circle className="constellation-node" cx={field.x} cy={field.y} r="4" />
            <text className="constellation-label" x={field.x} y={field.labelY} textAnchor="middle">{field.label}</text>
          </g>
        ))}
      </svg>

      <figcaption><span>ONE LEARNING LOOP · MANY DISCIPLINES</span><span>HOVER OR FOCUS A FIELD</span></figcaption>
    </figure>
  );
}
