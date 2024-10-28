import React, { useState } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Typography, Link } from '@mui/material';
import ASTdiag from './assets/ASTdiag.png';

function App() {
  const [ruleName, setRuleName] = useState('');
  const [ruleString, setRuleString] = useState('');
  const [combinedRuleName, setCombinedRuleName] = useState('');
  const [ruleIds, setRuleIds] = useState('');
  const [ruleIdToEvaluate, setRuleIdToEvaluate] = useState('');
  const [userData, setUserData] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Function to create a new rule
  const createRule = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/create_rule', {
        rule_name: ruleName,
        rule_string: ruleString,
      });
      alert(`Rule created with ID: ${response.data.ruleId}`);
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Failed to create rule');
    }
  };

  // Function to combine multiple rules
  const combineRules = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/combine_rules', {
        rule_ids: ruleIds.split(',').map(id => id.trim()),
        combined_rule_name: combinedRuleName,
      });
      alert(`Combined rule created with ID: ${response.data.ruleId}`);
    } catch (error) {
      console.error('Error combining rules:', error);
      alert('Failed to combine rules');
    }
  };

  // Function to evaluate a rule against user data
  const evaluateRule = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/evaluate_rule', {
        rule_id: ruleIdToEvaluate,
        user_data: JSON.parse(userData),
      });
      setEvaluationResult(response.data.result);
    } catch (error) {
      console.error('Error evaluating rule:', error);
      alert('Failed to evaluate rule');
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
        <Typography align="center" variant="h4" component="h1" gutterBottom paddingBottom={6}>
          Rule Engine with Abstract Syntax Tree
        </Typography>

        <Box display="flex" justifyContent="center" mb={2} paddingBottom={7}>
          <img src={ASTdiag} alt="Initial Abstract Syntax Tree" width="300" />
        </Box>

        <Typography variant="body1" sx={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
          This Abstract Syntax Tree (AST) is already present in the database, feel free to modify this AST and combine it with other rules. <br/>
          Here, are the values -  
          <ul style={{ textAlign: 'left', padding: '0 20px' }}> 
            <li>
              Left Branch (OR operator):
              <ul>
                <li>
                  Sub-branch 1 (AND operator):
                  <ul>
                    <li>steps per day `{'>'}` 10000</li>
                    <li>BMI `{'<'}` 25</li>
                  </ul>
                </li>
                <li>
                  Sub-branch 2 (AND operator):
                  <ul>
                    <li>hours of sleep `{'>'}` 7.</li>
                    <li>water intake `{'>'}`= 2 liters</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              Right Node:
              <ul>
                <li>no smoking</li>
              </ul>
            </li>
          </ul>
        </Typography>

      {/* Create Rule Section */}
      <Typography variant="h5" component="h2" gutterBottom>
        Create Rule
      </Typography>
      <TextField
        label="Rule Name"
        variant="outlined"
        value={ruleName}
        onChange={(e) => setRuleName(e.target.value)}
        sx={{ marginRight: '10px', marginBottom: '10px', width: '300px' }}
      />
      <TextField
        label="Rule String (e.g., age > 30 AND city == 'NY')"
        variant="outlined"
        value={ruleString}
        onChange={(e) => setRuleString(e.target.value)}
        sx={{ marginBottom: '20px', width: '300px' }} // Increased bottom margin
      />
      <br />
      <Button variant="contained" onClick={createRule} sx={{ marginTop: '10px' }}>
        Create Rule
      </Button>
      <br />
      <br />

      {/* Combine Rules Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ marginTop: '20px' }}>
        Combine Rules
      </Typography>
      <TextField
        label="Combined Rule Name"
        variant="outlined"
        value={combinedRuleName}
        onChange={(e) => setCombinedRuleName(e.target.value)}
        sx={{ marginRight: '10px', marginBottom: '10px', width: '300px' }}
      />
      <TextField
        label="Rule IDs to combine (comma-separated)"
        variant="outlined"
        value={ruleIds}
        onChange={(e) => setRuleIds(e.target.value)}
        sx={{ marginBottom: '20px', width: '300px' }} // Increased bottom margin
      />
      <br />
      <Button variant="contained" onClick={combineRules} sx={{ marginTop: '10px' }}>
        Combine Rules
      </Button>
      <br /><br />

      {/* Evaluate Rule Section */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ marginTop: '20px' }}>
        Evaluate Rule
      </Typography>
      <TextField
        label="Rule ID to evaluate"
        variant="outlined"
        value={ruleIdToEvaluate}
        onChange={(e) => setRuleIdToEvaluate(e.target.value)}
        sx={{ marginRight: '10px', marginBottom: '10px', width: '300px' }}
      />
      <TextField
        id="outlined-multiline-static"
        label="User Data (JSON format)"
        multiline
        rows={4}
        value={userData}
        onChange={(e) => setUserData(e.target.value)}
        sx={{ marginBottom: '20px', width: '100%' }} // Increased bottom margin
      />
      <Button variant="contained" onClick={evaluateRule} sx={{ marginTop: '10px' }}>
        Evaluate Rule
      </Button>

      {/* Evaluation Result */}
      {evaluationResult !== null && (
        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6" component="h3">
            Evaluation Result:
          </Typography>
          <Typography>
            {evaluationResult ? 'User meets the rule criteria!' : 'User does not meet the rule criteria.'}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          marginTop: 'auto',
          padding: '10px',
          backgroundColor: '#f8f8f8',
          textAlign: 'center',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="body2" color="textSecondary">
        © 2024 Made By Anushka. <Link href="https://github.com/anushka81/Rule-Engine-with-AST" target="_blank" rel="noopener" color="inherit"><strong>GitHub</strong></Link>
        </Typography>
      </Box>

    </Box>
  );
}

export default App;
