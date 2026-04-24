import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollHandler handles two things:
 * 1. Scrolling to top on route change (e.g. from Home to Catalog)
 * 2. Scrolling to anchor tags (e.g. #faq) even when navigating from another page
 */
export default function ScrollHandler() {
  const [location] = useLocation();

  useEffect(() => {
    const handleScrollToAnchor = () => {
      if (window.location.hash) {
        const id = window.location.hash.replace("#", "");
        
        // Retry logic to find the element (up to 10 retries over 1 second)
        let retries = 0;
        const findAndScroll = () => {
          const element = document.getElementById(id);
          if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
            return true;
          }
          return false;
        };

        if (!findAndScroll()) {
          const interval = setInterval(() => {
            retries++;
            if (findAndScroll() || retries >= 10) {
              clearInterval(interval);
            }
          }, 100);
        }
      } else {
        window.scrollTo(0, 0);
      }
    };

    handleScrollToAnchor();

    window.addEventListener("hashchange", handleScrollToAnchor);
    return () => window.removeEventListener("hashchange", handleScrollToAnchor);
  }, [location]);

  return null;
}
