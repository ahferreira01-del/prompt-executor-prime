export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskWeights={concentration:number;criticality:number;coverage:number;documentation:number;revenue:number};
export const DEFAULT_RISK_CONFIG = { version: 1, docNone: 100, docPartial: 50, docComplete: 10, weights: { concentration: .25, criticality: .20, coverage: .20, documentation: .15, revenue: .20 } satisfies RiskWeights } as const;
export function calculateKci(counts: number[]) { const total = counts.reduce((a,b)=>a+b,0); return total ? Math.max(...counts.map(v=>v/total*100)) : 0; }
export function classifyConcentration(value:number) { return value > 80 ? "HIGH_CONCENTRATION" : "NORMAL"; }
export function classifyBusFactor(count:number): RiskLevel { if (count <= 1) return "CRITICAL"; if (count === 2) return "HIGH"; if (count === 3) return "MEDIUM"; return "LOW"; }
export function calculateCdi(counts:number[]) { return calculateKci(counts); }
export function isCriticalDependency(value:number) { return value > 80; }
export function calculateRevenueAtRisk(revenue:number, dependency:number) { return revenue * Math.max(0,Math.min(100,dependency))/100; }
export function isCriticalExpert(value:number) { return value > 70; }
export function calculateKrr(scores:{concentration:number;criticality:number;coverage:number;documentation:number;revenue:number}, weights:RiskWeights=DEFAULT_RISK_CONFIG.weights) { return Math.max(0,Math.min(100,Object.entries(weights).reduce((sum,[key,weight])=>sum+scores[key as keyof typeof scores]*weight,0))); }
export function classifyKrr(score:number):RiskLevel { if(score<=30)return "LOW"; if(score<=60)return "MEDIUM"; if(score<=80)return "HIGH"; return "CRITICAL"; }
export function calculateVersionedKrr(input:{configurationId:string;version:number;scores:{concentration:number;criticality:number;coverage:number;documentation:number;revenue:number};weights?:RiskWeights}) { return { score: calculateKrr(input.scores,input.weights), configurationId:input.configurationId, configurationVersion:input.version }; }
