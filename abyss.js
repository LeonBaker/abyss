var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
var log = isDebug ? console.log.bind(window.console) : function () { };
var debounce;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
var LOCAL_STORAGE_ZOOM_KEY = 'Abyss-zoom';
var Abyss = /** @class */ (function () {
    function Abyss() {
        this.playersTables = [];
        this.councilStacks = [];
        this.monsterTokens = [];
        this.pearlCounters = [];
        this.nebulisCounters = [];
        this.keyTokenCounts = [];
        this.keyFreeLordsCounts = [];
        this.keyCounters = [];
        this.monsterCounters = [];
        this.allyCounters = [];
        this.lordCounters = [];
        this.woundCounters = [];
        this.defeatedLeviathanCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
    }
    Abyss.prototype.setup = function (gamedatas) {
        var _this = this;
        var _a, _b;
        log("Starting game setup");
        if (!gamedatas.krakenExpansion) {
            this.dontPreloadImage("kraken.png");
            this.dontPreloadImage("lords-kraken.jpg");
            this.dontPreloadImage("loots.jpg");
        }
        if (!gamedatas.leviathanExpansion) {
            this.dontPreloadImage("scourge.png");
            this.dontPreloadImage("lords-leviathan.jpg");
            this.dontPreloadImage("icons-leviathan.png");
            this.dontPreloadImage("icons-leviathan.png");
            this.dontPreloadImage("allies-leviathan.jpg");
            this.dontPreloadImage("leviathans.jpg");
            this.dontPreloadImage("leviathan-die.png");
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
        }
        else {
            (_a = document.getElementById('leviathan-board')) === null || _a === void 0 ? void 0 : _a.remove();
        }
        dojo.connect($('modified-layout-checkbox'), 'onchange', function () {
            dojo.toggleClass($('game-board-holder'), "playmat", $('modified-layout-checkbox').checked);
        });
        var usePlaymat = this.prefs[100].value == 1;
        // On resize, fit cards to screen (debounced)
        if (usePlaymat) {
            dojo.addClass($('game-board-holder'), "playmat");
            var leviathanBoardLeftWrapper = document.getElementById('leviathan-board-left-wrapper');
            leviathanBoardLeftWrapper.style.position = 'absolute';
            leviathanBoardLeftWrapper.style.left = '-210px';
        }
        var onResize = function () {
            var _a, _b, _c;
            var w = ((_a = document.getElementById('bga-zoom-wrapper')) === null || _a === void 0 ? void 0 : _a.clientWidth) / ((_c = (_b = _this.zoomManager) === null || _b === void 0 ? void 0 : _b.zoom) !== null && _c !== void 0 ? _c : 1);
            if (gamedatas.leviathanExpansion) {
                var leviathanBoard = document.getElementById('leviathan-board');
                var leviathanBoardLeftWrapper = document.getElementById('leviathan-board-left-wrapper');
                var leviathanBoardBottomWrapper = document.getElementById('leviathan-board-bottom-wrapper');
                var minWidth = 1340 + 210;
                if (w > minWidth && leviathanBoard.parentElement != leviathanBoardLeftWrapper) {
                    leviathanBoardLeftWrapper.appendChild(leviathanBoard);
                    document.getElementById('game-board-holder').style.marginLeft = '210px';
                }
                else if (w < minWidth && leviathanBoard.parentElement != leviathanBoardBottomWrapper) {
                    leviathanBoardBottomWrapper.appendChild(leviathanBoard);
                    document.getElementById('game-board-holder').style.marginLeft = '0px';
                }
            }
            if (usePlaymat) {
                var narrowPlaymat = w < 1340;
                dojo.toggleClass($('game-board-holder'), "playmat", !narrowPlaymat);
                dojo.toggleClass($('game-board-holder'), "playmat-narrow", narrowPlaymat);
            }
            _this.organiseLocations();
        };
        dojo.connect(window, "onresize", debounce(function () { return onResize(); }, 200));
        if (gamedatas.krakenExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', "\n                <tr id=\"scoring-row-nebulis\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-nebulis-icon\" class=\"icon icon-nebulis\"></i></td>\n                </tr>\n                <tr id=\"scoring-row-kraken\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-kraken-icon\" class=\"icon-kraken\"></i></td>\n                </tr>\n            ");
        }
        if (gamedatas.leviathanExpansion) {
            document.getElementById('scoring-row-total').insertAdjacentHTML('beforebegin', "\n                <tr id=\"scoring-row-wound\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-wound-icon\" class=\"icon leviathan-icon icon-wound\"></i></td>\n                </tr>\n                <tr id=\"scoring-row-scourge\">\n                    <td class=\"first-column\"><span class=\"arrow\">\u2192</span><i id=\"scoring-scourge-icon\" class=\"icon-scourge\"></i></td>\n                </tr>\n            ");
        }
        // Setting up player boards
        this.createPlayerPanels(gamedatas);
        // Add an extra column at the end, just for padding reasons
        $('scoring-row-players').innerHTML += "<td></td>";
        $('scoring-row-location').innerHTML += "<td></td>";
        $('scoring-row-lord').innerHTML += "<td></td>";
        $('scoring-row-affiliated').innerHTML += "<td></td>";
        $('scoring-row-monster').innerHTML += "<td></td>";
        if (gamedatas.krakenExpansion) {
            $('scoring-row-nebulis').innerHTML += "<td></td>";
            $('scoring-row-kraken').innerHTML += "<td></td>";
        }
        if (gamedatas.leviathanExpansion) {
            $('scoring-row-wound').innerHTML += "<td></td>";
            $('scoring-row-scourge').innerHTML += "<td></td>";
        }
        $('scoring-row-total').innerHTML += "<td></td>";
        var p = this.player_id;
        if (this.isSpectator) {
            p = gamedatas.playerorder[0];
        }
        var players_done = {};
        do {
            if (players_done[p])
                break;
            players_done[p] = 1;
            var player = gamedatas.players[p];
            var table = new PlayerTable(this, player);
            this.playersTables.push(table);
            p = gamedatas.turn_order[p];
        } while (p != this.player_id);
        // Lords
        this.visibleLords = new SlotStock(this.lordManager, document.getElementById('visible-lords-stock'), {
            slotsIds: [1, 2, 3, 4, 5, 6],
            mapCardToSlot: function (lord) { return lord.place; },
        });
        this.visibleLords.addCards(gamedatas.lord_slots);
        this.visibleLords.onCardClick = function (lord) { return _this.onVisibleLordClick(lord); };
        // Allies
        this.visibleAllies = new SlotStock(this.allyManager, document.getElementById('visible-allies-stock'), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: function (ally) { return ally.place; },
        });
        this.visibleAllies.addCards(gamedatas.ally_explore_slots);
        this.visibleAllies.onCardClick = function (ally) { return _this.onVisibleAllyClick(ally); };
        for (var i in gamedatas.ally_council_slots) {
            var num = gamedatas.ally_council_slots[i];
            var deck = dojo.query('#council-track .slot-' + i);
            this.setDeckSize(deck, num);
            this.councilStacks[i] = new VoidStock(this.allyManager, deck[0]);
        }
        this.setDeckSize(dojo.query('#lords-track .slot-0'), gamedatas.lord_deck);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), gamedatas.ally_deck);
        // Threat level
        var threat_token = $('threat-token');
        dojo.removeClass(threat_token, "slot-0 slot-1 slot-2 slot-3 slot-4 slot-5");
        dojo.addClass(threat_token, "slot-" + gamedatas.threat_level);
        // Locations
        this.visibleLocations = new LineStock(this.locationManager, document.getElementById('visible-locations-stock'), {
            center: false,
            direction: 'column',
        });
        this.visibleLocations.addCards(gamedatas.location_available);
        this.visibleLocations.onCardClick = function (location) { return _this.onVisibleLocationClick(location); };
        this.visibleLocationsOverflow = new LineStock(this.locationManager, document.getElementById('locations-holder-overflow'));
        this.visibleLocationsOverflow.onCardClick = function (location) { return _this.onVisibleLocationClick(location); };
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), gamedatas.location_deck);
        // Clickers
        document.getElementById('explore-track-deck').addEventListener('click', function (e) { return _this.onClickExploreDeck(e); });
        document.getElementById('council-track').addEventListener('click', function (e) { return _this.onClickCouncilTrack(e); });
        // Council panel event listeners
        document.getElementById('view-council-btn').addEventListener('click', function (e) { return _this.onClickViewCouncil(e); });
        document.getElementById('hide-council-btn').addEventListener('click', function (e) { return _this.onClickHideCouncil(e); });
        // Tooltips
        // Hide this one, because it doesn't line up due to Zoom
        //this.setTooltip( 'explore-track-deck', '', _('Explore'), 1 );
        var pearlTooltip = _('Pearls');
        if (gamedatas.krakenExpansion) {
            pearlTooltip += ' / ' + _('Nebulis');
        }
        this.setTooltipToClass('pearl-holder', pearlTooltip);
        this.setTooltipToClass('monster-holder', _('Monster tokens'));
        this.setTooltipToClass('ally-holder', _('Ally cards in hand'));
        this.setTooltipToClass('lordcount-holder', _('Number of Lords'));
        this.setTooltipToClass('leviathan-holder', _('Wounds / Defeated Leviathans'));
        this.setTooltip('scoring-location-icon', _('Locations'));
        this.setTooltip('scoring-lords-icon', _('Lords'));
        this.setTooltip('scoring-affiliated-icon', _('Affiliated Allies'));
        this.setTooltip('scoring-monster-tokens-icon', _('Monster tokens'));
        if (gamedatas.krakenExpansion) {
            this.setTooltip('scoring-nebulis-icon', _('Nebulis'));
            this.setTooltip('scoring-kraken-icon', _('Kraken'));
        }
        if (gamedatas.leviathanExpansion) {
            this.setTooltip('scoring-wound-icon', _('Wounds'));
            this.setTooltip('scoring-scourge-icon', _('Scourge'));
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
            var krakenInputs = document.getElementById('kraken-inputs');
            if (krakenInputs) {
                krakenInputs.classList.remove('hide-row');
            }
            var krakenFaction = document.getElementById('kraken-faction');
            if (krakenFaction) {
                krakenFaction.classList.remove('hide-row');
            }
        }
        // Only show auto-pass and card options for actual players
        if (!this.isSpectator) {
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
        (_b = this.gamedatas.sentinels) === null || _b === void 0 ? void 0 : _b.filter(function (sentinel) { return sentinel.playerId; }).forEach(function (sentinel) { return _this.placeSentinelToken(sentinel.playerId, sentinel.lordId, sentinel.location, sentinel.locationArg); });
        // Insert options into option box
        var me = gamedatas.players[this.player_id];
        if (me) {
            if (!me.autopass) {
                me.autopass = "0;0;0;0;0;0";
            }
            if (me.autopass) {
                var pieces = me.autopass.split(";");
                if (pieces.length > 6) {
                    pieces = [0, 0, 0, 0, 0, 0];
                }
                if (pieces.length >= 5) {
                    var firstValue = +pieces[0];
                    var allSame = true;
                    for (var i_1 = 0; i_1 < 6; i_1++) {
                        var max = +pieces[i_1];
                        if (max != firstValue) {
                            allSame = false;
                        }
                        for (var j = 0; j <= max; j++) {
                            $('autopass-' + i_1 + '-' + j).checked = true;
                        }
                    }
                    if (allSame) {
                        $('autopass-all-' + firstValue).checked = true;
                    }
                }
            }
            var _loop_1 = function (faction) {
                var _loop_3 = function (i_2) {
                    dojo.connect($('autopass-' + faction + '-' + i_2), 'onclick', function () {
                        // Check only up to this
                        for (var j = 0; j <= 5; j++) {
                            $('autopass-all-' + j).checked = false;
                            $('autopass-' + faction + '-' + j).checked = j <= i_2;
                        }
                        _this.onUpdateAutopass();
                    });
                };
                for (var i_2 = 0; i_2 <= 5; i_2++) {
                    _loop_3(i_2);
                }
            };
            for (var faction = 0; faction < 6; faction++) {
                _loop_1(faction);
            }
            var _loop_2 = function (i_3) {
                dojo.connect($('autopass-all-' + i_3), 'onclick', function () {
                    // Check only this one
                    for (var j = 0; j <= 5; j++) {
                        $('autopass-all-' + j).checked = i_3 == j;
                    }
                    for (var faction = 0; faction < 6; faction++) {
                        for (var j = 0; j <= 5; j++) {
                            $('autopass-' + faction + '-' + j).checked = j <= i_3;
                        }
                    }
                    _this.onUpdateAutopass();
                });
            };
            for (var i_3 = 0; i_3 <= 5; i_3++) {
                _loop_2(i_3);
            }
        }
        this.allyDiscardCounter = new ebg.counter();
        this.allyDiscardCounter.create("ally-discard-size");
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
            onZoomChange: function () { return onResize(); },
            //onDimensionsChange: () => this.onTableCenterSizeChange(),
        });
        // Setup game notifications to handle (see "setupNotifications" method below)
        this.setupNotifications();
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onEnteringState = function (stateName, args) {
        var _this = this;
        var _a;
        log('onEnteringState', stateName, args.args);
        // Remove all current move indicators
        dojo.query('.card-current-move').removeClass('card-current-move');
        if (this.isCurrentPlayerActive()) {
            if (this.checkPossibleActions('explore')) {
                dojo.query('#explore-track-deck').addClass('card-current-move');
            }
            if (this.checkPossibleActions('exploreTake') || this.checkPossibleActions('purchase')) {
                for (var i = 5; i >= 1; i--) {
                    var qr = dojo.query("#visible-allies-stock [data-slot-id=\"".concat(i, "\"] .ally"));
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
            if (this.checkPossibleActions('requestSupport')) {
                dojo.query('#council-track .ally-back').addClass('card-current-move');
            }
            if (this.checkPossibleActions('recruit')) {
                // If affordableLords given, then highlight only affordable lords
                if (args.args && args.args._private && args.args._private.affordableLords) {
                    (_a = args.args._private.affordableLords) === null || _a === void 0 ? void 0 : _a.forEach(function (lord) {
                        var div = _this.lordManager.getCardElement(lord);
                        div.classList.add('card-current-move');
                    });
                }
                else {
                    dojo.query('#lords-track .lord:not(.lord-back)').addClass('card-current-move');
                }
            }
            if (this.checkPossibleActions('chooseLocation') && stateName != 'locationEffectBlackSmokers') {
                dojo.query('#locations-holder .location:not(.location-back)').addClass('card-current-move');
                dojo.query('#locations-holder-overflow .location:not(.location-back)').addClass('card-current-move');
            }
        }
        this.updateFactionPanelFromHand();
        switch (stateName) {
            case 'revealMonsterToken':
            case 'chooseRevealReward':
                if (this.isCurrentPlayerActive()) {
                    document.getElementById("monster-hand_p".concat(this.getPlayerId())).classList.add("clickable");
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
            case 'purchase':
            case 'explore':
            case 'explore2':
            case 'explore3':
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
    };
    Abyss.prototype.onEnteringRecruitPay = function (args) {
        var _a;
        // highlight the given lord
        (_a = this.lordManager.getCardElement(args.lord)) === null || _a === void 0 ? void 0 : _a.classList.add('selected');
    };
    Abyss.prototype.onEnteringLord7 = function () {
        // Put a red border around the player monster tokens (who aren't me)
        if (this.isCurrentPlayerActive()) {
            for (var player_id in this.gamedatas.players) {
                if (player_id != this.player_id) {
                    if (this.gamedatas.leviathanExpansion) {
                        document.getElementById("monster-hand_p".concat(player_id)).classList.add("clickable");
                    }
                    else {
                        dojo.query("#cp_board_p" + player_id + " .icon.icon-monster").addClass("clickable");
                    }
                }
            }
        }
    };
    Abyss.prototype.onEnteringLord112 = function (args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            var stock = new LineStock(this.allyManager, document.getElementById("ally-discard"));
            stock.addCards(args.allies);
            args.allies.filter(function (ally) { return ally.faction === null; }).forEach(function (monster) { var _a; return (_a = _this.allyManager.getCardElement(monster)) === null || _a === void 0 ? void 0 : _a.classList.add('disabled'); });
            stock.onCardClick = function (ally) { return _this.takeAllyFromDiscard(ally.ally_id); };
        }
    };
    Abyss.prototype.onEnteringLord114multi = function (args) {
        // Put a border around selectable allies
        if (this.isCurrentPlayerActive()) {
            Array.from(document.querySelectorAll(".affiliated .ally[data-faction=\"".concat(args.faction, "\"]"))).forEach(function (elem) { return elem.classList.add('card-current-move'); });
        }
    };
    Abyss.prototype.onEnteringLord116 = function (args) {
        var _this = this;
        // Put a green border around selectable lords
        if (this.isCurrentPlayerActive()) {
            args.lords.forEach(function (lord) {
                return _this.lordManager.getCardElement(lord).classList.add('selectable');
            });
        }
    };
    Abyss.prototype.onEnteringLord208 = function (args) {
        // Put a green border around selectable lords
        if (this.isCurrentPlayerActive()) {
            this.leviathanBoard.setAllSelectableLeviathans();
        }
    };
    Abyss.prototype.onEnteringLord210 = function (args) {
        //this.leviathanBoard.newLeviathan(args.leviathan);
        args.freeSlots.forEach(function (slot) {
            return document.querySelector("#leviathan-board [data-slot-id=\"".concat(slot, "\"]")).classList.add('selectable');
        });
    };
    Abyss.prototype.onEnteringPlaceSentinel = function (args) {
        var _this = this;
        // Put a green border around selectable lords
        if (this.isCurrentPlayerActive()) {
            console.log(args);
            if (args.possibleOnLords) {
                this.visibleLords.getCards().forEach(function (lord) { return _this.lordManager.getCardElement(lord).classList.add('card-current-move'); });
            }
            if (args.possibleOnCouncil) {
                [0, 1, 2, 3, 4].forEach(function (faction) { return document.getElementById("council-track-".concat(faction)).classList.add('card-current-move'); });
            }
            if (args.possibleOnLocations) {
                __spreadArray(__spreadArray([], this.visibleLocations.getCards(), true), this.visibleLocationsOverflow.getCards(), true).forEach(function (location) { return _this.locationManager.getCardElement(location).classList.add('card-current-move'); });
            }
        }
    };
    Abyss.prototype.onEnteringControlPostDraw = function (args) {
        var _this = this;
        // Fade out the locations you can't buy
        if (this.isCurrentPlayerActive()) {
            dojo.query("#locations-holder .location:not(.location-back)").addClass("unavailable");
            dojo.query("#locations-holder-overflow .location:not(.location-back)").addClass("unavailable");
            args.location_ids.forEach(function (location_id) {
                return _this.locationManager.getCardElement({ location_id: location_id }).classList.remove('unavailable');
            });
        }
    };
    Abyss.prototype.onEnteringControl = function (args) {
        var _this = this;
        dojo.query(".free-lords .lord").removeClass("selected");
        args.default_lord_ids.forEach(function (lord_id) { return _this.lordManager.getCardElement({ lord_id: lord_id }).classList.add('selected'); });
    };
    Abyss.prototype.onEnteringLocationEffectBlackSmokers = function (args) {
        var _this = this;
        // Draw all the locations in a div at the top. Register to each an onclick to select it.
        if (this.isCurrentPlayerActive()) {
            dojo.place('<div id="ally-discard"></div>', 'game-extra');
            dojo.style($('game-extra'), "display", "block");
            var stock = new LineStock(this.locationManager, document.getElementById("ally-discard"), {
                direction: 'column',
            });
            stock.addCards(args._private.locations);
            stock.onCardClick = function (location) { return _this.onVisibleLocationClick(location); };
        }
    };
    Abyss.prototype.onEnteringPurchaseExplore = function (args) {
        // Disable players who have passed
        this.enableAllPlayerPanels();
        for (var iPlayer in args.passed_players) {
            this.disablePlayerPanel(args.passed_players[iPlayer]);
        }
        // Underline the first player
        var first_player = args.first_player;
        dojo.query('a', $('player_name_' + first_player)).style('text-decoration', 'underline');
    };
    Abyss.prototype.onEnteringChooseLeviathanToFight = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.leviathanBoard.setSelectableLeviathans(args.selectableLeviathans);
        }
    };
    Abyss.prototype.onEnteringChooseAllyToFight = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().getHand().setSelectionMode('single', args.selectableAllies);
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Abyss.prototype.onLeavingState = function (stateName) {
        log('onLeavingState', stateName);
        $('game-extra').innerHTML = '';
        dojo.style($('game-extra'), "display", "none");
        switch (stateName) {
            case 'revealMonsterToken':
            case 'chooseRevealReward':
                document.querySelectorAll(".monster-hand.clickable").forEach(function (elem) { return elem.classList.remove("clickable"); });
                break;
            case 'recruitPay':
                dojo.query("#lords-track .lord").removeClass("selected");
                dojo.query("#player-hand .ally").removeClass("selected");
                break;
            case 'lord7':
                // Put a red border around the player monster tokens (who aren't me)
                if (this.gamedatas.leviathanExpansion) {
                    document.querySelectorAll(".monster-hand.clickable").forEach(function (elem) { return elem.classList.remove("clickable"); });
                }
                else {
                    dojo.query(".cp_board .icon.icon-monster").removeClass("clickable");
                }
                break;
            case 'controlPostDraw':
            case 'control':
                dojo.query("#locations-holder .location").removeClass("unavailable");
                dojo.query("#locations-holder-overflow .location").removeClass("unavailable");
            case 'lord19':
            case 'lord19b':
                dojo.query(".free-lords .lord").removeClass("selected");
                break;
            case 'purchase':
            case 'explore':
            case 'explore2':
            case 'explore3':
                this.enableAllPlayerPanels();
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
    };
    Abyss.prototype.onLeavingLord116 = function () {
        dojo.query(".lord.selectable").removeClass('selectable');
    };
    Abyss.prototype.onLeavingLord210 = function () {
        document.querySelectorAll("#leviathan-board .slot.selectable").forEach(function (elem) { return elem.classList.remove('selectable'); });
    };
    Abyss.prototype.onLeavingChooseLeviathanToFight = function () {
        if (this.isCurrentPlayerActive()) {
            this.leviathanBoard.setSelectableLeviathans(null);
        }
    };
    Abyss.prototype.onLeavingChooseAllyToFight = function () {
        if (this.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().getHand().setSelectionMode('none');
        }
    };
    Abyss.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var args = __assign({ you: '<span style="font-weight:bold;color:#' + this.getPlayerColor(this.getPlayerId()) + ';">' + __('lang_mainsite', 'You') + '</span>' }, this.gamedatas.gamestate.args);
        $('pagemaintitletext').innerHTML = this.format_string_recursive(_(this.gamedatas.gamestate['descriptionmyturn' + property]), args);
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Abyss.prototype.onUpdateActionButtons = function (stateName, args) {
        //log('onUpdateActionButtons', stateName, args);
        var _this = this;
        if (this.isCurrentPlayerActive() && ["plotAtCourt", "action", "secondStack", "explore", "explore2", "explore3", "chooseMonsterReward", "recruitPay", "affiliate", "cleanupDiscard", "controlPostDraw", "unusedLords"].includes(stateName)) {
            dojo.query("#player-panel-" + this.player_id + " .free-lords .lord").forEach(function (node) {
                // unused, and unturned...
                var used = +dojo.attr(node, "data-used");
                var turned = +dojo.attr(node, "data-turned");
                var effect = +dojo.attr(node, "data-effect");
                if (!used && !turned && effect == 3) {
                    dojo.addClass(node, "unused");
                }
            });
        }
        else {
            dojo.query(".lord").removeClass("unused");
        }
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'revealMonsterToken':
                case 'chooseRevealReward':
                    this.addActionButton("actEndRevealReward-button", _('End reveal'), function () { return _this.bgaPerformAction('actEndRevealReward'); });
                    break;
                case 'purchase':
                    var purchageArgs_1 = args;
                    var cost_1 = purchageArgs_1.cost;
                    this.addActionButton('button_purchase', _('Purchase') + " (".concat(cost_1, " <i class=\"icon icon-pearl\"></i>)"), function () { return _this.onPurchase(0); });
                    if (!purchageArgs_1.canPayWithPearls) {
                        document.getElementById('button_purchase').classList.add('disabled');
                    }
                    if (purchageArgs_1.withNebulis) {
                        Object.keys(purchageArgs_1.withNebulis).forEach(function (i) {
                            _this.addActionButton("button_purchase_with".concat(i, "Nebulis"), _('Purchase') + " (".concat(cost_1 - Number(i) > 0 ? "".concat(cost_1 - Number(i), " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)"), function (event) { return _this.onPurchase(Number(i)); });
                            if (!purchageArgs_1.withNebulis[i]) {
                                document.getElementById("button_purchase_with".concat(i, "Nebulis")).classList.add('disabled');
                            }
                        });
                    }
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'explore':
                    var exploreArgs_1 = args;
                    if (exploreArgs_1.monster && this.gamedatas.leviathanExpansion) {
                        this.addActionButton('button_fightMonster', _('Fight the Monster'), function () { return _this.exploreTake(exploreArgs_1.ally.place); });
                        if (exploreArgs_1.canIgnore) {
                            this.addActionButton('button_ignoreMonster', _('Ignore the Monster'), function () { return _this.bgaPerformAction('actIgnoreMonster'); });
                        }
                        this.addActionButton('button_keepExploring', _('Keep exploring'), function () { return _this.exploreDeck(); }, null, null, 'red');
                    }
                    break;
                case 'explore3':
                    var explore3Args = args;
                    if (explore3Args.monster && this.gamedatas.leviathanExpansion && explore3Args.canIgnore) {
                        this.addActionButton('button_fightMonster', _('Fight the Monster'), function () { return _this.exploreTake(5); });
                        this.addActionButton('button_ignoreMonster', _('Ignore the Monster'), function () { return _this.bgaPerformAction('actIgnoreMonster'); });
                    }
                    break;
                case 'chooseMonsterReward':
                    for (var i in args.rewards) {
                        var r = args.rewards[i];
                        r = r.replace(/K/g, "<i class=\"icon icon-key\"></i>");
                        r = r.replace(/P/g, "<i class=\"icon icon-pearl\"></i>");
                        r = r.replace(/M/g, "<i class=\"icon icon-monster\"></i>");
                        this.addActionButton('button_reward_' + i, r, 'onChooseMonsterReward');
                    }
                    break;
                case 'recruitPay':
                    var recruitArgs = args;
                    this.addActionButton('button_recruit', _('Recruit'), function () { return _this.onRecruit(0); });
                    if (recruitArgs.withNebulis) {
                        Object.keys(recruitArgs.withNebulis).forEach(function (i) {
                            _this.addActionButton("button_recruit_with".concat(i, "Nebulis"), _('Recruit') + " (".concat(args.cost - Number(i) > 0 ? "".concat(args.cost - Number(i), " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)"), function () { return _this.onRecruit(Number(i)); });
                        });
                    }
                    this.updateRecruitButtonsState(recruitArgs);
                    this.addActionButton('button_pass', _('Cancel'), function (event) { return _this.onPass(event); });
                    break;
                case 'affiliate':
                    for (var i in args.allies) {
                        var ally = args.allies[i];
                        var r = ally.value + ' ' + this.allyManager.allyNameText(ally.faction);
                        var btnId = 'button_affiliate_' + ally.ally_id;
                        this.addActionButton(btnId, r, 'onChooseAffiliate');
                        dojo.addClass($(btnId), 'affiliate-button');
                    }
                    //(this as any).addActionButton('cancelRecruit_button', _('Cancel'), () => this.cancelRecruit(), null, null, 'gray');
                    break;
                case 'plotAtCourt':
                    this.addActionButton('button_plot', _('Plot') + " (1 <i class=\"icon icon-pearl\"></i>)", 'onPlot');
                    if (args.canPlaceSentinel) {
                        this.addActionButton('button_place_sentinel', _('Place sentinel'), function () { return _this.goToPlaceSentinel(); });
                    }
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'action':
                    if (args.canPlaceSentinel) {
                        this.addActionButton('button_place_sentinel', _('Place sentinel'), function () { return _this.goToPlaceSentinel(); });
                    }
                    break;
                case 'lord23':
                case 'lord26':
                case 'locationEffectBlackSmokers':
                case 'lord19':
                case 'lord22':
                case 'lord19b':
                case 'unusedLords':
                    this.addActionButton('button_pass', _('Pass'), 'onPass');
                    break;
                case 'lord12':
                case 'lord17':
                case 'lord21':
                    this.addActionButton('button_pass', _('Cancel'), 'onPass');
                    break;
                case 'lord2':
                case 'lord5':
                case 'cleanupDiscard':
                case 'postpurchaseDiscard':
                    this.addActionButton('button_discard', _('Discard'), 'onDiscard');
                    break;
                case 'lord7':
                    if (!this.gamedatas.leviathanExpansion) {
                        var _loop_4 = function () {
                            var playerId = Number(player_id);
                            if (playerId != this_1.getPlayerId()) {
                                num_tokens = this_1.monsterCounters[playerId].getValue();
                                if (num_tokens > 0) {
                                    this_1.addActionButton("button_steal_monster_token_".concat(playerId), this_1.gamedatas.players[playerId].name, function () { return _this.onClickMonsterIcon(playerId); });
                                    document.getElementById("button_steal_monster_token_".concat(playerId)).style.border = "3px solid #".concat(this_1.gamedatas.players[playerId].color);
                                }
                            }
                        };
                        var this_1 = this, num_tokens;
                        // Put a red border around the player monster tokens (who aren't me)
                        for (var player_id in this.gamedatas.players) {
                            _loop_4();
                        }
                    }
                    break;
                case 'control':
                    var s = _('Draw ${n}');
                    var location_deck = dojo.query('.location.location-back')[0];
                    var location_deck_size = +dojo.attr(location_deck, 'data-size');
                    for (var i_4 = 1; i_4 <= 4; i_4++) {
                        if (location_deck_size < i_4)
                            continue;
                        this.addActionButton('button_draw_' + i_4, dojo.string.substitute(s, { n: i_4 }), 'onDrawLocation');
                    }
                    break;
                case 'martialLaw':
                    var martialLawArgs = args;
                    if ((martialLawArgs === null || martialLawArgs === void 0 ? void 0 : martialLawArgs.diff) > 0) {
                        this.addActionButton('button_discard', _('Discard selected allies'), function () { return _this.onDiscard(); });
                        var ally_ids = [];
                        dojo.query("#player-hand .ally.selected").forEach(function (node) {
                            return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
                        });
                        if (!ally_ids.length) {
                            document.getElementById('button_discard').classList.add('disabled');
                        }
                        this.addActionButton('button_payMartialLaw', _('Pay') + " ".concat(martialLawArgs.diff, " <i class=\"icon icon-pearl\"></i>"), function () { return _this.payMartialLaw(); });
                        if (!martialLawArgs.canPay) {
                            document.getElementById('button_payMartialLaw').classList.add('disabled');
                        }
                    }
                    break;
                case 'fillSanctuary':
                    this.addActionButton('button_continue', _('Continue searching'), function () { return _this.searchSanctuary(); });
                    this.addActionButton('button_stop', _('Stop searching'), function () { return _this.stopSanctuarySearch(); });
                    break;
                case 'lord104':
                    var lord104Args_1 = args;
                    if (lord104Args_1.nebulis == 1) {
                        lord104Args_1.playersIds.forEach(function (playerId) {
                            var player = _this.getPlayer(playerId);
                            _this.addActionButton("giveNebulisTo".concat(playerId, "-button"), player.name, function () { return _this.giveNebulisTo([playerId]); });
                            document.getElementById("giveNebulisTo".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                        });
                    }
                    else {
                        lord104Args_1.playersIds.forEach(function (playerId) {
                            lord104Args_1.playersIds.filter(function (secondPlayerId) { return secondPlayerId != playerId; }).forEach(function (secondPlayerId) {
                                var player = _this.getPlayer(playerId);
                                var secondPlayer = _this.getPlayer(secondPlayerId);
                                if (!document.getElementById("giveNebulisTo".concat(playerId, "-").concat(secondPlayerId, "-button")) && !document.getElementById("giveNebulisTo".concat(secondPlayerId, "-").concat(playerId, "-button"))) {
                                    _this.addActionButton("giveNebulisTo".concat(playerId, "-").concat(secondPlayerId, "-button"), _('${player_name} and ${player_name2}').replace('${player_name}', player.name).replace('${player_name2}', secondPlayer.name), function () { return _this.giveNebulisTo([playerId, secondPlayerId]); });
                                }
                            });
                        });
                    }
                    break;
                case 'lord112':
                    if (args.canPass) {
                        this.statusBar.addActionButton(_('Pass') + " (".concat(_('No ally in the discard'), ")"), function () { return _this.bgaPerformAction('actPassTakeAllyFromDiscard'); });
                    }
                    break;
                case 'lord114':
                    var _loop_5 = function (i_5) {
                        this_2.addActionButton("selectAllyRace".concat(i_5), this_2.allyManager.allyNameText(i_5), function () { return _this.selectAllyRace(i_5); });
                        document.getElementById("selectAllyRace".concat(i_5)).classList.add('affiliate-button');
                    };
                    var this_2 = this;
                    for (var i_5 = 0; i_5 < 5; i_5++) {
                        _loop_5(i_5);
                    }
                    break;
                case 'giveKraken':
                    var giveKrakenArgs = args;
                    giveKrakenArgs.playersIds.forEach(function (playerId) {
                        var player = _this.getPlayer(playerId);
                        _this.addActionButton("giveKraken".concat(playerId, "-button"), player.name, function () { return _this.giveKraken(playerId); });
                        document.getElementById("giveKraken".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                    });
                    break;
                case 'increaseAttackPower':
                    var increaseAttackPowerArgs = args;
                    if (increaseAttackPowerArgs.payPearlEffect) {
                        var _loop_6 = function (i_6) {
                            this_3.addActionButton("increaseAttackPower".concat(i_6, "-button"), _("Increase to ${newPower}").replace('${newPower}', (increaseAttackPowerArgs.attackPower + i_6) + " (".concat(i_6, " <i class=\"icon icon-pearl\"></i>)")), function () { return _this.bgaPerformAction('actIncreaseAttackPower', { amount: i_6 }); }, null, null, i_6 > 0 && !increaseAttackPowerArgs.interestingChoice.includes(i_6) ? 'gray' : undefined);
                        };
                        var this_3 = this;
                        for (var i_6 = 1; i_6 <= increaseAttackPowerArgs.playerPearls; i_6++) {
                            _loop_6(i_6);
                        }
                        this.addActionButton("increaseAttackPower0-button", _("Don't increase attack power"), function () { return _this.bgaPerformAction('actIncreaseAttackPower', { amount: 0 }); });
                    }
                    break;
                case 'chooseFightReward':
                    var chooseFightRewardArgs = args;
                    var _loop_7 = function (i_7) {
                        var base = chooseFightRewardArgs.rewards - i_7;
                        var expansion = i_7;
                        var html = [];
                        if (base > 0) {
                            html.push("".concat(base, " <div class=\"icon icon-monster\"></div>"));
                        }
                        if (expansion > 0) {
                            html.push("".concat(expansion, " <div class=\"icon icon-monster-leviathan\"></div>"));
                        }
                        this_4.addActionButton("actChooseFightReward".concat(i_7, "-button"), html.join(' '), function () { return _this.bgaPerformAction('actChooseFightReward', { base: base, expansion: expansion }); });
                    };
                    var this_4 = this;
                    for (var i_7 = 0; i_7 <= chooseFightRewardArgs.rewards; i_7++) {
                        _loop_7(i_7);
                    }
                    break;
                case 'chooseFightAgain':
                    this.addActionButton("actFightAgain-button", _('Fight again'), function () { return _this.bgaPerformAction('actFightAgain'); });
                    if (!args.canFightAgain) {
                        document.getElementById("actFightAgain-button").classList.add('disabled');
                    }
                    this.addActionButton("actEndFight-button", _('End turn'), function () { return _this.bgaPerformAction('actEndFight'); });
                    break;
                case 'chooseAllyToFight':
                    if (!args.selectableAllies.length) {
                        this.addActionButton("actEndFightDebug-button", _('End turn'), function () { return _this.bgaPerformAction('actEndFightDebug'); });
                    }
                    break;
                case 'lord202':
                    var lord202Args = args;
                    lord202Args.playersIds.forEach(function (playerId) {
                        var player = _this.getPlayer(playerId);
                        _this.addActionButton("actChooseOpponentToRevealLeviathan".concat(playerId, "-button"), player.name, function () { return _this.bgaPerformAction('actChooseOpponentToRevealLeviathan', { opponentId: playerId }); });
                        document.getElementById("actChooseOpponentToRevealLeviathan".concat(playerId, "-button")).style.border = "3px solid #".concat(player.color);
                    });
                    break;
                case 'lord206':
                    this.addActionButton("actFightImmediately-button", _('Fight immediatly'), function () { return _this.bgaPerformAction('actFightImmediately'); });
                    this.addActionButton("actIgnoreImmediatelyFightLeviathan-button", _("Don't fight"), function () { return _this.bgaPerformAction('actIgnoreImmediatelyFightLeviathan'); });
                    if (!args.canUse) {
                        document.getElementById("actFightImmediately-button").classList.add('disabled');
                    }
                    break;
                case 'applyLeviathanDamage':
                    switch (args.penalty) {
                        case 3:
                            this.setGamestateDescription('Allies');
                            this.addActionButton('button_discard', _('Discard selected allies'), function () {
                                var ally_ids = [];
                                dojo.query("#player-hand .ally.selected").forEach(function (node) {
                                    return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
                                });
                                _this.bgaPerformAction('actDiscardAlliesLeviathanDamage', { ids: ally_ids.join(',') });
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
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    Abyss.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    Abyss.prototype.setTooltipToClass = function (className, html) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    Abyss.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Abyss.prototype.getOpponentsIds = function (playerId) {
        return Object.keys(this.gamedatas.players).map(function (id) { return Number(id); }).filter(function (id) { return id != playerId; });
    };
    Abyss.prototype.getPlayer = function (playerId) {
        return Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) == playerId; });
    };
    Abyss.prototype.getPlayerColor = function (playerId) {
        return this.gamedatas.players[playerId].color;
    };
    Abyss.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Abyss.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    Abyss.prototype.organisePanelMessages = function () {
        this.playersTables.forEach(function (playerTable) { return playerTable.organisePanelMessages(); });
    };
    Abyss.prototype.setDeckSize = function (deck /*dojo query result*/, num) {
        deck.removeClass("deck-empty deck-low deck-medium deck-full");
        if (num == 0) {
            deck.addClass("deck-empty");
        }
        else if (num <= 2) {
            deck.addClass("deck-low");
        }
        else if (num <= 5) {
            deck.addClass("deck-medium");
        }
        else {
            deck.addClass("deck-full");
        }
        // Set deck-size data
        deck.attr("data-size", num);
        // If it's a council stack, then add tooltip
        for (var i = 0; i < deck.length; i++) {
            var node = deck[i];
            var deckSize = dojo.query('.deck-size', node);
            if (deckSize.length > 0) {
                var n = deckSize[0];
                n.innerHTML = num > 0 ? num : "";
            }
        }
    };
    Abyss.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var _a;
            var playerId = Number(player.id);
            // Setting up players boards if needed
            var player_board_div = $('player_board_' + playerId);
            var html = "\n            <div id=\"cp_board_p".concat(player.id, "\" class=\"cp_board\" data-player-id=\"").concat(player.id, "\">\n                <div class=\"counters\">\n                    <span class=\"pearl-holder\" id=\"pearl-holder_p").concat(player.id, "\">\n                        <i class=\"icon icon-pearl\"></i>\n                        <span id=\"pearlcount_p").concat(player.id, "\"></span>");
            if (gamedatas.krakenExpansion) {
                html += "<i class=\"icon icon-nebulis margin-left\"></i>\n                    <span id=\"nebuliscount_p".concat(player.id, "\"></span>");
            }
            html += "\n            </span>\n                    <span class=\"key-holder\" id=\"key-holder_p".concat(player.id, "\">\n                        <i class=\"icon icon-key\"></i>\n                        <span id=\"keycount_p").concat(player.id, "\">").concat(player.keys, "</span>\n                    </span>\n                    <span class=\"monster-holder\" id=\"monster-holder_p").concat(player.id, "\">\n                        <i id=\"icon-monster_p").concat(player.id, "\" class=\"icon icon-monster\"></i>\n                        <span id=\"monstercount_p").concat(player.id, "\"></span>\n                    </span>\n                </div>\n                <div class=\"counters\">\n                    <span class=\"ally-holder\" id=\"ally-holder_p").concat(player.id, "\">\n                        <i class=\"icon icon-ally\"></i>\n                        <span id=\"allycount_p").concat(player.id, "\"></span>\n                    </span>\n                    <span>\n                        <span class=\"lordcount-holder\" id=\"lordcount-holder_p").concat(player.id, "\">\n                            <i class=\"icon icon-lord\"></i>\n                            <span id=\"lordcount_p").concat(player.id, "\"></span>\n                        </span>\n                    </span>\n                ");
            if (gamedatas.leviathanExpansion) {
                html += "\n                    <span class=\"leviathan-holder\" id=\"leviathan-holder_p".concat(player.id, "\">\n                        <i class=\"icon leviathan-icon icon-wound\"></i>\n                        <span id=\"woundcount_p").concat(player.id, "\"></span>\n                        <i class=\"icon leviathan-icon icon-defeated-leviathan margin-left\"></i>\n                        <span id=\"defeatedleviathancount_p").concat(player.id, "\"></span>\n                    </span>\n                ");
            }
            html += "\n            </div>\n                <div class=\"monster-hand\" id=\"monster-hand_p".concat(player.id, "\"></div>\n            </div>");
            dojo.place(html, player_board_div);
            if (!gamedatas.leviathanExpansion) {
                document.getElementById("icon-monster_p".concat(playerId)).addEventListener('click', function () { return _this.onClickMonsterIcon(playerId); });
            }
            _this.pearlCounters[playerId] = new ebg.counter();
            _this.pearlCounters[playerId].create("pearlcount_p".concat(player.id));
            _this.pearlCounters[playerId].setValue(player.pearls);
            if (gamedatas.krakenExpansion) {
                _this.nebulisCounters[playerId] = new ebg.counter();
                _this.nebulisCounters[playerId].create("nebuliscount_p".concat(player.id));
                _this.nebulisCounters[playerId].setValue(player.nebulis);
            }
            _this.keyTokenCounts[playerId] = Number(player.keys);
            _this.keyFreeLordsCounts[playerId] = 0;
            _this.keyCounters[playerId] = new ebg.counter();
            _this.keyCounters[playerId].create("keycount_p".concat(player.id));
            _this.updateKeyCounter(playerId);
            _this.monsterCounters[playerId] = new ebg.counter();
            _this.monsterCounters[playerId].create("monstercount_p".concat(player.id));
            _this.monsterCounters[playerId].setValue(player.num_monsters);
            _this.allyCounters[playerId] = new ebg.counter();
            _this.allyCounters[playerId].create("allycount_p".concat(player.id));
            _this.allyCounters[playerId].setValue(player.hand_size);
            _this.lordCounters[playerId] = new ebg.counter();
            _this.lordCounters[playerId].create("lordcount_p".concat(player.id));
            _this.lordCounters[playerId].setValue(player.lords.length);
            if (gamedatas.leviathanExpansion) {
                _this.woundCounters[playerId] = new ebg.counter();
                _this.woundCounters[playerId].create("woundcount_p".concat(player.id));
                _this.woundCounters[playerId].setValue(player.wounds);
                _this.defeatedLeviathanCounters[playerId] = new ebg.counter();
                _this.defeatedLeviathanCounters[playerId].create("defeatedleviathancount_p".concat(player.id));
                _this.defeatedLeviathanCounters[playerId].setValue(player.defeatedLeviathans);
            }
            _this.monsterTokens[playerId] = new LineStock(_this.monsterManager, document.getElementById('monster-hand_p' + playerId), {
                center: false,
                gap: '2px',
            });
            _this.monsterTokens[playerId].onCardClick = function (card) { return _this.onClickMonsterIcon(playerId, card); };
            (_a = player.monsters) === null || _a === void 0 ? void 0 : _a.forEach(function (monster) {
                return _this.monsterTokens[playerId].addCards(player.monsters, undefined, {
                    visible: !!(monster.value || monster.effect)
                });
            });
            // kraken & scourge tokens
            dojo.place("<div id=\"player_board_".concat(player.id, "_figurinesWrapper\" class=\"figurinesWrapper\"></div>"), "player_board_".concat(player.id));
            if (gamedatas.kraken == playerId) {
                _this.placeFigurineToken(playerId, 'kraken');
            }
            if (gamedatas.scourge == playerId) {
                _this.placeFigurineToken(playerId, 'scourge');
            }
            // Set up scoring table in advance (helpful for testing!)
            var splitPlayerName = '';
            var chars = player.name.split("");
            for (var i in chars) {
                splitPlayerName += "<span>".concat(chars[i], "</span>");
            }
            $('scoring-row-players').innerHTML += "<td><span id=\"scoring-row-name-p".concat(playerId, "\" style=\"color:#").concat(player.color, ";\"><span>").concat(splitPlayerName, "</span></span></td>");
            $('scoring-row-location').innerHTML += "<td id=\"scoring-row-location-p".concat(playerId, "\"></td>");
            $('scoring-row-lord').innerHTML += "<td id=\"scoring-row-lord-p".concat(playerId, "\"></td>");
            $('scoring-row-affiliated').innerHTML += "<td id=\"scoring-row-affiliated-p".concat(playerId, "\"></td>");
            $('scoring-row-monster').innerHTML += "<td id=\"scoring-row-monster-p".concat(playerId, "\"></td>");
            if (gamedatas.krakenExpansion) {
                $('scoring-row-nebulis').innerHTML += "<td id=\"scoring-row-nebulis-p".concat(playerId, "\"></td>");
                $('scoring-row-kraken').innerHTML += "<td id=\"scoring-row-kraken-p".concat(playerId, "\"></td>");
            }
            if (gamedatas.leviathanExpansion) {
                $('scoring-row-wound').innerHTML += "<td id=\"scoring-row-wound-p".concat(playerId, "\"></td>");
                $('scoring-row-scourge').innerHTML += "<td id=\"scoring-row-scourge-p".concat(playerId, "\"></td>");
            }
            $('scoring-row-total').innerHTML += "<td id=\"scoring-row-total-p".concat(playerId, "\"></td>");
        });
    };
    Abyss.prototype.updateKeyCounter = function (playerId) {
        this.keyCounters[playerId].setValue(this.keyTokenCounts[playerId] + this.keyFreeLordsCounts[playerId]);
        this.setTooltip("key-holder_p".concat(playerId), _('Keys (${keyTokens} key token(s) + ${keyFreeLords} key(s) from free Lords)')
            .replace('${keyTokens}', this.keyTokenCounts[playerId])
            .replace('${keyFreeLords}', this.keyFreeLordsCounts[playerId]));
    };
    Abyss.prototype.setPearlCount = function (playerId, count) {
        this.pearlCounters[playerId].setValue(count);
    };
    Abyss.prototype.setNebulisCount = function (playerId, count) {
        var _a;
        (_a = this.nebulisCounters[playerId]) === null || _a === void 0 ? void 0 : _a.setValue(count);
    };
    Abyss.prototype.incMonsterCount = function (playerId, inc) {
        this.monsterCounters[playerId].setValue(this.monsterCounters[playerId].getValue() + inc);
    };
    Abyss.prototype.incAllyCount = function (playerId, inc) {
        this.allyCounters[playerId].setValue(this.allyCounters[playerId].getValue() + inc);
    };
    Abyss.prototype.incLordCount = function (playerId, inc) {
        this.lordCounters[playerId].setValue(this.lordCounters[playerId].getValue() + inc);
    };
    Abyss.prototype.placeFigurineToken = function (playerId, type) {
        var figurineToken = document.getElementById("".concat(type, "Token"));
        if (figurineToken) {
            if (playerId == 0) {
                this.fadeOutAndDestroy(figurineToken);
            }
            else {
                this.animationManager.attachWithAnimation(new BgaSlideAnimation({
                    element: figurineToken,
                }), document.getElementById("player_board_".concat(playerId, "_figurinesWrapper")));
            }
        }
        else {
            if (playerId != 0) {
                dojo.place("<div id=\"".concat(type, "Token\" class=\"token\"></div>"), "player_board_".concat(playerId, "_figurinesWrapper"));
                var tooltip = null;
                if (type === 'kraken') {
                    tooltip = _("The Kraken figure allows players to identify, during the game, the most corrupt player. The figure is given to the first player to receive any Nebulis. As soon as an opponent ties or gains more Nebulis than the most corrupt player, they get the Kraken figure");
                }
                else if (type === 'scourge') {
                    tooltip = _("If you are the first player to kill a Leviathan, take the Scourge of the Abyss. As soon as an opponent reaches or exceeds the number of Leviathans killed by the most valorous defender, they take the statue from the player who currently holds it. The player who owns the statue at the end of the game gains 5 Influence Points.");
                }
                if (tooltip) {
                    this.setTooltip("".concat(type, "Token"), tooltip);
                }
            }
        }
    };
    Abyss.prototype.getSentinelToken = function (playerId, lordId) {
        var div = document.getElementById("sentinel-".concat(lordId));
        if (!div) {
            div = document.createElement('div');
            div.id = "sentinel-".concat(lordId);
            div.classList.add('sentinel-token');
            div.dataset.lordId = "".concat(lordId);
            div.dataset.currentPlayer = (playerId == this.getPlayerId()).toString();
        }
        return div;
    };
    Abyss.prototype.placeSentinelToken = function (playerId, lordId, location, locationArg) {
        var sentinel = this.getSentinelToken(playerId, lordId);
        var parentElement = sentinel.parentElement;
        switch (location) {
            case 'player':
                var sentinelsElement = document.getElementById("player-panel-".concat(playerId, "-sentinels"));
                if (sentinelsElement) {
                    sentinelsElement.appendChild(sentinel);
                    if (parentElement) {
                        this.animationManager.attachWithAnimation(new BgaSlideAnimation({
                            element: sentinel,
                        }), sentinelsElement);
                    }
                }
                break;
            case 'lord':
                var lordElement = this.lordManager.getCardElement({ lord_id: locationArg });
                if (lordElement) {
                    lordElement.appendChild(sentinel);
                    if (parentElement) {
                        this.animationManager.attachWithAnimation(new BgaSlideAnimation({
                            element: sentinel,
                        }), lordElement);
                    }
                }
                break;
            case 'council':
                var councilElement = document.getElementById("council-track-".concat(locationArg));
                if (councilElement) {
                    councilElement.appendChild(sentinel);
                    if (parentElement) {
                        this.animationManager.attachWithAnimation(new BgaSlideAnimation({
                            element: sentinel,
                        }), councilElement);
                    }
                }
                break;
            case 'location':
                var locationElement = this.locationManager.getCardElement({ location_id: locationArg });
                if (locationElement) {
                    locationElement.appendChild(sentinel);
                    if (parentElement) {
                        this.animationManager.attachWithAnimation(new BgaSlideAnimation({
                            element: sentinel,
                        }), locationElement);
                    }
                }
                break;
        }
    };
    Abyss.prototype.organiseLocations = function () {
        // If on playmat:
        if (dojo.hasClass($('game-board-holder'), "playmat")) {
            // move all beyond 5 into the overflow
            var locations = this.visibleLocations.getCards();
            if (locations.length > 5) {
                this.visibleLocationsOverflow.addCards(locations.slice(5));
            }
        }
        else {
            var locations = this.visibleLocationsOverflow.getCards();
            if (locations.length > 0) {
                this.visibleLocations.addCards(locations);
            }
        }
    };
    Abyss.prototype.updateFactionPanelFromHand = function () {
        var _this = this;
        setTimeout(function () {
            var factionTotals = {};
            var factionCounts = {};
            // Initialize totals and counts for each faction
            [0, 1, 2, 3, 4].forEach(function (faction) {
                factionTotals[faction] = 0;
                factionCounts[faction] = 0;
            });
            // Include Kraken (ID 10) only if krakenExpansion is enabled
            if (_this.gamedatas.krakenExpansion) {
                factionTotals[10] = 0;
                factionCounts[10] = 0;
            }
            // Get all allies in the player's hand using AllyManager
            var allies = _this.allyManager.getAlliesInHand();
            // Sum the values and count the cards for each faction
            allies.forEach(function (ally) {
                if (ally.faction in factionTotals) {
                    factionTotals[ally.faction] += ally.value;
                    factionCounts[ally.faction] += 1;
                }
            });
            // Update the UI
            Object.keys(factionTotals).forEach(function (faction) {
                var totalElement = document.getElementById("faction-total-".concat(faction));
                var countElement = document.getElementById("faction-count-".concat(faction));
                if (totalElement) {
                    totalElement.textContent = factionTotals[faction].toString();
                }
                if (countElement) {
                    countElement.textContent = factionCounts[faction].toString();
                }
            });
            // Hide Kraken row if krakenExpansion is disabled
            if (!_this.gamedatas.krakenExpansion) {
                var krakenRow = document.getElementById('kraken-faction');
                if (krakenRow) {
                    krakenRow.style.display = 'none';
                }
            }
        }, 1000); // Delay of 1 second
    };
    ///////////////////////////////////////////////////
    //// Player's action
    /*

        Here, you are defining methods to handle player's action (ex: results of mouse click on
        game objects).

        Most of the time, these methods:
        _ check the action is possible at this game state.
        _ make a call to the game server

    */
    Abyss.prototype.onDiscard = function () {
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(function (node) {
            return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });
        this.discardAllies(ally_ids);
    };
    Abyss.prototype.onRecruit = function (withNebulis) {
        if (!this.checkAction('pay')) {
            return;
        }
        var ally_ids = [];
        dojo.query("#player-hand .ally.selected").forEach(function (node) {
            ally_ids.push(+dojo.attr(node, 'data-ally-id'));
        });
        this.takeAction('pay', {
            ally_ids: ally_ids.join(';'),
            withNebulis: withNebulis,
        });
    };
    Abyss.prototype.onChooseAffiliate = function (evt) {
        if (!this.checkAction('affiliate')) {
            return;
        }
        var ally_id = +evt.currentTarget.id.replace('button_affiliate_', '');
        this.takeAction('affiliate', {
            ally_id: ally_id,
        });
    };
    Abyss.prototype.cancelRecruit = function () {
        if (!this.checkAction('cancelRecruit')) {
            return;
        }
        this.takeAction('cancelRecruit');
    };
    Abyss.prototype.onClickCouncilTrack = function (evt) {
        if (dojo.hasClass(evt.target, 'ally')) {
            // Draw this stack??
            dojo.stopEvent(evt);
            var faction = dojo.attr(evt.target, 'data-faction');
            if (this.gamedatas.gamestate.name === 'chooseCouncilStackMonsterToken') {
                this.takeAction('actChooseCouncilStackMonsterToken', { faction: faction });
                return;
            }
            else if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(2, faction);
                return;
            }
            else if (this.gamedatas.gamestate.name === 'placeKraken') {
                this.placeKraken(faction);
                return;
            }
            if (!this.checkAction('requestSupport')) {
                return;
            }
            this.takeAction('requestSupport', {
                faction: faction,
            });
        }
    };
    Abyss.prototype.onClickPlayerLocation = function (location) {
        var target = this.locationManager.getCardElement(location);
        if (!dojo.hasClass(target, 'location-back')) {
            if (this.gamedatas.gamestate.name === 'placeSentinel') {
                this.placeSentinel(3, location.location_id);
                return;
            }
            if (!this.checkAction('chooseLocation')) {
                return;
            }
            // If you select Black Smokers with an empty deck, warn!
            if (location.location_id == 10) {
                var location_deck = dojo.query('.location.location-back')[0];
                var location_deck_size = +dojo.attr(location_deck, 'data-size');
                if (location_deck_size == 0) {
                    this.confirmationDialog(_('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch(this, function () {
                        this.chooseLocation(location.location_id);
                    }));
                    return;
                }
            }
            this.chooseLocation(location.location_id);
        }
    };
    Abyss.prototype.onVisibleLocationClick = function (location) {
        var location_id = location.location_id;
        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(3, location_id);
            return;
        }
        if (!this.checkAction('chooseLocation')) {
            return;
        }
        // If you select Black Smokers with an empty deck, warn!
        if (location_id == 10) {
            var location_deck = dojo.query('.location.location-back')[0];
            var location_deck_size = +dojo.attr(location_deck, 'data-size');
            if (location_deck_size == 0) {
                this.confirmationDialog(_('Are you sure you want to select this Location? There are no Locations left in the deck.'), dojo.hitch(this, function () {
                    this.chooseLocation(location_id);
                }));
                return;
            }
        }
        this.chooseLocation(location_id);
    };
    Abyss.prototype.chooseLocation = function (locationId) {
        var _this = this;
        var lord_ids = this.getCurrentPlayerTable().getFreeLords(true)
            .filter(function (lord) { return _this.lordManager.getCardElement(lord).classList.contains('selected'); })
            .map(function (lord) { return lord.lord_id; });
        this.takeAction('chooseLocation', {
            location_id: locationId,
            lord_ids: lord_ids.join(';'),
        });
    };
    Abyss.prototype.onVisibleLordClick = function (lord) {
        if (this.gamedatas.gamestate.name === 'placeSentinel') {
            this.placeSentinel(1, lord.lord_id);
        }
        else {
            this.recruit(lord.lord_id);
        }
    };
    Abyss.prototype.onLeviathanClick = function (card) {
        if (this.gamedatas.gamestate.name === 'chooseLeviathanToFight') {
            this.takeAction('actChooseLeviathanToFight', { id: card.id });
        }
        else if (this.gamedatas.gamestate.name === 'lord208') {
            this.takeAction('actRemoveHealthPointToLeviathan', { id: card.id });
        }
    };
    Abyss.prototype.onLeviathanTrackSlotClick = function (slot) {
        if (this.gamedatas.gamestate.name === 'lord210') {
            this.takeAction('actChooseFreeSpaceForLeviathan', { slot: slot });
        }
    };
    Abyss.prototype.recruit = function (lordId) {
        if (!this.checkAction('recruit')) {
            return;
        }
        this.takeAction('recruit', {
            lord_id: lordId,
        });
    };
    Abyss.prototype.onClickExploreDeck = function (evt) {
        dojo.stopEvent(evt);
        this.exploreDeck();
    };
    Abyss.prototype.exploreDeck = function () {
        if (!this.checkAction('explore')) {
            return;
        }
        this.takeAction('explore');
    };
    Abyss.prototype.onVisibleAllyClick = function (ally) {
        if (this.checkAction('purchase', true)) {
            this.onPurchase(0); // TODO BGA ?
            return;
        }
        this.exploreTake(ally.place);
    };
    Abyss.prototype.exploreTake = function (slot) {
        if (!this.checkAction('exploreTake')) {
            return;
        }
        this.takeAction('exploreTake', {
            slot: slot,
        });
    };
    Abyss.prototype.onPurchase = function (withNebulis) {
        if (!this.checkAction('purchase')) {
            return;
        }
        this.takeAction('purchase', {
            withNebulis: withNebulis
        });
    };
    Abyss.prototype.onPass = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('pass')) {
            return;
        }
        this.takeAction('pass');
    };
    Abyss.prototype.onPlot = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('plot')) {
            return;
        }
        this.takeAction('plot');
    };
    Abyss.prototype.onChooseMonsterReward = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('chooseReward')) {
            return;
        }
        var option = +evt.currentTarget.id.replace("button_reward_", '');
        this.takeAction('chooseReward', {
            option: option,
        });
    };
    Abyss.prototype.updateRecruitButtonsState = function (args) {
        var playerPearls = args.pearls;
        var playerNebulis = args.nebulis;
        // const diversity = args.lord.diversity;
        var selectedAllies = this.getCurrentPlayerTable().getSelectedAllies();
        var value = selectedAllies.map(function (ally) { return ally.value; }).reduce(function (a, b) { return Number(a) + Number(b); }, 0);
        // const krakens = selectedAllies.filter(ally => ally.faction == 10).length;
        var shortfall = Math.max(0, args.cost - value);
        // console.log(args, value, shortfall);
        // Update "Recruit" button
        var recruitButton = document.getElementById('button_recruit');
        recruitButton.innerHTML = _('Recruit') + ' (' + shortfall + ' <i class="icon icon-pearl"></i>)';
        recruitButton.classList.toggle('disabled', shortfall > playerPearls);
        [1, 2].forEach(function (i) {
            var button = document.getElementById("button_recruit_with".concat(i, "Nebulis"));
            if (button) {
                var cost = shortfall;
                button.innerHTML = _('Recruit') + " (".concat(cost - i > 0 ? "".concat(cost - i, " <i class=\"icon icon-pearl\"></i> ") : '').concat(i, " <i class=\"icon icon-nebulis\"></i>)");
                var canPayShortFallWithNebulis = playerNebulis >= i && playerPearls >= (cost - i) && i <= shortfall;
                if (canPayShortFallWithNebulis && !args.canAlwaysUseNebulis && playerPearls != cost - i) {
                    canPayShortFallWithNebulis = false;
                }
                button.classList.toggle('disabled', !canPayShortFallWithNebulis);
            }
        });
    };
    Abyss.prototype.onClickPlayerHand = function (ally) {
        if (this.gamedatas.gamestate.name === 'applyLeviathanDamage') {
            if (this.gamedatas.gamestate.args.penalty === 3) {
                // Multi-discard: select, otherwise just discard this one
                this.allyManager.getCardElement(ally).classList.toggle('selected');
                var ally_ids = [];
                dojo.query("#player-hand .ally.selected").forEach(function (node) {
                    return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
                });
                document.getElementById('button_discard').classList.toggle('disabled', ally_ids.length != this.gamedatas.gamestate.args.number);
            }
        }
        else if (this.gamedatas.gamestate.name === 'chooseAllyToFight') {
            this.bgaPerformAction('actChooseAllyToFight', { id: ally.ally_id });
        }
        else if (this.checkAction('pay', true)) {
            this.allyManager.getCardElement(ally).classList.toggle('selected');
            this.updateRecruitButtonsState(this.gamedatas.gamestate.args);
        }
        else if (this.checkAction('discard', true)) {
            // Multi-discard: select, otherwise just discard this one
            this.allyManager.getCardElement(ally).classList.toggle('selected');
            if (this.gamedatas.gamestate.name === 'martialLaw') {
                var ally_ids = [];
                dojo.query("#player-hand .ally.selected").forEach(function (node) {
                    return ally_ids.push(+dojo.attr(node, 'data-ally-id'));
                });
                document.getElementById('button_discard').classList.toggle('disabled', !ally_ids.length);
            }
            // Discard this card directly?
            // var ally_id = dojo.attr(evt.target, 'data-ally-id');
            // (this as any).ajaxcall( "/abyss/abyss/discard.html", { lock: true, ally_ids: ally_id }, this,
            //   function( result ) {},
            //   function( is_error) {}
            // );
        }
        else if (this.checkAction('selectAlly', true)) {
            this.takeAction('selectAlly', {
                ally_id: ally.ally_id
            });
        }
    };
    Abyss.prototype.onClickMonsterIcon = function (playerId, monster) {
        var _a;
        if (['revealMonsterToken', 'chooseRevealReward'].includes(this.gamedatas.gamestate.name)) {
            if (monster.type != 1) {
                this.showMessage(_("You can only reveal Leviathan monster tokens"), 'error');
            }
            else {
                this.takeAction('actRevealReward', { id: monster.monster_id });
            }
        }
        else if (this.checkAction('chooseMonsterTokens')) {
            this.takeAction('chooseMonsterTokens', {
                player_id: playerId,
                type: (_a = monster === null || monster === void 0 ? void 0 : monster.type) !== null && _a !== void 0 ? _a : 0,
            });
        }
    };
    Abyss.prototype.onClickPlayerFreeLord = function (lord) {
        if (this.gamedatas.gamestate.name === 'applyLeviathanDamage') {
            if (this.gamedatas.gamestate.args.penalty === 4) {
                this.takeAction('actDiscardLordLeviathanDamage', { id: lord.lord_id });
            }
        }
        else if (this.checkAction('selectLord', true)) {
            this.takeAction('selectLord', {
                lord_id: lord.lord_id
            });
        }
        else if (this.checkAction('lordEffect', true)) {
            this.takeAction('lordEffect', {
                lord_id: lord.lord_id
            });
        }
        else if (this.checkAction('chooseLocation', true)) {
            var target = this.lordManager.getCardElement(lord);
            // Only allow this on your own Lords
            var panel = target.closest('.player-panel');
            if (panel.id == "player-panel-" + this.getPlayerId()) {
                dojo.toggleClass(target, "selected");
            }
        }
    };
    Abyss.prototype.onClickPlayerLockedLord = function (lord) {
        var target = this.lordManager.getCardElement(lord);
        if (target.classList.contains('selectable') && this.gamedatas.gamestate.name === 'lord116') {
            this.freeLord(lord.lord_id);
            return;
        }
    };
    Abyss.prototype.onUpdateAutopass = function () {
        var autopass = "";
        for (var faction = 0; faction < 6; faction++) {
            var max = 0;
            for (var j = 0; j <= 5; j++) {
                if ($('autopass-' + faction + '-' + j).checked) {
                    max = j;
                }
                else {
                    break;
                }
            }
            if (autopass.length > 0) {
                autopass += ";";
            }
            autopass += "" + max;
        }
        this.takeNoLockAction('setAutopass', {
            autopass: autopass,
        });
    };
    Abyss.prototype.onDrawLocation = function (evt) {
        dojo.stopEvent(evt);
        if (!this.checkAction('drawLocations')) {
            return;
        }
        var num = +evt.currentTarget.id.replace('button_draw_', '');
        this.takeAction('drawLocations', {
            num: num,
        });
    };
    Abyss.prototype.payMartialLaw = function () {
        if (!this.checkAction('payMartialLaw')) {
            return;
        }
        this.takeAction('payMartialLaw');
    };
    Abyss.prototype.searchSanctuary = function () {
        if (!this.checkAction('searchSanctuary')) {
            return;
        }
        this.takeAction('searchSanctuary');
    };
    Abyss.prototype.stopSanctuarySearch = function () {
        if (!this.checkAction('stopSanctuarySearch')) {
            return;
        }
        this.takeAction('stopSanctuarySearch');
    };
    Abyss.prototype.takeAllyFromDiscard = function (id) {
        if (!this.checkAction('takeAllyFromDiscard')) {
            return;
        }
        this.takeAction('takeAllyFromDiscard', {
            id: id,
        });
    };
    Abyss.prototype.freeLord = function (id) {
        if (!this.checkAction('freeLord')) {
            return;
        }
        this.takeAction('freeLord', {
            id: id,
        });
    };
    Abyss.prototype.selectAllyRace = function (faction) {
        if (!this.checkAction('selectAllyRace')) {
            return;
        }
        this.takeAction('selectAllyRace', {
            faction: faction,
        });
    };
    Abyss.prototype.discardAllies = function (ids) {
        if (!this.checkAction('discard')) {
            return;
        }
        this.takeAction('discard', {
            ally_ids: ids.join(';'),
        });
    };
    Abyss.prototype.giveKraken = function (playerId) {
        if (!this.checkAction('giveKraken')) {
            return;
        }
        this.takeAction('giveKraken', {
            playerId: playerId,
        });
    };
    Abyss.prototype.goToPlaceSentinel = function () {
        if (!this.checkAction('goToPlaceSentinel')) {
            return;
        }
        this.takeAction('goToPlaceSentinel');
    };
    Abyss.prototype.placeSentinel = function (location, locationArg) {
        if (!this.checkAction('placeSentinel')) {
            return;
        }
        this.takeAction('placeSentinel', {
            location: location,
            locationArg: locationArg,
        });
    };
    Abyss.prototype.giveNebulisTo = function (playersIds) {
        if (!this.checkAction('giveNebulisTo')) {
            return;
        }
        this.takeAction('giveNebulisTo', {
            playersIds: playersIds.join(';'),
        });
    };
    Abyss.prototype.placeKraken = function (faction) {
        if (!this.checkAction('placeKraken')) {
            return;
        }
        this.takeAction('placeKraken', {
            faction: faction
        });
    };
    Abyss.prototype.takeAction = function (action, data) {
        this.bgaPerformAction(action, data);
    };
    Abyss.prototype.takeNoLockAction = function (action, data) {
        this.bgaPerformAction(action, data, { lock: false, checkAction: false });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your abyss.game.php file.

    */
    Abyss.prototype.setupNotifications = function () {
        var _this = this;
        var num_players = Object.keys(this.gamedatas.players).length;
        var notifs = [
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
        notifs.forEach(function (notif) {
            var notifName = notif[0];
            dojo.subscribe(notifName, _this, function (notifDetails) {
                log("notif_".concat(notifName), notifDetails.args);
                _this["notif_".concat(notifName)](notifDetails /*.args*/);
            });
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Abyss.prototype.setScoringArrowRow = function (stage) {
        dojo.query('#game-scoring .arrow').style('visibility', 'hidden');
        dojo.query('.arrow', $('scoring-row-' + stage)).style('visibility', 'visible');
    };
    Abyss.prototype.setScoringRowText = function (stage, player_id, value) {
        $('scoring-row-' + stage + '-p' + player_id).innerHTML = value;
        if (stage === 'total') {
            this.scoreCtrl[player_id].toValue(value);
        }
    };
    Abyss.prototype.setScoringRowWinner = function (winner_ids, lines) {
        var _loop_8 = function (i) {
            var player_id = winner_ids[i];
            dojo.addClass($('scoring-row-name-p' + player_id), 'wavetext');
            lines.forEach(function (stage) {
                return dojo.style($('scoring-row-' + stage + '-p' + player_id), { 'backgroundColor': 'rgba(255, 215, 0, 0.3)' });
            });
        };
        for (var i in winner_ids) {
            _loop_8(i);
        }
    };
    Abyss.prototype.notif_finalRound = function (notif) {
        var playerId = notif.args.player_id;
        this.gamedatas.game_ending_player = playerId;
        dojo.style($('last-round'), { 'display': 'block' });
    };
    Abyss.prototype.notif_endGame_scoring = function (notif) {
        var _this = this;
        var breakdowns = notif.args.breakdowns;
        var winnerIds = notif.args.winner_ids;
        // Don't show the "final round" message if at the actual end
        dojo.style($('last-round'), { 'display': 'none' });
        dojo.style($('game-scoring'), { 'display': 'block' });
        var currentTime = 0;
        var lines = ['location', 'lord', 'affiliated', 'monster'];
        if (this.gamedatas.krakenExpansion) {
            lines.push('nebulis', 'kraken');
        }
        if (this.gamedatas.leviathanExpansion) {
            lines.push('wound', 'scourge');
        }
        lines.push('total');
        log(breakdowns);
        lines.forEach(function (stage) {
            var breakdownStage = stage + '_points';
            if (stage == 'total') {
                breakdownStage = 'score';
            }
            // Set arrow to here
            setTimeout(_this.setScoringArrowRow.bind(_this, stage), currentTime);
            for (var player_id in _this.gamedatas.players) {
                setTimeout(_this.setScoringRowText.bind(_this, stage, player_id, breakdowns[player_id][breakdownStage]), currentTime);
                currentTime += 1000;
            }
        });
        // Set winner to be animated!
        currentTime -= 500;
        setTimeout(this.setScoringRowWinner.bind(this, winnerIds, lines), currentTime);
    };
    Abyss.prototype.notif_useLord = function (notif) {
        var lordCard = this.lordManager.getCardElement({ lord_id: notif.args.lord_id });
        lordCard.dataset.used = '1';
        lordCard.classList.remove('unused');
    };
    Abyss.prototype.notif_refreshLords = function () {
        dojo.query(".lord").forEach(function (node) { return dojo.setAttr(node, "data-used", "0"); });
    };
    Abyss.prototype.notif_score = function (notif) {
        var score = notif.args.score;
        var player_id = notif.args.player_id;
        this.scoreCtrl[player_id].toValue(score);
    };
    Abyss.prototype.notif_control = function (notif) {
        var location = notif.args.location;
        var lords = notif.args.lords;
        var player_id = notif.args.player_id;
        var add_lords = notif.args.add_lords;
        // Add the location to the player board
        this.getPlayerTable(player_id).addLocation(location, lords, false, add_lords);
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
        // Add active lords panel - update since lords were moved to the location
        var playerTable = this.getPlayerTable(player_id);
        if (playerTable) {
            // Get the current lords from the visual elements instead of stale gamedatas
            var currentLords = playerTable.getFreeLords();
            playerTable.setupActiveLordsPanel(currentLords);
        }
    };
    Abyss.prototype.notif_loseLocation = function (notif) {
        var location_id = notif.args.location_id;
        var player_id = notif.args.player_id;
        // Delete the location/lords
        this.getPlayerTable(player_id).removeLocation({ location_id: location_id });
        this.lordManager.updateLordKeys(player_id);
        this.organisePanelMessages();
        // Add active lords panel
        var playerTable = this.getPlayerTable(player_id);
        if (playerTable) {
            // Get the current lords from the visual elements instead of stale gamedatas
            var currentLords = playerTable.getFreeLords();
            playerTable.setupActiveLordsPanel(currentLords);
        }
    };
    Abyss.prototype.notif_newLocations = function (notif) {
        var locations = notif.args.locations;
        var deck_size = notif.args.deck_size;
        this.visibleLocations.addCards(locations, {
            fromElement: document.querySelector('.location.location-back'),
            originalSide: 'back',
        });
        this.organiseLocations();
        this.setDeckSize(dojo.query('#locations-holder .location-back'), deck_size);
    };
    Abyss.prototype.notif_disable = function (notif) {
        var lord_id = notif.args.lord_id;
        this.lordManager.getCardElement({ lord_id: lord_id }).classList.add('disabled');
        for (var player_id in this.gamedatas.players) {
            this.lordManager.updateLordKeys(Number(player_id));
        }
        // Add active lords panel - update all player tables since any lord could be affected
        for (var player_id in this.gamedatas.players) {
            var playerTable = this.getPlayerTable(Number(player_id));
            if (playerTable) {
                // Get the current lords from the visual elements instead of stale gamedatas
                var currentLords = playerTable.getFreeLords();
                playerTable.setupActiveLordsPanel(currentLords);
            }
        }
    };
    Abyss.prototype.notif_allyDeckShuffle = function (notif) {
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.allyDiscardCounter.setValue(0);
    };
    Abyss.prototype.notif_lootReward = function (notif) {
        var playerId = notif.args.player_id;
        this.setPearlCount(playerId, notif.args.playerPearls);
        this.incMonsterCount(playerId, notif.args.monsters);
        this.keyTokenCounts[playerId] += notif.args.keys;
        this.updateKeyCounter(playerId);
    };
    Abyss.prototype.notif_monsterReward = function (notif) {
        this.notif_lootReward(notif);
        this.notif_setThreat({ args: { threat: 0 } });
    };
    Abyss.prototype.notif_monsterTokens = function (notif) {
        this.monsterTokens[this.getPlayerId()].addCards(notif.args.monsters);
    };
    Abyss.prototype.notif_removeMonsterToken = function (notif) {
        this.incMonsterCount(notif.args.playerId, -1);
        this.monsterTokens[notif.args.playerId].removeCard(notif.args.monster);
    };
    Abyss.prototype.notif_monsterHand = function (notif) {
        var monsters = notif.args.monsters;
        var playerId = notif.args.player_id;
        this.monsterTokens[playerId].removeAll();
        this.monsterTokens[playerId].addCards(monsters);
    };
    Abyss.prototype.notif_plot = function (notif) {
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
    };
    Abyss.prototype.notif_affiliate = function (notif) {
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
    };
    Abyss.prototype.notif_explore = function (notif) {
        var ally = notif.args.ally;
        this.visibleAllies.addCard(ally, {
            fromElement: document.getElementById('explore-track-deck'),
            originalSide: 'back',
        });
        // Update ally decksize
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.lastExploreTime = new Date().getTime();
    };
    Abyss.prototype.notif_exploreTake = function (notif) {
        var _this = this;
        // If this comes right after notif_explore, we want to delay by about 1-2 seconds
        var deltaTime = this.lastExploreTime ? (new Date().getTime() - this.lastExploreTime) : 1000;
        if (deltaTime < 2000) {
            setTimeout(function () {
                return _this.notif_exploreTake_real(notif);
            }, 2000 - deltaTime);
        }
        else {
            this.notif_exploreTake_real(notif);
        }
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    };
    Abyss.prototype.notif_exploreTake_real = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var slot = notif.args.slot;
        // For each slot, animate to the council pile, fade out and destroy, then increase the council pile by 1
        var delay = 0;
        var cards = this.visibleAllies.getCards();
        var _loop_9 = function () {
            var ally = cards.find(function (ally) { return ally.place == i; });
            if (ally) {
                var faction_1 = ally.faction;
                if (faction_1 === null) {
                    // Monster just fades out
                    this_5.visibleAllies.removeCard(ally);
                    delay += 200;
                }
                else if (i != slot) {
                    if (faction_1 != 10) {
                        // Animate to the council!
                        var deck_1 = dojo.query('#council-track .slot-' + faction_1);
                        this_5.councilStacks[faction_1].addCard(ally, null, { visible: false })
                            .then(function () {
                            _this.setDeckSize(deck_1, +dojo.attr(deck_1[0], 'data-size') + 1);
                            // Update council slots count
                            _this.gamedatas.ally_council_slots[faction_1] = +dojo.attr(deck_1[0], 'data-size') + 1;
                            // Add the card to council cards data
                            if (!_this.gamedatas.ally_council_cards[faction_1]) {
                                _this.gamedatas.ally_council_cards[faction_1] = [];
                            }
                            _this.gamedatas.ally_council_cards[faction_1].push(ally);
                            // Refresh council panel if it's visible
                            _this.refreshCouncilPanel();
                        });
                        delay += 200;
                    }
                }
                else {
                    // This is the card that was taken - animate it to hand or player board
                    var theAlly_1 = this_5.allyManager.getCardElement(ally);
                    if (player_id == this_5.getPlayerId()) {
                        setTimeout(function () {
                            _this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, theAlly_1);
                            _this.incAllyCount(player_id, 1);
                        }, delay);
                        delay += 200;
                    }
                    else {
                        dojo.setStyle(theAlly_1, "zIndex", "1");
                        dojo.setStyle(theAlly_1, "transition", "none");
                        animation = this_5.slideToObject(theAlly_1, $('player_board_' + player_id), 600, delay);
                        animation.onEnd = function () {
                            _this.visibleAllies.removeCard(ally);
                            _this.incAllyCount(player_id, 1);
                        };
                        animation.play();
                        delay += 200;
                    }
                }
            }
        };
        var this_5 = this, animation;
        for (var i = 1; i <= 5; i++) {
            _loop_9();
        }
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    };
    Abyss.prototype.notif_takeAllyFromDiscard = function (notif) {
        var player_id = notif.args.player_id;
        if (player_id == this.getPlayerId()) {
            this.getPlayerTable(Number(player_id)).addHandAlly(notif.args.ally, $('game-extra'));
        }
        this.incAllyCount(player_id, 1);
        this.allyDiscardCounter.setValue(notif.args.discardSize);
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    };
    Abyss.prototype.notif_purchase = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var ally = notif.args.ally;
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
        }
        else {
            var theAlly = this.allyManager.getCardElement(ally);
            dojo.setStyle(theAlly, "zIndex", "1");
            dojo.setStyle(theAlly, "transition", "none");
            var animation = this.slideToObject(theAlly, $('player_board_' + player_id), 600);
            animation.onEnd = function () {
                _this.visibleAllies.removeCard(ally);
                _this.incAllyCount(player_id, 1);
            };
            animation.play();
        }
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
    };
    Abyss.prototype.notif_setThreat = function (notif) {
        // Update handsize and pearls of purchasing player
        var tt = $('threat-token');
        dojo.removeClass(tt, 'slot-0 slot-1 slot-2 slot-3 slot-4 slot-5');
        dojo.addClass(tt, 'slot-' + notif.args.threat);
    };
    Abyss.prototype.notif_discardCouncil = function (notif) {
        var faction = notif.args.faction;
        // Empty the council pile
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
        // Update council slots count
        this.gamedatas.ally_council_slots[faction] = 0;
        // Clear council cards data for this faction
        this.gamedatas.ally_council_cards[faction] = [];
        // Refresh council panel if it's visible
        this.refreshCouncilPanel();
    };
    Abyss.prototype.notif_requestSupport = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var num = notif.args.num;
        var deck = dojo.query('#council-track .slot-' + faction);
        this.setDeckSize(deck, 0);
        // Update council slots count
        this.gamedatas.ally_council_slots[faction] = 0;
        // Clear council cards data for this faction
        this.gamedatas.ally_council_cards[faction] = [];
        // Add cards to the player's hand
        if (player_id != this.getPlayerId()) {
            for (var i = 0; i < num; i++) {
                var anim = this.slideTemporaryObject(this.allyManager.renderBack(), 'council-track', 'council-track-' + faction, $('player_board_' + player_id), 600, i * 200);
                dojo.connect(anim, 'onEnd', function () {
                    _this.incAllyCount(player_id, 1);
                });
            }
        }
        else {
            this.incAllyCount(player_id, num);
        }
        this.organisePanelMessages();
        // Refresh council panel if it's visible
        this.refreshCouncilPanel();
    };
    Abyss.prototype.notif_requestSupportCards = function (notif) {
        var _this = this;
        var player_id = notif.args.player_id;
        var faction = notif.args.faction;
        var allies = notif.args.allies;
        // Add cards to the player's hand
        var delay = 0;
        var ROTATIONS = [-25, -10, 0, 13, 28];
        allies.forEach(function (ally) {
            setTimeout(function () {
                return _this.getPlayerTable(Number(player_id)).addHandAlly(ally, document.getElementById('council-track-' + faction), 'back', ROTATIONS[faction]);
            }, delay);
            delay += 250;
        });
    };
    Abyss.prototype.notif_moveLordsRight = function (notif) {
        this.visibleLords.addCards(notif.args.lords);
    };
    Abyss.prototype.notif_recruit = function (notif) {
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
        if (spent_lords === null || spent_lords === void 0 ? void 0 : spent_lords.length) {
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
        // Add active lords panel
        var playerTable = this.getPlayerTable(player_id);
        if (playerTable) {
            // Get the current lords from the visual elements instead of stale gamedatas
            var currentLords = playerTable.getFreeLords();
            playerTable.setupActiveLordsPanel(currentLords);
        }
    };
    Abyss.prototype.notif_discardLords = function (notif) {
        var playerId = notif.args.playerId;
        var lords = notif.args.lords;
        if (lords === null || lords === void 0 ? void 0 : lords.length) {
            this.getPlayerTable(playerId).removeLords(lords);
            this.incLordCount(playerId, -lords.length);
        }
        this.lordManager.updateLordKeys(playerId);
        this.organisePanelMessages();
        this.updateFactionPanelFromHand();
        // Add active lords panel
        var playerTable = this.getPlayerTable(playerId);
        if (playerTable) {
            // Get the current lords from the visual elements instead of stale gamedatas
            var currentLords = playerTable.getFreeLords();
            playerTable.setupActiveLordsPanel(currentLords);
        }
    };
    Abyss.prototype.notif_refillLords = function (notif) {
        var lords = notif.args.lords;
        var deck_size = notif.args.deck_size;
        this.visibleLords.addCards(lords, {
            fromElement: document.querySelector('.lord.lord-back'),
            originalSide: 'back',
        });
        this.setDeckSize(dojo.query('#lords-track .slot-0'), deck_size);
    };
    Abyss.prototype.notif_diff = function (notif) {
        var _this = this;
        var player_id = +notif.args.player_id;
        var source = notif.args.source;
        var source_player_id = null;
        if (source === null || source === void 0 ? void 0 : source.startsWith("player_")) {
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
            var currentPlayerId = this.getPlayerId();
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
                notif.args.monster.forEach(function (monster) { return _this.monsterManager.setCardVisible(monster, true); });
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
    };
    Abyss.prototype.notif_payMartialLaw = function (notif) {
        this.setPearlCount(notif.args.playerId, notif.args.playerPearls);
    };
    Abyss.prototype.notif_newLoot = function (notif) {
        this.locationManager.addLoot(notif.args.locationId, notif.args.newLoot);
    };
    Abyss.prototype.notif_highlightLootsToDiscard = function (notif) {
        this.locationManager.highlightLootsToDiscard(notif.args.locationId, notif.args.loots);
    };
    Abyss.prototype.notif_discardLoots = function (notif) {
        this.locationManager.discardLoots(notif.args.locationId, notif.args.loots);
    };
    Abyss.prototype.notif_searchSanctuaryAlly = function (notif) {
        var playerId = notif.args.playerId;
        this.getPlayerTable(playerId).addHandAlly(notif.args.ally, document.getElementById('explore-track-deck'));
        this.incAllyCount(playerId, 1);
        this.setDeckSize(dojo.query('#explore-track .slot-0'), notif.args.deck_size);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    };
    Abyss.prototype.notif_kraken = function (notif) {
        this.placeFigurineToken(notif.args.playerId, 'kraken');
    };
    Abyss.prototype.notif_scourge = function (notif) {
        this.placeFigurineToken(notif.args.playerId, 'scourge');
    };
    Abyss.prototype.notif_placeSentinel = function (notif) {
        this.placeSentinelToken(notif.args.playerId, notif.args.lordId, notif.args.location, notif.args.locationArg);
    };
    Abyss.prototype.notif_placeKraken = function (notif) {
        this.councilStacks[notif.args.faction].addCard(notif.args.ally);
        var deck = dojo.query('#council-track .slot-' + notif.args.faction);
        this.setDeckSize(deck, notif.args.deckSize);
        // Update council slots count
        this.gamedatas.ally_council_slots[notif.args.faction] = notif.args.deckSize;
        // Add the card to council cards data
        if (!this.gamedatas.ally_council_cards[notif.args.faction]) {
            this.gamedatas.ally_council_cards[notif.args.faction] = [];
        }
        this.gamedatas.ally_council_cards[notif.args.faction].push(notif.args.ally);
        // Refresh council panel if it's visible
        this.refreshCouncilPanel();
    };
    // when a Leviathan inflicts damage to the player (with action needed)
    Abyss.prototype.notif_willDiscardLeviathan = function (notif) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.leviathanManager.getCardElement(notif.args.leviathan).classList.add('fighted-leviathan');
                        return [4 /*yield*/, sleep(1500)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // when a Leviathan inflicts damage to the player
    Abyss.prototype.notif_discardLeviathan = function (notif) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.leviathanManager.getCardElement(notif.args.leviathan).classList.add('fighted-leviathan');
                        return [4 /*yield*/, sleep(2500)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.leviathanBoard.discardLeviathan(notif.args.leviathan)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Abyss.prototype.notif_newLeviathan = function (notif) {
        this.leviathanBoard.newLeviathan(notif.args.leviathan);
    };
    Abyss.prototype.notif_rollDice = function (notif) {
        this.leviathanBoard.showDice(notif.args.spot, notif.args.dice);
    };
    Abyss.prototype.notif_setCurrentAttackPower = function (notif) {
        this.leviathanBoard.setCurrentAttackPower(notif.args);
    };
    Abyss.prototype.notif_removeCurrentAttackPower = function (notif) {
        this.leviathanBoard.removeCurrentAttackPower();
    };
    Abyss.prototype.notif_discardExploreMonster = function (notif) {
        this.visibleAllies.removeCard(notif.args.ally);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    };
    Abyss.prototype.notif_discardAllyTofight = function (notif) {
        if (this.getPlayerId() == notif.args.playerId) {
            this.getCurrentPlayerTable().getHand().removeCard(notif.args.ally);
        }
        this.allyCounters[notif.args.playerId].incValue(-1);
        this.allyDiscardCounter.setValue(notif.args.allyDiscardSize);
    };
    Abyss.prototype.notif_moveLeviathanLife = function (notif) {
        this.leviathanBoard.moveLeviathanLife(notif.args.leviathan);
    };
    Abyss.prototype.notif_setFightedLeviathan = function (notif) {
        var leviathan = notif.args.leviathan;
        if (leviathan) {
            this.leviathanManager.getCardElement(leviathan).classList.add('fighted-leviathan');
        }
        else {
            document.querySelectorAll('.fighted-leviathan').forEach(function (elem) { return elem.classList.remove('fighted-leviathan'); });
        }
    };
    Abyss.prototype.notif_leviathanDefeated = function (notif) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.leviathanBoard.discardLeviathan(notif.args.leviathan)];
                    case 1:
                        _a.sent();
                        this.defeatedLeviathanCounters[notif.args.playerId].toValue(notif.args.defeatedLeviathans);
                        return [2 /*return*/];
                }
            });
        });
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Abyss.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                ['die1', 'die2'].forEach(function (property) {
                    if (args[property] && typeof args[property] === 'number') {
                        args[property] = "<div class=\"log-die\" data-value=\"".concat(args[property], "\"></div>");
                    }
                });
                ['spot_numbers'].forEach(function (property) {
                    if (args[property] && typeof args[property] === 'string' && args[property][0] !== '<') {
                        args[property] = "<strong>".concat(_(args[property]), "</strong>");
                    }
                });
                if (args.council_name && typeof args.council_name !== 'string' && args.faction !== undefined) {
                    args.council_name = colorFaction(this.format_string_recursive(args.council_name.log, args.council_name.args), args.faction);
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    // Council panel methods
    Abyss.prototype.onClickViewCouncil = function (evt) {
        dojo.stopEvent(evt);
        this.showCouncilPanel();
    };
    Abyss.prototype.onClickHideCouncil = function (evt) {
        dojo.stopEvent(evt);
        this.hideCouncilPanel();
    };
    Abyss.prototype.showCouncilPanel = function () {
        var panel = document.getElementById('council-panel');
        var message = document.getElementById('council-message');
        var factions = document.getElementById('council-factions');
        // Check if there are any council cards by looking at the deck sizes
        var hasCards = this.gamedatas.ally_council_slots.some(function (count) { return count > 0; });
        if (hasCards) {
            message.style.display = 'none';
            factions.style.display = 'block';
            this.renderCouncilCards();
        }
        else {
            message.style.display = 'block';
            factions.style.display = 'none';
        }
        panel.style.display = 'block';
    };
    Abyss.prototype.hideCouncilPanel = function () {
        var panel = document.getElementById('council-panel');
        panel.style.display = 'none';
    };
    Abyss.prototype.renderCouncilCards = function () {
        var _this = this;
        var factionsContainer = document.getElementById('council-factions');
        factionsContainer.innerHTML = '';
        var factionNames = [
            'Jellyfish',
            'Crab',
            'Seahorse',
            'Shellfish',
            'Squid'
        ];
        var factionColors = [
            'purple',
            'red',
            '#999900',
            'green',
            'blue'
        ];
        var _loop_10 = function (faction) {
            var cards = this_6.gamedatas.ally_council_cards[faction] || [];
            var count = cards.length;
            if (count > 0) {
                var factionDiv = document.createElement('div');
                factionDiv.className = "council-faction faction-".concat(faction);
                var header = document.createElement('div');
                header.className = 'faction-header';
                header.style.color = factionColors[faction];
                header.textContent = "".concat(factionNames[faction], " (").concat(count, ")");
                var cardsContainer_1 = document.createElement('div');
                cardsContainer_1.className = 'faction-cards';
                // Show actual card details if available, otherwise show placeholders
                cards.forEach(function (card, i) {
                    var cardDiv = document.createElement('div');
                    cardDiv.className = 'council-card';
                    // Add faction class for coloring
                    if (card && card.faction !== null && card.faction !== undefined) {
                        cardDiv.classList.add("faction-".concat(card.faction));
                    }
                    else {
                        // Kraken cards (faction 10) or monsters
                        cardDiv.classList.add('faction-10');
                    }
                    if (card && card.value !== undefined) {
                        cardDiv.textContent = card.value.toString();
                        cardDiv.title = "".concat(factionNames[faction], " - Value: ").concat(card.value);
                        // Add tooltip with card details
                        _this.setTooltip(cardDiv, _this.allyManager.renderTooltip(card));
                    }
                    else {
                        cardDiv.textContent = '?';
                        cardDiv.title = "".concat(factionNames[faction], " - Card ").concat(i + 1);
                    }
                    cardsContainer_1.appendChild(cardDiv);
                });
                factionDiv.appendChild(header);
                factionDiv.appendChild(cardsContainer_1);
                factionsContainer.appendChild(factionDiv);
            }
        };
        var this_6 = this;
        for (var faction = 0; faction <= 4; faction++) {
            _loop_10(faction);
        }
    };
    Abyss.prototype.refreshCouncilPanel = function () {
        var panel = document.getElementById('council-panel');
        if (panel && panel.style.display !== 'none') {
            this.showCouncilPanel();
        }
    };
    return Abyss;
}());
