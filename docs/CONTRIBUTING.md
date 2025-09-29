# 🤝 Contributing Guide

Thank you for your interest in contributing to the Cloudedze project! This guide will help you get started with contributing to our open-source project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences
- Accept responsibility for our mistakes

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (for OCI integration)
- **PostgreSQL** 12+
- **Git** for version control
- **Docker** (optional, for containerized development)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/costcal.git
   cd costcal
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/santoshguru-11/costcal.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Create database
createdb cloud_cost_optimizer

# Run database setup
psql -d cloud_cost_optimizer -f database_setup.sql

# Test database setup
psql -d cloud_cost_optimizer -f test_database.sql
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 4. Start Development Server

```bash
# Start in development mode
npm run dev
```

## 🔄 Contributing Process

### 1. Choose an Issue

- Look for issues labeled `good first issue` for beginners
- Check `help wanted` for more complex tasks
- Create a new issue if you have a feature idea

### 2. Create a Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. Make Changes

- Write clean, readable code
- Follow the coding standards
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new cost analysis feature

- Add support for multi-region cost comparison
- Implement cost optimization recommendations
- Add unit tests for new functionality

Closes #123"
```

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## 📝 Coding Standards

### TypeScript/JavaScript

#### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **Prettier** for code formatting
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Use **semicolons** at end of statements

#### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'john_doe';
function calculateTotalCost() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Classes: PascalCase
class CostAnalyzer {}

// Interfaces: PascalCase with 'I' prefix
interface ICloudResource {}

// Types: PascalCase
type CloudProvider = 'aws' | 'azure' | 'gcp' | 'oci';
```

#### File Organization

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── features/       # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Page components
├── services/           # API services
└── types/              # TypeScript type definitions
```

#### Example Code

```typescript
// Good: Clear, typed, documented
interface CloudResource {
  id: string;
  name: string;
  type: string;
  cost: number;
  region: string;
}

/**
 * Calculates the total cost of cloud resources
 * @param resources Array of cloud resources
 * @returns Total cost in USD
 */
function calculateTotalCost(resources: CloudResource[]): number {
  return resources.reduce((total, resource) => total + resource.cost, 0);
}

// Bad: Unclear, untyped, undocumented
function calc(res) {
  let t = 0;
  for (let i = 0; i < res.length; i++) {
    t += res[i].cost;
  }
  return t;
}
```

### Python

#### Code Style

- Follow **PEP 8** style guide
- Use **Black** for code formatting
- Use **flake8** for linting
- Use **type hints** for function parameters and return values

#### Example Code

```python
# Good: Clear, typed, documented
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class OCIInventoryService:
    """Service for discovering OCI resources."""
    
    def __init__(self, credentials: Dict[str, Any]) -> None:
        """Initialize OCI service with credentials.
        
        Args:
            credentials: OCI authentication credentials
        """
        self.credentials = credentials
        self.logger = logger
    
    def discover_resources(self) -> Dict[str, List[Dict[str, Any]]]:
        """Discover all OCI resources across compartments.
        
        Returns:
            Dictionary containing discovered resources by type
        """
        try:
            # Implementation here
            return {"compute_instances": [], "block_volumes": []}
        except Exception as e:
            self.logger.error(f"Failed to discover resources: {e}")
            raise
```

### SQL

#### Code Style

- Use **UPPERCASE** for SQL keywords
- Use **snake_case** for table and column names
- Use **descriptive names** for tables and columns
- Add **comments** for complex queries

#### Example Code

```sql
-- Good: Clear, commented, formatted
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(cc.id) as credential_count
FROM users u
LEFT JOIN cloud_credentials cc ON u.id = cc.user_id
WHERE u.created_at >= '2024-01-01'
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING COUNT(cc.id) > 0
ORDER BY credential_count DESC;

-- Bad: Unclear, uncommented, poorly formatted
select u.id,u.email,u.first_name,u.last_name,count(cc.id) as cnt from users u left join cloud_credentials cc on u.id=cc.user_id where u.created_at>='2024-01-01' group by u.id,u.email,u.first_name,u.last_name having count(cc.id)>0 order by cnt desc;
```

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── unit/               # Unit tests
│   ├── components/     # Component tests
│   ├── services/       # Service tests
│   └── utils/          # Utility tests
├── integration/        # Integration tests
│   ├── api/            # API tests
│   └── database/       # Database tests
└── e2e/                # End-to-end tests
    └── features/       # Feature tests
```

### Unit Tests

