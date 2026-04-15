/**
 * Svelte Action: clickOutside
 * Dispatches an event or executes a callback when a click happens outside the node.
 */
export function clickOutside(node: HTMLElement, callback: () => void) {
    const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Check if the click was outside the element and its children
        if (node && !node.contains(target) && !event.defaultPrevented) {
            callback();
        }
    };

    // Add listener to the document
    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            // Clean up listener when element is removed from DOM
            document.removeEventListener('click', handleClick, true);
        }
    };
}