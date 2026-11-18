"""Generates docs/images/event-workflow.svg and incident-lifecycle.svg (same palette as the other README diagrams).
Render to PNG with docs/images/render_png.mjs. Run: python3 docs/images/gen_workflow_diagrams.py"""
from pathlib import Path
from html import escape

INK, BODY, MUTED = "#1F1A17", "#4A413B", "#6B625B"
WARM, WARM_S = "#FAF5EF", "#E8DDD3"
NX, NX_S, NX_T, NX_A = "#FCE9DE", "#F0C3A7", "#B9501F", "#D9622A"
PG, PG_S, PG_T = "#E9EFF7", "#3E5A8C", "#2E4A7A"
OK, OK_S, OK_T = "#E6F2EA", "#4C9A6A", "#2F7A4D"
FONT = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "Menlo, Consolas, monospace"
HERE = Path(__file__).parent


def head(w, h):
    m = "".join(
        f'<marker id="{i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{c}"/></marker>'
        for i, c in (("a", MUTED), ("t", NX_A), ("g", OK_S), ("b", PG_S))
    )
    return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{FONT}"><defs>{m}</defs>', f'<rect width="{w}" height="{h}" fill="#FFFFFF"/>']


def text(x, y, s, size=14, weight=400, fill=BODY, anchor="start", mono=False):
    f = f' font-family="{MONO}"' if mono else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{f}>{escape(s)}</text>'


def box(x, y, w, h, fill=WARM, stroke=WARM_S, dash=False, rx=12, sw=1.5):
    d = ' stroke-dasharray="6 5"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def card(x, y, w, h, title, lines, *, fill=WARM, stroke=WARM_S, tfill=INK, tag=None, tagfill=MUTED, dash=False, center=False):
    out = [box(x, y, w, h, fill, stroke, dash)]
    cx = x + w / 2 if center else x + 18
    a = "middle" if center else "start"
    out.append(text(cx, y + 30, title, 16, 600, tfill, a))
    yy = y + 30
    if tag:
        yy += 21
        out.append(text(cx, yy, tag, 12, 400, tagfill, a, mono=True))
    for ln in lines:
        yy += 21
        out.append(text(cx, yy, ln, 13.5, 400, BODY, a))
    return out


