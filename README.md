<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,50:203A43,100:2C5364&height=240&section=header&text=EDUVISTA&fontSize=52&fontColor=FFFFFF&animation=fadeIn&fontAlignY=35&desc=AI-Powered%20Smart%20Attendance%20Platform&descAlignY=55&descSize=16&descColor=D6E4EA" width="100%"/>

<br/>

<p>
  <img src="https://img.shields.io/badge/Lovable_AI-Platform-0F2027?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Luxand_Cloud-Face%20Detection%20%26%20Recognition-2C5364?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/RFID-Hardware%20Architecture-34718A?style=for-the-badge"/>
</p>

<p>
  <a href="https://edu-vista-attendance.lovable.app/">
    <img src="https://img.shields.io/badge/Live_Demo-Launch_App-3E8FA9?style=for-the-badge&logo=vercel&logoColor=white"/>
  </a>
  <img src="https://img.shields.io/github/stars/Riddhis2226/Edu-Vista-Attendance?style=for-the-badge&color=0F2027"/>
  <img src="https://img.shields.io/badge/Status-Live%20Demo-2C5364?style=for-the-badge"/>
</p>

**Classroom photo → face detection & recognition → reviewable attendance session.**

Role-based platform for educational institutions. Built on Lovable AI with Luxand Cloud for facial recognition and RFID in the intended architecture.

</div>

---

## Project Snapshot

| Aspect | Detail |
|:--|:--|
| **Problem** | Manual roll-call is slow and error-prone; basic face demos fail without clear review states |
| **Solution** | Automated attendance workflow from a single classroom photo, with explicit detection / recognition / review modes |
| **Primary Platform** | Lovable AI |
| **Recognition Engine** | Luxand Cloud API (detect · recognize · enroll) |
| **Hardware Direction** | RFID (architecture referenced; not implemented in current `main`) |
| **Access Model** | Admin / Faculty consoles + optional MCP tools for AI agents |
| **Deployment** | Live web demo (photo/webcam workflow) |

---

## Core Capabilities

| Capability | Detail |
|:--|:--|
| Role-based access | Admin and Faculty consoles with protected routes |
| Classroom photo attendance | Single image → detection + recognition pipeline |
| Face enrollment | Controlled enrollment and deletion against Luxand |
| Attendance review workflow | Explicit modes and flags; faculty override before finalization |
| Lecture targets | Configurable thresholds per subject / batch |
| History & analytics | Session history and trend views |
| Audit logging | Administrative action trail |
| MCP access | Read-only tools for authenticated AI agents (same authorization model) |
| RFID | Part of intended architecture; current `main` focuses on photo/webcam |

---

## System Architecture

```mermaid
flowchart TB
    subgraph Users
        F[Faculty / Admin]
        A[AI Agent]
    end

    subgraph Platform["Lovable AI Application"]
        APP[Web Application]
        MCP[MCP Server]
    end

    LUX[Luxand Cloud API<br/>Detect · Recognize · Enroll]
    RFID[RFID<br/>Hardware Architecture]
    DB[(Attendance Data + RLS)]

    F --> APP
    APP --> LUX
    APP --> DB
    RFID -.->|Planned| APP
    A -->|OAuth Consent| MCP
    MCP --> DB

    style APP fill:#0F2027,color:#fff,stroke:#2C5364
    style MCP fill:#203A43,color:#fff,stroke:#2C5364
    style LUX fill:#4BA3C3,color:#fff,stroke:#2C5364
    style RFID fill:#34718A,color:#fff,stroke:#2C5364
    style DB fill:#2C5364,color:#fff,stroke:#2C5364
```

---

## Attendance Recognition Workflow

**Detection** — a face is present in the image.  
**Recognition** — the face matches an enrolled identity.

| Mode | Meaning | Outcome |
|:--|:--|:--|
| **Recognized** | Identity match returned by Luxand with confidence score | Attendance candidate (verified according to application workflow) |
| **Detected** | Face present but identity unresolved | Flagged for manual review — not treated as verified attendance |
| **Estimated** | Recognition path unavailable (e.g. API/network failure) | Simulation/demo fallback records, explicitly flagged; requires faculty review before finalization |

Faculty retain full manual override.  

**Principle: data integrity over forced session completeness.** Estimated records are never presented as equivalent to genuine recognition.

---

## Role Consoles

### Admin

| Area | Purpose |
|:--|:--|
| Student Management | Roster management |
| Face Enrollment | Luxand enroll / delete |
| Attendance Logs | Historical sessions |
| Faculty Management | Account provisioning |
| Lecture Targets | Threshold configuration |
| Audit Log | Administrative actions |

### Faculty

| Area | Purpose |
|:--|:--|
| Upload Photo | Classroom image → recognition pipeline |
| History | Owned sessions |
| Analytics | Attendance trends |
| Dataset Import | Bulk student import |

---

## Security & Privacy

| Control | Detail |
|:--|:--|
| Authentication & roles | Role-based access with protected routes |
| Data access | Row-Level Security on attendance data |
| Privileged credentials | Luxand and backend credentials remain server-side only |
| Biometric processing | Face detection and recognition performed by Luxand Cloud (third-party). Enrollment and deletion controlled through authorized roles |
| MCP access | OAuth consent → user token → MCP → RLS. Agents inherit the authorizing user’s permissions |
| Audit logging | Administrative actions recorded |

No compliance certifications are claimed.

---

## MCP Integration

Controlled AI-agent access to attendance data:

```text
AI Agent → OAuth Consent → User JWT → MCP → Database → RLS → Authorized Data
```

Read-only tools for students, attendance history, sessions, and lecture targets. MCP does not bypass application authorization.

---

## Technology Stack

| Technology | Purpose |
|:--|:--|
| **Lovable AI** | Application platform and development environment |
| **Luxand Cloud API** | Face detection, recognition, and enrollment |
| **RFID** | Hardware-based attendance identification (architecture direction; not implemented in current `main` branch) |

---

## Quick Start

```bash
git clone https://github.com/Riddhis2226/Edu-Vista-Attendance.git
cd Edu-Vista-Attendance
bun install
cp .env.example .env
bun run dev
```

Public frontend configuration (Supabase URL + publishable key) is expected. Privileged credentials (Luxand token, service keys) are configured only as server-side secrets.

---

## Testing

```bash
bun run test
bunx playwright test
```

Unit and end-to-end tests cover UI components and role-based flows.

---

## Project Structure

```text
src/
├── pages/admin/          # Admin console
├── pages/faculty/        # Faculty console
├── components/           # UI and feature components
├── layouts/              # Role shells
├── contexts/             # Auth and role
├── lib/mcp/              # MCP tool definitions
└── integrations/         # Backend client

supabase/
├── functions/            # Recognition and privileged operations
└── migrations/           # Schema history
```

---

## License

No `LICENSE` file is present. All rights reserved.

---

<div align="center">

**Riddhima Singh**  
[GitHub](https://github.com/Riddhis2226) · [Live Demo](https://edu-vista-attendance.lovable.app/)

</div>
```
