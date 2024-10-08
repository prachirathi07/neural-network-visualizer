import React, { useState } from 'react';
import { Button, Typography, CircularProgress, Box, Snackbar, Alert } from '@mui/material';
import * as tf from '@tensorflow/tfjs';

const DatasetLoader = ({ onDatasetLoad }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit (adjust as needed)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit`);
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const fileContent = await file.text();
      if (!file.name.endsWith('.csv')) {
        throw new Error('Only CSV files are supported');
      }
      const data = parseCSV(fileContent);
      
      if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid or empty data format');

      const inputFeatures = Object.keys(data[0]).slice(0, -1); // Assume last column is the target
      const targetFeature = Object.keys(data[0]).slice(-1)[0];

      // Normalize the data
      const { normalizedData, inputMeans, inputStds } = normalizeData(data, inputFeatures);

      const xs = tf.tensor2d(normalizedData.map(row => inputFeatures.map(feature => row[feature])));
      const ys = tf.tensor2d(data.map(row => [row[targetFeature]]));

      onDatasetLoad({ 
        xs, 
        ys, 
        name: file.name, 
        inputFeatures, 
        targetFeature,
        inputMeans,
        inputStds
      });
    } catch (error) {
      setError(error.message || 'Failed to process the file');
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (text) => {
    const rows = text.trim().split('\n');
    const headers = rows[0].split(',');
    return rows.slice(1).map(row => {
      const values = row.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
        return obj;
      }, {});
    });
  };

  const normalizeData = (data, features) => {
    const means = {};
    const stds = {};

    features.forEach(feature => {
      const values = data.map(row => row[feature]);
      means[feature] = values.reduce((sum, val) => sum + val, 0) / values.length;
      stds[feature] = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - means[feature], 2), 0) / values.length);
    });

    const normalizedData = data.map(row => {
      const normalizedRow = { ...row };
      features.forEach(feature => {
        normalizedRow[feature] = (row[feature] - means[feature]) / stds[feature];
      });
      return normalizedRow;
    });

    return { normalizedData, inputMeans: means, inputStds: stds };
  };

  const resetFile = () => {
    setFileName(null);
    setError(null);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '5px', mt: 2 }}>
      <Typography variant="h6" gutterBottom>Load Dataset</Typography>
      <input
        accept=".csv,.json"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" disabled={loading}>
          {fileName ? `Uploaded: ${fileName}` : 'Upload Dataset'}
        </Button>
      </label>
      {fileName && !loading && (
        <Button sx={{ ml: 2 }} variant="outlined" onClick={resetFile}>
          Remove
        </Button>
      )}
      {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DatasetLoader;
