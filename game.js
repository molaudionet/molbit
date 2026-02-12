/* ========================================
   MOLBIT GAME LOGIC
   Main game engine with proper chemistry
   ======================================== */

// ========================================
// GAME DATA & CONFIGURATION
// ========================================

const ELEMENTS = {
    'H': { name: 'Hydrogen', color: '#ffffff', valence: 1, mass: 1.008 },
    'C': { name: 'Carbon', color: '#909090', valence: 4, mass: 12.011 },
    'N': { name: 'Nitrogen', color: '#3050f8', valence: 3, mass: 14.007 },
    'O': { name: 'Oxygen', color: '#ff0d0d', valence: 2, mass: 15.999 },
    'P': { name: 'Phosphorus', color: '#ff8000', valence: 5, mass: 30.974 },
    'S': { name: 'Sulfur', color: '#ffff30', valence: 6, mass: 32.06 },
    'Cl': { name: 'Chlorine', color: '#1ff01f', valence: 1, mass: 35.45, ionic: true },
    'Na': { name: 'Sodium', color: '#ab5cf2', valence: 1, mass: 22.990, ionic: true },
    'K': { name: 'Potassium', color: '#8f40d4', valence: 1, mass: 39.098, ionic: true },
    'Ca': { name: 'Calcium', color: '#3dff00', valence: 2, mass: 40.078, ionic: true }
};

const LEVELS = [
    {
        id: 1,
        title: "Level 1: Methane",
        objective: "Build CH₄ (1 Carbon + 4 Hydrogens)",
        targetFormula: "CH4",
        elements: ['C', 'H'],
        hint: "Carbon needs 4 bonds, each Hydrogen needs 1. Make 4 C-H single bonds.",
        bondType: "covalent"
    },
    {
        id: 2,
        title: "Level 2: Water",
        objective: "Build H₂O (2 Hydrogens + 1 Oxygen)",
        targetFormula: "H2O",
        elements: ['H', 'O'],
        hint: "Oxygen needs 2 bonds. Connect 2 Hydrogens to the Oxygen.",
        bondType: "covalent"
    },
    {
        id: 3,
        title: "Level 3: Nitrogen Gas",
        objective: "Build N₂ (2 Nitrogens with triple bond)",
        targetFormula: "N2",
        elements: ['N'],
        hint: "Each Nitrogen needs 3 bonds. Use a TRIPLE bond between them.",
        bondType: "covalent"
    },
    {
        id: 4,
        title: "Level 4: Table Salt",
        objective: "Build NaCl (Sodium + Chlorine with IONIC bond)",
        targetFormula: "NaCl",
        elements: ['Na', 'Cl'],
        hint: "This is IONIC! Na gives electron to Cl. Use ionic bond (⚡).",
        bondType: "ionic"
    },
    {
        id: 5,
        title: "Level 5: Oxygen Gas",
        objective: "Build O₂ (2 Oxygens with double bond)",
        targetFormula: "O2",
        elements: ['O'],
        hint: "Each Oxygen needs 2 bonds. Use a DOUBLE bond between them.",
        bondType: "covalent"
    },
    {
        id: 6,
        title: "Free Build",
        objective: "Build any molecule you want!",
        targetFormula: null,
        elements: ['H', 'C', 'N', 'O', 'P', 'S', 'Cl', 'Na', 'K', 'Ca'],
        hint: "Experiment! Mix covalent and ionic bonds.",
        bondType: "mixed"
    }
];

// ========================================
// GAME STATE
// ========================================

const gameState = {
    currentLevel: 0,
    atoms: [],
    bonds: [],
    selectedElement: null,
    selectedBondType: 1, // 1=single, 2=double, 3=triple, 'ionic'=ionic
    tempAtom: null, // For bonding
    nextAtomId: 0,
    completeness: 0
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initLevelSelector();
    initAtomPalette();
    initBondSelector();
    initControls();
    initHelp();
    loadLevel(0);
});

function initCanvas() {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    canvas.addEventListener('click', handleCanvasClick);
    
    // Resize handler
    window.addEventListener('resize', () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        redraw();
    });
}

