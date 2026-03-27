# FC Belt Holder

A web application to manage FIFA/FC match data against a friend, including tournaments history, belt holders, and tier lists for FC teams.

## Features

- **Tournaments History**: Track minor and major tournaments, winners, dates, and participants.
- **Belt Holder**: Display current holders of minor and major belts based on recent tournament wins.
- **Tier List Maker**: Create and edit tier lists for the top FC teams (excluding all-star and national teams) using drag-and-drop.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/page.tsx`: Home page with navigation to features.
- `app/tournaments/page.tsx`: Tournaments history page.
- `app/belt-holder/page.tsx`: Belt holder display page.
- `app/tier-list/page.tsx`: Tier list maker with drag-and-drop functionality.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- @dnd-kit for drag-and-drop

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
