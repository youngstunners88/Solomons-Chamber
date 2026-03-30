"""
Live Broadcast Skill
Handles async battle highlights (not real-time streaming)
Creates cinematic battle replays for social media
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class BattleHighlight:
    """A highlight moment from a battle"""
    timestamp: float
    round_number: int
    attacker: str
    defender: str
    action: str
    impact: str  # critical, major, minor
    damage: int
    commentary: str
    slow_motion: bool
    replay_worthy: bool

@dataclass
class BattleReplay:
    """Complete battle replay package"""
    battle_id: str
    soul_a: str
    soul_b: str
    winner: str
    duration_seconds: float
    highlights: List[BattleHighlight]
    final_score: Dict[str, int]
    cinematic_score: str  # background music style
    thumbnail_frame: int  # which highlight to use as thumbnail
    viral_potential: float  # 0-1 score

class LiveBroadcastSkill:
    """
    Live Broadcast Skill
    
    IMPORTANT: This is NOT live real-time streaming
    Instead, it creates cinematic battle replays/highlight reels
    that can be:
    1. Posted to social media (TikTok, Twitter, Instagram)
    2. Shown on arena screens during events
    3. Shared by Soul NFTs as "battle highlights"
    4. Used for " async Twitch" - pre-recorded but premieres as "live"
    
    This is better than live streaming because:
    - Battles can be "produced" with better camera angles
    - Add slow-motion replays of critical hits
    - Professional commentary can be added
    - Music and effects enhance drama
    - Can be edited for maximum viral potential
    """
    
    def __init__(self):
        self.replays: Dict[str, BattleReplay] = {}
        self.broadcast_queue: List[str] = []
        self.social_formats = {
            "tiktok": {"duration": 60, "aspect": "9:16", "style": "fast_cuts"},
            "twitter": {"duration": 140, "aspect": "16:9", "style": "highlights"},
            "instagram": {"duration": 90, "aspect": "1:1", "style": "cinematic"},
            "youtube": {"duration": 300, "aspect": "16:9", "style": "full_replay"},
            "twitch_premiere": {"duration": 420, "aspect": "16:9", "style": "event"},
        }
    
    def create_battle_replay(self, battle_data: Dict[str, Any]) -> BattleReplay:
        """
        Create a cinematic replay from battle data
        
        Args:
            battle_data: Raw battle simulation results
        """
        # Extract key moments
        highlights = self._extract_highlights(battle_data)
        
        # Calculate viral potential
        viral_score = self._calculate_viral_potential(highlights, battle_data)
        
        # Select best thumbnail
        thumbnail_idx = self._select_thumbnail(highlights)
        
        replay = BattleReplay(
            battle_id=battle_data.get("battle_id", "unknown"),
            soul_a=battle_data.get("soul_a", {}).get("name", "Soul A"),
            soul_b=battle_data.get("soul_b", {}).get("name", "Soul B"),
            winner=battle_data.get("winner", "Unknown"),
            duration_seconds=battle_data.get("duration", 180),
            highlights=highlights,
            final_score=battle_data.get("final_scores", {}),
            cinematic_score=self._select_music(highlights),
            thumbnail_frame=thumbnail_idx,
            viral_potential=viral_score
        )
        
        self.replays[replay.battle_id] = replay
        return replay
    
    def _extract_highlights(self, battle_data: Dict) -> List[BattleHighlight]:
        """Extract the most dramatic moments from battle"""
        highlights = []
        rounds = battle_data.get("rounds", [])
        
        for i, round_data in enumerate(rounds):
            # Determine impact level
            damage = round_data.get("damage", 0)
            if damage > 70:
                impact = "critical"
                slow_mo = True
                replay = True
            elif damage > 40:
                impact = "major"
                slow_mo = random.random() < 0.3
                replay = random.random() < 0.5
            else:
                impact = "minor"
                slow_mo = False
                replay = False
            
            highlight = BattleHighlight(
                timestamp=round_data.get("timestamp", i * 10),
                round_number=round_data.get("round_number", i + 1),
                attacker=round_data.get("attacker", "Unknown"),
                defender=round_data.get("defender", "Unknown"),
                action=round_data.get("attack_type", "attack"),
                impact=impact,
                damage=damage,
                commentary=round_data.get("narrative", ""),
                slow_motion=slow_mo,
                replay_worthy=replay
            )
            highlights.append(highlight)
        
        return highlights
    
    def _calculate_viral_potential(self, highlights: List[BattleHighlight], 
                                   battle_data: Dict) -> float:
        """Calculate how likely this battle is to go viral"""
        score = 0.0
        
        # Critical hits make viral content
        critical_count = sum(1 for h in highlights if h.impact == "critical")
        score += critical_count * 0.2
        
        # Close battles are more exciting
        scores = battle_data.get("final_scores", {})
        if len(scores) >= 2:
            score_diff = abs(list(scores.values())[0] - list(scores.values())[1])
            if score_diff < 100:
                score += 0.3  # Close battle
        
        # Underdog wins are viral gold
        soul_a_power = battle_data.get("soul_a", {}).get("attributes", {}).get("power", 500)
        soul_b_power = battle_data.get("soul_b", {}).get("attributes", {}).get("power", 500)
        winner = battle_data.get("winner", "")
        
        if soul_a_power > soul_b_power + 100 and winner == battle_data.get("soul_b", {}).get("name"):
            score += 0.4  # Underdog victory
        elif soul_b_power > soul_a_power + 100 and winner == battle_data.get("soul_a", {}).get("name"):
            score += 0.4
        
        return min(score, 1.0)
    
    def _select_thumbnail(self, highlights: List[BattleHighlight]) -> int:
        """Select the best frame for thumbnail"""
        # Find first critical hit or most dramatic moment
        for i, h in enumerate(highlights):
            if h.impact == "critical":
                return i
        
        # Or the highest damage moment
        max_damage_idx = max(range(len(highlights)), 
                            key=lambda i: highlights[i].damage)
        return max_damage_idx
    
    def _select_music(self, highlights: List[BattleHighlight]) -> str:
        """Select appropriate background music"""
        critical_count = sum(1 for h in highlights if h.impact == "critical")
        
        if critical_count >= 3:
            return "epic_orchestral"
        elif critical_count >= 1:
            return "intense_electronic"
        else:
            return "tactical_ambient"
    
    def render_for_social(self, battle_id: str, platform: str) -> Dict[str, Any]:
        """
        Render battle replay optimized for specific social platform
        
        Args:
            battle_id: Battle to render
            platform: tiktok, twitter, instagram, youtube, twitch_premiere
        """
        replay = self.replays.get(battle_id)
        if not replay:
            return {"error": "Battle not found"}
        
        format_spec = self.social_formats.get(platform, self.social_formats["youtube"])
        
        # Select highlights that fit duration
        total_duration = 0
        selected_highlights = []
        
        for highlight in replay.highlights:
            clip_duration = 5 if highlight.slow_motion else 3
            if total_duration + clip_duration <= format_spec["duration"]:
                selected_highlights.append(highlight)
                total_duration += clip_duration
        
        # Generate description
        description = self._generate_description(replay, platform)
        
        # Generate hashtags
        hashtags = self._generate_hashtags(replay, platform)
        
        return {
            "battle_id": battle_id,
            "platform": platform,
            "aspect_ratio": format_spec["aspect"],
            "style": format_spec["style"],
            "duration": total_duration,
            "highlights": selected_highlights,
            "thumbnail_highlight": replay.highlights[replay.thumbnail_frame],
            "music": replay.cinematic_score,
            "description": description,
            "hashtags": hashtags,
            "viral_potential": replay.viral_potential,
            "soul_tags": [f"@{replay.soul_a}", f"@{replay.soul_b}"],
            "call_to_action": self._get_cta(platform)
        }
    
    def _generate_description(self, replay: BattleReplay, platform: str) -> str:
        """Generate platform-appropriate description"""
        descriptions = {
            "tiktok": f"⚔️ {replay.soul_a} vs {replay.soul_b} - EPIC BATTLE! Who you got? 👇 #soccersouls",
            "twitter": f"🔥 BATTLE HIGHLIGHTS: {replay.soul_a} takes on {replay.soul_b}! The winner: {replay.winner} 🏆 Watch the full replay! #SoccerSouls #Web3Gaming",
            "instagram": f"Epic battle between {replay.soul_a} and {replay.soul_b}! ⚽✨ The tension was unreal... Who's your pick for the next battle? 👇",
            "youtube": f"Full Battle Replay: {replay.soul_a} vs {replay.soul_b}. Watch as these Souls clash in an epic 5-round battle! Winner: {replay.winner}",
            "twitch_premiere": f"🔴 WORLD PREMIERE: {replay.soul_a} vs {replay.soul_b} - Live Battle Commentary!",
        }
        return descriptions.get(platform, descriptions["youtube"])
    
    def _generate_hashtags(self, replay: BattleReplay, platform: str) -> List[str]:
        """Generate viral hashtags"""
        base_tags = ["SoccerSouls", "Web3Gaming", "NFT", "WorldCup2026", "AI"]
        
        if platform == "tiktok":
            base_tags.extend(["fyp", "viral", "gaming", "foryou"])
        elif platform == "twitter":
            base_tags.extend(["Blockchain", "Solana", "CryptoGaming", "PlayToEarn"])
        elif platform == "instagram":
            base_tags.extend(["gaming", "football", "soccer", "nftcommunity"])
        
        return [f"#{tag}" for tag in base_tags]
    
    def _get_cta(self, platform: str) -> str:
        """Get call-to-action for platform"""
        ctas = {
            "tiktok": "Comment who you think won! 👇",
            "twitter": "Follow for more battles! ⚔️",
            "instagram": "Double tap if you love this! ❤️",
            "youtube": "Subscribe for daily battles! 🔔",
            "twitch_premiere": "Join the chat! Who's your pick? 🎮",
        }
        return ctas.get(platform, "Join Soccer Souls!")
    
    def schedule_twitch_premiere(self, battle_id: str, premiere_time: datetime) -> Dict[str, Any]:
        """
        Schedule a "Twitch Premiere" - pre-recorded battle that premieres as "live"
        This creates the excitement of live without technical complexity
        """
        replay = self.replays.get(battle_id)
        if not replay:
            return {"error": "Battle not found"}
        
        # Add to broadcast queue
        self.broadcast_queue.append(battle_id)
        
        return {
            "battle_id": battle_id,
            "premiere_time": premiere_time.isoformat(),
            "title": f"🔴 LIVE BATTLE: {replay.soul_a} vs {replay.soul_b}",
            "category": "Sports",
            "tags": ["SoccerSouls", "AIBattle", "Web3", "NFT"],
            "is_premiere": True,  # Mark as premiere, not truly live
            "estimated_viewers": int(replay.viral_potential * 1000),
            "chat_enabled": True,
            "predictions_enabled": True,
        }
    
    def get_battle_stats(self, battle_id: str) -> Dict[str, Any]:
        """Get detailed stats for a battle replay"""
        replay = self.replays.get(battle_id)
        if not replay:
            return {"error": "Battle not found"}
        
        return {
            "battle_id": battle_id,
            "total_views": random.randint(1000, 50000),  # Would be real data
            "social_shares": random.randint(50, 2000),
            "comments": random.randint(20, 500),
            "viral_score": replay.viral_potential,
            "critical_hits": sum(1 for h in replay.highlights if h.impact == "critical"),
            "total_damage": sum(h.damage for h in replay.highlights),
            "duration": replay.duration_seconds,
            "engagement_rate": round(random.uniform(0.05, 0.25), 2),
        }

# Singleton instance
broadcast_skill = LiveBroadcastSkill()
