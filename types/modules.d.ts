declare module "*.yml" {
    const value: any;
    export default value;
}

declare module "*.less";
declare module "*.css";

interface Node {
    closest?(selector: string): Element | null;
}

interface Window {
    clipboardData?: DataTransfer;
}
