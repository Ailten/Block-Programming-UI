
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
    }

    // create menu (div).
    #createMenu() {
        let menu = this.bpaDiv.appendChild(document.createElement('div'));
        menu.classList.add('menu-block');
        return menu;
    }
    #createGarbage() {
        let garbage = this.menu.appendChild(document.createElement('div'));
        garbage.classList.add('garbage');
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
        block.classList.add('block');
        block.addEventListener('pointerdown', this.pointerDown);
        block.addEventListener('pointerdown', this.pointerUp);
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

    // event.
    static pointerDown(evnt) {
        if(evnt.button !== 0)  // skip if it's not left click.
            return;

        let isInMenu = evnt.target.hasAttribute('is-in-menu');
        if(isInMenu) { 

            // create a new block (from menu).
            let canvas = Block.getCanvas(evnt.target);
            let blockType = evnt.target.getAttribute('block-type');
            let block = canvas.appendChild(BlockType[blockType].createElement());
            let posY = evnt.y - evnt.target.clientHeight * 0.5;  // set pos.
            let posX = evnt.x - evnt.target.clientWidth * 0.5;
            block.style.top = `${posY}px`;
            block.style.left = `${posX}px`;

            return;
        }

        evnt.target.setAttribute('grab-on', 'true');

    }
    static pointerUp(evnt) {
        evnt.target.removeAttribute('grab-on');

    }
    // todo : event pointermove
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
}

const BlockType = {
    'BlockStart': BlockStart,
};