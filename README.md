# no-more-timer-leaks

No More Timer Leaks is a lightweight, zero-config debugging utility that helps you monitor all active `setTimeout` and `setInterval` timers in your browser app during development. It’s designed to catch common issues like **memory leaks**, **forgotten cleanup**, or **duplicate intervals** that can lead to performance problems.

Perfect for debugging SPAs, React components, or any JavaScript app using timers.

> Works in browser environments 
> Tracks creation time, delay, and stack trace origin  
> Exposes console report and clipboard export  
> Adds a floating "📋 Copy Timer Report" button in dev mode

---

## Installation

Install as a dev dependency:

```bash
npm install timer-tracker --save-dev
```

## Usage 

Import once at the top level of your app (e.g., index.tsx, main.js, _app.tsx, or main.ts): 
```ts
 import 'no-more-timer-leaks';
 ```

That’s it. No configuration needed.

Now, during development, all setTimeout and setInterval calls are tracked.

## Debugging API: window.TIMER_TRACKER
After importing, a global `TIMER_TRACKER` object becomes available in the browser console.

`TIMER_TRACKER.report()` 

Logs a detailed, collapsible report of all active timeouts and intervals. 
```js
 TIMER_TRACKER.report();
 ```
Includes:
- Timer ID and delay  
- Creation time and current age 
- Origin (file and line number via stack trace)  
- Grouped duplicates from the same source  

> **Note:** Run this after navigating, unmounting components, or suspected cleanup points.

`TIMER_TRACKER.getActiveTimeouts()`
Returns an array of currently active timeouts with metadata.

`TIMER_TRACKER.getActiveIntervals()`
Same as above, but for intervals.

`TIMER_TRACKER.copyReportToClipboard()`
Copies a structured JSON report of all active timers to your clipboard.


## Floating Copy Button (Dev Only) 

A small "📋 Copy Timer Report" button appears in the bottom-right corner of your app during development: 


Click it to run **`copyReportToClipboard()`** instantly.

     