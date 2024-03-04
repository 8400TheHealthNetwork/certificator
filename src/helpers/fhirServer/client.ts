import { FhirClient } from 'fume-fhir-converter';

export class ExtendedFhirClient extends FhirClient {
  public async create (resource: object, resourceType: string) {
    if (this.fhirServer) {
      const response = await this.fhirServer.post(`/${resourceType}`, resource);
      return response.data;
    }
    return undefined;
  }

  public async update (resourceType: string, resourceId: string, resource: object) {
    if (this.fhirServer) {
      const response = await this.fhirServer.put(
        `/${resourceType}/${resourceId}`,
        resource
      );
      return response.data;
    }
    return undefined;
  }

  public async simpleDelete (resourceType: string, resourceId: string) {
    if (this.fhirServer) {
      const response = await this.fhirServer.delete(`/${resourceType}/${resourceId}`);
      return response.data;
    }
    return undefined;
  }
};
