declare module 'govuk-frontend' {
  export interface GovukModule {
    new (root: Element): unknown;
    moduleName: string;
  }
  export const Button: GovukModule;
  export const CharacterCount: GovukModule;
  export const Checkboxes: GovukModule;
  export const ErrorSummary: GovukModule;
  export const FileUpload: GovukModule;
  export const PasswordInput: GovukModule;
  export const Radios: GovukModule;
  export const SkipLink: GovukModule;
}