function initLevelSelector() {
    const selector = document.getElementById('level-selector');
    
    LEVELS.forEach((level, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = level.title;
        selector.appendChild(option);
    });
    
    selector.addEventListener('change', (e) => {
        loadLevel(parseInt(e.target.value));
    });
}

function initAtomPalette() {
    const palette = document.getElementById('atom-palette');
    
    Object.entries(ELEMENTS).forEach(([symbol, data]) => {
        const button = document.createElement('button');
        button.className = 'atom-button';
        button.dataset.element = symbol;
        button.innerHTML = `
            <span class="symbol">${symbol}</span>
            <span class="name">${data.name}</span>
        `;
        button.addEventListener('click', () => selectElement(symbol));
        palette.appendChild(button);
    });
}

function initBondSelector() {
    const buttons = document.querySelectorAll('.bond-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            selectBondType(type === 'ionic' ? 'ionic' : parseInt(type));
        });
    });
}

function initControls() {
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('submit-btn').addEventListener('click', submitMolecule);
    document.getElementById('hint-btn').addEventListener('click', showHint);
}

function initHelp() {
    document.getElementById('help-button').addEventListener('click', () => {
        document.getElementById('help-modal').classList.add('active');
    });
    
    document.getElementById('close-help').addEventListener('click', () => {
        document.getElementById('help-modal').classList.remove('active');
    });
    
    // Close on outside click
    document.getElementById('help-modal').addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            document.getElementById('help-modal').classList.remove('active');
        }
    });
}

// ========================================
// LEVEL MANAGEMENT
// ========================================

function loadLevel(levelIndex) {
    gameState.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    
    // Update UI
    document.getElementById('level-title').textContent = level.title;
    document.getElementById('level-objective').textContent = level.objective;
    document.getElementById('level-selector').value = levelIndex;
    
    // Enable/disable atom buttons
    document.querySelectorAll('.atom-button').forEach(button => {
        const symbol = button.dataset.element;
        if (level.elements.includes(symbol)) {
            button.classList.remove('disabled');
        } else {
            button.classList.add('disabled');
        }
    });
    
    // Clear canvas
    clearCanvas();
}

// ========================================
// ELEMENT & BOND SELECTION
// ========================================

