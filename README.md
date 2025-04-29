# Propforge Documentation

<div align="center">
  <img src="https://raw.githubusercontent.com/flavio-ever/propforge/main/assets/images/propforge-logo.svg" alt="PropForge Logo" width="200"/>
  <p>A lightweight utility library for working with nested object properties and templates in TypeScript/JavaScript.</p>

  [![npm version](https://badge.fury.io/js/propforge.svg)](https://badge.fury.io/js/propforge)
  [![Coverage](https://codecov.io/gh/flavio-ever/propforge/branch/main/graph/badge.svg)](https://codecov.io/gh/flavio-ever/propforge)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

</div>

## Table of Contents

- [Propforge Documentation](#propforge-documentation)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Core Features](#core-features)
    - [Property Operations](#property-operations)
    - [Property Transformers](#property-transformers)
    - [Template Engine](#template-engine)
      - [Transformer Structure](#transformer-structure)
    - [Debug Mode](#debug-mode)
    - [Fallback Values](#fallback-values)
  - [Examples](#examples)
    - [Basic: Data Formatting](#basic-data-formatting)
    - [Intermediate: Validation and Formatting](#intermediate-validation-and-formatting)
    - [Advanced: External API Integration](#advanced-external-api-integration)
    - [Complete: Property Transformers and Templates](#complete-property-transformers-and-templates)
  - [Best Practices](#best-practices)
  - [Complete Documentation](#complete-documentation)
  - [Contributing](#contributing)
  - [License](#license)

## Introduction

Propforge is a powerful TypeScript/JavaScript library designed to simplify working with nested object properties and creating dynamic templates. It provides a set of utilities that make it easy to access, modify, and transform complex data structures with minimal code.

**Key Features:**

- 🔍 **Property Access**: Access and manipulate nested properties using dot notation
- 🧰 **Property Transformers**: Define transformers for automatic data conversion during property operations
- 📝 **Template Engine**: Create dynamic templates with multiple syntax styles
- 🔧 **Fallback Values**: Configure default values for missing properties
- 🛡️ **Security**: Built-in protection against prototype pollution
- 🧩 **Type Safety**: Comprehensive TypeScript support
- 🔄 **Async Support**: Support for async transformers for asynchronous operations
- 🐛 **Debug Utilities**: Track operations with detailed logging
- 🎯 **Flexible**: Support for multiple template syntaxes and transformation patterns

## Installation

```bash
# Using npm
npm install propforge

# Using yarn
yarn add propforge

# Using pnpm
pnpm add propforge

# Using bun
bun add propforge
```

## Core Features

### Property Operations

Propforge provides four main functions for working with nested object properties.

```typescript
import { getProp, setProp, hasProp, removeProp } from 'propforge';

const user = {
  name: 'Flavio Ever',
  profile: {
    age: 30,
    skills: ['JavaScript', 'TypeScript']
  }
};

// Access properties
getProp(user, 'name');                // 'Flavio Ever'
getProp(user, 'profile.age');         // 30
getProp(user, 'profile.email', 'n/a'); // 'n/a' (default value)

// Access arrays
getProp(user, 'profile.skills.0');    // 'JavaScript'
getProp(user, 'profile.skills.1');    // 'TypeScript'
getProp(user, 'profile.skills.2');    // undefined

// Set properties
setProp(user, 'name', 'John');        // Update name
setProp(user, 'profile.email', 'john@example.com'); // Create email

// Work with arrays
setProp(user, 'profile.skills.2', 'React'); // Add to array
setProp(user, 'profile.skills', ['JavaScript', 'TypeScript', 'React']); // Replace array

// Check properties
hasProp(user, 'name');                // true
hasProp(user, 'profile.age');         // true
hasProp(user, 'profile.email');       // true
hasProp(user, 'profile.skills.0');    // true
hasProp(user, 'profile.skills.3');    // false

// Remove properties
removeProp(user, 'profile.email');    // Remove email
removeProp(user, 'profile.skills.1'); // Remove 'TypeScript' from array
hasProp(user, 'profile.email');       // false
hasProp(user, 'profile.skills.1');    // false
```

### Property Transformers

Propforge allows you to define transformers for automatic data conversion during property operations. This is useful for data normalization, validation, and formatting.

Propforge is completely type-safe. By passing your interface types to `props.use<User>({...})`, you enable TypeScript autocomplete and type checking for all property paths and transformers, making your code more robust and easier to maintain.

```typescript
import { props, getProp, setProp } from 'propforge';

// Define transformers for different operations and properties
props.use<User>({
  // Global fallback value for missing properties
  fallback: 'N/A',
  
  transformers: {
    // Transformers for getProp operations
    getProp: {
      name: (value) => typeof value === 'string' ? value.trim() : value,
      'profile.email': (value) => typeof value === 'string' ? value.trim() : value,
      'profile.age': (value) => {
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
      }
    },
    
    // Transformers for setProp operations
    setProp: {
      name: (value) => typeof value === 'string' ? value.trim() : value,
      'profile.email': (value) => 
        typeof value === 'string' ? value.trim().toLowerCase() : value
    },
    
    // Transformers for removeProp operations
    removeProp: {
      // Cleanup transformers before removal
      name: (value) => typeof value === 'string' ? value.trim() : value,
    },
    
    // Transformers for hasProp operations
    hasProp: {
      // Normalize paths before checking
      'profile.email': (value) => typeof value === 'string' ? value.trim() : value,
    }
  }
});

const user = {
  name: '  Flavio Ever  ',
  profile: { age: '30' }
};

// Automatic transformations applied
getProp(user, 'name');                // 'Flavio Ever' (trimmed)
getProp(user, 'profile.age');         // 30 (converted to number)
setProp(user, 'profile.email', '  FLAVIO@EXAMPLE.COM  '); // Will be stored as 'flavio@example.com'
```

### Template Engine

Propforge provides a powerful and flexible template engine. All transformers are asynchronous, allowing for complex operations and external API integrations.

> **Note:** If a transformer specified in the template does not exist, the original value will be kept (no error is thrown) and a warning will be logged (if debug mode is enabled). This makes template rendering more robust and prevents typos from breaking your output.

#### Transformer Structure

Transformers can be used in three ways:

1. **Single Transformer**

   ```typescript
   {{value | transformer}}
   ```
2. **Transformer with Arguments**

   ```typescript
   {{value | transformer:arg1,arg2,arg3}}
   ```
3. **Transformer Chain**

   ```typescript
   {{value | transformer1:arg1 | transformer2:arg1,arg2 | transformer3}}
   ```

Arguments can be:

- String literals: `"text"` or `'text'`
- Numbers: `123` or `45.67`
- Booleans: `true` or `false`
- Context variables: `user.name` or `profile.age`

Example:

```typescript
import { template } from 'propforge';

template.use({
  // Define global fallback value for missing properties in templates
  fallback: 'N/A',
  
  transformers: {
    formatCurrency: async (value, currency = 'BRL', locale = 'pt-BR') => 
      new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value),
    formatDate: async (value, locale = 'pt-BR') => 
      new Date(value).toLocaleDateString(locale),
    truncate: async (value, length = 50, suffix = '...') => 
      String(value).length > length ? String(value).slice(0, length) + suffix : value,
    capitalize: async (value) => 
      String(value).charAt(0).toUpperCase() + String(value).slice(1)
  }
});

const data = {
  price: 1000.50,
  date: '2024-01-15',
  description: '  this is a very long description that needs to be truncated and formatted  '
};

const result = await template(`
// Single transformer
Price: {{price | formatCurrency}}

// Transformer with multiple arguments
Price in USD: {{price | formatCurrency:USD,en-US}}

// Transformer chain
Description: {{description | truncate:20,! | capitalize}}

// Using context variables as arguments
Date: {{date | formatDate:user.locale}}

// Missing property with fallback
Notes: {{notes}}
`)({ ...data, user: { locale: 'en-US' } });

// Output:
/*
Price: R$ 1.000,50
Price in USD: $1,000.50
Description: This is a very long!
Date: 1/15/2024
Notes: N/A
*/
```

### Debug Mode

Propforge provides detailed logging for debugging template processing and property operations. To enable debug mode:

```typescript
import { configureDebug } from 'propforge';

// Enable debug mode
configureDebug({
  enabled: true,
  colors: true // Optional: enable colored output
});

// Example with debug output
const user = {
  name: 'Flavio Ever',
  profile: {
    age: 30
  }
};

// Property operations will now show debug logs
getProp(user, 'name');
// Debug output: [props] get: name → "Flavio Ever"

setProp(user, 'profile.email', 'flavio@example.com');
// Debug output: [props] set: profile.email → "flavio@example.com"

// Template processing will show transformation steps
const result = await template(`
Name: {{name | capitalize}}
Age: {{profile.age}}
`)(user);

// Debug output:
// [template] transform: start
// [template] get: name → "Flavio Ever"
// [template] transform: capitalize → "Flavio Ever"
// [template] get: profile.age → 30
// [template] transform: complete
```

Debug logs show:
- Property access operations (get, set, has, remove)
- Template processing steps
- Transformation results
- Error details when operations fail

### Fallback Values

Propforge provides multiple ways to handle missing properties:

1. **Function-level fallbacks**

```typescript
// Provide fallback as third argument to getProp
getProp(user, 'profile.email', 'No email provided');
```

2. **Global fallbacks for property operations**

```typescript
import { props } from 'propforge';

// Set global fallback for all getProp operations
props.use({
  fallback: 'N/A'
});

// Now all missing properties will return 'N/A' instead of undefined
getProp(user, 'profile.email'); // Returns 'N/A' if email doesn't exist
```

3. **Global fallbacks for templates**

```typescript
import { template } from 'propforge';

// Set global fallback for all template variables
template.use({
  fallback: 'N/A'
});

// Now all missing template variables will show 'N/A'
const result = await template(`
Email: {{profile.email}}
`)(user); // Shows "Email: N/A" if email doesn't exist
```

## Examples

### Basic: Data Formatting

```typescript
import { template } from 'propforge';

template.use({
  transformers: {
    formatDate: async (value, locale = 'pt-BR') => 
      new Date(value).toLocaleDateString(locale),
    formatCurrency: async (value, currency = 'BRL', locale = 'pt-BR') => 
      new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
  }
});

const data = {
  price: 1000.50,
  date: '2024-01-15'
};

const result = await template(`
Price: {{price | formatCurrency}}
Date: {{date | formatDate}}
`)(data);

// Output:
/*
Price: R$ 1.000,50
Date: 15/01/2024
*/
```

### Intermediate: Validation and Formatting

```typescript
import { template } from 'propforge';

template.use({
  transformers: {
    validateEmail: async (value) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(value) ? value : 'Invalid email';
    },
    formatPhone: async (value) => {
      const numbers = String(value).replace(/\D/g, '');
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  }
});

const data = {
  email: 'user@example.com',
  phone: '11999999999'
};

const result = await template(`
Email: {{email | validateEmail}}
Phone: {{phone | formatPhone}}
`)(data);

// Output:
/*
Email: user@example.com
Phone: (11) 99999-9999
*/
```

### Advanced: External API Integration

```typescript
import { template } from 'propforge';

template.use({
  transformers: {
    fetchAddress: async (zipCode) => {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error('Invalid ZIP code');
      return `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
    },
    fetchWeather: async (city) => {
      const response = await fetch(`https://api.weather.com/${city}`);
      const data = await response.json();
      return `${data.temp}°C, ${data.conditions}`;
    }
  }
});

const data = {
  zipCode: '01001000',
  city: 'São Paulo'
};

const result = await template(`
Address: {{zipCode | fetchAddress}}
Weather: {{city | fetchWeather}}
`)(data);

// Output:
/*
Address: Praça da Sé, Sé - São Paulo/SP
Weather: 25°C, Sunny
*/
```

### Complete: Property Transformers and Templates

```typescript
import { configureDebug, props, getProp, setProp, template } from 'propforge';

// Define user interface
interface User {
  name: string;
  profile: {
    age: number;
    email?: string;
    bio?: string;
  };
}

// Enable debug mode
configureDebug({
  enabled: true,
  colors: true
});

// Configure property transformers
props.use<User>({
  // Global fallback
  fallback: 'N/A',
  
  transformers: {
    // GetProp transformers
    getProp: {
      name: (value) => typeof value === 'string' ? value.trim() : value,
      'profile.email': (value) => typeof value === 'string' ? value.trim() : value,
      'profile.age': (value) => {
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
      }
    },
    
    // SetProp transformers
    setProp: {
      name: (value) => typeof value === 'string' ? value.trim() : value,
      'profile.email': (value) => 
        typeof value === 'string' ? value.trim().toLowerCase() : value
    }
  }
});

// Configure template transformers
template.use({
  fallback: 'N/A',
  transformers: {
    capitalize: async (value) => 
      String(value).charAt(0).toUpperCase() + String(value).slice(1),
    uppercase: async (value) => String(value).toUpperCase(),
    lowercase: async (value) => String(value).toLowerCase()
  }
});

// Create user object with explicit typing for TypeScript autocomplete and validation
const user: User = {
  name: '  Flavio Ever  ',
  profile: {
    age: 30
  }
};

// Property operations with transformers
setProp(user, 'profile.email', '  FLAVIO@EXAMPLE.COM  ');
// Stored as 'flavio@example.com'

const name = getProp(user, 'name');
// Returns 'Flavio Ever' (trimmed)

// Process template with transformers
const result = await template(`
Name: {{name | capitalize}}
Age: {{profile.age}}
Email: {{profile.email | uppercase}}
Bio: {{profile.bio}}
`)(user);

// Output:
/*
Name: Flavio ever
Age: 30
Email: FLAVIO@EXAMPLE.COM
Bio: N/A
*/
```

## Best Practices

1. **Security**

   - Always validate input data before using in property paths
   - Use sanitization transformers for sensitive data
   - Implement proper access control
2. **Performance**

   - Avoid heavy synchronous transformers
   - Use async transformers for I/O operations
   - Consider implementing application-level caching when needed
3. **Error Handling**

   - Always handle errors in async transformers
   - Provide default values for optional properties
   - Use try/catch for operations that might fail
4. **Type Safety**

   - Use TypeScript for better type safety
   - Define clear interfaces for your data (`interface User {...}`)
   - Pass your types to props.use<Type>({...}) to enable autocomplete and type checking
   - Enjoy autocomplete suggestions for property paths in all operations
   - Validate input types in transformers
5. **Debugging**

   - Enable debug mode during development
   - Use the configureDebug function to get detailed logs
   - Monitor transformation chains for unexpected results

## Complete Documentation

For complete API documentation, including all features and detailed examples, visit [https://flavio-ever.github.io/propforge/](https://flavio-ever.github.io/propforge/).

## Contributing

To contribute to the project, please read the [CONTRIBUTING.md](CONTRIBUTING.md) to understand our development process and code standards.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by [Flavio Ever](https://github.com/flavio-ever)