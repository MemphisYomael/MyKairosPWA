export interface IsermonResponse {
    id?:number;
    titulo: string;
    contenido?: string;
    dateTime: Date;
    contrasena?: string;
    temporal?: undefined | 1606 | 1677;
}
