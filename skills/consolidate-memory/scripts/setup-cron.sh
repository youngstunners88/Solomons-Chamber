#!/bin/bash
# Setup cron jobs for memory consolidation and research scouting

echo "Setting up memory system cron jobs..."

# Create cron file
cron_file="/tmp/memory-crons.txt"

# Clear existing
> "$cron_file"

# Add consolidate-memory nightly at 2 AM
echo "# Memory Consolidation - Run nightly at 2 AM" >> "$cron_file"
echo "0 2 * * * /usr/bin/python3 /home/teacherchris37/skills/consolidate-memory/scripts/consolidate.py >> /home/teacherchris37/skills/consolidate-memory/logs/cron.log 2>&1" >> "$cron_file"

# Add research-scout 3x nightly
echo "" >> "$cron_file"
echo "# Research Scout - Run 3x nightly" >> "$cron_file"
echo "0 0 * * * /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/scout.py >> /home/teacherchris37/skills/research-scout/logs/cron.log 2>&1" >> "$cron_file"
echo "0 4 * * * /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/scout.py >> /home/teacherchris37/skills/research-scout/logs/cron.log 2>&1" >> "$cron_file"
echo "0 8 * * * /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/scout.py >> /home/teacherchris37/skills/research-scout/logs/cron.log 2>&1" >> "$cron_file"

# Add weekly promotion on Sundays at 10 AM
echo "" >> "$cron_file"
echo "# Weekly Learning Promotion - Sundays at 10 AM" >> "$cron_file"
echo "0 10 * * 0 /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/promote-learnings.py >> /home/teacherchris37/skills/research-scout/logs/cron.log 2>&1" >> "$cron_file"

# Install crons
crontab "$cron_file"
rm "$cron_file"

echo "✓ Cron jobs installed:"
echo "  - consolidate-memory: Daily at 2:00 AM"
echo "  - research-scout: 3x daily at 12:00 AM, 4:00 AM, 8:00 AM"
echo "  - promote-learnings: Weekly on Sundays at 10:00 AM"
echo ""
echo "View with: crontab -l"
echo "Edit with: crontab -e"
