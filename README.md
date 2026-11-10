# The Wanderer's Rest

A browser-based 3D tavern management game. Recruit adventurers, send them on quests, upgrade your tavern, and grow your reputation from a humble roadside inn to a legendary guild hall.

**[Play it live →](https://montrelvo.github.io/Tavern-Tycoon/)**

[Original Replit project](https://replit.com/@jaw1014/Tavern-Tycoon)

---

## Gameplay

Adventurers wander into your tavern looking for work. Recruit them, assign them to quests from the Quest Board, and collect gold when they return victorious. Use that gold to upgrade your tavern and unlock new capabilities.

### Adventurer Classes

Each class has a passive bonus on matching quest types:

| Class   | Bonus                        |
|---------|------------------------------|
| Warrior | +3 power on Beast quests     |
| Mage    | +3 power on Arcane quests    |
| Rogue   | +3 power on Stealth quests   |
| Healer  | +2 power on all quests       |

Adventurers earn XP from completed quests and can level up to level 5, improving their HP, attack, and defense stats. Spend upgrade points to further customize each adventurer's stats.

### Prestige Classes

Once an adventurer reaches elite level, you can prestige them into a powerful specialization:

| Base Class | Prestige Class |
|------------|---------------|
| Warrior    | Knight        |
| Mage       | Archmage      |
| Rogue      | Shadowblade   |
| Healer     | Warden        |

### Quests

Three quests are available on the Quest Board at a time. Each quest has a type (Beast, Arcane, Stealth, or Combat), a power requirement, a gold reward, and a duration. Match your adventurers to quest types for the best results.

### Tavern Upgrades

Spend gold to upgrade your tavern and unlock new features:

- **Cook** — improves adventurer recovery and bonuses
- **Bard** — draws more adventurers to the tavern
- **Roster Slots** — expand how many adventurers you can keep on retainer
- **Rooms** — increases the number of active adventurers
- **Basement** — unlocks material storage (herbs, ore, relics)
- **Training Grounds** — boosts adventurer leveling
- **Enchanter** — enables gear crafting from collected materials
- **Guild Hall** — the pinnacle upgrade; unlocks the prestige system

### Tavern Prestige

Your tavern earns prestige as you complete quests. Higher prestige attracts stronger adventurers and unlocks better quests.

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm --filter @workspace/3d-game run dev
```

Then open `http://localhost:5173` in your browser.

---

## Tech Stack

- **React** + **TypeScript**
- **Babylon.js** renders the tavern and owner's room by default. Options also offers the existing Three.js renderers.
- **Vite** for bundling
- **Tailwind CSS** + **Radix UI** for the HUD and menus
- Deployed via **GitHub Actions** to **GitHub Pages**
