# Pixel Analytics

Pixel is an open source analytics library for NextJS applications. It is designed to be
embedded in your NextJS application, so that you can get the most accurate events data.
All events are sent to your own domain -- not a third-party address -- allowing
you to neatly integrate with authentication, avoid using cookies, keep user data safe,
and bypass browser blockers too.

## Get started

### Installing Pixel

Start by installing the package.

```bash
yarn add @pixel/nextjs
```

### Set up environment

Generate a special secret that is used to sign JWTs

```bash
npx uuid
```

Add this special UUID to your environment variables:

```bash
PIXEL_JWT_SECRET="<your UUID>"
```

### Configure

Start by creating a new `pixel.ts` file at the root of your app with the following content. This example uses a BigQuery adapter, but you can choose any (see below)

```tsx
import Pixel from '@pixel/nextjs';

import { Pixel, BigQueryAdapter } from '@/pixel/server';
import { BigQuery } from '@google-cloud/bigquery';
import { auth } from '@/auth';

const client = new BigQuery(...);

export default new Pixel({
  adapter: new BigQueryAdapter(client),
  auth,
})
```

### Choose an adapter

Currently Pixel supports sending events to:

- [Prisma](https://prisma.io)
- [June](https://june.so)
- Local file system ([JSONL](https://jsonlines.org/)) (coming soon)
- Redis (coming soon)
- BigQuery (coming soon)

But it is also extremely easy to build your own adapter. Simply take a look at the existing ones and it should be pretty clear.

### Add an API route for handling client events

This means that any events that are tracked on the client are sent to your own domain,
not a third party domain which can be blocked.

These instructions are for nextjs applications using App Router

Create an API route in `app/api/events/route.ts` with the following code:

```ts
import { handlers } from '@pixel/nextjs';
import pixel from '@/pixel';
export const { POST } = handlers(pixel);
```

If you want to put this route in a custom location, [see these instructions](https://github.com/sneub/pixel/blob/main/docs/custom-api-route.md)

### Wrap your app with the React provider

This should go into your `layout.tsx` if you use the app router, or your `_app.tsx` file if you use the pages router. The following example uses the NextJS app router, but the same logic applies.

```tsx
import { PixelProvider } from '@pixel/nextjs';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <PixelProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </PixelProvider>
  );
}
```

### Optionally identify users

When you "identify" a user, you are providing additional information about them to Pixel, such
as their email, name, image, and any other arbitrary stuff you want to include.

Pixel does not immediately store or process any of this data. It will simply mint a JWT with the
information, which the client will then save to local storage in the browser.

Any events triggered from the client side will automatically include this JWT, and will be sent
to the backend along with each event.

Here is how you can identify a user on the frontend. Note that the only mandatory field is `email`.

```tsx
import { usePixel } from '@pixel/nextjs';

export function AuthComponent() {
  const { identify } = usePixel();

  const handleClick = () => {
    identify({
      email: 'bill@microsoft.com',
      name: 'Bill Gates', // optional
      image: 'https://microsoft.com/bill.png', // optional
      userId: 1, // optional
      data: {
        // optionally include any fields in here
        company: 'Microsoft',
        companyId: 'MS',
      },
    });
  };

  return (
    <div>
      <button onClick={handleClick}>Log in</button>
    </div>
  );
}
```

### Track events on the client side

On the client side of your app, you can easily use the React hook. Here's an example:

```tsx
import { usePixel } from '@pixel/nextjs';

export function MyComponent() {
  const { track } = usePixel();

  const handleClick = () => {
    track('Awesome event');
  };

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

### Track events on the server side

On the server side of your app, you can track using the Pixel client we set up earlier. Let's take a look:

```ts
import pixel from '@/pixel';

pixel.track('Cool event');
```
