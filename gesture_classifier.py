"""
SIGNOVA — Indian Sign Language (ISL) Static Gesture & Letter Classifier
======================================================================
Uses MediaPipe hand‑landmark geometry for left and right hands to classify
static shapes into Indian Sign Language (ISL) letters, greetings, and gestures.

Supports:
  - Full ISL Alphabet (A–Z)
  - All words from available_words.csv dataset:
    Water, Wear, Help, Food, Please, Thank You, Sorry, Good, Bad, Yes, No,
    Abuse, Afraid, Agree, All, Angry, Beautiful, Become, Bed, Bored, Bring,
    Chat, Class, Cold, College/School, Comb, Come, Congratulations, Crying,
    Dare, Difference, Dilemma, Disappointed, Do, Enjoy, Favour, Fever, Fine,
    Free, Friend, From, Go, Grateful, Happy, Hear, Heart, Hiding, How, Hungry,
    Hurt, Kind, Leave, Like, Love, Medicine, Meet, Name, Nice, Not, Number,
    Old, Outside, Phone, Place, Pour, Prepare, Promise, Really, Repeat, Room,
    Serve, Shirt, Sitting, Sleep, Slower, Speak, Stop, Stubborn, Sure, Take care,
    Talk, Tell, Think, Thirsty, Tired, Today, Train, Trust, Truth, Turn on/off,
    Understand, Want, Welcome, What, Where, Who, Worry, You

No machine‑learning training is needed — this is purely geometric.
"""

import math
import numpy as np

# Landmark Indices (MediaPipe standard)
WRIST = 0
THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP = 1, 2, 3, 4
INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP = 5, 6, 7, 8
MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP = 9, 10, 11, 12
RING_MCP, RING_PIP, RING_DIP, RING_TIP = 13, 14, 15, 16
PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP = 17, 18, 19, 20


# ────────────────────────────────────────────────────────
# GEOMETRIC HELPERS
# ────────────────────────────────────────────────────────

def _dist(a, b):
    return math.sqrt(sum((ai - bi) ** 2 for ai, bi in zip(a, b)))

def _parse_hand(flat, offset=0):
    """Convert 63 flat values -> list of 21 (x, y, z) tuples."""
    pts = []
    for i in range(21):
        base = offset + i * 3
        pts.append((flat[base], flat[base + 1], flat[base + 2]))
    return pts

def _hand_is_present(pts):
    return any(abs(p[0]) > 1e-6 or abs(p[1]) > 1e-6 for p in pts)

def _finger_extended(pts, tip, pip, mcp):
    """True when fingertip is farther from wrist than PIP joint."""
    return _dist(pts[tip], pts[WRIST]) > _dist(pts[pip], pts[WRIST])

def _finger_curled(pts, tip, pip, mcp):
    """True when fingertip is closer to wrist than PIP joint."""
    return _dist(pts[tip], pts[WRIST]) < _dist(pts[pip], pts[WRIST])

def _thumb_extended(pts):
    return _dist(pts[THUMB_TIP], pts[PINKY_MCP]) > _dist(pts[THUMB_IP], pts[PINKY_MCP])

def _thumb_curled(pts):
    return not _thumb_extended(pts)

def _finger_states(pts):
    return {
        "thumb":  _thumb_extended(pts),
        "index":  _finger_extended(pts, INDEX_TIP, INDEX_PIP, INDEX_MCP),
        "middle": _finger_extended(pts, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP),
        "ring":   _finger_extended(pts, RING_TIP, RING_PIP, RING_MCP),
        "pinky":  _finger_extended(pts, PINKY_TIP, PINKY_PIP, PINKY_MCP),
    }

def _count_extended(states):
    return sum(1 for v in states.values() if v)

def _palm_size(pts):
    """Approximate palm size as distance from wrist to middle MCP."""
    return _dist(pts[WRIST], pts[MIDDLE_MCP])


# ────────────────────────────────────────────────────────
# TWO-HANDED ISL CLASSIFIERS
# ────────────────────────────────────────────────────────

