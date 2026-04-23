/**
 * Dynamically loads the Midtrans Snap.js script only when needed (at checkout).
 * This prevents the ~50kb script from blocking initial page load.
 */
let midtransLoaded = false;
let loadPromise: Promise<void> | null = null;

export function loadMidtransSnap(): Promise<void> {
  if (midtransLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      "SB-Mid-client-YOUR_CLIENT_KEY"
    );
    script.async = true;
    script.onload = () => {
      midtransLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Midtrans"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
