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

function parseRule(ruleString) {
    const operators = /\s+(AND|OR)\s+/;
    const conditions = ruleString.split(operators); // Split on AND/OR, keeping operators
    const nodes = [];

    // Create operand nodes from conditions
    for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i].trim();

        if (condition === "AND" || condition === "OR") {
            nodes.push({ type: 'operator', value: condition });
        } else {
            // Parse condition into operand node
            const regex = /(\w+)\s*([><=!]+)\s*([\w\d]+)/;
            const match = condition.match(regex);

            if (match) {
                const [, attribute, operator, value] = match;
                nodes.push({
                    type: 'operand',
                    value: { attribute, operator, value }
                });
            } else {
                console.error(`Invalid condition format: ${condition}`);
            }
        }
    }

    // Construct the AST
    let currentNode = nodes[0];
    for (let i = 1; i < nodes.length; i += 2) {
        const operatorNode = nodes[i];
        const rightOperand = nodes[i + 1];

        if (!rightOperand) break;

        currentNode = {
            type: 'operator',
            value: operatorNode.value,
            left: currentNode,
            right: rightOperand
        };
    }

    return currentNode;
}

function evaluateAST(ast, userData) {
    console.log('Input AST:', JSON.stringify(ast, null, 2));
    console.log('Input userData:', userData);

    // ASTq adapter configuration
    astq.adapter({
        taste: (node) => typeof node === 'object' && node.type,
        getChildNodes: (node) => [node.left, node.right].filter(Boolean),
        getNodeType: (node) => node.type
    });

    // Recursive function to evaluate each node
    function evaluateNode(node) {
        if (node.type === 'operand') {
            // Check if node.value is an object with expected properties
            if (typeof node.value !== 'object' || !node.value.attribute || !node.value.operator || !node.value.value) {
                console.error(`Unexpected structure for node.value:`, node);
                return false;
            }

            const { attribute, operator, value } = node.value;

            // Ensure the attribute exists in userData
            if (!(attribute in userData)) {
                console.warn(`Attribute ${attribute} not found in userData.`);
                return false; // Attribute missing, treat as failed condition
            }

            const userValue = userData[attribute].toString();
            const ruleValue = value.toString();

            // Evaluate based on the operator
            let conditionMet = false;
            switch (operator) {
                case '>': conditionMet = userValue > ruleValue; break;
                case '<': conditionMet = userValue < ruleValue; break;
                case '>=': conditionMet = userValue >= ruleValue; break;
                case '<=': conditionMet = userValue <= ruleValue; break;
                case '==': conditionMet = userValue == ruleValue; break;
                case '!=': conditionMet = userValue != ruleValue; break;
                default:
                    console.error(`Unsupported operator: ${operator}`);
                    return false;
            }

            // Log the evaluation result
            console.log(`Evaluating: ${attribute} ${operator} ${value} => ${conditionMet}`);
            return conditionMet;
        } else if (node.type === 'operator') {
            const leftResult = evaluateNode(node.left);
            const rightResult = evaluateNode(node.right);

            // Combine results based on the operator
            if (node.value === 'AND') {
                return leftResult && rightResult;
            } else if (node.value === 'OR') {
                return leftResult || rightResult;
            } else {
                console.error(`Unsupported logical operator: ${node.value}`);
                return false;
            }
        }
        return false;
    }

    // Start evaluation from the root node
    const result = evaluateNode(ast);
    console.log('Evaluation result:', result);
    return result;
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
