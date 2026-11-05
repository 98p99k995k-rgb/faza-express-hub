# Google Places setup

Restaurant and cafe search uses Google Places API (New) through the `places` Supabase Edge Function. The Google key is read only from the Edge Function environment and must never be added to a `VITE_*` variable or committed to the repository.

## Google Cloud

1. Select the Google Cloud project used for Fazaa and enable Places API (New).
2. Enable billing and set a budget alert and API quotas for Nearby Search, Place Details, and Place Photos.
3. Create an API key restricted to Places API (New). Keep the key on the server. If the deployment has stable egress IPs, restrict the key to those IPs as well.
4. Review Google's Places and photo attribution requirements before launch. The app displays Google Maps attribution and photo-author attributions supplied with each result.

## Supabase

Set the Google key as an Edge Function secret from a trusted terminal. Do not send it in chat or expose it in frontend variables:

```sh
supabase secrets set GOOGLE_MAPS_API_KEY="YOUR_KEY"
supabase functions deploy places
```

Configure the existing public frontend values in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

The anon key is public by design. `GOOGLE_MAPS_API_KEY` is not. The `places` function accepts bounded 10 km searches for restaurants and cafes, Place Details lookups, and validated Google photo resource names. It does not accept arbitrary outbound URLs.

## Runtime behavior

Until Supabase and `GOOGLE_MAPS_API_KEY` are configured and the function is deployed, the restaurant/cafe screens show a setup/network error with a retry action. They do not substitute sample businesses, ratings, hours, prices, or unrelated photos. Businesses with no Google photo display “No photo available”.
