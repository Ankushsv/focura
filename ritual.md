Build "The Ritual" feature for Focura.
Next.js 14, Supabase, Framer Motion, 
Anthropic Claude API.

This is the MSP feature — handle it carefully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create table in Supabase:

CREATE TABLE user_app_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL,
  -- 'app_opened' | 'session_started' | 
  -- 'session_completed' | 'task_viewed' |
  -- 'ritual_started' | 'ritual_completed' |
  -- 'ritual_dismissed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_app_events 
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own events"
  ON user_app_events FOR ALL
  USING (auth.uid() = user_id);

Log 'app_opened' event every time 
the War Room page mounts.
Log 'session_started' when Focus Timer begins.
Log 'session_completed' when it ends.

Create a custom hook:
src/hooks/useStuckDetection.ts

Logic inside:

const today = new Date().toDateString()

// Fetch today's events for this user
const { data: todayEvents } = await supabase
  .from('user_app_events')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startOfToday)
  .order('created_at', { ascending: true })

const appOpens = todayEvents?.filter(
  e => e.event_type === 'app_opened'
).length ?? 0

const sessionsStarted = todayEvents?.filter(
  e => e.event_type === 'session_started'
).length ?? 0

const ritualsToday = todayEvents?.filter(
  e => e.event_type === 'ritual_started'
).length ?? 0

// Trigger ritual when:
const shouldTrigger = 
  appOpens >= 3 &&        // opened 3+ times
  sessionsStarted === 0 && // no work started
  ritualsToday < 2 &&     // max 2 rituals per day
  !isAfter(new Date(), set(new Date(), 
    { hours: 22 }))       // not after 10pm

return { shouldTrigger }

Call this hook in the War Room page.
When shouldTrigger becomes true, 
show the Ritual UI (see Section 3).

Also trigger when:
- User has been on the tasks page for 
  90 seconds without clicking anything
  (detect via inactivity timer on 
  the tasks page)
- User clicks "I'm Stuck" twice in 
  one session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: AI RITUAL GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When ritual triggers, first ask the user 
one question (before showing the timer):

A small centered card appears over 
the (slightly dimmed) War Room:

Familiar animation: calm, settled pose
Text (Lora italic, large, centered):
"What's the one thing you keep 
 not starting?"

Single text input below, large, 
placeholder: "just name it..."
[Let's do this →] button

On submit, call the Claude API:

const response = await fetch(
  'https://api.anthropic.com/v1/messages',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `
You are the Familiar in Focura, a companion 
for ADHD users. The user is stuck and cannot 
start a task.

The task they are avoiding: "${avoidingTask}"

Generate a ritual of 1-3 micro-steps that 
will physically walk them into starting 
this task. Each step must:
- Take under 30 seconds to complete
- Be a physical action with a clear 
  "done" state (open, find, read, write, 
  click, locate — never "think" or "plan")
- Be so small it feels almost silly
- Follow naturally from the previous step
- The last step should leave them 
  literally inside the task

Classic patterns:
For any digital task:
  Step 1: "Open [specific app/file]"
  Step 2: "Find [specific thing] in it"
  Step 3: "Write [your name / first word / 
            function name] at the top"

For reading/research:
  Step 1: "Open the document/page"
  Step 2: "Read just the title and 
            first paragraph"

For scary creative tasks:
  Step 1: "Open a blank document"
  Step 2: "Type the date at the top"
  Step 3: "Write one sentence — 
            even a bad one"

Return ONLY a JSON object, no markdown:
{
  "opening_line": "string (1 sentence, 
    warm and specific to their task, 
    Familiar voice, never preachy)",
  "steps": [
    {
      "id": 1,
      "action": "string (the micro-step, 
        imperative verb, under 8 words)",
      "detail": "string (optional extra 
        context, under 12 words, or null)"
    }
  ],
  "step_count": number
}

Maximum 3 steps. Minimum 1.
The opening_line should acknowledge 
the specific task, not be generic.
`
      }]
    })
  }
)

const data = await response.json()
const text = data.content[0].text
const ritual = JSON.parse(text)

Store ritual in component state.
Show the Ritual UI (Section 3).
Log 'ritual_started' event to Supabase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: THE RITUAL UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is NOT a modal. It is a full 
replacement of the War Room content.

The War Room page content fades to 
opacity 0 (stays mounted, just invisible).
The Ritual UI fades in over it.
Background stays the same dark colour.
No navigation visible during ritual.

LAYOUT (centered, max-width 480px):

