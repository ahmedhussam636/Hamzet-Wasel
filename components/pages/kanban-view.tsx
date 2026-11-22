"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Kanban1,
  kanban1ExampleProps,
  kanbanLabels,
  type SprintIssue,
} from "@/components/dashboardblocks/kanban/kanban-01";
import {
  type KanbanLabelDef,
  type KanbanPriorityLevel,
  KanbanPriority,
  moveItem,
} from "@/components/dashboardblocks/kanban";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartRefreshButton,
  DashboardBusy,
  useChartRefresh,
  usePageBlockState,
  type DashboardBlockStateProps,
} from "@/components/dashboard-state";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CalendarIcon,
  CheckCircle2Icon,
  FilterIcon,
  ListChecksIcon,
  MessageSquareIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
}

interface CommentItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface RichSprintIssue extends SprintIssue {
  description?: string;
  subtaskItems?: SubtaskItem[];
  commentItems?: CommentItem[];
  archived?: boolean;
  archivedAt?: string;
}

interface PersistedKanbanState {
  issues: Array<
    Omit<RichSprintIssue, "due"> & {
      due?: string;
    }
  >;
  collapsedColumns: Record<string, boolean>;
  nextIssueNumber: number;
}

const STORAGE_KEY = "hamzet-wasel-kanban-board-v1";

const TEAM_MEMBERS = [
  "Ahmed Hassan",
  "Priya Nair",
  "Noah Becker",
  "Tomás Ortega",
  "Aiko Tanaka",
  "Lena Fischer",
];

const LABEL_OPTIONS: KanbanLabelDef[] = Object.values(kanbanLabels);

const PRIORITY_OPTIONS: { value: KanbanPriorityLevel; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function createDefaultSubtasks(
  id: string,
  subtasks?: { done: number; total: number }
): SubtaskItem[] {
  if (!subtasks || subtasks.total <= 0) return [];
  const sampleTitles = [
    "Review acceptance criteria",
    "Implement core logic",
    "Add validation & edge cases",
    "Verify responsive UI",
    "Write regression tests",
    "Deploy to staging",
  ];
  return Array.from({ length: subtasks.total }, (_, index) => ({
    id: `${id}-sub-${index + 1}`,
    title: sampleTitles[index % sampleTitles.length],
    done: index < subtasks.done,
  }));
}

function createDefaultComments(
  id: string,
  count?: number,
  assignees: string[] = []
): CommentItem[] {
  if (!count || count <= 0) return [];
  const author = assignees[0] || "Priya Nair";
  const samples = [
    "Initial investigation is complete and scoped for this sprint.",
    "Pushed a clean update for review — ready for verification.",
    "Confirmed edge cases against production telemetry.",
  ];
  return Array.from({ length: Math.min(count, 3) }, (_, index) => ({
    id: `${id}-cmt-${index + 1}`,
    author: index % 2 === 0 ? author : "Ahmed Hassan",
    text: samples[index % samples.length],
    createdAt: `${index + 1}d ago`,
  }));
}

const INITIAL_ISSUES: RichSprintIssue[] = (kanban1ExampleProps.issues ?? []).map(
  (issue) => ({
    ...issue,
    description:
      issue.description ??
      `Track delivery for "${issue.title}" within ${kanban1ExampleProps.title}.`,
    subtaskItems: createDefaultSubtasks(issue.id, issue.subtasks),
    commentItems: createDefaultComments(
      issue.id,
      issue.comments,
      issue.assignees
    ),
    archived: false,
  })
);

function getMaxIssueNumber(issues: RichSprintIssue[]): number {
  let maxNum = 171;
  for (const issue of issues) {
    const match = issue.key.match(/(\d+)$/);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) maxNum = parsed;
    }
  }
  return maxNum + 1;
}

