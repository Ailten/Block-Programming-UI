
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

        //let block = this.menu.appendChild(document.createElement('div'));

    }
}


// ---------- Block.

class Block {
    pos;

    constructor(pos) {
        this.pos = pos;
    }
}

class BlockStart extends Block {
    constructor() {
        super([0, 0]);
        
    }
}


// events : pointerdown, pointermove, pointerup.