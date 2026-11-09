# CLICKLER PHOTOBOOTH — GitHub Pages + QR Sharing

This is a static website you can edit in Notepad and upload to GitHub Pages. Guests can scan a QR code using **mobile data or any Wi-Fi**.

## What happens to photos?
- The full session gallery remains in the booth browser's local storage.
- Only the finished/composite photo is uploaded to Supabase Storage so the QR has a public internet link.
- The QR opens `view.html` on your GitHub Pages site and shows a Download Photo button.
- This is not cloud backup of your entire gallery. The shared finished photo is stored online until you delete it.
- Anyone with the QR/link can view that photo. Do not use for private or sensitive photos.

## A. Create the online photo storage (required for QR across different networks)
1. Go to https://supabase.com/ and create a free project.
2. Open **SQL Editor → New query**.
3. Open `supabase-setup.sql` from this folder in Notepad, copy all its contents, paste into SQL Editor, then click **Run**. This creates the public `booth-photos` bucket and the upload/read policies.
4. In Supabase, open **Project Settings → API**. Copy the **Project URL** and the **anon / publishable key**. Never use or publish the `service_role` secret key.
5. Open the published CLICKLER site, go to **Settings**, paste the Project URL and anon/publishable key, then click **SAVE QR SETTINGS**. These values are saved in that booth browser.
6. Take a test photo. The result page should show a QR. Scan it using a phone with Wi-Fi turned off (mobile data on) to test cross-network access.

## B. Upload to GitHub Pages
1. Create a GitHub repository, e.g. `clickler-photobooth`.
2. Upload these files directly into the repository root: `index.html`, `style.css`, `app.js`, `view.html`, `supabase-setup.sql`, and `README.md`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to publish. Open the HTTPS URL shown in Pages. Camera permission requires HTTPS (or localhost).

## C. Using the booth
1. Open the GitHub Pages website on the booth laptop.
2. Open Settings and enter the Supabase URL and anon/publishable key once on that laptop/browser.
3. Connect the camera, select the template, and take photos.
4. The finished photo is uploaded; a QR is generated.
5. Guests scan using mobile data or Wi-Fi, open the photo page, and tap **DOWNLOAD PHOTO**.

## Important notes
- Internet is required at the booth to upload each finished photo.
- Guests can be on mobile data or a different Wi-Fi network.
- The Supabase bucket is public so anyone with a photo URL can view it. The anon key is designed for browser use; never use a service-role key in frontend code.
- Photos remain in Supabase Storage until deleted. Check your Supabase storage usage/limits and delete event photos you no longer need. This starter does not automatically expire or delete uploads.
- The browser gallery is local to the booth browser/device; it does not sync to the guest phones.
- DSLR capture works only if the camera is exposed to the browser as a webcam. Direct USB tethered shutter control is not included in a static GitHub Pages site.
- The QR is generated from a public Supabase file URL, wrapped in the GitHub Pages `view.html` download page.

## Files
- `index.html` — booth interface
- `style.css` — design
- `app.js` — camera, layout, local gallery, cloud upload and QR
- `view.html` — mobile photo viewer/download page
- `supabase-setup.sql` — one-time Supabase setup
