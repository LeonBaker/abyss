

async function scrollIntoView(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    
    if (!isVisible) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
        });
        await sleep(500);
    }
}

class PlayerTable {
    static sortAllies = sortFunction('faction', 'value');

    public playerId: number;

    private hand: LineStock<AbyssAlly>;
    private affiliatedStocks: LineStock<AbyssAlly>[] = [];
    private freeLords: LineStock<AbyssLord>;
    private locations: LineStock<AbyssLocation>;
    private currentPlayer: boolean;

    constructor(private game: AbyssGame, player: AbyssPlayer) {
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();

        let template = `
        <div id="player-panel-${player.id}" class="player-panel whiteblock">
            <h3 class="player-name" style="color: #${player.color};" data-color="${player.color}">${player.name}</h3>
            ${this.currentPlayer ? `<div id="player-hand" class="hand"><i id="no-hand-msg">${_("No Allies in hand")}</i></div>` : ''}
            <h4>${_("Affiliated Allies")}</h4>
            <i id="no-affiliated-msg-p${player.id}">${_("No Affiliated Allies")}</i>
            <div id="player-panel-${player.id}-affiliated" class="affiliated"></div>
            <h4>${_("Lords")}</h4>
            <i id="no-lords-msg-p${player.id}">${_("No Lords")}</i>
            <div id="player-panel-${player.id}-free-lords" class="free-lords"></div>
            <div id="player-panel-${player.id}-locations" class="locations"></div>
            <div id="player-panel-${player.id}-sentinels" class="sentinels"></div>
        </div>
        `;
        
        dojo.place(template, $('player-panel-holder'));
        
        // Add a whiteblock for the player
        if (this.currentPlayer) {
            this.hand = new LineStock<AbyssAlly>(this.game.allyManager, document.getElementById('player-hand'), {
                center: false,
                sort: PlayerTable.sortAllies,
            });
            this.hand.onCardClick = card => this.game.onClickPlayerHand(card);
            this.hand.addCards(player.hand);
        }
        
        // Add player affiliated
        this.placeAffiliated(player.affiliated, this.playerId);
        
        // Add free lords
        this.freeLords = new LineStock<AbyssLord>(this.game.lordManager, document.getElementById(`player-panel-${player.id}-free-lords`), {
            center: false,
        });
        this.freeLords.onCardClick = card => this.game.onClickPlayerFreeLord(card);
        this.freeLords.addCards(player.lords.filter(lord => lord.location == null));
        
        // Add locations
        this.locations = new LineStock<AbyssLocation>(this.game.locationManager, document.getElementById(`player-panel-${player.id}-locations`), {
            center: false,
        });
        this.locations.onCardClick = card => this.game.onClickPlayerLocation(card);
        player.locations.forEach(location => this.addLocation(location, player.lords.filter(lord => lord.location == location.location_id), true, true));

        this.game.lordManager.updateLordKeys(this.playerId, this);
        
        // Add active lords panel
        this.setupActiveLordsPanel(player.lords);
    }
    
    public addHandAlly(ally: AbyssAlly, fromElement?: HTMLElement, originalSide?, rotationDelta?: number) {
        this.hand.addCard(ally, {
            fromElement,
            originalSide,
            rotationDelta,
        });

        this.game.organisePanelMessages();
    }
    
    public removeAllies(allies: AbyssAlly[]) {
        this.hand?.removeCards(allies);
        this.affiliatedStocks.forEach(stock => stock.removeCards(allies));
    }
    
    public getSelectedAllies() {
        return (this.hand?.getCards() ?? []).filter(card => this.game.allyManager.getCardElement(card)?.classList.contains('selected'));
    }
    
    public organisePanelMessages() {
        // Do they have any Lords?
        const lords = dojo.query('.lord', $('player-panel-' + this.playerId));
        $('no-lords-msg-p' + this.playerId).style.display = lords.length > 0 ? 'none' : 'block';
        
        // Affiliated?
        const affiliated = this.getAffiliatedAllies();
        $('no-affiliated-msg-p' + this.playerId).style.display = affiliated.length > 0 ? 'none' : 'block';
        
        if (this.currentPlayer) {
            // Hand?
            const hand = this.hand.getCards();
            $('no-hand-msg').style.display = hand.length > 0 ? 'none' : 'block';
        }
    }

