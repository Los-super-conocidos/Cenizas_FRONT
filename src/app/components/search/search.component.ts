import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RoomsService } from 'src/app/services/rooms/rooms.service';
import { RoomJson } from 'src/app/schemas/RoomJson';
import { HttpClient } from '@angular/common/http';
import { ProfileType } from 'src/app/schemas/ProfileTypeJson';
import { UserJson } from 'src/app/schemas/UserJson';
import { UserService } from 'src/app/services/user/user.service';
import { RoomWithFriend } from 'src/app/schemas/RoomWithFriend';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css', '../../../assets/style/main.css'],
})
export class SearchComponent {
  codigoSala: string = '';
  server_name: string = '';
  roomsPublic: RoomJson[] = [];
  roomsFriends: RoomWithFriend[] = [];
  room: RoomJson | null = null;
  profile!: ProfileType;
  user: any;
  mail: any;
  friends: string[] = [];
  showError: boolean = false;

  constructor(
    private roomService: RoomsService,
    private router: Router,
    private http: HttpClient,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.http
      .get('https://graph.microsoft.com/v1.0/me')
      .subscribe((profile) => {
        this.profile = profile;
        this.mail = this.profile.mail;
        if (this.profile?.mail) {
          this.userService
            .getUser(this.profile.mail)
            .subscribe((user: UserJson) => {
              this.user = user;
              this.friends = this.user.friends;
              this.loadFriendRoom();
            });
        }
      });
    this.listRooms();
  }

  joinRoom(codigoSala: string) {
    this.roomService.getRoom(codigoSala).subscribe((room: RoomJson) => {
      this.room = room;
      this.mail = this.profile?.mail;
      if (this.room.online) {
        this.roomService
          .addUserToRoom(this.mail, codigoSala)
          .subscribe(() => {});
        this.router.navigate(['/lobby'], { queryParams: { code: codigoSala } });
      } else {
        this.showError = true;
      }
    });
  }

  listRooms() {
    this.roomService.getRooms().subscribe({
      next: (response) => {
        this.roomsPublic = response;
      },
      error: (error) => {
        console.error('Error al listar salas publicas:', error);
      },
      complete: () => console.info('Listar salas publica completo'),
    });
  }

  loadFriendRoom() {
    this.friends.forEach((friend) => {
      this.userService.getUserRooms(friend).subscribe({
        next: (response) => this.roomsFriend(response,friend),
        error: (error) => {
          console.error('Error al traer salas de amigos:', error);
        },
        complete: () =>
          console.info('Listar salas de amigos publicas completo'),
      });
    });
  }


  roomsFriend(list:[string],friend:string){
    list.forEach((room) => {
      this.roomService.getRoom(room).subscribe({
        next: (response) => {
          if (response.online) {
            const roomWithFriendInfo = { ...response, friend: friend };
            this.roomsFriends.push(roomWithFriendInfo);
          }
        },error: (error) => {
          console.error('Error al traer salas de amigo:', error);
        }
      });
    });
  }
}
