---
trigger: manual
---

# VK.Blocks FE: Planning & Decision Standards (PS)

### PS.01 — Mandatory Architecture Decision Audit

ALL implementation plans (`implementation_plan.md`) generated for this repository MUST include a dedicated **"Architectural Decision Audit"** section before the Proposed Changes.

#### 1. Audit Requirements

- **Contract Impact**: Explicitly state if the change modifies any shared type contract, public API surface, or core architectural pattern (CS.01–CS.07).
- **ADR Necessity**: Make a definitive "Yes/No" determination on whether an ADR (Architecture Decision Record) is required per DL.03.
- **Traceability**: If an ADR is required, adding the task `[ ] Generate ADR` to the `task.md` or the plan's TODOs is MANDATORY.

#### 2. Decision Logic

An ADR is **MANDATORY** if the change:

- Introduces a new shared type contract or provider interface.
- Modifies the `Result<T>` pattern or shared error constants.
- Changes the state management strategy (AP.04).
- Adopts a new external dependency that impacts the module's architecture.
- Changes the API integration contract (AP.05).
- Modifies the component composition or provider hierarchy.

### PS.02 — Closed-Loop Walkthrough

The `walkthrough.md` MUST verify the "Decision Traceability":

- If an ADR was planned, the walkthrough MUST link to the newly created `.md` file in `docs/02-ArchitectureDecisionRecords/`.
- Failure to document a significant architectural shift is considered a violation of **DL.03**.

### PS.03 — RFC-First Policy (Top-Down Design)

For any **Complex Feature** or **Experimental Logic** (e.g., novel component systems, complex state machines, real-time collaboration features), an RFC (Request for Comments) MUST be created in `docs/06-RFCs/` before any atomic tasks are added to the backlog.

#### 1. RFC Core Components

- **Metaphor**: A clear mental model explaining the "why" and "how" in human terms.
- **Mapping**: A structured table or diagram showing how the metaphor maps to code artifacts.
- **Code Blueprint**: The foundational interfaces, types, and component contracts.
- **UX Wireframe**: For UI-heavy features, include a low-fidelity wireframe or user flow diagram.

#### 2. Workflow Integration

1. **Draft RFC**: AI or User creates the proposal.
2. **Approval**: User reviews and marks as `✅ Approved`.
3. **Backlog Decomposition**: Once approved, the RFC is decomposed into multiple atomic tasks.

### PS.04 — Contextual Instruction Priority

When performing tasks restricted to a specific feature module, AI MUST prioritize localized instructions over global rules through active discovery.

#### 1. Dynamic Discovery

- **Mandatory Action**: Before starting an implementation plan or refactoring, AI MUST check for localized documentation within the target feature module (e.g., `README.md`, `.prompts/`, local manifesto files).
- **Goal**: Identify feature-specific conventions, constraints, or overrides that take precedence over global standards.

#### 2. Conflict Resolution Hierarchy

- **Priority**: Local Feature Prompt (Layer 3) > Module Manifesto (Layer 2) > Global Standards (Layer 1).
- **Core Standard Protection**: If a local prompt conflicts with a Core Standard (CS.01–CS.07), the AI MUST explicitly flag this as a **"Standard Violation for Feature/Lab Needs"** in the Implementation Plan for User Review.
- **Naming Exceptions**: If Layer 2/3 explicitly waives the `VK` prefix or `_internal/` convention, AI MUST follow that exception immediately without further questioning.
