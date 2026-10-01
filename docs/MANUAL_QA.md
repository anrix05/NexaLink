# NexaLink — Manual QA Verification Guide

This document outlines the standard end-to-end verification procedures for the NexaLink platform.

---

## v2.7.0 Intro Animation & Motion Checklist

| # | Test Scenario | Steps to Execute | Expected Outcome | Status |
|---|---|---|---|---|
| **1** | **Cold Boot on `/` (New Tab)** | Open a new browser tab or private window and navigate directly to `http://localhost:5173/`. | The obsidian `#0A0A0A` intro stage renders instantly with no initial content flash. 4 geometric slices assemble from alternating offsets into the N monogram. The live-text "NexaLink" wordmark fades up. The orange central node ignites with a spring pop and single pulse ring. The mark flies smoothly (FLIP) into the navbar logo. Landing hero elements and count-up stats reveal gracefully. | [ ] |
| **2** | **Refresh & In-App Navigation** | Press `F5` / `Cmd+R` on the landing page, then navigate across tabs (e.g. Directory, Opportunities, Return to Dashboard). | The intro **does not replay** on page refresh. Client-side navigation and clicking the NexaLink brand logo never re-trigger the intro. | [ ] |
| **3** | **Deep Link First Load** | In a brand-new tab session, navigate directly to a deep route (e.g. `http://localhost:5173/?tab=privacy` or `/reset-password`). | The intro is **skipped entirely**. The target page renders immediately. Subsequent navigation back to `/` does not trigger the intro because the session is already marked seen. | [ ] |
| **4** | **Supabase Auth Callback Safety** | Open an email confirmation or password recovery URL containing `#access_token=...` or `type=recovery`. | The intro is automatically bypassed. The authentication token is processed without delay, taking the user directly to the password reset / authenticated view. | [ ] |
| **5** | **Manual Replay Triggers** | 1. Navigate to `http://localhost:5173/?intro=1`.<br>2. Click **"REPLAY INTRO"** in the public footer.<br>3. Press `Ctrl+K` and select **"Replay Intro Animation"**. | In all three cases, the intro replays smoothly from start to finish. | [ ] |
| **6** | **Keyboard & Touch Skip Interaction** | Trigger the intro, then press `Esc`, any keyboard key, or tap/click anywhere on the screen. | The intro fades out immediately with a fast 250ms transition. The `ESC / TAP TO SKIP` hint appears after 600ms if not skipped earlier. Body scroll is immediately restored, and focus is not trapped (`inert` attribute removed from `#root`). | [ ] |
| **7** | **Accessibility: Reduced Motion** | Enable OS-level "Reduce Motion" in system settings (or Chrome DevTools: *Rendering > Emulate CSS prefers-reduced-motion*). | The intro is completely skipped. The page mounts immediately with static/accessible layouts. | [ ] |
| **8** | **Hardware & Low-Tier Governor** | In DevTools *Network* tab, enable **Data Saver** (`Save-Data: on`) or emulate a 2G network. | The intro is automatically bypassed on `low` tier devices to conserve bandwidth and CPU resources. | [ ] |
| **9** | **JavaScript Disabled & CPU Throttle Failsafe** | 1. Disable JavaScript in DevTools and refresh.<br>2. Throttle CPU 6x in DevTools *Performance* tab. | 1. With JS disabled, the `<noscript>` style prevents the black overlay from mounting; page content remains visible.<br>2. With 6x CPU throttling, the CSS `@keyframes nexalinkIntroFailsafe` guarantees the overlay auto-hides after 4 seconds. | [ ] |
| **10** | **Mobile Responsiveness (320px, 375px, 430px)** | In DevTools responsive mode, test at widths 320px, 375px, and 430px. | The mark height scales appropriately to `min(40vw, 160px)`, background dots are disabled, hold durations are shortened to ~2.4s total, and the mark lands accurately onto the mobile header logo without horizontal scroll drift. | [ ] |
| **11** | **Color Handoff Verification** | Observe the mark closely during the exit flight phase (2200–3000ms). | The mark transitions from white to the target header color during mid-flight (at overlay alpha ~0.5), remaining clearly visible against the mid-tone background. The central orange node retains its `#FD9C03` accent throughout. | [ ] |
| **12** | **Cumulative Layout Shift (CLS = 0)** | Run a Google Lighthouse Performance audit on `/`. | Cumulative Layout Shift (CLS) remains **0.000**. The intro overlay does not displace any DOM layout containers before, during, or after playback. | [ ] |