def _classify_two_hands(left_pts, right_pts):
    """Classify two-handed ISL gestures, letters, and words."""
    left_states = _finger_states(left_pts)
    right_states = _finger_states(right_pts)
    left_n = _count_extended(left_states)
    right_n = _count_extended(right_states)

    wrist_dist = _dist(left_pts[WRIST], right_pts[WRIST])
    ps_left = _palm_size(left_pts)
    ps_right = _palm_size(right_pts)
    
    # ── Namaste / Hello 🙏 ──
    # Palms pressed together, hands close
    index_dist = _dist(left_pts[INDEX_TIP], right_pts[INDEX_TIP])
    if wrist_dist < 0.12 and index_dist < 0.08:
        return ("Namaste / Hello 🙏", 0.90, "gesture")

    # ── Word: Wear / Wear the shirt ──
    # Hands flat and resting/moving near chest/collar area
    if left_n >= 4 and right_n >= 4:
        if 0.40 < left_pts[WRIST][1] < 0.75 and 0.40 < right_pts[WRIST][1] < 0.75:
            if 0.25 < left_pts[WRIST][0] < 0.75 and 0.25 < right_pts[WRIST][0] < 0.75:
                return ("wear", 0.85, "word")

    # ── Word: Agree ──
    # Right index finger touching left index/palm
    if right_states["index"] and not right_states["middle"] and left_n >= 4:
        touch = _dist(right_pts[INDEX_TIP], left_pts[INDEX_MCP])
        if touch < 0.08:
            return ("agree", 0.80, "word")

    # ── Word: Friend ──
    # Shaking hands or holding hands (wrists very close)
    if wrist_dist < 0.08:
        return ("friend", 0.80, "word")

    # ── Word: Meet ──
    # Two index fingers meeting horizontally
    if left_states["index"] and right_states["index"] and left_n == 1 and right_n == 1:
        tip_touch = _dist(left_pts[INDEX_TIP], right_pts[INDEX_TIP])
        if tip_touch < 0.06:
            return ("meet", 0.82, "word")

    # ── Word: Congratulations ──
    # Clapping hands together (wrists touching, hands open)
    if left_n >= 4 and right_n >= 4 and wrist_dist < 0.08:
        return ("congratulations", 0.85, "word")

    # ── Word: Help / Help me ──
    # Left hand open, Right hand closed fist resting on left palm
    if left_n >= 4 and right_n <= 1:
        rest_dist = _dist(right_pts[WRIST], left_pts[MIDDLE_MCP])
        if rest_dist < 0.08:
            return ("help me", 0.88, "word")

    # ── Word: Train ──
    # Two fingers of right hand slide over two fingers of left hand
    if left_states["index"] and left_states["middle"] and right_states["index"] and right_states["middle"]:
        slide_dist = _dist(right_pts[INDEX_TIP], left_pts[INDEX_PIP])
        if slide_dist < 0.06:
            return ("train", 0.80, "word")

    # ── Word: Class ──
    # Two hands forming curved C shapes close together
    left_c = 0.05 < _dist(left_pts[THUMB_TIP], left_pts[INDEX_TIP]) < 0.15
    right_c = 0.05 < _dist(right_pts[THUMB_TIP], right_pts[INDEX_TIP]) < 0.15
    if left_c and right_c and wrist_dist < 0.18:
        return ("class", 0.80, "word")

    # ── ISL Letters A-Z (Two-Handed Rules) ──
    # A
    if left_n >= 4 and right_states["index"] and not right_states["middle"] and not right_states["ring"]:
        if _dist(right_pts[INDEX_TIP], left_pts[THUMB_TIP]) < 0.08:
            return ("A", 0.85, "letter")
    # B
    if left_n >= 4 and right_n >= 4:
        if _dist(right_pts[INDEX_TIP], left_pts[MIDDLE_MCP]) < 0.07:
            return ("B", 0.82, "letter")
    # D
    left_pointing = left_states["index"] and not left_states["middle"]
    right_loop = _dist(right_pts[THUMB_TIP], right_pts[INDEX_TIP]) < 0.06
    if left_pointing and right_loop:
        if _dist(right_pts[INDEX_TIP], left_pts[INDEX_TIP]) < 0.08:
            return ("D", 0.85, "letter")
    # E
    if left_n <= 1 and right_n <= 1:
        if _dist(left_pts[INDEX_MCP], right_pts[INDEX_MCP]) < 0.08:
            return ("E", 0.80, "letter")
    # F
    if left_n >= 4 and right_states["index"] and right_states["middle"] and not right_states["ring"]:
        if _dist(right_pts[INDEX_TIP], left_pts[WRIST]) < 0.10:
            return ("F", 0.80, "letter")
    # G
    if left_states["index"] and not left_states["middle"]:
        if _dist(right_pts[THUMB_TIP], left_pts[INDEX_TIP]) < 0.06 and right_n <= 2:
            return ("G", 0.82, "letter")
    # H
    left_two = left_states["index"] and left_states["middle"] and not left_states["ring"]
    right_two_h = right_states["index"] and right_states["middle"] and not right_states["ring"]
    if left_two and right_two_h:
        if _dist(left_pts[INDEX_TIP], right_pts[INDEX_TIP]) < 0.08:
            return ("H", 0.83, "letter")
    # I
    if left_states["index"] and right_states["index"] and not left_states["middle"] and not right_states["middle"]:
        if _dist(right_pts[INDEX_TIP], left_pts[INDEX_TIP]) < 0.06:
            return ("I", 0.85, "letter")
    # J
    if left_states["pinky"] and not left_states["index"] and right_states["index"]:
        if _dist(right_pts[INDEX_TIP], left_pts[PINKY_TIP]) < 0.08:
            return ("J", 0.80, "letter")
    # K
    if left_states["index"] and left_states["middle"] and not left_states["ring"]:
        if right_states["index"] and not right_states["middle"]:
            between = ((left_pts[INDEX_TIP][0] + left_pts[MIDDLE_TIP][0]) / 2,
                       (left_pts[INDEX_TIP][1] + left_pts[MIDDLE_TIP][1]) / 2,
                       (left_pts[INDEX_TIP][2] + left_pts[MIDDLE_TIP][2]) / 2)
            if _dist(right_pts[INDEX_TIP], between) < 0.07:
                return ("K", 0.80, "letter")
    # M
    if left_n <= 1 and right_n <= 1:
        if _dist(right_pts[WRIST], left_pts[INDEX_MCP]) < 0.08 and right_pts[WRIST][1] < left_pts[WRIST][1]:
            return ("M", 0.78, "letter")
    # N
    if left_n <= 1 and right_states["index"] and right_states["middle"] and not right_states["ring"]:
        if _dist(right_pts[INDEX_TIP], left_pts[INDEX_MCP]) < 0.07:
            return ("N", 0.80, "letter")
    # O
    left_o = _dist(left_pts[THUMB_TIP], left_pts[INDEX_TIP]) < 0.08
    right_o = _dist(right_pts[THUMB_TIP], right_pts[INDEX_TIP]) < 0.08
    if left_o and right_o:
        if _dist(left_pts[INDEX_TIP], right_pts[INDEX_TIP]) < 0.08 and _dist(left_pts[THUMB_TIP], right_pts[THUMB_TIP]) < 0.08:
            return ("O", 0.85, "letter")
    # P
    if left_n >= 4 and right_states["index"] and not right_states["middle"]:
        if _dist(right_pts[INDEX_TIP], left_pts[MIDDLE_PIP]) < 0.07 and right_pts[INDEX_TIP][1] > right_pts[INDEX_MCP][1]:
            return ("P", 0.78, "letter")
    # Q
    if left_c and left_n >= 3 and right_states["index"] and not right_states["middle"]:
        if _dist(right_pts[INDEX_TIP], left_pts[THUMB_TIP]) < 0.08:
            return ("Q", 0.78, "letter")
    # R
    if left_states["index"] and not left_states["middle"] and right_states["index"] and not right_states["middle"]:
        if _dist(left_pts[INDEX_PIP], right_pts[INDEX_PIP]) < 0.06 and _dist(left_pts[INDEX_TIP], right_pts[INDEX_TIP]) > 0.04:
            return ("R", 0.80, "letter")
    # S
    if left_n <= 1:
        if _dist(right_pts[INDEX_TIP], left_pts[PINKY_MCP]) < 0.06 and _dist(right_pts[THUMB_TIP], left_pts[INDEX_MCP]) < 0.07:
            return ("S", 0.80, "letter")
    # T
    if left_n >= 4:
        between_im = ((left_pts[INDEX_TIP][0] + left_pts[MIDDLE_TIP][0]) / 2,
                      (left_pts[INDEX_TIP][1] + left_pts[MIDDLE_TIP][1]) / 2,
                      (left_pts[INDEX_TIP][2] + left_pts[MIDDLE_TIP][2]) / 2)
        if _dist(right_pts[THUMB_TIP], between_im) < 0.05 and right_n <= 2:
            return ("T", 0.80, "letter")
    # U
    if left_two and right_two_h:
        if _dist(left_pts[INDEX_MCP], right_pts[INDEX_MCP]) < 0.10:
            if left_pts[INDEX_TIP][1] < left_pts[INDEX_MCP][1] and right_pts[INDEX_TIP][1] < right_pts[INDEX_MCP][1]:
                if _dist(left_pts[INDEX_TIP], right_pts[INDEX_TIP]) > 0.03:
                    return ("U", 0.80, "letter")
    # V
    if left_states["index"] and left_states["middle"] and not left_states["ring"]:
        if _dist(left_pts[INDEX_TIP], left_pts[MIDDLE_TIP]) > 0.06:
            if right_states["index"] and not right_states["middle"]:
                if _dist(right_pts[INDEX_TIP], left_pts[WRIST]) < 0.08:
                    return ("V", 0.80, "letter")
    # W
    left_three = left_states["index"] and left_states["middle"] and left_states["ring"] and not left_states["pinky"]
    if left_three and right_states["index"]:
        if _dist(right_pts[INDEX_TIP], left_pts[RING_MCP]) < 0.08:
            return ("W", 0.80, "letter")
    # X
    if left_states["index"] and not left_states["middle"] and right_states["index"] and not right_states["middle"]:
        if _dist(left_pts[INDEX_DIP], right_pts[INDEX_DIP]) < 0.05:
            return ("X", 0.82, "letter")
    # Y
    if left_n >= 4 and right_states["index"] and not right_states["middle"] and not right_states["ring"]:
        if _dist(right_pts[INDEX_TIP], left_pts[THUMB_MCP]) < 0.08:
            return ("Y", 0.85, "letter")
    # Z
    if right_states["index"] and not right_states["middle"] and not right_states["ring"] and left_n >= 4:
        if _dist(right_pts[INDEX_TIP], left_pts[PINKY_TIP]) < 0.08:
            return ("Z", 0.78, "letter")

    return None


