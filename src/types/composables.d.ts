// 声明 composables 函数，解决使用时出现波浪线的问题
declare global {
  // lang.ts
  function t(message: string): string;

  // auth.ts
  function useAuth(): any;

  // captcha.ts
  function useCaptcha(): any;

  // login.ts
  function useLogin(): any;

  // send-sms.ts
  function useSendSms(): any;
}

// 模板中可直接使用 t() / $t()（auto-import 与 vue-i18n globalInjection）
declare module 'vue' {
  interface ComponentCustomProperties {
    t: (message: string, ...args: any[]) => string;
    $t: (message: string, ...args: any[]) => string;
  }
}

export {};
