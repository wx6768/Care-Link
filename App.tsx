import { useEffect, useState, type ReactNode } from "react"

type Role = "resident" | "family" | "volunteer" | "admin"
type ModalType =
  | "contact"
  | "call"
  | "escalate"
  | "complete"
  | "redeem"
  | null
type ServiceCategory =
  | "Companionship"
  | "Meal delivery"
  | "Everyday assistance"
type RequestStatus =
  | "Awaiting Review"
  | "Approved"
  | "Assigned"
  | "Accepted"
  | "In Progress"
  | "Awaiting Verification"
  | "Completed"
  | "Rejected"
  | "Cancelled"

type CareRequest = {
  id: string
  residentId: "margaret"
  category: ServiceCategory
  time: string
  location: string
  approximateLocation: string
  distance: string
  notes: string
  description: string
  status: RequestStatus
  assignedVolunteerId: string | null
  checkedInAt?: string
  checkedOutAt?: string
  completionNotes?: string
  receiptConfirmed?: boolean
  familyConfirmed?: boolean
  verifiedAt?: string
  pointsAwarded?: boolean
}

type VolunteerProfile = {
  id: string
  name: string
  approvedCategories: ServiceCategory[]
  rating: string
  distance: string
}

type RewardTransaction = {
  id: string
  requestId: string
  volunteerId: string
  category: ServiceCategory
  points: number
  date: string
  type: "Service verification"
}

type RedemptionRecord = {
  id: string
  volunteerId: string
  reward: string
  points: number
  date: string
  status: "Processing" | "Sent"
  affectsDemoBalance: boolean
}

type DemoAlert = {
  id: string
  resident: string
  status: "Needs Response" | "Safe" | "Escalated" | "Acknowledged"
}

type DemoState = {
  requests: CareRequest[]
  rewardTransactions: RewardTransaction[]
  redemptions: RedemptionRecord[]
  alert: DemoAlert
}

const SERVICE_POINTS = {
  companionship: 120,
  mealDelivery: 100,
  everydayAssistance: 150,
} as const

const INITIAL_VOLUNTEER_POINTS = 1240
const INITIAL_VOLUNTEER_MONTHLY_POINTS = 240
const INITIAL_MONTHLY_POINTS = 28440

const VOLUNTEERS: VolunteerProfile[] = [
  {
    id: "daniel",
    name: "Daniel Wong",
    approvedCategories: ["Companionship", "Meal delivery"],
    rating: "4.9",
    distance: "0.8 km",
  },
  {
    id: "aisha",
    name: "Aisha Khan",
    approvedCategories: [
      "Companionship",
      "Meal delivery",
      "Everyday assistance",
    ],
    rating: "4.8",
    distance: "1.4 km",
  },
]

const INITIAL_DEMO_STATE: DemoState = {
  requests: [
    {
      id: "CC-1048",
      residentId: "margaret",
      category: "Meal delivery",
      time: "15 May 2025 · 12:00–1:00 pm",
      location: "18 Willow Street",
      approximateLocation: "North Willow · Zone 3",
      distance: "0.8 km",
      notes: "Low-sodium meal. Please knock loudly.",
      description: "Deliver a prepared low-sodium meal",
      status: "Awaiting Verification",
      assignedVolunteerId: "daniel",
      checkedInAt: "12:28 pm",
      checkedOutAt: "1:12 pm",
      completionNotes:
        "Meal delivered and placed on kitchen counter. Margaret confirmed receipt.",
      receiptConfirmed: true,
      familyConfirmed: true,
      pointsAwarded: false,
    },
    {
      id: "CC-1052",
      residentId: "margaret",
      category: "Companionship",
      time: "14 May 2025 · 3:00–4:00 pm",
      location: "18 Willow Street",
      approximateLocation: "North Willow",
      distance: "1.2 km",
      notes: "Conversation and a short walk if comfortable.",
      description: "Conversation and short walk",
      status: "Approved",
      assignedVolunteerId: null,
      pointsAwarded: false,
    },
    {
      id: "CC-1053",
      residentId: "margaret",
      category: "Everyday assistance",
      time: "16 May 2025 · 10:00–11:00 am",
      location: "18 Willow Street",
      approximateLocation: "North Willow",
      distance: "2.1 km",
      notes: "Help organise groceries and light household items.",
      description: "Help with errands and light household tasks",
      status: "Approved",
      assignedVolunteerId: null,
      pointsAwarded: false,
    },
  ],
  rewardTransactions: [],
  redemptions: [
    {
      id: "RD-1001",
      volunteerId: "daniel",
      reward: "Bookshop voucher",
      points: 1000,
      date: "28 Apr 2025",
      status: "Sent",
      affectsDemoBalance: false,
    },
  ],
  alert: {
    id: "AL-204",
    resident: "Margaret Lee",
    status: "Needs Response",
  },
}

const pointsForCategory = (category: ServiceCategory) =>
  category === "Companionship"
    ? SERVICE_POINTS.companionship
    : category === "Meal delivery"
      ? SERVICE_POINTS.mealDelivery
      : SERVICE_POINTS.everydayAssistance

const toneForStatus = (
  status: RequestStatus,
): "blue" | "green" | "amber" | "red" | "gray" =>
  status === "Completed"
    ? "green"
    : status === "Rejected" || status === "Cancelled"
      ? "red"
      : status === "Awaiting Review" || status === "Awaiting Verification"
        ? "amber"
        : "blue"

const progressForStatus = (status: RequestStatus) =>
  status === "Completed"
    ? 4
    : status === "Awaiting Verification"
      ? 3
      : status === "In Progress"
        ? 2
        : status === "Accepted"
          ? 1
          : 0

const icons: Record<string, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-7h6v7" />
    </>
  ),
  heart: (
    <>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      <path d="M5 12h3l1.4-3 2.4 6 1.7-3H19" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01" />
    </>
  ),
  care: (
    <>
      <path d="M4 13.5V20h16v-6.5M2 14l10-8 10 8" />
      <path d="M9 20v-5h6v5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M16 5a4 4 0 0 1 0 7M17 14a7 7 0 0 1 5 7" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 5H6v16h12V5h-3M9 3h6v4H9zM9 12h6M9 16h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  gift: (
    <>
      <path d="M3 10h18v4H3zM5 14h14v7H5zM12 10v11M7.5 10C4 10 4 5 7 5c2.5 0 5 5 5 5M16.5 10C20 10 20 5 17 5c-2.5 0-5 5-5 5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  arrow: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  watch: (
    <>
      <rect x="6" y="5" width="12" height="14" rx="3" />
      <path d="M9 5V2h6v3M9 19v3h6v-3M9 12h2l1-2 2 4 1-2h1" />
    </>
  ),
  location: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  phone: (
    <path d="M6.6 2h3l1.5 5-2.2 1.3a15 15 0 0 0 6.8 6.8L17 13l5 1.5v3c0 2.5-2 4.5-4.5 4.5A15.5 15.5 0 0 1 2 6.5C2 4 4 2 6.6 2Z" />
  ),
  alert: (
    <>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5M12 18h.01" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="m8 6 2-3h4l2 3" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  logout: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3M15 3h6v18h-6" />
    </>
  ),
  activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  file: (
    <>
      <path d="M6 2h9l4 4v16H6zM14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  star: (
    <path d="m12 2 3 6 6.5 1-4.7 4.7 1.1 6.6L12 17l-5.9 3.3 1.1-6.6L2.5 9 9 8z" />
  ),
}

type IconProps = {
  name: string
  size?: number
}

function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}

