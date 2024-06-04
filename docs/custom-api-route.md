# Configuring a custom API route

If you need or want to use a different route than the default `/api/events`, it is simple:

1. Place the route whereever you need
2. Configure the custom route in the `PixelProvider` like this:

```tsx
<PixelProvider eventsPath="/your/custom/path">...</PixelProvider>
```
