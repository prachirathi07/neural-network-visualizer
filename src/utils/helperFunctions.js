import * as tf from '@tensorflow/tfjs';

export const normalizeData = (data) => {
  const tensor = tf.util.isTypedArray(data) ? tf.tensor2d(data) : tf.tensor(data);
  const min = tensor.min(0);
  const max = tensor.max(0);
  const range = max.sub(min).add(1e-6);
  const normalizedTensor = tensor.sub(min).div(range);
  return tf.util.isTypedArray(data) ? normalizedTensor : normalizedTensor.arraySync();
};

export const oneHotEncode = (labels, numClasses) => {
  return tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);
};

export const preprocessData = (data) => {
  console.log("Raw data:", data);

  const dataWithoutHeader = data.slice(1);
  const features = dataWithoutHeader.map(row => row.slice(0, -1));
  const labels = dataWithoutHeader.map(row => row[row.length - 1]);

  const numericColumns = features[0].map((_, colIndex) => 
    features.every(row => typeof row[colIndex] === 'number' || !isNaN(parseFloat(row[colIndex])))
  );

  const processedFeatures = features.map(row => 
    row.map((value, colIndex) => numericColumns[colIndex] ? parseFloat(value) : value)
  );

  const normalizedFeatures = processedFeatures.map(row => 
    row.map((value, colIndex) => numericColumns[colIndex] ? normalizeData([value])[0] : value)
  );

  const uniqueValues = {};
  normalizedFeatures[0].forEach((_, colIndex) => {
    if (!numericColumns[colIndex]) {
      uniqueValues[colIndex] = [...new Set(normalizedFeatures.map(row => row[colIndex]))];
    }
  });

  const encodedFeatures = normalizedFeatures.map(row => 
    row.flatMap((value, colIndex) => 
      numericColumns[colIndex] ? [value] : oneHotEncode([uniqueValues[colIndex].indexOf(value)], uniqueValues[colIndex].length).arraySync().flat()
    )
  );

  const uniqueLabels = [...new Set(labels)];
  const encodedLabels = oneHotEncode(labels.map(label => uniqueLabels.indexOf(label)), uniqueLabels.length);

  if (encodedFeatures.length === 0 || encodedFeatures[0].length === 0) {
    throw new Error("Encoded features are empty");
  }

  if (encodedLabels.shape[0] === 0 || encodedLabels.shape[1] === 0) {
    throw new Error("Encoded labels are empty");
  }

  console.log("Processed features:", processedFeatures);
  console.log("Encoded features:", encodedFeatures);
  console.log("Encoded labels:", encodedLabels.arraySync());

  return { 
    xs: tf.tensor2d(encodedFeatures), 
    ys: encodedLabels 
  };
};

export function createModel(inputShape, layers) {
  const model = tf.sequential();
  
  // Add the input layer
  if (layers.length > 0 && layers[0].neurons > 0) {
    model.add(tf.layers.dense({
      units: layers[0].neurons,
      activation: layers[0].activation,
      inputShape: [inputShape]
    }));
  } else {
    throw new Error("Invalid input layer configuration");
  }

  // Add hidden layers
  for (let i = 1; i < layers.length - 1; i++) {
    if (layers[i].neurons > 0) {
      model.add(tf.layers.dense({
        units: layers[i].neurons,
        activation: layers[i].activation
      }));
    } else {
      throw new Error(`Invalid number of neurons in layer ${i}`);
    }
  }

  // Add output layer
  if (layers.length > 1 && layers[layers.length - 1].neurons > 0) {
    model.add(tf.layers.dense({
      units: layers[layers.length - 1].neurons,
      activation: layers[layers.length - 1].activation
    }));
  } else {
    throw new Error("Invalid output layer configuration");
  }

  return model;
}

export async function trainModel(model, dataset, config, callbacks) {
  const { xs, ys } = dataset;
  const { epochs, batchSize, learningRate, optimizer, lossFunction } = config;
  
  console.log("Training data shapes:");
  console.log("xs shape:", xs.shape);
  console.log("ys shape:", ys.shape);
  console.log("xs data:", xs.arraySync());
  console.log("ys data:", ys.arraySync());

  if (!xs || !ys) {
    throw new Error("Training data is null or undefined");
  }

  if (xs.shape[0] !== ys.shape[0]) {
    throw new Error(`Mismatch in number of samples: xs has ${xs.shape[0]}, ys has ${ys.shape[0]}`);
  }

  model.compile({
    optimizer: tf.train[optimizer](learningRate),
    loss: lossFunction,
    metrics: ['accuracy']
  });

  try {
    return await model.fit(xs, ys, {
      epochs,
      batchSize,
      validationSplit: 0.2,
      callbacks: {
        ...callbacks,
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          if (callbacks && callbacks.onEpochEnd) {
            callbacks.onEpochEnd(epoch, logs);
          }
        }
      },
      shuffle: true,
    });
  } catch (error) {
    console.error("Error during training:", error);
    throw error;
  }
}