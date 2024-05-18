import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user/user.service';
import { ProfileType } from 'src/app/schemas/ProfileTypeJson';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { FriendRequest } from 'src/app/schemas/FriendRequest';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['../../../assets/style/main.css'],
})
export class FriendsComponent implements OnInit {
  socket = io(environment.socketLink);
  profile!: ProfileType;

  nickname!: string;
  friendMail: string = '';
  sentList: FriendRequest[] = [];
  receivedList: FriendRequest[] = [];
  showError: boolean = false;
  friends: string[] = [];
  mail!: string;
  user:any;

  constructor(
    private userService: UserService,
    private router: Router,
    private SAP: AppComponent
  ) {}

  ngOnInit(): void {
    this.socket = this.SAP.socket;
    this.user = {}; // Inicializar this.user
    if (localStorage.getItem('userMail')) {
      this.user.mail = localStorage.getItem('userMail');
      this.processUserData(this.user.mail);
    }
    this.socket.on('friendRequestReceived', (data) => {
      
      this.bringFriendRequestReceived(this.user.mail);
    });
    this.socket.on('friendRequestRespond', (data) => {
      if (data == 'accepted') {
        this.bringUserFriends(this.user.mail);
      }
      this.bringPendingSendFriendRequest(this.user.mail);
    });
  }

  processUserData(userEmail: string): void {
    this.bringUserInfo(userEmail);
    this.bringPendingSendFriendRequest(userEmail);
    this.bringFriendRequestReceived(userEmail);
    this.bringUserFriends(userEmail);
  }

  sendFriendRequest(correo: string) {
    if (correo == this.user.mail) {
      this.showError = true;
    } else {
      this.userService.sendFriendRequest(this.user.mail, correo).subscribe({
        next: () => {
          this.socket.emit('sendFriendRequest', {
            send: this.user.mail,
            reciever: correo,
          });
          this.showError = false;
          this.bringPendingSendFriendRequest(this.user.mail);
        },
        error: (error) => {
          console.error('Error al enviar la solicitud de amistad:', error);
          // Mostrar un mensaje de error al usuario
          this.showError = true;
        },
        complete: () => console.info('Send Friend Request complete'),
      });
    }
  }

  respondToFriendRequest(correo: string, respond: string) {
    this.userService
      .respondFriendReques(this.user.mail, correo, respond)
      .subscribe({
        next: () => {
          this.socket.emit('respondRequest', {
            reciever: this.user.mail,
            send: correo,
            respond: respond,
          });
          if (respond == 'accepted') {
            this.bringUserFriends(this.user.mail);
          }
          
          this.bringFriendRequestReceived(this.user.mail);
        },
        error: (error) => {
          console.error('Error al enviar la solicitud de amistad:', error);
          // Mostrar un mensaje de error al usuario
          this.showError = true;
        },
        complete: () => console.info('Respond To FriendRequest complete'),
      });
  }

  bringUserFriends(mail: string) {
    this.userService.getUserFriends(mail).subscribe({
      next: (response) => {
        this.friends = response;
      },
      error: (error) => console.log(error),
      complete: () => console.info('Traer Amigos completo'),
    });
  }

  bringUserInfo(mail: string) {
    this.userService.getUser(mail).subscribe({
      next: (response) => {
        this.user = response;
      },
      error: (error) => console.log(error),
      complete: () => console.info('Traer al usuario exitoso'),
    });
  }

  bringPendingSendFriendRequest(mail: string) {
    this.userService.getFriendRequestSent(mail).subscribe({
      next: (response) => {
        console.log(response);
        this.sentList = response;
      },
      error: (error) => console.log(error),
      complete: () =>
        console.info('Traer lista de solicitudes enviadas completado'),
    });
  }

  bringFriendRequestReceived(mail: string) {
    this.userService.getFriendRequestRecieved(mail).subscribe({
      next: (response) => {
        this.receivedList = response;
      },
      error: (error) => console.log(error),
      complete: () =>
        console.info('Traer lista de solicitudes recibidas completado'),
    });
  }
}
