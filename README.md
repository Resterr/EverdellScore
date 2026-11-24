# EverdellScore
Serverless JS App for counting Everdell Score.

> **Fork notice.** This is a modified fork of [tadeaustria/EverdellScore](https://github.com/tadeaustria/EverdellScore)
> by Tade Barthler, distributed under the [GNU GPL-3.0](LICENSE), like the original.
> Changes in this fork (v2.0.0, 2026):
> * new default **category scoring mode** (`index.html`): points are entered per category for all players at once,
>   totals and ranking (with ties) are always visible, state is kept in the browser (localStorage);
> * **1–6 players** in both modes (the card mode moved to `cards.html`);
> * player names (any language, incl. Polish characters) shared by both modes;
> * English is the default language when no language was chosen before; all six languages are kept
>   (the choice is remembered in the browser).

## Category scoring mode (fork)
Pick the number of players (1–6), enter names and enable expansions in *Game settings*. Then type the points of each
category in one row for all players; **Enter** jumps to the next field (next player, then next category).
Use the **±** button for negative values (e.g. the Fool, −2) on phones whose numeric keyboard has no minus key.
*Pearls* are entered as a count and scored ×2. *New game* clears the points and keeps names, player count and expansions.

| Category | Expansion |
|---|---|
| Traveler / Production / Destination / Governance / Prosperity cards, prosperity bonuses, point tokens, journey, special events, other | base game |
| Basic events | base game (hidden with Pearlbrook, same rule as the card mode) |
| Garland award | Bellfaire |
| Pearls (×2), wonders, adornments | Pearlbrook |
| Expeditions, discoveries | Spirecrest |
| Visitors | Newleaf |

Cards of Mistwood, Glimmergold, Kindergarten and legendary cards are counted in the card colour categories.

## Running locally
Translations are loaded over HTTP, so opening the file directly (`file://`) does not work. Run a static server
in the repository folder, e.g. `python -m http.server 8000`, and open <http://localhost:8000/>.
There is no build step; GitHub Pages can publish the repository root of the `main` branch as it is.

## Content
As the summing up the total points of a game of Everdell can be complex, this application should help players to identify the winner of the game faster.
It allows you to choose all the cards per player and will give the sum up the total points per player. Special effects of prosperity cards are determined automatically, while for some Special Event cards a manual input must be done.
The application also prevents that cards are multiple chosen, if not allowed (e.g. unique cards or number of cards).

## Personal Data
Cookies for storing the chosen language. The category mode stores names and points in the browser's localStorage only.

# Updates

## Version 2.0.0 (fork)
* Category scoring mode (new start page), card mode moved to `cards.html`
* 1–6 players in both modes, shared player names
* English default language (choice remembered); new texts translated in all six languages
* Handlebars pinned to 4.7.8, broken icon link and obsolete appcache attribute fixed
* Google Analytics of the original site removed (no tracking in this fork)

## Version 1.6.2
* More spanish translations
  * Glimmergold

### Version 1.6.1
* Bugfixes
  * Occupancy of legendary Silver Scale Spring
  * Automatic caluclation of Special Event Flying Doctor Service

### Version 1.6.0
* New Miniexpansions
  * Kindergarden
  * Glimmergold
* Mistwood
  * Fixes legendary cards, such they can always be added
  * Photographer is not allowed to copy legendary cards

### Version 1.5.5
* New language
  * Portuguese Brasil

### Version 1.5.4
* Newleaf
  * Spanish

### Version 1.5.3
* General
  * Always display left over ressources
* Pearlbrook
  * Fix Messenger occupancy
* Newleaf
  * Polish
* Mistwood
  * Polish

### Version 1.5.2
* General
  * Dutch language for basic support (thanks to Jack Guo)

### Version 1.5.1
* Mistwood
  * Fix Corrin the king, to count only 1 town
  * Fix Strey Samt to be destination type

### Version 1.5.0
* General
  * Added google analytics for collecting data to improve app
* Mistwood
  * New town cards
  * Playerskills - pigs

### Version 1.4.0
* General
  * Increased additional points to 50. (30 was not enough for Newleaf)
  * Added kind icons to cards in town
* Bellfaire
  * Hide basic events if Pearlbrook is active
* Newleaf
  * New town cards
  * New basic events
  * New special events
  * Visitors

### Version 1.3.4
* General
  * Spanish support for base game. Thanks to Camilo.
  * Added warnings when data could be lost. Leave page, reset or expansion activation.
  * Fix Wife being addable to full town see [issue 23](../../issues/23)
* Bellfaire
  * Fix Garlandawards see [issue 19](../../issues/19)

### Version 1.3.3
* General
  * Sort town cards by translated name

### Version 1.3.2
* General 
  * Type ordering of players town cards matches now with type order in menu bar
  * Left over resources have now own counting badge
  * Fix issue that left over resources was not displayed although *Architect* was in town, if a *Garland Award* was active
  * Fix miner mole points
* Spirecrest 
  * Added missing discoveries _Serpent's Pass_ and _The Distant Shore_
* Pearlbrook
  * Fix points of *Hopewatchgate*

### Version 1.3.1
* Improved english text. Thanks to [Dajakk](https://github.com/Dajakk)
* Fix _Hopewatch Trail_ to count journey points.
* Changed _Bellsong City_ according to [The Everdell Archive](https://cdn.shopify.com/s/files/1/0559/8245/6947/files/The_Everdell_Archive_web_res.pdf) from The Complete Collection.

### Version 1.3
* Spirecrest extension
* Coloring of cards when in players town
* Changed sort of cards in players town by type and name
* Mobile QoL improved
  * Smaller blocks to better fit on mobile
  * Sliders effect immediately for easier input
  
### Version 1.2
* Pearlbrook extension
* Remember language on refresh
  
### Version 1.1 
* Bellfaire extension
* Vibration feedback on choosing cards on phone
   
### Version 1.0
* Basegame