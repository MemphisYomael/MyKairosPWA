export interface Ilinks {
    id?: number | string;
    Nombre: string;
    Descripcion: string;
    Stock: number;
    linkCompra: string;
    FotoPortada: string;
    Precio: number;
    share?: string[];
    isOffline?: any | undefined | null;
    isOfflineEdit?: any | undefined | null;
}
