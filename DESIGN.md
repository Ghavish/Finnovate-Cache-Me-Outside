---
name: MoBudget
description: Smart money planning in English, French and Kreol Morisien.
colors:
  bg-light: "#F4F7F8"
  surface-light: "#FFFFFF"
  raised-light: "#EAF1F3"
  text-light: "#0E1A22"
  muted-light: "#557080"
  bg-dark: "#070B10"
  surface-dark: "#0F1620"
  raised-dark: "#172231"
  text-dark: "#E6F1F4"
  muted-dark: "#87A0AD"
  teal: "#2DD4BF"
  teal-deep: "#0D9488"
  teal-ink: "#0F766E"
  indigo: "#818CF8"
  indigo-deep: "#6366F1"
  on-accent: "#04201C"
  rail: "#0A1119"
  night: "#0C141D"
  safe-light: "#15803D"
  tight-light: "#A16207"
  danger-light: "#BE123C"
  safe-dark: "#4ADE80"
  tight-dark: "#FACC15"
  danger-dark: "#FB7185"
typography:
  display:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 4.2vw, 52px)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Hanken Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
spacing:
  gap: "20px"
  card: "24px"
  page-top: "40px"
components:
  button-primary:
    backgroundColor: "{colors.teal-deep}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    height: "46px"
    padding: "0 18px"
  button-primary-dark:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    height: "46px"
  card:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-dark:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.lg}"
    padding: "24px"
  hero:
    backgroundColor: "{colors.night}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.xl}"
    padding: "40px"
  side-rail:
    backgroundColor: "{colors.rail}"
    width: "256px"
---

# Design System: MoBudget

## Overview

Money as a calm sky at night. MoBudget is a working app (Operate mode): the shell is a dark slate rail plus a quiet top bar, and every screen puts the user's numbers first. One signature move ties it together: the **aurora band**, a slow teal-to-indigo light field that lives only behind the dashboard hero, the salary card, the AI Coach orb, the login brand panel and the 404 screen.

Light and dark themes share one structure. The device setting decides by default; the header toggle overrides it and is remembered. Tokens live as CSS custom properties in `src/index.css` under `:root[data-theme="light"]` and `:root[data-theme="dark"]`.

## Colors

### Primary
Teal is the action colour: primary buttons, the active nav item, focus rings, progress bars. On light grounds teal text uses `teal-ink` (#0F766E) to pass AA; teal fills always carry `on-accent` (#04201C) text.

### Secondary
Indigo is the second light: the aurora's other half, the "Describe it your way" card, the Active goals icon and the end of progress gradients.

### Neutral
Slate grounds tinted towards teal. The side rail (`rail`) and the hero/night panels (`night`) stay dark in both themes.

### Named Rules
- **Verdict colours do real jobs.** Safe, tight and danger colour goal card tops, badges, expense groups and transaction chips. They never decorate.
- **Aurora only where the brand speaks.** Five places, listed above. Not on ordinary cards.

## Typography

Hanken Grotesk Variable everywhere, self-hosted through `@fontsource-variable/hanken-grotesk`. Every amount uses tabular figures.

### Hierarchy
Display for page titles (650, tight tracking), title for card headings, figure for money values, body at 16px with 1.6 line height, label at 13px/600 for field labels.

## Layout

256px fixed rail and a centred content column up to 1200px. The dashboard uses a main column plus a 320px figure rail on desktop; under 1100px it becomes one column in the order hero, figures, quick links. Under 760px the rail is replaced by a floating four-item bottom bar.

## Elevation & Depth

Hairline borders (`--line`) plus soft offset shadows (`--shadow`, `--shadow-lg`). Dark mode trades shadow for a 1px inner highlight. Modals sit on a blurred backdrop.

## Shapes

Radii step 10 / 14 / 20 / 28px: controls, buttons, cards, hero and modals.

## Components

### Buttons
Primary is a teal fill with dark ink, lifting 1px on hover. Secondary is a surface fill with a stronger hairline. Text buttons are teal ink with underline on hover.

### Cards / Containers
Surface fill, hairline border, 20px radius, 24px padding. Goal cards add a verdict-coloured light from the top-right corner.

### Inputs / Fields
Input-ground fill, stronger hairline, teal border and 4px soft teal ring on focus.

### Navigation
Rail items with a shared sliding indicator (Motion `layoutId`). Mobile uses a floating rounded bar on the rail colour.

### Aurora band
`.aurora`: blurred radial teal and indigo fields drifting over 22s. Always inside an `overflow: hidden` parent with `isolation: isolate`.

## Do's and Don'ts

### Do:
- Use the CSS custom properties, never raw hex, so both themes stay in step.
- Animate entrances once with the shared `rise` and `page-in` keyframes; respect reduced motion.
- Put money values in tabular figures.

### Don't:
- Don't use gradient text or decorative glass on ordinary cards.
- Don't add new colours for decoration; use verdict colours only for verdicts.
- Don't use teal (#0D9488) as small text on light grounds; use `teal-ink`.
