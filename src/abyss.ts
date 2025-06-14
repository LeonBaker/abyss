const isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
const log = isDebug ? console.log.bind(window.console) : function () { };

declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const __;
declare const g_gamethemeurl;

let debounce;

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
const LOCAL_STORAGE_ZOOM_KEY = 'Abyss-zoom';

class Abyss implements AbyssGame {
    public animationManager: AnimationManager;
    public allyManager: AllyManager;
    public lordManager: LordManager;
    public lootManager: LootManager;
    public locationManager: LocationManager;
    public monsterManager: MonsterManager;
    public leviathanManager: LeviathanManager;

    private gamedatas: AbyssGamedatas;
    private zoomManager: ZoomManager;
    private playersTables: PlayerTable[] = [];
    private lastExploreTime: number;
    private leviathanBoard: LeviathanBoard;
    private visibleAllies: SlotStock<AbyssAlly>;
    private councilStacks: VoidStock<AbyssAlly>[] = [];
    private visibleLords: SlotStock<AbyssLord>;
    private visibleLocations: LineStock<AbyssLocation>;
    private visibleLocationsOverflow: LineStock<AbyssLocation>;
    private monsterTokens: LineStock<AbyssMonster>[] = [];
    private allyDiscardCounter: Counter;
    private pearlCounters: Counter[] = [];
    private nebulisCounters: Counter[] = [];
    public keyTokenCounts: number[] = [];
    public keyFreeLordsCounts: number[] = [];
    private keyCounters: Counter[] = [];
    private monsterCounters: Counter[] = [];
    private allyCounters: Counter[] = [];
    private lordCounters: Counter[] = [];
    private woundCounters: Counter[] = [];
    private defeatedLeviathanCounters: Counter[] = [];
    
    private TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;

    constructor() {
    }