function formatDateInput(date?: Date): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function loadBoardState(): {
  issues: RichSprintIssue[];
  collapsedColumns: Record<string, boolean>;
  nextIssueNumber: number;
} {
  if (typeof window === "undefined") {
    return {
      issues: INITIAL_ISSUES,
      collapsedColumns: {},
      nextIssueNumber: getMaxIssueNumber(INITIAL_ISSUES),
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        issues: INITIAL_ISSUES,
        collapsedColumns: {},
        nextIssueNumber: getMaxIssueNumber(INITIAL_ISSUES),
      };
    }
    const parsed = JSON.parse(raw) as PersistedKanbanState;
    if (!Array.isArray(parsed.issues)) {
      throw new Error("Invalid kanban state");
    }
    const hydrated: RichSprintIssue[] = parsed.issues.map((item) => ({
      ...item,
      due: item.due ? new Date(item.due) : undefined,
    }));
    return {
      issues: hydrated,
      collapsedColumns: parsed.collapsedColumns ?? {},
      nextIssueNumber:
        parsed.nextIssueNumber ?? getMaxIssueNumber(hydrated),
    };
  } catch {
    return {
      issues: INITIAL_ISSUES,
      collapsedColumns: {},
      nextIssueNumber: getMaxIssueNumber(INITIAL_ISSUES),
    };
  }
}

