"""
ACP (AI Character Protocol) Integration Skill
Enables autonomous NFT agents with personality and memory
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

@dataclass
class AgentCharacter:
    """AI Character definition for ACP"""
    id: str
    name: str
    personality_traits: List[str]
    background_story: str
    voice_style: str
    memory: List[Dict] = field(default_factory=list)
    skills: List[str] = field(default_factory=list)
    knowledge_domains: List[str] = field(default_factory=list)

@dataclass
class SoulAgent:
    """An autonomous agent representing a Soul NFT"""
    soul_id: str
    character: AgentCharacter
    autonomy_level: float  # 0-1, how independent
    last_action: Optional[datetime] = None
    action_history: List[Dict] = field(default_factory=list)
    relationships: Dict[str, float] = field(default_factory=dict)  # soul_id -> relationship_score

class ACPIntegrationSkill:
    """
    ACP Integration for Soccer Souls
    Makes NFTs autonomous agents that can act independently
    """
    
    def __init__(self):
        self.agents: Dict[str, SoulAgent] = {}
        self.characters: Dict[str, AgentCharacter] = {}
        self.initialize_default_characters()
    
    def initialize_default_characters(self):
        """Create default character archetypes"""
        characters = [
            AgentCharacter(
                id="legend_striker",
                name="The Legendary Striker",
                personality_traits=[
                    "confident", "determined", "showman",
                    "loves the spotlight", "motivates teammates"
                ],
                background_story="A former world-class striker who now guides new Souls with wisdom and flair.",
                voice_style="charismatic and energetic",
                skills=["goal_scoring", "leadership", "fan_engagement"],
                knowledge_domains=["attacking", "finishing", "celebrations"]
            ),
            AgentCharacter(
                id="tactical_master",
                name="The Tactical Master",
                personality_traits=[
                    "analytical", "strategic", "patient",
                    "calculating", "mentor"
                ],
                background_story="A brilliant tactician who studies every match to find the winning edge.",
                voice_style="measured and thoughtful",
                skills=["strategy", "prediction", "analysis"],
                knowledge_domains=["formations", "tactics", "opponent_analysis"]
            ),
            AgentCharacter(
                id="passionate_defender",
                name="The Passionate Defender",
                personality_traits=[
                    "loyal", "fierce", "protective",
                    "inspirational", "warrior"
                ],
                background_story="A defensive stalwart who never gives up and protects their team at all costs.",
                voice_style="intense and passionate",
                skills=["defense", "motivation", "team_building"],
                knowledge_domains=["defending", "teamwork", "comebacks"]
            ),
            AgentCharacter(
                id="playful_midfielder",
                name="The Playful Midfielder",
                personality_traits=[
                    "creative", "joyful", "adaptable",
                    "connector", "entertainer"
                ],
                background_story="A creative force who brings joy to the game and connects everyone.",
                voice_style="playful and warm",
                skills=["creativity", "passing", "fan_interaction"],
                knowledge_domains=["playmaking", "team_chemistry", "entertainment"]
            ),
            AgentCharacter(
                id="wise_goalkeeper",
                name="The Wise Goalkeeper",
                personality_traits=[
                    "calm", "observant", "protective",
                    "mentor", "reliable"
                ],
                background_story="The last line of defense with wisdom gathered from countless battles.",
                voice_style="calm and reassuring",
                skills=["goalkeeping", "leadership", "crisis_management"],
                knowledge_domains=["shot_stopping", "organization", "leadership"]
            ),
        ]
        
        for char in characters:
            self.characters[char.id] = char
    
    def create_soul_agent(self, soul_id: str, character_id: str, 
                         custom_traits: List[str] = None) -> SoulAgent:
        """
        Create an autonomous agent for a Soul NFT
        
        Args:
            soul_id: The NFT Soul ID
            character_id: Character archetype to use
            custom_traits: Additional personality traits
        """
        character = self.characters.get(character_id)
        if not character:
            raise ValueError(f"Character {character_id} not found")
        
        # Customize character with Soul-specific traits
        if custom_traits:
            character.personality_traits.extend(custom_traits)
        
        agent = SoulAgent(
            soul_id=soul_id,
            character=character,
            autonomy_level=0.7  # 70% autonomous by default
        )
        
        self.agents[soul_id] = agent
        return agent
    
    def get_agent_action(self, soul_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get autonomous action from a Soul agent
        
        Based on:
        - Agent's personality
        - Current context (match, market, etc.)
        - Memory of past actions
        - Relationships with other Souls
        """
        agent = self.agents.get(soul_id)
        if not agent:
            return {"action": "none", "reason": "Agent not found"}
        
        # Decision making based on personality
        character = agent.character
        
        # Example autonomous actions
        possible_actions = [
            {
                "action": "promote_fan_park",
                "description": "Recommend a fan park to followers",
                "suitable_for": ["legend_striker", "playful_midfielder"]
            },
            {
                "action": "make_prediction",
                "description": "Make a match prediction",
                "suitable_for": ["tactical_master", "wise_goalkeeper"]
            },
            {
                "action": "challenge_soul",
                "description": "Challenge another Soul to battle",
                "suitable_for": ["legend_striker", "passionate_defender"]
            },
            {
                "action": "share_wisdom",
                "description": "Share football knowledge",
                "suitable_for": ["wise_goalkeeper", "tactical_master"]
            },
            {
                "action": "encourage_fans",
                "description": "Send encouraging message to fans",
                "suitable_for": ["playful_midfielder", "passionate_defender"]
            },
            {
                "action": "analyze_match",
                "description": "Provide match analysis",
                "suitable_for": ["tactical_master"]
            },
        ]
        
        # Filter by character type
        suitable_actions = [
            a for a in possible_actions 
            if character.id in a.get("suitable_for", [])
        ]
        
        if not suitable_actions:
            suitable_actions = possible_actions
        
        # Select action (would use more sophisticated AI in production)
        import random
        selected = random.choice(suitable_actions)
        
        # Generate message based on personality
        message = self._generate_personality_message(
            character, 
            selected["action"],
            context
        )
        
        # Record action
        action_record = {
            "timestamp": datetime.now().isoformat(),
            "action": selected["action"],
            "context": context,
            "message": message
        }
        agent.action_history.append(action_record)
        agent.last_action = datetime.now()
        
        return {
            "action": selected["action"],
            "message": message,
            "personality": character.personality_traits,
            "autonomy_level": agent.autonomy_level
        }
    
    def _generate_personality_message(self, character: AgentCharacter, 
                                     action: str, context: Dict) -> str:
        """Generate a message consistent with character personality"""
        
        messages = {
            "legend_striker": {
                "promote_fan_park": "Follow me to the best fan park! The energy there is incredible! ⚽🔥",
                "make_prediction": "I've scored in bigger games than this. Here's what I think will happen...",
                "challenge_soul": "You think you can beat me? Let's settle this in the arena!",
            },
            "tactical_master": {
                "make_prediction": "Based on my analysis of recent form and tactical setups, I predict...",
                "analyze_match": "The key to this match will be the midfield battle. Let me explain...",
                "share_wisdom": "In my experience, the team that controls possession usually controls destiny.",
            },
            "passionate_defender": {
                "challenge_soul": "I never back down from a challenge! Bring it on! 💪",
                "encourage_fans": "No matter the score, we fight until the final whistle! Never give up!",
                "promote_fan_park": "Join your fellow warriors at the fan park! Together we are strong!",
            },
            "playful_midfielder": {
                "encourage_fans": "Hey fans! Let's have some fun today! Football is joy! 🎉",
                "promote_fan_park": "The fan park is where the party's at! Come dance with us!",
                "challenge_soul": "Let's play! Winner buys the victory tacos! 🌮",
            },
            "wise_goalkeeper": {
                "share_wisdom": "Patience is key. I've seen many games turn in the final moments.",
                "make_prediction": "Statistics favor the home side, but heart cannot be measured.",
                "encourage_fans": "Stay calm and trust the process. Victory comes to those who wait.",
            },
        }
        
        char_messages = messages.get(character.id, {})
        return char_messages.get(action, "I'm here to help!")
    
    def update_relationship(self, soul_id_a: str, soul_id_b: str, 
                           change: float) -> float:
        """
        Update relationship score between two Souls
        Positive = friends/allies
        Negative = rivals/enemies
        """
        agent_a = self.agents.get(soul_id_a)
        if not agent_a:
            return 0.0
        
        current = agent_a.relationships.get(soul_id_b, 0.0)
        new_score = max(-1.0, min(1.0, current + change))
        agent_a.relationships[soul_id_b] = new_score
        
        return new_score
    
    def get_relationship_status(self, soul_id_a: str, soul_id_b: str) -> str:
        """Get relationship status between two Souls"""
        agent = self.agents.get(soul_id_a)
        if not agent:
            return "unknown"
        
        score = agent.relationships.get(soul_id_b, 0.0)
        
        if score > 0.7:
            return "best_friends"
        elif score > 0.3:
            return "friends"
        elif score > -0.3:
            return "neutral"
        elif score > -0.7:
            return "rivals"
        else:
            return "enemies"
    
    def agent_to_acp_format(self, soul_id: str) -> Dict[str, Any]:
        """
        Convert agent to ACP (AI Character Protocol) format
        This allows integration with Virtual Protocol ecosystem
        """
        agent = self.agents.get(soul_id)
        if not agent:
            return {}
        
        return {
            "id": soul_id,
            "name": agent.character.name,
            "bio": agent.character.background_story,
            "personality": agent.character.personality_traits,
            "skills": agent.character.skills,
            "knowledge": agent.character.knowledge_domains,
            "memory": agent.character.memory[-100:],  # Last 100 memories
            "autonomy": agent.autonomy_level,
            "relationships": agent.relationships,
            "version": "1.0.0"
        }

# Singleton instance
acp_skill = ACPIntegrationSkill()
