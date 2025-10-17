# Local LLM Host - Frontend Only

A simplified frontend-only version of the Local LLM Host platform for demonstration purposes.

## Quick Start

```bash
# Install dependencies
yarn install

# Start the development server
yarn start
```

The application will be available at `http://localhost:5173/`

## What Changed

This version has been simplified to run without a backend server:

- ✅ **Removed**: Server folder and all backend dependencies
- ✅ **Removed**: Database dependencies (Drizzle, PostgreSQL)
- ✅ **Removed**: Express server and authentication
- ✅ **Updated**: API calls now use mock data for demonstration
- ✅ **Simplified**: Package.json contains only frontend dependencies

## Features Available

- **UI Components**: All React components and UI elements are functional
- **Mock APIs**: Local LLM management APIs return mock data
- **DeepSeek Integration**: Mock DeepSeek API responses (configure with real API keys to use actual service)
- **Live Dashboard**: Analytics and monitoring with simulated data
- **Responsive Design**: Full mobile and desktop support

## Production Deployment

To deploy this frontend:

1. Build the project: `yarn build`
2. Serve the `dist` folder with any static file server
3. Configure environment variables for external API integrations

## External API Integration

To integrate with real external APIs:

1. Update the API files in `client/src/lib/`
2. Add your API keys to environment variables
3. Replace mock responses with actual API calls

## Development Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Type checking

---

*This is a simplified frontend-only version for demonstration. For full functionality with local LLM management, set up the appropriate backend services.*