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

export {};
