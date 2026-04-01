
var myBpa;

// when html load.
window.addEventListener('load', () => {

    // get all div need to be cast as BPA-UI.
    Array.prototype.forEach.call(
        document.getElementsByClassName('block-programming-ui'),
        (div) => {
            
            // instantiate the main obj.
            myBpa = new BPA(div);

            // define what block allow.
            myBpa.addBlockToMenu(BlockStart);
            myBpa.addBlockToMenu(BlockAction);

    });

});


// ---------->> Class.

// Block-Programming.
class BPA {
    bpaDiv;  // div for the canvas BPA.
    menu;  // div for the menu who propose blocks.
    garbage;  // div for delete block.

    constructor(div) {
        this.bpaDiv = div;
        this.menu = this.#createMenu();
        this.garbage = this.#createGarbage();

        // event for mouse up block.
        this.bpaDiv.addEventListener('pointerup', (evnt) => {
            let isNeedRedirectEvent = (
                evnt.target.classList.contains('block') &&
                evnt.target.hasAttribute('grab-on') &&
                evnt.target.hasAttribute('event-down-manually')
            );
            if(isNeedRedirectEvent) {
                evnt.target.removeAttribute('event-down-manually');
                let blockType = evnt.target.getAttribute('block-type');
                BlockType[blockType].pointerUp({
                    target: evnt.target,
                    isExecutedManually: true,
                });
            }
        });
    }

    // create menu (div).
    #createMenu() {
        let menu = this.bpaDiv.appendChild(document.createElement('div'));
        menu.classList.add('menu-block');
        return menu;
    }
    #createGarbage() {
        let garbage = this.menu.appendChild(document.createElement('div'));
        garbage.classList.add('garbage', 'drop-on');
        garbage.innerText = "poubelle";
        return garbage;
    }

    // function to add block to menu.
    addBlockToMenu(classBlock) {
    
        let blockContainer = this.menu.appendChild(document.createElement('div'));
        let block = blockContainer.appendChild(classBlock.createElement());
        block.setAttribute('is-in-menu', 'true');
        
    }

}


// ---------- Block.

class Block {
    constructor() {
    }

    static createElement() {
        let block = document.createElement('div');
        block.classList.add('block', 'drop-on');
        block.addEventListener('pointerdown', this.pointerDown);
        block.addEventListener('pointermove', this.pointerMove);
        block.addEventListener('pointerleave', this.pointerLeave);
        block.addEventListener('pointerup', this.pointerUp);
        return block;
    }
    static getMenu(dom) {
        while(!dom.classList.contains('menu-block')){
            dom = dom.parentNode;
        }
        return dom;
    }
    static getCanvas(dom) {
        while(!dom.classList.contains('block-programming-ui')){
            dom = dom.parentNode;
        }
        return dom;
    }

    static isCanHaveDrop(isTryDropOnTop) {
        return true;
    }