    private placeAffiliated(allies: AbyssAlly[], playerId: number) {
      let parent = document.getElementById(`player-panel-${playerId}-affiliated`);
      for (var faction=0; faction < 5; faction++) {
        let factionHolder = dojo.create("div");
        factionHolder.className = "affiliated-faction";
        factionHolder.setAttribute("data-faction", faction);
        dojo.place(factionHolder, parent);

        this.affiliatedStocks[faction] = new LineStock<AbyssAlly>(this.game.allyManager, factionHolder, {
            center: false,
            sort: PlayerTable.sortAllies,
        });
        this.affiliatedStocks[faction].addCards(allies.filter(ally => ally.faction == faction));
        this.affiliatedStocks[faction].onCardClick = ally => this.affiliatedAllyClick(ally);
      }
      return parent;
    }

    public addAffiliated(ally: AbyssAlly) {
        this.affiliatedStocks[ally.faction].addCard(ally);
    }
    
    public addLord(lord: AbyssLord) {
        this.freeLords.addCard(lord);
    }
    
    public removeLords(lords: AbyssLord[]) {
        this.freeLords.removeCards(lords);
    }

    private getAffiliatedAllies() {
        let affiliated = [];

        for (var faction=0; faction < 5; faction++) {
            affiliated.push(...this.affiliatedStocks[faction].getCards());
        }

        return affiliated;
    }
    
    public addLocation(location: AbyssLocation, lords: AbyssLord[], init: boolean, add_lords) {

        this.locations.addCard(location).then(animated => {
            // if loot location, scroll to it
            if (animated && !init && [103, 104, 105, 106].includes(location.location_id)) {
                const element = this.game.locationManager.getCardElement(location);
                scrollIntoView(element);
            }
        });

        if(add_lords == null || add_lords){
            this.game.locationManager.addLords(location.location_id, lords);
        }
    }
    
    private affiliatedAllyClick(ally: AbyssAlly): void {
        if ((this.game as any).gamedatas.gamestate.name === 'lord114multi') {
            this.game.discardAllies([ally.ally_id]);
        }
    }

    public getFreeLords(includeDisabled = false): AbyssLord[] {
        let lords = this.freeLords.getCards();

        if (!includeDisabled) {
            lords = lords.filter(lord => !this.freeLords.getCardElement(lord).classList.contains('disabled'));
        }

        return lords;
    }

    public hasLord(lordId: number, includeDisabled = false): boolean {
        return this.getFreeLords(includeDisabled).some(lord => lord.lord_id == lordId);
    }
    
    public removeLocation(location: AbyssLocation) {
        this.locations.removeCard(location);
        this.game.locationManager.removeLordsOnLocation(location);
    }

    public getHand() {
        return this.hand;
    }

    public setupActiveLordsPanel(lords: AbyssLord[]) {
        // Create the active lords panel HTML
        let activeLordsContainer = document.getElementById(`player-panel-${this.playerId}-active-lords`);
        if (!activeLordsContainer) {
            // If the container doesn't exist, create it dynamically
            const playerPanel = document.getElementById(`player-panel-${this.playerId}`);
            const sentinelsSection = playerPanel.querySelector('.sentinels');
            
                    // Create the active lords section
        const activeLordsSection = dojo.create("div");
        const title = _("Active Powers");
        activeLordsSection.innerHTML = "<h4>" + title + "</h4>" +
            "<div id=\"player-panel-" + this.playerId + "-active-lords\" class=\"active-lords\"></div>";
        
        // Insert after the sentinels section
        sentinelsSection.parentNode.insertBefore(activeLordsSection, sentinelsSection.nextSibling);
        activeLordsContainer = document.getElementById(`player-panel-${this.playerId}-active-lords`);
        }
        
        // Get active lords (lords that are free, have special effects, and are not disabled)
        const activeLords = lords.filter(lord => 
            lord.location == null && 
            this.isSpecialLord(lord.lord_id) && 
            !this.freeLords.getCardElement(lord).classList.contains('disabled')
        );
        
        // Hide the entire section if there are no active lords
        const activeLordsSection = activeLordsContainer.parentNode as HTMLElement;
        if (activeLords.length === 0) {
            activeLordsSection.style.display = 'none';
            return;
        }
        
        // Show the section and clear existing content
        activeLordsSection.style.display = 'block';
        activeLordsContainer.innerHTML = '';
        
        // Create a simple display for the current player's active lords
        activeLords.forEach(lord => {
            const lordElement = dojo.create("div");
            lordElement.className = "active-lord-item";
            
            const lordIcon = dojo.create("i");
            lordIcon.className = "icon icon-lord";
            lordIcon.style.color = this.getLordFactionColor(lord.lord_id);
            lordElement.appendChild(lordIcon);
            
                         const lordText = dojo.create("span");
             lordText.innerHTML = " " + _(lord.desc);
             lordElement.appendChild(lordText);
            
            activeLordsContainer.appendChild(lordElement);
        });
    }
    
