# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d841f4d5-599f-4e8e-9cc2-ea1e74aff8f8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d841f4d5-599f-4e8e-9cc2-ea1e74aff8f8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
# Copy the example env file and add your Google Maps API key
cp .env.example .env
# Then edit .env and add your actual API key

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables Setup

This project requires a Google Maps API key for the store locator feature.

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select an existing one
   - Create credentials → API Key
   - Copy your API key

2. **Enable Required APIs:**
   - [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
   - [Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

3. **Set up Billing:**
   - Google Maps requires a billing account (has a generous free tier with $200/month credit)
   - Go to [Billing](https://console.cloud.google.com/billing) and link your project

4. **Configure API Key Restrictions (Optional but recommended):**
   - For development: Remove restrictions or allow `localhost`
   - For production: Add your domain to HTTP referrer restrictions

5. **Add to your `.env` file:**
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

**Note:** Never commit your `.env` file to version control. Use `.env.example` as a template.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d841f4d5-599f-4e8e-9cc2-ea1e74aff8f8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
