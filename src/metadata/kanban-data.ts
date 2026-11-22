import { MetricStat } from "./types";

export interface KanbanIssueItem {
  id: string;
  key: string;
  title: string;
  column: "backlog" | "todo" | "progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignees: string[];
  labels: { name: string; tone?: "success" | "warning" | "danger" | "info" | "neutral" | "accent" }[];
  comments?: number;
  attachments?: number;
  subtasks?: { done: number; total: number };
  due?: Date;
}

export interface KanbanColumnItem {
  id: string;
  title: string;
  color?: string;
  wipLimit?: number;
}

export const initialKanbanColumns: KanbanColumnItem[] = [
  { color: "var(--color-muted-foreground)", id: "backlog", title: "Backlog" },
  { color: "var(--color-chart-3)", id: "todo", title: "To do" },
  { color: "var(--color-chart-2)", id: "progress", title: "In progress", wipLimit: 3 },
  { color: "var(--color-chart-5)", id: "review", title: "In review", wipLimit: 2 },
  { color: "var(--color-chart-4)", id: "done", title: "Done" },
];

export const kanbanMetrics: MetricStat[] = [
  { title: "Active Sprint", value: "Sprint 24", change: "68% complete", trend: "up", description: "Sep 21 – Oct 4" },
  { title: "Completed Tasks", value: "18 / 26", change: "+4 today", trend: "up", description: "on track for release" },
  { title: "In Progress WIP", value: "3 Tasks", change: "limit: 3", trend: "neutral", description: "flow optimized" },
  { title: "Cycle Time Avg.", value: "2.4 Days", change: "-0.6 days", trend: "up", description: "velocity improved" },
];