    setup(gamedatas: AbyssGamedatas) {
        log( "Starting game setup" );
        
        if (!gamedatas.krakenExpansion) {
            (this as any).dontPreloadImage(`kraken.png`);
            (this as any).dontPreloadImage(`lords-kraken.jpg`);
            (this as any).dontPreloadImage(`loots.jpg`);
        }
        if (!gamedatas.leviathanExpansion) {
            (this as any).dontPreloadImage(`scourge.png`);
            (this as any).dontPreloadImage(`lords-leviathan.jpg`);
            (this as any).dontPreloadImage(`icons-leviathan.png`);
            (this as any).dontPreloadImage(`icons-leviathan.png`);
            (this as any).dontPreloadImage(`allies-leviathan.jpg`);
            (this as any).dontPreloadImage(`leviathans.jpg`);
            (this as any).dontPreloadImage(`leviathan-die.png`);
        }
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        this.animationManager = new AnimationManager(this);
        this.allyManager = new AllyManager(this);
        this.lordManager = new LordManager(this);
        this.lootManager = new LootManager(this);
        this.locationManager = new LocationManager(this, this.lordManager, this.lootManager);
        this.monsterManager = new MonsterManager(this);
        this.leviathanManager = new LeviathanManager(this);

        if (gamedatas.leviathanExpansion) {
            this.leviathanBoard = new LeviathanBoard(this, gamedatas);
        } else {
            document.getElementById('leviathan-board')?.remove();
        }
        
        dojo.connect($('modified-layout-checkbox'), 'onchange', () => {
            dojo.toggleClass($('game-board-holder'), "playmat", $('modified-layout-checkbox').checked);
        });

        const usePlaymat = (this as any).prefs[100].value == 1 ;   
        // On resize, fit cards to screen (debounced)
        if (usePlaymat) {
            dojo.addClass($('game-board-holder'), "playmat");
            const leviathanBoardLeftWrapper = document.getElementById('leviathan-board-left-wrapper');
            leviathanBoardLeftWrapper.style.position = 'absolute';
            leviathanBoardLeftWrapper.style.left = '-210px';
        }

        const onResize = () => {
            const w = document.getElementById('bga-zoom-wrapper')?.clientWidth / (this.zoomManager?.zoom ?? 1);

            if (gamedatas.leviathanExpansion) {
                const leviathanBoard = document.getElementById('leviathan-board');
                const leviathanBoardLeftWrapper = document.getElementById('leviathan-board-left-wrapper');
                const leviathanBoardBottomWrapper = document.getElementById('leviathan-board-bottom-wrapper');

                const minWidth = 1340 + 210;
                if (w > minWidth && leviathanBoard.parentElement != leviathanBoardLeftWrapper) {
                    leviathanBoardLeftWrapper.appendChild(leviathanBoard);
                    document.getElementById('game-board-holder').style.marginLeft = '210px';
                } else if (w < minWidth && leviathanBoard.parentElement != leviathanBoardBottomWrapper) {
                    leviathanBoardBottomWrapper.appendChild(leviathanBoard);
                    document.getElementById('game-board-holder').style.marginLeft = '0px';
                }
            }

            if (usePlaymat) {
                const narrowPlaymat = w < 1340;
                dojo.toggleClass($('game-board-holder'), "playmat", !narrowPlaymat);
                dojo.toggleClass($('game-board-holder'), "playmat-narrow", narrowPlaymat);
            }
            this.organiseLocations();
        };

        dojo.connect(window, "onresize", debounce(() => onResize(), 200));

        if (gamedatas.krakenExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', `
                <tr id="scoring-row-nebulis">
                    <td class="first-column"><span class="arrow">→</span><i id="scoring-nebulis-icon" class="icon icon-nebulis"></i></td>
                </tr>
                <tr id="scoring-row-kraken">
                    <td class="first-column"><span class="arrow">→</span><i id="scoring-kraken-icon" class="icon-kraken"></i></td>
                </tr>
            `);
        }
        if (gamedatas.leviathanExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', `
                <tr id="scoring-row-wound">
                    <td class="first-column"><span class="arrow">→</span><i id="scoring-wound-icon" class="icon leviathan-icon icon-wound"></i></td>
                </tr>
                <tr id="scoring-row-scourge">
                    <td class="first-column"><span class="arrow">→</span><i id="scoring-scourge-icon" class="icon-scourge"></i></td>
                </tr>
            `);
        }
        
        // Setting up player boards
        this.createPlayerPanels(gamedatas);
        
        // Add an extra column at the end, just for padding reasons
        $('scoring-row-players').innerHTML += `<td></td>`;
        
        $('scoring-row-location').innerHTML += `<td></td>`;
        $('scoring-row-lord').innerHTML += `<td></td>`;
        $('scoring-row-affiliated').innerHTML += `<td></td>`;
        $('scoring-row-monster').innerHTML += `<td></td>`;

        if (gamedatas.krakenExpansion) {
            $('scoring-row-nebulis').innerHTML += `<td></td>`;
            $('scoring-row-kraken').innerHTML += `<td></td>`;  
        }
        if (gamedatas.leviathanExpansion) {
            $('scoring-row-wound').innerHTML += `<td></td>`;
            $('scoring-row-scourge').innerHTML += `<td></td>`;  
        }
        
        $('scoring-row-total').innerHTML += `<td></td>`;

        var p = (this as any).player_id;
        if ((this as any).isSpectator) {
            p = gamedatas.playerorder[0];
        }
        let players_done = {};
        do {
            if (players_done[p]) break;
            players_done[p] = 1;
            const player = gamedatas.players[p];

            const table = new PlayerTable(this, player);
            this.playersTables.push(table);

            p = gamedatas.turn_order[p];
        } while (p != (this as any).player_id);

        // Lords
        this.visibleLords = new SlotStock<AbyssLord>(this.lordManager, document.getElementById('visible-lords-stock'), {
            slotsIds: [1,2,3,4,5,6],
            mapCardToSlot: lord => lord.place,
        });
        this.visibleLords.addCards(gamedatas.lord_slots);
        this.visibleLords.onCardClick = lord => this.onVisibleLordClick(lord);

        // Allies
        this.visibleAllies = new SlotStock<AbyssAlly>(this.allyManager, document.getElementById('visible-allies-stock'), {
            slotsIds: [1,2,3,4,5],
            mapCardToSlot: ally => ally.place,
        });
        this.visibleAllies.addCards(gamedatas.ally_explore_slots);
        this.visibleAllies.onCardClick = ally => this.onVisibleAllyClick(ally);
        
        for ( var i in gamedatas.ally_council_slots ) {
            var num = gamedatas.ally_council_slots[i];
            var deck = dojo.query('#council-track .slot-' + i);
            this.setDeckSize(deck, num);
            this.councilStacks[i] = new VoidStock<AbyssAlly>(this.allyManager, deck[0]);
        }
        this.setDeckSize(dojo.query('#lords-track .slot-0'), gamedatas.lord_deck);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), gamedatas.ally_deck);

        // Threat level
        var threat_token = $('threat-token');
        dojo.removeClass(threat_token, "slot-0 slot-1 slot-2 slot-3 slot-4 slot-5");
        dojo.addClass(threat_token, "slot-" + gamedatas.threat_level);

        // Locations
        this.visibleLocations = new LineStock<AbyssLocation>(this.locationManager, document.getElementById('visible-locations-stock'), {
            center: false,
            direction: 'column',
        });
        this.visibleLocations.addCards(gamedatas.location_available);
        this.visibleLocations.onCardClick = location => this.onVisibleLocationClick(location);
        this.visibleLocationsOverflow = new LineStock<AbyssLocation>(this.locationManager, document.getElementById('locations-holder-overflow'));
        this.visibleLocationsOverflow.onCardClick = location => this.onVisibleLocationClick(location);
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), gamedatas.location_deck);

        // Clickers
        document.getElementById('explore-track-deck').addEventListener('click', e => this.onClickExploreDeck(e));
        document.getElementById('council-track').addEventListener('click', e => this.onClickCouncilTrack(e));

        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //this.setTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        let pearlTooltip = _('Pearls');
        if (gamedatas.krakenExpansion) {
            pearlTooltip += ' / ' + _('Nebulis');
        }
        this.setTooltipToClass('pearl-holder', pearlTooltip);
        this.setTooltipToClass( 'monster-holder', _( 'Monster tokens' ));
        
        this.setTooltipToClass( 'ally-holder', _( 'Ally cards in hand' ));
        this.setTooltipToClass( 'lordcount-holder', _( 'Number of Lords' ));
        this.setTooltipToClass('leviathan-holder', _('Wounds / Defeated Leviathans'));
        
        this.setTooltip( 'scoring-location-icon', _( 'Locations' ));
        this.setTooltip( 'scoring-lords-icon', _( 'Lords' ));
        this.setTooltip( 'scoring-affiliated-icon', _( 'Affiliated Allies' ));
        this.setTooltip( 'scoring-monster-tokens-icon', _( 'Monster tokens' ));

        if (gamedatas.krakenExpansion) {
            this.setTooltip('scoring-nebulis-icon', _( 'Nebulis' ));
            this.setTooltip('scoring-kraken-icon', _( 'Kraken' ));
        }
        if (gamedatas.leviathanExpansion) {
            this.setTooltip('scoring-wound-icon', _( 'Wounds' ));
            this.setTooltip('scoring-scourge-icon', _( 'Scourge' ));
        }
        
        // Localisation of options box
        $('option-desc').innerHTML = _('Set Ally cards to automatically pass on');
        $('faction-desc').innerHTML = _('Ally cards in hand');
        $('option-all').innerHTML = _('All');
        $('option-jellyfish').innerHTML = _('Jellyfish');
        $('option-crab').innerHTML = _('Crab');
        $('option-seahorse').innerHTML = _('Seahorse');
        $('option-shellfish').innerHTML = _('Shellfish');
        $('option-squid').innerHTML = _('Squid');
        $('option-kraken').innerHTML = _('Kraken');
        $('text-value').innerHTML = _('Value');
        $('text-cards').innerHTML = _('Cards');
        $('last-round').innerHTML = _('This is the last round of the game!');

         //Show kraken autopass
        if (gamedatas.krakenExpansion) {
            const krakenInputs = document.getElementById('kraken-inputs');
            if (krakenInputs) {
                krakenInputs.classList.remove('hide-row');
            }

            const krakenFaction = document.getElementById('kraken-faction');
            if (krakenFaction) {
                krakenFaction.classList.remove('hide-row');
            }
        }
        // Only show auto-pass and card options for actual players
        if (! (this as any).isSpectator) {
            // $('gameplay-options').style.display = this.bRealtime ? 'none' : 'inline-block';
            $('gameplay-options').style.display = 'inline-block';
            $('faction-panel').style.display = 'inline-block';
        }
        
        // Only show the game end warning if it's the end of the game!
        $('page-title').appendChild($('last-round'));
        if (gamedatas.game_ending_player >= 0) {
            // $('gameplay-options').style.display = this.bRealtime ? 'none' : 'inline-block';
            dojo.style($('last-round'), { 'display': 'block' });
        }

        this.gamedatas.sentinels?.filter(sentinel => sentinel.playerId).forEach(sentinel => this.placeSentinelToken(sentinel.playerId, sentinel.lordId, sentinel.location, sentinel.locationArg));

        // Insert options into option box
        let me = gamedatas.players[(this as any).player_id];
        if (me) {
            if (! me.autopass) {
                me.autopass = "0;0;0;0;0;0";
            }
            if (me.autopass) {
                let pieces: any[] = me.autopass.split(";");
                if (pieces.length > 6) {
                    pieces = [0, 0, 0, 0, 0, 0];
                }
                if (pieces.length >= 5) {
                    let firstValue = +pieces[0];
                    let allSame = true;
                    for (let i = 0; i < 6; i++) {
                        let max = +pieces[i];
                        if (max != firstValue) {
                            allSame = false;
                        }
                        for (let j = 0; j <= max; j++) {
                            $('autopass-'+i+'-'+j).checked = true;
                        }
                    }
                    if (allSame) {
                        $('autopass-all-'+firstValue).checked = true;
                    }
                }
            }
            
            for (let faction = 0; faction < 6; faction++) {
                for (let i = 0; i <= 5; i++) {   
                    dojo.connect($('autopass-'+faction+'-'+i), 'onclick', () => {
                    // Check only up to this
                    for (let j = 0; j <= 5; j++) {
                        $('autopass-all-'+j).checked = false;
                        $('autopass-'+faction+'-'+j).checked = j <= i;
                    }
                    this.onUpdateAutopass();
                    });
                }
            }
            
            for (let i = 0; i <= 5; i++) {   
                dojo.connect($('autopass-all-'+i), 'onclick', () => {
                    // Check only this one
                    for (let j = 0; j <= 5; j++) {
                        $('autopass-all-'+j).checked = i == j;
                    }
                    for (let faction = 0; faction < 6; faction++) {
                        for (let j = 0; j <= 5; j++) {
                            $('autopass-'+faction+'-'+j).checked = j <= i;
                        }
                    }
                    this.onUpdateAutopass();
                });
            }
        }

        this.allyDiscardCounter = new ebg.counter();
        this.allyDiscardCounter.create(`ally-discard-size`);
        this.allyDiscardCounter.setValue(gamedatas.allyDiscardSize);

        if (gamedatas.leviathanExpansion) {
            document.getElementById('threat-track').style.display = 'none';
        }
        
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();

        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            zoomLevels: ZOOM_LEVELS,
            zoomControls: {
                color: 'white',
            },
            smooth: false,
            onZoomChange: () => onResize(),
            //onDimensionsChange: () => this.onTableCenterSizeChange(),
        });

        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState(stateName: string, args: any) {
        log('onEnteringState', stateName, args.args);

        // Remove all current move indicators
        dojo.query('.card-current-move').removeClass('card-current-move');
        if ((this as any).isCurrentPlayerActive()) {
            if( (this as any).checkPossibleActions( 'explore' ) ) {
                dojo.query('#explore-track-deck').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'exploreTake' ) || (this as any).checkPossibleActions( 'purchase' ) ) {
                for (let i = 5; i >= 1; i--) {
                    const qr = dojo.query(`#visible-allies-stock [data-slot-id="${i}"] .ally`);
                    if (qr.length > 0) {
                        qr.addClass('card-current-move');
                        break;
                    }
                }
            }
            if (this.gamedatas.gamestate.name == 'placeKraken') {
                this.allyManager.getCardElement(args.args.ally).classList.add('card-current-move');
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'requestSupport' ) ) {
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if( (this as any).checkPossibleActions( 'recruit' ) ) {
                // If affordableLords given, then highlight only affordable lords
                if (args.args && args.args._private && args.args._private.affordableLords) {
                    args.args._private.affordableLords?.forEach(lord => {
                        const div = this.lordManager.getCardElement(lord);
                        div.classList.add('card-current-move')
                    });
                } else {
                    dojo.query('#lords-track .lord:not(.lord-back)').addClass('card-current-move');
                }
            }
            if( (this as any).checkPossibleActions( 'chooseLocation' ) && stateName != 'locationEffectBlackSmokers' ) {
                dojo.query('#locations-holder .location:not(.location-back)').addClass('card-current-move');
                dojo.query('#locations-holder-overflow .location:not(.location-back)').addClass('card-current-move');
            }
        }

        this.updateFactionPanelFromHand();

        switch( stateName ) {
            case 'revealMonsterToken':
            case 'chooseRevealReward':
                if ((this as any).isCurrentPlayerActive()) {
                    document.getElementById(`monster-hand_p${this.getPlayerId()}`).classList.add("clickable");
                }
                break;
            case 'recruitPay':
                this.onEnteringRecruitPay(args.args);
                break;
            case 'lord7':
                this.onEnteringLord7();
                break;
            case 'controlPostDraw':
                this.onEnteringControlPostDraw(args.args);
                // then do entering control code
            case 'control':
                this.onEnteringControl(args.args);
                break;
            case 'locationEffectBlackSmokers':
                this.onEnteringLocationEffectBlackSmokers(args.args);
                break;
            case 'purchase': case 'explore': case 'explore2': case 'explore3':
                this.onEnteringPurchaseExplore(args.args);
                break;
            case 'lord112':
                this.onEnteringLord112(args.args);
                break;
            case 'lord114multi':
                this.onEnteringLord114multi(args.args);
                break;
            case 'lord116':
                this.onEnteringLord116(args.args);
                break;
            case 'lord208':
                this.onEnteringLord208(args.args);
                break;
            case 'lord210':
                this.onEnteringLord210(args.args);
                break;
            case 'placeSentinel':
                this.onEnteringPlaceSentinel(args.args);
                break;
            case 'chooseLeviathanToFight':
                this.onEnteringChooseLeviathanToFight(args.args);
                break;
            case 'chooseAllyToFight':
                this.onEnteringChooseAllyToFight(args.args);
                break;
        }
    }

    private onEnteringRecruitPay(args: EnteringRecruitPayArgs) {
        // highlight the given lord
        this.lordManager.getCardElement(args.lord)?.classList.add('selected');
    }

    private onEnteringLord7() {
        // Put a red border around the player monster tokens (who aren't me)
        if ((this as any).isCurrentPlayerActive()) {
            for( var player_id in this.gamedatas.players ) {
                if (player_id != (this as any).player_id) {
                    if (this.gamedatas.leviathanExpansion) {
                        document.getElementById(`monster-hand_p${player_id}`).classList.add("clickable");
                    } else {
                        dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
                    }
                }
            }
        }
    }

    private onEnteringLord112(args: EnteringLord112Args) {
        if ((this as any).isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            const stock = new LineStock<AbyssAlly>(this.allyManager, document.getElementById(`ally-discard`));
            stock.addCards(args.allies);
            args.allies.filter(ally => ally.faction === null).forEach(monster => this.allyManager.getCardElement(monster)?.classList.add('disabled'));
            stock.onCardClick = ally => this.takeAllyFromDiscard(ally.ally_id);
        }
    }

    private onEnteringLord114multi(args: any) {
        // Put a border around selectable allies
        if ((this as any).isCurrentPlayerActive()) {
            Array.from(document.querySelectorAll(`.affiliated .ally[data-faction="${args.faction}"]`)).forEach(elem => elem.classList.add('card-current-move'));
        }
    }

    private onEnteringLord116(args: EnteringLord116Args) {
        // Put a green border around selectable lords
        if ((this as any).isCurrentPlayerActive()) {
            args.lords.forEach(lord => 
                this.lordManager.getCardElement(lord).classList.add('selectable')
            );
        }
    }

    private onEnteringLord208(args: any) {
        // Put a green border around selectable lords
        if ((this as any).isCurrentPlayerActive()) {
            this.leviathanBoard.setAllSelectableLeviathans();
        }
    }

    private onEnteringLord210(args: any) {
        //this.leviathanBoard.newLeviathan(args.leviathan);

        args.freeSlots.forEach((slot: number) => 
            document.querySelector(`#leviathan-board [data-slot-id="${slot}"]`).classList.add('selectable')
        );
    }

    private onEnteringPlaceSentinel(args: EnteringPlaceSentinelArgs) {
        // Put a green border around selectable lords
        if ((this as any).isCurrentPlayerActive()) {
            console.log(args);
            if (args.possibleOnLords) {
                this.visibleLords.getCards().forEach(lord => this.lordManager.getCardElement(lord).classList.add('card-current-move'));
            }
            if (args.possibleOnCouncil) {
                [0,1,2,3,4].forEach(faction => document.getElementById(`council-track-${faction}`).classList.add('card-current-move'));
            }
            if (args.possibleOnLocations) {
                [
                    ...this.visibleLocations.getCards(),
                    ...this.visibleLocationsOverflow.getCards(),
                ].forEach(location => this.locationManager.getCardElement(location).classList.add('card-current-move'));
            }
        }
    }

    private onEnteringControlPostDraw(args: EnteringControlPostDrawArgs) {
        // Fade out the locations you can't buy
        if ((this as any).isCurrentPlayerActive()) {
            dojo.query("#locations-holder .location:not(.location-back)").addClass("unavailable");
            dojo.query("#locations-holder-overflow .location:not(.location-back)").addClass("unavailable");

            args.location_ids.forEach(location_id => 
                    this.locationManager.getCardElement({ location_id } as AbyssLocation).classList.remove('unavailable')
            );
        }
    }

    private onEnteringControl(args: EnteringControlPostDrawArgs) {
        dojo.query(".free-lords .lord").removeClass("selected");
        args.default_lord_ids.forEach(lord_id => this.lordManager.getCardElement({ lord_id } as AbyssLord).classList.add('selected'));
    }

    private onEnteringLocationEffectBlackSmokers(args: EnteringLocationEffectBlackSmokersArgs) {
        // Draw all the locations in a div at the top. Register to each an onclick to select it.
        if ((this as any).isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            const stock = new LineStock<AbyssLocation>(this.locationManager, document.getElementById(`ally-discard`), {
                direction: 'column',
            });
            stock.addCards(args._private.locations);
            stock.onCardClick = location => this.onVisibleLocationClick(location);
        }
    }

    private onEnteringPurchaseExplore(args: EnteringPurchaseArgs) {
        // Disable players who have passed
        (this as any).enableAllPlayerPanels();
        for( var iPlayer in args.passed_players ) {
            (this as any).disablePlayerPanel( args.passed_players[iPlayer] );
        }
        
        // Underline the first player
        let first_player = args.first_player;
        dojo.query('a', $('player_name_' + first_player)).style('text-decoration', 'underline');
    }

    private onEnteringChooseLeviathanToFight(args: EnteringChooseLeviathanToFightArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.leviathanBoard.setSelectableLeviathans(args.selectableLeviathans);
        }
    }

    private onEnteringChooseAllyToFight(args: EnteringChooseAllyToFightArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().getHand().setSelectionMode('single', args.selectableAllies);
        }
    }

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    onLeavingState(stateName: string) {
        log('onLeavingState', stateName);
        
        $('game-extra').innerHTML = '';
        dojo.style($('game-extra'), "display", "none");

        switch( stateName ) {
            case 'revealMonsterToken':
            case 'chooseRevealReward':
                document.querySelectorAll(`.monster-hand.clickable`).forEach(elem => elem.classList.remove("clickable"));
                break;
            case 'recruitPay':
                dojo.query("#lords-track .lord").removeClass("selected");
                dojo.query("#player-hand .ally").removeClass("selected");
                break;
            case 'lord7':
                // Put a red border around the player monster tokens (who aren't me)
                if (this.gamedatas.leviathanExpansion) {
                    document.querySelectorAll(`.monster-hand.clickable`).forEach(elem => elem.classList.remove("clickable"));
                } else {
                    dojo.query(".cp_board .icon.icon-monster").removeClass("clickable");
                }
                break;
            case 'controlPostDraw': case 'control':
                dojo.query("#locations-holder .location").removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location").removeClass("unavailable");
            case 'lord19': case 'lord19b':
                dojo.query(".free-lords .lord").removeClass("selected");
                break;
            case 'purchase': case 'explore': case 'explore2': case 'explore3':
                (this as any).enableAllPlayerPanels();
                dojo.query('.player-name a').style('text-decoration', '');
                break;
            case 'lord116':
                this.onLeavingLord116();
                break;
            case 'chooseLeviathanToFight':
            case 'lord208':
                this.onLeavingChooseLeviathanToFight();
                break;
            case 'lord210':
                this.onLeavingLord210();
                break;
            case 'chooseAllyToFight':
                this.onLeavingChooseAllyToFight();
                break;
        }
    }

    private onLeavingLord116() {
        dojo.query(`.lord.selectable`).removeClass('selectable');
    }

    private onLeavingLord210() {
        document.querySelectorAll(`#leviathan-board .slot.selectable`).forEach(elem => elem.classList.remove('selectable'));
    }

    private onLeavingChooseLeviathanToFight() {
        if ((this as any).isCurrentPlayerActive()) {
            this.leviathanBoard.setSelectableLeviathans(null);
        }
    }

    private onLeavingChooseAllyToFight() {
        if ((this as any).isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().getHand().setSelectionMode('none');
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const args = {
            you: '<span style="font-weight:bold;color:#'+this.getPlayerColor(this.getPlayerId())+';">'+__('lang_mainsite','You')+'</span>',
            ...this.gamedatas.gamestate.args,
        };
        $('pagemaintitletext').innerHTML = this.format_string_recursive(_(this.gamedatas.gamestate['descriptionmyturn'+property]), args);
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons(stateName: string, args: any) {
        //log('onUpdateActionButtons', stateName, args);

        if ((this as any).isCurrentPlayerActive() && ["plotAtCourt", "action", "secondStack", "explore", "explore2", "explore3", "chooseMonsterReward", "recruitPay", "affiliate", "cleanupDiscard", "controlPostDraw", "unusedLords"].includes(stateName)) {
            dojo.query("#player-panel-"+(this as any).player_id+" .free-lords .lord").forEach(node => {
                // unused, and unturned...
                var used = +dojo.attr(node, "data-used");
                var turned = +dojo.attr(node, "data-turned");
                var effect = +dojo.attr(node, "data-effect");

                if (! used && ! turned && effect == 3) {
                    dojo.addClass(node, "unused");
                }
            });
        } else {
            dojo.query(".lord").removeClass("unused");
        }

        if( (this as any).isCurrentPlayerActive() ) {
            switch( stateName ) {
                case 'revealMonsterToken':
                case 'chooseRevealReward':
                    (this as any).addActionButton(`actEndRevealReward-button`, _('End reveal'), () => (this as any).bgaPerformAction('actEndRevealReward'));
                    break;
                case 'purchase':
                    const purchageArgs = args as EnteringPurchaseArgs;
                    const cost = purchageArgs.cost;
                    (this as any).addActionButton('button_purchase', _('Purchase') + ` (${cost} <i class="icon icon-pearl"></i>)`, () => this.onPurchase(0));
                    if (!purchageArgs.canPayWithPearls) {
                        document.getElementById('button_purchase').classList.add('disabled');
                    }
                    if (purchageArgs.withNebulis) {
                        Object.keys(purchageArgs.withNebulis).forEach(i => {
                            (this as any).addActionButton(`button_purchase_with${i}Nebulis`, _('Purchase') + ` (${ cost - Number(i) > 0 ? `${cost - Number(i)} <i class="icon icon-pearl"></i> ` : ''}${i} <i class="icon icon-nebulis"></i>)`, event => this.onPurchase(Number(i)));
                            if (!purchageArgs.withNebulis[i]) {
                                document.getElementById(`button_purchase_with${i}Nebulis`).classList.add('disabled');
                            }
                        });
                    }
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
                    break;
                case 'explore':
                    const exploreArgs = args as EnteringExploreArgs;
                    if (exploreArgs.monster && this.gamedatas.leviathanExpansion) {
                        (this as any).addActionButton('button_fightMonster', _('Fight the Monster'), () => this.exploreTake(exploreArgs.ally.place));
                        if (exploreArgs.canIgnore) {
                            (this as any).addActionButton('button_ignoreMonster', _('Ignore the Monster'), () => (this as any).bgaPerformAction('actIgnoreMonster'));
                        }
                        (this as any).addActionButton('button_keepExploring', _('Keep exploring'), () => this.exploreDeck(), null, null, 'red');
                    }
                    break;
                case 'explore3':
                    const explore3Args = args as EnteringExploreArgs;
                    if (explore3Args.monster && this.gamedatas.leviathanExpansion && explore3Args.canIgnore) {
                        (this as any).addActionButton('button_fightMonster', _('Fight the Monster'), () => this.exploreTake(5));
                        (this as any).addActionButton('button_ignoreMonster', _('Ignore the Monster'), () => (this as any).bgaPerformAction('actIgnoreMonster'));
                    }
                    break;
                case 'chooseMonsterReward':
                    for (var i in args.rewards) {
                        var r: string = args.rewards[i];
                        r = r.replace(/K/g, "<i class=\"icon icon-key\"></i>");
                        r = r.replace(/P/g, "<i class=\"icon icon-pearl\"></i>");
                        r = r.replace(/M/g, "<i class=\"icon icon-monster\"></i>");
                        (this as any).addActionButton( 'button_reward_' + i, r, 'onChooseMonsterReward' );
                    }
                    break;
                case 'recruitPay':
                    const recruitArgs = args as EnteringRecruitPayArgs;
                    (this as any).addActionButton( 'button_recruit', _('Recruit'), () => this.onRecruit(0));

                    if (recruitArgs.withNebulis) {
                        Object.keys(recruitArgs.withNebulis).forEach(i => {
                            (this as any).addActionButton(`button_recruit_with${i}Nebulis`, _('Recruit') + ` (${ args.cost - Number(i) > 0 ? `${args.cost - Number(i)} <i class="icon icon-pearl"></i> ` : ''}${i} <i class="icon icon-nebulis"></i>)`, () => this.onRecruit(Number(i)));
                        });
                    }
                    this.updateRecruitButtonsState(recruitArgs);

                    (this as any).addActionButton( 'button_pass', _('Cancel'), event => this.onPass(event));
                    break;
                case 'affiliate':
                    for (var i in args.allies) {
                        var ally = args.allies[i];
                        var r: string = ally.value + ' ' + this.allyManager.allyNameText(ally.faction);
                        var btnId = 'button_affiliate_' + ally.ally_id;
                        (this as any).addActionButton( btnId, r, 'onChooseAffiliate' );
                        dojo.addClass($(btnId), 'affiliate-button');
                    }
                    //(this as any).addActionButton('cancelRecruit_button', _('Cancel'), () => this.cancelRecruit(), null, null, 'gray');
                    break;
                case 'plotAtCourt':
                    (this as any).addActionButton( 'button_plot', _('Plot') + ` (1 <i class="icon icon-pearl"></i>)`, 'onPlot' );
                    if (args.canPlaceSentinel) {
                        (this as any).addActionButton( 'button_place_sentinel', _('Place sentinel'), () => this.goToPlaceSentinel());
                    }
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
                    break;
                case 'action':
                    if (args.canPlaceSentinel) {
                        (this as any).addActionButton( 'button_place_sentinel', _('Place sentinel'), () => this.goToPlaceSentinel());
                    }
                    break;
                case 'lord23': case 'lord26': case 'locationEffectBlackSmokers': case 'lord19': case 'lord22': case 'lord19b': case 'unusedLords':
                    (this as any).addActionButton( 'button_pass', _('Pass'), 'onPass' );
                    break;
                case 'lord12': case 'lord17': case 'lord21':
                    (this as any).addActionButton( 'button_pass', _('Cancel'), 'onPass' );
                    break;
                case 'lord2': case 'lord5': case 'cleanupDiscard': case 'postpurchaseDiscard':
                    (this as any).addActionButton( 'button_discard', _('Discard'), 'onDiscard' );
                    break;
                case 'lord7':
                    if (!this.gamedatas.leviathanExpansion) {
                        // Put a red border around the player monster tokens (who aren't me)
                        for( var player_id in this.gamedatas.players ) {
                            const playerId = Number(player_id);
                            if (playerId != this.getPlayerId()) {
                                var num_tokens = this.monsterCounters[playerId].getValue();
                                if (num_tokens > 0) {
                                    (this as any).addActionButton(`button_steal_monster_token_${playerId}`, this.gamedatas.players[playerId].name, () => this.onClickMonsterIcon(playerId));
                                    document.getElementById(`button_steal_monster_token_${playerId}`).style.border = `3px solid #${this.gamedatas.players[playerId].color}`;
                                }
                            }
                        }
                    }
                    break;
                case 'control':
                    var s = _('Draw ${n}');
                    let location_deck = dojo.query('.location.location-back')[0];
                    let location_deck_size = +dojo.attr(location_deck, 'data-size');
                    for (let i = 1; i <= 4; i++) {
                        if (location_deck_size < i) continue;
                        (this as any).addActionButton( 'button_draw_' + i, dojo.string.substitute( s, {n: i} ), 'onDrawLocation' );
                    }
                    break;
                case 'martialLaw':
                    const martialLawArgs = args as EnteringMartialLawArgs;
                    if (martialLawArgs?.diff > 0) {
                        (this as any).addActionButton('button_discard', _('Discard selected allies'), () => this.onDiscard());

                        var ally_ids = [];
                        dojo.query("#player-hand .ally.selected").forEach(node => 
                            ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                        );
                        if (!ally_ids.length) {
                            document.getElementById('button_discard').classList.add('disabled');
                        }

                        (this as any).addActionButton('button_payMartialLaw', _('Pay') + ` ${martialLawArgs.diff} <i class="icon icon-pearl"></i>`, () => this.payMartialLaw());
                        if (!martialLawArgs.canPay) {
                            document.getElementById('button_payMartialLaw').classList.add('disabled');
                        }
                    }
                    break;
                case 'fillSanctuary':
                    (this as any).addActionButton('button_continue', _('Continue searching'), () => this.searchSanctuary());
                    (this as any).addActionButton('button_stop', _('Stop searching'), () => this.stopSanctuarySearch());
                    break;
                case 'lord104':
                    const lord104Args = args as EnteringLord104Args;   
                    if (lord104Args.nebulis == 1) {   
                        lord104Args.playersIds.forEach(playerId => {
                            const player = this.getPlayer(playerId);
                            (this as any).addActionButton(`giveNebulisTo${playerId}-button`, player.name, () => this.giveNebulisTo([playerId]));
                            document.getElementById(`giveNebulisTo${playerId}-button`).style.border = `3px solid #${player.color}`;
                        });
                    } else {
                        lord104Args.playersIds.forEach(playerId => {
                            lord104Args.playersIds.filter(secondPlayerId => secondPlayerId != playerId).forEach(secondPlayerId => {
                                const player = this.getPlayer(playerId);
                                const secondPlayer = this.getPlayer(secondPlayerId);
                                if (!document.getElementById(`giveNebulisTo${playerId}-${secondPlayerId}-button`) && !document.getElementById(`giveNebulisTo${secondPlayerId}-${playerId}-button`)) {
                                    (this as any).addActionButton(`giveNebulisTo${playerId}-${secondPlayerId}-button`, _('${player_name} and ${player_name2}').replace('${player_name}', player.name).replace('${player_name2}', secondPlayer.name), () => this.giveNebulisTo([playerId, secondPlayerId]));
                                }
                            });
                        });
                    }
                    break;                
                case 'lord112':
                    if (args.canPass) {
                        (this as any).statusBar.addActionButton(_('Pass') + ` (${_('No ally in the discard')})`, () => (this as any).bgaPerformAction('actPassTakeAllyFromDiscard'));
                    }
                    break;
                case 'lord114':
                    for (let i = 0; i < 5; i++) {
                        (this as any).addActionButton(`selectAllyRace${i}`, this.allyManager.allyNameText(i), () => this.selectAllyRace(i));
                        document.getElementById(`selectAllyRace${i}`).classList.add('affiliate-button');
                    }
                    break;
                case 'giveKraken':
                    const giveKrakenArgs = args as EnteringGiveKrakenArgs;      
                    giveKrakenArgs.playersIds.forEach(playerId => {
                        const player = this.getPlayer(playerId);
                        (this as any).addActionButton(`giveKraken${playerId}-button`, player.name, () => this.giveKraken(playerId));
                        document.getElementById(`giveKraken${playerId}-button`).style.border = `3px solid #${player.color}`;
                    });
                    break;
                case 'increaseAttackPower':
                    const increaseAttackPowerArgs = args as EnteringIncreaseAttackPowerArgs; 
                    if (increaseAttackPowerArgs.payPearlEffect) {
                        for (let i = 1; i <= increaseAttackPowerArgs.playerPearls; i++) {
                            (this as any).addActionButton(`increaseAttackPower${i}-button`, _("Increase to ${newPower}").replace('${newPower}', (increaseAttackPowerArgs.attackPower + i) + ` (${i} <i class="icon icon-pearl"></i>)`), () => (this as any).bgaPerformAction('actIncreaseAttackPower', { amount: i }), null, null, i > 0 && !increaseAttackPowerArgs.interestingChoice.includes(i) ? 'gray' : undefined);
                        }
                        (this as any).addActionButton(`increaseAttackPower0-button`, _("Don't increase attack power"), () => (this as any).bgaPerformAction('actIncreaseAttackPower', { amount: 0 }));
                    }
                    break;
                case 'chooseFightReward':
                    const chooseFightRewardArgs = args as EnteringChooseFightRewardArgs; 
                    for (let i = 0; i <= chooseFightRewardArgs.rewards; i++) {
                        const base = chooseFightRewardArgs.rewards - i;
                        const expansion = i;
                        let html = [];
                        if (base > 0) {
                            html.push(`${base} <div class="icon icon-monster"></div>`); 
                        }
                        if (expansion > 0) {
                            html.push(`${expansion} <div class="icon icon-monster-leviathan"></div>`); 
                        }
                        (this as any).addActionButton(`actChooseFightReward${i}-button`, html.join(' '), () => (this as any).bgaPerformAction('actChooseFightReward', { base, expansion }));
                    }
                    break;
                case 'chooseFightAgain':
                    (this as any).addActionButton(`actFightAgain-button`, _('Fight again'), () => (this as any).bgaPerformAction('actFightAgain'));
                    if (!args.canFightAgain) {
                        document.getElementById(`actFightAgain-button`).classList.add('disabled');
                    }
                    (this as any).addActionButton(`actEndFight-button`, _('End turn'), () => (this as any).bgaPerformAction('actEndFight'));
                    break;

                case 'chooseAllyToFight':
                    if (!args.selectableAllies.length) {
                        (this as any).addActionButton(`actEndFightDebug-button`, _('End turn'), () => (this as any).bgaPerformAction('actEndFightDebug'));
                    }
                    break;
                case 'lord202':
                    const lord202Args = args as EnteringLord104Args;   
                    lord202Args.playersIds.forEach(playerId => {
                        const player = this.getPlayer(playerId);
                        (this as any).addActionButton(`actChooseOpponentToRevealLeviathan${playerId}-button`, player.name, () => (this as any).bgaPerformAction('actChooseOpponentToRevealLeviathan', { opponentId: playerId }));
                        document.getElementById(`actChooseOpponentToRevealLeviathan${playerId}-button`).style.border = `3px solid #${player.color}`;
                    });
                    break;
                case 'lord206':
                    (this as any).addActionButton(`actFightImmediately-button`, _('Fight immediatly'), () => (this as any).bgaPerformAction('actFightImmediately'));
                    (this as any).addActionButton(`actIgnoreImmediatelyFightLeviathan-button`, _("Don't fight"), () => (this as any).bgaPerformAction('actIgnoreImmediatelyFightLeviathan'));
                    if (!args.canUse) {
                        document.getElementById(`actFightImmediately-button`).classList.add('disabled');
                    }
                    break;
                case 'applyLeviathanDamage':
                    switch (args.penalty) {
                        case 3: 
                            this.setGamestateDescription('Allies');
                            (this as any).addActionButton('button_discard', _('Discard selected allies'), () => {
                                var ally_ids = [];
                                dojo.query("#player-hand .ally.selected").forEach(node => 
                                    ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                                );
                                (this as any).bgaPerformAction('actDiscardAlliesLeviathanDamage', { ids: ally_ids.join(',') });
                            });
                            document.getElementById('button_discard').classList.add('disabled');
                            break;
                        case 4: 
                            this.setGamestateDescription('Lord');
                            break;
                    }
                    break;
            }
        }
    }

    ///////////////////////////////////////////////////
    //// Utility methods

    public setTooltip(id: string | HTMLElement, html: string) {
        (this as any).addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    }
    public setTooltipToClass(className: string, html: string) {
        (this as any).addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    public getOpponentsIds(playerId: number): number[] {
        return Object.keys(this.gamedatas.players).map(id => Number(id)).filter(id => id != playerId);
    }

    private getPlayer(playerId: number): AbyssPlayer {
        return Object.values(this.gamedatas.players).find(player => Number(player.id) == playerId);
    }

    public getPlayerColor(playerId: number): string {
        return this.gamedatas.players[playerId].color;
    }

    public getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    public getCurrentPlayerTable(): PlayerTable | null {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }
    
    public organisePanelMessages() {
        this.playersTables.forEach(playerTable => playerTable.organisePanelMessages());
    }

    private setDeckSize(deck /*dojo query result*/, num: number) {
        deck.removeClass("deck-empty deck-low deck-medium deck-full");
        if (num == 0) {
            deck.addClass("deck-empty");
        } else if (num <= 2) {
            deck.addClass("deck-low");
        } else if (num <= 5) {
            deck.addClass("deck-medium");
        } else {
            deck.addClass("deck-full");
        }

        // Set deck-size data
        deck.attr("data-size", num);

        // If it's a council stack, then add tooltip
        for (let i = 0; i < deck.length; i++) {
            var node = deck[i];
            let deckSize = dojo.query('.deck-size', node);
            if (deckSize.length > 0) {
                let n = deckSize[0];
                n.innerHTML = num > 0 ? num : "";
            }
        }
    }

    private createPlayerPanels(gamedatas: AbyssGamedatas) {
        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);

            // Setting up players boards if needed
            var player_board_div = $('player_board_'+playerId);
            let html = `
            <div id="cp_board_p${player.id}" class="cp_board" data-player-id="${player.id}">
                <div class="counters">
                    <span class="pearl-holder" id="pearl-holder_p${player.id}">
                        <i class="icon icon-pearl"></i>
                        <span id="pearlcount_p${player.id}"></span>`;

            if (gamedatas.krakenExpansion) {
                html += `<i class="icon icon-nebulis margin-left"></i>
                    <span id="nebuliscount_p${player.id}"></span>`;
            }

            html += `
            </span>
                    <span class="key-holder" id="key-holder_p${player.id}">
                        <i class="icon icon-key"></i>
                        <span id="keycount_p${player.id}">${player.keys}</span>
                    </span>
                    <span class="monster-holder" id="monster-holder_p${player.id}">
                        <i id="icon-monster_p${player.id}" class="icon icon-monster"></i>
                        <span id="monstercount_p${player.id}"></span>
                    </span>
                </div>
                <div class="counters">
                    <span class="ally-holder" id="ally-holder_p${player.id}">
                        <i class="icon icon-ally"></i>
                        <span id="allycount_p${player.id}"></span>
                    </span>
                    <span>
                        <span class="lordcount-holder" id="lordcount-holder_p${player.id}">
                            <i class="icon icon-lord"></i>
                            <span id="lordcount_p${player.id}"></span>
                        </span>
                    </span>
                `;
                    

            if (gamedatas.leviathanExpansion) {
                html += `
                    <span class="leviathan-holder" id="leviathan-holder_p${player.id}">
                        <i class="icon leviathan-icon icon-wound"></i>
                        <span id="woundcount_p${player.id}"></span>
                        <i class="icon leviathan-icon icon-defeated-leviathan margin-left"></i>
                        <span id="defeatedleviathancount_p${player.id}"></span>
                    </span>
                `;
            }
            html += `
            </div>
                <div class="monster-hand" id="monster-hand_p${player.id}"></div>
            </div>`;
            dojo.place( html, player_board_div );

            if (!gamedatas.leviathanExpansion) {
                document.getElementById(`icon-monster_p${playerId}`).addEventListener('click', () => this.onClickMonsterIcon(playerId));
            }

            this.pearlCounters[playerId] = new ebg.counter();
            this.pearlCounters[playerId].create(`pearlcount_p${player.id}`);
            this.pearlCounters[playerId].setValue(player.pearls);
            if (gamedatas.krakenExpansion) {
                this.nebulisCounters[playerId] = new ebg.counter();
                this.nebulisCounters[playerId].create(`nebuliscount_p${player.id}`);
                this.nebulisCounters[playerId].setValue(player.nebulis);
            }

            this.keyTokenCounts[playerId] = Number(player.keys);
            this.keyFreeLordsCounts[playerId] = 0;
            this.keyCounters[playerId] = new ebg.counter();
            this.keyCounters[playerId].create(`keycount_p${player.id}`);
            this.updateKeyCounter(playerId);
            this.monsterCounters[playerId] = new ebg.counter();
            this.monsterCounters[playerId].create(`monstercount_p${player.id}`);
            this.monsterCounters[playerId].setValue(player.num_monsters);
            this.allyCounters[playerId] = new ebg.counter();
            this.allyCounters[playerId].create(`allycount_p${player.id}`);
            this.allyCounters[playerId].setValue(player.hand_size);
            this.lordCounters[playerId] = new ebg.counter();
            this.lordCounters[playerId].create(`lordcount_p${player.id}`);
            this.lordCounters[playerId].setValue(player.lords.length);

            if (gamedatas.leviathanExpansion) {
                this.woundCounters[playerId] = new ebg.counter();
                this.woundCounters[playerId].create(`woundcount_p${player.id}`);
                this.woundCounters[playerId].setValue(player.wounds);
                this.defeatedLeviathanCounters[playerId] = new ebg.counter();
                this.defeatedLeviathanCounters[playerId].create(`defeatedleviathancount_p${player.id}`);
                this.defeatedLeviathanCounters[playerId].setValue(player.defeatedLeviathans);
            }

            this.monsterTokens[playerId] = new LineStock<AbyssMonster>(this.monsterManager, document.getElementById('monster-hand_p' + playerId), {
                center: false,
                gap: '2px',
            });
            this.monsterTokens[playerId].onCardClick = card => this.onClickMonsterIcon(playerId, card);

            player.monsters?.forEach(monster => 
                this.monsterTokens[playerId].addCards(player.monsters, undefined, {
                    visible: !!(monster.value || monster.effect)
                })
            );
            

            // kraken & scourge tokens
            dojo.place(`<div id="player_board_${player.id}_figurinesWrapper" class="figurinesWrapper"></div>`, `player_board_${player.id}`);

            if (gamedatas.kraken == playerId) {
                this.placeFigurineToken(playerId, 'kraken');
            }
            if (gamedatas.scourge == playerId) {
                this.placeFigurineToken(playerId, 'scourge');
            }
            
            // Set up scoring table in advance (helpful for testing!)
            let splitPlayerName = '';
            let chars = player.name.split("");
            for (let i in chars) {
                splitPlayerName += `<span>${chars[i]}</span>`;
            }
            $('scoring-row-players').innerHTML += `<td><span id="scoring-row-name-p${playerId}" style="color:#${player.color};"><span>${splitPlayerName}</span></span></td>`;
            
            $('scoring-row-location').innerHTML += `<td id="scoring-row-location-p${playerId}"></td>`;
            $('scoring-row-lord').innerHTML += `<td id="scoring-row-lord-p${playerId}"></td>`;
            $('scoring-row-affiliated').innerHTML += `<td id="scoring-row-affiliated-p${playerId}"></td>`;
            $('scoring-row-monster').innerHTML += `<td id="scoring-row-monster-p${playerId}"></td>`;
            if (gamedatas.krakenExpansion) {
                $('scoring-row-nebulis').innerHTML += `<td id="scoring-row-nebulis-p${playerId}"></td>`;
                $('scoring-row-kraken').innerHTML += `<td id="scoring-row-kraken-p${playerId}"></td>`;  
            }
            if (gamedatas.leviathanExpansion) {
                $('scoring-row-wound').innerHTML += `<td id="scoring-row-wound-p${playerId}"></td>`;
                $('scoring-row-scourge').innerHTML += `<td id="scoring-row-scourge-p${playerId}"></td>`;  
            }
            
            $('scoring-row-total').innerHTML += `<td id="scoring-row-total-p${playerId}"></td>`;
        });
    }
    
    public updateKeyCounter(playerId: number) {
        this.keyCounters[playerId].setValue(this.keyTokenCounts[playerId] + this.keyFreeLordsCounts[playerId]);
        this.setTooltip(`key-holder_p${playerId}`, 
            _('Keys (${keyTokens} key token(s) + ${keyFreeLords} key(s) from free Lords)')
                .replace('${keyTokens}', this.keyTokenCounts[playerId])
                .replace('${keyFreeLords}', this.keyFreeLordsCounts[playerId])
        );
    }

    private setPearlCount(playerId: number, count: number) {
        this.pearlCounters[playerId].setValue(count);
    }
    private setNebulisCount(playerId: number, count: number) {
        this.nebulisCounters[playerId]?.setValue(count);
    }

    private incMonsterCount(playerId: number, inc: number) {
        this.monsterCounters[playerId].setValue(this.monsterCounters[playerId].getValue() + inc);
    }

    private incAllyCount(playerId: number, inc: number) {
        this.allyCounters[playerId].setValue(this.allyCounters[playerId].getValue() + inc);
    }

    private incLordCount(playerId: number, inc: number) {
        this.lordCounters[playerId].setValue(this.lordCounters[playerId].getValue() + inc);
    }

    private placeFigurineToken(playerId: number, type: 'kraken' | 'scourge') {
        const figurineToken = document.getElementById(`${type}Token`);
        if (figurineToken) {
            if (playerId == 0) {
                (this as any).fadeOutAndDestroy(figurineToken);
            } else {
                this.animationManager.attachWithAnimation(
                    new BgaSlideAnimation({
                        element: figurineToken,
                    }),
                    document.getElementById(`player_board_${playerId}_figurinesWrapper`)
                );
            }
        } else {
            if (playerId != 0) {
                dojo.place(`<div id="${type}Token" class="token"></div>`, `player_board_${playerId}_figurinesWrapper`);

                let tooltip = null;
                if (type === 'kraken') {
                    tooltip = _("The Kraken figure allows players to identify, during the game, the most corrupt player. The figure is given to the first player to receive any Nebulis. As soon as an opponent ties or gains more Nebulis than the most corrupt player, they get the Kraken figure");
                } else if (type === 'scourge') {
                    tooltip = _("If you are the first player to kill a Leviathan, take the Scourge of the Abyss. As soon as an opponent reaches or exceeds the number of Leviathans killed by the most valorous defender, they take the statue from the player who currently holds it. The player who owns the statue at the end of the game gains 5 Influence Points.");
                }
                if (tooltip) {
                    this.setTooltip(`${type}Token`, tooltip);
                }
            }
        }
    }

    private getSentinelToken(playerId: number, lordId: number) {
        let div = document.getElementById(`sentinel-${lordId}`);
        if (!div) {
            div = document.createElement('div');
            div.id = `sentinel-${lordId}`;
            div.classList.add('sentinel-token');
            div.dataset.lordId = `${lordId}`;
            div.dataset.currentPlayer = (playerId == this.getPlayerId()).toString();
        }
        return div;
    }

    private placeSentinelToken(playerId: number, lordId: number, location: string, locationArg: number) {
        const sentinel = this.getSentinelToken(playerId, lordId);
        const parentElement = sentinel.parentElement;

        switch (location) {
            case 'player':
                const sentinelsElement = document.getElementById(`player-panel-${playerId}-sentinels`);
                sentinelsElement.appendChild(sentinel);
                if (parentElement) {
                    this.animationManager.attachWithAnimation(
                        new BgaSlideAnimation({
                            element: sentinel,
                        }),
                        sentinelsElement
                    );
                }
                break;
            case 'lord':
                const lordElement = this.lordManager.getCardElement({ lord_id: locationArg } as AbyssLord);
                lordElement.appendChild(sentinel);
                if (parentElement) {
                    this.animationManager.attachWithAnimation(
                        new BgaSlideAnimation({
                            element: sentinel,
                        }),
                        lordElement
                    );
                }
                break;
            case 'council':
                const councilElement = document.getElementById(`council-track-${locationArg}`);
                councilElement.appendChild(sentinel);
                if (parentElement) {
                    this.animationManager.attachWithAnimation(
                        new BgaSlideAnimation({
                            element: sentinel,
                        }),
                        councilElement
                    );
                }
                break;
            case 'location':
                const locationElement = this.locationManager.getCardElement({ location_id: locationArg } as AbyssLocation);
                locationElement.appendChild(sentinel);
                if (parentElement) {
                    this.animationManager.attachWithAnimation(
                        new BgaSlideAnimation({
                            element: sentinel,
                        }),
                        locationElement
                    );
                }
                break;

        }
    }

    private organiseLocations() {
        // If on playmat:
        if (dojo.hasClass($('game-board-holder'), "playmat")) {
            // move all beyond 5 into the overflow
            const locations = this.visibleLocations.getCards();
            if (locations.length > 5) {
                this.visibleLocationsOverflow.addCards(locations.slice(5));
            }
        } else {
            const locations = this.visibleLocationsOverflow.getCards();
            if (locations.length > 0) {
                this.visibleLocations.addCards(locations);
            }
        }
    }

    
    private updateFactionPanelFromHand() {
        setTimeout(() => {
            const factionTotals: { [key: number]: number } = {};
            const factionCounts: { [key: number]: number } = {};
    
            // Initialize totals and counts for each faction
            [0, 1, 2, 3, 4].forEach(faction => {
                factionTotals[faction] = 0;
                factionCounts[faction] = 0;
            });
    
            // Include Kraken (ID 10) only if krakenExpansion is enabled
            if (this.gamedatas.krakenExpansion) {
                factionTotals[10] = 0;
                factionCounts[10] = 0;
            }
    
            // Get all allies in the player's hand using AllyManager
            const allies = this.allyManager.getAlliesInHand();
    
            // Sum the values and count the cards for each faction
            allies.forEach(ally => {
                if (ally.faction in factionTotals) {
                    factionTotals[ally.faction] += ally.value;
                    factionCounts[ally.faction] += 1;
                }
            });
    
            // Update the UI
            Object.keys(factionTotals).forEach(faction => {
                const totalElement = document.getElementById(`faction-total-${faction}`);
                const countElement = document.getElementById(`faction-count-${faction}`);
                if (totalElement) {
                    totalElement.textContent = factionTotals[faction].toString();
                }
                if (countElement) {
                    countElement.textContent = factionCounts[faction].toString();
                }
            });
    
            // Hide Kraken row if krakenExpansion is disabled
            if (!this.gamedatas.krakenExpansion) {
                const krakenRow = document.getElementById('kraken-faction');
                if (krakenRow) {
                    krakenRow.style.display = 'none';
                }
            }
        }, 1000); // Delay of 1 second
    }

    ///////////////////////////////////////////////////
    //// Player's action

    /*

        Here, you are defining methods to handle player's action (ex: results of mouse click on
        game objects).

        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server

    */
    onDiscard() {
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(node => 
            ally_ids.push(+dojo.attr(node, 'data-ally-id'))
        );

        this.discardAllies(ally_ids);
    }

    onRecruit(withNebulis: number) {
        if (!(this as any).checkAction('pay')) {
            return;
        }

        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(node => {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });

        this.takeAction('pay', {
            ally_ids: ally_ids.join(';'),
            withNebulis,
        });
    }

    onChooseAffiliate(evt) {
        if(!(this as any).checkAction( 'affiliate' )) {
        return;
        }

        var ally_id = +evt.currentTarget.id.replace('button_affiliate_', '');

        this.takeAction('affiliate', {
            ally_id,
        });
    }

    cancelRecruit() {
        if (!(this as any).checkAction('cancelRecruit')) {
            return;
        }

        this.takeAction('cancelRecruit');
    }

    onClickCouncilTrack(evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
            // Draw this stack??
            dojo.stopEvent( evt );

            var faction = dojo.attr(evt.target, 'data-faction');

            if (this.gamedatas.gamestate.name === 'chooseCouncilStackMonsterToken') {
                this.takeAction('actChooseCouncilStackMonsterToken', { faction });
                return;
            } else if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(2, faction);
                return;
            } else if (this.gamedatas.gamestate.name === 'placeKraken') {
                this.placeKraken(faction);
                return;
            }

            if( ! (this as any).checkAction( 'requestSupport' ) ) {
                return;
            }

            this.takeAction('requestSupport', {
                faction,
            });
        }
    }

    onClickPlayerLocation(location: AbyssLocation): void {
        var target = this.locationManager.getCardElement(location);
        if (!dojo.hasClass(target, 'location-back')) {

            if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(3, location.location_id);
                return;
            }

            if( ! (this as any).checkAction( 'chooseLocation' ) ) {
            return;
            }
            
            // If you select Black Smokers with an empty deck, warn!
            if (location.location_id == 10) {
                let location_deck = dojo.query('.location.location-back')[0];
                let location_deck_size = +dojo.attr(location_deck, 'data-size');
                if (location_deck_size == 0) {
                (this as any).confirmationDialog( _('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch( this, function() {
                    this.chooseLocation(location.location_id);
                    } ) );
                    return;
                }
            }
            
            this.chooseLocation(location.location_id);
        }
    }

    private onVisibleLocationClick(location: AbyssLocation) {
        const location_id = location.location_id;

        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(3, location_id);
            return;
        }

        if( ! (this as any).checkAction( 'chooseLocation' ) ) {
            return;
        }
        
        // If you select Black Smokers with an empty deck, warn!
        if (location_id == 10) {
            let location_deck = dojo.query('.location.location-back')[0];
            let location_deck_size = +dojo.attr(location_deck, 'data-size');
            if (location_deck_size == 0) {
            (this as any).confirmationDialog( _('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch( this, function() {
                this.chooseLocation(location_id);
                } ) );
                return;
            }
        }
        
        this.chooseLocation(location_id);
    }

    private chooseLocation(locationId: number) {
        const lord_ids = this.getCurrentPlayerTable().getFreeLords(true)
            .filter(lord => this.lordManager.getCardElement(lord).classList.contains('selected'))
            .map(lord => lord.lord_id);

        this.takeAction('chooseLocation', {
            location_id: locationId,
            lord_ids: lord_ids.join(';'),
        });
    }

    onVisibleLordClick(lord: AbyssLord) {
        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(1, lord.lord_id);
        } else {
            this.recruit(lord.lord_id);
        }
    }

    onLeviathanClick(card: AbyssLeviathan): void {
        if (this.gamedatas.gamestate.name === 'chooseLeviathanToFight') {
            this.takeAction('actChooseLeviathanToFight', { id: card.id });
        } else if (this.gamedatas.gamestate.name === 'lord208') {
            this.takeAction('actRemoveHealthPointToLeviathan', { id: card.id });
        }
    }

    onLeviathanTrackSlotClick(slot: number): void {
        if (this.gamedatas.gamestate.name === 'lord210') {
            this.takeAction('actChooseFreeSpaceForLeviathan', { slot });
        }
    }

    private recruit(lordId: number) {
        if (!(this as any).checkAction('recruit')) {
            return;
        }

        this.takeAction('recruit', {
            lord_id: lordId,
        },);
    }

    onClickExploreDeck( evt ) {
        dojo.stopEvent( evt );

        this.exploreDeck();
    }

    exploreDeck() {
        if (!(this as any).checkAction('explore')) {
            return;
        }

        this.takeAction('explore');
    }

    onVisibleAllyClick(ally: AbyssAlly) {
        if((this as any).checkAction('purchase', true)) {
            this.onPurchase(0); // TODO BGA ?
            return;
        }

        this.exploreTake(ally.place);
    }

    exploreTake(slot: number) {
        if (!(this as any).checkAction('exploreTake')) {
            return;
        }

        this.takeAction('exploreTake', {
            slot,
        });
    }

    onPurchase(withNebulis: number) {
        if(!(this as any).checkAction('purchase')) {
            return;
        }

        this.takeAction('purchase', {
            withNebulis
        });
    }

    onPass( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'pass' ) ) {
        return;
        }

        this.takeAction('pass');
    }

    onPlot( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'plot' ) ) {
        return;
        }

        this.takeAction('plot');
    }

    onChooseMonsterReward( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'chooseReward' ) ) {
        return;
        }

        var option = +evt.currentTarget.id.replace("button_reward_", '');

        this.takeAction('chooseReward', {
            option,
        });
    }

    private updateRecruitButtonsState(args: EnteringRecruitPayArgs) {
        const playerPearls = args.pearls;
        const playerNebulis = args.nebulis;
        // const diversity = args.lord.diversity;

        const selectedAllies = this.getCurrentPlayerTable().getSelectedAllies();
        const value = selectedAllies.map(ally => ally.value).reduce((a, b) => Number(a) + Number(b), 0);
        // const krakens = selectedAllies.filter(ally => ally.faction == 10).length;
        let shortfall = Math.max(0, args.cost - value);
        // console.log(args, value, shortfall);

        // Update "Recruit" button
        const recruitButton = document.getElementById('button_recruit');
        recruitButton.innerHTML = _('Recruit') + ' ('+shortfall+' <i class="icon icon-pearl"></i>)';
        recruitButton.classList.toggle('disabled', shortfall > playerPearls);

        [1, 2].forEach(i => {
            const button = document.getElementById(`button_recruit_with${i}Nebulis`);
            if (button) {
                const cost = shortfall;
                button.innerHTML = _('Recruit') + ` (${ cost - i > 0 ? `${cost - i} <i class="icon icon-pearl"></i> ` : ''}${i} <i class="icon icon-nebulis"></i>)`;
                let canPayShortFallWithNebulis = playerNebulis >= i && playerPearls >= (cost - i) && i <= shortfall;
                if (canPayShortFallWithNebulis && !args.canAlwaysUseNebulis && playerPearls != cost - i) {
                    canPayShortFallWithNebulis = false;
                }
                button.classList.toggle('disabled', !canPayShortFallWithNebulis);
            }
        });
    }

    onClickPlayerHand(ally: AbyssAlly) {
        if (this.gamedatas.gamestate.name === 'applyLeviathanDamage') {
            if (this.gamedatas.gamestate.args.penalty === 3) {
                // Multi-discard: select, otherwise just discard this one
                this.allyManager.getCardElement(ally).classList.toggle('selected');

                var ally_ids = [];
                dojo.query("#player-hand .ally.selected").forEach(node => 
                    ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                );
                document.getElementById('button_discard').classList.toggle('disabled', ally_ids.length != this.gamedatas.gamestate.args.number);
            }
        } else if (this.gamedatas.gamestate.name === 'chooseAllyToFight') {
            (this as any).bgaPerformAction('actChooseAllyToFight', { id: ally.ally_id });
        } else if( (this as any).checkAction( 'pay', true ) ) {
            this.allyManager.getCardElement(ally).classList.toggle('selected');
            this.updateRecruitButtonsState(this.gamedatas.gamestate.args);
        } else if( (this as any).checkAction( 'discard', true ) ) {
            // Multi-discard: select, otherwise just discard this one
            this.allyManager.getCardElement(ally).classList.toggle('selected');

            if (this.gamedatas.gamestate.name === 'martialLaw') {
                var ally_ids = [];
                dojo.query("#player-hand .ally.selected").forEach(node => 
                    ally_ids.push(+dojo.attr(node, 'data-ally-id'))
                );
                document.getElementById('button_discard').classList.toggle('disabled', !ally_ids.length);
            }

            // Discard this card directly?
            // var ally_id = dojo.attr(evt.target, 'data-ally-id');
            // (this as any).ajaxcall( "/abyss/abyss/discard.html", { lock: true, ally_ids: ally_id }, this,
            //   function( result ) {},
            //   function( is_error) {}
            // );
        } else if( (this as any).checkAction( 'selectAlly', true ) ) {
            this.takeAction('selectAlly', { 
                ally_id: ally.ally_id 
            });
        }
    }

    onClickMonsterIcon(playerId: number, monster?: AbyssMonster) {
        if (['revealMonsterToken', 'chooseRevealReward'].includes(this.gamedatas.gamestate.name)) {
            if (monster.type != 1) {
                (this as any).showMessage(_("You can only reveal Leviathan monster tokens"), 'error');
            } else {
                this.takeAction('actRevealReward', { id: monster.monster_id });
            }
        } else if( (this as any).checkAction( 'chooseMonsterTokens' ) ) {
            this.takeAction('chooseMonsterTokens', {
                player_id: playerId,
                type: monster?.type ?? 0,
            });
        }
    }

    onClickPlayerFreeLord(lord: AbyssLord) {
        if (this.gamedatas.gamestate.name === 'applyLeviathanDamage') {
            if (this.gamedatas.gamestate.args.penalty === 4) {
                this.takeAction('actDiscardLordLeviathanDamage', { id: lord.lord_id });
            }
        } else if( (this as any).checkAction( 'selectLord', true ) ) {
            this.takeAction('selectLord', {
                lord_id: lord.lord_id
            });
        } else if( (this as any).checkAction( 'lordEffect', true ) ) {
            this.takeAction('lordEffect', {
                lord_id: lord.lord_id
            });
        } else if( (this as any).checkAction( 'chooseLocation', true ) ) {
            const target = this.lordManager.getCardElement(lord);

            // Only allow this on your own Lords
            var panel = target.closest('.player-panel');
            if (panel.id == "player-panel-" + this.getPlayerId()) {
                dojo.toggleClass(target, "selected");
            }
        }
    }

    onClickPlayerLockedLord(lord: AbyssLord) {
        const target = this.lordManager.getCardElement(lord);
        if (target.classList.contains('selectable') && this.gamedatas.gamestate.name === 'lord116') {
            this.freeLord(lord.lord_id);
            return;
        }
    }
    
    onUpdateAutopass() {
        let autopass = "";
        for (let faction = 0; faction < 6; faction++) {
        let max = 0;
        for (let j = 0; j <= 5; j++) {
            if ($('autopass-'+faction+'-'+j).checked) {
                max = j;
            } else {
                break;
            }
        }
        if (autopass.length > 0) {
            autopass += ";";
        }
        autopass += "" + max;
        }

        this.takeNoLockAction('setAutopass', {
            autopass,
        });
    }

    onDrawLocation( evt ) {
        dojo.stopEvent( evt );

        if( ! (this as any).checkAction( 'drawLocations' ) ) {
        return;
        }

        var num = +evt.currentTarget.id.replace('button_draw_', '');

        this.takeAction('drawLocations', {
            num,
        });
    }

    private payMartialLaw() {
        if(!(this as any).checkAction('payMartialLaw')) {
            return;
        }

        this.takeAction('payMartialLaw');
    }

    private searchSanctuary() {
        if(!(this as any).checkAction('searchSanctuary')) {
            return;
        }

        this.takeAction('searchSanctuary');
    }

    private stopSanctuarySearch() {
        if(!(this as any).checkAction('stopSanctuarySearch')) {
            return;
        }

        this.takeAction('stopSanctuarySearch');
    }

    private takeAllyFromDiscard(id: number) {
        if(!(this as any).checkAction('takeAllyFromDiscard')) {
            return;
        }

        this.takeAction('takeAllyFromDiscard', {
            id,
        });
    }

    private freeLord(id: number) {
        if(!(this as any).checkAction('freeLord')) {
            return;
        }

        this.takeAction('freeLord', {
            id,
        });
    }

    private selectAllyRace(faction: number) {
        if(!(this as any).checkAction('selectAllyRace')) {
            return;
        }

        this.takeAction('selectAllyRace', {
            faction,
        });
    }
    
    public discardAllies(ids: number[]) {
        if(!(this as any).checkAction('discard')) {
            return;
        }

        this.takeAction('discard', {
            ally_ids: ids.join(';'),
        });
    }

    private giveKraken(playerId: number) {
        if(!(this as any).checkAction('giveKraken')) {
            return;
        }

        this.takeAction('giveKraken', {
            playerId,
        });
    }

    private goToPlaceSentinel() {
        if(!(this as any).checkAction('goToPlaceSentinel')) {
            return;
        }

        this.takeAction('goToPlaceSentinel');
    }

    private placeSentinel(location: number, locationArg: number) {
        if(!(this as any).checkAction('placeSentinel')) {
            return;
        }

        this.takeAction('placeSentinel', {
            location,
            locationArg,
        });
    }

    private giveNebulisTo(playersIds: number[]) {
        if(!(this as any).checkAction('giveNebulisTo')) {
            return;
        }

        this.takeAction('giveNebulisTo', {
            playersIds: playersIds.join(';'),
        });
    }

    private placeKraken(faction: number) {
        if(!(this as any).checkAction('placeKraken')) {
            return;
        }

        this.takeAction('placeKraken', {
            faction
        });
    }

    public takeAction(action: string, data?: any) {
        (this as any).bgaPerformAction(action, data);
    }

    public takeNoLockAction(action: string, data?: any) {
        (this as any).bgaPerformAction(action, data, { lock: false, checkAction: false });
    }


    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your abyss.game.php file.

    */
    setupNotifications() {        
        let num_players = Object.keys(this.gamedatas.players).length;

        const notifs = [
            ['explore', 1],
            ['takeAllyFromDiscard', 500],
            ['purchase', 500],
            ['exploreTake', 1000],
            ['setThreat', 1],
            ['lootReward', 1],
            ['monsterReward', 1],
            ['monsterTokens', 1],
            ['removeMonsterToken', 500],
            ['monsterHand', 1],
            ['discardCouncil', 1],
            ['requestSupport', 1],
            ['requestSupportCards', 1],
            ['recruit', 1],
            ['refillLords', 1],
            ['affiliate', 1],
            ['plot', 1],
            ['allyDeckShuffle', 1],
            ['diff', 1],
            ['disable', 1],
            ['moveLordsRight', 1],
            ['newLocations', 1],
            ['control', 1],
            ['loseLocation', 1],
            ['score', 1],
            ['useLord', 1],
            ['refreshLords', 1],
            ['finalRound', 1],
            ['payMartialLaw', 1],
            ['newLoot', 500],
            ['highlightLootsToDiscard', 1000],
            ['discardLoots', 1],
            ['searchSanctuaryAlly', 500],
            ['kraken', 500],
            ['scourge', 500],
            ['placeSentinel', 500],
            ['placeKraken', 500],
            ['willDiscardLeviathan', 3000],
            ['discardLeviathan', 3000],
            ['newLeviathan', 500],
            ['rollDice', 1500],
            ['setCurrentAttackPower', 1500],
            ['removeCurrentAttackPower', 1],
            ['discardExploreMonster', 500],
            ['discardAllyTofight', 500],
            ['moveLeviathanLife', 500],
            ['setFightedLeviathan', 1],
            ['leviathanDefeated', 1500],
            ['discardLords', 500],
            ['endGame_scoring', (5000 + (this.gamedatas.krakenExpansion ? 2000 : 0) + (this.gamedatas.leviathanExpansion ? 2000 : 0)) * num_players + 3000],
        ];
    
        notifs.forEach((notif) => {
            const notifName = notif[0];
            dojo.subscribe(notifName, this, (notifDetails: Notif<any>) => {
                log(`notif_${notifName}`, notifDetails.args);
                this[`notif_${notifName}`](notifDetails/*.args*/);
            });
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }
    
    setScoringArrowRow(stage: string) {
        dojo.query('#game-scoring .arrow').style('visibility', 'hidden');
        dojo.query('.arrow', $('scoring-row-'+stage)).style('visibility', 'visible');
    }
    
    setScoringRowText(stage: string, player_id: string, value: string) {
            $('scoring-row-' + stage + '-p' + player_id).innerHTML = value;

            if (stage === 'total') {
                (this as any).scoreCtrl[player_id].toValue(value);
            }
        }
    
    setScoringRowWinner(winner_ids: string[], lines: string[]) {
        for (let i in winner_ids) {
            let player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            
            lines.forEach(stage =>
                dojo.style($('scoring-row-'+stage+'-p' + player_id), {'backgroundColor': 'rgba(255, 215, 0, 0.3)'})
            );
        }
    }
    
    notif_finalRound( notif: Notif<NotifFinalRoundArgs>) {
        let playerId = notif.args.player_id;
        
        this.gamedatas.game_ending_player = playerId;
        dojo.style($('last-round'), { 'display': 'block' });
    }
    
    notif_endGame_scoring ( notif: Notif<NotifEndGameScoringArgs> ) {
        let breakdowns = notif.args.breakdowns;
        let winnerIds = notif.args.winner_ids;
        
        // Don't show the "final round" message if at the actual end
        dojo.style($('last-round'), { 'display': 'none' });
        dojo.style($('game-scoring'), {'display': 'block'});
        
        let currentTime = 0;
        const lines = ['location', 'lord', 'affiliated', 'monster'];
        if (this.gamedatas.krakenExpansion) {
            lines.push('nebulis', 'kraken');
        }
        if (this.gamedatas.leviathanExpansion) {
            lines.push('wound', 'scourge');
        }
        lines.push('total');
        log(breakdowns);
        lines.forEach(stage => {
            let breakdownStage = stage + '_points';
            if (stage == 'total') {
                breakdownStage = 'score';
            }
            // Set arrow to here
            setTimeout(this.setScoringArrowRow.bind(this, stage), currentTime);
            for( let player_id in this.gamedatas.players ) {
                setTimeout(this.setScoringRowText.bind(this, stage, player_id, breakdowns[player_id][breakdownStage]), currentTime);
                currentTime += 1000;
            }
        });
        
        // Set winner to be animated!
        currentTime -= 500;
        setTimeout(this.setScoringRowWinner.bind(this, winnerIds, lines), currentTime);
    }

    notif_useLord( notif: Notif<NotifUseLordArgs> ) {
        const lordCard = this.lordManager.getCardElement({ lord_id: notif.args.lord_id } as AbyssLord);
        lordCard.dataset.used = '1';
        lordCard.classList.remove('unused');
    }

    notif_refreshLords() {
        dojo.query(".lord").forEach(node => dojo.setAttr(node, "data-used", "0"));
    }

    notif_score( notif: Notif<NotifScoreArgs> ) {
        var score = notif.args.score;
        var player_id = notif.args.player_id;

        (this as any).scoreCtrl[player_id].toValue(score);
    }

    notif_control( notif: Notif<NotifControlArgs> ) {
        var location = notif.args.location;
        var lords = notif.args.lords;
        var player_id = notif.args.player_id;
        var add_lords = notif.args.add_lords;

        // Add the location to the player board
        this.getPlayerTable(player_id).addLocation(location, lords, false, add_lords);
        
        this.lordManager.updateLordKeys(player_id);
        
        this.organisePanelMessages();
    }

    notif_loseLocation( notif: Notif<NotifLoseLocationArgs> ) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;

        // Delete the location/lords
        this.getPlayerTable(player_id).removeLocation({ location_id } as AbyssLocation);
        
        this.lordManager.updateLordKeys(player_id);        
        this.organisePanelMessages();
    }

    notif_newLocations( notif: Notif<NotifNewLocationsArgs> ) {
        var locations = notif.args.locations;
        var deck_size = notif.args.deck_size;

        this.visibleLocations.addCards(locations, {
            fromElement: document.querySelector('.location.location-back'),
            originalSide: 'back',
        });
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), deck_size);
    }

    notif_disable( notif: Notif<NotifDisableArgs> ) {
        var lord_id = notif.args.lord_id;
        this.lordManager.getCardElement({ lord_id } as AbyssLord).classList.add('disabled');
        for( var player_id in this.gamedatas.players ) {
            this.lordManager.updateLordKeys(Number(player_id));
        }
    }

    notif_allyDeckShuffle ( notif: Notif<NotifAllyDeckShuffleArgs> ) {
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.allyDiscardCounter.setValue(0);
    }

    notif_lootReward( notif: Notif<NotifMonsterRewardArgs> ) {
        const playerId = notif.args.player_id;
        this.setPearlCount(playerId, notif.args.playerPearls);
        this.incMonsterCount(playerId, notif.args.monsters);
        this.keyTokenCounts[playerId] += notif.args.keys;
        this.updateKeyCounter(playerId);
    }

    notif_monsterReward( notif: Notif<NotifMonsterRewardArgs>) {
        this.notif_lootReward(notif);
        this.notif_setThreat({args: {threat: 0}} as Notif<NotifThreatArgs>);
    }

    notif_monsterTokens(notif: Notif<NotifMonsterTokensArgs>) {
        this.monsterTokens[this.getPlayerId()].addCards(notif.args.monsters);
    }

    notif_removeMonsterToken(notif: Notif<NotifRemoveMonsterTokenArgs>) {
        this.incMonsterCount(notif.args.playerId, -1);
        this.monsterTokens[notif.args.playerId].removeCard(notif.args.monster);
    }
    
    notif_monsterHand( notif: Notif<NotifMonsterHandArgs> ) {
        var monsters = notif.args.monsters;
        var playerId = notif.args.player_id;

        this.monsterTokens[playerId].removeAll();
        this.monsterTokens[playerId].addCards(monsters);
    }

    notif_plot( notif: Notif<NotifPlotArgs> ) {
        var lord = notif.args.lord;
        var player_id = notif.args.player_id;
        var deck_size = +notif.args.deck_size;
        var old_lord = notif.args.old_lord;

        this.setPearlCount(player_id, notif.args.playerPearls);
        if (old_lord) {
            this.visibleLords.removeCard(old_lord);
        }
        this.visibleLords.addCard(lord, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    }

    notif_affiliate( notif: Notif<NotifAffiliateArgs> ) {
        var ally = notif.args.ally;
        var player_id = notif.args.player_id;
        this.getPlayerTable(player_id).addAffiliated(ally);
        
        if (notif.args.also_discard) {
            // Also discard this ally from my hand!
            this.incAllyCount(player_id, -1);

            // If it's me, also delete the actual ally - removed as caused end of game issues with ui
            //if (player_id == this.getPlayerId()) {
                //this.getCurrentPlayerTable().removeAllies([ally]);
            //}            
        }
        
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
}

    notif_explore( notif: Notif<NotifExploreArgs> ) {
        var ally = notif.args.ally;
        this.visibleAllies.addCard(ally, {
            fromElement: document.getElementById('explore-track-deck'),
            originalSide: 'back',
        });

        // Update ally decksize
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        
        this.lastExploreTime = new Date().getTime();
    }
    
    notif_exploreTake( notif: Notif<NotifExploreTakeArgs> ) {
        // If this comes right after notif_explore, we want to delay by about 1-2 seconds
        let deltaTime = this.lastExploreTime ? (new Date().getTime() - this.lastExploreTime) : 1000;
        
        if (deltaTime < 2000) {
            setTimeout(() => 
                this.notif_exploreTake_real( notif )
            , 2000 - deltaTime);
        } else {
            this.notif_exploreTake_real( notif );
        }

        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    }

    notif_exploreTake_real( notif: Notif<NotifExploreTakeArgs> ) {
        let player_id = notif.args.player_id;
        var slot = notif.args.slot;

        // For each slot, animate to the council pile, fade out and destroy, then increase the council pile by 1
        var delay = 0;
        const cards = this.visibleAllies.getCards();
        for (var i = 1; i <= 5; i++) {
            const ally = cards.find(ally => ally.place == i);
            if (ally) {
                const faction = ally.faction;
                if (faction === null) {
                    // Monster just fades out
                    this.visibleAllies.removeCard(ally);
                    delay += 200;
                } else if (i != slot) {
                    if (faction != 10) {
                        // Animate to the council!
                        let deck = dojo.query('#council-track .slot-' + faction);
                        this.councilStacks[faction].addCard(ally, null, { visible: false })
                            .then(() => this.setDeckSize(deck, +dojo.attr(deck[0], 'data-size') + 1));
                        delay += 200;
                    }
                } else {
                    // This is the card that was taken - animate it to hand or player board
                    const theAlly = this.allyManager.getCardElement(ally);
                    if (player_id == this.getPlayerId()) {
                        setTimeout(() => {
                            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly);
                            this.incAllyCount(player_id, 1);
                        }, delay);
                        delay += 200;
                    } else {
                        dojo.setStyle(theAlly, "zIndex", "1");
                        dojo.setStyle(theAlly, "transition", "none");
                        var animation = (this as any).slideToObject( theAlly, $('player_board_' + player_id), 600, delay );
                        animation.onEnd = () => {
                            this.visibleAllies.removeCard(ally);
                            this.incAllyCount(player_id, 1);
                        };
                        animation.play();
                        delay += 200;
                    }
                }
            }
        }

        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    }

    notif_takeAllyFromDiscard(notif: Notif<NotifPurchaseArgs>) {
        const player_id = notif.args.player_id;

        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, $('game-extra'));
        }
        this.incAllyCount(player_id, 1);

        this.allyDiscardCounter.setValue(notif.args.discardSize);

        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    }

    notif_purchase( notif: Notif<NotifPurchaseArgs> ) {
        let player_id = notif.args.player_id;
        const ally = notif.args.ally;

        // Update handsize and pearls of purchasing player
        this.setPearlCount(player_id, notif.args.playerPearls);
        this.setPearlCount(notif.args.first_player_id, notif.args.firstPlayerPearls);
        if (this.gamedatas.krakenExpansion) {
            this.setNebulisCount(player_id, notif.args.playerNebulis);
            this.setNebulisCount(notif.args.first_player_id, notif.args.firstPlayerNebulis);
        }

        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(ally);
            this.incAllyCount(player_id, 1);
        } else {
            const theAlly = this.allyManager.getCardElement(ally);
            dojo.setStyle(theAlly, "zIndex", "1");
            dojo.setStyle(theAlly, "transition", "none");
            var animation = (this as any).slideToObject( theAlly, $('player_board_' + player_id), 600 );
            animation.onEnd = () => {
                this.visibleAllies.removeCard(ally);
                this.incAllyCount(player_id, 1);
            };
            animation.play();
        }

        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    }

    notif_setThreat( notif: Notif<NotifThreatArgs> ) {
        // Update handsize and pearls of purchasing player
        var tt = $('threat-token');
        dojo.removeClass(tt, 'slot-0 slot-1 slot-2 slot-3 slot-4 slot-5');
        dojo.addClass(tt, 'slot-' + notif.args.threat);
    }

    notif_discardCouncil( notif: Notif<NotifDiscardCouncilArgs> ) {
        var faction = notif.args.faction;

        // Empty the council pile
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    }

    notif_requestSupport( notif: Notif<NotifRequestSupportArgs> ) {
        let player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;
        let deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);

        // Add cards to the player's hand
        if (player_id != this.getPlayerId()) {
        for (var i = 0; i < num; i++) {
            var anim = (this as any).slideTemporaryObject( this.allyManager.renderBack(), 'council-track', 'council-track-' + faction, $('player_board_' + player_id), 600, i * 200 );
            dojo.connect(anim, 'onEnd', () => {
                this.incAllyCount(player_id, 1);
            });
        }
        } else {
            this.incAllyCount(player_id, num);
        }

        this.organisePanelMessages();
    }

    notif_requestSupportCards( notif: Notif<NotifRequestSupportCardsArgs> ) {
        let player_id = notif.args.player_id;
        var faction = notif.args.faction;
        let allies = notif.args.allies;

        // Add cards to the player's hand
        var delay = 0;
        const ROTATIONS = [-25, -10, 0, 13, 28];
        allies.forEach(ally => {
            setTimeout(() => 
                this.getPlayerTable(Number(player_id)).addHandAlly(ally, document.getElementById('council-track-' + faction), 'back', ROTATIONS[faction])
            , delay);
            delay += 250;
        });
    }

    notif_moveLordsRight(notif: Notif<any>) {
        this.visibleLords.addCards(notif.args.lords);
    }

    notif_recruit( notif: Notif<NotifRecruitArgs> ) {
        var lord = notif.args.lord;
        var player_id = +notif.args.player_id;
        var spent_lords = notif.args.spent_lords;
        var spent_allies = notif.args.spent_allies;

        // Spend pearls and allies
        if (spent_allies) {
            this.incAllyCount(player_id, -spent_allies.length);
        }
        if (notif.args.playerPearls !== undefined && notif.args.playerPearls !== null) {
            this.setPearlCount(player_id, notif.args.playerPearls);
        }
        if (notif.args.playerNebulis !== undefined && notif.args.playerNebulis !== null) {
            this.setNebulisCount(player_id, notif.args.playerNebulis);
        }

        // If it's me, then actually get rid of the allies
        if (spent_allies && player_id == this.getPlayerId()) {
            this.getCurrentPlayerTable().removeAllies(spent_allies);
        }

        if (spent_lords?.length) {
            this.getPlayerTable(player_id).removeLords(spent_lords);
            this.incLordCount(player_id, -spent_lords.length);
        }

        // Add the lord
        if (lord) {
            this.getPlayerTable(player_id).addLord(lord);
            
            if (!notif.args.freeLord) {
                this.incLordCount(player_id, 1);
            }
        }

        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        
        this.lordManager.updateLordKeys(player_id);        
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    }

    notif_discardLords( notif: Notif<any> ) {
        var playerId = notif.args.playerId;
        var lords = notif.args.lords;

        if (lords?.length) {
            this.getPlayerTable(playerId).removeLords(lords);
            this.incLordCount(playerId, -lords.length);
        }
        
        this.lordManager.updateLordKeys(playerId);
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    }

    notif_refillLords(notif: Notif<NotifRefillLordsArgs>) {
        var lords = notif.args.lords;
        var deck_size = notif.args.deck_size;
        this.visibleLords.addCards(lords, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    }

    notif_diff( notif: Notif<NotifDiffArgs> ) {
        var player_id = +notif.args.player_id;
        var source = notif.args.source;
        var source_player_id = null;
        if (source?.startsWith("player_")) {
            source_player_id = +source.slice("player_".length);
        }
        // TODO : Animate based on 'source'
        // If source starts "lord_" animate to the lord
        if (notif.args.playerPearls !== undefined && notif.args.playerPearls !== null) {
            this.setPearlCount(player_id, notif.args.playerPearls);
        }
        if (notif.args.playerNebulis !== undefined && notif.args.playerNebulis !== null) {
            this.setNebulisCount(player_id, notif.args.playerNebulis);
        }
        if (notif.args.wounds !== undefined && notif.args.wounds !== null) {
            this.woundCounters[player_id].incValue(notif.args.wounds);
        }

        if (notif.args.keys) {
            this.keyTokenCounts[player_id] += notif.args.keys;
            this.updateKeyCounter(player_id);
        }

        if (notif.args.allies_lost) {
            var allies = notif.args.allies_lost;
            this.incAllyCount(player_id, -allies.length);

            // If it's me, also delete the actual ally
            this.getPlayerTable(notif.args.player_id).removeAllies(allies);
        }

        if (notif.args.monster) {
            this.incMonsterCount(player_id, notif.args.monster.length);
            const currentPlayerId = this.getPlayerId();
            if (source_player_id) {
                this.incMonsterCount(source_player_id, -notif.args.monster.length);
                if (source_player_id == currentPlayerId) {
                    // Remove it from me
                    this.monsterTokens[currentPlayerId].removeCards(notif.args.monster);
                }
            }
            if (player_id == currentPlayerId) {
                // Add it to me
                this.monsterTokens[currentPlayerId].addCards(notif.args.monster);
                notif.args.monster.forEach(monster => this.monsterManager.setCardVisible(monster, true));
            }
        }

        if (notif.args.monster_count) {
            this.incMonsterCount(player_id, notif.args.monster_count);
            if (source_player_id) {
                this.incMonsterCount(source_player_id, -notif.args.monster_count);
            }
        }

        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        
        this.organisePanelMessages();
    }

    notif_payMartialLaw(notif: Notif<NotifPayMartialLawArgs>) {
        this.setPearlCount(notif.args.playerId, notif.args.playerPearls);
    }

    notif_newLoot(notif: Notif<NotifNewLootArgs>) {
        this.locationManager.addLoot(notif.args.locationId, notif.args.newLoot);
    }

    notif_highlightLootsToDiscard(notif: Notif<NotifDiscardLootsArgs>) {
        this.locationManager.highlightLootsToDiscard(notif.args.locationId, notif.args.loots);
    }

    notif_discardLoots(notif: Notif<NotifDiscardLootsArgs>) {
        this.locationManager.discardLoots(notif.args.locationId, notif.args.loots);
    }

    notif_searchSanctuaryAlly(notif: Notif<NotifSearchSanctuaryAllyArgs>) {
        const playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addHandAlly(notif.args.ally, document.getElementById('explore-track-deck'));
        this.incAllyCount(playerId, 1);

        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    }

    notif_kraken(notif: Notif<any>) {
        this.placeFigurineToken(notif.args.playerId, 'kraken');
    }

    notif_scourge(notif: Notif<any>) {
        this.placeFigurineToken(notif.args.playerId, 'scourge');
    }

    notif_placeSentinel(notif: Notif<NotifPlaceSentinelArgs>) {
        this.placeSentinelToken(notif.args.playerId, notif.args.lordId, notif.args.location, notif.args.locationArg);
    }

    notif_placeKraken(notif: Notif<NotifPlaceKrakenArgs>) {
        this.councilStacks[notif.args.faction].addCard(notif.args.ally);

        var deck = dojo.query('#council-track .slot-' + notif.args.faction);
        this.setDeckSize(deck, notif.args.deckSize);
    }

    // when a Leviathan inflicts damage to the player (with action needed)
    async notif_willDiscardLeviathan(notif: Notif<NotifLeviathanArgs>) {
        this.leviathanManager.getCardElement(notif.args.leviathan).classList.add('fighted-leviathan');
        
        await sleep(1500);
    }

    // when a Leviathan inflicts damage to the player
    async notif_discardLeviathan(notif: Notif<NotifLeviathanArgs>) {
        this.leviathanManager.getCardElement(notif.args.leviathan).classList.add('fighted-leviathan');
        
        await sleep(2500);

        await this.leviathanBoard.discardLeviathan(notif.args.leviathan);
    }

    notif_newLeviathan(notif: Notif<NotifLeviathanArgs>) {
        this.leviathanBoard.newLeviathan(notif.args.leviathan);
    }

    notif_rollDice(notif: Notif<any>) {
        this.leviathanBoard.showDice(notif.args.spot, notif.args.dice);
    }

    notif_setCurrentAttackPower(notif: Notif<NotifSetCurrentAttackPowerArgs>) {
        this.leviathanBoard.setCurrentAttackPower(notif.args);
    }

    notif_removeCurrentAttackPower(notif: Notif<any>) {
        this.leviathanBoard.removeCurrentAttackPower();
    }

    notif_discardExploreMonster(notif: Notif<NotifDiscardExploreMonsterArgs>) {
        this.visibleAllies.removeCard(notif.args.ally);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    }

    notif_discardAllyTofight(notif: Notif<NotifDiscardAllyTofightArgs>) {
        if (this.getPlayerId() == notif.args.playerId) {
            this.getCurrentPlayerTable().getHand().removeCard(notif.args.ally);
        }
        this.allyCounters[notif.args.playerId].incValue(-1);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    }

    notif_moveLeviathanLife(notif: Notif<NotifLeviathanArgs>) {
        this.leviathanBoard.moveLeviathanLife(notif.args.leviathan);
    }

    notif_setFightedLeviathan(notif: Notif<NotifLeviathanArgs>) {
        const leviathan = notif.args.leviathan;
        if (leviathan) {
            this.leviathanManager.getCardElement(leviathan).classList.add('fighted-leviathan');
        } else {
            document.querySelectorAll('.fighted-leviathan').forEach(elem => elem.classList.remove('fighted-leviathan'));
        }
    }

    async notif_leviathanDefeated(notif: Notif<NotifLeviathanDefeatedArgs>) {
        await this.leviathanBoard.discardLeviathan(notif.args.leviathan);
        this.defeatedLeviathanCounters[notif.args.playerId].toValue(notif.args.defeatedLeviathans);
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                ['die1', 'die2'].forEach(property => {
                    if (args[property] && typeof args[property] === 'number') {
                        args[property] = `<div class="log-die" data-value="${args[property]}"></div>`;
                    }
                });
                
                ['spot_numbers'].forEach(property => {
                    if (args[property] && typeof args[property] === 'string' && args[property][0] !== '<') {
                        args[property] = `<strong>${_(args[property])}</strong>`;
                    }
                });

                if (args.council_name && typeof args.council_name !== 'string' && args.faction !== undefined) {
                    args.council_name = colorFaction(this.format_string_recursive(args.council_name.log, args.council_name.args), args.faction);
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }

}