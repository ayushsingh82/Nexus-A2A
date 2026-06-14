"use client";

import { useEffect, useRef, useState } from "react";
import type { Agent, Delegation } from "@/agents/types";

type Node = {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  color: string;
  isOrchestrator?: boolean;
};

type Particle = {
  edgeIndex: number;
  t: number;
  speed: number;
};

const PROTOCOL_IMAGES: Record<string, string> = {
  "aave":       "/logos/aave.svg",
  "uniswap-lp": "/logos/uniswap.svg",
  "lido":       "/logos/lido.svg",
};

const NODES: Node[] = [
  { id: "master",     label: "Orchestrator", sublabel: "ERC-7715",    x: 120, y: 180, color: "#0001FC", isOrchestrator: true },
  { id: "aave",       label: "Aave Agent",   sublabel: "USDC supply", x: 370, y: 80,  color: "#9333ea" },
  { id: "uniswap-lp", label: "Uniswap LP",   sublabel: "USDC/ETH LP", x: 370, y: 180, color: "#ff007a" },
  { id: "lido",       label: "Lido Agent",   sublabel: "ETH staking", x: 370, y: 280, color: "#00a3ff" },
];

const EDGES = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getCurvePoint(from: Node, to: Node, t: number) {
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 - 20;
  const x = lerp(lerp(from.x, cx, t), lerp(cx, to.x, t), t);
  const y = lerp(lerp(from.y, cy, t), lerp(cy, to.y, t), t);
  return { x, y };
}

export default function DelegationFlow({
  agents,
  delegations,
  running,
}: {
  agents: Agent[];
  delegations: Delegation[];
  running: boolean;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!running) {
      setParticles([]);
      return;
    }

    const spawnInterval = setInterval(() => {
      setParticles((ps) => {
        const edge = Math.floor(Math.random() * EDGES.length);
        const newP: Particle = { edgeIndex: edge, t: 0, speed: 0.004 + Math.random() * 0.003 };
        return [...ps.slice(-18), newP];
      });
    }, 280);

    function tick(time: number) {
      const dt = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      setParticles((ps) =>
        ps
          .map((p) => ({ ...p, t: p.t + p.speed * (dt / 16) }))
          .filter((p) => p.t < 1)
      );
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearInterval(spawnInterval);
      cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  function getAgentData(nodeId: string) {
    const roleId = nodeId === "lido" ? "perp-funding" : nodeId;
    const agent = agents.find((a) => a.role === roleId);
    const del = delegations.find((d) => d.to === roleId);
    return { agent, del };
  }

  return (
    <div style={{ position: "relative", width: "100%", height: 360 }}>
      <svg
        viewBox="0 0 520 360"
        style={{ width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {NODES.map((n) => (
            <radialGradient key={n.id} id={`grad-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0.04" />
            </radialGradient>
          ))}
          {NODES.filter((n) => !n.isOrchestrator).map((n) => (
            <clipPath key={`clip-${n.id}`} id={`clip-${n.id}`}>
              <circle cx="0" cy="0" r="14" />
            </clipPath>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edge paths */}
        {EDGES.map((e, i) => {
          const from = NODES[e.from];
          const to = NODES[e.to];
          const cx = (from.x + to.x) / 2;
          const cy = (from.y + to.y) / 2 - 20;
          const { del } = getAgentData(to.id);
          const isActive = del?.status === "active";
          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
                stroke={isActive ? to.color : "rgba(0,0,0,0.12)"}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray={isActive ? "none" : "4 4"}
                fill="none"
                opacity={isActive ? 0.5 : 0.35}
              />
              {/* ERC-7710 label on edge */}
              <text
                x={cx}
                y={cy - 8}
                fontSize="8"
                fill="rgba(0,0,0,0.35)"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                ERC-7710
              </text>
            </g>
          );
        })}

        {/* Animated fund particles */}
        {particles.map((p, i) => {
          const edge = EDGES[p.edgeIndex];
          const from = NODES[edge.from];
          const to = NODES[edge.to];
          const pos = getCurvePoint(from, to, p.t);
          const opacity = p.t < 0.1 ? p.t * 10 : p.t > 0.9 ? (1 - p.t) * 10 : 1;
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r={4} fill={to.color} opacity={opacity * 0.3} filter="url(#glow)" />
              <circle cx={pos.x} cy={pos.y} r={2.5} fill={to.color} opacity={opacity} />
              <circle cx={pos.x} cy={pos.y} r={1.5} fill="#fff" opacity={opacity * 0.8} />
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map((node) => {
          const { agent, del } = getAgentData(node.id);
          const isActive = agent?.status === "active" || node.isOrchestrator;
          const deployedUsdc = agent?.deployedUsdc ?? 0;
          const apyBps = agent?.currentApyBps ?? 0;
          const capUsdc = del?.capUsdc ?? (node.isOrchestrator ? 500000 : 0);

          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {/* Glow ring when active */}
              {isActive && (
                <circle r={28} fill={`url(#grad-${node.id})`} />
              )}

              {/* Outer ring */}
              <circle
                r={22}
                fill="white"
                stroke={node.color}
                strokeWidth={isActive ? 2 : 1}
                opacity={isActive ? 1 : 0.6}
              />

              {/* Inner circle */}
              <circle r={16} fill={node.isOrchestrator ? node.color : "white"} opacity={node.isOrchestrator ? 1 : 0.1} />

              {/* Icon: text for orchestrator, protocol image for agents */}
              {node.isOrchestrator ? (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fill="#fff"
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                >
                  N
                </text>
              ) : (
                <image
                  href={PROTOCOL_IMAGES[node.id]}
                  x="-14"
                  y="-14"
                  width="28"
                  height="28"
                  clipPath={`url(#clip-${node.id})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              )}

              {/* Status dot */}
              <circle
                cx={16}
                cy={-16}
                r={4}
                fill={isActive ? "#16a34a" : "rgba(0,0,0,0.15)"}
              />

              {/* Label */}
              <text
                y={32}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#000"
                fontFamily="system-ui, sans-serif"
              >
                {node.label}
              </text>
              <text
                y={44}
                textAnchor="middle"
                fontSize="9"
                fill="#8a8d99"
                fontFamily="system-ui, sans-serif"
              >
                {node.sublabel}
              </text>

              {/* Stats */}
              {!node.isOrchestrator && deployedUsdc > 0 && (
                <text
                  y={57}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={node.color}
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${(deployedUsdc / 1000).toFixed(0)}k · {(apyBps / 100).toFixed(1)}%
                </text>
              )}
              {node.isOrchestrator && (
                <text
                  y={57}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={node.color}
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  cap ${(capUsdc / 1000).toFixed(0)}k USDC
                </text>
              )}
            </g>
          );
        })}

        {/* USDC label */}
        <text x="10" y="350" fontSize="9" fill="rgba(0,0,0,0.3)" fontFamily="JetBrains Mono, monospace">
          USDC · Base Sepolia · ERC-7710 subdelegation
        </text>
      </svg>
    </div>
  );
}
