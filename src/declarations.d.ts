// For Parcel, allow URL objects for service workers
interface ServiceWorkerContainer extends EventTarget {
  register(
    scriptURL: URL,
    options?: RegistrationOptions,
  ): Promise<ServiceWorkerRegistration>;
}