TOP: TIMER BAR
  Position: fixed top 0 left 0 right 0
  Height: 3px
  Background: rgba(245,239,232,0.08) 
              (track)
  Fill: #f0a868 (gold)
  Fill starts at 100% width and shrinks 
  to 0% over 120 seconds.
  
  Transition: linear, no easing — 
  this makes the shrink feel steady 
  and calm, not accelerating.
  
  Below the bar, right-aligned:
  Countdown in JetBrains Mono, 
  11px, hint color:
  "1:47" counting down from 2:00
  
  When 30 seconds remain:
  Fill color transitions to amber.
  (No other change — no panic, 
   no animation — just colour shift)
  
  When 0:00 reached with steps incomplete:
  Bar pulses amber once gently.
  Show timer-expired state (Section 4b).

FAMILIAR:
  Centered, large (64px emoji)
  Calm animation: very slow breathing 
  (scale 1 → 1.03 → 1, 4s loop)
  Much slower than normal — 
  this communicates "we have time, 
  we're not rushing"

OPENING LINE:
  Font: Lora italic
  Size: clamp(16px, 2.5vw, 22px)
  Color: rgba(245,239,232,0.75)
  Text: ritual.opening_line from API
  Appears word by word on load
  (stagger each word by 80ms using 
   Framer Motion variants)
  Max-width: 400px, centered

CURRENT STEP:
  Shown one at a time — never all steps.
  
  Step counter (above step):
  "Step {current} of {total}" 
  Font: Quicksand, 10px, uppercase, 
  letter-spaced, gold color
  
  Step action text:
  Font: Quicksand semibold
  Size: clamp(20px, 3vw, 28px)
  Color: #f5efe8 (warm white)
  Center aligned
  
  Step detail (if exists):
  Font: Space Grotesk
  Size: 13px
  Color: var(--muted)
  Margin-top: 6px
  
  Complete button:
  Full width, max-width 320px
  Height: 52px
  Border-radius: 16px
  Background: rgba(240,168,104,0.12)
  Border: 1px solid rgba(240,168,104,0.35)
  Color: #f0a868
  Font: Quicksand bold, 14px
  Text: "✓ Done — {3-word confirmation}"
  
  Confirmation text is step-specific:
  "Open [app]" → "✓ Done — it's open"
  "Read [thing]" → "✓ Done — I read it"
  "Write [thing]" → "✓ Done — it's written"
  "Find [thing]" → "✓ Done — I found it"
  Default: "✓ Done — moving on"
  
  On button tap:
  - Button scales down briefly (0.95)
    then the whole step card slides 
    out to the LEFT (x: -40px, opacity: 0)
    Duration: 0.3s ease-in
  - If more steps: next step slides 
    in from RIGHT (x: 40px → 0, 
    opacity: 0 → 1)
    Duration: 0.3s ease-out
    Staggered: starts 0.15s after 
    previous finishes
  - If last step: trigger You're In 
    state (Section 4a)
  
  Escape hatch (small, below button):
  "I need a minute" — very small text
  hint color, cursor pointer
  Clicking shows: 
  "Of course. Come back when you're ready.
   I'll be here."
  Then fades back to War Room normally.
  Log 'ritual_dismissed' event.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4A: YOU'RE IN STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Triggers when ALL steps are tapped complete.
