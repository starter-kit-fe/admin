'use client'

import { useMemo, useState, type ComponentType } from "react"
import {
  AlertCircle,
  BarChart3,
  CalendarCheck,
  Clock,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Separator } from "@/components/ui/separator"

type JobStatus = "scheduled" | "running" | "paused" | "failed" | "completed"

type JobRecord = {
  id: string
  name: string
  description: string
  status: JobStatus
  owner: string
  cadence: string
  nextRun: string
  lastRun: string
  successRate: number
  duration: string
}

const JOBS: JobRecord[] = [
  {
    id: "JOB-0042",
    name: "Daily Revenue Snapshot",
    description:
      "Aggregates order and refund metrics into the finance warehouse for dashboards.",
    status: "running",
    owner: "Finance Ops",
    cadence: "0 3 * * *",
    nextRun: "2024-11-08 03:00",
    lastRun: "2024-11-07 03:01",
    successRate: 99,
    duration: "6m 24s",
  },
  {
    id: "JOB-0163",
    name: "CRM Contact Sync",
    description:
      "Pushes newly onboarded users to the CRM with lifecycle metadata.",
    status: "scheduled",
    owner: "Growth",
    cadence: "*/15 * * * *",
    nextRun: "2024-11-07 09:15",
    lastRun: "2024-11-07 09:00",
    successRate: 100,
    duration: "52s",
  },
  {
    id: "JOB-0205",
    name: "Segment Cleanup",
    description:
      "Archives inactive workspace segments older than 90 days.",
    status: "paused",
    owner: "Growth",
    cadence: "0 1 * * 1",
    nextRun: "Paused",
    lastRun: "2024-10-28 01:04",
    successRate: 94,
    duration: "2m 12s",
  },
  {
    id: "JOB-0317",
    name: "Anomaly Detector",
    description:
      "Runs statistical checks on incoming telemetry and notifies SRE on spikes.",
    status: "failed",
    owner: "SRE",
    cadence: "*/5 * * * *",
    nextRun: "2024-11-07 09:05",
    lastRun: "2024-11-07 09:00",
    successRate: 82,
    duration: "1m 09s",
  },
  {
    id: "JOB-0371",
    name: "Usage Snapshot",
    description:
      "Captures hourly usage tallies for billing and quota enforcement.",
    status: "running",
    owner: "Platform",
    cadence: "0 * * * *",
    nextRun: "2024-11-07 10:00",
    lastRun: "2024-11-07 09:00",
    successRate: 98,
    duration: "3m 48s",
  },
  {
    id: "JOB-0432",
    name: "Weekly Churn Digest",
    description:
      "Compiles churn candidates and posts summary to the GTM Slack channel.",
    status: "completed",
    owner: "Analytics",
    cadence: "0 8 * * 1",
    nextRun: "2024-11-11 08:00",
    lastRun: "2024-11-04 08:02",
    successRate: 100,
    duration: "4m 02s",
  },
  {
    id: "JOB-0519",
    name: "Data Retention Enforcement",
    description:
      "Purges expired personal data exports that exceeded retention windows.",
    status: "completed",
    owner: "Security",
    cadence: "0 */12 * * *",
    nextRun: "2024-11-07 21:00",
    lastRun: "2024-11-07 09:00",
    successRate: 100,
    duration: "1m 55s",
  },
  {
    id: "JOB-0590",
    name: "Webhook Retry Backfill",
    description:
      "Replays failed webhook deliveries from the previous day.",
    status: "failed",
    owner: "Integrations",
    cadence: "30 2 * * *",
    nextRun: "2024-11-08 02:30",
    lastRun: "2024-11-07 02:30",
    successRate: 76,
    duration: "7m 18s",
  },
]

const PAGE_SIZE = 6

const STATUS_LEGEND: Record<
  JobStatus,
  {
    label: string
    tone: "default" | "secondary" | "destructive" | "outline"
    icon: ComponentType<{ className?: string }>
  }
> = {
  scheduled: {
    label: "Scheduled",
    tone: "outline",
    icon: Clock,
  },
  running: {
    label: "Running",
    tone: "default",
    icon: PlayCircle,
  },
  paused: {
    label: "Paused",
    tone: "secondary",
    icon: PauseCircle,
  },
  failed: {
    label: "Failed",
    tone: "destructive",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    tone: "outline",
    icon: CalendarCheck,
  },
}

const FILTERS: Array<
  {
    key: "all" | JobStatus
    title: string
    description: string
  }
> = [
  {
    key: "all",
    title: "All jobs",
    description: "Combined execution health",
  },
  {
    key: "running",
    title: "Running now",
    description: "Currently processing workloads",
  },
  {
    key: "scheduled",
    title: "Scheduled",
    description: "Waiting for next trigger",
  },
  {
    key: "failed",
    title: "Needs attention",
    description: "Last run ended in failure",
  },
  {
    key: "paused",
    title: "Paused",
    description: "Manually stopped jobs",
  },
  {
    key: "completed",
    title: "Completed",
    description: "Last run finished cleanly",
  },
]