function AppEntry({
  onChoose,
}: {
  onChoose: (role: Exclude<Role, "admin">) => void
}) {
  const choices: {
    role: Exclude<Role, "admin">
    label: string
    description: string
    icon: string
    detail: string
  }[] = [
    {
      role: "resident",
      label: "Resident",
      description: "Receive care and stay connected",
      icon: "heart",
      detail: "Health updates · Request help · Track care",
    },
    {
      role: "family",
      label: "Family",
      description: "Support someone you care about",
      icon: "users",
      detail: "Alerts · Wellbeing updates · Care tracking",
    },
    {
      role: "volunteer",
      label: "Volunteer",
      description: "Help people in your community",
      icon: "shield",
      detail: "Available tasks · Service records · Rewards",
    },
  ]

  return (
    <main className="entry-shell">
      <div className="entry-panel">
        <div className="entry-brand">
          <span>
            <Icon name="heart" size={25} />
          </span>
          <div>
            <strong>Care Link</strong>
            <small>Connected care, closer community</small>
          </div>
        </div>

        <div className="entry-copy">
          <div className="eyebrow">Welcome</div>
          <h1>How would you like to use Care Link?</h1>
          <p>Choose an app experience to continue. You can switch later.</p>
        </div>

        <div className="entry-choices">
          {choices.map((choice) => (
            <button
              type="button"
              onClick={() => onChoose(choice.role)}
              key={choice.role}
            >
              <span className="entry-choice-icon">
                <Icon name={choice.icon} size={23} />
              </span>
              <span className="entry-choice-copy">
                <strong>{choice.label}</strong>
                <small>{choice.description}</small>
                <em>{choice.detail}</em>
              </span>
              <span className="entry-arrow">
                <Icon name="arrow" size={18} />
              </span>
            </button>
          ))}
        </div>

        <div className="entry-demo-note">
          <Icon name="shield" size={15} />
          <span>
            Prototype app · All health, device and location data is simulated
          </span>
        </div>
      </div>
    </main>
  )
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  wide,
  disabled,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "danger" | "ghost"
  icon?: string
  onClick?: () => void
  wide?: boolean
  disabled?: boolean
}) {
  return (
    <button
      className={`button ${variant} ${wide ? "wide" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  )
}

function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode
  tone?: "blue" | "green" | "amber" | "red" | "gray"
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}

function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`card ${onClick ? "clickable" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function PageTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  )
}

const mobileNav: Record<Exclude<Role, "admin">, {
  id: string
  label: string
  icon: string
}[]> = {
  resident: [
    { id: "home", label: "Home", icon: "home" },
    { id: "health", label: "Health", icon: "heart" },
    { id: "request", label: "Request", icon: "plus" },
    { id: "care", label: "My Care", icon: "care" },
    { id: "profile", label: "Profile", icon: "user" },
  ],
  family: [
    { id: "dashboard", label: "Home", icon: "home" },
    { id: "alert", label: "Alerts", icon: "bell" },
    { id: "tracking", label: "Care", icon: "care" },
  ],
  volunteer: [
    { id: "application", label: "Approval", icon: "shield" },
    { id: "dashboard", label: "Tasks", icon: "clipboard" },
    { id: "active", label: "Active", icon: "activity" },
    { id: "rewards", label: "Rewards", icon: "gift" },
  ],
}

const adminNav = [
  ["overview", "Overview", "home"],
  ["alerts", "Alert management", "bell"],
  ["volunteers", "Volunteer approval", "users"],
  ["assignment", "Care assignment", "care"],
  ["verification", "Service verification", "shield"],
  ["rewards", "Rewards management", "gift"],
  ["reports", "Complaints & reports", "chart"],
  ["privacy", "Privacy & audit logs", "lock"],
]

function Toggle({
  on = true,
  onChange,
}: {
  on?: boolean
  onChange?: () => void
}) {
  return (
    <button
      className={`toggle ${on ? "on" : ""}`}
      onClick={onChange}
      aria-label="Toggle setting"
    >
      <span />
    </button>
  )
}

function Avatar({
  name,
  size = "normal",
}: {
  name: string
  size?: "normal" | "large"
}) {
  return (
    <div className={`avatar ${size}`}>
      {name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  end,
}: {
  icon?: string
  label: string
  value: string
  end?: ReactNode
}) {
  return (
    <div className="info-row">
      {icon && (
        <span className="info-icon">
          <Icon name={icon} size={18} />
        </span>
      )}
      <div className="grow">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {end}
    </div>
  )
}

function Progress({ step }: { step: number }) {
  const labels = ["Awaiting", "Accepted", "Arrived", "Confirm", "Completed"]
  return (
    <div className="progress">
      {labels.map((label, i) => (
        <div className={`progress-step ${i <= step ? "done" : ""}`} key={label}>
          <span>{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  )
}

function DemoLabel() {
  return (
    <div className="demo-label">
      <Icon name="shield" size={14} /> Prototype · Simulated demo data
    </div>
  )
}

function RecipientOnboarding({
  selected,
  setSelected,
  onContinue,
}: {
  selected: string
  setSelected: (value: string) => void
  onContinue: () => void
}) {
  const types = [
    {
      id: "Pregnant woman",
      icon: "heart",
      description: "Wellbeing support throughout pregnancy",
    },
    {
      id: "Elderly person",
      icon: "user",
      description: "Daily living, companionship and health support",
    },
    {
      id: "High-risk patient",
      icon: "shield",
      description: "Closer monitoring and coordinated assistance",
    },
  ]
  return (
    <div className="screen-stack onboarding">
      <div className="onboarding-mark">
        <Icon name="heart" size={29} />
      </div>
      <div>
        <div className="eyebrow">Care recipient setup · Step 1 of 2</div>
        <h1>How can we support you?</h1>
        <p className="lead">
          Select the profile that best describes your current care needs. You
          can update this later.
        </p>
      </div>
      <div className="recipient-types">
        {types.map((type) => (
          <button
            className={selected === type.id ? "selected" : ""}
            onClick={() => setSelected(type.id)}
            key={type.id}
          >
            <span className="recipient-icon">
              <Icon name={type.icon} size={23} />
            </span>
            <span>
              <strong>{type.id}</strong>
              <small>{type.description}</small>
            </span>
            <span className="radio">{selected === type.id && <span />}</span>
          </button>
        ))}
      </div>
      <Card>
        <div className="privacy-promise">
          <Icon name="lock" />
          <span>
            <strong>Your information stays under your control</strong>
            Only family members you authorise can view shared health or location
            updates.
          </span>
        </div>
      </Card>
      <Button wide onClick={onContinue}>
        Continue to my profile
      </Button>
      <DemoLabel />
    </div>
  )
}

function ResidentHome({
  go,
  request,
}: {
  go: (p: string) => void
  request: CareRequest
}) {
  return (
    <div className="screen-stack">
      <div className="greeting">
        <div>
          <div className="eyebrow">Tuesday, 14 May</div>
          <h1>Good morning, Margaret</h1>
          <p>Here’s your wellbeing at a glance.</p>
        </div>
        <Avatar name="Margaret Lee" />
      </div>
      <Card className="health-hero">
        <div className="health-top">
          <div className="pulse-icon">
            <Icon name="heart" size={24} />
          </div>
          <div>
            <span>Heart rate</span>
            <div>
              <strong>72</strong> <small>bpm</small>
            </div>
          </div>
          <Badge tone="green">In range</Badge>
        </div>
        <div className="spark">
          <svg viewBox="0 0 300 52" preserveAspectRatio="none">
            <path
              d="M0 31h30l8-5 8 7 14-2 7-20 12 38 10-23 9 6h30l8-7 10 8h25l9-18 11 28 10-12h39l10-5 14 5h27"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </div>
        <div className="health-meta">
          <span>
            <Icon name="watch" size={16} /> CareWatch connected
          </span>
          <span>Updated 2 min ago</span>
        </div>
      </Card>
      <button
        className="alert-banner"
        onClick={() => go("health")}
      >
        <span className="alert-symbol">
          <Icon name="alert" />
        </span>
        <span>
          <strong>View simulated health status</strong>
          <small>Resident view · no real medical monitoring</small>
        </span>
        <Icon name="arrow" />
      </button>
      <Button wide icon="help" onClick={() => go("request")}>
        Request help
      </Button>
      <section>
        <div className="section-heading">
          <h2>Today’s activity</h2>
          <button onClick={() => go("health")}>View health</button>
        </div>
        <div className="metrics">
          <Card>
            <Icon name="activity" />
            <strong>3,248</strong>
            <span>steps</span>
          </Card>
          <Card>
            <Icon name="clock" />
            <strong>42</strong>
            <span>active min</span>
          </Card>
          <Card>
            <Icon name="heart" />
            <strong>7.5 h</strong>
            <span>sleep</span>
          </Card>
        </div>
      </section>
      <section>
        <div className="section-heading">
          <h2>Upcoming care</h2>
          <button onClick={() => go("care")}>See all</button>
        </div>
        <Card className="service-card" onClick={() => go("care")}>
          <div className="date-block">
            <strong>15</strong>
            <span>MAY</span>
          </div>
          <div className="grow">
            <Badge tone="blue">{request.category}</Badge>
            <h3>{request.time}</h3>
            <p>{request.status}</p>
          </div>
          <Icon name="arrow" />
        </Card>
      </section>
    </div>
  )
}

function HealthScreen({ alert }: { alert: DemoAlert }) {
  return (
    <div className="screen-stack">
      <PageTitle eyebrow="Simulated readings" title="Health monitoring" />
      <div className="metrics two">
        <Card>
          <div className="metric-head">
            <Icon name="heart" />
            <Badge tone="green">Normal</Badge>
          </div>
          <strong className="big-number">
            72 <small>bpm</small>
          </strong>
          <span>Heart rate · 9:42 am</span>
        </Card>
        <Card>
          <div className="metric-head">
            <Icon name="activity" />
            <Badge tone="blue">Today</Badge>
          </div>
          <strong className="big-number">3,248</strong>
          <span>Steps · goal 5,000</span>
        </Card>
      </div>
      <Card>
        <div className="section-heading">
          <h2>7-day heart rate</h2>
          <Badge tone="gray">58–88 bpm</Badge>
        </div>
        <div className="chart-bars">
          {[45, 62, 50, 74, 58, 68, 54, 72, 64, 80, 66, 56].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="chart-labels">
          <span>Wed</span>
          <span>Fri</span>
          <span>Sun</span>
          <span>Today</span>
        </div>
      </Card>
      <Card>
        <h2>Device status</h2>
        <InfoRow
          icon="watch"
          label="CareWatch M2"
          value="Connected · 84% battery"
          end={<Badge tone="green">Live</Badge>}
        />
        <InfoRow
          icon="clock"
          label="Last synchronised"
          value="Today at 9:42 am"
        />
      </Card>
      <div className="offline-state">
        <Icon name="alert" />
        <div>
          <strong>How outdated readings appear</strong>
          <span>Device disconnected · Last reading 3 hours ago</span>
        </div>
        <Badge tone="amber">Demo state</Badge>
      </div>
      <Card>
        <div className="section-heading">
          <h2>Recent alerts</h2>
          <Badge tone={alert.status === "Safe" ? "green" : "red"}>
            {alert.status}
          </Badge>
        </div>
        <p className="muted">
          Simulated low heart-rate event · 48 bpm · 14 May 2025 at 9:42 am.
          This prototype does not provide medical diagnosis, monitoring or
          emergency dispatch.
        </p>
      </Card>
    </div>
  )
}

function RequestScreen({
  go,
  onSubmit,
}: {
  go: (p: string) => void
  onSubmit: (draft: {
    category: ServiceCategory
    time: string
    location: string
    notes: string
  }) => CareRequest
}) {
  const [selected, setSelected] = useState("Meal delivery")
  const [submitted, setSubmitted] = useState<CareRequest | null>(null)
  const [time, setTime] = useState("15 May 2025 · 12:00–1:00 pm")
  const [location, setLocation] = useState("18 Willow Street")
  const [notes, setNotes] = useState(
    "Please knock loudly. Meal should be low in sodium.",
  )
  if (submitted)
    return (
      <div className="screen-stack centered-success">
        <div className="success-orb">
          <Icon name="check" size={36} />
        </div>
        <PageTitle title="Request submitted" />
        <p>
          We’ve notified your authorised family member and care coordinator.
        </p>
        <Card className="request-summary">
          <Badge tone="amber">{submitted.status}</Badge>
          <h2>{submitted.category}</h2>
          <InfoRow icon="file" label="Request ID" value={submitted.id} />
          <InfoRow
            icon="clock"
            label="Preferred time"
            value={submitted.time}
          />
          <InfoRow
            icon="location"
            label="Test location"
            value={submitted.location}
          />
        </Card>
        <Button wide onClick={() => go("care")}>
          Track my request
        </Button>
        <Button wide variant="ghost" onClick={() => setSubmitted(null)}>
          Make another request
        </Button>
      </div>
    )
  return (
    <div className="screen-stack">
      <PageTitle eyebrow="We’re here to help" title="What do you need?" />
      <p className="lead">
        Choose one service. You can add details before submitting.
      </p>
      <div className="choice-list">
        {[
          ["Companionship", "users", "A friendly visit, chat or short walk"],
          ["Meal delivery", "care", "A prepared meal delivered to your door"],
          [
            "Everyday assistance",
            "help",
            "Help with errands or light household tasks",
          ],
        ].map(([title, icon, desc]) => (
          <button
            key={title}
            className={`choice-card ${selected === title ? "selected" : ""}`}
            onClick={() => setSelected(title)}
          >
            <span className="choice-icon">
              <Icon name={icon} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{desc}</small>
            </span>
            <span className="radio">{selected === title && <span />}</span>
          </button>
        ))}
      </div>
      <Card>
        <h2>Request details</h2>
        <label className="field-label" htmlFor="request-time">
          Preferred time
        </label>
        <select
          id="request-time"
          className="form-control"
          value={time}
          onChange={(event) => setTime(event.target.value)}
        >
          <option>14 May 2025 · 3:00–4:00 pm</option>
          <option>15 May 2025 · 12:00–1:00 pm</option>
          <option>15 May 2025 · 4:00–5:00 pm</option>
        </select>
        <label className="field-label" htmlFor="request-location">
          Service location
        </label>
        <input
          id="request-location"
          className="form-control"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <label className="field-label" htmlFor="request-notes">
          Needs and notes
        </label>
        <textarea
          id="request-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <small className="demo-field-note">
          Test location only · No live location integration
        </small>
      </Card>
      <div className="safety-note">
        <Icon name="alert" />
        <span>
          <strong>Is this an emergency?</strong> Call local emergency services
          now. Escalation never waits for a volunteer.
        </span>
      </div>
      <Button
        wide
        onClick={() =>
          setSubmitted(
            onSubmit({
              category: selected as ServiceCategory,
              time,
              location,
              notes,
            }),
          )
        }
      >
        Submit help request
      </Button>
    </div>
  )
}

function CareScreen({
  request,
  onConfirm,
  onCancel,
}: {
  request: CareRequest
  onConfirm: () => void
  onCancel: () => void
}) {
  const volunteer = VOLUNTEERS.find(
    (item) => item.id === request.assignedVolunteerId,
  )

  return (
    <div className="screen-stack">
      <PageTitle eyebrow={`Request #${request.id}`} title="My care" />
      <Card>
        <div className="section-heading">
          <Badge tone="blue">{request.category}</Badge>
          <Badge tone={toneForStatus(request.status)}>{request.status}</Badge>
        </div>
        <h2>{request.time}</h2>
        <p className="muted">{request.location} · Test location</p>
        <Progress step={progressForStatus(request.status)} />
      </Card>
      {volunteer && (
        <Card>
          <h2>Your helper</h2>
          <div className="helper-profile">
            <Avatar name={volunteer.name} size="large" />
            <div className="grow">
              <h3>{volunteer.name}</h3>
              <p>Approved community volunteer</p>
              <div className="rating">
                <Icon name="star" size={15} /> {volunteer.rating} rating
              </div>
            </div>
            <Button variant="secondary" icon="phone">
              Demo call
            </Button>
          </div>
          <div className="verified-line">
            <Icon name="shield" /> Identity, training and task eligibility
            verified
          </div>
        </Card>
      )}
      <Card>
        <h2>Service progress</h2>
        <div className="timeline">
          <div className="done">
            <span>
              <Icon name="check" />
            </span>
            <div>
              <strong>Request submitted</strong>
              <small>{request.id} · demo record</small>
            </div>
          </div>
          <div className={request.assignedVolunteerId ? "done" : ""}>
            <span>
              {request.assignedVolunteerId ? <Icon name="check" /> : 2}
            </span>
            <div>
              <strong>Helper assignment</strong>
              <small>
                {volunteer ? `Assigned to ${volunteer.name}` : "Coordinator review"}
              </small>
            </div>
          </div>
          <div className={progressForStatus(request.status) >= 3 ? "done" : ""}>
            <span>
              {progressForStatus(request.status) >= 3 ? (
                <Icon name="check" />
              ) : (
                3
              )}
            </span>
            <div>
              <strong>Completion verification</strong>
              <small>{request.status}</small>
            </div>
          </div>
        </div>
      </Card>
      {request.status === "Awaiting Verification" &&
        !request.familyConfirmed && (
          <Button wide variant="secondary" onClick={onConfirm}>
            Confirm service received
          </Button>
        )}
      {request.familyConfirmed && request.status === "Awaiting Verification" && (
        <div className="safety-note">
          <Icon name="clock" />
          <span>
            <strong>Pending coordinator verification</strong>
            Receipt is confirmed. Points have not been awarded yet.
          </span>
        </div>
      )}
      {request.status === "Awaiting Review" && (
        <Button wide variant="ghost" onClick={onCancel}>
          Cancel request
        </Button>
      )}
    </div>
  )
}

function ProfileScreen({
  recipientType,
  setRecipientType,
}: {
  recipientType: string
  setRecipientType: (value: string) => void
}) {
  const [cctv, setCctv] = useState(true)
  return (
    <div className="screen-stack">
      <PageTitle eyebrow="Margaret Lee" title="Profile & privacy" />
      <Card>
        <h2>Personal profile</h2>
        <InfoRow icon="user" label="Full name" value="Margaret Lee" />
        <label className="field-label profile-field" htmlFor="recipient-type">
          Recipient category
        </label>
        <select
          id="recipient-type"
          className="form-control"
          value={recipientType}
          onChange={(event) => setRecipientType(event.target.value)}
        >
          <option>Pregnant woman</option>
          <option>Elderly person</option>
          <option>High-risk patient</option>
        </select>
        <InfoRow
          icon="care"
          label="Living assistance needs"
          value="Meal support, errands and companionship"
        />
      </Card>
      <Card>
        <h2>Emergency contacts</h2>
        <div className="contact-row">
          <Avatar name="Rachel Lee" />
          <div className="grow">
            <strong>Rachel Lee</strong>
            <span>Daughter · Primary contact</span>
          </div>
          <Badge tone="green">Authorised</Badge>
        </div>
        <Button wide variant="secondary" icon="plus">
          Add emergency contact
        </Button>
      </Card>
      <Card>
        <h2>Health & location permissions</h2>
        <InfoRow
          icon="heart"
          label="Share simulated health readings"
          value="Rachel Lee, Care coordinator"
          end={<Toggle />}
        />
        <InfoRow
          icon="location"
          label="Share location during service"
          value="Only while a care task is active"
          end={<Toggle />}
        />
      </Card>
      <Card>
        <div className="section-heading">
          <h2>Optional CCTV consent</h2>
          <Toggle on={cctv} onChange={() => setCctv(!cctv)} />
        </div>
        <p className="muted">
          Authorised family may request access during an active alert.
          Volunteers never have routine access.
        </p>
        {cctv ? (
          <div className="consent-box">
            <Icon name="check" />
            <span>
              <strong>Explicit consent recorded</strong>14 May 2025 · Review
              anytime
            </span>
          </div>
        ) : (
          <div className="offline-state">
            <Icon name="lock" />
            <div>
              <strong>Access revoked</strong>
              <span>No CCTV footage can be requested.</span>
            </div>
          </div>
        )}
        <Button wide variant="ghost" onClick={() => setCctv(false)}>
          Revoke CCTV access
        </Button>
      </Card>
      <Card>
        <h2>Data controls</h2>
        <InfoRow
          icon="file"
          label="Download my demo data"
          value="Health, care and access history"
          end={<Icon name="arrow" />}
        />
        <InfoRow
          icon="lock"
          label="Retention & deletion"
          value="Manage how long records are kept"
          end={<Icon name="arrow" />}
        />
      </Card>
    </div>
  )
}

function FamilyDashboard({
  go,
  request,
  alert,
}: {
  go: (p: string) => void
  request: CareRequest
  alert: DemoAlert
}) {
  return (
    <div className="screen-stack">
      <PageTitle eyebrow="Family care circle" title="Good morning, Rachel" />
      <Card className="member-card">
        <div className="member-top">
          <Avatar name="Margaret Lee" size="large" />
          <div className="grow">
            <h2>Margaret Lee</h2>
            <p>Mum · Authorised 2 May 2025</p>
          </div>
          <Badge tone="green">Connected</Badge>
        </div>
        <div className="member-stats">
          <div>
            <span>Heart rate</span>
            <strong>72 bpm</strong>
            <small>2 min ago</small>
          </div>
          <div>
            <span>Activity</span>
            <strong>3,248</strong>
            <small>steps today</small>
          </div>
        </div>
        <div className="location-update">
          <Icon name="location" size={17} />
          <div>
            <strong>Home zone · Test location</strong>
            <small>Shared with your authorisation · Updated 4 min ago</small>
          </div>
          <Badge tone="blue">Authorised</Badge>
        </div>
      </Card>
      <section>
        <div className="section-heading">
          <h2>Needs attention</h2>
          <Badge tone={alert.status === "Safe" ? "green" : "red"}>
            {alert.status}
          </Badge>
        </div>
        <button className="critical-card" onClick={() => go("alert")}>
          <span className="critical-icon">
            <Icon name="heart" />
          </span>
          <span className="grow">
            <small>SIMULATED HEALTH ALERT · 9:42 AM</small>
            <strong>Unusual heart-rate reading</strong>
            <span>48 bpm · CareWatch M2</span>
          </span>
          <Icon name="arrow" />
        </button>
      </section>
      <section>
        <div className="section-heading">
          <h2>Care requests</h2>
          <button onClick={() => go("tracking")}>View all</button>
        </div>
        <Card className="service-card" onClick={() => go("tracking")}>
          <div className="service-icon">
            <Icon name="care" />
          </div>
          <div className="grow">
            <Badge tone={toneForStatus(request.status)}>{request.status}</Badge>
            <h3>{request.category}</h3>
            <p>{request.id} · {request.time}</p>
          </div>
          <Icon name="arrow" />
        </Card>
      </section>
      <Card>
        <div className="section-heading">
          <h2>Authorised members</h2>
          <Badge tone="blue">2 people</Badge>
        </div>
        <div className="avatar-list">
          <Avatar name="Rachel Lee" />
          <Avatar name="Dr Sam Ho" />
          <span>
            Only approved members can view Margaret’s care information.
          </span>
        </div>
      </Card>
    </div>
  )
}

function AlertDetails({
  setModal,
  alert,
  markSafe,
}: {
  setModal: (m: ModalType) => void
  alert: DemoAlert
  markSafe: () => void
}) {
  return (
    <div className="screen-stack">
      <div className="critical-heading">
        <span className="critical-icon large">
          <Icon name="alert" />
        </span>
        <div>
          <div className="eyebrow">{alert.status} · Simulated alert</div>
          <h1>Check on Margaret</h1>
          <p>Unusual heart-rate reading detected</p>
        </div>
      </div>
      <Card>
        <div className="section-heading">
          <h2>Event details</h2>
          <Badge tone={alert.status === "Safe" ? "green" : "red"}>
            {alert.status}
          </Badge>
        </div>
        <InfoRow icon="clock" label="Event time" value="Today, 9:42 am" />
        <InfoRow
          icon="heart"
          label="Watch reading"
          value="48 bpm · below usual range"
        />
        <InfoRow
          icon="watch"
          label="Device status"
          value="Connected · 84% battery"
        />
        <InfoRow
          icon="location"
          label="Test location"
          value="18 Willow Street"
        />
      </Card>
      <Card className="cctv-panel">
        <div className="cctv-image">
          <Icon name="camera" size={34} />
          <span>Footage unavailable</span>
          <small>Camera offline · Last checked 9:43 am</small>
        </div>
        <div className="cctv-copy">
          <Icon name="shield" />
          <p>
            CCTV is optional and consent-controlled. Missing, obscured or
            apparently normal footage never cancels an alert.
          </p>
        </div>
      </Card>
      <div className="safety-note red">
        <Icon name="alert" />
        <span>
          <strong>Act on the alert now</strong>Emergency escalation must not
          wait for CCTV or volunteer confirmation.
        </span>
      </div>
      <div className="sticky-actions">
        <Button
          wide
          variant="secondary"
          icon="phone"
          onClick={() => setModal("contact")}
        >
          Contact resident
        </Button>
        <Button
          wide
          variant="danger"
          icon="alert"
          onClick={() => setModal("escalate")}
        >
          Escalate for help
        </Button>
      </div>
      {alert.status !== "Safe" && (
        <Button wide variant="ghost" onClick={markSafe}>
          Mark resident as safe
        </Button>
      )}
      {alert.status === "Escalated" && (
        <div className="safety-note">
          <Icon name="check" />
          <span>
            <strong>Escalated to coordinator</strong>
            The simulated alert is now visible in Alert Management.
          </span>
        </div>
      )}
    </div>
  )
}

function FamilyTracking({
  request,
  onComplete,
}: {
  request: CareRequest
  onComplete: () => void
}) {
  const volunteer = VOLUNTEERS.find(
    (item) => item.id === request.assignedVolunteerId,
  )

  return (
    <div className="screen-stack">
      <PageTitle eyebrow={`Care request #${request.id}`} title="Care tracking" />
      <Card>
        <div className="section-heading">
          <Badge tone="blue">{request.category}</Badge>
          <Badge tone={toneForStatus(request.status)}>{request.status}</Badge>
        </div>
        <h2>{request.time}</h2>
        <p className="muted">
          Requested by Margaret · {request.location} (test)
        </p>
        <Progress step={progressForStatus(request.status)} />
      </Card>
      {volunteer && (
        <Card>
          <h2>Assigned helper</h2>
          <div className="helper-profile">
            <Avatar name={volunteer.name} size="large" />
            <div className="grow">
              <h3>{volunteer.name}</h3>
              <p>Approved volunteer · {request.category} eligible</p>
              <div className="rating">
                <Icon name="star" size={15} /> {volunteer.rating} rating
              </div>
            </div>
          </div>
        </Card>
      )}
      <Card>
        <h2>Completion & quality</h2>
        <p className="muted">
          Confirm only after Margaret has received the service. Points remain
          locked until coordinator verification.
        </p>
        {request.status === "Awaiting Verification" &&
        !request.familyConfirmed ? (
          <Button wide variant="secondary" onClick={onComplete}>
            Confirm service completion
          </Button>
        ) : (
          <Badge tone={request.status === "Completed" ? "green" : "amber"}>
            {request.status === "Completed"
              ? "Completed · points verified"
              : request.familyConfirmed
                ? "Confirmed · pending coordinator"
                : "Confirmation available after service record"}
          </Badge>
        )}
        <button className="text-link">Report an issue or complaint</button>
      </Card>
    </div>
  )
}

function ApplicationScreen({
  go,
  volunteer,
}: {
  go: (p: string) => void
  volunteer: VolunteerProfile
}) {
  return (
    <div className="screen-stack">
      <PageTitle
        eyebrow="Volunteer onboarding"
        title="Application & approval"
      />
      <Card className="application-status">
        <div className="success-orb small">
          <Icon name="shield" />
        </div>
        <h2>You’re approved</h2>
        <p>
          Your profile is eligible for{" "}
          {volunteer.approvedCategories.join(", ").toLowerCase()} tasks.
        </p>
        <Badge tone="green">Approved 12 May 2025</Badge>
      </Card>
      <Card>
        <h2>Approval journey</h2>
        <div className="approval-list">
          {[
            ["Identity verification", "Verified 6 May"],
            ["Safeguarding interview", "Completed 8 May"],
            ["Care Link training", "Passed 10 May"],
            ["Admin approval", "Approved 12 May"],
          ].map(([a, b], i) => (
            <div key={a}>
              <span>
                <Icon name="check" />
              </span>
              <div>
                <strong>{a}</strong>
                <small>{b}</small>
              </div>
              {i === 3 && <Badge tone="green">Complete</Badge>}
            </div>
          ))}
        </div>
      </Card>
      <div className="safety-note">
        <Icon name="shield" />
        <span>
          <strong>Task permissions</strong>Professional care is restricted to
          appropriately qualified personnel.
        </span>
      </div>
      <Button wide onClick={() => go("dashboard")}>
        Browse available tasks
      </Button>
    </div>
  )
}

function VolunteerDashboard({
  go,
  pointsBalance,
  pointsEarnedThisMonth,
  volunteer,
  requests,
  selectTask,
  switchVolunteer,
}: {
  go: (p: string) => void
  pointsBalance: number
  pointsEarnedThisMonth: number
  volunteer: VolunteerProfile
  requests: CareRequest[]
  selectTask: (id: string, page: "task" | "active") => void
  switchVolunteer: () => void
}) {
  const activeTask = requests.find(
    (request) =>
      request.assignedVolunteerId === volunteer.id &&
      ["Accepted", "In Progress", "Awaiting Verification"].includes(
        request.status,
      ),
  )
  const visibleTasks = requests.filter(
    (request) =>
      request.status === "Approved" ||
      (request.status === "Assigned" &&
        request.assignedVolunteerId === volunteer.id),
  )

  return (
    <div className="screen-stack">
      <div className="greeting">
        <div>
          <div className="eyebrow">Approved volunteer</div>
          <h1>Hello, {volunteer.name.split(" ")[0]}</h1>
          <p>Ready to help your community?</p>
        </div>
        <Avatar name={volunteer.name} />
      </div>
      <Button wide variant="ghost" onClick={switchVolunteer}>
        Demo volunteer: {volunteer.name} · Switch identity
      </Button>
      <Card className="points-card" onClick={() => go("rewards")}>
        <div>
          <span>Verified points</span>
          <strong>{pointsBalance.toLocaleString()}</strong>
          <small>{pointsEarnedThisMonth} points earned this month</small>
        </div>
        <span className="reward-icon">
          <Icon name="gift" />
        </span>
        <Icon name="arrow" />
      </Card>
      {activeTask && (
        <section>
          <div className="section-heading">
            <h2>Your active task</h2>
            <Badge tone={toneForStatus(activeTask.status)}>
              {activeTask.status}
            </Badge>
          </div>
          <Card
            className="service-card"
            onClick={() => selectTask(activeTask.id, "active")}
          >
            <div className="date-block">
              <strong>{activeTask.id.slice(-2)}</strong>
              <span>DEMO</span>
            </div>
            <div className="grow">
              <h3>{activeTask.category}</h3>
              <p>{activeTask.time} · {activeTask.distance}</p>
              <Badge tone={toneForStatus(activeTask.status)}>
                {activeTask.status}
              </Badge>
            </div>
            <Icon name="arrow" />
          </Card>
        </section>
      )}
      <section>
        <div className="section-heading">
          <h2>Available & assigned</h2>
          <Badge tone="gray">{visibleTasks.length} tasks</Badge>
        </div>
        {visibleTasks.map((request) => {
          const eligible = volunteer.approvedCategories.includes(
            request.category,
          )
          return (
          <Card
            className="task-card"
            key={request.id}
            onClick={() => selectTask(request.id, "task")}
          >
            <span className="service-icon">
              <Icon
                name={request.category === "Companionship" ? "users" : "help"}
              />
            </span>
            <div className="grow">
              <h3>{request.category}</h3>
              <p>{request.id} · {request.time} · {request.distance}</p>
              <Badge tone={eligible ? "green" : "gray"}>
                {eligible
                  ? request.status === "Assigned"
                    ? "Assigned to you"
                    : "You’re eligible"
                  : "Not approved for this category"}
              </Badge>
            </div>
            <Icon name="arrow" />
          </Card>
          )
        })}
      </section>
    </div>
  )
}

function TaskDetails({
  request,
  volunteer,
  onAccept,
}: {
  request: CareRequest
  volunteer: VolunteerProfile
  onAccept: () => void
}) {
  const categoryEligible = volunteer.approvedCategories.includes(
    request.category,
  )
  const assignedElsewhere =
    request.assignedVolunteerId !== null &&
    request.assignedVolunteerId !== volunteer.id
  const canAccept =
    categoryEligible &&
    !assignedElsewhere &&
    (request.status === "Approved" || request.status === "Assigned")

  return (
    <div className="screen-stack">
      <PageTitle
        eyebrow={`Task #${request.id}`}
        title={request.category}
      />
      <div className="map-placeholder">
        <div className="map-lines" />
        <span className="map-pin">
          <Icon name="location" />
        </span>
        <Badge tone="blue">Approximate area · Test location</Badge>
      </div>
      <Card>
        <InfoRow icon="clock" label="Time" value={request.time} />
        <InfoRow
          icon="location"
          label="Distance"
          value={`${request.distance} · ${request.approximateLocation}`}
        />
        <InfoRow
          icon="users"
          label="Service"
          value={request.description}
        />
        <InfoRow
          icon="gift"
          label="Verified reward"
          value={`${pointsForCategory(request.category)} points`}
        />
      </Card>
      <Card>
        <h2>Eligibility check</h2>
        <div className="check-list">
          <span>
            <Icon name="check" />
            Identity verified
          </span>
          <span>
            <Icon name="check" />
            Safeguarding training complete
          </span>
          <span>
            <Icon name="check" />
            {categoryEligible
              ? "Permitted task type"
              : `${request.category} is not approved on this profile`}
          </span>
        </div>
      </Card>
      <div className="safety-note">
        <Icon name="lock" />
        <span>
          <strong>Privacy protected</strong>The full address appears only after
          acceptance. CCTV access is never provided to volunteers.
        </span>
      </div>
      {(assignedElsewhere || !categoryEligible) && (
        <div className="safety-note">
          <Icon name="lock" />
          <span>
            <strong>Task unavailable</strong>
            {assignedElsewhere
              ? "This task is exclusively assigned to another volunteer."
              : "Your approval record does not include this service category."}
          </span>
        </div>
      )}
      <Button wide onClick={onAccept} disabled={!canAccept}>
        Accept task
      </Button>
    </div>
  )
}

function ActiveService({
  request,
  onCheckIn,
  onComplete,
}: {
  request: CareRequest
  onCheckIn: () => void
  onComplete: (notes: string, receiptConfirmed: boolean) => void
}) {
  const [demoOverride, setDemoOverride] = useState(false)
  const [notes, setNotes] = useState(request.completionNotes ?? "")
  const [receiptConfirmed, setReceiptConfirmed] = useState(
    request.receiptConfirmed ?? false,
  )

  return (
    <div className="screen-stack">
      <PageTitle
        eyebrow={`Task #${request.id}`}
        title="Active service"
        action={
          <Badge tone={toneForStatus(request.status)}>
            {request.status}
          </Badge>
        }
      />
      <Card>
        <h2>{request.category}</h2>
        <InfoRow icon="clock" label="Scheduled" value={request.time} />
        <InfoRow
          icon="location"
          label="Test location"
          value={request.location}
        />
        <InfoRow icon="user" label="Resident" value="Margaret L." />
      </Card>
      {request.status === "Accepted" ? (
        <>
          <div className="checkin-orb">
            <span>
              <Icon name="location" size={30} />
            </span>
            <h2>Ready to start?</h2>
            <p>
              Check-in is time restricted. Enable the labelled override for
              this hackathon demonstration.
            </p>
          </div>
          <Button
            wide
            variant={demoOverride ? "secondary" : "ghost"}
            onClick={() => setDemoOverride(!demoOverride)}
          >
            Demo Time Override: {demoOverride ? "Enabled" : "Disabled"}
          </Button>
          <Button
            wide
            onClick={onCheckIn}
            icon="location"
            disabled={!demoOverride}
          >
            Check in
          </Button>
        </>
      ) : request.status === "In Progress" ? (
        <>
          <Card className="live-service">
            <div className="live-head">
              <span className="pulse-dot" />
              <div>
                <strong>Service in progress</strong>
                <small>Checked in at {request.checkedInAt}</small>
              </div>
              <strong>00:42:18</strong>
            </div>
          </Card>
          <Card>
            <h2>Service record</h2>
            <label className="field-label">Completion notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Describe the completed service"
            />
            <label className="check-row">
              <input
                type="checkbox"
                checked={receiptConfirmed}
                onChange={(event) => setReceiptConfirmed(event.target.checked)}
              />{" "}
              Service receipt confirmed
            </label>
          </Card>
          <Button
            wide
            onClick={() => onComplete(notes, receiptConfirmed)}
            disabled={!notes.trim() || !receiptConfirmed}
          >
            Check out & submit record
          </Button>
        </>
      ) : (
        <div className="safety-note">
          <Icon name="check" />
          <span>
            <strong>Service record submitted</strong>
            Status: {request.status}. The task will not reset to check-in.
            {request.status === "Awaiting Verification" &&
              " Points remain pending resident or family confirmation and coordinator verification."}
          </span>
        </div>
      )}
      <div className="safety-note">
        <Icon name="alert" />
        <span>
          <strong>Need help?</strong>Contact the coordinator. For emergencies,
          call local emergency services immediately.
        </span>
      </div>
    </div>
  )
}

function RewardsScreen({
  onRedeem,
  pointsBalance,
  pendingPoints,
  transactions,
  redemptions,
}: {
  onRedeem: () => void
  pointsBalance: number
  pendingPoints: number
  transactions: RewardTransaction[]
  redemptions: RedemptionRecord[]
}) {
  return (
    <div className="screen-stack">
      <PageTitle
        eyebrow="Points & rewards"
        title={`${pointsBalance.toLocaleString()} verified points`}
      />
      <Card className="points-summary">
        <div>
          <span>Available</span>
          <strong>{pointsBalance.toLocaleString()}</strong>
        </div>
        <div>
          <span>Pending verification</span>
          <strong>{pendingPoints}</strong>
        </div>
        <p>
          Points are awarded only after verified service completion. Disputed
          points are held for review.
        </p>
      </Card>
      <section>
        <div className="section-heading">
          <h2>Reward catalogue</h2>
          <button>View all</button>
        </div>
        <div className="reward-grid">
          <Card>
            <span className="reward-visual coffee">
              <Icon name="gift" />
            </span>
            <h3>Local café voucher</h3>
            <p>RM10 demo voucher</p>
            <Button
              wide
              variant="secondary"
              onClick={onRedeem}
              disabled={pointsBalance < 800}
            >
              800 pts
            </Button>
          </Card>
          <Card>
            <span className="reward-visual bus">
              <Icon name="activity" />
            </span>
            <h3>Transit day pass</h3>
            <p>Community partner</p>
            <Button wide variant="secondary" disabled>
              1,500 pts
            </Button>
          </Card>
        </div>
      </section>
      <Card>
        <h2>Points history</h2>
        {transactions.map((transaction) => (
          <InfoRow
            key={transaction.id}
            icon="gift"
            label={`#${transaction.requestId} · ${transaction.category}`}
            value={`Awarded ${transaction.points} points · ${transaction.date}`}
            end={<Badge tone="green">Points Awarded</Badge>}
          />
        ))}
        <InfoRow
          icon="shield"
          label="Existing demo balance"
          value={`${INITIAL_VOLUNTEER_POINTS.toLocaleString()} verified points before #CC-1048`}
        />
      </Card>
      <Card>
        <h2>Redemption history</h2>
        {redemptions.map((redemption) => (
          <InfoRow
            key={redemption.id}
            icon="gift"
            label={redemption.reward}
            value={`Redeemed ${redemption.date} · ${redemption.points.toLocaleString()} pts`}
            end={
              <Badge tone={redemption.status === "Sent" ? "green" : "blue"}>
                {redemption.status}
              </Badge>
            }
          />
        ))}
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  tone = "blue",
}: {
  label: string
  value: string
  change: string
  tone?: string
}) {
  return (
    <Card className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </Card>
  )
}

function AdminTable({
  rows,
  headers,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminContent({
  page,
  navigate,
  toast,
  requests,
  selectedRequest,
  assignVolunteer,
  rejectRequest,
  verifyRequest,
  rewardTransactions,
  redemptions,
  alert,
  acknowledgeAlert,
}: {
  page: string
  navigate: (p: string) => void
  toast: (s: string) => void
  requests: CareRequest[]
  selectedRequest: CareRequest
  assignVolunteer: (requestId: string, volunteerId: string) => void
  rejectRequest: (requestId: string) => void
  verifyRequest: (requestId: string) => void
  rewardTransactions: RewardTransaction[]
  redemptions: RedemptionRecord[]
  alert: DemoAlert
  acknowledgeAlert: () => void
}) {
  if (page === "overview")
    return (
      <>
        <PageTitle
          eyebrow="Tuesday, 14 May 2025"
          title="Operations overview"
          action={
            <Button icon="plus" onClick={() => navigate("assignment")}>
              Assign care
            </Button>
          }
        />
        <div className="stat-grid">
          <StatCard
            label="Open requests"
            value="18"
            change="6 need assignment"
          />
          <StatCard
            label="Active services"
            value="12"
            change="4 completing today"
            tone="green"
          />
          <StatCard
            label="Volunteer applications"
            value="7"
            change="3 ready for review"
            tone="amber"
          />
          <StatCard
            label="Unresolved complaints"
            value="3"
            change="Oldest: 19 hours"
            tone="red"
          />
        </div>
        <div className="admin-grid">
          <Card>
            <div className="section-heading">
              <h2>Requests needing action</h2>
              <button onClick={() => navigate("assignment")}>View all</button>
            </div>
            <AdminTable
              headers={["Request", "Resident", "Service", "Status"]}
              rows={requests.slice(0, 4).map((request) => [
                <strong>#{request.id}</strong>,
                "Margaret Lee",
                request.category,
                <Badge tone={toneForStatus(request.status)}>
                  {request.status}
                </Badge>,
              ])}
            />
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Live service status</h2>
              <Badge tone="green">12 active</Badge>
            </div>
            <div className="live-list">
              {[
                ["Daniel Wong", "Meal delivery", "00:42:18"],
                ["Aisha Khan", "Companionship", "00:18:04"],
                ["Marco Silva", "Everyday help", "01:02:31"],
              ].map((r) => (
                <div key={r[0]}>
                  <span className="pulse-dot" />
                  <Avatar name={r[0]} />
                  <div className="grow">
                    <strong>{r[0]}</strong>
                    <small>{r[1]}</small>
                  </div>
                  <strong>{r[2]}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <div className="section-heading">
            <h2>Recent alerts</h2>
            <button onClick={() => navigate("alerts")}>Open alert queue</button>
          </div>
          <AdminTable
            headers={["Time", "Resident", "Event", "Device", "Response"]}
            rows={[
              [
                <strong>9:42 am</strong>,
                "Margaret Lee",
                "Heart rate · 48 bpm",
                <Badge tone="green">Connected</Badge>,
                <Badge tone={alert.status === "Safe" ? "green" : "red"}>
                  {alert.status}
                </Badge>,
              ],
              [
                "8:16 am",
                "James Patel",
                "Device disconnected",
                <Badge tone="amber">3h outdated</Badge>,
                <Badge tone="blue">Family notified</Badge>,
              ],
            ]}
          />
        </Card>
      </>
    )
  if (page === "alerts")
    return (
      <>
        <PageTitle
          eyebrow="Safety operations"
          title="Alert management"
          action={
            <Badge tone={alert.status === "Safe" ? "green" : "red"}>
              {alert.status}
            </Badge>
          }
        />
        <div className="split-layout">
          <Card>
            <h2>Alert queue</h2>
            <div className="queue-item selected">
              <span className="critical-icon">
                <Icon name="heart" />
              </span>
              <div className="grow">
                <strong>Margaret Lee</strong>
                <small>48 bpm · 9:42 am</small>
              </div>
              <Badge tone={alert.status === "Safe" ? "green" : "red"}>
                {alert.status}
              </Badge>
            </div>
            <div className="queue-item">
              <span className="service-icon">
                <Icon name="watch" />
              </span>
              <div className="grow">
                <strong>James Patel</strong>
                <small>Device offline · 8:16 am</small>
              </div>
              <Badge tone="amber">Review</Badge>
            </div>
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Margaret Lee</h2>
              <Badge tone={alert.status === "Safe" ? "green" : "red"}>
                {alert.status}
              </Badge>
            </div>
            <InfoRow
              icon="heart"
              label="Simulated reading"
              value="48 bpm · below usual range"
            />
            <InfoRow
              icon="watch"
              label="Device"
              value="CareWatch M2 · connected"
            />
            <InfoRow
              icon="camera"
              label="Optional CCTV"
              value="Unavailable · camera offline"
            />
            <div className="safety-note red">
              <Icon name="alert" />
              <span>
                Do not delay emergency escalation for volunteer or CCTV
                confirmation.
              </span>
            </div>
            <div className="button-row">
              <Button
                variant="secondary"
                icon="phone"
                onClick={() => toast("Calling authorised family member…")}
              >
                Contact family
              </Button>
              <Button
                variant={alert.status === "Acknowledged" ? "secondary" : "primary"}
                icon="check"
                onClick={acknowledgeAlert}
                disabled={alert.status === "Acknowledged"}
              >
                {alert.status === "Acknowledged"
                  ? "Acknowledged"
                  : "Acknowledge & review"}
              </Button>
            </div>
          </Card>
        </div>
      </>
    )
  if (page === "volunteers")
    return (
      <>
        <PageTitle
          eyebrow="People & safeguarding"
          title="Volunteer approval"
          action={<Badge tone="amber">7 pending</Badge>}
        />
        <Card>
          <AdminTable
            headers={[
              "Applicant",
              "Identity",
              "Interview",
              "Training",
              "Qualifications",
              "Action",
            ]}
            rows={[
              [
                <div className="person-cell">
                  <Avatar name="Maya Chen" />
                  <span>
                    <strong>Maya Chen</strong>
                    <small>Applied 11 May</small>
                  </span>
                </div>,
                <Badge tone="green">Verified</Badge>,
                <Badge tone="green">Complete</Badge>,
                <Badge tone="green">Passed</Badge>,
                "Community tasks",
                <Button onClick={() => toast("Maya Chen approved")}>
                  Approve
                </Button>,
              ],
              [
                <div className="person-cell">
                  <Avatar name="Liam Fox" />
                  <span>
                    <strong>Liam Fox</strong>
                    <small>Applied 12 May</small>
                  </span>
                </div>,
                <Badge tone="green">Verified</Badge>,
                <Badge tone="amber">Scheduled</Badge>,
                <Badge tone="gray">Not started</Badge>,
                "—",
                <Button variant="secondary">Review</Button>,
              ],
              [
                <div className="person-cell">
                  <Avatar name="Noor Aziz" />
                  <span>
                    <strong>Noor Aziz</strong>
                    <small>Applied 13 May</small>
                  </span>
                </div>,
                <Badge tone="amber">Review</Badge>,
                <Badge tone="gray">Pending</Badge>,
                <Badge tone="gray">Pending</Badge>,
                "Registered nurse",
                <Button variant="secondary">Review</Button>,
              ],
            ]}
          />
        </Card>
        <Card>
          <div className="policy-row">
            <Icon name="shield" />
            <div>
              <strong>Qualification-based permissions</strong>
              <span>
                Professional care tasks are only visible to personnel with
                current, verified qualifications.
              </span>
            </div>
            <Button variant="secondary">Manage task rules</Button>
          </div>
        </Card>
      </>
    )
  if (page === "assignment")
    {
      const assignedVolunteer = VOLUNTEERS.find(
        (volunteer) =>
          volunteer.id === selectedRequest.assignedVolunteerId,
      )
      const assignmentOpen = ["Awaiting Review", "Approved", "Assigned"].includes(
        selectedRequest.status,
      )
    return (
      <>
        <PageTitle
          eyebrow={`Request #${selectedRequest.id}`}
          title="Care assignment"
          action={
            <Badge tone={toneForStatus(selectedRequest.status)}>
              {selectedRequest.status}
            </Badge>
          }
        />
        <div className="assignment-grid">
          <Card>
            <h2>Request summary</h2>
            <InfoRow icon="user" label="Resident" value="Margaret Lee" />
            <InfoRow
              icon="care"
              label="Task"
              value={selectedRequest.category}
            />
            <InfoRow
              icon="clock"
              label="Time"
              value={selectedRequest.time}
            />
            <InfoRow
              icon="location"
              label="Test location"
              value={selectedRequest.approximateLocation}
            />
            <div className="note-box">{selectedRequest.notes}</div>
            {assignedVolunteer && (
              <div className="consent-box">
                <Icon name="check" />
                <span>
                  <strong>Assigned to {assignedVolunteer.name}</strong>
                  Awaiting volunteer acceptance
                </span>
              </div>
            )}
            {selectedRequest.status === "Awaiting Review" && (
              <Button
                wide
                variant="ghost"
                onClick={() => rejectRequest(selectedRequest.id)}
              >
                Reject request
              </Button>
            )}
          </Card>
          <Card>
            <div className="section-heading">
              <h2>Recommended helpers</h2>
              <Badge tone="blue">
                {
                  VOLUNTEERS.filter((volunteer) =>
                    volunteer.approvedCategories.includes(
                      selectedRequest.category,
                    ),
                  ).length
                }{" "}
                matches
              </Badge>
            </div>
            {VOLUNTEERS.map((volunteer) => {
              const eligible = volunteer.approvedCategories.includes(
                selectedRequest.category,
              )
              return (
              <div className="helper-option" key={volunteer.id}>
                <Avatar name={volunteer.name} />
                <div className="grow">
                  <strong>{volunteer.name}</strong>
                  <small>
                    {volunteer.distance} · Available · ★ {volunteer.rating}
                  </small>
                  <span>
                    <Icon name="shield" size={14} />{" "}
                    {eligible
                      ? `Approved · ${selectedRequest.category} eligible`
                      : `Not approved for ${selectedRequest.category}`}
                  </span>
                </div>
                <Button
                  variant={
                    selectedRequest.assignedVolunteerId === volunteer.id
                      ? "primary"
                      : "secondary"
                  }
                  onClick={() =>
                    assignVolunteer(selectedRequest.id, volunteer.id)
                  }
                  disabled={!eligible || !assignmentOpen}
                >
                  {selectedRequest.assignedVolunteerId === volunteer.id
                    ? "Assigned"
                    : "Assign"}
                </Button>
              </div>
              )
            })}
          </Card>
        </div>
        <div className="safety-note">
          <Icon name="alert" />
          <span>
            <strong>If no helper accepts</strong>Notify the family and
            coordinator, then offer rescheduling, partner services or other safe
            arrangements.
          </span>
        </div>
      </>
    )
    }
  if (page === "verification")
    {
      const verificationRequests = requests.filter(
        (request) =>
          request.status === "Awaiting Verification" ||
          request.pointsAwarded,
      )
    return (
      <>
        <PageTitle
          eyebrow="Quality & integrity"
          title="Service verification"
          action={
            <Badge tone="amber">
              {
                requests.filter(
                  (request) => request.status === "Awaiting Verification",
                ).length
              }{" "}
              awaiting review
            </Badge>
          }
        />
        <Card>
          <AdminTable
            headers={[
              "Service",
              "Helper",
              "Check in/out",
              "Confirmation",
              "Duplicate check",
              "Points",
            ]}
            rows={[
              ...verificationRequests.map((request) => {
                const volunteer = VOLUNTEERS.find(
                  (item) => item.id === request.assignedVolunteerId,
                )
                return [
                  <span>
                    <strong>#{request.id}</strong>
                    <small className="cell-sub">{request.category}</small>
                  </span>,
                  volunteer?.name ?? "Unassigned",
                  request.checkedInAt && request.checkedOutAt
                    ? `${request.checkedInAt}–${request.checkedOutAt}`
                    : "Record submitted",
                  request.familyConfirmed ? (
                    <Badge tone="green">Family confirmed</Badge>
                  ) : (
                    <Badge tone="amber">Confirmation needed</Badge>
                  ),
                  <Badge tone="green">Clear</Badge>,
                  request.pointsAwarded ? (
                    <Badge tone="green">
                      Awarded {pointsForCategory(request.category)} points
                    </Badge>
                  ) : request.familyConfirmed ? (
                    <Button onClick={() => verifyRequest(request.id)}>
                      Verify & award {pointsForCategory(request.category)}
                    </Button>
                  ) : (
                    <Badge tone="amber">Points held</Badge>
                  ),
                ]
              }),
              [
                <span>
                  <strong>#CC-1039</strong>
                  <small className="cell-sub">Companionship</small>
                </span>,
                "M. Brown",
                "10:01–10:14 am",
                <Badge tone="red">Disputed</Badge>,
                <Badge tone="amber">Possible overlap</Badge>,
                <Badge tone="amber">Points held</Badge>,
              ],
            ]}
          />
        </Card>
        {rewardTransactions.length > 0 && (
          <div className="safety-note">
            <Icon name="check" />
            <span>
              <strong>Latest verified award recorded</strong>
              #{rewardTransactions[0].requestId} received{" "}
              {rewardTransactions[0].points} points once. The service is marked
              Completed and cannot be rewarded again.
            </span>
          </div>
        )}
        <div className="admin-grid">
          <Card>
            <h2>Verification checklist</h2>
            <div className="check-list">
              <span>
                <Icon name="check" />
                Location-consistent check-in
              </span>
              <span>
                <Icon name="check" />
                Resident or family confirmation
              </span>
              <span>
                <Icon name="check" />
                Service notes submitted
              </span>
              <span>
                <Icon name="check" />
                No duplicate active task
              </span>
            </div>
          </Card>
          <Card>
            <h2>Disputed points</h2>
            <p className="muted">
              Points remain on hold until a coordinator completes manual review.
              No automatic award is permitted. Rejected services receive no
              points.
            </p>
            <Button variant="secondary">Review dispute</Button>
          </Card>
        </div>
      </>
    )
    }
  if (page === "rewards")
    return (
      <>
        <PageTitle
          eyebrow="Volunteer recognition"
          title="Rewards management"
          action={<Button icon="plus">Add reward</Button>}
        />
        <div className="stat-grid three">
          <StatCard
            label="Points awarded this month"
            value={(
              INITIAL_MONTHLY_POINTS +
              rewardTransactions.reduce(
                (total, transaction) => total + transaction.points,
                0,
              )
            ).toLocaleString()}
            change={
              rewardTransactions.length
                ? `${rewardTransactions.length} new demo service award`
                : "No new demo service awards"
            }
          />
          <StatCard
            label="Pending redemption"
            value={redemptions
              .filter((record) => record.status === "Processing")
              .length.toString()}
            change={`${redemptions
              .filter((record) => record.status === "Processing")
              .reduce((total, record) => total + record.points, 0)
              .toLocaleString()} points total`}
            tone="amber"
          />
          <StatCard
            label="Catalogue items"
            value="12"
            change="9 currently available"
            tone="green"
          />
        </div>
        <Card>
          <h2>Point rules</h2>
          <AdminTable
            headers={["Task type", "Base points", "Conditions", "Status"]}
            rows={[
              [
                <strong>Companionship</strong>,
                SERVICE_POINTS.companionship.toString(),
                "45+ minutes · verified",
                <Badge tone="green">Active</Badge>,
              ],
              [
                <strong>Meal delivery</strong>,
                SERVICE_POINTS.mealDelivery.toString(),
                "Check-in + confirmation",
                <Badge tone="green">Active</Badge>,
              ],
              [
                <strong>Everyday assistance</strong>,
                SERVICE_POINTS.everydayAssistance.toString(),
                "Up to 90 min · verified",
                <Badge tone="green">Active</Badge>,
              ],
            ]}
          />
        </Card>
        <Card>
          <h2>Recent service point awards</h2>
          {rewardTransactions.length ? (
            <AdminTable
              headers={["Service", "Volunteer", "Task", "Points", "Status"]}
              rows={rewardTransactions.map((transaction) => {
                const request = requests.find(
                  (item) => item.id === transaction.requestId,
                )
                const volunteer = VOLUNTEERS.find(
                  (item) => item.id === request?.assignedVolunteerId,
                )
                return [
                  <strong>#{transaction.requestId}</strong>,
                  volunteer?.name ?? "Volunteer",
                  transaction.category,
                  transaction.points.toString(),
                  <Badge tone="green">Points Awarded</Badge>,
                ]
              })}
            />
          ) : (
            <p className="muted">
              No new service point awards in this demonstration session.
            </p>
          )}
        </Card>
        <Card>
          <h2>Recent redemptions</h2>
          <AdminTable
            headers={["Volunteer", "Reward", "Points", "Date", "Status"]}
            rows={redemptions.map((record) => [
              <strong>
                {VOLUNTEERS.find(
                  (volunteer) => volunteer.id === record.volunteerId,
                )?.name ?? "Volunteer"}
              </strong>,
              record.reward,
              record.points.toLocaleString(),
              record.date,
              <Badge tone={record.status === "Sent" ? "green" : "blue"}>
                {record.status}
              </Badge>,
            ])}
          />
        </Card>
      </>
    )
  if (page === "reports")
    return (
      <>
        <PageTitle
          eyebrow="Service quality"
          title="Complaints & reports"
          action={
            <Button variant="secondary" icon="file">
              Export report
            </Button>
          }
        />
        <div className="stat-grid three">
          <StatCard
            label="Median response time"
            value="8m 24s"
            change="↓ 12% this month"
            tone="green"
          />
          <StatCard
            label="Completion rate"
            value="94.8%"
            change="342 of 361 services"
          />
          <StatCard
            label="Satisfaction"
            value="4.7 / 5"
            change="286 verified ratings"
            tone="green"
          />
        </div>
        <Card>
          <h2>Open complaints</h2>
          <AdminTable
            headers={[
              "Case",
              "Submitted by",
              "Service",
              "Opened",
              "Priority",
              "Owner",
            ]}
            rows={[
              [
                <strong>#CP-204</strong>,
                "Rachel Lee",
                "Meal delivery",
                "14 May · 8:10 am",
                <Badge tone="red">High</Badge>,
                "J. Evans",
              ],
              [
                <strong>#CP-201</strong>,
                "Arthur Ng",
                "Companionship",
                "13 May · 2:22 pm",
                <Badge tone="amber">Medium</Badge>,
                "S. Malik",
              ],
            ]}
          />
        </Card>
      </>
    )
  return (
    <>
      <PageTitle
        eyebrow="Governance & consent"
        title="Privacy & audit logs"
        action={
          <Button variant="secondary" icon="file">
            Export audit log
          </Button>
        }
      />
      <div className="privacy-grid">
        <Card>
          <h2>Access permissions</h2>
          <InfoRow
            icon="users"
            label="Family authorisations"
            value="184 active · 3 expiring soon"
          />
          <InfoRow
            icon="camera"
            label="CCTV consent"
            value="42 opted in · explicit consent"
          />
          <InfoRow
            icon="location"
            label="Location sharing"
            value="Active service only"
          />
        </Card>
        <Card>
          <h2>Retention controls</h2>
          <InfoRow icon="file" label="Service records" value="24 months" />
          <InfoRow icon="camera" label="CCTV access logs" value="90 days" />
          <Button variant="secondary">Manage retention policy</Button>
        </Card>
      </div>
      <Card>
        <h2>Recent access events</h2>
        <AdminTable
          headers={["Time", "Actor", "Action", "Record", "Basis", "Result"]}
          rows={[
            [
              <strong>9:43 am</strong>,
              "Rachel Lee",
              "Requested CCTV status",
              "Margaret Lee alert",
              "Explicit consent",
              <Badge tone="amber">Unavailable</Badge>,
            ],
            [
              "9:42 am",
              "System",
              "Shared health alert",
              "Margaret Lee",
              "Authorised family",
              <Badge tone="green">Allowed</Badge>,
            ],
            [
              "Yesterday",
              "Margaret Lee",
              "Revoked old contact",
              "Peter Lee",
              "Resident control",
              <Badge tone="green">Completed</Badge>,
            ],
          ]}
        />
      </Card>
      <div className="safety-note">
        <Icon name="lock" />
        <span>
          Every health, location and CCTV access event is logged. Volunteers
          have no routine CCTV permission.
        </span>
      </div>
    </>
  )
}

function Modal({
  type,
  close,
  action,
}: {
  type: ModalType
  close: () => void
  action: (type: ModalType) => void
}) {
  if (!type) return null
  const content =
    type === "contact"
      ? {
          icon: "phone",
          title: "Contact Margaret",
          body: "Start a simulated call to Margaret’s saved demo contact?",
          button: "Start demo call",
          danger: false,
        }
      : type === "call"
        ? {
            icon: "phone",
            title: "Demo call in progress",
            body: "Connected to Margaret · 00:18. No real phone call has been placed.",
            button: "End demo call",
            danger: false,
          }
      : type === "escalate"
        ? {
            icon: "alert",
            title: "Escalate for help",
            body: "This starts the urgent response protocol and notifies the care coordinator. For immediate danger, call local emergency services.",
            button: "Escalate now",
            danger: true,
          }
        : type === "complete"
          ? {
              icon: "check",
              title: "Confirm service?",
              body: "Confirm that the service was received. Points remain pending until coordinator verification.",
              button: "Confirm completion",
              danger: false,
            }
          : {
              icon: "gift",
              title: "Redeem reward?",
              body: "Use 800 verified points for an RM10 demo café voucher?",
              button: "Redeem 800 points",
              danger: false,
            }
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className={`modal-icon ${content.danger ? "danger" : ""}`}>
          <Icon name={content.icon} size={28} />
        </span>
        <h2>{content.title}</h2>
        <p>{content.body}</p>
        <div className="modal-actions">
          <Button wide variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            wide
            variant={content.danger ? "danger" : "primary"}
            onClick={() => action(type)}
          >
            {content.button}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [showRoles, setShowRoles] = useState(false)
  const [recipientType, setRecipientType] = useState("Elderly person")
  const [demoState, setDemoState] = useState<DemoState>(() => {
    try {
      const saved = window.localStorage.getItem("care-link-demo-state")
      if (!saved) return INITIAL_DEMO_STATE
      const parsed = JSON.parse(saved) as DemoState
      return {
        ...parsed,
        rewardTransactions: (parsed.rewardTransactions ?? []).map(
          (transaction) => ({
            ...transaction,
            volunteerId:
              transaction.volunteerId ??
              parsed.requests.find(
                (request) => request.id === transaction.requestId,
              )?.assignedVolunteerId ??
              "daniel",
          }),
        ),
        redemptions: (parsed.redemptions ?? []).map((redemption) => ({
          ...redemption,
          volunteerId: redemption.volunteerId ?? "daniel",
        })),
      }
    } catch {
      return INITIAL_DEMO_STATE
    }
  })
  const [activeVolunteerId, setActiveVolunteerId] = useState("daniel")
  const [selectedRequestId, setSelectedRequestId] = useState("CC-1052")
  const [pages, setPages] = useState<Record<Role, string>>({
    resident: "onboarding",
    family: "dashboard",
    volunteer: "application",
    admin: "overview",
  })
  const [modal, setModal] = useState<ModalType>(null)
  const [toast, setToast] = useState("")
  const current = role ? pages[role] : ""
  const activeVolunteer =
    VOLUNTEERS.find((volunteer) => volunteer.id === activeVolunteerId) ??
    VOLUNTEERS[0]
  const selectedRequest =
    demoState.requests.find((request) => request.id === selectedRequestId) ??
    demoState.requests[0]
  const latestResidentRequest = demoState.requests[0]
  const redeemedPoints = demoState.redemptions
    .filter(
      (redemption) =>
        redemption.affectsDemoBalance &&
        redemption.volunteerId === activeVolunteer.id,
    )
    .reduce((total, redemption) => total + redemption.points, 0)
  const volunteerPoints =
    INITIAL_VOLUNTEER_POINTS +
    demoState.rewardTransactions.reduce(
      (total, transaction) =>
        transaction.volunteerId === activeVolunteer.id
          ? total + transaction.points
          : total,
      0,
    ) -
    redeemedPoints
  const pendingVolunteerPoints = demoState.requests
    .filter(
      (request) =>
        request.assignedVolunteerId === activeVolunteer.id &&
        request.status === "Awaiting Verification" &&
        !request.pointsAwarded,
    )
    .reduce(
      (total, request) => total + pointsForCategory(request.category),
      0,
    )

  useEffect(() => {
    window.localStorage.setItem(
      "care-link-demo-state",
      JSON.stringify(demoState),
    )
  }, [demoState])

  const navigate = (page: string) => {
    if (!role) return
    setPages((p) => ({ ...p, [role]: page }))
  }
  const switchRole = (r: Role, page: string) => {
    setRole(r)
    setPages((p) => ({ ...p, [r]: page }))
    setShowRoles(false)
  }
  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(""), 2600)
  }
  const createRequest = (draft: {
    category: ServiceCategory
    time: string
    location: string
    notes: string
  }) => {
    const nextNumber =
      Math.max(
        ...demoState.requests.map((request) =>
          Number(request.id.replace("CC-", "")),
        ),
      ) + 1
    const request: CareRequest = {
      id: `CC-${nextNumber}`,
      residentId: "margaret",
      category: draft.category,
      time: draft.time,
      location: draft.location,
      approximateLocation: "North Willow · Zone 3",
      distance: "1.0 km",
      notes: draft.notes,
      description:
        draft.category === "Companionship"
          ? "Conversation and short walk"
          : draft.category === "Meal delivery"
            ? "Deliver a prepared meal"
            : "Help with errands and light household tasks",
      status: "Awaiting Review",
      assignedVolunteerId: null,
      pointsAwarded: false,
    }
    setDemoState((state) => ({
      ...state,
      requests: [request, ...state.requests],
    }))
    setSelectedRequestId(request.id)
    return request
  }
  const updateRequest = (
    requestId: string,
    updater: (request: CareRequest) => CareRequest,
  ) => {
    setDemoState((state) => ({
      ...state,
      requests: state.requests.map((request) =>
        request.id === requestId ? updater(request) : request,
      ),
    }))
  }
  const assignVolunteer = (requestId: string, volunteerId: string) => {
    const volunteer = VOLUNTEERS.find((item) => item.id === volunteerId)
    const request = demoState.requests.find((item) => item.id === requestId)
    if (
      !volunteer ||
      !request ||
      !volunteer.approvedCategories.includes(request.category)
    ) {
      notify("This volunteer is not approved for the selected service")
      return
    }
    updateRequest(requestId, (currentRequest) => ({
      ...currentRequest,
      assignedVolunteerId: volunteerId,
      status: "Assigned",
    }))
    notify(`Assigned to ${volunteer.name} · awaiting acceptance`)
  }
  const acceptRequest = (requestId: string) => {
    const request = demoState.requests.find((item) => item.id === requestId)
    const hasActiveTask = demoState.requests.some(
      (item) =>
        item.assignedVolunteerId === activeVolunteer.id &&
        ["Accepted", "In Progress"].includes(item.status),
    )
    if (
      !request ||
      !activeVolunteer.approvedCategories.includes(request.category) ||
      (request.assignedVolunteerId &&
        request.assignedVolunteerId !== activeVolunteer.id)
    ) {
      notify("This task cannot be accepted by the current volunteer")
      return
    }
    if (hasActiveTask) {
      notify("Complete your current active service before accepting another")
      return
    }
    updateRequest(requestId, (currentRequest) => ({
      ...currentRequest,
      assignedVolunteerId: activeVolunteer.id,
      status: "Accepted",
    }))
    notify(`${request.id} accepted · no points awarded yet`)
    navigate("active")
  }
  const checkIn = (requestId: string) => {
    updateRequest(requestId, (request) =>
      request.status === "Accepted"
        ? { ...request, status: "In Progress", checkedInAt: "3:00 pm" }
        : request,
    )
    notify("Demo check-in recorded · service in progress")
  }
  const checkOut = (
    requestId: string,
    completionNotes: string,
    receiptConfirmed: boolean,
  ) => {
    updateRequest(requestId, (request) =>
      request.status === "In Progress"
        ? {
            ...request,
            status: "Awaiting Verification",
            checkedOutAt: "4:00 pm",
            completionNotes,
            receiptConfirmed,
            familyConfirmed: false,
          }
        : request,
    )
    notify("Service record submitted · pending verification")
  }
  const confirmService = (requestId: string) => {
    updateRequest(requestId, (request) =>
      request.status === "Awaiting Verification"
        ? { ...request, familyConfirmed: true }
        : request,
    )
    notify("Service receipt confirmed · coordinator verification pending")
  }
  const verifyRequest = (requestId: string) => {
    setDemoState((state) => {
      const request = state.requests.find((item) => item.id === requestId)
      if (
        !request ||
        request.status !== "Awaiting Verification" ||
        !request.familyConfirmed ||
        request.pointsAwarded ||
        state.rewardTransactions.some(
          (transaction) => transaction.requestId === requestId,
        )
      )
        return state
      const points = pointsForCategory(request.category)
      return {
        ...state,
        requests: state.requests.map((item) =>
          item.id === requestId
            ? {
                ...item,
                status: "Completed",
                verifiedAt: "14 May 2025",
                pointsAwarded: true,
              }
            : item,
        ),
        rewardTransactions: [
          {
            id: `PT-${requestId}`,
            requestId,
            volunteerId: request.assignedVolunteerId ?? "daniel",
            category: request.category,
            points,
            date: "14 May 2025",
            type: "Service verification",
          },
          ...state.rewardTransactions,
        ],
      }
    })
    notify(`Verified ${requestId} · points awarded once`)
  }
  const redeemCafeReward = () => {
    if (volunteerPoints < 800) {
      notify("Insufficient verified points")
      return
    }
    setDemoState((state) => ({
      ...state,
      redemptions: [
        {
          id: `RD-${Date.now()}`,
          volunteerId: activeVolunteer.id,
          reward: "RM10 local café demo voucher",
          points: 800,
          date: "14 May 2025",
          status: "Processing",
          affectsDemoBalance: true,
        },
        ...state.redemptions,
      ],
    }))
    notify("800 points redeemed · demo voucher processing")
  }
  const modalAction = (type: ModalType) => {
    if (type === "contact") {
      setModal("call")
      return
    }
    setModal(null)
    if (type === "call") notify("Demo call ended · follow-up can be recorded")
    if (type === "escalate") {
      setDemoState((state) => ({
        ...state,
        alert: { ...state.alert, status: "Escalated" },
      }))
      notify("Simulated alert escalated to coordinator")
    }
    if (type === "complete") {
      confirmService(selectedRequest.id)
    }
    if (type === "redeem") redeemCafeReward()
  }

  let content: ReactNode = null
  if (role === "resident")
    content =
      current === "onboarding" ? (
        <RecipientOnboarding
          selected={recipientType}
          setSelected={setRecipientType}
          onContinue={() => navigate("home")}
        />
      ) : current === "home" ? (
        <ResidentHome go={navigate} request={latestResidentRequest} />
      ) : current === "health" ? (
        <HealthScreen alert={demoState.alert} />
      ) : current === "request" ? (
        <RequestScreen go={navigate} onSubmit={createRequest} />
      ) : current === "care" ? (
        <CareScreen
          request={latestResidentRequest}
          onConfirm={() => confirmService(latestResidentRequest.id)}
          onCancel={() => {
            updateRequest(latestResidentRequest.id, (request) => ({
              ...request,
              status: "Cancelled",
            }))
            notify(`${latestResidentRequest.id} cancelled`)
          }}
        />
      ) : (
        <ProfileScreen
          recipientType={recipientType}
          setRecipientType={setRecipientType}
        />
      )
  else if (role === "family")
    content =
      current === "dashboard" ? (
        <FamilyDashboard
          go={navigate}
          request={selectedRequest}
          alert={demoState.alert}
        />
      ) : current === "alert" ? (
        <AlertDetails
          setModal={setModal}
          alert={demoState.alert}
          markSafe={() => {
            setDemoState((state) => ({
              ...state,
              alert: { ...state.alert, status: "Safe" },
            }))
            notify("Margaret marked safe in this simulated alert")
          }}
        />
      ) : (
        <FamilyTracking
          request={selectedRequest}
          onComplete={() => setModal("complete")}
        />
      )
  else if (role === "volunteer")
    content =
      current === "application" ? (
        <ApplicationScreen go={navigate} volunteer={activeVolunteer} />
      ) : current === "dashboard" ? (
        <VolunteerDashboard
          go={navigate}
          pointsBalance={volunteerPoints}
          pointsEarnedThisMonth={
            INITIAL_VOLUNTEER_MONTHLY_POINTS +
            demoState.rewardTransactions.reduce(
              (total, transaction) =>
                transaction.volunteerId === activeVolunteer.id
                  ? total + transaction.points
                  : total,
              0,
            )
          }
          volunteer={activeVolunteer}
          requests={demoState.requests}
          selectTask={(requestId, page) => {
            setSelectedRequestId(requestId)
            navigate(page)
          }}
          switchVolunteer={() => {
            const nextId = activeVolunteer.id === "daniel" ? "aisha" : "daniel"
            setActiveVolunteerId(nextId)
            notify(
              `Demo identity switched to ${
                VOLUNTEERS.find((item) => item.id === nextId)?.name
              }`,
            )
          }}
        />
      ) : current === "task" ? (
        <TaskDetails
          request={selectedRequest}
          volunteer={activeVolunteer}
          onAccept={() => acceptRequest(selectedRequest.id)}
        />
      ) : current === "active" ? (
        <ActiveService
          request={selectedRequest}
          onCheckIn={() => checkIn(selectedRequest.id)}
          onComplete={(notes, receiptConfirmed) =>
            checkOut(selectedRequest.id, notes, receiptConfirmed)
          }
        />
      ) : (
        <RewardsScreen
          onRedeem={() => setModal("redeem")}
          pointsBalance={volunteerPoints}
          pendingPoints={pendingVolunteerPoints}
          transactions={demoState.rewardTransactions.filter(
            (transaction) =>
              transaction.volunteerId === activeVolunteer.id,
          )}
          redemptions={demoState.redemptions.filter(
            (redemption) => redemption.volunteerId === activeVolunteer.id,
          )}
        />
      )
  else if (role === "admin")
    content = (
      <AdminContent
        page={current}
        navigate={navigate}
        toast={notify}
        requests={demoState.requests}
        selectedRequest={selectedRequest}
        assignVolunteer={assignVolunteer}
        rejectRequest={(requestId) => {
          updateRequest(requestId, (request) => ({
            ...request,
            status: "Rejected",
          }))
          notify(`${requestId} rejected · no volunteer assigned`)
        }}
        verifyRequest={verifyRequest}
        rewardTransactions={demoState.rewardTransactions}
        redemptions={demoState.redemptions}
        alert={demoState.alert}
        acknowledgeAlert={() => {
          setDemoState((state) => ({
            ...state,
            alert: { ...state.alert, status: "Acknowledged" },
          }))
          notify("Simulated alert acknowledged and under coordinator review")
        }}
      />
    )

  const roleLabels: Record<Role, string> = {
    resident: "Resident",
    family: "Family",
    volunteer: "Volunteer",
    admin: "Admin",
  }

  if (!role) {
    return (
      <AppEntry
        onChoose={(selectedRole) => {
          setRole(selectedRole)
          setPages((currentPages) => ({
            ...currentPages,
            [selectedRole]:
              selectedRole === "resident"
                ? "onboarding"
                : selectedRole === "family"
                  ? "dashboard"
                  : "application",
          }))
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      {role === "admin" ? (
        <div className="admin-shell">
          <aside>
            <div className="admin-org">
              <span>CC</span>
              <div>
                <strong>Willow District</strong>
                <small>Care coordination</small>
              </div>
            </div>
            <nav>
              {adminNav.map(([id, label, icon]) => (
                <button
                  className={current === id ? "active" : ""}
                  onClick={() => navigate(id)}
                  key={id}
                >
                  <Icon name={icon} />
                  {label}
                  {id === "alerts" &&
                    demoState.alert.status !== "Safe" && (
                      <span className="nav-count">1</span>
                    )}
                </button>
              ))}
            </nav>
            <div className="admin-user">
              <Avatar name="Olivia Chen" />
              <div>
                <strong>Olivia Chen</strong>
                <small>Senior coordinator</small>
              </div>
              <Icon name="logout" />
            </div>
          </aside>
          <main className="admin-main">
            <button
              className="desktop-app-switch"
              onClick={() => setShowRoles(true)}
            >
              <Icon name="user" size={17} />
              Switch app
            </button>
            {content}
          </main>
        </div>
      ) : (
        <div className="mobile-stage">
          <div className="phone-frame">
            <div className="mobile-header">
              <button
                className="mini-brand"
                onClick={() =>
                  navigate(role === "resident" ? "home" : "dashboard")
                }
              >
                <span>
                  <Icon name="heart" size={17} />
                </span>
                Care Link
              </button>
              <button className="notification">
                <Icon name="bell" />
                <span />
              </button>
              <button className="app-switch" onClick={() => setShowRoles(true)}>
                {roleLabels[role]}
                <Icon name="arrow" size={14} />
              </button>
            </div>
            <main className="mobile-content">{content}</main>
            <nav className="bottom-nav">
              {mobileNav[role].map((item) => (
                <button
                  className={current === item.id ? "active" : ""}
                  onClick={() => navigate(item.id)}
                  key={item.id}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
      {showRoles && (
        <div className="role-backdrop" onClick={() => setShowRoles(false)}>
          <div
            className="role-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="eyebrow">Care Link apps</div>
            <h2>Choose an experience</h2>
            <p>Switch between the connected care applications.</p>
            <div className="app-list">
              {([
                ["resident", "Resident app", "Health, help and care", "heart"],
                ["family", "Family app", "Alerts and tracking", "users"],
                ["volunteer", "Volunteer app", "Tasks and rewards", "shield"],
                ["admin", "Coordinator app", "Operations and verification", "clipboard"],
              ] as [Role, string, string, string][]).map(
                ([id, label, description, icon]) => (
                  <button
                    className={role === id ? "selected" : ""}
                    onClick={() =>
                      switchRole(
                        id,
                        id === "resident"
                          ? "home"
                          : id === "family"
                            ? "dashboard"
                            : id === "volunteer"
                              ? "dashboard"
                              : "overview",
                      )
                    }
                    key={id}
                  >
                    <span className="app-list-icon">
                      <Icon name={icon} />
                    </span>
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    {role === id ? (
                      <span className="selected-check">
                        <Icon name="check" size={14} />
                      </span>
                    ) : (
                      <Icon name="arrow" />
                    )}
                  </button>
                ),
              )}
            </div>
            <Button wide variant="ghost" onClick={() => setShowRoles(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <Modal type={modal} close={() => setModal(null)} action={modalAction} />
      {toast && (
        <div className="toast">
          <Icon name="check" />
          {toast}
        </div>
      )}
    </div>
  )
}
