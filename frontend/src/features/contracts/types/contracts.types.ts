export type ContractType = "RESERVATION" | "PURCHASE_AGREEMENT";

export type ContractStatus = "DRAFT" | "PENDING_SIGNATURE" | "SIGNED" | "CANCELLED";

export interface Contract {
    id: string;
    folio: string;
    propertyId: string;
    propertyTitle: string;
    clientId: string;
    clientName: string;
    agentId: string;
    agentName: string;
    contractType: ContractType;
    status: ContractStatus;
    reservationPrice: number;
    salePrice?: number;
    clientRfc?: string;
    clientAddress?: string;
    clientCfdiUse?: string;
    companyRfc?: string;
    companyName?: string;
    pdfUrl?: string;
    createdAt: string;
}

export interface ContractCreateDTO {
    propertyId: string;
    clientId: string;
    agentId: string;
    contractType: ContractType;
    reservationPrice: number;
    salePrice?: number;
    clientRfc?: string;
    clientAddress?: string;
    clientCfdiUse?: string;
}

export interface ContractUpdateDTO {
    status?: ContractStatus;
    salePrice?: number;
    clientRfc?: string;
    clientAddress?: string;
    clientCfdiUse?: string;
    pdfUrl?: string;
}

export interface ContractFilterParams {
    search?: string;
    status?: ContractStatus;
    contractType?: ContractType;
    limit: number;
    offset: number;
}

export interface ContractsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Contract[];
}
