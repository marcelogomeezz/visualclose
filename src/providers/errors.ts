export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`El proveedor ${provider} no está configurado. Define las credenciales y la selección de proveedor en el servidor antes de usarlo.`);
    this.name = "ProviderNotConfiguredError";
  }
}
