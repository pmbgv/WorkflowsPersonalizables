import { requests, type Request, type InsertRequest } from "@shared/schema";

export interface IStorage {
  getRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    busqueda?: string;
  }): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined>;
  deleteRequest(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private requests: Map<number, Request>;
  private currentId: number;

  constructor() {
    this.requests = new Map();
    this.currentId = 1;
    
    // Initialize with some sample data
    this.seedData();
  }

  private seedData() {
    const sampleRequests: Omit<Request, 'id'>[] = [
      {
        tipo: "Permiso",
        fechaSolicitada: "12/05/2025",
        fechaFin: null,
        asunto: "Permiso personal por motivos familiares",
        descripcion: "Solicito permiso para ausentarme el día 12 de mayo debido a una cita médica familiar importante que no puede ser reprogramada.",
        estado: "Pendiente",
        solicitadoPor: "Andrés Acevedo",
        prioridad: "normal",
        archivosAdjuntos: [],
        fechaCreacion: new Date("2025-03-19"),
        fechaActualizacion: new Date("2025-03-19"),
      },
      {
        tipo: "Vacaciones",
        fechaSolicitada: "08/04/2025",
        fechaFin: "11/04/2025",
        asunto: "Vacaciones de semana santa",
        descripcion: "Solicito vacaciones durante la semana santa para viajar con mi familia.",
        estado: "Aprobado",
        solicitadoPor: "Andrés Acevedo",
        prioridad: "normal",
        archivosAdjuntos: [],
        fechaCreacion: new Date("2025-02-02"),
        fechaActualizacion: new Date("2025-02-02"),
      },
      {
        tipo: "Marca",
        fechaSolicitada: "03/02/2025",
        fechaFin: null,
        asunto: "Corrección de marcaje",
        descripcion: "Solicito corrección de marcaje del día 3 de febrero debido a problemas técnicos con el sistema.",
        estado: "Rechazado",
        solicitadoPor: "Andrés Acevedo",
        prioridad: "alta",
        archivosAdjuntos: [],
        fechaCreacion: new Date("2025-02-02"),
        fechaActualizacion: new Date("2025-02-02"),
      },
    ];

    sampleRequests.forEach(req => {
      const id = this.currentId++;
      this.requests.set(id, { ...req, id });
    });
  }

  async getRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    busqueda?: string;
  }): Promise<Request[]> {
    let result = Array.from(this.requests.values());

    if (filters) {
      if (filters.estado) {
        result = result.filter(req => req.estado === filters.estado);
      }
      if (filters.tipo) {
        result = result.filter(req => req.tipo === filters.tipo);
      }
      if (filters.busqueda) {
        const search = filters.busqueda.toLowerCase();
        result = result.filter(req => 
          req.solicitadoPor.toLowerCase().includes(search) ||
          req.tipo.toLowerCase().includes(search) ||
          req.asunto.toLowerCase().includes(search)
        );
      }
    }

    // Sort by creation date, newest first
    result.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    return result;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const id = this.currentId++;
    const now = new Date();
    const newRequest: Request = {
      ...request,
      id,
      estado: "Pendiente",
      fechaCreacion: now,
      fechaActualizacion: now,
    };
    this.requests.set(id, newRequest);
    return newRequest;
  }

  async updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;

    const updatedRequest = {
      ...request,
      ...updates,
      fechaActualizacion: new Date(),
    };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteRequest(id: number): Promise<boolean> {
    return this.requests.delete(id);
  }
}

export const storage = new MemStorage();
