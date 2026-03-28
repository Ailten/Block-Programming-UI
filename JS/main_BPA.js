
// when html load.
window.addEventListener('load', () => {

    // get all div need to be cast as BPA-UI.
    Array.prototype.forEach.call(
        document.getElementsByClassName('block-programming-ui'),
        (div) => {
            
            buildBPA(div);

    });

});


// ---------->> functions.

// function to create the BPA (from the div).
function buildBPA(div) {
    buildMenu(div);
    addToMenu('start');
}

// function to create the menu of BPA.
function buildMenu(div) {
    let menu = div.appendChild(document.createElement('div'));
    menu.classList.add('menu-block');
}


// ---------->> block ref node.

const blockType = {  // fixme : make class with parent abstract.
    'start': {
        createBlock: (divDest) => {

        }
    },
    'if': {
        createBlock: (divDest) => {
            
        }
    }
};