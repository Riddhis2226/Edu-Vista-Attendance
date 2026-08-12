<div align="center">

<!-- ============================================================
     EDuvista BRAND
     ============================================================ -->

<img
  src="assets/eduvista_logo.png"
  alt="EduVista — Beyond Attendance"
  width="220"
/>

<!-- ============================================================
     ANIMATED PROJECT TITLE
     ============================================================ -->

<img
  src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=24&duration=2600&pause=1000&color=2C5364&center=true&vCenter=true&width=900&height=40&lines=EDUVISTA;AI-Powered+%26+IoT+Integrated+Smart+Attendance+System"
  alt="EDUVISTA — AI-Powered & IoT Integrated Smart Attendance System"
/>

<!-- ============================================================
     APPLICATION PREVIEW
     ============================================================ -->

<br/>

<img
  src="assets/eduvista_dashboard.png"
  alt="EduVista Smart Attendance Dashboard"
  width="92%"
/>

<!-- ============================================================
     TECHNOLOGY STACK
     ============================================================ -->

<div align="center">

<table>
<tr>

<td align="center">

<img src="assets/lovable_logo.png" alt="Lovable AI" height="48"/>

<br/>

<strong>Lovable AI</strong>

<br/>

<sub>Application Platform</sub>

</td>

<td align="center">

<img src="assets/luxand_logo.png" alt="Luxand Cloud API" height="48"/>

<br/>

<strong>Luxand Cloud API</strong>

<br/>

<sub>Face Detection & Recognition</sub>

</td>

<td align="center">

<img src="assets/rfid_logo.png" alt="RFID" height="48"/>

<br/>

<strong>RFID</strong>

<br/>

<sub>IoT Attendance Hardware</sub>

</td>

</tr>
</table>

<br/>

<a href="https://edu-vista-attendance.lovable.app/">
  <strong>🚀 Launch Live Demo</strong>
</a>

&nbsp;&nbsp;•&nbsp;&nbsp;

<a href="https://github.com/Riddhis2226/Edu-Vista-Attendance">
  <strong>⭐ View Repository</strong>
</a>

</div>
<p>
  <strong>
    # Classroom photo → face detection & recognition → reviewable attendance session.
  </strong>
</p>

</div>

---

<p align="center">
  <strong>AI-powered attendance with face recognition and IoT-ready RFID integration.</strong>
</p>

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
