import React, { useState, useCallback, useEffect } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Select, 
  MenuItem, 
  Button, 
  Grid, 
  Snackbar, 
  Alert,
  Slider
} from '@mui/material';
import NetworkCanvas from './components/NetworkCanvas';
import DatasetLoader from './components/DatasetLoader';
import { createModel, trainModel } from './utils/helperFunctions';
import * as tf from '@tensorflow/tfjs';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4fc3f7',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  const [networkConfig, setNetworkConfig] = useState({
    layers: 3,
    neurons: [4, 5, 3],
    activationFunction: 'relu',
    learningRate: 0.01,
    epochs: 50,
    batchSize: 32,
    optimizer: 'adam',
    lossFunction: 'categoricalCrossentropy',
    validationSplit: 0.2
  });
  const [dataset, setDataset] = useState(null);
  const [model, setModel] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [datasetStatus, setDatasetStatus] = useState('');
  const [activations, setActivations] = useState([]);

  const handleConfigUpdate = useCallback((field, value) => {
    setNetworkConfig((prevConfig) => {
      const newConfig = { ...prevConfig, [field]: value };
      if (field === 'layers') {
        const currentNeurons = [...prevConfig.neurons];
        if (value > currentNeurons.length) {
          while (currentNeurons.length < value) {
            currentNeurons.push(1);
          }
        } else if (value < currentNeurons.length) {
          currentNeurons.splice(value);
        }
        newConfig.neurons = currentNeurons;
      }
      return newConfig;
    });
  }, []);

  const handleNeuronsUpdate = useCallback((value) => {
    const neurons = value
      .split(',')
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));
    handleConfigUpdate('neurons', neurons.length > 0 ? neurons : [1]);
  }, [handleConfigUpdate]);

  const handleDatasetLoad = useCallback((datasetInfo) => {
    setDatasetStatus('Loading dataset...');

    if (!datasetInfo?.xs || !datasetInfo?.ys) {
      setDatasetStatus('Error: Dataset is missing xs or ys');
      return;
    }

    const numFeatures = datasetInfo.xs.shape[1];
    const numClasses = datasetInfo.ys.shape[1];

    setDataset({
      name: datasetInfo.name || 'Unknown',
      size: `${datasetInfo.xs.shape[0]} samples, ${numFeatures} features`,
      xs: datasetInfo.xs,
      ys: datasetInfo.ys,
      inputShape: [numFeatures],
      outputShape: [numClasses],
    });

    setNetworkConfig((prevConfig) => ({
      ...prevConfig,
      layers: 3,
      neurons: [numFeatures, Math.round((numFeatures + numClasses) / 2), numClasses],
    }));

    setDatasetStatus('Dataset loaded successfully');
  }, []);

  const updateModel = useCallback(() => {
    if (!dataset?.inputShape || !dataset?.outputShape) {
      alert('Please load a valid dataset before updating the model');
      return;
    }

    const numFeatures = dataset.inputShape[0];
    const numClasses = dataset.outputShape[0];

    const layers = [
      { neurons: numFeatures, activation: networkConfig.activationFunction.toLowerCase() },
      ...networkConfig.neurons.slice(1, networkConfig.layers - 1).map(neurons => ({
        neurons,
        activation: networkConfig.activationFunction.toLowerCase(),
      })),
      { neurons: numClasses, activation: 'softmax' },
    ];

    const newModel = createModel(numFeatures, layers);
    setModel(newModel);
  }, [dataset, networkConfig]);

  const forwardPass = useCallback(() => {
    if (!model || !dataset) return;

    const inputTensor = dataset.xs.slice([0, 0], [1, dataset.inputShape[0]]);
    const layerOutputs = [];

    // Perform forward pass and collect activations
    let layerInput = inputTensor;
    model.layers.forEach((layer) => {
      const layerOutput = layer.apply(layerInput);
      layerOutputs.push(layerOutput);
      layerInput = layerOutput;
    });

    // Convert tensor outputs to arrays
    const newActivations = layerOutputs.map(tensor => 
      Array.from(tensor.dataSync())
    );

    setActivations(newActivations);
  }, [model, dataset]);

  const trainNetwork = useCallback(async () => {
    if (!dataset?.xs || !dataset?.ys) {
      setTrainingStatus('Error: No dataset loaded');
      return;
    }

    if (!model) {
      setTrainingStatus('Error: No model created');
      return;
    }

    setTrainingStatus('Training model...');

    try {
      await trainModel(model, { xs: dataset.xs, ys: dataset.ys }, networkConfig, (epoch, logs) => {
        setTrainingStatus(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        forwardPass(); // Update activations after each epoch
      });

      setTrainingStatus('Training completed');
    } catch (error) {
      console.error('Training failed:', error);
      setTrainingStatus('Training failed: ' + error.message);
    }
  }, [dataset, model, networkConfig, forwardPass]);

  const handleLearningRateChange = (newRate) => {
    setNetworkConfig(prevConfig => ({
      ...prevConfig,
      learningRate: newRate
    }));
    // If you're using a TensorFlow.js model, you might also want to update its learning rate:
    // if (model) {
    //   const optimizer = tf.train.adam(newRate);
    //   model.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    // }
  };

  useEffect(() => {
    if (model && dataset) {
      forwardPass();
    }
  }, [model, dataset, forwardPass]);

  const calculateActivations = () => {
    // This is a placeholder. Replace with actual activation calculation logic
    const newActivations = networkConfig.neurons.map(layerSize => 
      Array(layerSize).fill(0).map(() => Math.random())
    );
    setActivations(newActivations);
  };

  const handleForwardProp = () => {
    calculateActivations();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Neural Network Visualizer
          </Typography>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Layers"
                  type="number"
                  value={networkConfig.layers}
                  onChange={(e) => handleConfigUpdate('layers', parseInt(e.target.value))}
                  inputProps={{ min: '1' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Neurons per Layer"
                  value={networkConfig.neurons.join(', ')}
                  onChange={(e) => handleNeuronsUpdate(e.target.value)}
                  helperText="Enter comma-separated values"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={networkConfig.activationFunction}
                  onChange={(e) => handleConfigUpdate('activationFunction', e.target.value)}
                  label="Activation Function"
                >
                  <MenuItem value="relu">ReLU</MenuItem>
                  <MenuItem value="sigmoid">Sigmoid</MenuItem>
                  <MenuItem value="tanh">Tanh</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Learning Rate"
                  type="number"
                  value={networkConfig.learningRate}
                  onChange={(e) => handleConfigUpdate('learningRate', parseFloat(e.target.value))}
                  inputProps={{ step: '0.001', min: '0.001', max: '1' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Epochs"
                  type="number"
                  value={networkConfig.epochs}
                  onChange={(e) => handleConfigUpdate('epochs', parseInt(e.target.value))}
                  inputProps={{ min: '1', max: '1000' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Size"
                  type="number"
                  value={networkConfig.batchSize}
                  onChange={(e) => handleConfigUpdate('batchSize', parseInt(e.target.value))}
                  inputProps={{ min: '1', max: '1024' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={networkConfig.optimizer}
                  onChange={(e) => handleConfigUpdate('optimizer', e.target.value)}
                  label="Optimizer"
                >
                  <MenuItem value="sgd">SGD</MenuItem>
                  <MenuItem value="adam">Adam</MenuItem>
                  <MenuItem value="rmsprop">RMSprop</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={networkConfig.lossFunction}
                  onChange={(e) => handleConfigUpdate('lossFunction', e.target.value)}
                  label="Loss Function"
                >
                  <MenuItem value="categoricalCrossentropy">Categorical Cross-Entropy</MenuItem>
                  <MenuItem value="meanSquaredError">Mean Squared Error</MenuItem>
                  <MenuItem value="binaryCrossentropy">Binary Cross-Entropy</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Validation Split</Typography>
                <Slider
                  value={networkConfig.validationSplit}
                  onChange={(_, newValue) => handleConfigUpdate('validationSplit', newValue)}
                  step={0.01}
                  marks
                  min={0}
                  max={0.5}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <DatasetLoader onDatasetLoad={handleDatasetLoad} />
              </Grid>
              {dataset && (
                <Grid item xs={12}>
                  <Typography>Dataset loaded: {dataset.name}</Typography>
                  <Typography>Size: {dataset.size}</Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Button fullWidth variant="contained" color="primary" onClick={updateModel}>
                  Update Model
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth variant="contained" color="secondary" onClick={trainNetwork}>
                  Train Network
                </Button>
              </Grid>
              {trainingStatus && (
                <Grid item xs={12}>
                  <Typography>{trainingStatus}</Typography>
                </Grid>
              )}
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  onClick={handleForwardProp}
                  sx={{ mr: 1 }}
                >
                  Forward Prop
                </Button>
              </Grid>
            </Grid>
          </Paper>
          <Paper elevation={3} sx={{ p: 3 }}>
            <NetworkCanvas 
              config={networkConfig} 
              dataset={dataset} 
              model={model} 
              activations={activations} 
              setActivations={setActivations} 
              networkConfig={networkConfig} 
              onLearningRateChange={handleLearningRateChange}  // Add this prop
            />
          </Paper>
        </Box>
      </Container>
      <Snackbar open={!!datasetStatus} autoHideDuration={6000}>
        <Alert severity={datasetStatus.includes('Error') ? 'error' : 'success'}>{datasetStatus}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;