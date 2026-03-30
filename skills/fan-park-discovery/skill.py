"""
Fan Park Discovery Skill
Integrates NOMAD for discovering and promoting fan parks worldwide
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import math

@dataclass
class FanPark:
    id: str
    name: str
    city: str
    country: str
    stadium: str
    capacity: int
    coordinates: Dict[str, float]
    features: List[str]
    languages_supported: List[str]
    promoted_by: List[str]
    local_tips: List[str]

class FanParkDiscoverySkill:
    """Skill for discovering and promoting fan parks"""
    
    def __init__(self):
        self.fan_parks = {}
        self.load_parks()
    
    def load_parks(self):
        """Load World Cup 2026 fan parks"""
        parks = [
            FanPark(
                id="fp_nyc",
                name="NYC MetLife Fan Zone",
                city="East Rutherford",
                country="USA",
                stadium="MetLife Stadium",
                capacity=25000,
                coordinates={"lat": 40.8135, "lng": -74.0745},
                features=["Giant LED screens", "Food trucks", "Live DJ"],
                languages_supported=["en", "es", "pt", "fr", "de"],
                promoted_by=[],
                local_tips=["Take NJ Transit from Penn Station", "Arrive 3 hours early"]
            ),
            FanPark(
                id="fp_mexico",
                name="Plaza del Futbol",
                city="Mexico City",
                country="Mexico",
                stadium="Estadio Azteca",
                capacity=35000,
                coordinates={"lat": 19.3029, "lng": -99.1505},
                features=["Mariachi performances", "Traditional food", "Tequila tasting"],
                languages_supported=["es", "en", "pt"],
                promoted_by=[],
                local_tips=["Altitude is 2,200m - stay hydrated!", "Try the street tacos"]
            ),
        ]
        for park in parks:
            self.fan_parks[park.id] = park
    
    def discover(self, country: str = None) -> List[FanPark]:
        """Discover fan parks"""
        parks = list(self.fan_parks.values())
        if country:
            parks = [p for p in parks if p.country.lower() == country.lower()]
        return parks
    
    def promote(self, park_id: str, soul_id: str) -> bool:
        """Promote a park with Soul NFT"""
        park = self.fan_parks.get(park_id)
        if park and soul_id not in park.promoted_by:
            park.promoted_by.append(soul_id)
            return True
        return False

# Singleton
fan_park_skill = FanParkDiscoverySkill()