Timer stops immediately (pauses, 
doesn't matter where it is).

SEQUENCE (use Framer Motion, 
each with its own delay):

0.0s: Timer bar pulses warm gold once
      (scale 1 → 1.002 → 1 on the bar)

0.3s: Step card fades out

0.6s: Familiar switches to settled/proud 
      animation — slower bob, 
      slight glow (drop-shadow)

0.8s: First line appears word by word:
      "You're in."
      Font: Cinzel Decorative
      Size: clamp(28px, 4vw, 40px)
      Color: #f0a868 (gold)
      Letter spacing: -0.5px

1.6s: Second line:
      "The hardest part is already over."
      Font: Lora italic
      Size: clamp(14px, 2vw, 18px)
      Color: rgba(245,239,232,0.65)

2.2s: Third line:
      "Your brain is warmer now
       than it was 2 minutes ago."
      Same style as second line
      Color: rgba(245,239,232,0.5)

3.2s: Fourth line:
      "Want to keep going for 5 minutes?
       Just 5. I'll be right here."
      Font: Quicksand medium
      Size: 15px
      Color: rgba(245,239,232,0.7)

3.8s: Two buttons appear 
      (slide up from below, spring physics):

      PRIMARY: "▶ Yes — 5 minutes"
        Background: linear-gradient(
          135deg, #a78bfa, #5eead4)
        Color: #0e0c0a
        Font: Quicksand bold, 14px
        Padding: 13px 28px
        Border-radius: 50px
        Box-shadow: 0 0 24px 
          rgba(167,139,250,0.3)
        
        On click:
        - Log 'ritual_completed' to Supabase
        - Store task name in sessionStorage 
          as 'ritual_task'
        - Navigate to /focus with 
          query param: 
          ?task={taskName}&duration=5&from=ritual
        - Focus Timer pre-selects the task,
          pre-sets session to 5 minutes,
          starts the cinematic entrance

      SECONDARY: "Not yet"
        Background: transparent
        Color: rgba(245,239,232,0.35)
        Font: Quicksand, 13px
        No border
        Cursor: pointer
        
        On click:
        - Show for 2 seconds:
          "That's okay. You showed up.
           That matters."
          (Lora italic, centered, muted)
        - Then fade War Room back in normally
        - Log 'ritual_completed' to Supabase
          (completed = they finished the steps,
           regardless of whether they started 
           the timer)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4B: TIMER EXPIRED STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Triggers when 0:00 reached with 
steps NOT all complete.

Bar turns fully amber, pulses once.

Text replaces current step:
"Time's up."
[small pause]
"But you tried. That's not nothing."
[pause]
"Want another 120 seconds?"

Font: same as You're In sequence
Colors: muted, not gold — 
this moment is gentler, not celebratory

Two options:
[↺ Another 120 seconds]
[I need a break]

"Another 120 seconds": 
  Resets timer bar to full gold.
  Stays on same step.
  Log 'ritual_retry' event.

"I need a break":
  "Rest. The task will wait.
   So will I."
  Fade War Room back in.
  Log 'ritual_dismissed'.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: FOCUS TIMER INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In the Focus Timer pre-session screen,
detect the ?from=ritual query param.

If present:
- Skip the pre-session screen entirely
- Go directly to the cinematic entrance
  with the task pre-loaded
- Session length forced to 5 minutes
- Cinematic entrance text changes to:
  "Keep going." (instead of "Focus begins.")
- After 5 minute session completes,
  completion screen shows extra message:
  
  "You started.
   That was the hardest part.
   You just proved you can do it."
  
  And offers:
  [▶ Another 5 minutes]
  [▶ Full session — 25 minutes]
  [✓ That's enough for now]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Track in user_app_events:

ritual_started:    { task_name, step_count }
ritual_completed:  { task_name, steps_done,
                     time_remaining_seconds,
                     proceeded_to_timer: bool }
ritual_dismissed:  { task_name, steps_done,
                     reason: 'escape'|
                     'timer_expired'|
                     'not_yet' }
ritual_retry:      { task_name }

These feed into the Chronicle page:
"The Sage has noticed:"
- How many rituals you've done
- Your average completion rate
- How often ritual → actual work
- Which day/time you need it most

In the Chronicle, show:
"Rituals completed: X
 Led to focus sessions: Y (Z%)
 Your most common ritual time: 
 {day} at {hour}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: DESIGN RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER during the ritual:
- Show the task list
- Show XP or Legend Points
- Show the streak counter
- Show any navigation
- Use the word "productivity"
- Use the word "focus" 
  (use "starting" or "beginning" instead)
- Show more than one step at a time
- Use a countdown that looks urgent
  (no red, no flashing, no alarm icons)

ALWAYS during the ritual:
- Keep the Familiar visible and calm
- Keep background dark and quiet
- Show one thing at a time
- Provide an escape hatch 
  (never trap the user)
- Use warm language that separates 
  the person from the struggle
  ("the task is hard" not "you're stuck")

MOTION PRINCIPLES:
- Everything moves slower than normal
  (this is intentional — matches calm 
   pacing the user needs)
- Spring physics on the buttons appearing
  (stiffness: 200, damping: 28 — 
   softer spring than rest of app)
- No sudden cuts — every transition 
  has at least 0.3s duration
- The timer bar is the ONLY element 
  that moves continuously — 
  everything else is still until 
  the user acts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: WHAT NOT TO CHANGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Do NOT change the Focus Timer itself.
Do NOT change the task cards.
Do NOT change the War Room layout.
Do NOT add a settings toggle for this 
feature — it should just happen.
Do NOT show this feature to users 
in their first 7 days 
(check user created_at, skip if < 7 days).