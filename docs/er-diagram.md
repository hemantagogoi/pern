# ER Diagram Explanation

```mermaid
erDiagram
  roles ||--o{ users : has
  users ||--o{ user_subjects : requests
  programs ||--o{ subjects : contains
  departments ||--o{ subjects : owns
  semesters ||--o{ subjects : schedules
  subjects ||--o{ units : has
  subjects ||--o{ user_subjects : requested_for
  subjects ||--o{ questions : has
  units ||--o{ questions : groups
  users ||--o{ generated_papers : creates
  subjects ||--o{ generated_papers : for
  generated_papers ||--o{ paper_questions : includes
  questions ||--o{ paper_questions : selected
  users ||--o{ approvals : affected_user
  users ||--o{ activity_logs : performs
```

Every subject belongs to exactly one program, department, and semester. Faculty access is represented by `user_subjects`; only rows with status `approved` grant access. Generated papers are stored in `generated_papers`, and the selected questions are stored in `paper_questions` for reproducible previews and PDF downloads.
