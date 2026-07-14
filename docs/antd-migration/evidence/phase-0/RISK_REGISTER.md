# Risk Register

| ID | Risk | Prob | Impact | Mitigation | Trigger | Owner |
|---|---|---|---|---|---|---|
| R1 | SSR CSS-in-JS / Hydration FOUC | High | High | Use AntD Next.js App Router Registry | Hydration errors | UI |
| R2 | Bundle JS/CSS spike | High | Med | Tree-shaking, bundle analyzer | Bundle > 500kB | UI |
| R3 | Table performance loss | High | High | Adapter + Pilot flag. Retain custom grid if needed. | Scroll lag | Core |
| R4 | Date timezone mismatch | High | High | ISO dates at boundary. No Day.js to DB. | Wrong date shown | UI |
| R5 | Form payload loss / Server Actions | High | High | Integration tests, RHF Controller | Form submission fail| Core |
| R6 | Popup clipping in split panes | Med | High | `getPopupContainer` bounds | Dropdown invisible | UI |
| R7 | AntD overrides Tailwind reset | Med | Med | Lock CSS import order | Layout broken | UI |
