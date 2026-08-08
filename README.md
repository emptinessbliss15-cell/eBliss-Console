# eBliss Console

Initial console shell for the eBliss application family.

## Current structure

```text
src/
  App.tsx
  main.tsx
  styles.css
  apps/
    Supportable.tsx
```

## Initial features

- Console header with eBliss branding
- Burger menu for applications
- Supportable as the first application
- Applications organized under `src/apps/`
- Popup development login placeholder
- Selectable console theme
- CSS variables so individual components/apps can be themed independently
- Vite + React + TypeScript foundation

The console is intentionally a shell. Individual applications should remain modular so they can evolve independently while sharing console-level services, themes, authentication, and other infrastructure.