function selectElement(symbol) {
    gameState.selectedElement = symbol;
    
    // Update UI
    document.querySelectorAll('.atom-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-element="${symbol}"]`).classList.add('selected');
    
    audioSystem.playAtomSound(symbol);
}

function selectBondType(type) {
    gameState.selectedBondType = type;
    
    // Update UI
    document.querySelectorAll('.bond-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const buttons = document.querySelectorAll('.bond-button');
    if (type === 'ionic') {
        buttons[3].classList.add('active'); // Ionic button
    } else {
        buttons[type - 1].classList.add('active');
    }
}

// ========================================
// CANVAS INTERACTION
// ========================================

function handleCanvasClick(event) {
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicked on existing atom
    const clickedAtom = getAtomAtPosition(x, y);
    
    if (clickedAtom) {
        handleAtomClick(clickedAtom);
    } else if (gameState.selectedElement) {
        placeAtom(x, y);
    }
}

function placeAtom(x, y) {
    const element = gameState.selectedElement;
    const data = ELEMENTS[element];
    
    const atom = {
        id: gameState.nextAtomId++,
        element: element,
        x: x,
        y: y,
        color: data.color,
        valence: data.valence,
        ionic: data.ionic || false,
        charge: null // Will be set for ionic compounds
    };
    
    gameState.atoms.push(atom);
    
    // Create visual element
    createAtomElement(atom);
    
    audioSystem.playAtomSound(element);
    createParticles(x, y, data.color);
    
    updateInfo();
}

function createAtomElement(atom) {
    const canvas = document.getElementById('canvas');
    const atomEl = document.createElement('div');
    atomEl.className = 'atom';
    atomEl.dataset.atomId = atom.id;
    atomEl.style.left = `${atom.x - 25}px`;
    atomEl.style.top = `${atom.y - 25}px`;
    atomEl.style.backgroundColor = atom.color;
    atomEl.style.color = getBestTextColor(atom.color);
    atomEl.textContent = atom.element;
    
    if (atom.ionic) {
        atomEl.classList.add('ionic');
    }
    
    canvas.appendChild(atomEl);
}

function handleAtomClick(atom) {
    if (!gameState.tempAtom) {
        // First atom - select for bonding
        gameState.tempAtom = atom;
        highlightAtom(atom);
        showNotification('Click another atom to create a bond', 'info');
    } else {
        // Second atom - create bond
        if (gameState.tempAtom.id === atom.id) {
            showNotification('Cannot bond atom to itself!', 'error');
            audioSystem.playErrorSound();
        } else {
            createBond(gameState.tempAtom, atom);
        }
        unhighlightAtom(gameState.tempAtom);
        gameState.tempAtom = null;
    }
}

function createBond(atom1, atom2) {
    const bondType = gameState.selectedBondType;
    
    // Check if bond already exists
    const existingBond = gameState.bonds.find(b => 
        (b.atom1 === atom1.id && b.atom2 === atom2.id) ||
        (b.atom1 === atom2.id && b.atom2 === atom1.id)
    );
    
    if (existingBond) {
        showNotification('Bond already exists between these atoms!', 'error');
        audioSystem.playErrorSound();
        return;
    }
    
    // Check if ionic bond is valid
    if (bondType === 'ionic') {
        if (!ELEMENTS[atom1.element].ionic && !ELEMENTS[atom2.element].ionic) {
            showNotification('Ionic bonds require ionic elements (Na, Cl, K, Ca)', 'error');
            audioSystem.playErrorSound();
            return;
        }
        
        // Set charges for ionic bond - need one positive and one negative
        const setCharge = (atom) => {
            if (atom.element === 'Na' || atom.element === 'K') {
                atom.charge = '+';
            } else if (atom.element === 'Ca') {
                atom.charge = '2+';
            } else if (atom.element === 'Cl') {
                atom.charge = '-';
            }
        };
        
        setCharge(atom1);
        setCharge(atom2);
        
        // Verify we have opposite charges
        const atom1Positive = (atom1.charge === '+' || atom1.charge === '2+');
        const atom2Positive = (atom2.charge === '+' || atom2.charge === '2+');
        
        if (atom1Positive === atom2Positive) {
            showNotification('Ionic bonds need one positive and one negative ion!', 'error');
            audioSystem.playErrorSound();
            return;
        }
    }
    
    const bond = {
        atom1: atom1.id,
        atom2: atom2.id,
        type: bondType
    };
    
    gameState.bonds.push(bond);
    
    // Create visual bond
    createBondElement(atom1, atom2, bondType);
    
    // Update atom charges if ionic - DO THIS IMMEDIATELY
    if (bondType === 'ionic') {
        updateAtomCharges();
        audioSystem.playIonicBondSound(atom1.element, atom2.element);
        showNotification(`Ionic bond created: ${atom1.element}${atom1.charge} ⚡ ${atom2.element}${atom2.charge}`, 'success');
    } else {
        audioSystem.playBondSound(atom1.element, atom2.element, bondType);
        showNotification('Covalent bond created!', 'success');
    }
    
    createParticles(
        (atom1.x + atom2.x) / 2,
        (atom1.y + atom2.y) / 2,
        bondType === 'ionic' ? '#ffe66d' : '#4ecdc4'
    );
    
    updateInfo();
}

function createBondElement(atom1, atom2, bondType) {
    const canvas = document.getElementById('canvas');
    
    const dx = atom2.x - atom1.x;
    const dy = atom2.y - atom1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    const numLines = bondType === 'ionic' ? 1 : (typeof bondType === 'number' ? bondType : 1);
    const spacing = 3;
    
    for (let i = 0; i < numLines; i++) {
        const bondEl = document.createElement('div');
        bondEl.className = 'bond-line';
        if (bondType === 'ionic') {
            bondEl.classList.add('ionic-bond');
        }
        bondEl.dataset.bondId = `${atom1.id}-${atom2.id}`;
        
        const offset = (i - (numLines - 1) / 2) * spacing;
        
        bondEl.style.left = `${atom1.x}px`;
        bondEl.style.top = `${atom1.y + offset}px`;
        bondEl.style.width = `${length}px`;
        bondEl.style.height = bondType === 'ionic' ? '2px' : '3px';
        bondEl.style.transform = `rotate(${angle}deg)`;
        
        canvas.appendChild(bondEl);
    }
}

function updateAtomCharges() {
    gameState.atoms.forEach(atom => {
        if (atom.charge) {
            const atomEl = document.querySelector(`[data-atom-id="${atom.id}"]`);
            if (atomEl) {
                let chargeEl = atomEl.querySelector('.charge');
                if (!chargeEl) {
                    chargeEl = document.createElement('div');
                    chargeEl.className = 'charge';
                    atomEl.appendChild(chargeEl);
                }
                chargeEl.textContent = atom.charge;
            }
        }
    });
}

// ========================================
// MOLECULE EVALUATION
// ========================================

function calculateCompleteness() {
    if (gameState.atoms.length === 0) return 0;
    
    let totalScore = 0;
    let maxScore = 0;
    
    gameState.atoms.forEach(atom => {
        const bondCount = getBondCount(atom.id);
        const element = ELEMENTS[atom.element];
        const valence = element.valence;
        const isIonic = element.ionic;
        
        maxScore += 100;
        
        // IONIC ELEMENTS: Just need 1 ionic bond to be complete
        if (isIonic) {
            const hasIonicBond = gameState.bonds.some(bond => 
                (bond.atom1 === atom.id || bond.atom2 === atom.id) && bond.type === 'ionic'
            );
            
            if (hasIonicBond) {
                totalScore += 100; // Perfect!
            } else if (bondCount > 0) {
                totalScore += 50; // Has bonds but not ionic
            } else {
                totalScore += 0; // No bonds
            }
        }
        // COVALENT ELEMENTS: Need correct number of bonds
        else {
            if (bondCount === valence) {
                totalScore += 100; // Perfect!
            } else if (bondCount < valence) {
                totalScore += (bondCount / valence) * 100; // Incomplete
            } else {
                totalScore += Math.max(0, 100 - ((bondCount - valence) * 30)); // Over-bonded
            }
        }
    });
    
    return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
}

function getBondCount(atomId) {
    let count = 0;
    gameState.bonds.forEach(bond => {
        if (bond.atom1 === atomId || bond.atom2 === atomId) {
            if (bond.type === 'ionic') {
                count += 1;
            } else {
                count += bond.type;
            }
        }
    });
    return count;
}

function getMolecularFormula() {
    const elementCounts = {};
    
    gameState.atoms.forEach(atom => {
        const symbol = atom.element;
        elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
    });
    
    // Sort: C, H, then alphabetically
    const sortedSymbols = Object.keys(elementCounts).sort((a, b) => {
        if (a === 'C') return -1;
        if (b === 'C') return 1;
        if (a === 'H') return -1;
        if (b === 'H') return 1;
        return a.localeCompare(b);
    });
    
    let formula = '';
    sortedSymbols.forEach(symbol => {
        formula += symbol;
        if (elementCounts[symbol] > 1) {
            formula += elementCounts[symbol];
        }
    });
    
    return formula || '';
}

function getMolecularMass() {
    let mass = 0;
    gameState.atoms.forEach(atom => {
        mass += ELEMENTS[atom.element].mass;
    });
    return mass.toFixed(3);
}

// ========================================
// UI UPDATES
// ========================================

function updateInfo() {
    // Update completeness
    const completeness = calculateCompleteness();
    gameState.completeness = completeness;
    
    const fill = document.getElementById('completeness-fill');
    const text = document.getElementById('completeness-text');
    fill.style.width = `${completeness}%`;
    text.textContent = `${Math.round(completeness)}%`;
    
    // Update formula
    const formula = getMolecularFormula();
    const formulaEl = document.getElementById('formula-display');
    if (formula) {
        formulaEl.innerHTML = formatFormula(formula);
    } else {
        formulaEl.innerHTML = '<span class="placeholder">Build a molecule...</span>';
    }
    
    // Update mass
    const mass = getMolecularMass();
    const massEl = document.getElementById('molecule-mass');
    if (gameState.atoms.length > 0) {
        massEl.textContent = `${mass} g/mol`;
    } else {
        massEl.innerHTML = '<span class="placeholder">0 g/mol</span>';
    }
    
    // Update bond count
    const bondEl = document.getElementById('bond-count');
    const bondCount = gameState.bonds.length;
    bondEl.textContent = `${bondCount} bond${bondCount !== 1 ? 's' : ''}`;
}

function formatFormula(formula) {
    // Convert numbers to subscript
    return formula.replace(/(\d+)/g, '<sub>$1</sub>');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========================================
// ACTIONS
// ========================================

function submitMolecule() {
    const level = LEVELS[gameState.currentLevel];
    const formula = getMolecularFormula();
    const completeness = gameState.completeness;
    
    // Free build mode
    if (!level.targetFormula) {
        if (completeness >= 95) {
            showNotification(`Great molecule! ${formula} is ${Math.round(completeness)}% complete!`, 'success');
            audioSystem.playSuccessSound();
        } else {
            showNotification(`Molecule is only ${Math.round(completeness)}% complete. Keep improving!`, 'info');
        }
        return;
    }
    
    // Check formula match
    if (formula === level.targetFormula && completeness >= 95) {
        showNotification(`🎉 Level Complete! ${formula} built successfully!`, 'success');
        audioSystem.playSuccessSound();
        
        // Auto-advance after delay
        setTimeout(() => {
            if (gameState.currentLevel < LEVELS.length - 1) {
                loadLevel(gameState.currentLevel + 1);
            }
        }, 2000);
    } else if (formula !== level.targetFormula) {
        showNotification(`Not quite! You built ${formula}, but need ${level.targetFormula}`, 'error');
        audioSystem.playErrorSound();
    } else {
        showNotification(`Correct formula, but only ${Math.round(completeness)}% complete. Check your bonds!`, 'error');
        audioSystem.playErrorSound();
    }
}

function clearCanvas() {
    gameState.atoms = [];
    gameState.bonds = [];
    gameState.tempAtom = null;
    
    // Remove visual elements
    const canvas = document.getElementById('canvas');
    canvas.querySelectorAll('.atom, .bond-line, .particle').forEach(el => el.remove());
    
    updateInfo();
}

function showHint() {
    const level = LEVELS[gameState.currentLevel];
    showNotification(level.hint, 'info');
    audioSystem.playHintSound();
}

function redraw() {
    const canvas = document.getElementById('canvas');
    canvas.querySelectorAll('.atom, .bond-line').forEach(el => el.remove());
    
    // Redraw atoms
    gameState.atoms.forEach(atom => createAtomElement(atom));
    
    // Redraw bonds
    gameState.bonds.forEach(bond => {
        const atom1 = gameState.atoms.find(a => a.id === bond.atom1);
        const atom2 = gameState.atoms.find(a => a.id === bond.atom2);
        if (atom1 && atom2) {
            createBondElement(atom1, atom2, bond.type);
        }
    });
    
    updateAtomCharges();
}

// ========================================
// HELPERS
// ========================================

function getAtomAtPosition(x, y) {
    for (let atom of gameState.atoms) {
        const dx = x - atom.x;
        const dy = y - atom.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 25) {
            return atom;
        }
    }
    return null;
}

function highlightAtom(atom) {
    const atomEl = document.querySelector(`[data-atom-id="${atom.id}"]`);
    if (atomEl) {
        atomEl.classList.add('highlighted');
    }
}

function unhighlightAtom(atom) {
    const atomEl = document.querySelector(`[data-atom-id="${atom.id}"]`);
    if (atomEl) {
        atomEl.classList.remove('highlighted');
    }
}

function createParticles(x, y, color) {
    const canvas = document.getElementById('canvas');
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = color;
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 30 + Math.random() * 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        canvas.appendChild(particle);
        
        setTimeout(() => particle.remove(), 600);
    }
}

function getBestTextColor(bgColor) {
    // Convert hex to RGB
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}
