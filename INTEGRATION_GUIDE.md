# Solomon's Chamber - Integration Guide

## Overview
This is the skill repository for Soccer Souls, containing all agent skills, integrations, and protocols.

## Directory Structure

```
Solomons-Chamber/
├── skills/
│   ├── fan-park-discovery/     # NOMAD integration for fan parks
│   ├── acp-integration/        # AI Character Protocol
│   ├── tourist-guide/          # Multi-language tourist assistance
│   └── live-broadcast/         # Async battle highlights
├── integrations/
│   ├── nomad/                  # Cloned from github.com/mauriceboe/NOMAD
│   └── acp/                    # Cloned from Virtual-Protocol
└── protocols/
    └── acp-format.json         # ACP standard format
```

## Skills Overview

### 1. Fan Park Discovery Skill
**File:** `skills/fan-park-discovery/skill.py`

**Purpose:** 
- Discover fan parks for World Cup 2026
- Allow Soul NFTs to "promote" fan parks
- Provide local tourist guides

**Key Features:**
- 16 World Cup 2026 fan parks loaded
- Multi-language support (22 languages)
- Distance-based discovery
- Local tips and food recommendations
- Emergency contact info

**Usage:**
```python
from skills.fan-park-discovery.skill import fan_park_skill

# Discover parks in USA
parks = fan_park_skill.discover(country="USA")

# Promote a park with Soul NFT
fan_park_skill.promote("fp_nyc", "soul_123")

# Get local guide
 guide = fan_park_skill.get_local_guide("fp_nyc", language="es")
```

**Integration:** 
- Uses NOMAD for location services
- Can be extended for real-time park occupancy

---

### 2. ACP Integration Skill
**File:** `skills/acp-integration/skill.py`

**Purpose:**
- Make Soul NFTs autonomous AI agents
- Give them personalities and memory
- Enable independent actions

**Character Archetypes:**
1. **Legendary Striker** - Confident, showman, motivator
2. **Tactical Master** - Analytical, strategic, mentor
3. **Passionate Defender** - Loyal, fierce, warrior
4. **Playful Midfielder** - Creative, joyful, connector
5. **Wise Goalkeeper** - Calm, observant, reliable

**Usage:**
```python
from skills.acp-integration.skill import acp_skill

# Create autonomous agent for Soul
agent = acp_skill.create_soul_agent(
    soul_id="soul_123",
    character_id="legend_striker",
    custom_traits=["extra_confident"]
)

# Get autonomous action
action = acp_skill.get_agent_action("soul_123", {
    "context": "match_day",
    "location": "fan_park_nyc"
})
# Returns: {"action": "promote_fan_park", "message": "..."}

# Export to ACP format for Virtual Protocol
acp_data = acp_skill.agent_to_acp_format("soul_123")
```

**Integration:**
- Compatible with Virtual Protocol ACP
- Can export to `dgclaw-skill` format

---

### 3. Live Broadcast Skill
**File:** `skills/live-broadcast/skill.py`

**Purpose:**
- Create cinematic battle replays (NOT live streaming)
- Generate viral content for social media
- Async "Twitch Premieres"

**Why Async (Not Live):**
1. Battles can be "produced" with better camera angles
2. Slow-motion replays of critical hits
3. Professional commentary added in post
4. Music and effects enhance drama
5. Edited for maximum viral potential
6. No latency issues or technical failures

**Social Platforms Supported:**
- TikTok (60s, 9:16 vertical)
- Twitter/X (140s, 16:9)
- Instagram (90s, 1:1)
- YouTube (5min, 16:9 full replay)
- Twitch Premiere (7min, "live" premiere)

**Usage:**
```python
from skills.live-broadcast.skill import broadcast_skill

# Create replay from battle data
replay = broadcast_skill.create_battle_replay(battle_data)

# Render for TikTok
tiktok_video = broadcast_skill.render_for_social(
    battle_id="battle_123",
    platform="tiktok"
)

# Schedule Twitch Premiere (async "live")
premiere = broadcast_skill.schedule_twitch_premiere(
    battle_id="battle_123",
    premiere_time=datetime(2026, 6, 15, 20, 0)
)
```

---

## Twitch "Live" Battles - Clarification

**What it IS:**
- Pre-recorded battles that "premiere" on Twitch
- Looks live to viewers (chat, predictions, reactions)
- Actually produced/edited for maximum quality
- Can schedule multiple "live" battles per day

**What it is NOT:**
- Real-time streaming (technically complex)
- Actual live AI battles happening in real-time
- Unpredictable technical failures

**The Viewer Experience:**
1. Viewer sees "🔴 LIVE: Messi Soul vs Ronaldo Soul"
2. Chat is active with real viewers
3. Predictions open before "battle"
4. Battle "happens" with professional commentary
5. Viewer can vote on next battle
6. Everything feels live, but it's produced content

**Why This Is Better:**
- Professional quality
- No technical disasters
- Can script dramatic moments
- Multiple "live" events per day
- Actually scalable

---

## Integration Commands

```bash
# 1. Setup ACP Framework
git clone https://github.com/Virtual-Protocol/openclaw-acp.git
npm install
npm run acp -- setup

# 2. Clone DGClaw Skill
git clone https://github.com/Virtual-Protocol/dgclaw-skill.git

# 3. Clone NOMAD for Fan Parks
git clone https://github.com/mauriceboe/NOMAD.git

# 4. Join Virtual Protocol competition (if desired)
dgclaw.sh join
```

---

## Fan Park Promotion Flow

```
Soul NFT → Discovers Fan Park → Promotes It → Gets Rewards
                ↓
        Tourist Sees Promotion
                ↓
        Visits Fan Park
                ↓
        Soul Gets Commission/Reputation
```

**Fan Park Features:**
- Giant screens
- Food trucks
- Local culture (mariachi in Mexico, etc.)
- Multi-language support
- Accessibility features
- Tourist guides

---

## ACP Agent Autonomy Flow

```
Soul NFT (with ACP) → Observes Context → Makes Decision → Takes Action
                                              ↓
                                    Could be:
                                    - Promote fan park
                                    - Make prediction
                                    - Challenge another Soul
                                    - Share wisdom
                                    - Encourage fans
```

---

## Next Steps

1. **Deploy Skills:** Get skills running in production
2. **Integrate NOMAD:** Connect real-time park data
3. **ACP Export:** Export Souls to Virtual Protocol
4. **Content Creation:** Start producing battle replays
5. **Fan Park Partnerships:** Partner with actual venues

---

**Skills saved in Solomon's Chamber ready for use!** 🏛️
