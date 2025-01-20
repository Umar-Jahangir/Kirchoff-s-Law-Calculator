function formatMatrix(matrix) {
    return matrix.map(row => 
        row.map(val => val.toFixed(3).padStart(8)).join(' ')
    ).join('\n');
}

function gaussianElimination(matrix, constants) {
    const n = matrix.length;
    const augMatrix = matrix.map((row, i) => [...row, constants[i]]);
    const steps = [];
    
    steps.push({
        type: 'initial',
        matrix: JSON.parse(JSON.stringify(augMatrix)),
        description: 'Initial augmented matrix:'
    });

    // Forward elimination
    for (let k = 0; k < n - 1; k++) {
        for (let i = k + 1; i < n; i++) {
            const factor = augMatrix[i][k] / augMatrix[k][k];
            for (let j = k; j <= n; j++) {
                augMatrix[i][j] -= factor * augMatrix[k][j];
            }
            
            steps.push({
                type: 'elimination',
                matrix: JSON.parse(JSON.stringify(augMatrix)),
                description: `Row ${i + 1} = Row ${i + 1} - ${factor.toFixed(3)} × Row ${k + 1}`
            });
        }
    }
    
    // Back substitution
    const solution = new Array(n).fill(0);
    const backSteps = [];
    
    for (let i = n - 1; i >= 0; i--) {
        let sum = augMatrix[i][n];
        for (let j = i + 1; j < n; j++) {
            sum -= augMatrix[i][j] * solution[j];
        }
        solution[i] = sum / augMatrix[i][i];
        
        backSteps.push({
            variable: `x${i + 1}`,
            value: solution[i],
            equation: `x${i + 1} = ${sum.toFixed(3)} / ${augMatrix[i][i].toFixed(3)} = ${solution[i].toFixed(3)}`
        });
    }
    
    return { solution, steps, backSteps };
}

function collectBranchData() {
    const currents = [...document.getElementsByClassName('current-input')];
    const voltages = [...document.getElementsByClassName('voltage-input')];
    const resistances = [...document.getElementsByClassName('resistance-input')];
    const fromNodes = [...document.getElementsByClassName('from-node')];
    const toNodes = [...document.getElementsByClassName('to-node')];

    return currents.map((_, i) => ({
        current: parseFloat(currents[i].value) || 0,
        voltage: parseFloat(voltages[i].value) || 0,
        resistance: parseFloat(resistances[i].value) || 0,
        fromNode: parseInt(fromNodes[i].value) || 0,
        toNode: parseInt(toNodes[i].value) || 0
    }));
}

function solveKVL(branchData) {
    const numBranches = branchData.length;
    const matrix = Array(numBranches).fill().map(() => Array(numBranches).fill(0));
    const constants = Array(numBranches).fill(0);

    // Build KVL equations
    for (let i = 0; i < numBranches; i++) {
        matrix[i][i] = branchData[i].resistance;
        constants[i] = branchData[i].voltage;
    }

    return gaussianElimination(matrix, constants);
}

function solveKCL(branchData) {
    const nodes = parseInt(document.getElementById('numNodes').value);
    const matrix = Array(nodes - 1).fill().map(() => Array(branchData.length).fill(0));
    const constants = Array(nodes - 1).fill(0);

    // Build KCL equations
    branchData.forEach((branch, j) => {
        if (branch.fromNode <= nodes - 1) matrix[branch.fromNode - 1][j] = 1;
        if (branch.toNode <= nodes - 1) matrix[branch.toNode - 1][j] = -1;
    });

    return gaussianElimination(matrix, constants);
}

function solveCircuit() {
    const branchData = collectBranchData();
    const law = document.getElementById('lawSelect').value;
    const { solution, steps, backSteps } = law === 'KVL' ? solveKVL(branchData) : solveKCL(branchData);
    
    displaySolution(solution, steps, backSteps, law);
}

function displaySolution(solution, steps, backSteps, law) {
    const stepsDiv = document.getElementById('steps');
    stepsDiv.innerHTML = '';
    
    // Display equation formation
    const equationDiv = document.createElement('div');
    equationDiv.className = 'step';
    equationDiv.innerHTML = `
        <h3>Step 1: Forming ${law} Equations</h3>
        <p>Using ${law} to create system of equations...</p>
    `;
    stepsDiv.appendChild(equationDiv);

    // Display Gaussian Elimination steps
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.innerHTML = `
            <h3>Step ${index + 2}: ${step.description}</h3>
            <div class="matrix-display">
                ${formatMatrix(step.matrix)}
            </div>
        `;
        stepsDiv.appendChild(stepDiv);
    });

    // Display back substitution
    const backSubDiv = document.createElement('div');
    backSubDiv.className = 'step';
    backSubDiv.innerHTML = `
        <h3>Back Substitution:</h3>
        <div class="matrix-display">
            ${backSteps.map(step => step.equation).join('\n')}
        </div>
    `;
    stepsDiv.appendChild(backSubDiv);

    // Display final solution
    const resultDiv = document.createElement('div');
    resultDiv.className = 'step';
    resultDiv.innerHTML = `
        <h3>Final Solution:</h3>
        <div class="matrix-display">
            ${solution.map((val, i) => `I${i + 1} = ${val.toFixed(3)} A`).join('\n')}
        </div>
    `;
    stepsDiv.appendChild(resultDiv);
}

// Export functions for use in main application
export {
    solveCircuit,
    collectBranchData
};