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
        const fromNode = branch.querySelector('.from-node').value.trim();
        const toNode = branch.querySelector('.to-node').value.trim();
        if (fromNode) nodes.add(fromNode);
        if (toNode) nodes.add(toNode);
    });
    
    const nodePositions = calculateNodePositions([...nodes]);
    
    // Group branches by their node pairs
    const branchMap = {};
    branches.forEach(branch => {
        const fromNode = branch.querySelector('.from-node').value.trim();
        const toNode = branch.querySelector('.to-node').value.trim();
        if (fromNode && toNode) {
            const key = [fromNode, toNode].sort().join('-');
            if (!branchMap[key]) branchMap[key] = [];
            branchMap[key].push(branch);
        }
    });
    
    // Draw nodes
    Object.entries(nodePositions).forEach(([node, pos]) => {
        const nodeElement = createCircuitElement('node', pos.x, pos.y, 0, node);
        svg.appendChild(nodeElement);
    });
    
    // Draw branches with aligned components
    Object.entries(branchMap).forEach(([key, branchList]) => {
        const [fromNode, toNode] = key.split('-');
        const start = nodePositions[fromNode];
        const end = nodePositions[toNode];
        
        branchList.forEach((branch, index) => {
            const voltage = parseFloat(branch.querySelector('.voltage-input').value) || null;
            const current = parseFloat(branch.querySelector('.current-input').value) || null;
            const resistance = parseFloat(branch.querySelector('.resistance-input').value) || null;

            // Calculate dynamic offset
            const totalBranches = branchList.length;
            const branchSpacing = 20; // Adjust for more spacing if needed
            const offset = (index - (totalBranches - 1) / 2) * branchSpacing;
            
            const offsetX = offset * (end.y - start.y) / Math.hypot(end.x - start.x, end.y - start.y);
            const offsetY = offset * (start.x - end.x) / Math.hypot(end.x - start.x, end.y - start.y);
            
            const startX = start.x + offsetX;
            const startY = start.y + offsetY;
            const endX = end.x + offsetX;
            const endY = end.y + offsetY;

            // Draw wire
            const wire = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            wire.setAttribute('x1', startX);
            wire.setAttribute('y1', startY);
            wire.setAttribute('x2', endX);
            wire.setAttribute('y2', endY);
            wire.setAttribute('stroke', 'black');
            svg.appendChild(wire);

            // Midpoint and angle for alignment
            const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

            // Align resistor
            if (resistance) {
                const resistor = createCircuitElement('resistor', (startX + endX) / 2, (startY + endY) / 2, angle, resistance.toString());
                svg.appendChild(resistor);
            }

            // Align voltage source closer to start
            if (voltage) {
                const voltageSource = createCircuitElement(
                    'voltage',
                    startX + (endX - startX) * 0.25,
                    startY + (endY - startY) * 0.25,
                    angle,
                    voltage.toString()
                );
                svg.appendChild(voltageSource);
            }

            // Align current arrow closer to end
            if (current) {
                const currentArrow = createCircuitElement(
                    'current',
                    startX + (endX - startX) * 0.75,
                    startY + (endY - startY) * 0.75,
                    angle,
                    current.toString()
                );
                svg.appendChild(currentArrow);
            }
        });
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