    private isSpecialLord(lordId: number): boolean {
        // List of lords that have special effects when active
        const specialLordIds = [1, 5, 6, 8, 11, 12, 14, 17, 18, 20, 21, 24, 25, 26, 101, 102, 103, 105, 106, 107, 108, 109, 111, 113, 115, 201, 203, 205, 207, 209];
        return specialLordIds.includes(lordId);
    }
    
    private getLordFactionColor(lordId: number): string {
        // Map lord IDs to faction colors
        const lordFactions: { [id: number]: string } = {
            1: "purple", 5: "red", 6: "#999900", 8: "green", 11: "blue",
            12: "purple", 14: "red", 17: "#999900", 18: "green", 20: "blue",
            21: "purple", 24: "red", 25: "#999900", 26: "green",
            101: "darkgray", 102: "darkgray", 103: "darkgray", 105: "darkgray",
            106: "darkgray", 107: "darkgray", 108: "darkgray", 109: "darkgray",
            111: "darkgray", 113: "darkgray", 115: "darkgray",
            201: "purple", 203: "red", 205: "green", 207: "blue", 209: "#999900"
        };
        return lordFactions[lordId] || "black";
    }
    
    private getLordEffectText(lordId: number): string {
        // Map lord IDs to their effect descriptions
        const lordEffects: { [id: number]: string } = {
            1: _("Costs are increased by 2 for all other players"),
            5: _("All other players cannot hold more than 6 allies"),
            6: _("All other players earn the previous monster track reward"),
            8: _("Gain 1 pearl for each different race sent to the council"),
            11: _("Gain 1 pearl at the start of your turn"),
            12: _("Can discard 1 ally for 2 pearls each turn"),
            14: _("Protected by all military lords"),
            17: _("May discard 1 stack from the council each turn"),
            18: _("Adds to 2 stacks when taking from the council"),
            20: _("May affiliate the ally of choice"),
            21: _("May replace a lord each turn"),
            24: _("May recruit with any race (respecting the number required)"),
            25: _("Pays 2 less to recruit"),
            26: _("May replace a lord in the court each turn"),
            101: _("May replace 1 nebuli with a pearl each turn"),
            102: _("May use 2 nebulis when purchasing"),
            103: _("May use nebulis when purchasing even if they still have pearls"),
            105: _("Does not receive nebuli for kraken allies at the end of the game"),
            106: _("Can place their sentinel token on a free area"),
            107: _("Can place their sentinel token on a free area"),
            108: _("Can place their sentinel token on a free area"),
            109: _("Gains 1 pearl each time a lord is recruited"),
            111: _("Can purchase 2 allies"),
            113: _("Takes 1 pearl each time a player gains 2 or more"),
            115: _("Can add a lord to a free space in the court each turn"),
            201: _("If you slay a Leviathan, you can fight a second one"),
            203: _("Earn 2 Pearls for each Health point you remove from a Leviathan"),
            205: _("When you fight a Leviathan, use an Ally of the Race of your choice"),
            207: _("Win 1 extra Monster token for each Health point you remove from a Leviathan"),
            209: _("You can choose to ignore Monsters revealed during your Exploration, the cards are discarded")
        };
        return lordEffects[lordId] || _("Unknown effect");
    }
}