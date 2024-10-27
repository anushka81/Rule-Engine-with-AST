const express = require('express');
const mongoose = require('mongoose');
const ASTQ = require('astq');
const astq = new ASTQ();
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());


const mongoURI = 'mongodb+srv://test-user-fYikrmxbpHz7C098:fYikrmxbpHz7C098@ast.7mk7q.mongodb.net/';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Rule model
const RuleSchema = new mongoose.Schema({
    rule_name: String,
    rule_tree: Object
});
const Rule = mongoose.model('Rule', RuleSchema);

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Rule Engine API');
});

// Adjust parseRule to return JSON structures directly
function parseRule(ruleString) {
    console.log('Input ruleString:', ruleString);
    const regex = /(\w+)([><=]{1,2})(\d+)/g;
    let match;
    const nodes = [];

    while ((match = regex.exec(ruleString)) !== null) {
        const attribute = match[1];
        const operator = match[2];
        const value = match[3];
        const operandNode = { type: 'operand', value: `${attribute} ${operator} ${value}` };
        console.log('Match found:', { attribute, operator, value });
        nodes.push(operandNode);
    }

    console.log('Parsed nodes:', nodes);

    if (nodes.length > 1) {
        let currentNode = nodes[0];
        for (let i = 1; i < nodes.length; i++) {
            currentNode = { type: 'operator', value: 'AND', left: currentNode, right: nodes[i] };
        }
        return currentNode;
    }
    return nodes[0];
}

function evaluateAST(ast, userData) {
    console.log('Input AST:', ast);
    console.log('Input userData:', userData);

    // Use ASTq to adapt and query the AST
    astq.adapter({
        taste: (node) => typeof node === 'object' && node.type,
        getChildNodes: (node) => [node.left, node.right].filter(Boolean),
        getNodeType: (node) => node.type
    });

    // Query for operand nodes in the AST
    const query = "//operand";
    const nodes = astq.query(ast, query);

    // Evaluate each operand node
    for (const node of nodes) {
        const [attr, operator, value] = node.value.split(' ');

        // Ensure the attribute exists in userData
        if (!(attr in userData)) {
            console.warn(`Attribute ${attr} not found in userData.`);
            return false; // or handle as per your requirement
        }

        const userValue = parseFloat(userData[attr]);
        const ruleValue = parseFloat(value);

        // Evaluate based on the operator
        let conditionMet = false;
        switch (operator) {
            case '>':
                conditionMet = userValue > ruleValue;
                break;
            case '<':
                conditionMet = userValue < ruleValue;
                break;
            case '>=':
                conditionMet = userValue >= ruleValue;
                break;
            case '<=':
                conditionMet = userValue <= ruleValue;
                break;
            case '==':
                conditionMet = userValue == ruleValue; 
                break;
            case '!=':
                conditionMet = userValue != ruleValue;
                break;
            default:
                console.error(`Unsupported operator: ${operator}`);
                return false; // or handle as needed
        }

        // If any condition is false, return false
        if (!conditionMet) {
            console.log(`Condition failed for ${node.value}: ${userValue} ${operator} ${value}`);
            return false;
        }
    }

    // All conditions are satisfied
    return true;
}

// Combine rules using ASTq queries
function combineRulesAST(rules) {
    return {
        type: 'operator',
        value: 'AND',
        left: rules[0].rule_tree,
        right: rules[1].rule_tree
    };
}


// POST /api/create_rule
app.post('/api/create_rule', async (req, res) => {
    console.log('Received request to create rule:', req.body);

    const { rule_name, rule_string } = req.body;

    const ruleTree = parseRule(rule_string); // Convert rule string to AST
    console.log('Parsed rule tree:', ruleTree);

    const rule = new Rule({
        rule_name,
        rule_tree: ruleTree
    });

    try {
        await rule.save();
        res.status(201).json({ message: 'Rule created successfully', ruleId: rule._id });
    } catch (error) {
        console.error('Error creating rule:', error);
        res.status(500).json({ message: 'Error creating rule', error: error.message });
    }
});

// combine
// POST /api/combine_rules
app.post('/api/combine_rules', async (req, res) => {
    const { rule_ids, combined_rule_name } = req.body;
    console.log('Received request to combine rules:', { rule_ids, combined_rule_name });
    // Split comma-separated IDs and remove any extra whitespace
    console.log("Type of rule_ids:", typeof rule_ids);

    const ruleIdsArray = Array.isArray(rule_ids) ? rule_ids : Object.values(rule_ids);
    const ruleIdsArrayTrimmed = ruleIdsArray.map(id => id.trim());

    console.log("Processed Rule IDs Array:", ruleIdsArrayTrimmed);


    try {
        // Fetch rules from the database using the array of rule IDs
        const rules = await Rule.find({ _id: { $in: ruleIdsArray } });

        if (rules.length < 2) {
            return res.status(400).json({ message: 'Need at least two rules to combine' });
        }

        // Combine rules into a single AST
        const combinedAST = combineRulesAST(rules);

        // Create a new combined rule document
        const combinedRule = new Rule({
            rule_name: combined_rule_name,
            rule_tree: combinedAST
        });

        await combinedRule.save();
        res.status(201).json({ message: 'Combined rule created successfully', ruleId: combinedRule._id });
    } catch (error) {
        res.status(500).json({ message: 'Error combining rules', error });
    }
});

// Evaluate

// POST /api/evaluate_rule
app.post('/api/evaluate_rule', async (req, res) => {
    const { rule_id, user_data } = req.body;
    console.log('Received request to evaluate rule:', { rule_id, user_data });
    try {
        const rule = await Rule.findById(rule_id);
        console.log('Rule found:', rule);
        if (!rule) {
            console.log('Rule not found');
            return res.status(404).json({ message: 'Rule not found' });
        }

        const result = evaluateAST(rule.rule_tree, user_data);
        console.log('Evaluation result:', result);
        res.status(200).json({ message: 'Evaluation complete', result });
    } catch (error) {
        console.error('Error evaluating rule:', error);
        res.status(500).json({ message: 'Error evaluating rule', error });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