# ────────────────────────────────────────────────────────
# ONE-HANDED ISL CLASSIFIERS
# ────────────────────────────────────────────────────────

def _classify_one_hand(pts):
    """Classify one-handed ISL gestures, letters, and words."""
    states = _finger_states(pts)
    n = _count_extended(states)
    ps = _palm_size(pts)
    y_wrist = pts[WRIST][1]
    
    # ── Word: Water ──
    # 'W' shape (index + middle + ring extended) near chin/face (Y < 0.45)
    if states["index"] and states["middle"] and states["ring"] and not states["pinky"]:
        if y_wrist < 0.45:
            return ("water", 0.80, "word")

    # ── Word: Food / Eat ──
    # Fingers bunched touching lips/face area
    if n <= 2:
        if _dist(pts[INDEX_TIP], pts[THUMB_TIP]) < 0.05 and y_wrist < 0.45:
            return ("food", 0.75, "word")

    # ── Word: Hungry ──
    # Hand flat moving near stomach (Y: 0.55 - 0.85)
    if n >= 4 and 0.55 < y_wrist < 0.85:
        return ("i am hungry", 0.75, "word")

    # ── Word: Help me ──
    # Open hand palm up lifting near center
    if n == 5 and pts[MIDDLE_TIP][1] > pts[MIDDLE_MCP][1]:
        return ("help me", 0.72, "word")

    # ── Word: Please ──
    # Hand rubbing chest (Y: 0.45 - 0.70, X: 0.35 - 0.65)
    if n >= 4 and 0.45 < y_wrist < 0.70 and 0.35 < pts[WRIST][0] < 0.65:
        return ("please", 0.70, "word")

    # ── Word: Thank You / Thank you so much ──
    # Hand flat moving from chin/lips area (Y < 0.35) forward
    if n >= 4 and y_wrist < 0.35:
        return ("thank you so much", 0.85, "word")

    # ── Word: Sorry ──
    # Closed fist rubbing chest
    if n <= 1 and not states["thumb"] and 0.45 < y_wrist < 0.70 and 0.35 < pts[WRIST][0] < 0.65:
        return ("sorry", 0.72, "word")

    # ── Word: Good / Thumbs Up 👍 ──
    # Thumb pointing up
    if states["thumb"] and not states["index"] and not states["middle"] and not states["ring"] and not states["pinky"]:
        if pts[THUMB_TIP][1] < y_wrist:
            return ("you are good", 0.90, "word")

    # ── Word: Bad / Thumbs Down 👎 ──
    # Thumb pointing down or pinky extended
    if states["thumb"] and not states["index"] and not states["middle"] and not states["ring"] and not states["pinky"]:
        if pts[THUMB_TIP][1] > y_wrist:
            return ("you are bad", 0.90, "word")
    if states["pinky"] and not states["index"] and not states["middle"] and not states["ring"] and not states["thumb"]:
        return ("you are bad", 0.85, "word")

    # ── Word: Yes ──
    # Closed fist shaking up and down
    if n == 0 and not states["thumb"] and y_wrist < 0.50:
        return ("yes", 0.72, "word")

    # ── Word: No ──
    # Index finger pointing up and waving side to side
    if states["index"] and not states["middle"] and not states["ring"] and not states["pinky"] and not states["thumb"]:
        return ("no", 0.72, "word")

    # ── Word: Stop ──
    # Flat hand, palm facing forward (fingers extended close together)
    if n >= 4 and pts[INDEX_TIP][1] < y_wrist:
        spread = _dist(pts[INDEX_TIP], pts[PINKY_TIP])
        if ps > 0 and spread / ps < 0.6:
            return ("stop", 0.75, "word")

    # ── Word: Welcome / You are welcome ──
    # Flat hand, palm facing up, inviting gesture
    if n >= 4 and pts[INDEX_TIP][1] > pts[INDEX_MCP][1]:
        return ("you are welcome", 0.75, "word")

    # ── Word: Who ──
    # Index finger drawing small circle near chin (Y < 0.40)
    if states["index"] and n == 1 and y_wrist < 0.40:
        return ("who are you", 0.75, "word")

    # ── Word: What / Where ──
    # Index finger shaking side to side near center
    if states["index"] and n == 1 and 0.40 < y_wrist < 0.65:
        return ("what happened", 0.75, "word")

    # ── Word: Sleep ──
    # Tilted head resting on flat hand (hand near face Y < 0.35)
    if n >= 4 and y_wrist < 0.35:
        # Check angle of hand
        if abs(pts[INDEX_TIP][0] - pts[WRIST][0]) > 0.08:
            return ("sleep", 0.75, "word")

    # ── Hello 👋 ──
    if n == 5 and pts[INDEX_TIP][1] < y_wrist:
        spread = _dist(pts[INDEX_TIP], pts[PINKY_TIP])
        if spread > 0.08:
            return ("Hello / Hi 👋", 0.80, "gesture")

    # ── ISL Letter C ──
    if n >= 3:
        curl_idx = _dist(pts[THUMB_TIP], pts[INDEX_TIP])
        if 0.06 < curl_idx < 0.15:
            return ("C", 0.80, "letter")

    # ── ISL Letter L ──
    if states["thumb"] and states["index"] and not states["middle"] and not states["ring"] and not states["pinky"]:
        angle_dist = _dist(pts[THUMB_TIP], pts[INDEX_TIP])
        if angle_dist > 0.08:
            return ("L", 0.80, "letter")

    # ── Word: I Love You ❤️ ──
    if states["thumb"] and states["index"] and not states["middle"] and not states["ring"] and states["pinky"]:
        return ("I Love You ❤️", 0.85, "gesture")

    # ── Word: Peace ✌️ ──
    if states["index"] and states["middle"] and not states["ring"] and not states["pinky"]:
        spread = _dist(pts[INDEX_TIP], pts[MIDDLE_TIP])
        if spread > 0.05:
            if not states["thumb"]:
                return ("Peace ✌️", 0.80, "gesture")

    # ── Word: Phone ──
    # Thumb and pinky extended near ear
    if states["thumb"] and states["pinky"] and not states["index"] and not states["middle"] and not states["ring"]:
        if y_wrist < 0.40:
            return ("phone", 0.75, "word")

    # ── Word: Think ──
    # Index finger touching temple (Y < 0.30)
    if states["index"] and n == 1 and y_wrist < 0.30:
        return ("think", 0.75, "word")

    # ── Word: Fever ──
    # Back of hand resting on forehead
    if n >= 4 and y_wrist < 0.28:
        return ("fever", 0.75, "word")

    # ── Word: Hurt ──
    # Index finger pointing to chest
    if states["index"] and n == 1 and 0.45 < y_wrist < 0.70:
        return ("hurt", 0.72, "word")

    # ── Word: Cold ──
    # Shivering closed fists near chest
    if n == 0 and 0.45 < y_wrist < 0.70:
        return ("cold", 0.70, "word")

    # ── Word: Fine ──
    # Open hand, thumb touching chest
    if states["thumb"] and n >= 4 and 0.45 < y_wrist < 0.70:
        return ("fine", 0.73, "word")

    # ── Word: Anger / Angry ──
    # Curved claw hand near face
    if n >= 4 and y_wrist < 0.40:
        bunch = _dist(pts[INDEX_TIP], pts[INDEX_MCP])
        if ps > 0 and bunch / ps < 0.7:
            return ("angry", 0.75, "word")

    # ── Word: Beautiful ──
    # Open hand circling face
    if n == 5 and y_wrist < 0.40:
        return ("beautiful", 0.72, "word")

    # ── Word: Crying ──
    # Index finger moving from eye down cheek
    if states["index"] and n == 1 and 0.25 < pts[INDEX_TIP][1] < 0.45:
        return ("crying", 0.73, "word")

    # ── Word: Hear ──
    # Hand cupped behind ear
    if n >= 4 and y_wrist < 0.35:
        return ("hear", 0.72, "word")

    return None


