declare module "*.css";

// Shopify App Bridge Web Components
declare namespace JSX {
    interface IntrinsicElements {
        "ui-nav-menu": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            HTMLElement
        >;
        "ui-title-bar": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & { title?: string },
            HTMLElement
        >;
        "ui-modal": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & { id?: string; variant?: string },
            HTMLElement
        >;
        "ui-save-bar": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement> & { id?: string },
            HTMLElement
        >;
    }
}
