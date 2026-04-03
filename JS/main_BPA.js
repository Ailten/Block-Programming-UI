
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

        this.bpaDiv.addEventListener('pointermove', (evnt) => {
            BPA.intervalCheckGrabOn(evnt, div);
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

    static intervalCheckGrabOn(evnt, bpaDiv) {
        let blockGrab = bpaDiv.querySelector('div.block[grab-on]');
        if(blockGrab === null)  // do not track if any block is grab-on.
            return;

        // block tracking mouse if exit the canvas.
        let isMouseInCanvasRange = document.elementsFromPoint(evnt.clientX, evnt.clientY)
            .includes(bpaDiv);
        if(!isMouseInCanvasRange)
            return;

        let posY = evnt.clientY - Math.min(blockGrab.clientHeight, 40) * 0.5;  // set pos.
        let posX = evnt.clientX - blockGrab.clientWidth * 0.5;
        blockGrab.style.top = `${posY}px`;
        blockGrab.style.left = `${posX}px`;

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
        block.addEventListener('pointerup', this.pointerUp);
        return block;
    }
    static cloneElement(blockRef) {
        let block = this.createElement();
        block.style.top = blockRef.style.top;
        block.style.left = blockRef.style.left;
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
    static getBlockList(dom) {  // get the closest block-list (or null).
        while(true){
            if(dom.classList.contains('block-programming-ui'))
                return null;
            if(dom.classList.contains('block-list'))
                return dom;
            dom = dom.parentNode;
        }
    }

    static isCanBeConnected() {
        return true;
    }

    // event.
    static pointerDown(evnt) {
        if(evnt.button !== 0)  // skip if it's not left click.
            return;
        if(!evnt.target.classList.contains('block'))  // skip if click on child-block (like a select).
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
            let posY = evnt.y - Math.min(block.clientHeight, 40) * 0.5;  // set pos.
            let posX = evnt.x - block.clientWidth * 0.5;
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

        // verify if is on a block list.
        let blockList = Block.getBlockList(evnt.target);
        if(blockList === null){  // block is not into a block.

            evnt.target.setAttribute('grab-on', 'true');

            return;
        }

        // clone / pop the block from the list.
        let targetType = BlockType[evnt.target.getAttribute('block-type')];
        let canvas = Block.getCanvas(evnt.target);
        let target = canvas.appendChild(targetType.cloneElement(evnt.target));
        target.setAttribute('grab-on', 'true');
        let posY = evnt.y - Math.min(target.clientHeight, 40) * 0.5;  // set pos.
        let posX = evnt.x - target.clientWidth * 0.5;
        target.style.top = `${posY}px`;
        target.style.left = `${posX}px`;

        // pop one block from a list of two (delete block-list).
        let blockIntoList = Array.from(blockList.querySelectorAll(':scope > div.block'))
            .filter(e => e !== evnt.target);
        if(blockIntoList.length === 1){
            let singleBlockInList = blockIntoList[0];
            let singleBlockType = BlockType[singleBlockInList.getAttribute('block-type')];
            let cloneSingleBlock = singleBlockType.cloneElement(singleBlockInList);
            cloneSingleBlock.style.top = blockList.style.top;
            cloneSingleBlock.style.left = blockList.style.left;
            canvas.appendChild(cloneSingleBlock);
            blockList.style.display = 'none';  // hidde it before destroy it.
            setTimeout(() => {  // delay destroy block-list, to stay event mouse manually executing.
                blockList.parentElement.removeChild(blockList);
            }, 5);
        }

        evnt.target.parentElement.removeChild(evnt.target);  // pop.
        targetType.pointerDown({  // call mousedown event manually.
            target: target,
            button: evnt.button,
            y: evnt.y,
            x: evnt.x,
            isExecutedManually: true,
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
        let targetBlockType = BlockType[evnt.target.getAttribute('block-type')];
        let isCanBeConnected = targetBlockType.isCanBeConnected();
        if(!isCanBeConnected)
            return;

        // get (or create) block containers for block list.
        let blockContainer = elementBehind.parentElement;
        if(!blockContainer.classList.contains('block-list')){
            let divContainer = blockContainer.appendChild(document.createElement('div'));
            let blockClone = BlockType[elementBehind.getAttribute('block-type')].cloneElement(elementBehind);
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
        let target = targetBlockType.cloneElement(evnt.target);
        blockContainer.insertBefore(target, elementBehind.nextSibling);  // fake insertAfter.
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

    static isCanBeConnected() {
        return false;
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
        this.actionDico.forEach((e, i) => {
            let option = select.appendChild(document.createElement('option'));
            option.setAttribute('value', e.value);
            option.innerText = e.libele;

            // selected attribute.
            if(i === 0){
                option.setAttribute('selected', 'true');
            }
            option.addEventListener('click', this.#eventOptionClick);
        })

        return block;
    }
    static cloneElement(blockRef) {
        let block = super.cloneElement(blockRef);
        let optionsRef = blockRef.getElementsByTagName('option');
        Array.prototype.forEach.call(
            block.getElementsByTagName('option'),
            (option, i) => {
                if(i === 0){
                    option.removeAttribute('selected');
                }
                if(optionsRef[i].hasAttribute('selected')){
                    option.setAttribute('selected', 'true');
                }
                option.addEventListener('click', this.#eventOptionClick);
            }
        );
        return block;
    }

    static #eventOptionClick(evnt) {
        Array.prototype.forEach.call(
            evnt.target.parentElement.getElementsByTagName('option'),
            (option) => {
                option.removeAttribute('selected');
            }
        )
        evnt.target.setAttribute('selected', 'true');
    }
}

const BlockType = {
    'BlockStart': BlockStart,
    'BlockAction': BlockAction
};


// todo: 
// grab-on on block allow to exit the canvas.
// (?) allow to move a list of block, the all block under (and into) the one grab-on.