```typescript
// Example unit test
import { calculateTotalCost } from '../lib/costCalculator';
import { CloudResource } from '../types/cloud';

describe('calculateTotalCost', () => {
  it('should calculate total cost correctly', () => {
    const resources: CloudResource[] = [
      { id: '1', name: 'instance1', type: 'ec2', cost: 10, region: 'us-east-1' },
      { id: '2', name: 'instance2', type: 'ec2', cost: 15, region: 'us-west-2' }
    ];
    
    const total = calculateTotalCost(resources);
    
    expect(total).toBe(25);
  });
  
  it('should return 0 for empty array', () => {
    const total = calculateTotalCost([]);
    expect(total).toBe(0);
  });
});
```

### Integration Tests

```typescript
// Example integration test
import request from 'supertest';
import app from '../app';

describe('POST /api/inventory/scan', () => {
  it('should scan AWS resources successfully', async () => {
    const response = await request(app)
      .post('/api/inventory/scan')
      .send({
        providers: ['aws'],
        credentials: [{
          provider: 'aws',
          credentials: {
            accessKeyId: 'test-key',
            secretAccessKey: 'test-secret',
            region: 'us-east-1'
          }
        }]
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.inventory.resources).toBeDefined();
  });
});
```

### Test Coverage

- Aim for **80%+ code coverage**
- Test **happy paths** and **error cases**
- Test **edge cases** and **boundary conditions**
- Mock **external dependencies**

## 📚 Documentation

### Code Documentation

#### JSDoc for TypeScript

```typescript
/**
 * Calculates the total cost of cloud resources across all providers
 * @param resources Array of cloud resources
 * @param currency Currency code (default: 'USD')
 * @returns Total cost in specified currency
 * @throws {Error} When resources array is invalid
 * @example
 * ```typescript
 * const resources = [
 *   { cost: 100, currency: 'USD' },
 *   { cost: 50, currency: 'USD' }
 * ];
 * const total = calculateTotalCost(resources, 'USD');
 * console.log(total); // 150
 * ```
 */
function calculateTotalCost(
  resources: CloudResource[], 
  currency: string = 'USD'
): number {
  // Implementation
}
```

#### Python Docstrings

```python
def discover_resources(self) -> Dict[str, List[Dict[str, Any]]]:
    """Discover all OCI resources across all compartments.
    
    This method scans all accessible compartments and discovers
    various types of OCI resources including compute instances,
    block volumes, load balancers, and networking components.
    
    Returns:
        Dict containing discovered resources organized by type:
        {
            'compute_instances': [...],
            'block_volumes': [...],
            'load_balancers': [...],
            'vcns': [...]
        }
    
    Raises:
        OCIError: When OCI API calls fail
        ValidationError: When credentials are invalid
        
    Example:
        >>> service = OCIInventoryService(credentials)
        >>> resources = service.discover_resources()
        >>> print(f"Found {len(resources['compute_instances'])} instances")
    """
    # Implementation
```

### README Updates

When adding new features:

1. **Update main README.md** with new features
2. **Add usage examples** for new functionality
3. **Update API documentation** if applicable
4. **Add configuration options** to environment section

### API Documentation

Update `docs/API.md` when:

- Adding new endpoints
- Modifying existing endpoints
- Changing request/response formats
- Adding new error codes

## 🐛 Issue Guidelines

### Creating Issues

#### Bug Reports

Use the bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. macOS, Ubuntu, Windows]
- Node.js version: [e.g. 18.0.0]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

#### Feature Requests

Use the feature request template:

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Describe the use case and why this feature would be useful.

**Proposed Solution**
Describe how you think this feature should work.

**Alternatives**
Describe any alternative solutions you've considered.

**Additional Context**
Any other context or screenshots about the feature request.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issue
- `priority: medium` - Medium priority issue
- `priority: low` - Low priority issue

## 🔀 Pull Request Guidelines

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly commented
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Breaking changes documented

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #123
Fixes #456
```

### PR Review Process

1. **Self-review** your PR before requesting review
2. **Request review** from maintainers
3. **Address feedback** promptly
4. **Keep PRs focused** - one feature/fix per PR
5. **Keep PRs small** - easier to review and merge
6. **Update documentation** as needed

### Merge Requirements

- [ ] All tests pass
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Documentation updated
- [ ] Breaking changes documented

## 🏷️ Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Checklist

- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Update documentation
- [ ] Run full test suite
- [ ] Create release notes
- [ ] Tag release
- [ ] Deploy to production

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: darbhasantosh11@gmail.com

### Asking Questions

When asking questions:

1. **Search existing issues** first
2. **Provide context** about your environment
3. **Include error messages** and logs
4. **Describe what you've tried**
5. **Be specific** about what you need help with

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub** contributor graphs
- **Project documentation**

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to Cloudedze!** 🎉

Your contributions help make cloud cost optimization accessible to everyone.
