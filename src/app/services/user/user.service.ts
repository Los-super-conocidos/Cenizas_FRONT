import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap, Observable, switchMap } from 'rxjs';
import { FriendRequest } from 'src/app/schemas/FriendRequest';
import { UserJson } from 'src/app/schemas/UserJson';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class UserService {

  public userUrlApi: string = environment.backLink + "/v1/users";
  

  constructor(private http: HttpClient) { }

  createUser(apodo: string, correo: string): Observable<any> {
    const params = new HttpParams().set('nickname',apodo).set('mail',correo)
    return this.http.post<any>(this.userUrlApi + "/create", null, {params:params});
  }
  
  getUser(correo:string):Observable<UserJson>{
    return  this.http.get<UserJson>(this.userUrlApi+"/"+correo);
  }

  getProfile(): Observable<any> {
    return this.http.get('https://graph.microsoft.com/v1.0/me');
  }

  getUserFriends(correo:string):Observable<[string]>{
    return  this.http.get<[string]>(this.userUrlApi+"/"+correo+"/friends");
  }

  getUserRooms(correo:string):Observable<[string]>{
    return this.http.get<[string]>(this.userUrlApi+"/"+correo+"/rooms")
  }

  addUserNewRoom(correo:string,code:string):Observable<any>{
    return this.getUserRooms(correo).pipe(
      mergeMap((rooms: string[]) => {
        rooms.push(code); // Agregar el nuevo código a la lista de salas
        return this.http.put<any>(`${this.userUrlApi}/${correo}/update-rooms`, rooms);
      })
    );
  }

  deleteUserRoom(correo: string, code: string): Observable<any> {
    return this.getUserRooms(correo).pipe(
      switchMap((rooms: string[]) => {
        const updatedRooms = rooms.filter(roomCode => roomCode !== code); // Filtrar el código a eliminar
        return this.http.put<any>(`${this.userUrlApi}/${correo}/update-rooms`, updatedRooms);
      })
    );
  }

  sendFriendRequest(correo: string, correoAmigo:string): Observable<any> {
    const params = new HttpParams().set('friendMail',correoAmigo)
    return this.http.put<any>(this.userUrlApi+"/"+correo+"/sendFriendRequest",null, {params:params});
  }

  getFriendRequestRecieved(correo:string):Observable<[FriendRequest]> {
    return this.http.get<[FriendRequest]>(this.userUrlApi+"/"+correo+"/ReceivedFriendRequestPending");
  }

  getFriendRequestSent(correo:string):Observable<[FriendRequest]> {
    return this.http.get<[FriendRequest]>(this.userUrlApi+"/"+correo+"/SendFriendRequestPending");
  }

  respondFriendReques(correo: string, correoAmigo:string,respuesta:string):Observable<any> {
    const params = new HttpParams().set('friendMail',correoAmigo).set('response',respuesta)
    return this.http.put<any>(this.userUrlApi+"/"+correo+"/ResponseFriendRequest",null, {params:params});
  }
}
