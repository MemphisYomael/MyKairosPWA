import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ImydevocionalesConsejerias } from '../interfaces/imydevocionales-consejerias';
import { IRendicionCuentas } from '../interfaces/irendicion-cuentas';
import { Iitinerarios } from '../interfaces/I-Itinerarios';
import { IAcciones } from '../interfaces/Iacciones';
import { IResoluciones } from '../interfaces/iresoluciones';
import { Isermon } from '../interfaces/isermon';
import { IsermonResponse } from '../interfaces/isermon-response';
import { Ilinks } from '../interfaces/ilinks';
import { environment } from '../../environments/environment';
import { MensajeriaHubsService } from './mensajeria-hubs.service';

@Injectable({
  providedIn: 'root'
})
export class ServicioApi1DbService {
  
    private presenceService = inject(MensajeriaHubsService);
  
  // private apiUrl = "http://localhost:5046/";
  // private apiUrl = "http://mysoftmy-001-site2.anytempurl.com/";
  private apiUrl = environment.apiUrl;

  private tokekKey = 'token';
  private tokenKey = 'token';
  private accessKey = 'claveAcceso';
  private cursos = 'cursos';
  private userName = 'userName';
  private email = 'email';
  private id = "id";
  constructor(private http: HttpClient) { }

  login(usuario: any): Observable<any>{
    return this.http.post<any>(this.apiUrl + "api/usuario/login", usuario).pipe(
      map((response: any) => {
        if(response.token){
          localStorage.setItem(this.tokekKey, response.token);
        }
        if(response.claveAcceso){
          localStorage.setItem(this.accessKey, response.claveAcceso);
        }
        if(response.cursos){
          localStorage.setItem(this.cursos, response.cursos);
        }
        if(response.userName){
          localStorage.setItem(this.userName, response.userName);
        }
        if(response.userName){
          localStorage.setItem(this.email, response.email);
        }
        if(response.userName){
          localStorage.setItem(this.id, response.id);
        }
        return response;
      })
      
    );
    
  }

  editUsuario(usuario: any){
    return this.http.put(this.apiUrl + "api/usuario/", usuario);
  }
  getuserById(id: string | null): Observable<any> {
    return this.http.get(this.apiUrl + "api/usuario/" + id);
  }
   getUsers(){
      return this.http.get(this.apiUrl + "api/usuario")
  }

  registrar(usuario: any): Observable<any>{
    return this.http.post<any>(this.apiUrl + "api/usuario/registrar", usuario).pipe(
      map((response: any) => {
        if(response.token){
          localStorage.setItem(this.tokekKey, response.token);
        }
        if(response.claveAcceso){
          localStorage.setItem(this.accessKey, response.claveAcceso);
        }
        if(response.cursos){
          localStorage.setItem(this.cursos, response.cursos);
        }
        if(response.userName){
          localStorage.setItem(this.userName, response.userName);
        }
        if(response.userName){
          localStorage.setItem(this.email, response.email);
        }
        if(response.userName){
          localStorage.setItem(this.id, response.id);
        }
        return response;
      })
    );
  }
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null{
    return localStorage.getItem(this.tokenKey);
  }

  getEmail(): string | null {
    return localStorage.getItem(this.email);
  }

  getId(): string | null {
    return localStorage.getItem(this.id);

  }

  getAccessKey(): string | null {
    return localStorage.getItem(this.accessKey);
  }
  HaveCursoAccess(): any{
    return localStorage.getItem(this.cursos);
  }
  username(): string | null {
    return localStorage.getItem(this.userName);
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.cursos);
    localStorage.removeItem(this.userName);
    localStorage.removeItem(this.email);
    
