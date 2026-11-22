"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Search, Plus, Trash2, ArrowRight } from "lucide-react";

export type DsaMode = "array" | "linked-list" | "bst" | "sorting";

export interface DsaVisualizerProps {
  className?: string;
  initialMode?: DsaMode;
}

interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number;
  y?: number;
}

function createInitialBst(): TreeNode | null {
  const insertNode = (root: TreeNode | null, val: number): TreeNode => {
    if (!root) return { val, left: null, right: null };
    if (val < root.val) root.left = insertNode(root.left, val);
    else if (val > root.val) root.right = insertNode(root.right, val);
    return root;
  };

  let r: TreeNode | null = null;
  for (const v of [50, 30, 70, 20, 40, 60, 85]) {
    r = insertNode(r, v);
  }
  return r;
}

export function DsaVisualizer({ className = "", initialMode = "sorting" }: DsaVisualizerProps) {
  const [mode, setMode] = useState<DsaMode>(initialMode);

  // --- 1. Array State ---
  const [arr, setArr] = useState<number[]>([15, 42, 8, 23, 74, 31, 56, 19]);
  const [arrHighlight, setArrHighlight] = useState<number | null>(null);
  const [arrPointers, setArrPointers] = useState<{ low?: number; mid?: number; high?: number }>({});
  const [searchValue, setSearchValue] = useState<number>(23);
  const [newVal, setNewVal] = useState<number>(99);
  const [insertIdx, setInsertIdx] = useState<number>(2);
  const [arrMessage, setArrMessage] = useState<string>("Ready for array operations.");

  // --- 2. Linked List State ---
  const [llNodes, setLlNodes] = useState<number[]>([10, 25, 40, 75, 90]);
  const [llActiveIdx, setLlActiveIdx] = useState<number | null>(null);
  const [llMessage, setLlMessage] = useState<string>("Singly linked list initialized.");

  // --- 3. BST State ---
  const [bstRoot, setBstRoot] = useState<TreeNode | null>(createInitialBst);
  const [bstHighlight, setBstHighlight] = useState<number | null>(null);
  const [bstInput, setBstInput] = useState<number>(45);
  const [bstMessage, setBstMessage] = useState<string>("Binary Search Tree ready.");

  // --- 4. Sorting Visualizer State ---
  const [sortArr, setSortArr] = useState<number[]>([45, 12, 89, 34, 67, 23, 90, 11, 56, 78]);
  const [comparing, setComparing] = useState<[number, number] | null>(null);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [sortAlgo, setSortAlgo] = useState<"bubble" | "selection" | "insertion">("bubble");
  const [comparisons, setComparisons] = useState<number>(0);
  const [swaps, setSwaps] = useState<number>(0);

  const isSortingRef = useRef(isSorting);
  useEffect(() => {
    isSortingRef.current = isSorting;
  }, [isSorting]);

  // Array Search (Linear)
  const runLinearSearch = async () => {
    setArrMessage(`Starting Linear Search for ${searchValue}...`);
    for (let i = 0; i < arr.length; i++) {
      setArrHighlight(i);
      setArrMessage(`Inspecting index ${i}: value = ${arr[i]}`);
      await new Promise((r) => setTimeout(r, 400));
      if (arr[i] === searchValue) {
        setArrMessage(`Found ${searchValue} at index ${i}! O(N) complexity.`);
        return;
      }
    }
    setArrHighlight(null);
    setArrMessage(`Value ${searchValue} not found in array.`);
  };

  // Array Search (Binary)
  const runBinarySearch = async () => {
    const sorted = [...arr].sort((a, b) => a - b);
    setArr(sorted);
    setArrMessage(`Sorted array for Binary Search. Searching for ${searchValue}...`);
    let low = 0;
    let high = sorted.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      setArrPointers({ low, mid, high });
      setArrHighlight(mid);
      setArrMessage(`low = ${low}, mid = ${mid} (${sorted[mid]}), high = ${high}`);
      await new Promise((r) => setTimeout(r, 600));

      if (sorted[mid] === searchValue) {
        setArrMessage(`Found ${searchValue} at index ${mid}! O(log N) iterations.`);
        return;
      }
      if (sorted[mid] < searchValue) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    setArrHighlight(null);
    setArrPointers({});
    setArrMessage(`Value ${searchValue} not present in array.`);
  };

  // Linked List Traversals
  const traverseLinkedList = async () => {
    setLlMessage("Traversing singly linked list: current = head; while(current)...");
    for (let i = 0; i < llNodes.length; i++) {
      setLlActiveIdx(i);
      setLlMessage(`Node ${i}: data = ${llNodes[i]}, next -> ${i < llNodes.length - 1 ? `Node(${llNodes[i + 1]})` : "NULL"}`);
      await new Promise((r) => setTimeout(r, 500));
    }
    setLlActiveIdx(null);
    setLlMessage("Reached end of list (NULL pointer). Traversal complete.");
  };

  // BST Search
  const searchBst = async (target: number) => {
    setBstMessage(`Searching BST for key ${target}...`);
    let curr = bstRoot;
    while (curr) {
      setBstHighlight(curr.val);
      await new Promise((r) => setTimeout(r, 600));
      if (curr.val === target) {
        setBstMessage(`Key ${target} located in BST! O(h) path depth.`);
        return;
      }
      if (target < curr.val) {
        setBstMessage(`${target} < ${curr.val}: Branching LEFT`);
        curr = curr.left;
      } else {
        setBstMessage(`${target} > ${curr.val}: Branching RIGHT`);
        curr = curr.right;
      }
    }
    setBstHighlight(null);
    setBstMessage(`Key ${target} does not exist in BST.`);
  };

  const insertBst = (val: number) => {
    const insertNode = (root: TreeNode | null, v: number): TreeNode => {
      if (!root) return { val: v, left: null, right: null };
      if (v < root.val) root.left = insertNode(root.left, v);
      else if (v > root.val) root.right = insertNode(root.right, v);
      return root;
    };
    const clone = bstRoot ? JSON.parse(JSON.stringify(bstRoot)) as TreeNode : null;
    const newRoot = insertNode(clone, val);
    setBstRoot(newRoot);
    setBstMessage(`Inserted ${val} into BST according to invariant (left < root < right).`);
  };

  // Sorting: Bubble Sort
  const runBubbleSort = async () => {
    setIsSorting(true);
    setComparisons(0);
    setSwaps(0);
    const a = [...sortArr];
    const n = a.length;
    let compCount = 0;
    let swapCount = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!isSortingRef.current) return;
        setComparing([j, j + 1]);
        compCount++;
        setComparisons(compCount);
        await new Promise((r) => setTimeout(r, 120));

        if (a[j] > a[j + 1]) {
          const tmp = a[j];
          a[j] = a[j + 1];
          a[j + 1] = tmp;
          swapCount++;
          setSwaps(swapCount);
          setSortArr([...a]);
          await new Promise((r) => setTimeout(r, 120));
        }
      }
      setSortedIndices((prev) => [...prev, n - i - 1]);
    }
    setComparing(null);
    setIsSorting(false);
  };

  // Sorting: Selection Sort
  const runSelectionSort = async () => {
    setIsSorting(true);
    setComparisons(0);
    setSwaps(0);
    const a = [...sortArr];
    const n = a.length;
    let compCount = 0;
    let swapCount = 0;

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        if (!isSortingRef.current) return;
        setComparing([minIdx, j]);
        compCount++;
        setComparisons(compCount);
        await new Promise((r) => setTimeout(r, 120));
        if (a[j] < a[minIdx]) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        const tmp = a[i];
        a[i] = a[minIdx];
        a[minIdx] = tmp;
        swapCount++;
        setSwaps(swapCount);
        setSortArr([...a]);
        await new Promise((r) => setTimeout(r, 120));
      }
      setSortedIndices((prev) => [...prev, i]);
    }
    setSortedIndices(Array.from({ length: n }, (_, idx) => idx));
    setComparing(null);
    setIsSorting(false);
  };

  const resetSortArr = () => {
    setIsSorting(false);
    setComparing(null);
    setSortedIndices([]);
    setComparisons(0);
    setSwaps(0);
    setSortArr([45, 12, 89, 34, 67, 23, 90, 11, 56, 78]);
  };

  // Layout BST coordinates for SVG
  const layoutBst = (node: TreeNode | null, x: number, y: number, offset: number): void => {
    if (!node) return;
    node.x = x;
    node.y = y;
    if (node.left) layoutBst(node.left, x - offset, y + 45, offset / 2);
    if (node.right) layoutBst(node.right, x + offset, y + 45, offset / 2);
  };

  if (bstRoot) {
    layoutBst(bstRoot, 140, 25, 60);
  }

  const renderBstLines = (node: TreeNode | null): React.ReactNode => {
    if (!node || node.x === undefined || node.y === undefined) return null;
    return (
      <>
        {node.left && node.left.x !== undefined && (
          <line x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="#475569" strokeWidth="2" />
        )}
        {node.right && node.right.x !== undefined && (
          <line x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="#475569" strokeWidth="2" />
        )}
        {node.left && renderBstLines(node.left)}
        {node.right && renderBstLines(node.right)}
      </>
    );
  };

  const renderBstNodes = (node: TreeNode | null): React.ReactNode => {
    if (!node || node.x === undefined || node.y === undefined) return null;
    const isAct = bstHighlight === node.val;
    return (
      <>
        <circle
          cx={node.x}
          cy={node.y}
          r="14"
          fill={isAct ? "#3b82f6" : "#1e293b"}
          stroke={isAct ? "#60a5fa" : "#64748b"}
          strokeWidth="2"
        />
        <text
          x={node.x}
          y={node.y + 4}
          textAnchor="middle"
          fill={isAct ? "#ffffff" : "#e2e8f0"}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {node.val}
        </text>
        {node.left && renderBstNodes(node.left)}
        {node.right && renderBstNodes(node.right)}
      </>
    );
  };

  return (
    <div
      className={`dsa-visualizer-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="dsa-visualizer"
    >
      {/* Header and Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Interactive Data Structure &amp; Algorithm Visualizer
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Step through contiguous arrays, linked pointer chains, binary search trees, and in-place sorting routines.
          </p>
        </div>

        <div className="flex flex-wrap items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("sorting")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "sorting" ? "bg-indigo-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Sorting
          </button>
          <button
            type="button"
            onClick={() => setMode("array")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "array" ? "bg-indigo-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Array &amp; Search
          </button>
          <button
            type="button"
            onClick={() => setMode("linked-list")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "linked-list" ? "bg-indigo-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Linked List
          </button>
          <button
            type="button"
            onClick={() => setMode("bst")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              mode === "bst" ? "bg-indigo-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            BST Tree
          </button>
        </div>
      </div>

      {/* 1. Sorting Tab */}
      {mode === "sorting" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Algorithm:</span>
              {(["bubble", "selection"] as const).map((algo) => (
                <button
                  key={algo}
                  type="button"
                  onClick={() => setSortAlgo(algo)}
                  className={`rounded px-2.5 py-1 font-mono uppercase font-bold ${
                    sortAlgo === algo ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {algo} sort
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={sortAlgo === "bubble" ? runBubbleSort : runSelectionSort}
                disabled={isSorting}
                className="flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1 font-bold"
              >
                <Play size={12} /> Run Sort
              </button>
              <button
                type="button"
                onClick={resetSortArr}
                className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          <div className="h-44 w-full border border-[var(--border-subtle)] rounded-xl bg-[#030712] p-4 flex items-end justify-center gap-2">
            {sortArr.map((val, idx) => {
              const isComp = comparing && (comparing[0] === idx || comparing[1] === idx);
              const isSorted = sortedIndices.includes(idx);
              const barHeight = Math.max(16, (val / 100) * 120);

              return (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1 max-w-[36px]">
                  <span className="font-mono text-[10px] text-slate-400">{val}</span>
                  <div
                    style={{ height: `${barHeight}px` }}
                    className={`w-full rounded-t transition-all duration-150 ${
                      isComp
                        ? "bg-amber-400 shadow-lg shadow-amber-500/50"
                        : isSorted
                        ? "bg-emerald-500"
                        : "bg-indigo-500"
                    }`}
                  />
                  <span className="font-mono text-[9px] text-slate-500">{idx}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Comparisons</span>
              <span className="font-mono text-base font-bold text-indigo-400">{comparisons}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Swaps</span>
              <span className="font-mono text-base font-bold text-amber-400">{swaps}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Worst Case</span>
              <span className="font-mono text-base font-bold text-rose-400">O(N²)</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Aux Space</span>
              <span className="font-mono text-base font-bold text-emerald-400">O(1) In-Place</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Array & Search Tab */}
      {mode === "array" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Target Value:</span>
              <input
                type="number"
                value={searchValue}
                onChange={(e) => setSearchValue(Number(e.target.value))}
                className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-center"
              />
              <button
                type="button"
                onClick={runLinearSearch}
                className="rounded bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 font-semibold flex items-center gap-1"
              >
                <Search size={12} /> Linear O(N)
              </button>
              <button
                type="button"
                onClick={runBinarySearch}
                className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 font-semibold flex items-center gap-1"
              >
                <Search size={12} /> Binary O(log N)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Val"
                value={newVal}
                onChange={(e) => setNewVal(Number(e.target.value))}
                className="w-14 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-center"
              />
              <input
                type="number"
                placeholder="Idx"
                min="0"
                max={arr.length}
                value={insertIdx}
                onChange={(e) => setInsertIdx(Number(e.target.value))}
                className="w-14 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-center"
              />
              <button
                type="button"
                onClick={() => {
                  const copy = [...arr];
                  copy.splice(insertIdx, 0, newVal);
                  setArr(copy);
                  setArrMessage(`Inserted ${newVal} at index ${insertIdx}. Shifted right elements (O(N) operation).`);
                }}
                className="rounded bg-emerald-600 text-white px-2 py-1 font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> Insert
              </button>
            </div>
          </div>

          {/* Array Grid */}
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[#030712] flex flex-wrap gap-2 items-center justify-center min-h-[100px]">
            {arr.map((val, idx) => {
              const isHighlight = arrHighlight === idx;
              const isLow = arrPointers.low === idx;
              const isMid = arrPointers.mid === idx;
              const isHigh = arrPointers.high === idx;

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-12 w-12 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-sm transition-all ${
                      isHighlight
                        ? "border-blue-400 bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50"
                        : "border-slate-700 bg-slate-900 text-slate-200"
                    }`}
                  >
                    {val}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">[{idx}]</span>
                  <div className="flex gap-0.5 text-[9px] font-mono font-bold">
                    {isLow && <span className="text-emerald-400">L</span>}
                    {isMid && <span className="text-amber-400">M</span>}
                    {isHigh && <span className="text-rose-400">H</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs text-blue-300">
            {arrMessage}
          </div>
        </div>
      )}

      {/* 3. Linked List Tab */}
      {mode === "linked-list" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={traverseLinkedList}
                className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 font-bold flex items-center gap-1"
              >
                <Play size={12} /> Traverse Nodes
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newVal}
                onChange={(e) => setNewVal(Number(e.target.value))}
                className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-center"
              />
              <button
                type="button"
                onClick={() => {
                  setLlNodes([newVal, ...llNodes]);
                  setLlMessage(`Inserted Node(${newVal}) at HEAD. Time complexity O(1).`);
                }}
                className="rounded bg-emerald-600 text-white px-2 py-1 font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> Add Head
              </button>
              <button
                type="button"
                onClick={() => {
                  setLlNodes([...llNodes, newVal]);
                  setLlMessage(`Inserted Node(${newVal}) at TAIL. Time complexity O(N) or O(1) with tail pointer.`);
                }}
                className="rounded bg-teal-600 text-white px-2 py-1 font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> Add Tail
              </button>
              <button
                type="button"
                onClick={() => {
                  if (llNodes.length > 0) {
                    setLlNodes(llNodes.slice(1));
                    setLlMessage("Removed head node. Old head freed (O(1)).");
                  }
                }}
                className="rounded bg-rose-600 text-white px-2 py-1 font-semibold flex items-center gap-1"
              >
                <Trash2 size={12} /> Pop Head
              </button>
            </div>
          </div>

          {/* Linked List Canvas */}
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[#030712] overflow-x-auto min-h-[110px] flex items-center gap-3">
            <span className="font-mono text-xs text-amber-400 font-bold border border-amber-500/30 px-2 py-1 rounded bg-amber-950/20">
              HEAD
            </span>
            <ArrowRight size={14} className="text-amber-400" />

            {llNodes.map((val, idx) => {
              const isAct = llActiveIdx === idx;
              return (
                <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`rounded-lg border-2 flex items-center overflow-hidden transition-all ${
                      isAct
                        ? "border-blue-400 scale-105 shadow-lg shadow-blue-500/50"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <div
                      className={`px-3 py-2 font-mono text-xs font-bold ${
                        isAct ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {val}
                    </div>
                    <div className="px-2 py-2 font-mono text-[10px] text-slate-400 bg-slate-900 border-l border-slate-700">
                      *next
                    </div>
                  </div>
                  {idx < llNodes.length - 1 ? (
                    <ArrowRight size={14} className="text-slate-500" />
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                      <ArrowRight size={14} />
                      <span className="font-bold text-rose-400">NULL</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs text-indigo-300">
            {llMessage}
          </div>
        </div>
      )}

      {/* 4. BST Tab */}
      {mode === "bst" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">BST Key:</span>
              <input
                type="number"
                value={bstInput}
                onChange={(e) => setBstInput(Number(e.target.value))}
                className="w-16 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-center"
              />
              <button
                type="button"
                onClick={() => searchBst(bstInput)}
                className="rounded bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 font-semibold flex items-center gap-1"
              >
                <Search size={12} /> Search Key
              </button>
              <button
                type="button"
                onClick={() => insertBst(bstInput)}
                className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> Insert Key
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              In-Order: Left &lt; Root &lt; Right
            </div>
          </div>

          {/* BST SVG Canvas */}
          <div className="h-44 w-full border border-[var(--border-subtle)] rounded-xl bg-[#030712] p-2 flex items-center justify-center">
            <svg viewBox="0 0 280 160" className="w-full h-full">
              {renderBstLines(bstRoot)}
              {renderBstNodes(bstRoot)}
            </svg>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs text-emerald-300">
            {bstMessage}
          </div>
        </div>
      )}
    </div>
  );
}