export function KanbanView(props: DashboardBlockStateProps = {}) {
  const state = usePageBlockState(props);
  const { refreshing, refreshKey, triggerRefresh } = useChartRefresh();

  const initialState = useMemo(() => loadBoardState(), []);
  const [issues, setIssues] = useState<RichSprintIssue[]>(initialState.issues);
  const [collapsedColumns, setCollapsedColumns] = useState<
    Record<string, boolean>
  >(initialState.collapsedColumns);
  const [nextIssueNumber, setNextIssueNumber] = useState<number>(
    initialState.nextIssueNumber
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    KanbanPriorityLevel | "all"
  >("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColumn, setNewColumn] = useState<string>("todo");
  const [newPriority, setNewPriority] =
    useState<KanbanPriorityLevel>("medium");
  const [newLabels, setNewLabels] = useState<KanbanLabelDef[]>([
    kanbanLabels.feature,
  ]);
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [newDue, setNewDue] = useState<string>("");
  const [newSubtaskDraft, setNewSubtaskDraft] = useState("");
  const [newSubtasks, setNewSubtasks] = useState<SubtaskItem[]>([]);

  // Detail modal edit state
  const selectedIssue = useMemo(
    () => issues.find((item) => item.id === selectedIssueId) ?? null,
    [issues, selectedIssueId]
  );
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDue, setEditDue] = useState("");
  const [detailSubtaskInput, setDetailSubtaskInput] = useState("");
  const [detailCommentInput, setDetailCommentInput] = useState("");

  useEffect(() => {
    if (!selectedIssue) return;
    setEditTitle(selectedIssue.title);
    setEditDescription(selectedIssue.description ?? "");
    setEditDue(formatDateInput(selectedIssue.due));
    setDetailSubtaskInput("");
    setDetailCommentInput("");
  }, [selectedIssue?.id]);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: PersistedKanbanState = {
      issues: issues.map((item) => ({
        ...item,
        due: item.due ? item.due.toISOString() : undefined,
      })),
      collapsedColumns,
      nextIssueNumber,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota issues
    }
  }, [issues, collapsedColumns, nextIssueNumber]);

  const activeIssues = useMemo(
    () => issues.filter((issue) => !issue.archived),
    [issues]
  );

  const archivedIssues = useMemo(
    () => issues.filter((issue) => issue.archived),
    [issues]
  );

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeIssues.filter((issue) => {
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) {
        return false;
      }
      if (assigneeFilter === "unassigned" && issue.assignees.length > 0) {
        return false;
      }
      if (
        assigneeFilter !== "all" &&
        assigneeFilter !== "unassigned" &&
        !issue.assignees.includes(assigneeFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.key.toLowerCase().includes(q) ||
        issue.assignees.some((a) => a.toLowerCase().includes(q)) ||
        issue.labels.some((l) => l.name.toLowerCase().includes(q))
      );
    });
  }, [activeIssues, searchQuery, priorityFilter, assigneeFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all";

  const resetCreateForm = (targetColumn = "todo") => {
    setNewTitle("");
    setNewDescription("");
    setNewColumn(targetColumn);
    setNewPriority("medium");
    setNewLabels([kanbanLabels.feature]);
    setNewAssignees([]);
    setNewDue("");
    setNewSubtaskDraft("");
    setNewSubtasks([]);
  };

  const openCreateForColumn = (columnId: string) => {
    resetCreateForm(columnId);
    setCreateOpen(true);
  };

  const handleQuickAddIssue = (columnId: string, title: string) => {
    const num = nextIssueNumber;
    const newId = `web-${num}-${Date.now().toString(36)}`;
    const newIssue: RichSprintIssue = {
      id: newId,
      key: `WEB-${num}`,
      title,
      description: `Added to ${
        kanban1ExampleProps.columns.find((c) => c.id === columnId)?.title ??
        columnId
      }.`,
      column: columnId,
      priority: "medium",
      labels: [kanbanLabels.feature],
      assignees: [],
      subtaskItems: [],
      commentItems: [],
      archived: false,
    };
    setIssues((prev) => [...prev, newIssue]);
    setNextIssueNumber((n) => n + 1);
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const num = nextIssueNumber;
    const newId = `web-${num}-${Date.now().toString(36)}`;
    const subtasksSummary =
      newSubtasks.length > 0
        ? {
            done: newSubtasks.filter((s) => s.done).length,
            total: newSubtasks.length,
          }
        : undefined;

    const created: RichSprintIssue = {
      id: newId,
      key: `WEB-${num}`,
      title,
      description: newDescription.trim() || undefined,
      column: newColumn,
      priority: newPriority,
      labels: newLabels,
      assignees: newAssignees,
      due: parseDateInput(newDue),
      subtaskItems: newSubtasks,
      subtasks: subtasksSummary,
      commentItems: [],
      archived: false,
    };

    setIssues((prev) => [...prev, created]);
    setNextIssueNumber((n) => n + 1);
    setCreateOpen(false);
    resetCreateForm();
  };

  const handleMoveIssue = (id: string, column: string, index: number) => {
    setIssues((prev) => {
      const archived = prev.filter((item) => item.archived);
      const active = prev.filter((item) => !item.archived);
      const movedActive = moveItem(active, id, column, index);
      return [...movedActive, ...archived];
    });
  };

  const handleCompleteToggle = (id: string) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const isDone = item.column === kanban1ExampleProps.doneColumn;
        return {
          ...item,
          column: isDone ? "todo" : kanban1ExampleProps.doneColumn,
        };
      })
    );
  };

  const handleArchiveIssue = (id: string) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              archived: true,
              archivedAt: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
            }
          : item
      )
    );
    if (selectedIssueId === id) {
      setSelectedIssueId(null);
    }
  };

  const handleArchiveAllDone = () => {
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    setIssues((prev) =>
      prev.map((item) =>
        !item.archived && item.column === kanban1ExampleProps.doneColumn
          ? { ...item, archived: true, archivedAt: today }
          : item
      )
    );
  };

  const handleRestoreIssue = (id: string) => {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, archived: false, archivedAt: undefined }
          : item
      )
    );
  };

  const handleDeleteIssue = (id: string) => {
    setIssues((prev) => prev.filter((item) => item.id !== id));
    if (selectedIssueId === id) {
      setSelectedIssueId(null);
    }
  };

  const handleResetBoard = () => {
    setIssues(INITIAL_ISSUES);
    setCollapsedColumns({});
    setNextIssueNumber(getMaxIssueNumber(INITIAL_ISSUES));
    setSearchQuery("");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setSelectedIssueId(null);
  };

  const updateSelectedIssue = (
    updater: (issue: RichSprintIssue) => RichSprintIssue
  ) => {
    if (!selectedIssueId) return;
    setIssues((prev) =>
      prev.map((item) => (item.id === selectedIssueId ? updater(item) : item))
    );
  };

  const handleSaveDetailFields = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    updateSelectedIssue((issue) => ({
      ...issue,
      title: trimmed,
      description: editDescription.trim() || undefined,
      due: parseDateInput(editDue),
    }));
    setSelectedIssueId(null);
  };

  const handleAddDetailSubtask = () => {
    const text = detailSubtaskInput.trim();
    if (!text) return;
    updateSelectedIssue((issue) => {
      const nextList: SubtaskItem[] = [
        ...(issue.subtaskItems ?? []),
        {
          id: `${issue.id}-sub-${Date.now().toString(36)}`,
          title: text,
          done: false,
        },
      ];
      return {
        ...issue,
        subtaskItems: nextList,
        subtasks: {
          done: nextList.filter((s) => s.done).length,
          total: nextList.length,
        },
      };
    });
    setDetailSubtaskInput("");
  };

  const handleToggleDetailSubtask = (subId: string, done: boolean) => {
    updateSelectedIssue((issue) => {
      const nextList = (issue.subtaskItems ?? []).map((s) =>
        s.id === subId ? { ...s, done } : s
      );
      return {
        ...issue,
        subtaskItems: nextList,
        subtasks:
          nextList.length > 0
            ? {
                done: nextList.filter((s) => s.done).length,
                total: nextList.length,
              }
            : undefined,
      };
    });
  };

  const handleRemoveDetailSubtask = (subId: string) => {
    updateSelectedIssue((issue) => {
      const nextList = (issue.subtaskItems ?? []).filter((s) => s.id !== subId);
      return {
        ...issue,
        subtaskItems: nextList,
        subtasks:
          nextList.length > 0
            ? {
                done: nextList.filter((s) => s.done).length,
                total: nextList.length,
              }
            : undefined,
      };
    });
  };

  const handleAddDetailComment = () => {
    const text = detailCommentInput.trim();
    if (!text) return;
    updateSelectedIssue((issue) => {
      const nextComments: CommentItem[] = [
        ...(issue.commentItems ?? []),
        {
          id: `${issue.id}-cmt-${Date.now().toString(36)}`,
          author: "Ahmed Hassan",
          text,
          createdAt: "Just now",
        },
      ];
      return {
        ...issue,
        commentItems: nextComments,
        comments: nextComments.length,
      };
    });
    setDetailCommentInput("");
  };

  const boardIssues = state.isEmpty ? [] : filteredIssues;
  const doneCount = activeIssues.filter(
    (item) => item.column === kanban1ExampleProps.doneColumn
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <Card className="dark:bg-transparent border-border/60">
        <CardContent className="p-4 sm:p-6 overflow-x-auto">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/50 pb-4">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, keys, assignees..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={priorityFilter !== "all" ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                  />
                }
              >
                <FilterIcon className="size-3.5" />
                <span>
                  Priority:{" "}
                  {priorityFilter === "all"
                    ? "All"
                    : PRIORITY_OPTIONS.find((p) => p.value === priorityFilter)
                        ?.label}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                    All priorities
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {PRIORITY_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setPriorityFilter(option.value)}
                    >
                      <KanbanPriority priority={option.value} showLabel />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={assigneeFilter !== "all" ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                  />
                }
              >
                <span>
                  Assignee:{" "}
                  {assigneeFilter === "all"
                    ? "All"
                    : assigneeFilter === "unassigned"
                      ? "Unassigned"
                      : assigneeFilter}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by assignee</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setAssigneeFilter("all")}>
                    All assignees
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssigneeFilter("unassigned")}>
                    Unassigned
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {TEAM_MEMBERS.map((member) => (
                    <DropdownMenuItem
                      key={member}
                      onClick={() => setAssigneeFilter(member)}
                    >
                      {member}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setAssigneeFilter("all");
                }}
              >
                <XIcon className="size-3.5" />
                Clear
              </Button>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setArchiveOpen(true)}
              >
                <ArchiveIcon className="size-3.5" />
                <span>Archived</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {archivedIssues.length}
                </Badge>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleResetBoard}
                title="Restore default Sprint 24 tasks"
              >
                <RotateCcwIcon className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>

              <ChartRefreshButton
                refreshing={refreshing}
                onClick={triggerRefresh}
                className="h-8"
              />

              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => openCreateForColumn("todo")}
              >
                <PlusIcon className="size-3.5" />
                <span>Add Task</span>
              </Button>
            </div>
          </div>

          <DashboardBusy
            refreshing={state.refreshing || refreshing}
            label="Updating sprint board"
          >
            <Kanban1
              key={refreshKey}
              {...kanban1ExampleProps}
              controlled
              issues={boardIssues}
              collapsedColumns={collapsedColumns}
              onCollapsedChange={(columnId, collapsed) =>
                setCollapsedColumns((prev) => ({ ...prev, [columnId]: collapsed }))
              }
              onMove={handleMoveIssue}
              onAddIssue={handleQuickAddIssue}
              onColumnAddClick={openCreateForColumn}
              onOpenIssue={(id) => setSelectedIssueId(id)}
              onCompleteIssue={handleCompleteToggle}
              onArchiveIssue={handleArchiveIssue}
              onDeleteIssue={handleDeleteIssue}
              summaryOverride={
                hasActiveFilters
                  ? `Showing ${filteredIssues.length} of ${activeIssues.length} active issues (${doneCount} done, ${archivedIssues.length} archived).`
                  : undefined
              }
              status={state.status}
              errorMessage={state.errorMessage}
            />
          </DashboardBusy>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a sprint task with priority, labels, assignees, and checklist items.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kanban-new-title">Title</Label>
              <Input
                id="kanban-new-title"
                required
                placeholder="e.g., Add export audit log to customer settings"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kanban-new-desc">Description</Label>
              <Textarea
                id="kanban-new-desc"
                rows={3}
                placeholder="Scope, acceptance criteria, or technical notes..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kanban-new-column">Column</Label>
                <select
                  id="kanban-new-column"
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  className="border-input bg-background dark:bg-input/30 h-9 rounded-md border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {kanban1ExampleProps.columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kanban-new-priority">Priority</Label>
                <select
                  id="kanban-new-priority"
                  value={newPriority}
                  onChange={(e) =>
                    setNewPriority(e.target.value as KanbanPriorityLevel)
                  }
                  className="border-input bg-background dark:bg-input/30 h-9 rounded-md border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kanban-new-due">Due date</Label>
                <Input
                  id="kanban-new-due"
                  type="date"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_OPTIONS.map((label) => {
                  const selected = newLabels.some((l) => l.name === label.name);
                  return (
                    <Button
                      key={label.name}
                      type="button"
                      size="xs"
                      variant={selected ? "default" : "outline"}
                      onClick={() =>
                        setNewLabels((prev) =>
                          selected
                            ? prev.filter((l) => l.name !== label.name)
                            : [...prev, label]
                        )
                      }
                    >
                      {label.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Assignees</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEAM_MEMBERS.map((member) => {
                  const selected = newAssignees.includes(member);
                  return (
                    <Button
                      key={member}
                      type="button"
                      size="xs"
                      variant={selected ? "secondary" : "outline"}
                      onClick={() =>
                        setNewAssignees((prev) =>
                          selected
                            ? prev.filter((m) => m !== member)
                            : [...prev, member]
                        )
                      }
                    >
                      {member}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Initial Subtasks</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubtaskDraft}
                  onChange={(e) => setNewSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const trimmed = newSubtaskDraft.trim();
                    if (!trimmed) return;
                    setNewSubtasks((prev) => [
                      ...prev,
                      {
                        id: `new-sub-${Date.now()}-${prev.length}`,
                        title: trimmed,
                        done: false,
                      },
                    ]);
                    setNewSubtaskDraft("");
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const trimmed = newSubtaskDraft.trim();
                    if (!trimmed) return;
                    setNewSubtasks((prev) => [
                      ...prev,
                      {
                        id: `new-sub-${Date.now()}-${prev.length}`,
                        title: trimmed,
                        done: false,
                      },
                    ]);
                    setNewSubtaskDraft("");
                  }}
                >
                  Add
                </Button>
              </div>
              {newSubtasks.length > 0 && (
                <ul className="flex flex-col gap-1.5 rounded-lg border p-2">
                  {newSubtasks.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate">{sub.title}</span>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        onClick={() =>
                          setNewSubtasks((prev) =>
                            prev.filter((item) => item.id !== sub.id)
                          )
                        }
                      >
                        <XIcon className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Details / Edit Dialog */}
      <Dialog
        open={Boolean(selectedIssue)}
        onOpenChange={(open) => {
          if (!open) setSelectedIssueId(null);
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedIssue && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 pr-8">
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedIssue.key}
                  </Badge>
                  <KanbanPriority priority={selectedIssue.priority} showLabel />
                  {selectedIssue.column === kanban1ExampleProps.doneColumn && (
                    <Badge variant="secondary" className="text-xs">
                      Completed
                    </Badge>
                  )}
                </div>
                <DialogTitle className="pt-1">Task Details</DialogTitle>
                <DialogDescription>
                  Update fields, check off subtasks, post comments, or archive this task.
                </DialogDescription>
              </DialogHeader>

              <form
                id="kanban-detail-form"
                onSubmit={handleSaveDetailFields}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="kanban-edit-title">Title</Label>
                  <Input
                    id="kanban-edit-title"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="kanban-edit-desc">Description</Label>
                  <Textarea
                    id="kanban-edit-desc"
                    rows={3}
                    placeholder="Add details or acceptance criteria..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kanban-edit-column">Status</Label>
                    <select
                      id="kanban-edit-column"
                      value={selectedIssue.column}
                      onChange={(e) =>
                        updateSelectedIssue((issue) => ({
                          ...issue,
                          column: e.target.value,
                        }))
                      }
                      className="border-input bg-background dark:bg-input/30 h-9 rounded-md border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {kanban1ExampleProps.columns.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kanban-edit-priority">Priority</Label>
                    <select
                      id="kanban-edit-priority"
                      value={selectedIssue.priority}
                      onChange={(e) =>
                        updateSelectedIssue((issue) => ({
                          ...issue,
                          priority: e.target.value as KanbanPriorityLevel,
                        }))
                      }
                      className="border-input bg-background dark:bg-input/30 h-9 rounded-md border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kanban-edit-due" className="flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      Due date
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="kanban-edit-due"
                        type="date"
                        value={editDue}
                        onChange={(e) => setEditDue(e.target.value)}
                      />
                      {editDue && (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Clear due date"
                          onClick={() => setEditDue("")}
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Labels</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LABEL_OPTIONS.map((label) => {
                      const active = selectedIssue.labels.some(
                        (l) => l.name === label.name
                      );
                      return (
                        <Button
                          key={label.name}
                          type="button"
                          size="xs"
                          variant={active ? "default" : "outline"}
                          onClick={() =>
                            updateSelectedIssue((issue) => ({
                              ...issue,
                              labels: active
                                ? issue.labels.filter((l) => l.name !== label.name)
                                : [...issue.labels, label],
                            }))
                          }
                        >
                          {label.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Assignees</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TEAM_MEMBERS.map((member) => {
                      const active = selectedIssue.assignees.includes(member);
                      return (
                        <Button
                          key={member}
                          type="button"
                          size="xs"
                          variant={active ? "secondary" : "outline"}
                          onClick={() =>
                            updateSelectedIssue((issue) => ({
                              ...issue,
                              assignees: active
                                ? issue.assignees.filter((m) => m !== member)
                                : [...issue.assignees, member],
                            }))
                          }
                        >
                          {member}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </form>

              {/* Subtasks */}
              <div className="flex flex-col gap-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <ListChecksIcon className="size-3.5" />
                    Subtasks (
                    {(selectedIssue.subtaskItems ?? []).filter((s) => s.done).length}
                    /{(selectedIssue.subtaskItems ?? []).length})
                  </Label>
                </div>
                {(selectedIssue.subtaskItems ?? []).length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {(selectedIssue.subtaskItems ?? []).map((sub) => (
                      <li
                        key={sub.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                          <Checkbox
                            checked={sub.done}
                            onCheckedChange={(checked) =>
                              handleToggleDetailSubtask(sub.id, Boolean(checked))
                            }
                          />
                          <span
                            className={
                              sub.done
                                ? "text-muted-foreground truncate line-through"
                                : "truncate"
                            }
                          >
                            {sub.title}
                          </span>
                        </label>
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => handleRemoveDetailSubtask(sub.id)}
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a subtask..."
                    value={detailSubtaskInput}
                    onChange={(e) => setDetailSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDetailSubtask();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDetailSubtask}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Comments */}
              <div className="flex flex-col gap-2 border-t pt-3">
                <Label className="flex items-center gap-1.5">
                  <MessageSquareIcon className="size-3.5" />
                  Comments ({(selectedIssue.commentItems ?? []).length})
                </Label>
                {(selectedIssue.commentItems ?? []).length > 0 && (
                  <ul className="flex max-h-36 flex-col gap-2 overflow-y-auto pr-1">
                    {(selectedIssue.commentItems ?? []).map((comment) => (
                      <li
                        key={comment.id}
                        className="bg-muted/40 rounded-lg border px-3 py-2 text-xs"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-muted-foreground">
                            {comment.createdAt}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{comment.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={detailCommentInput}
                    onChange={(e) => setDetailCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDetailComment();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDetailComment}
                  >
                    <SendIcon className="size-3.5" />
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex-wrap justify-between gap-2 sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCompleteToggle(selectedIssue.id)}
                  >
                    <CheckCircle2Icon className="size-3.5" />
                    {selectedIssue.column === kanban1ExampleProps.doneColumn
                      ? "Reopen"
                      : "Mark Done"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveIssue(selectedIssue.id)}
                  >
                    <ArchiveIcon className="size-3.5" />
                    Archive
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteIssue(selectedIssue.id)}
                  >
                    <Trash2Icon className="size-3.5" />
                    Delete
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIssueId(null)}
                  >
                    Close
                  </Button>
                  <Button type="submit" form="kanban-detail-form" size="sm">
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Archived Tasks Dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archived Tasks ({archivedIssues.length})</DialogTitle>
            <DialogDescription>
              Restore archived tasks back to the board or delete them permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2 border-b pb-3">
            <span className="text-muted-foreground text-xs">
              {doneCount} completed task{doneCount === 1 ? "" : "s"} currently in Done
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={doneCount === 0}
              onClick={handleArchiveAllDone}
            >
              <ArchiveIcon className="size-3" />
              Archive all Done
            </Button>
          </div>

          {archivedIssues.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No archived tasks yet. Use a card&apos;s menu or detail view to archive tasks.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {archivedIssues.map((issue) => (
                <li
                  key={issue.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-muted-foreground font-mono text-xs">
                        {issue.key}
                      </span>
                      <KanbanPriority priority={issue.priority} />
                      {issue.archivedAt && (
                        <span className="text-muted-foreground text-[11px]">
                          Archived {issue.archivedAt}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium">{issue.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleRestoreIssue(issue.id)}
                    >
                      <ArchiveRestoreIcon className="size-3" />
                      Restore
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      title="Delete permanently"
                      onClick={() => handleDeleteIssue(issue.id)}
                    >
                      <Trash2Icon className="text-destructive size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KanbanView;