def arrow(x1, y1, x2, y2, color="a", label=None, lx=None, ly=None, lfill=MUTED, dash=False, anchor="middle"):
    c = {"a": MUTED, "t": NX_A, "g": OK_S, "b": PG_S}[color]
    d = ' stroke-dasharray="5 4"' if dash else ""
    out = [f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="1.8" marker-end="url(#{color})"{d}/>']
    if label:
        out.append(text(lx if lx is not None else (x1 + x2) / 2, ly if ly is not None else (y1 + y2) / 2 - 8, label, 12.5, 500, lfill, anchor))
    return out


def path(d, color="a", label=None, lx=0, ly=0, lfill=MUTED, dash=False, anchor="middle"):
    c = {"a": MUTED, "t": NX_A, "g": OK_S, "b": PG_S}[color]
    da = ' stroke-dasharray="5 4"' if dash else ""
    out = [f'<path d="{d}" fill="none" stroke="{c}" stroke-width="1.8" marker-end="url(#{color})"{da}/>']
    if label:
        out.append(text(lx, ly, label, 12.5, 500, lfill, anchor))
    return out


# ---------------------------------------------------------------- event workflow (swimlanes)
def event_workflow():
    W, H = 1700, 830
    s = head(W, H)
    s.append(text(40, 56, "How an event runs on Baton", 28, 600, INK))
    s.append(text(40, 86, "Three roles, no app installs. Baton decides who owns what; Nexconn carries every update to every screen.", 16, 400, MUTED))

    stages = ["1 · Set up", "2 · Join", "3 · Report", "4 · Coordinate", "5 · Close the loop"]
    x0, colw, gap = 250, 278, 0
    top = 130
    for i, st in enumerate(stages):
        cx = x0 + i * colw + colw / 2
        s.append(box(x0 + i * colw + 6, top, colw - 12, 40, "#F4EEE8", "#F4EEE8", rx=8))
        s.append(text(cx, top + 26, st.upper(), 13, 700, MUTED, "middle"))

    lanes = [
        ("Organizer", "desktop · /o/[eventId]", WARM, WARM_S, INK),
        ("Volunteer crew", "phone · /c/[eventId]", WARM, WARM_S, INK),
        ("Attendee", "phone · /e/[slug]", WARM, WARM_S, INK),
        ("Nexconn", "Chat · Call · webhooks", NX, NX_S, NX_T),
    ]
    cells = [
        [("Creates the event", ["names it and its locations", "at /new"]), ("Shares the crew QR", ["and prints one report", "poster per location"]), ("Sees the card land", ["on the board, live,", "no reload"]), ("Assigns and watches", ["escalations, Baton Passes,", "calls and DMs"]), ("Reads the impact", ["time to owner and", "time to fix per incident"])],
        [None, ("Scans the crew QR", ["types a name, lands in", "the crew app"]), ("Gets the card", ["on every crew phone", "with an I'll take it button"]), ("Claims · passes · calls", ["one owner at a time;", "voice/video huddle, DMs"]), ("Marks it fixed", ["the whole crew sees", "it close"])],
        [None, None, ("Scans a poster", ["picks a category, sends;", "anonymous, no account"]), ("Sees who is on it", ["status thread:", "“Riya is on it”"]), ("Sees “Fixed”", ["the person who asked", "hears back"])],
        [("Group channel", ["one crew group per event,", "created by the Server API"]), ("Access token", ["member joins the group;", "browser connects"]), ("Incident card", ["BTN:Incident in the group;", "BTN:Status to the reporter"]), ("Metadata + alerts", ["card state in metadata;", "toUserIds private alerts"]), ("Final update", ["metadata says fixed;", "reporter gets BTN:Status"])],
    ]
    ly0, lh = 190, 145
    for r, (name, sub, f, st, tf) in enumerate(lanes):
        y = ly0 + r * lh
        s.append(box(40, y, W - 80, lh - 14, "#FFFFFF" if r < 3 else "#FFF8F3", "#E8DDD3" if r < 3 else NX_S, rx=16))
        s.append(text(62, y + 56, name, 18, 600, tf))
        s.append(text(62, y + 80, sub, 12, 400, MUTED, mono=True))
        for c in range(5):
            cell = cells[r][c]
            cx = x0 + c * colw + 8
            if cell is None:
                s.append(text(cx + (colw - 16) / 2, y + 80, "—", 16, 400, "#C9BFB6", "middle"))
                continue
            t, lines = cell
            s += card(cx, y + 14, colw - 16, lh - 42, t, lines, fill=f if r == 3 else WARM, stroke=st, tfill=tf)
            if c < 4 and cells[r][c + 1] is not None:
                s += arrow(cx + colw - 16, y + 14 + (lh - 42) / 2, cx + colw - 2, y + 14 + (lh - 42) / 2, "t" if r == 3 else "a")

    s.append(text(40, H - 22, "Postgres is the source of truth for ownership; each change is committed first, then projected through Nexconn.", 13, 400, MUTED))
    s.append("</svg>")
    (HERE / "event-workflow.svg").write_text("\n".join(s))


# ---------------------------------------------------------------- incident lifecycle (state machine)
def incident_lifecycle():
    W, H = 1700, 1000
    s = head(W, H)
    s.append(text(40, 56, "Incident lifecycle", 28, 600, INK))
    s.append(text(40, 86, "Exactly one owner at a time. Every transition is decided in a Postgres transaction, then pushed to every screen.", 16, 400, MUTED))

    my, mh = 380, 120  # main row
    # report arrives
    s += card(40, my, 230, mh, "Report arrives", ["QR poster, or a request", "typed in crew chat"])
    # decision diamond
    dx, dy = 395, my + mh / 2
    s.append(f'<polygon points="{dx},{dy - 70} {dx + 95},{dy} {dx},{dy + 70} {dx - 95},{dy}" fill="#FFFFFF" stroke="{MUTED}" stroke-width="1.5"/>')
    s.append(text(dx, dy - 6, "Same problem", 13.5, 600, INK, "middle"))
    s.append(text(dx, dy + 14, "already open?", 13.5, 600, INK, "middle"))
    s += arrow(270, dy, dx - 97, dy)
    # open
    ox = 580
    s += card(ox, my, 270, mh, "Needs an owner", ["status open · numbered card", "on the board and every phone"], tag="open", fill="#FFF4EC", stroke="#E9A47F")
    s += arrow(dx + 95, dy, ox - 2, dy, "a", "no", dx + 140, dy - 10)
    # claimed
    cx = 1010
    s += card(cx, my, 270, mh, "Being handled", ["atomic claim: one winner;", "owner shown to everyone"], tag="claimed", fill=PG, stroke=PG_S, tfill=PG_T, tagfill=PG_T)
    s += arrow(ox + 270, dy - 18, cx - 2, dy - 18, "b", "I'll take it  ·  lead assigns", (ox + 270 + cx) / 2, dy - 30, PG_T)
    s += path(f"M {cx} {dy + 30} C {cx - 60} {dy + 90}, {ox + 330} {dy + 90}, {ox + 272} {dy + 34}", "a", "release", (ox + 270 + cx) / 2, dy + 92)
    # fixed
    fx = 1400
    s += card(fx, my, 260, mh, "Fixed", ["owner marks it fixed;", "times to owner and fix kept"], tag="resolved", fill=OK, stroke=OK_S, tfill=OK_T, tagfill=OK_T)
    s += arrow(cx + 270, dy, fx - 2, dy, "g", "mark fixed", (cx + 270 + fx) / 2, dy - 10, OK_T)

    # duplicate branch
    s += card(260, 600, 280, 120, "Attached to that incident", ["report count +1, no new card;", "sensitive categories are only", "suggested to a lead"])
    s += arrow(dx, dy + 70, dx, 598, "a", "yes", dx + 20, dy + 120, anchor="start")

    # escalation (above open)
    s += card(560, 150, 310, 120, "Escalation", ["unowned 2 min (45 s if urgent):", "private alert to the location", "lead or the event leads"], fill=NX, stroke=NX_S, tfill=NX_T)
    s += path(f"M {ox + 70} {my} L {ox + 70} 272", "t", "worker tick", ox + 62, my - 40, NX_T, anchor="end")
    s += path(f"M {ox + 200} 272 L {ox + 200} {my - 2}", "t", "re-alert", ox + 210, my - 40, NX_T, anchor="start")

    # baton pass (above claimed)
    s += card(990, 150, 310, 120, "Baton Pass offered", ["owner picks a teammate + note;", "only they see the offer;", "the owner keeps it meanwhile"], fill=NX, stroke=NX_S, tfill=NX_T)
    s += path(f"M {cx + 60} {my} L {cx + 60} 272", "t", "pass", cx + 52, my - 40, NX_T, anchor="end")
    s += path(f"M {cx + 210} 272 L {cx + 210} {my - 2}", "t", "accept → new owner", cx + 220, my - 54, NX_T, anchor="start")
    s.append(text(cx + 220, my - 34, "decline / cancel → same owner", 12.5, 500, MUTED))

    # withdrawn (below open)
    s += card(600, 640, 230, 100, "Withdrawn", ["“Not a request”", "or merged into another"], tag="withdrawn", dash=True, fill="#FFFFFF", stroke="#BDB3AA")
    s += arrow(ox + 135, my + mh, ox + 135 + 0, 638, "a", None, dash=True)

    # huddle (below claimed)
    s += card(1000, 640, 290, 100, "Huddle", ["1:1 voice or video call from", "the incident, logged on it"], fill=NX, stroke=NX_S, tfill=NX_T)
    s += path(f"M {cx + 135} {my + mh} L {cx + 135} 638", "t", None, dash=True)

    # reporter (below fixed)
    s += card(1400, 640, 260, 100, "Reporter sees “Fixed”", ["direct-channel status;", "the loop is closed"], fill=OK, stroke=OK_S, tfill=OK_T)
    s += arrow(fx + 130, my + mh, fx + 130, 638, "g")

    # pipeline band
    by = 820
    s.append(box(40, by, W - 80, 130, "#F7F3EE", "#F7F3EE", rx=16))
    s.append(text(64, by + 34, "ON EVERY TRANSITION", 13, 700, MUTED))
    chips = [
        ("Postgres transaction", "authorise · version + 1", PG, PG_S, PG_T),
        ("Audit row", "incident_events, append-only", WARM, WARM_S, INK),
        ("Nexconn metadata", "card state on the message", NX, NX_S, NX_T),
        ("Targeted alerts", "toUserIds group message", NX, NX_S, NX_T),
        ("Reporter status", "BTN:Status direct message", NX, NX_S, NX_T),
    ]
    cw, cg = 290, 30
    for i, (t, sub, f, st, tf) in enumerate(chips):
        x = 64 + i * (cw + cg)
        s.append(box(x, by + 50, cw, 62, f, st, rx=10))
        s.append(text(x + 16, by + 76, t, 15, 600, tf))
        s.append(text(x + 16, by + 98, sub, 12.5, 400, MUTED))
        if i < len(chips) - 1:
            s += arrow(x + cw + 2, by + 81, x + cw + cg - 2, by + 81, "a")
    s.append("</svg>")
    (HERE / "incident-lifecycle.svg").write_text("\n".join(s))


event_workflow()
incident_lifecycle()
print("written")
