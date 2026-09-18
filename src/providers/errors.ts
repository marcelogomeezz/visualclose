export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} provider is not configured. Set the server-side credentials and provider selection before use.`);
    this.name = "ProviderNotConfiguredError";
  }
}
