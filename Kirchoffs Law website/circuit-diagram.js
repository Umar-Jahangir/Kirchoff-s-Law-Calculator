function createCircuitElement(type, x, y, rotation = 0, value = '') {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x},${y}) rotate(${rotation})`);

    switch(type) {
        case 'resistor':
            const resistor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            resistor.setAttribute('d', 'M-20,0 L-10,0 L-7,-5 L-1,5 L5,-5 L11,5 L17,-5 L20,0 L30,0');
            resistor.setAttribute('stroke', 'black');
            resistor.setAttribute('fill', 'none');
            g.appendChild(resistor);
            
            if (value) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', '0');
                label.setAttribute('y', '-10');
                label.textContent = value + 'Ω';
                label.setAttribute('font-size', '12px');
                g.appendChild(label);
            }
            break;

        case 'voltage':
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', '15');
            circle.setAttribute('stroke', 'black');
            circle.setAttribute('fill', 'none');
            g.appendChild(circle);
            
            const plus = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            plus.setAttribute('x', '-5');
            plus.setAttribute('y', '-20');
            plus.textContent = '+';
            plus.setAttribute('font-size', '12px');
            g.appendChild(plus);
            
            const minus = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            minus.setAttribute('x', '-5');
            minus.setAttribute('y', '25');
            minus.textContent = '-';
            minus.setAttribute('font-size', '12px');
            g.appendChild(minus);
            
            if (value) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', '20');
                label.setAttribute('y', '5');
                label.textContent = value + 'V';
                label.setAttribute('font-size', '12px');
                g.appendChild(label);
            }
            break;

        case 'current':
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrow.setAttribute('d', 'M-10,-5 L0,0 L-10,5');
            arrow.setAttribute('stroke', 'blue');
            arrow.setAttribute('fill', 'none');
            g.appendChild(arrow);
            
            if (value) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', '5');
                label.setAttribute('y', '0');
                label.textContent = value + 'A';
                label.setAttribute('font-size', '12px');
                label.setAttribute('fill', 'blue');
                g.appendChild(label);
            }
            break;

        case 'wire':
            const wire = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            wire.setAttribute('x1', '-20');
            wire.setAttribute('y1', '0');
            wire.setAttribute('x2', '20');
            wire.setAttribute('y2', '0');
            wire.setAttribute('stroke', 'black');
            g.appendChild(wire);
            break;

        case 'node':
            const nodeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            nodeCircle.setAttribute('r', '5');
            nodeCircle.setAttribute('fill', 'black');
            g.appendChild(nodeCircle);
            
            const nodeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nodeLabel.setAttribute('x', '10');
            nodeLabel.setAttribute('y', '5');
            nodeLabel.textContent = value;
            nodeLabel.setAttribute('font-size', '12px');
            g.appendChild(nodeLabel);
            break;
    }
    
    return g;
}

function calculateNodePositions(nodes) {
    const radius = 200;
    const centerX = 400;
    const centerY = 300;
    const uniqueNodes = [...new Set(nodes)];
    const numNodes = uniqueNodes.length;
    
    const positions = {};
    uniqueNodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / numNodes - Math.PI / 2;
        positions[node] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });
    
    return positions;
}

function updateCircuit() {
    const svg = document.getElementById('circuitDiagram');
    svg.innerHTML = '';
    
    // Collect all nodes from branch inputs
    const nodes = new Set();
    const branches = document.querySelectorAll('.branch-row');
    branches.forEach(branch => {
        const fromNode = branch.querySelector('.from-node').value;
        const toNode = branch.querySelector('.to-node').value;
        if (fromNode) nodes.add(fromNode);
        if (toNode) nodes.add(toNode);
    });
    
    const nodePositions = calculateNodePositions([...nodes]);
    
    // Draw nodes
    Object.entries(nodePositions).forEach(([node, pos]) => {
        const nodeElement = createCircuitElement('node', pos.x, pos.y, 0, node);
        svg.appendChild(nodeElement);
    });
    
    // Draw branches
    branches.forEach(branch => {
        const fromNode = branch.querySelector('.from-node').value;
        const toNode = branch.querySelector('.to-node').value;
        const voltage = parseFloat(branch.querySelector('.voltage-input').value);
        const current = parseFloat(branch.querySelector('.current-input').value);
        const resistance = parseFloat(branch.querySelector('.resistance-input').value);
        
        if (fromNode && toNode && nodePositions[fromNode] && nodePositions[toNode]) {
            const start = nodePositions[fromNode];
            const end = nodePositions[toNode];
            
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
            
            // Draw wire
            const wire = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            wire.setAttribute('x1', start.x);
            wire.setAttribute('y1', start.y);
            wire.setAttribute('x2', end.x);
            wire.setAttribute('y2', end.y);
            wire.setAttribute('stroke', 'black');
            svg.appendChild(wire);
            
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            
            if (resistance) {
                const resistor = createCircuitElement('resistor', midX, midY, angle, resistance.toString());
                svg.appendChild(resistor);
            }
            
            if (voltage) {
                const voltageSource = createCircuitElement('voltage', 
                    start.x + (end.x - start.x) * 0.25, 
                    start.y + (end.y - start.y) * 0.25, 
                    angle, 
                    voltage.toString()
                );
                svg.appendChild(voltageSource);
            }
            
            if (current) {
                const currentArrow = createCircuitElement('current', 
                    start.x + (end.x - start.x) * 0.75, 
                    start.y + (end.y - start.y) * 0.75, 
                    angle, 
                    current.toString()
                );
                svg.appendChild(currentArrow);
            }
        }
    });
}

function setupInputs() {
    const numBranches = parseInt(document.getElementById('numBranches').value);
    const branchDiv = document.getElementById('branchInputs');
    branchDiv.innerHTML = '';
    
    for (let i = 1; i <= numBranches; i++) {
        const branchRow = document.createElement('div');
        branchRow.className = 'branch-row';
        branchRow.innerHTML = `
            <div class="input-group">
                <label for="from-${i}">From Node:</label>
                <input type="text" class="from-node" onchange="updateCircuit()">
            </div>
            <div class="input-group">
                <label for="to-${i}">To Node:</label>
                <input type="text" class="to-node" onchange="updateCircuit()">
            </div>
            <div class="input-group">
                <label for="voltage-${i}">Voltage (V):</label>
                <input type="number" class="voltage-input" step="0.1" onchange="updateCircuit()">
            </div>
            <div class="input-group">
                <label for="current-${i}">Current (A):</label>
                <input type="number" class="current-input" step="0.1" onchange="updateCircuit()">
            </div>
            <div class="input-group">
                <label for="resistance-${i}">Resistance (Ω):</label>
                <input type="number" class="resistance-input" step="0.1" onchange="updateCircuit()">
            </div>
        `;
        branchDiv.appendChild(branchRow);
    }
}