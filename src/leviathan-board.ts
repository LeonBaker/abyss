const SLOTS_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 99];

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

class LeviathanBoard {
    public playerId: number;

    private stock: SlotStock<AbyssLeviathan>;
    private diceManager: AbyssDiceManager;
    private diceStock: LineDiceStock;
    private currentAttackPowerDiceStock: LineDiceStock;

    constructor(private game: AbyssGame, gamedatas: AbyssGamedatas) {    
        this.diceManager = new AbyssDiceManager(game);
        
        const diceStockElement = document.getElementById(`leviathan-dice-stock`);
        const leviathanBoardElement = document.getElementById('leviathan-board');
        
        if (diceStockElement) {
            this.diceStock = new LineDiceStock(this.diceManager, diceStockElement, { gap: '2px' });
            diceStockElement.dataset.place = `${gamedatas.lastDieRoll[0]}`;
            const diceValues = gamedatas.lastDieRoll[1];
            const dice = diceValues.map((face, id) => ({ id, face, type: 0 }));
            this.diceStock.addDice(dice);
        }

        if (leviathanBoardElement) {
            this.stock = new SlotStock<AbyssLeviathan>(this.game.leviathanManager, leviathanBoardElement, {
                slotsIds: SLOTS_IDS, // 99 = temp space
                mapCardToSlot: card => card.place,
            });
            this.stock.addCards(gamedatas.leviathans);
            this.stock.onCardClick = card => this.game.onLeviathanClick(card);
        }

        SLOTS_IDS.forEach((slot: number) => {
            const slotDiv = document.querySelector(`#leviathan-board [data-slot-id="${slot}"]`) as HTMLDivElement;
            if (slotDiv) {
                slotDiv.addEventListener('click', () => {
                    if (slotDiv.classList.contains('selectable')) {
                        this.game.onLeviathanTrackSlotClick(slot);
                    }
                });
            }
        });

        if (gamedatas.fightedLeviathan) {
            this.game.leviathanManager.getCardElement(gamedatas.fightedLeviathan).classList.add('fighted-leviathan');
        }
        if (gamedatas.currentAttackPower) {
            this.setCurrentAttackPower(gamedatas.currentAttackPower);
        }
    }
    
    public async discardLeviathan(leviathan: AbyssLeviathan) {
        if (this.stock) {
            await scrollIntoView(document.getElementById('leviathan-track'));
            await this.stock.removeCard(leviathan);
            await sleep(500);
        }
    }
    
    public async newLeviathan(leviathan: AbyssLeviathan) {
        if (this.stock) {
            await scrollIntoView(document.getElementById('leviathan-track'));
            await this.stock.addCard(leviathan, { fromElement: document.getElementById('leviathan-track') });
        }
    }
    
    public async showDice(spot: number, diceValues: number[]) {
        const diceStockElement = document.getElementById(`leviathan-dice-stock`);
        if (diceStockElement) {
            diceStockElement.dataset.place = `${spot}`;
        }
        const dice = diceValues.map((face, id) => ({ id, face, type: 0 }));
        if (this.diceStock) {
            await this.diceStock.addDice(dice);
        }
        //await sleep(500);

        if (this.diceStock) {
            this.diceStock.rollDice(dice, {
                effect: 'rollIn',
                duration: [800, 1200]
            });
            await sleep(1200);
        }
    }
    
    public async moveLeviathanLife(leviathan: AbyssLeviathan) {
        this.game.leviathanManager.setLife(leviathan);
    }
    
    public setSelectableLeviathans(selectableLeviathans: AbyssLeviathan[] | null) {
        if (this.stock) {
            this.stock.setSelectionMode(selectableLeviathans ? 'single' : 'none', selectableLeviathans);
        }
    }
    
    public setAllSelectableLeviathans() {
        if (this.stock) {
            this.stock.setSelectionMode('single');
        }
    }
    
    public async setCurrentAttackPower(args: NotifSetCurrentAttackPowerArgs) {
        let div = document.getElementById('current-attack-power');
        const animateDice = !div;
        const dice = args.dice.map((face, id) => ({ id: -Math.floor(Math.random() * 1000000), face, type: 0 }));

        if (!div) {
            div = document.createElement('div');
            div.id = 'current-attack-power';
            const frontElement = this.game.leviathanManager.getCardElement(args.fightedLeviathan).querySelector('.front');
            if (frontElement) {
                frontElement.appendChild(div);
                div.innerHTML = `
                <div>${_('Attack:')}</div>
                <div><span style="color: transparent;">+</span> ${args.allyPower} (<i class="icon icon-ally"></i>)</div>
                <div>+ <span id="current-attack-power-dice-power">${animateDice ? '?' : args.dicePower}</span> (<div id="current-attack-power-dice"></div>)</div>
                <div id="current-attack-power-pearls"></div>
                <div id="current-attack-power-total">= ${animateDice ? '?' : args.attackPower}</div>`;

                const diceElement = document.getElementById(`current-attack-power-dice`);
                if (diceElement) {
                    this.currentAttackPowerDiceStock = new LineDiceStock(this.diceManager, diceElement, { gap: '2px' });
                    this.currentAttackPowerDiceStock.addDice(dice);
                }
            }
        }

        if (animateDice && this.currentAttackPowerDiceStock) {
            this.currentAttackPowerDiceStock.rollDice(dice, {
                effect: 'rollIn',
                duration: [800, 1200]
            });
            await sleep(1200);
            const dicePowerElement = document.getElementById('current-attack-power-dice-power');
            const totalElement = document.getElementById('current-attack-power-total');
            if (dicePowerElement) dicePowerElement.innerText = `${args.dicePower}`;
            if (totalElement) totalElement.innerHTML = `= ${args.attackPower}`;
        }

        if (dice.length > 1) {
            const grayedDiceIndex = args.dice[1] > args.dice[0] ? 0 : 1;
            const diceContainer = document.getElementById(`current-attack-power-dice`);
            if (diceContainer) {
                const diceElements = Array.from(diceContainer.querySelectorAll('.bga-dice_die'));
                if (diceElements[grayedDiceIndex]) {
                    diceElements[grayedDiceIndex].classList.add('grayed');
                }
            }
        }

        if (args.attackPower > (args.allyPower + args.dicePower)) {
            const pearlsElement = document.getElementById('current-attack-power-pearls');
            const totalElement = document.getElementById('current-attack-power-total');
            if (pearlsElement) pearlsElement.innerHTML = `+ ${args.attackPower - (args.allyPower + args.dicePower)} (<i class="icon icon-pearl"></i>)</div>`;
            if (totalElement) totalElement.innerHTML = `= ${args.attackPower}`;
        }
    }
    
    public removeCurrentAttackPower() {
        document.getElementById('current-attack-power')?.remove();
        this.currentAttackPowerDiceStock = null;
    }
}