<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F2027,50:203A43,100:2C5364&height=240&section=header&text=EDUVISTA&fontSize=52&fontColor=FFFFFF&animation=fadeIn&fontAlignY=35&desc=Smart%20Attendance%20Platform&descAlignY=55&descSize=16&descColor=D6E4EA" width="100%"/>

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

</div>

---

## Project Snapshot

| Aspect | Detail |
|:--|:--|
| **Problem** | Manual roll-call is slow and error-prone |
| **Solution** | Photo-based attendance with explicit review states |
| **Platform** | Lovable AI |
| **Recognition** | Luxand Cloud API (detect · recognize · enroll) |
| **Hardware** | RFID architecture; not in current `main` |
| **Access** | Admin / Faculty consoles + controlled MCP access |
| **Deployment** | Live web demo (photo/webcam) |

---

## Core Capabilities

| Capability | Detail |
|:--|:--|
| Role-based access | Admin and Faculty consoles with protected routes |
| Classroom photo attendance | Single image → detection + recognition pipeline |
| Face enrollment | Controlled enroll / delete against Luxand |
| Review workflow | Explicit modes + faculty override before finalization |
| Lecture targets | Configurable thresholds per subject / batch |
| History & analytics | Session history and trend views |
| Audit logging | Administrative action trail |
| MCP access | Read-only tools for authenticated AI agents |
| RFID | Intended architecture; current `main` is photo/webcam only |

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
    DB[(Attendance Data)]

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

**Detection** = face present in the image.  
**Recognition** = face matches an enrolled identity.

| Mode | Meaning | Outcome |
|:--|:--|:--|
| **Recognized** | Identity match + confidence score | Attendance candidate; final status follows review workflow |
| **Detected** | Face present, identity unresolved | Flagged for manual review; not verified attendance |
| **Estimated** | Recognition unavailable | Simulation/demo fallback; explicitly flagged; requires faculty review |

**Principle:** Data integrity over forced session completeness.

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
| Privileged credentials | No privileged backend credentials exposed to the client |
| Biometric processing | Face detection/recognition via Luxand Cloud (third-party). Enrollment/deletion restricted to authorized roles |
| MCP access | OAuth consent → user token → MCP → RLS |
| Audit logging | Administrative actions recorded |

No compliance certifications claimed.

---

## MCP Integration

Controlled AI-agent access to attendance data.

```text
AI Agent → OAuth Consent → User JWT → MCP → Database → RLS → Authorized Data
```

Read-only tools for student, session, attendance, and lecture-target data.  
MCP does not bypass application authorization.

---

## Technology Stack

| Technology | Purpose |
|:--|:--|
| **Lovable AI** | Application platform and development environment |
| **Luxand Cloud API** | Face detection, recognition, and enrollment |
| **RFID** | Hardware-based attendance identification (architecture direction; not implemented in current `main`) |

---

## Quick Start

```bash
git clone https://github.com/Riddhis2226/Edu-Vista-Attendance.git
cd Edu-Vista-Attendance
bun install
cp .env.example .env
bun run dev
```

Public frontend configuration is expected. Privileged credentials stay server-side.

---

## Testing

```bash
bun run test
bunx playwright test
```

Unit and end-to-end tests cover core UI and role-based workflows.

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