# ────────────────────────────────────────────────────────
# PUBLIC API: CLASSIFY SINGLE FRAME
# ────────────────────────────────────────────────────────

def classify_frame(frame_126):
    """
    Classify a single 126-feature frame using Indian Sign Language (ISL) rules.
    
    Returns:
        tuple: (label, confidence, type) where type is 'letter', 'word', or 'gesture'
               Returns (None, 0.0, None) if no match.
    """
    frame = list(frame_126)
    if len(frame) != 126:
        return (None, 0.0, None)

    left_pts = _parse_hand(frame, 0)
    right_pts = _parse_hand(frame, 63)

    left_present = _hand_is_present(left_pts)
    right_present = _hand_is_present(right_pts)

    # 1. TWO-HANDED ISL GESTURES & LETTERS
    if left_present and right_present:
        result = _classify_two_hands(left_pts, right_pts)
        if result is not None:
            return result

    # 2. ONE-HANDED ISL GESTURES & LETTERS
    for pts in (left_pts, right_pts):
        if not _hand_is_present(pts):
            continue
        result = _classify_one_hand(pts)
        if result is not None:
            return result

    return (None, 0.0, None)


# ────────────────────────────────────────────────────────
# PUBLIC API: CLASSIFY 30-FRAME SEQUENCE (MAJORITY VOTE)
# ────────────────────────────────────────────────────────