    this.presenceService.stopHubConnection();
  }




  //CLASES

  //CLASE DE MY-DEVOCIONALES

  postDevocionales(devocional: any): Observable<any> {
    return this.http.post(this.apiUrl + "api/pastor/consejerias", devocional);
  }

  GetDevocionales(): Observable<ImydevocionalesConsejerias>{
    return this.http.get<ImydevocionalesConsejerias>(this.apiUrl + "api/pastor/consejerias");
  }

  deleteDevocionales(id: number): Observable<any>{
    return this.http.delete(this.apiUrl + "api/pastor/consejerias/" + id);
  }

  putDevocionales(objeto:ImydevocionalesConsejerias):Observable<any>{
    return this.http.put<any>(this.apiUrl + "api/pastor/consejerias/" + objeto.id, objeto)

  }


  //Clase de rendicion de cuentas
  getTentaciones(): Observable<any>{
    return this.http.get(this.apiUrl + "api/pastor/reuniones")
  }
  postTentaciones(tentacion: IRendicionCuentas): Observable<any>{
    return this.http.post(this.apiUrl + "api/pastor/reuniones", tentacion)
  }
  deleteTentaciones(id: any) {
    return this.http.delete(this.apiUrl + "api/pastor/reuniones/" + id)
  }

  getOraciones(): Observable<any>{
    return this.http.get(this.apiUrl + "api/tienda/filtros")
  }
  postOraciones(oracion: any): Observable<any>{
    return this.http.post(this.apiUrl + 'api/tienda/filtros', oracion)
  }
  deleteOraciones(id: number):Observable<any>{
    return this.http.delete(this.apiUrl + "api/tienda/filtros/" + id);
  }


  //  Finanzas

  getFinanzas(): Observable<any>{
    return this.http.get(this.apiUrl + "api/tienda/publicidades");
  }
  postFinanza(finanza: any): Observable<any>{
    return this.http.post(this.apiUrl + "api/tienda/publicidades", finanza )
  }
  deleteFinanzas(id: number): Observable<any>{
    return this.http.delete(this.apiUrl + "api/tienda/publicidades/" + id);
  }
  putFinanzas(finanza: any): Observable<any>{
    return this.http.put(this.apiUrl + "api/tienda/publicidades/" + finanza.id, finanza )
  }


  //links

  getLinks(): Observable<any>{
   return this.http.get(this.apiUrl + "api/tienda/productos")
  }
  postLinks(link: any): Observable<any> {
    return this.http.post(this.apiUrl + "api/tienda/productos", link)
  }
  deleteLink(linkId: number): Observable<any> {
    return this.http.delete(this.apiUrl + "api/tienda/productos/" + linkId)
  }
  putLink(link: any): Observable<any>{
    console.log(link)
    return this.http.put<any>(this.apiUrl + "api/tienda/productos/" + link.id, link)
  }

  //Subscripciones
  getSuscripciones(): Observable<any>{
    return this.http.get<any>(this.apiUrl + "api/pastor/itinerarios")
  }
  postSuscripcion(suscripcion: Iitinerarios): Observable<Iitinerarios>{
    return this.http.post<Iitinerarios>(this.apiUrl + "api/pastor/itinerarios", suscripcion)
  }
  deleteSuscripcion(id: number): Observable<Iitinerarios>{
    return this.http.delete<Iitinerarios>(this.apiUrl + "api/pastor/itinerarios/" + id)
  }


  //tareas

  getTareas(): Observable<any> {
   return this.http.get(this.apiUrl + "api/pastor/acciones");
  }

  postTareas(tarea: IAcciones): Observable<any> {
    return this.http.post(this.apiUrl + "api/pastor/acciones", tarea);
  }

  deleteTareas(id: number): Observable<any>{
    return this.http.delete(this.apiUrl + "api/pastor/acciones/" + id);
  }

  putTareas(tarea: IAcciones): Observable<any>{
    return this.http.put(this.apiUrl + "api/pastor/acciones/" + tarea.id, tarea);
  }


  //resoluciones

  getResoluciones(): Observable<any> {
    return this.http.get(this.apiUrl + "api/pastor/clasificaciones");
  }
  postResoluciones(resolucion: IResoluciones): Observable<any>{
    return this.http.post(this.apiUrl + "api/pastor/clasificaciones", resolucion);
  }
  deleteResolucion(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + "api/pastor/clasificaciones/" + id);
  }


  //my-word

  getSermones(): Observable<any> {
    return this.http.get(this.apiUrl + "api/pastor/sermones");
  }
  deleteSermones(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + "api/pastor/sermones/" + id)
  }
  postSermones(sermon: IsermonResponse): Observable<any> {
    return this.http.post(this.apiUrl + "api/pastor/sermones", sermon)
  }
  putSermones(sermon: Isermon): Observable<any> {
    return this.http.put<any>(this.apiUrl + "api/pastor/sermones/" + sermon.id, sermon)
  }
  getSermonById(id: string | null): Observable<any> {
    return this.http.get(this.apiUrl + "api/pastor/sermones/" + id);
  }










  //suscripcionesPaypal
  postPaypalSubs(CodigoSuscripcion: SuscribirseApp): Observable<any>{
    return this.http.post(this.apiUrl + "api/usuario/suscribir", CodigoSuscripcion)
  }


}

export interface SuscribirseApp {
  CodigoSuscripcion: any;
}

