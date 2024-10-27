# Rule Engine with AST

## Overview

This 3-tier rule engine using an Abstract Syntax Tree (AST).

## Features

- **Dynamic Rule Creation:** Create and modify rules easily.
- **Rule Combination:** Combine multiple rules into one AST.
- **Rule Evaluation:** Evaluate user attributes against the rules.

## Demo

Watch the demo [here](https://youtu.be/G-FJAd3bnds).

## Data Structure

### AST Node

```javascript
class Node {
  constructor(type, value = null, left = null, right = null) {
      this.type = type; // "operator" or "operand"
      this.value = value; // Operand value
      this.left = left; // Left child
      this.right = right; // Right child
  }
}
```

## Setup Instructions

### Prerequisites

- **Node.js** (>= 14.x)
- **MongoDB** (or Docker)

### Install & Run

```bash
npm install
npm start
```

### Docker (MongoDB)

```bash
docker run --name mongodb -d -p 27017:27017 mongo
```


## Codebase

View the complete codebase on GitHub: [Your GitHub Repository](https://github.com/anushka81/Rule-Engine-with-AST).

---

For questions, feel free to reach out! Email : anniegirdhar@gmail.com