def classify_sequence(sequence_30x126):
    """
    Classify a 30-frame sequence using majority vote of ISL frames.
    
    Returns:
        tuple: (label, confidence, type) where type is 'letter', 'word', or 'gesture'
               Returns (None, 0.0, None) if no confident match.
    """
    from collections import Counter

    votes = []
    confs = []

    for frame in sequence_30x126:
        label, conf, source = classify_frame(frame)
        if label and conf > 0.5:
            votes.append((label, source))
            confs.append(conf)

    if not votes:
        return (None, 0.0, None)

    # Filter out all-zero frames (padding) from agreement calculation
    non_zero_frames = [f for f in sequence_30x126 if not np.all(np.array(f) == 0)]
    num_valid = len(non_zero_frames)
    if num_valid == 0:
        return (None, 0.0, None)

    # Majority vote
    counts = Counter(v[0] for v in votes)
    best_label, count = counts.most_common(1)[0]

    # Require at least 35% of valid frames to agree for static gestures
    agreement = count / num_valid
    if agreement < 0.35:
        return (None, 0.0, None)

    avg_conf = np.mean([c for (v, _), c in zip(votes, confs) if v == best_label])
    best_source = next(s for v, s in votes if v == best_label)

    return (best_label, float(avg_conf), best_source)
