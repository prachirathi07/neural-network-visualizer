/**
 * @typedef {Object} NeuronPosition
 * @property {number} x - The x-coordinate of the neuron
 * @property {number} y - The y-coordinate of the neuron
 */

/**
 * @typedef {Object} Connection
 * @property {NeuronPosition} source - The source neuron position
 * @property {NeuronPosition} target - The target neuron position
 */

/**
 * @typedef {Object} RenderOptions
 * @property {number} [horizontalPadding=50] - Padding on the left and right sides
 * @property {number} [verticalPadding=50] - Padding on the top and bottom
 * @property {number} [neuronRadius=10] - Radius of each neuron
 */

/**
 * Calculates positions for neurons and connections in a neural network.
 * @param {number[]} networkConfig - Array of neuron counts for each layer
 * @param {number} width - Width of the rendering area
 * @param {number} height - Height of the rendering area
 * @param {RenderOptions} [options] - Additional rendering options
 * @returns {{neuronPositions: NeuronPosition[][], connections: Connection[]}} - An object containing neuron positions and connections
 */
export function renderNetwork(networkConfig, width, height, options = {}) {
    // Validate inputs
    if (!Array.isArray(networkConfig) || networkConfig.length === 0) {
        throw new Error('Invalid network configuration');
    }

    if (width <= 0 || height <= 0) {
        throw new Error('Invalid dimensions');
    }

    // Destructure rendering options with default values
    const {
        horizontalPadding = 50,
        verticalPadding = 50,
        neuronRadius = 10,
    } = options;

    const neuronPositions = []; // Array to store neuron positions for each layer
    const connections = []; // Array to store connections between neurons

    const layerCount = networkConfig.length;
    const layerSpacing = (width - 2 * horizontalPadding) / (layerCount - 1); // Spacing between layers

    // Iterate over each layer in the network configuration
    networkConfig.forEach((layerSize, layerIndex) => {
        const neurons = [];
        const neuronSpacing = (height - 2 * verticalPadding) / (layerSize - 1 || 1); // Vertical spacing for neurons

        // Position neurons within the layer
        for (let i = 0; i < layerSize; i++) {
            const x = horizontalPadding + layerIndex * layerSpacing;
            const y = verticalPadding + i * neuronSpacing;
            const neuronPosition = { x, y };
            neurons.push(neuronPosition);

            // If not the first layer, create connections to the previous layer's neurons
            if (layerIndex > 0) {
                const prevLayer = neuronPositions[layerIndex - 1];
                prevLayer.forEach(prevNeuron => {
                    connections.push({
                        source: prevNeuron,
                        target: neuronPosition
                    });
                });
            }
        }

        neuronPositions.push(neurons); // Add the current layer's neurons to the neuronPositions array
    });

    return { neuronPositions, connections }; // Return calculated neuron positions and connections
}