    // event.
    static pointerDown(evnt) {
        if(evnt.button !== 0)  // skip if it's not left click.
            return;

        if(evnt.isExecutedManually !== undefined){
            evnt.target.setAttribute('event-down-manually', 'true');
        }

        let isInMenu = evnt.target.hasAttribute('is-in-menu');
        if(isInMenu) { 

            // create a new block (from menu).
            let canvas = Block.getCanvas(evnt.target);
            let blockType = evnt.target.getAttribute('block-type');
            let block = canvas.appendChild(BlockType[blockType].createElement());
            block.setAttribute('grab-on', 'true');
            let posY = evnt.y - evnt.target.clientHeight * 0.5;  // set pos.
            let posX = evnt.x - evnt.target.clientWidth * 0.5;
            block.style.top = `${posY}px`;
            block.style.left = `${posX}px`;
            BlockType[blockType].pointerDown({  // call mousedown event manually.
                target: block,
                button: evnt.button,
                y: evnt.y,
                x: evnt.x,
                isExecutedManually: true,
            });

            return;
        }

        evnt.target.setAttribute('grab-on', 'true');

    }
    static pointerMove(evnt) {
        if(!evnt.target.hasAttribute('grab-on'))
            return;

        // set pos.
        let posY = evnt.clientY - evnt.target.clientHeight * 0.5;
        let posX = evnt.clientX - evnt.target.clientWidth * 0.5;
        evnt.target.style.top = `${posY}px`;
        evnt.target.style.left = `${posX}px`;

    }
    static pointerLeave(evnt) {
        if(!evnt.target.hasAttribute('grab-on'))
            return;

        // call event pointerUp when leave.
        let blockType = evnt.target.getAttribute('block-type');
        BlockType[blockType].pointerUp({
            target: evnt.target,
            isExecutedManually: true
        });
    }
    static pointerUp(evnt) {
        evnt.target.removeAttribute('grab-on');
        evnt.target.removeAttribute('event-down-manually');

        if(evnt.isExecutedManually !== undefined)
            return;

        // find block 'drop-on' behind.
        let elementBehind = document.elementsFromPoint(evnt.clientX, evnt.clientY)
            .filter(e => e !== evnt.target)  // skip them self.
            .filter(e => !e.hasAttribute('is-in-menu'))  // skip menu-block.
            .find(e => e.classList.contains('drop-on'));  // maybe use a drop-on attribute with value priority.
        if(elementBehind === undefined)
            return;

        // garbage erase block.
        if(elementBehind.classList.contains('garbage')){
            evnt.target.classList.add('delete-pop-scale');
            evnt.target.addEventListener('animationend', evnt => {
                evnt.target.parentNode.removeChild(evnt.target);
            });
            return;
        }

        // verify if can be drop.
        let isDropOnTop = (evnt.clientY < elementBehind.clientY + elementBehind.clientHeight * 0.5);
        let blockType = BlockType[elementBehind.getAttribute('block-type')];
        let isDropOnValid = blockType.isCanHaveDrop(isDropOnTop);
        if(!isDropOnValid)
            return;

        // get (or create) block containers for block list.
        let blockContainer = elementBehind.parentElement;
        if(!blockContainer.classList.contains('block-list')){
            let divContainer = blockContainer.appendChild(document.createElement('div'));
            let blockClone = elementBehind.cloneNode(true);
            blockContainer.removeChild(elementBehind);
            blockContainer = divContainer;
            elementBehind = blockClone;
            blockContainer.appendChild(elementBehind);
            blockContainer.classList.add('block-list');
            blockContainer.style.top = elementBehind.style.top;
            blockContainer.style.left = elementBehind.style.left;
            elementBehind.style.top = '0px';
            elementBehind.style.left = '0px';
        }

        // move target in the block list.
        let target = evnt.target.cloneNode(true);
        if(isDropOnTop){
            blockContainer.insertBefore(target, elementBehind);
        } else {
            blockContainer.insertBefore(target, elementBehind.nextSibling);  // fake insertAfter.
        }
        evnt.target.parentNode.removeChild(evnt.target);
        target.style.top = '0px';
        target.style.left = '0px';

    }
}

class BlockStart extends Block {
    constructor() {
        super();
    }

    static createElement() {
        let block = super.createElement();
        block.classList.add('block-orange');
        block.setAttribute('block-type', 'BlockStart');
        block.innerText = 'start';
        return block;
    }

    static isCanHaveDrop(isTryDropOnTop) {
        if(isTryDropOnTop)
            return false;
        return true;
    }
}

class BlockAction extends Block {
    static actionDico = [
        {value: '1', libele: 'atk.'},
        {value: '2', libele: 'def.'},
        {value: '3', libele: 'soin'},
    ];

    constructor() {
        super();
    }

    static createElement() {
        let block = super.createElement();
        block.classList.add('block-blue');
        block.setAttribute('block-type', 'BlockAction');
        block.innerText = 'action';

        // add select.
        let select = block.appendChild(document.createElement('select'));
        this.actionDico.forEach(e => {
            let option = select.appendChild(document.createElement('option'));
            option.setAttribute('value', e.value);
            option.innerText = e.libele;
        })

        return block;
    }
}

const BlockType = {
    'BlockStart': BlockStart,
    'BlockAction': BlockAction
};


// todo: 
// actually, isCantConnect on start block not working.
// block when try to place a block "start" behind a block "action" (permission verify).
// can't re-move a block connected in a list.
// can't move a list of block.