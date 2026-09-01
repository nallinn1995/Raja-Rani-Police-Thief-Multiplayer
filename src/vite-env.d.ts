/// <reference types="vite/client" />

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: any) => void;
        prompt: (momentListener?: (moment: any) => void) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
        disableAutoSelect: () => void;
        revoke: (hint: string, done: () => void) => void;
      };
    };
  };
}
