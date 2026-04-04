
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
            myBpa.addBlockToMenu(BlockIf);
            myBpa.addBlockToMenu(BlockBoolean);

    });

    document.getElementById('button-output-test').addEventListener('click', (evnt) => {
        console.log(
            myBpa.getCode()
        );
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

    getCode(){
        return BPA.getCodeFromBpaDiv(this.bpaDiv);
    }
    static getCodeFromBpaDiv(bpaDiv) {
        let output = '';

        // get all block-list starting with a block-group event.
        Array.prototype.forEach.call(
            bpaDiv.querySelectorAll(':scope > div.block-list:has(> div[block-group=event]:first-child)'),
            (blockList, i) => {
                if(i !== 0){  // separator between event.
                    output += '\n';
                }

                // get all block under an event.
                Array.prototype.forEach.call(
                    blockList.querySelectorAll(':scope > div.block'),
                    (block, j) => {
                        let blockType = block.getAttribute('block-type');
                        output += BlockType[blockType].getCode(
                            block, 
                            (j === 0? '': Block.getTab(1))
                        );
                    }
                )

                // close the event scope.
                output += '}\n';

            }
        );

        return output;
    }

}


// ---------- Block.

var BlockType = {};

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
    static getBlock(dom) {  // get the block parent closest (or null).
        while(true){
            if(dom.classList.contains('block-programming-ui'))
                return null;
            if(dom.classList.contains('block'))
                return dom;
            dom = dom.parentNode;
        }
    }

    static isCanBeConnected() {
        return true;
    }
    static isCanBeConnectedToValueContainer() {
        return false;
    }

    static cloneContanerContend(domContainer) {
        if(!domContainer.classList.contains('fill-container'))  // container empty.
            return null;

        // contain one block.
        if(!domContainer.firstChild.classList.contains('block-list')){
            let blockType = domContainer.firstChild.getAttribute('block-type');
            return BlockType[blockType].cloneElement(domContainer.firstChild);
        }

        // contain block-list.
        let output = document.createElement('div');
        output.classList.add('block-list');
        output.style.top = '0px';
        output.style.left = '0px';
        Array.prototype.forEach.call(
            domContainer.firstChild.querySelectorAll(':scope > div.block'),
            (block) => {
                let blockType = block.getAttribute('block-type');
                output.appendChild(BlockType[blockType].cloneElement(block));
            }
        );
        return output;
    }

    static getCode(block, indent=''){
        return `${indent}// generic-block.\n`;
    }
    static getTab(amount=1){  // return char tabulation.
        return " ".repeat(amount*2);
    }

    // event.
    static pointerDown(evnt) {
        if(evnt.button !== 0)  // skip if it's not left click.
            return;
        if(evnt.target.classList.contains('can-be-grab-by')){
            let block = Block.getBlock(evnt.target);
            if(block === null)
                return;
            BlockType[block.getAttribute('block-type')].pointerDown({  // call mousedown event manually.
                target: block,
                button: evnt.button,
                y: evnt.y,
                x: evnt.x,
                isExecutedManually: true,
            });
            return;
        }
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

        // verify if is on a block value-container.
        let container = evnt.target.parentElement;
        if(container === null)
            return;
        if(container.classList.contains('fill-container')){

            let blockType = BlockType[evnt.target.getAttribute('block-type')];
            let block = blockType.cloneElement(evnt.target);
            let canvas = Block.getCanvas(evnt.target);
            canvas.appendChild(block);
            block.setAttribute('grab-on', 'true');
            let posY = evnt.y - Math.min(evnt.target.clientHeight, 40) * 0.5;  // set pos.
            let posX = evnt.x - evnt.target.clientWidth * 0.5;
            block.style.top = `${posY}px`;
            block.style.left = `${posX}px`;

            evnt.target.parentElement.removeChild(evnt.target);
            container.classList.remove('fill-container');
            container.innerText = container.getAttribute('inner-text');

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

            // place it diferently if it into a block-container.
            if(blockList.parentElement.classList.contains('fill-container')){
                blockList.parentElement.appendChild(cloneSingleBlock);
            }else{  // when block-list in canvas (directly).
                cloneSingleBlock.style.top = blockList.style.top;
                cloneSingleBlock.style.left = blockList.style.left;
                canvas.appendChild(cloneSingleBlock);
            }

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
        if(evnt.target.classList.contains('can-be-grab-by')){
            let block = Block.getBlock(evnt.target);
            if(block === null)
                return;
            BlockType[block.getAttribute('block-type')].pointerUp({
                target: block,
                clientX: evnt.clientX,
                clientY: evnt.clientY,
                isExecutedManually: true,
            });
            return;
        }
        if(!evnt.target.classList.contains('block'))
            return;

        evnt.target.removeAttribute('grab-on');
        evnt.target.removeAttribute('event-down-manually');

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

        // value or block block.
        let isBlockValue = (
            elementBehind.classList.contains('value-container') ? true:
            elementBehind.classList.contains('block-container') ? false:
            null
        );
        if(isBlockValue !== null){

            // verification.
            let blockParent = Block.getBlock(elementBehind);
            if(blockParent === null)
                return;
            let blockType = BlockType[evnt.target.getAttribute('block-type')];
            let isCanBeDrop = (
                isBlockValue? blockType.isCanBeConnectedToValueContainer():
                blockType.isCanBeConnected()
            );
            if(!isCanBeDrop)
                return;

            // insert clone in value/block-container.
            let block = blockType.cloneElement(evnt.target);
            elementBehind.innerText = '';
            elementBehind.appendChild(block);
            elementBehind.classList.add('fill-container');
            evnt.target.parentNode.removeChild(evnt.target);
            block.style.top = '0px';
            block.style.left = '0px';

            return;
        }

        // not allow to connect under a value.
        if(BlockType[elementBehind.getAttribute('block-type')].isCanBeConnectedToValueContainer())
            return;

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
        block.setAttribute('block-group', 'event');
        block.setAttribute('block-type', 'BlockStart');
        block.innerText = 'start';
        return block;
    }

    static isCanBeConnected() {
        return false;
    }
    
    static getCode(block, indent=''){
        return `${indent}function start() {\n`;
    }
}
BlockType['BlockStart'] = BlockStart;

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
        block.setAttribute('block-group', 'action');
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
        let selectRefValue = blockRef.getElementsByTagName('select')[0].value;
        Array.prototype.forEach.call(
            block.getElementsByTagName('option'),
            (option, i) => {
                if(i === 0){
                    option.removeAttribute('selected');
                }
                if(option.getAttribute('value') === selectRefValue){
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

    static getCode(block, indent='') {
        let optionSelected = block.getElementsByTagName('select')[0].selectedOptions[0];
        return `${indent}action("${optionSelected.getAttribute('value')}", "${optionSelected.innerText}");\n`;
    }
}
BlockType['BlockAction'] = BlockAction;

class BlockIf extends Block {
    constructor() {
        super();
    }

    static createElement() {
        let block = super.createElement();
        block.setAttribute('block-group', 'condition');
        block.setAttribute('block-type', 'BlockIf');

        let divLine = block.appendChild(document.createElement('div'));  // line one.
        divLine.classList.add('block-inner-line', 'show-on-grab');

        let txt = divLine.appendChild(document.createElement('div'));
        txt.classList.add('show-on-grab', 'can-be-grab-by');
        txt.innerText = 'si';

        let condition = divLine.appendChild(document.createElement('div'));
        condition.classList.add('value-container', 'drop-on');
        condition.innerText = 'condition';
        condition.setAttribute('inner-text', 'condition');

        divLine = block.appendChild(document.createElement('div'));  // line two.
        divLine.classList.add('block-inner-line', 'indent');

        let blockContainer = divLine.appendChild(document.createElement('div'));
        blockContainer.classList.add('block-container', 'drop-on');
        blockContainer.innerText = 'action';
        blockContainer.setAttribute('inner-text', 'action');

        return block;
    }
    static cloneElement(blockRef) {
        let block = super.cloneElement(blockRef);

        // clone value-container.
        let query = ':scope > div.block-inner-line:nth-child(1) > div.value-container';
        let container = blockRef.querySelector(query);
        let newContainer = block.querySelector(query);
        let containerFill = Block.cloneContanerContend(container);
        if(containerFill !== null){
            newContainer.innerText = '';
            newContainer.appendChild(containerFill);
            newContainer.classList.add('fill-container');
        }

        // clone block-container
        query = ':scope > div.block-inner-line:nth-child(2) > div.block-container';
        container = blockRef.querySelector(query);
        newContainer = block.querySelector(query);
        containerFill = Block.cloneContanerContend(container);
        if(containerFill !== null){
            newContainer.innerText = '';
            newContainer.appendChild(containerFill);
            newContainer.classList.add('fill-container');
        }

        return block;
    }

    static getCode(block, indent='') {
        // get value.
        let valueContainer = block.querySelector(':scope > div.block-inner-line:nth-child(1) > div.value-container');
        let value = 'false';
        if(valueContainer.classList.contains('fill-container')){
            let blockType = valueContainer.firstChild.getAttribute('block-type');
            value = BlockType[blockType].getCode(valueContainer.firstChild);
        }

        // get actions (block-container).
        let actionContainer = block.querySelector(':scope > div.block-inner-line:nth-child(2) > div.block-container');
        let action = '';
        if(actionContainer.classList.contains('fill-container')){
            let actionChild = actionContainer.firstChild;
            if(actionChild.classList.contains('block-list')){
                Array.prototype.forEach.call(
                    actionChild.querySelectorAll(':scope > div.block'),
                    (block) => {
                        let blockType = block.getAttribute('block-type');
                        action += BlockType[blockType].getCode(block, indent+Block.getTab(1));
                    }
                );
            }else{  // only one block action.
                let blockType = actionChild.getAttribute('block-type');
                action = BlockType[blockType].getCode(actionChild, indent+Block.getTab(1));
            }
        }

        return (
            `${indent}if(${value}) {\n`+
            `${action}`+
            `${indent}}\n`
        );
    }
}
BlockType['BlockIf'] = BlockIf;

class BlockBoolean extends Block {
    constructor(){
        super()
    }

    static isCanBeConnected() {
        return false;
    }
    static isCanBeConnectedToValueContainer() {
        return true;
    }

    static createElement() {
        let block = super.createElement();
        block.setAttribute('block-group', 'value');
        block.setAttribute('block-type', 'BlockBoolean');
        block.innerText = 'Vrai';

        let checkBox = block.appendChild(document.createElement('input'));
        checkBox.setAttribute('type', 'checkbox');
        checkBox.setAttribute('checked', 'true');
        checkBox.addEventListener('change', BlockBoolean.#eventCheckBoxClick);

        return block;
    }
    static cloneElement(blockRef) {
        let block = super.cloneElement(blockRef);

        let isChecked = blockRef.getElementsByTagName('input')[0].checked;
        block.innerText = (isChecked? 'Vrai': 'Faux');
        let checkBox = block.appendChild(document.createElement('input'));
        checkBox.setAttribute('type', 'checkbox')
        if(isChecked){
            checkBox.setAttribute('checked', 'true');
        }
        checkBox.addEventListener('change', BlockBoolean.#eventCheckBoxClick);

        return block;
    }

    static #eventCheckBoxClick(evnt) {
        let isChecked = evnt.target.checked;
        let parrent = evnt.target.parentElement;
        parrent.innerText = (isChecked? 'Vrai': 'Faux');
        let checkBox = parrent.appendChild(document.createElement('input'));
        checkBox.setAttribute('type', 'checkbox');
        if(isChecked){
            checkBox.setAttribute('checked', 'true');
        }
        checkBox.addEventListener('change', BlockBoolean.#eventCheckBoxClick);
    }

    static getCode(block, indent='') {
        return (block.getElementsByTagName('input')[0].checked? 'true': 'false');
    }
}
BlockType['BlockBoolean'] = BlockBoolean;


// todo: 
// make other block values.
// make block loop.
// (?) allow to move a list of block, the all block under (and into) the one grab-on.
