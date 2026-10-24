# SPEC — Round: "The empty chair"

GOAL:    a judge understands in one viewing that Round is a savings circle on Mezo where locked BTC covers a missed
         MUSD payment, so the group still gets paid; and remembers "your Bitcoin keeps the promise".
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps.
TIME:    67.0 s x 30 = 2010 frames. Narrated: the voice is the clock (word timestamps in assets/voice/*.words.json).

LOOK:    the Round website itself.
         ground: the site's gradient plate assets/bg.png (#0a2d0f top → #2a7f38 → #53cd6d → #eefef2 bottom), stretched
           to 1920x1500 so the top 1080 px run forest → bright green; mint #eefef2 for "app" worlds.
         ink: white #ffffff on green; #0a1128 (navy ink) on mint/white; forest #0f3d1c for big type on mint.
         accent: leaf-light #6fe08f — the ring, the recipient seat, one highlighted word per title.
         alarm: Bitcoin orange #f7931a — ONLY the coin that covers the default (scene 7) and the end-card ₿ dot. Red
           #f87171 only on the empty seat / missed mark.
         display: Inter Light (300) for titles, 88-120 px, tracking -3.5%; Inter Semibold (600) for numbers and seat
           labels, 40-64 px. Body/labels Inter 400 32-36 px (never under 28 px).
         medium: product UI — real 2x screenshots of the app (assets/ui/*.png), presented as the white cards they are:
           radius 32 px, shadow 0 24px 60px rgba(15,61,28,0.18). No glass, no glow.
OBJECTS: the ring = the Round mark: a 22 px-stroke circle, leaf-light, with a solid dot at 1 o'clock (the payout).
         seats = four 132 px discs on the ring (white, navy number 1-4); the recipient seat fills leaf-light;
           the empty seat turns #3f1a1a with a #f87171 2px edge and its number dims.
         the pot = a white 300 px disc in the ring's centre with "$300" (Inter 600, 84 px) and "pot" under it.
         coins = 72 px discs: MUSD coins white with forest "$"; the BTC coin #f7931a with white ₿.
MOTION:  enter: expo.out 0.7 s (titles per word: blur 6px→0 + opacity, 0.07 s apart, no translate);
         move: power3.inOut 0.6-0.9 s; camera: power2.inOut 1.2-2.0 s scale/translate on a wrapper;
         exit: power3.in 0.3 s; hits: tl.set (0 ms). Coins travel on power2.inOut 0.55 s arcs.
         Overlap 30-50 %. One hero move per shot. Landed titles stay dead still.
SHOTS:
  1  0.0-8.0   RING. Frame 0 already shows the ring + four seats + empty pot. On "hundred dollars" each seat fires a
               MUSD coin into the pot (4 x pop, 0.25 s apart), pot counts $0→$300; on "takes the whole pot" the pot
               slides to seat 1, which fills leaf-light. Title words lower-left: "Four friends · $100 each".
  2  8.0-15.5  THE BREAK. Same ring (match). On "early" seat 1 lifts the pot away; on "stops paying" seat 1 goes dark
               red, its coin stays missing — music drops out. Title: "This is where circles break" (word "break" red).
  3  15.5-23.5 REVEAL. The ring scales up and becomes the Round mark (seats fold into it, dot lands at 1 o'clock);
               colour flood to the green plate; "round" wordmark types beside it; on "Mezo / MUSD / Bitcoin" three
               labels land under it. Music enters here.
  4  23.5-31.5 JOIN — real app. The real home page plate pushes in (1.0→1.12) then cuts to the "Lock to join"
               stats card and the "Join (lock 0.00562 BTC)" button card stacked on mint; on "price feed" a leader
               line labels "Mezo PriceFeed" at the BTC amount. Click on the button.
  5  31.5-40.0 PAY + SETTLE — real app. The "Pay 100 MUSD" card; on "one signature" a signature stroke draws over
               it; whip to the "Settle round 1" card; on "pot goes out" the activity line "Round 1 settled: Member 1
               received 300 MUSD" slides in.
  6  40.0-45.0 SKIP. Back to the ring (round 2): seat 2 is now the recipient; seats 3,4 fire coins; seat 1's coin
               never comes — a dashed empty slot pulses once (no loop) and a ✗ lands.
  7  45.0-55.5 COVERED (the payoff). Riser under "grace period"; the BTC coin rises out of seat 1's locked vault and
               drops into the pot on "locked Bitcoin" (impact); "+10% penalty" chip splits to seats 2-4; on "still
               gets paid" pot flies to seat 2. Then cut to the real activity card: the red line "Member 1 missed
               round 2 — 0.001375 BTC taken" and "Member 2 received 200 MUSD + 0.001292 BTC" highlighted.
  8  55.5-60.5 CLAIM. Mint ground, forest type, three lines landing one per phrase: "No admin" · "No middleman" ·
               "The group stays whole".
  9  60.5-67.0 END CARD. Green plate; the ring mark draws on, "round" types, line "Save together in dollars.
               Keep your Bitcoin." lands; small "Built on Mezo · MUSD · Live on Mezo testnet". Holds 2.5 s.
BANNED:  dark void with floating UI; glow, bloom, particles, neon rings; purple/blue gradients; glass cards; cream paper
         + serif; everything centred; fade-and-slide-up on every element; titles moving after landing; corner
         labels/HUD; three cards in a row; docked logo; "Introducing"; on-screen text repeating the narration word for word.
QA:      0.0 (thumbnail: ring + seats, never blank) · 6.5 (seat 1 filled with pot) · 12.5 (red empty seat) ·
         19.0 (Round mark + labels) · 27.0 (real join card, legible 0.0056 BTC) · 36.0 (real settle card) ·
         43.0 (✗ empty slot) · 50.0 (orange BTC coin mid-air) · 54.0 (real activity card legible) ·
         58.5 (claim lines) · 66.0 (end card fully landed).