export function JobManagement() {
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]["key"]>("all")
  const [page, setPage] = useState(1)

  const filteredJobs = useMemo(() => {
    const dataset =
      activeFilter === "all"
        ? JOBS
        : JOBS.filter((job) => job.status === activeFilter)

    return dataset
  }, [activeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const paginatedJobs = filteredJobs.slice(start, end)

  const counts = useMemo(() => {
    return FILTERS.reduce(
      (acc, filter) => {
        if (filter.key === "all") {
          acc[filter.key] = JOBS.length
        } else {
          acc[filter.key] = JOBS.filter((job) => job.status === filter.key).length
        }
        return acc
      },
      {} as Record<(typeof FILTERS)[number]["key"], number>
    )
  }, [])

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage)
  }

  const handleFilterChange = (nextFilter: (typeof FILTERS)[number]["key"]) => {
    setActiveFilter(nextFilter)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Job management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor scheduled workloads, drill into failures, and orchestrate refreshes from this view.
          </p>
        </div>
        <ButtonGroup>
          <Button variant="outline" className="gap-2" size="sm">
            <RefreshCcw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button className="gap-2" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Add job
          </Button>
        </ButtonGroup>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {FILTERS.map((filter) => (
          <Card
            key={filter.key}
            role="button"
            tabIndex={0}
            onClick={() => handleFilterChange(filter.key)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleFilterChange(filter.key)
              }
            }}
            aria-pressed={activeFilter === filter.key}
            className={cn(
              "border-border/70 bg-card shadow-none transition hover:border-primary/60 hover:bg-muted/20 focus-visible:border-primary focus-visible:outline-none dark:border-border/40 dark:hover:bg-muted/30",
              activeFilter === filter.key &&
                "border-primary bg-primary/10 shadow-sm dark:bg-primary/20"
            )}
          >
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-sm font-semibold">{filter.title}</CardTitle>
              <CardDescription className="text-xs">{filter.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-semibold text-foreground">
                {counts[filter.key]}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Separator />

      <section className="grid gap-4 md:grid-cols-2">
        {paginatedJobs.map((job) => {
          const statusMeta = STATUS_LEGEND[job.status]
          const StatusIcon = statusMeta.icon

          return (
            <Card
              key={job.id}
              className="border-border/60 bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 dark:border-border/40"
            >
              <CardHeader className="space-y-2 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">{job.name}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                      {job.id}
                    </CardDescription>
                  </div>
                  <Badge variant={statusMeta.tone} className="flex items-center gap-1 text-xs">
                    <StatusIcon className="size-3.5" aria-hidden="true" />
                    {statusMeta.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{job.description}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
                    Next: <span className="font-medium text-foreground">{job.nextRun}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
                    Last: <span className="font-medium text-foreground">{job.lastRun}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <PlayCircle className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
                    SLA: <span className="font-medium text-foreground">{job.duration}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
                    Owner: <span className="font-medium text-foreground">{job.owner}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="size-3.5 text-muted-foreground/80" aria-hidden="true" />
                    Success:{" "}
                    <span className="font-medium text-foreground">
                      {job.successRate}%
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs uppercase text-muted-foreground/80">
                    {job.cadence}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {paginatedJobs.length === 0 && (
          <Card className="border-dashed border-border/60 bg-muted/20">
            <CardContent className="flex h-36 flex-col items-center justify-center gap-2 text-center">
              <CardTitle className="text-base font-semibold">No jobs in this view</CardTitle>
              <CardDescription className="text-sm">
                Adjust your filter to see available jobs or create a new one.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </section>

      <Pagination className="pt-2">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault()
                handlePageChange(Math.max(1, currentPage - 1))
              }}
              className={cn(
                currentPage === 1 &&
                  "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1
            if (totalPages > 5) {
              if (pageNumber === 1 || pageNumber === totalPages) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === currentPage}
                      onClick={(event) => {
                        event.preventDefault()
                        handlePageChange(pageNumber)
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              }

              if (
                Math.abs(pageNumber - currentPage) <= 1 ||
                (currentPage <= 2 && pageNumber <= 3) ||
                (currentPage >= totalPages - 1 && pageNumber >= totalPages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === currentPage}
                      onClick={(event) => {
                        event.preventDefault()
                        handlePageChange(pageNumber)
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              }

              if (
                pageNumber === 2 ||
                pageNumber === totalPages - 1
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return null
            }

            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === currentPage}
                  onClick={(event) => {
                    event.preventDefault()
                    handlePageChange(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            )
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }}
              className={cn(
                currentPage === totalPages &&
                  "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
