import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the main content area back to top on every route change.
 * Placed inside the router so useLocation() works.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll the <main> content container (not window, since body is overflow:hidden)
        const main = document.querySelector('main');
        if (main) {
            main.scrollTo(0, 0);
        }
        // Fallback for window
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
